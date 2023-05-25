/** @module middleware/express-auth-jwt */
/** @external express */

const config = require('config');
const jwt = require('jsonwebtoken');
const redisClient = require('../util/redisClient');

const { createB64Hash, compareTimesafe, generateToken } = require('../util/auth');
const { resolveError } = require('../util/expressHelpers');
const { logbot } = require('../util/logbot');

/**
 * @param {Object} opts
 * @returns {Object}
 */
const JwtSignAccessToken = (opts) => {
	return jwt.sign({
		iss: config.HOSTNAME,
		...opts
	}, config.JWT_SECRET, {
		algorithm: config.JWT_ALGORITHM
	});
};

/**
 * @param {Object} opts
 * @returns {Object}
 */
const JwtSignRefreshToken = (opts) => {
	return jwt.sign({
		iss: config.HOSTNAME,
		...opts
	}, config.JWT_REFRESH_SECRET, {
		algorithm: config.JWT_ALGORITHM
	});
};

/**
 * @param {String} token
 * @param {String} secret
 * @returns {Object}
 */
const JwtVerifyToken = (token, secret) => {
	return jwt.verify(token,
		secret, {
			issuer: config.HOSTNAME,
			algorithms: [config.JWT_ALGORITHM]
		});
};

/**
 * @async
 * @param {String} token
 * @param {String} secret
 * @returns {void}
 */
const JwtRevokeToken = async (token, secret) => {
	const payload = JwtVerifyToken(token, secret);
	const currentEpoch = Date.now();
	// Revoke token, and expire from Redis when the token itself is expired.
	try {
		await redisClient.setAsync(JSON.stringify(`jwt:revoked:${token}`), true, 'EX', payload.exp - currentEpoch);
	} catch (err) {
		console.log('REDIS ERR', err);
		// This shouldn't fail due to expiry time after testing (unless redis is down),
		// but just in case set the expiry time to the orig payload.exp if the above fails.
		try {
			const newExpiryTime = payload.exp
				? parseInt(payload.exp) > currentEpoch + config.JWT_REFRESH_EXPIRY
					? currentEpoch
					: payload.exp
				: currentEpoch;
			await redisClient.setAsync(JSON.stringify(`jwt:revoked:${token}`), true, 'EX', newExpiryTime);
		} catch (err) {
			logbot(config.LOGBOT_LVL_ERROR, 'redis failed revoking token');
		}
	}
};

/**
 * @async
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 * @returns {*}
 */
const JwtStrategyMiddleware = async (req, res, next) => {
	try {
		const currentEpoch = Date.now();

		// Verify JWT
		const jwtInCookie = req && req.cookies
			? req.cookies[config.COOKIE_ACCESS_TOKEN]
			: null;

		if (!jwtInCookie) {
			res.header('access-control-expose-headers', 'www-authenticate');
			res.set('www-authenticate', true);
			logbot(config.LOGBOT_LVL_WARN, 'jwt access token missing, sending www-authenticate', { stackTrace: false });
			resolveError(res, {
				statusCode: 401,
				message: 'token-missing'
			});
			return;
		}

		const payload = JwtVerifyToken(jwtInCookie, config.JWT_SECRET);

		// Check CSRF
		if (!req.headers['x-xsrf-token']) {
			logbot(config.LOGBOT_LVL_WARN, 'csrf token missing');
			resolveError(res, {
				statusCode: 401,
				message: 'xsrf-missing'
			});
			return;
		}

		// Check CSRF hash in JWT matches hashed CSRF token in header
		const hashedCsrfToken = createB64Hash(req.headers['x-xsrf-token'], config.CSRF_SECRET);
		if (!compareTimesafe(payload.csrf, hashedCsrfToken)) {
			logbot(config.LOGBOT_LVL_WARN, "csrf token doesn't match", { stackTrace: false });
			resolveError(res, {
				statusCode: 401,
				message: 'xsrf-mismatch'
			});
			return;
		}

		// Check if revoked
		const isRevoked = JSON.parse(await redisClient.getAsync(JSON.stringify(`jwt:revoked:${req.cookies[config.COOKIE_ACCESS_TOKEN]}`)));
		if (isRevoked) {
			res.clearCookie(config.COOKIE_ACCESS_TOKEN);
			logbot(config.LOGBOT_LVL_WARN, 'jwt access token revoked', { stackTrace: false });
			resolveError(res, 401);
			return;
		}

		// Check if expired
		if (currentEpoch > payload.exp) {
			res.header('access-control-expose-headers', 'www-authenticate');
			res.set('www-authenticate', true);
			res.clearCookie(config.COOKIE_ACCESS_TOKEN);
			logbot(config.LOGBOT_LVL_WARN, 'jwt access token expired, sending www-authenticate', { stackTrace: false });
			resolveError(res, 401);
			return;
		}

		req.jwt = payload;

		next();
	} catch (err) {
		res.clearCookie(config.COOKIE_ACCESS_TOKEN);
		logbot(config.LOGBOT_LVL_ERROR, err);
		resolveError(res, 401);
	}
};

/**
 * @async
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns {*}
 */
const JwtRefreshToken = async (req, res) => {
	try {
		const currentEpoch = Date.now();

		// Verify JWT
		const jwtInCookie = req && req.cookies
			? req.cookies[config.COOKIE_REFRESH_TOKEN]
			: null;

		if (!jwtInCookie) {
			logbot(config.LOGBOT_LVL_WARN, 'jwt refresh token missing');
			resolveError(res, 401);
			return;
		}

		const previousRefreshToken = JwtVerifyToken(jwtInCookie, config.JWT_REFRESH_SECRET);

		// Check if revoked
		const isRevoked = JSON.parse(await redisClient.getAsync(JSON.stringify(`jwt:revoked:${req.cookies[config.COOKIE_REFRESH_TOKEN]}`)));
		if (isRevoked) {
			res.clearCookie(config.COOKIE_REFRESH_TOKEN);
			logbot(config.LOGBOT_LVL_WARN, 'jwt refresh token revoked');
			resolveError(res, 401);
			return;
		}

		// Check if expired
		if (currentEpoch > previousRefreshToken.exp) {
			res.clearCookie(config.COOKIE_REFRESH_TOKEN);
			logbot(config.LOGBOT_LVL_WARN, 'jwt refresh token expired');
			resolveError(res, 401);
			return;
		}

		// Create new CSRF token
		const csrfToken = await generateToken(config.CSRF_LENGTH);
		const hashedCsrfToken = createB64Hash(csrfToken, config.CSRF_SECRET);

		// Create the JWT with sub from refresh token
		const accessToken = JwtSignAccessToken({
			sub: previousRefreshToken.sub,
			acc: previousRefreshToken.acc,
			csrf: hashedCsrfToken,
			iat: currentEpoch,
			exp: currentEpoch + config.JWT_EXPIRY
		});

		// Generate a new refresh token, with the same expiry as the original
		const refreshTokenExp = previousRefreshToken.exp;
		const refreshToken = JwtSignRefreshToken({
			sub: previousRefreshToken.sub,
			acc: previousRefreshToken.acc,
			iat: currentEpoch,
			exp: refreshTokenExp
		});

		// Revoke previous refreshs token
		JwtRevokeToken(req.cookies[config.COOKIE_REFRESH_TOKEN], config.JWT_REFRESH_SECRET);

		res.header('access-control-allow-credentials', 'true');
		res.header('access-control-expose-headers', 'x-xsrf-token, x-renew-at');
		res.header('x-xsrf-token', csrfToken);
		// Tell client to attempt token refresh JWT_REFRESH_PRE_EMPTIVE_DIST seconds before expiry
		res.header('x-renew-at', refreshTokenExp - config.JWT_REFRESH_PRE_EMPTIVE_DIST);

		const cookieOpts = {
			httpOnly: true,
			secure: config.USE_SECURE_COOKIES,
			sameSite: 'strict'
		};
		res.cookie(config.COOKIE_ACCESS_TOKEN, accessToken, cookieOpts);
		cookieOpts.maxAge = config.JWT_REFRESH_EXPIRY_LONGTERM;
		// cookieOpts.expires = new Date(previousRefreshToken.exp);
		res.cookie(config.COOKIE_REFRESH_TOKEN, refreshToken, cookieOpts);

		res.sendStatus(200);
	} catch (err) {
		res.clearCookie(config.COOKIE_REFRESH_TOKEN);
		res.clearCookie(config.COOKIE_ACCESS_TOKEN);
		logbot(config.LOGBOT_LVL_ERROR, err);
		resolveError(res, 500);
	}
};

/**
 * CSRF Protection explanation:
 * Generate a CSRF token. Send it once, in the request body. The client stores
 * using the WebStorage API and sends it as a header with every request. Also
 * send a hashed CSRF token in the JWT payload. With each request, the server
 * re-hashes the CSRF token in the header and compares it to the JWT's token.
 *
 * JWT's remain stateless this way.
 *
 * XSS can retrieve the CSRF token from LS, but the CSRF token in the user's
 * cookie will only be applicable to their session.
 *
 * https://stackoverflow.com/a/37922614/5262262
 * https://x-team.com/blog/my-experience-with-json-web-tokens/
 *
 * @async
 * @param {Object} user
 * @param {express.Response} res
 * @param {Boolean} rememberMe
 * @returns {void}
 */
const JwtResolveTokens = async (user, res, rememberMe) => {
	const currentEpoch = Date.now();

	const csrfToken = await generateToken(config.CSRF_LENGTH);
	const hashedCsrfToken = createB64Hash(csrfToken, config.CSRF_SECRET);

	const accessToken = JwtSignAccessToken({
		sub: user.id,
		acc: user.account_id,
		csrf: hashedCsrfToken,
		iat: currentEpoch,
		exp: currentEpoch + config.JWT_EXPIRY
	});

	const refreshTokenExp = rememberMe
		? currentEpoch + config.JWT_REFRESH_EXPIRY_LONGTERM
		: currentEpoch + config.JWT_REFRESH_EXPIRY;

	const refreshToken = JwtSignRefreshToken({
		sub: user.id,
		acc: user.account_id,
		iat: currentEpoch,
		exp: refreshTokenExp
	});

	const cookieOpts = {
		httpOnly: true,
		secure: config.USE_SECURE_COOKIES,
		sameSite: 'strict'
	};

	res.header('access-control-allow-credentials', 'true');
	res.header('access-control-expose-headers', 'x-xsrf-token, x-renew-at');
	res.header('x-xsrf-token', csrfToken);
	// Tell client to attempt token refresh JWT_REFRESH_PRE_EMPTIVE_DIST seconds before expiry
	res.header('x-renew-at', refreshTokenExp - config.JWT_REFRESH_PRE_EMPTIVE_DIST);

	res.cookie(config.COOKIE_ACCESS_TOKEN, accessToken, cookieOpts);
	if (rememberMe) {
		cookieOpts.maxAge = config.JWT_REFRESH_EXPIRY_LONGTERM;
		// cookieOpts.expires = new Date(currentEpoch + config.JWT_REFRESH_EXPIRY_LONGTERM);
	}
	res.cookie(config.COOKIE_REFRESH_TOKEN, refreshToken, cookieOpts);

	res.sendStatus(200);
};

/**
 * Basically for when the user changes their password
 *
 * @async
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {Object} user
 * @param {Number} [delay=0] - Amount of time to wait before revoking tokens. Useful if user changes password and quickly does something else before operation completes.
 * @returns {void}
 */
const JwtInvalidateAndReissueTokens = async (req, res, user, delay=0) => {
	const currentEpoch = Date.now();

	const csrfToken = await generateToken(config.CSRF_LENGTH);
	const hashedCsrfToken = createB64Hash(csrfToken, config.CSRF_SECRET);

	// Use sub from refresh token
	const accessToken = JwtSignAccessToken({
		sub: user.id,
		acc: user.account_id,
		csrf: hashedCsrfToken,
		iat: currentEpoch,
		exp: currentEpoch + config.JWT_EXPIRY
	});

	const previousRefreshToken = JwtVerifyToken(req.cookies[config.COOKIE_REFRESH_TOKEN], config.JWT_REFRESH_SECRET);

	// Create a new refresh token, with the same expiry
	const refreshTokenExp = previousRefreshToken.exp;
	const refreshToken = JwtSignRefreshToken({
		sub: user.id,
		acc: user.account_id,
		iat: currentEpoch,
		exp: refreshTokenExp
	});

	const cookieOpts = {
		httpOnly: true,
		secure: config.USE_SECURE_COOKIES,
		sameSite: 'strict'
	};

	// If rememberMe was ticked, adjust the cookie expiry times to the same as they were
	if (previousRefreshToken.exp - previousRefreshToken.iat < config.JWT_REFRESH_EXPIRY_LONGTERM) {
		cookieOpts.maxAge = config.JWT_REFRESH_EXPIRY_LONGTERM;
		// cookieOpts.expires = new Date(previousRefreshToken.exp);
	}

	setTimeout(() => {
		JwtRevokeToken(req.cookies[config.COOKIE_ACCESS_TOKEN], config.JWT_SECRET);
		JwtRevokeToken(req.cookies[config.COOKIE_REFRESH_TOKEN], config.JWT_REFRESH_SECRET);
	}, delay);

	res.header('access-control-allow-credentials', 'true');
	res.header('access-control-expose-headers', 'x-xsrf-token, x-renew-at');
	res.header('x-xsrf-token', csrfToken);
	// Tell client to attempt token refresh JWT_REFRESH_PRE_EMPTIVE_DIST seconds before expiry
	res.header('x-renew-at', refreshTokenExp - config.JWT_REFRESH_PRE_EMPTIVE_DIST);

	res.cookie(config.COOKIE_ACCESS_TOKEN, accessToken, {
		httpOnly: true,
		secure: config.USE_SECURE_COOKIES,
		sameSite: 'strict'
	});
	res.cookie(config.COOKIE_REFRESH_TOKEN, refreshToken, cookieOpts);
};

/**
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns {void}
 */
const JwtEatCookiesAndRevoke = (req, res) => {
	if (req.cookies[config.COOKIE_ACCESS_TOKEN]) {
		try {
			JwtRevokeToken(req.cookies[config.COOKIE_ACCESS_TOKEN], config.JWT_SECRET);
		} catch (err) {
			logbot(config.LOGBOT_LVL_WARN, 'JwtEatCookiesAndRevoke() failed to revoke access token');
		}
		try {
			res.clearCookie(config.COOKIE_ACCESS_TOKEN);
		} catch (err) {
			logbot(config.LOGBOT_LVL_WARN, 'JwtEatCookiesAndRevoke() failed to clear access token cookie');
		}
	}
	if (req.cookies[config.COOKIE_REFRESH_TOKEN]) {
		try {
			JwtRevokeToken(req.cookies[config.COOKIE_REFRESH_TOKEN], config.JWT_REFRESH_SECRET);
		} catch (err) {
			logbot(config.LOGBOT_LVL_WARN, 'JwtEatCookiesAndRevoke() failed to revoke refresh token');
		}
		try {
			res.clearCookie(config.COOKIE_REFRESH_TOKEN);
		} catch (err) {
			logbot(config.LOGBOT_LVL_WARN, 'JwtEatCookiesAndRevoke() failed to clear refresh token cookie');
		}
	}
};

module.exports = {
	JwtSignAccessToken,
	JwtSignRefreshToken,
	JwtVerifyToken,
	JwtRevokeToken,
	JwtStrategyMiddleware,
	JwtRefreshToken,
	JwtResolveTokens,
	JwtInvalidateAndReissueTokens,
	JwtEatCookiesAndRevoke
};
