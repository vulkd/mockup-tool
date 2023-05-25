/** @module middleware/express-auth-local */
/** @external express */

const config = require('config');

const knex = require('../models');

const { limiterSlowBruteByIP, limiterConsecutiveFailsByUsernameAndIP } = require('./express-ratelimiterredis');
const { extractIPAddressFromReq, resolveError } = require('../util/expressHelpers');
const { comparePassword } = require('../util/auth');

const maxWrongAttemptsByIPperDay = 100;
const maxConsecutiveFailsByUsernameAndIP = 10;

function getRetrySecs(resSlowByIP, resUsernameAndIP) {
	let retrySecs = 0;
	if (resSlowByIP !== null && resSlowByIP.consumedPoints > maxWrongAttemptsByIPperDay) {
		retrySecs = Math.round(resSlowByIP.msBeforeNext / config.constants.time.SECOND_MS) || 1;
	} else if (resUsernameAndIP !== null && resUsernameAndIP.consumedPoints > maxConsecutiveFailsByUsernameAndIP) {
		retrySecs = Math.round(resUsernameAndIP.msBeforeNext / config.constants.time.SECOND_MS) || 1;
	}
	return retrySecs;
}

function isUserAuthorized(user, password) {
	if (!user) {
		throw new Error("Couldn't find user");
	}
	if (!comparePassword(user.password, String(password), user.password_salt)) {
		throw new Error("Passwords don't match");
	}
	return true;
}

module.exports.LocalStrategyMiddleware = async (req, res, next) => {
	// Rate limit username+IP
	// https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example#login-endpoint-protection

	const email = req.body.email ? req.body.email.trim().toLowerCase() : 'NO_EMAIL_';
	const ipAddr = JSON.stringify(extractIPAddressFromReq(req)).replace(/\:/g, '..');
	const redisKeyUsernameIp = `${email}_${ipAddr}`;

	const resSlowByIP = await limiterSlowBruteByIP.get(ipAddr);
	const resUsernameAndIP = await limiterConsecutiveFailsByUsernameAndIP.get(redisKeyUsernameIp);

	const retrySecs = getRetrySecs(resSlowByIP, resUsernameAndIP);
	if (retrySecs > 0) {
		res.set('Retry-After', String(retrySecs));
		resolveError(res, 429);
		return;
	}

	let user;

	try {
		const user = await knex('account_user')
			.first()
			.where({ email_lower: email });

		if (isUserAuthorized(user, req.body.password)) {
			// Reset on successful authorisation
			if (resUsernameAndIP !== null && resUsernameAndIP.consumedPoints > 0) {
				await limiterConsecutiveFailsByUsernameAndIP.delete(redisKeyUsernameIp);
			}

			await knex('account_user')
				.where({
					email_lower: email
				})
				.update({
					sign_in_count: user.sign_in_count + 1,
					current_sign_in_at: Date.now(),
					last_sign_in_at: user.current_sign_in_at || Date.now()
				});

			req.user = user; // eslint-disable-line no-atomic-updates

			next();
		}
	} catch (err) {
		res.clearCookie(config.COOKIE_ACCESS_TOKEN);
		res.clearCookie(config.COOKIE_REFRESH_TOKEN);

		try {
			const promises = [limiterSlowBruteByIP.consume(ipAddr)];
			if (user) {
				// Count failed attempts by Username + IP only for registered users
				promises.push(limiterConsecutiveFailsByUsernameAndIP.consume(redisKeyUsernameIp));
			}
			await Promise.all(promises);
			resolveError(res, 401);
		} catch (rlRejected) {
			if (rlRejected instanceof Error) {
				resolveError(res, 401);
				// throw rlRejected;
			} else {
				res.set('Retry-After', String(Math.round(rlRejected.msBeforeNext / config.constants.time.SECOND_MS)) || 1);
				resolveError(res, 429);
			}
		}
	}
};
