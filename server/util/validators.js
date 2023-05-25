/** @module lib/validators */

require("dotenv").config({ path: ".env" });
const env = process.env.NODE_ENV;
const config = require("config");

const ipRegex = require("ip-regex");
const punycode = require("punycode/");
const stringz = require("stringz");
const { isEmail } = require("validator");

const bannedPasswords = require("../util/bannedPasswords");
const validTlds = require("../util/validTlds");
const { range } = require("../util/helpers");

/* eslint-disable no-magic-numbers */
let ILLEGAL_URLS = [];
ILLEGAL_URLS.push(process.env.HOSTNAME, `www.${process.env.HOSTNAME}`);
ILLEGAL_URLS.push(".", "file://", "/", "~", "@", "[", "localhost");
ILLEGAL_URLS.push("2130706433", "017700000001");
ILLEGAL_URLS.push("0.", "10.0", "127.", "169.254", "192.0.0", "192.0.2", "192.168.", "192.18", "192.19", "198.51.100", "203.0.113", "254.254.254.254", "255.255.255.255");
// 100.64.0.0–100.127.255.255:
ILLEGAL_URLS = ILLEGAL_URLS.concat(range(64, 128, 1).map((i) => `100.${i}`));
// 172.16.0.0–172.31.255.255:
ILLEGAL_URLS = ILLEGAL_URLS.concat(range(16, 32, 1).map((i) => `172.${i}`));
// @todo use a hexadecimal range() function to push all invalid ipv6 addresses
ILLEGAL_URLS.push("::1", "100::", "::ffff:", "2001:db8:", "0000:0000:0000:0000:0000:0000:0000:0001");
/* eslint-enable no-magic-numbers */

// Regex to test for a valid domain name.
const RGX_VALID_DOMAIN = /\b((?=[a-z0-9-]{1,63}\.)(xn--)?[a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}\b/u;
// Regex to extract protocol from URI.
const RGX_URI_PROTOCOL = /(^\w+:|^)\/\//u;

/**
 * @param {Object} dateObject - javascript Date object
 */
module.exports.isValidDateObject = (dateObject) => {
  return dateObject instanceof Date && !isNaN(dateObject);
}

/**
 * a-z, 0-9, _-. (No unicode allowed)
 *
 * @param {String} username
 * @returns {boolean}
 */
module.exports.isValidUsername = (username) => {
	try {
		return (/^[0-9A-Za-z_.-]+$/u).test(String(username))
			&& typeof username === "string"
			&& username.length >= config.constants.MIN_USERNAME_LENGTH;
	} catch {
		return false;
	}
};

/**
 * Using validator.js due to potential for regex backtracking, time errors,
 * and running this validator twice (ie on route handler and model field validation).
 * not implemented: http://www.ex-parrot.com/pdw/Mail-RFC822-Address.html
 * https://tylermcginnis.com/validate-email-address-javascript/
 * const emailRgxSimple = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 * const emailRgxRails = /^([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})$/i;
 * https://stackoverflow.com/questions/52456065/how-to-format-and-validate-email-node-js/52456632
 * const emailRgxAngular = /^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+(\.[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/;
 * http://www.w3.org/TR/html5/forms.html#valid-e-mail-address
 * const emailRgx = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
 * const isValid = hasValidTLD(email) && emailRgxSimple.test(email) && emailRgxRails.test(email) && emailRgxAngular.test(email) && emailRgx.test(email);
 * return isValid ? null : errorMessage;
 *
 * @param {String} email
 * @returns {boolean}
 */
module.exports.isValidEmail = (email) => {
	try {
		const hasValidTld = validTlds.some((tld) => {
			return tld.toLowerCase() === email
				.split(".")
				.slice(-1)[0]
				.toLowerCase();
		});

		return typeof email === "string"
			&& email.length >= config.constants.MIN_EMAIL_LENGTH
			&& email.length <= config.constants.MAX_EMAIL_LENGTH
			&& hasValidTld
			&& isEmail(email, {allow_utf8_local_part: false});
	} catch {
		return false;
	}
};

/**
 * @param {String} password
 * @returns {boolean}
 */
module.exports.isValidPassword = (password) => {
	try {
		const passwordLength = stringz.length(password.normalize("NFKC"));
		return typeof password === "string"
			&& passwordLength >= config.constants.MIN_PASSWORD_LENGTH
			&& passwordLength < config.constants.MAX_PASSWORD_LENGTH
			&& !bannedPasswords.includes(password.toLowerCase());
	} catch {
		return false;
	}
};

/**
 * @see https://en.wikipedia.org/wiki/Reserved_IP_addresses
 * @param {String} url
 * @returns {boolean}
 *
 * @todo 414 error request uri too long
 */
module.exports.isValidUrl = (url) => {
	try {
		// Environment check to test this function and enable it's usage successfully in a dev environment.
		if ((process.env.TESTING_ENABLE_URL_VALIDATION !== "true") && (env === "test" || env === "development")) {
			return true;
		}

		// Check for minimum URL length (try-catch returns false if length check fails due to eg; url not being string)
		if (!url || url.length < config.constants.MIN_URL_LENGTH) {
			return false;
		}

		// Ensure url is string.
		url = String(url);

		const { protocol, urlWithProtocolRemoved } = separateUrlFromProtocol(url);

		if (isIllegalUrl(urlWithProtocolRemoved)) {
			return false;
		}

		// Check if valid TLD and valid domain.
		if (hasValidTld(urlWithProtocolRemoved) && (RGX_VALID_DOMAIN.test(`${protocol}${urlWithProtocolRemoved}`) || RGX_VALID_DOMAIN.test(punycode.toASCII(`${protocol}${urlWithProtocolRemoved}`)))) {
			return true;
		}

		// Check if URL is a valid IP address in a last-ditch attempt to validate the user's request.
		return isValidIpAddress(urlWithProtocolRemoved);
	} catch (err) {
		return false;
	}
};

/**
 * Figure out what protocol to use (ie; did user supply http://example.com or example.com???).
 * Defaults to "https://" if no protocol can be established.
 *
 * @param {String} url
 * @returns {object}
 */
function separateUrlFromProtocol(url) {
	for (const protocol of ["http://", "https://", "ftp://"]) {
		if (url.startsWith(protocol)) {
			return {
				protocol,
				urlWithProtocolRemoved: url.replace(RGX_URI_PROTOCOL, "")
			}
		}
	}

	return {
		protocol: "https://",
		urlWithProtocolRemoved: url
	}
}

/**
 * Check for eg localhost, restricted subnets, etc.
 *
 * @param {String} url
 * @returns {boolean}
 */
function isIllegalUrl(url) {
	return ILLEGAL_URLS.some((invalidUrlStr) => url.startsWith(invalidUrlStr));
}

/**
 * @param {String} url
 * @returns {boolean}
 */
function hasValidTld(url) {
	try {
		const tld = url.toLowerCase().split("/")[0].split(".").slice(-1)[0].toLowerCase();
		return validTlds.some((validTld) => validTld === tld);
	} catch {
		return false;
	}
}

/**
 * @param {String} url
 * @returns {boolean}
 */
function isValidIpAddress(url) {
	url = url.split("/")[0];
	return ipRegex({exact: true}).test(url) || ipRegex.v6({exact: true}).test(url);
}

/* eslint-disable no-underscore-dangle */
if (process.env.NODE_ENV === "test") {
	module.exports._hasValidTld = hasValidTld;
	module.exports._separateUrlFromProtocol = separateUrlFromProtocol;
	module.exports._isValidIpAddress = isValidIpAddress;
	module.exports._isIllegalUrl = isIllegalUrl;
}
/* eslint-enable no-underscore-dangle */
