/** @module lib/auth */

const config = require('config');
const crypto = require('crypto');
const bcrypt = require('bcrypt-nodejs');

/**
 * @param {*} x
 * @param {*} y
 * @returns {Boolean}
 */
module.exports.compareTimesafe = (x, y) => {
	x = Buffer.from(x);
	y = Buffer.from(y);
	return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/**
 * @async
 * @returns {String}
 *
 * @todo https://paragonie.com/blog/2016/05/how-generate-secure-random-numbers-in-various-programming-languages#nodejs-csprng
 */
module.exports.generateToken = async () => {
	return await crypto.randomBytes(Math.ceil(48 / 2)).toString('hex').slice(0, 48); // eslint-disable-line no-magic-numbers
};

/**
 * @see https://paragonie.com/blog/2015/04/secure-authentication-php-with-long-term-persistence
 * @param {String} str
 * @param {String} secret
 * @returns {String}
 */
module.exports.createB64Hash = (str, secret) => {
	if (!secret) {
		throw new Error('Missing function paramter!');
	}
	const hash = crypto.createHmac('sha512', secret).update(str).digest('hex');
	const buf = Buffer.from(hash);
	return buf.toString('base64');
};

/**
 * @see https://paragonie.com/blog/2015/04/secure-authentication-php-with-long-term-persistence
 * @param {String} password
 * @returns {Object}
 */
module.exports.encryptPassword = (password) => {
	const b64str = module.exports.createB64Hash(password, config.PASSWORD_SECRET);
	const salt = bcrypt.genSaltSync(12); // eslint-disable-line no-magic-numbers
	password = bcrypt.hashSync(b64str, salt);
	return { salt, password };
};

/**
 * @param {String} encrypted
 * @param {String} plaintext
 * @param {String} salt
 * @returns {Boolean}
 */
module.exports.comparePassword = (encrypted, plaintext, salt) => {
	const b64str = module.exports.createB64Hash(plaintext, config.PASSWORD_SECRET);
	const plaintextEncrypted = bcrypt.hashSync(b64str, salt);
	return module.exports.compareTimesafe(encrypted, plaintextEncrypted);
};
