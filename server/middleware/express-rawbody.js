const config = require('config');
const bodyParser = require('body-parser');
const _ = require('lodash');

// const { toBuffer } = require("../util/helpers");
/**
 * Apparently faster than `return Buffer.from(new Uint8Array(abuf));`
 *
 * @see https://stackoverflow.com/questions/8609289/convert-a-binary-nodejs-buffer-to-javascript-arraybuffer
 * @param {arraybuffer} abuf
 * @returns {Buffer}
 */
const toBuffer = (abuf) => {
	if (!abuf.byteLength) {
		return abuf;
	}
	const buf = Buffer.alloc(abuf.byteLength);
	const view = new Uint8Array(abuf);
	for (let i = 0; i < buf.length; ++i) {
		buf[i] = view[i]; // eslint-disable-line security/detect-object-injection
	}
	return buf;
};

// @see https://stackoverflow.com/questions/9920208/expressjs-raw-body
module.exports.rawBodyParserMiddleware = bodyParser.raw({
	inflate: true,
	limit: config.APP_MAX_RAW_BODY_SIZE_IN_BYTES,
	verify(req, res, buf, encoding) {
		if (buf && buf.length) {
			req.rawBody = buf.toString(encoding || 'utf8');
		}
	},
	// type: "image/jpeg",
	type() {
		return true;
	}
});

module.exports.validateRawBody = (rawBody) => {
	try {
		const buf = toBuffer(rawBody);
		return buf && _.isBuffer(buf) ? buf : false;
	} catch (err) {
		console.log(err);
		return false;
	}
};
