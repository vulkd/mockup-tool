// https://github.com/yagop/node-telegram-bot-api/issues/540
process.env.NTBA_FIX_319 = 1;

const config = require('config');
const TelegramBot = require('node-telegram-bot-api');
const { fromUnixTime } = require('date-fns');

// if (config.APP_USE_CLUSTER) {
// 	const cluster = require("cluster");

// 	if (cluster.isMaster) {
// 		cluster.on("message", (worker, message) => {
// 			if (message && message.type === "logbot" && message.message) {
// 			}
// 			console.log("cluster.on.message");
// 			console.log(message);
// 		});
// 	} else {
// 		worker.send("logbot");
// 	}

let bot;
if (process.env.NODE_ENV === 'production') {
	bot = new TelegramBot(config.TELEGRAM_TOKEN, {polling: true});
	bot.on('message', (msg) => {
		if (msg.chat.id !== config.TELEGRAM_CHAT_ID) {
			return;
		}
	});
}

// @todo use pino

// function sanitizeLog(log) {
// @todo look for key-length / key-like strings (@see eslint plugin rules, etc)
// }

module.exports.logbot = (lvl, log, opts={}) => {
	const currentEpoch = Date.now();
	const logFormat = { lvl, time: currentEpoch, data: log };

	if (opts.stackTrace !== false) {
		logFormat.stackTrace = new Error().stack
			.split('\n')
			.slice(0, 20) // eslint-disable-line no-magic-numbers
			.map((trace) => trace.trim());
	}

	// Handle every log level
	if (process.env.NODE_ENV !== 'test') {
		console.log('logbot', logFormat);
	}

	// Handle SPECIAL log level
	if (process.env.NODE_ENV === 'production' && lvl === config.LOGBOT_LVL_SPECIAL) {
		if (config.LOGBOT_USE_TELEGRAM) {
			try {
				const msgTime = fromUnixTime(currentEpoch);
				const msgData = String(JSON.stringify(log)).length > 999 // eslint-disable-line no-magic-numbers
					? `${String(JSON.stringify(log)).substring(0, 999)}...` // eslint-disable-line no-magic-numbers
					: String(JSON.stringify(log));
				const msg = `LOGBOT: ${msgTime}: ${msgData}`;
				bot.sendMessage(config.TELEGRAM_CHAT_ID, msg);
			} catch (error) {
				console.log(error);
			}
		}
	}
};
