/** @module lib/expressHelpers */
/** @external express */

const config = require('config');
const _ = require('lodash');

const { logbot } = require('./logbot');
const httpStatusCodes = require('../util/httpStatusCodes.json');
const cloudflareIps = require('../util/cloudflareIps.json');
const { CLOUDFLARE_IPS_V4, CLOUDFLARE_IPS_V6 } = cloudflareIps;

/**
 * @param {express.Request} req
 * @returns {String}
 *
 * @todo https://stackoverflow.com/a/53819302/5262262
 */
module.exports.extractIPAddressFromReq = (req) => {
	if (req.headers['cf-connecting-ip'] && req.headers['cf-connecting-ip'].split(', ').length) {
		try {
			const remoteAddress = req.connection.remoteAddress|| req.socket.remoteAddress || req.connection.socket.remoteAddress;
			const isCloudflare = CLOUDFLARE_IPS_V4.includes(remoteAddress) || CLOUDFLARE_IPS_V6.includes(remoteAddress);
			if (isCloudflare) {
				return req.headers['cf-connecting-ip'].split(',')[0].trim();
			}
		} catch (err) {
			// eslint-disable-line no-empty
		}
	}

	let remoteAddr;
	if (req.headers['x-real-ip']) {
		remoteAddr = req.headers['x-real-ip'];
	} else if (req.headers['x-forwarded-for']) {
		remoteAddr = req.headers['x-forwarded-for'];
	} else if (req.connection && req.connection.remoteAddress) {
		remoteAddr = req.connection.remoteAddress;
	} else if (req.socket.remoteAddress) {
		remoteAddr = req.socket.remoteAddress;
	} else if (req.connection && req.connection.socket && req.connection.socket.remoteAddress) {
		remoteAddr = req.connection.socket.remoteAddress;
	} else if (req.ip) {
		remoteAddr = req.ip;
	} else {
		remoteAddr = null;
	}

	return remoteAddr;
};

/**
 * From https://stackoverflow.com/questions/26257568/remove-a-particular-query-string-from-url
 *
 * @param {String} url
 * @param {String} param
 * @param {String} replacement
 * @returns {String}
 */
module.exports.removeQueryParamFromURL = (url, param, replacement) => {
	const urlparts = url.split('?');

	if (urlparts.length >= 2) { // eslint-disable-line no-magic-numbers
		const prefix = `${encodeURIComponent(param)}=`;
		const parts = urlparts[1].split(/[&;]/gu);

		// Reverse iteration as may be destructive
		for (let i = parts.length; i-- > 0;) {
			if (parts[i].startsWith(prefix)) { // eslint-disable-line security/detect-object-injection
				if (replacement) {
					parts[i] = replacement; // eslint-disable-line security/detect-object-injection
				} else {
					parts.splice(i, 1);
				}
			}
		}
		url = `${urlparts[0]}?${parts.join('&')}`;
	}
	return url;
};

/**
 * @param {*} param
 * @returns {Boolean}
 */
module.exports.queryParamIsTrue = (param) => {
	return param === '' || param === 'true';
};

/**
 * @param {Number} statusCode
 * @returns {Boolean}
 */
module.exports.isValidHttpStatusCode = (statusCode) => {
	return config.APP_STATUS_CODES_ALLOWED.includes(statusCode) && !config.APP_STATUS_CODES_BANNED.includes(statusCode);
};

/**
 * @param {Number} statusCode
 * @returns {Object}
 *
 * @todo unit test and remove the "||" return
 */
module.exports.getHttpStatusCodeInfo = (statusCode) => {
	let statusInfo = httpStatusCodes[String(statusCode)];
	if (_.isArray(statusInfo)) {
		statusInfo = statusInfo.find((info) => info.standard && !info.deprecated);
	}
	return statusInfo || {statusCode: 500, message: 'Server Error'};
};

/**
 * Return an appropriate error message to the end user. Try and obscure server a
 * bit by returning codes that would be useful to a legitimate party.
 *
 * @param {Number} statusCode
 * @param {String|Object} [defaultMessage]
 * @param {Number} [defaultCode]
 * @returns {Object}
 */
module.exports.getResponseForHttpStatusCode = (statusCode, defaultMessage, defaultCode) => {
	const message = defaultMessage || '';

	if (module.exports.isValidHttpStatusCode(statusCode)) {
		const statusInfo = module.exports.getHttpStatusCodeInfo(statusCode);
		if (statusInfo) {
			return {statusCode: statusInfo.code, message: message || statusInfo.name};
		}
	}

	if (module.exports.isValidHttpStatusCode(defaultCode)) {
		if (message) {
			return {statusCode: defaultCode, message};
		}
		const statusInfo = module.exports.getHttpStatusCodeInfo(defaultCode);
		if (statusInfo) {
			return  {statusCode: statusInfo.code, message: statusInfo.name};
		}
	}

	return module.exports.getResponseForHttpStatusCode(500);
};

/**
 * Verify object from getResponseForHttpStatusCode()
 *
 * @param {Object} obj
 * @returns {Boolean}
 */
module.exports.isCustomResponseForHttpStatusCode = (obj) => {
	return typeof obj === 'object'
		&& JSON.stringify(Object.keys(obj)) === '["statusCode","message"]'
		&& module.exports.isValidHttpStatusCode(obj.statusCode);
};

/**
 * @param {express.Response} res
 * @param {Object} err
 * @returns {void}
 *
 * @todo linting rules to specify only res.sendStatus(200),res.status(200) outside of this func
 */
module.exports.resolveError = (res, err) => {
	if (typeof err === 'number') {
		const {statusCode, message} = module.exports.getResponseForHttpStatusCode(err);
		// logbot(err >= 500 ? config.LOGBOT_LVL_ERROR : config.LOGBOT_LVL_WARN, {
		// 	httpStatus: statusCode,
		// 	err: err.stack ? err.stack.split("\n").slice(0, 10).map((trace) => trace.trim()) : "Unknown"
		// });
		res.status(statusCode).json({message});
		return;
	}

	if (module.exports.isCustomResponseForHttpStatusCode(err)) {
		const {statusCode, message} = err;
		logbot(config.LOGBOT_LVL_WARN, {httpStatus: statusCode, message});
		res.status(err.statusCode).json({message});
		return;
	}

	const {statusCode, message} = module.exports.getResponseForHttpStatusCode(500);
	// logbot(config.LOGBOT_LVL_ERROR, {httpStatus: statusCode, err: err.stack ? err.stack.split("\n").slice(0, 10).map((trace) => trace.trim()) : "Unknown"});
	res.status(statusCode).json({message});
};
