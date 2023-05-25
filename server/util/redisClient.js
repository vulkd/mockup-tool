const config = require('config');
const redis = config.REDIS_USE_MOCK ? require('redis-mock') : require('redis');
const { promisify } = require('util');

const client = redis.createClient({
	host: config.REDIS_URL || '127.0.0.1',
	port: config.REDIS_PORT,
	enable_offline_queue: config.REDIS_ENABLE_OFFLINE_QUEUE
});

// client.on("ready", () => {
// 	console.log(process.pid, "- Redis ready!");
// });

client.on('error', (err) => {
	console.error(process.pid, '- Redis error:', err);
});

client.on('reconnecting', () => {
	console.log(process.pid, '- Redis reconnecting...');
});

module.exports = {
	...client,
	getAsync: promisify(client.get).bind(client),
	setAsync: promisify(client.set).bind(client),
	keysAsync: promisify(client.keys).bind(client),
	delAsync: promisify(client.del).bind(client)
};
