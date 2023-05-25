const config = require('config');
const { logbot } = require('../util/logbot');
const { extractIPAddressFromReq } = require('../util/expressHelpers');

module.exports.hiddenInputMiddleware = (req, res, next) => {
	if (req.method === 'POST' && req.body.firstName && req.body.firstName.length) {
		let reqIp;
		try {
			reqIp = extractIPAddressFromReq(req);
		} catch (error) {
			reqIp = '(error extracting ip address)';
		}
		logbot(config.LOGBOT_LVL_SPECIAL, `${req.url.substr(0, 32)} hidden input field filled by ${reqIp}`);
		res.sendStatus(422);
		return;
	}

	next();
};
