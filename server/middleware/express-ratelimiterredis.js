/** @external express */

// points = Maximum number of points can be consumed over duration
// duration = Every X seconds

const config = require('config');
const redis = config.REDIS_USE_MOCK ? require('redis-mock') : require('redis');
const { extractIPAddressFromReq, resolveError } = require('../util/expressHelpers');
const { RateLimiterRedis } = require('rate-limiter-flexible');

const client = redis.createClient({
	host: config.REDIS_URL || '127.0.0.1',
	port: config.REDIS_PORT,
	enable_offline_queue: config.REDIS_ENABLE_OFFLINE_QUEUE
});

client.on('error', (err) => {
	console.error('Redis error:', err);
});

client.on('reconnecting', () => {
	console.log('Redis reconnecting...');
});

const maxWrongAttemptsByIPperDay = 100;
const maxConsecutiveFailsByUsernameAndIP = 10;

// Block for 1 day if 100 wrong attempts per day
module.exports.limiterSlowBruteByIP = new RateLimiterRedis({
	storeClient: client,
	keyPrefix: 'limiter_login_fail_ip_per_day',
	points: maxWrongAttemptsByIPperDay,
	duration: config.constants.time.DAY_S,
	blockDuration: config.constants.time.DAY_S
});

// Store number for 30 days since first fail
// Block for 30 minutes
module.exports.limiterConsecutiveFailsByUsernameAndIP = new RateLimiterRedis({
	storeClient: client,
	keyPrefix: 'limiter_login_fail_consecutive_username_and_ip',
	points: maxConsecutiveFailsByUsernameAndIP,
	duration: config.constants.time.DAY_S * 30, // eslint-disable-line no-magic-numbers
	blockDuration: config.constants.time.HOUR_S / 2 // eslint-disable-line no-magic-numbers
});

// module.exports.limiterGenericAPI = new RateLimiterRedis({
//   storeClient: client,
//   keyPrefix: 'limiter_api_generic',
//   points: 120, // Number of points
//   duration: 60, // Per this many seconds
//   blockDuration: 60 * 60 * 24, // Block for this many seconds
// });

const limiterGeneric = new RateLimiterRedis({
	redis: client,
	keyPrefix: 'limiter_generic',
	points: config.LIMIT_GENERIC,
	duration: 10
});

module.exports.limiterGeneric = async (req, res, next) => {
	try {
		const key = extractIPAddressFromReq(req);
		await limiterGeneric.consume(JSON.stringify(key).replace(/:/gu, '..'));
		next();
	} catch (err) {
		// @todo logbot
		resolveError(res, 429);
	}
};

// Every 10 minutes, you can upload a maximum of 10, then you get blocked for 10 minutes
const limiterPublicUploads = new RateLimiterRedis({
	redis: client,
	keyPrefix: 'limiter_public_uploads',
	points: config.LIMIT_PUBLIC_UPLOADS,
	duration: config.constants.time.MINUTE_S * 10, // eslint-disable-line no-magic-numbers
	blockDuration: config.constants.time.MINUTE_S * 10 // eslint-disable-line no-magic-numbers
});

module.exports.limiterPublicUploads = async (req, res, next) => {
	try {
		const key = extractIPAddressFromReq(req);
		await limiterPublicUploads.consume(JSON.stringify(key).replace(/:/gu, '..'));
		next();
	} catch (err) {
		// @todo logbot
		resolveError(res, 429);
	}
};

