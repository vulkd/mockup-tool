/* eslint-disable security/detect-object-injection */
/* eslint-disable no-magic-numbers */
/* eslint-disable quote-props */

// Modified file-type npm module.
// Type checks with lodash for consistency.

const _ = require('lodash');

/**
 * @param {Buffer} buf
 * @param {Array} header
 * @param {Object} opts
 * @returns {Boolean}
 */
function check(buf, header, opts) {
	opts = {offset: 0, ...opts};

	for (let i = 0; i < header.length; i++) {
		// If a bitmask is set
		if (opts.mask) {
			// If header doesn't equal `buf` with bits masked off
			if (header[i] !== (opts.mask[i] & buf[i + opts.offset])) { // eslint-disable-line no-bitwise
				return false;
			}
		} else if (header[i] !== buf[i + opts.offset]) {
			return false;
		}
	}

	return true;
}

/**
 * @param {String} str
 * @returns {Array}
 */
function stringToBytes(str) {
	return [...str].map((char) => char.charCodeAt(0));
}

module.exports.fileType = (input) => {
	if (!(_.isTypedArray(input) || _.isArrayBuffer(input) || _.isBuffer(input))) {
		throw new TypeError(`Expected the \`input\` argument to be of type \`Uint8Array\` or \`Buffer\` or \`ArrayBuffer\`, got \`${typeof input}\``);
	}

	const buf = _.isTypedArray(input) ? input : new Uint8Array(input);

	if (!(buf && buf.length > 1)) {
		return false;
	}

	if (check(buf, [0xFF, 0xD8, 0xFF])) {
		return {
			ext: 'jpg',
			mime: 'image/jpeg'
		};
	}

	if (check(buf, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) {
		// APNG format (https://wiki.mozilla.org/APNG_Specification)
		// 1. Find the first IDAT (image data) chunk (49 44 41 54)
		// 2. Check if there is an "acTL" chunk before the IDAT one (61 63 54 4C)

		// Offset calculated as follows:
		// - 8 bytes: PNG signature
		// - 4 (length) + 4 (chunk type) + 13 (chunk data) + 4 (CRC): IHDR chunk
		const startIndex = 33;
		const firstImageDataChunkIndex = buf.findIndex((el, i) => i >= startIndex && buf[i] === 0x49 && buf[i + 1] === 0x44 && buf[i + 2] === 0x41 && buf[i + 3] === 0x54);
		const sliced = buf.subarray(startIndex, firstImageDataChunkIndex);

		if (sliced.findIndex((el, i) => sliced[i] === 0x61 && sliced[i + 1] === 0x63 && sliced[i + 2] === 0x54 && sliced[i + 3] === 0x4C) >= 0) {
			return {
				ext: 'apng',
				mime: 'image/apng'
			};
		}

		return {
			ext: 'png',
			mime: 'image/png'
		};
	}

	if (check(buf, [0x47, 0x49, 0x46])) {
		return {
			ext: 'gif',
			mime: 'image/gif'
		};
	}

	if (check(buf, [0x57, 0x45, 0x42, 0x50], {offset: 8})) {
		return {
			ext: 'webp',
			mime: 'image/webp'
		};
	}

	if (check(buf, [0x46, 0x4C, 0x49, 0x46])) {
		return {
			ext: 'flif',
			mime: 'image/flif'
		};
	}

	// `cr2`, `orf`, and `arw` need to be before `tif` check
	if (
		(check(buf, [0x49, 0x49, 0x2A, 0x0]) || check(buf, [0x4D, 0x4D, 0x0, 0x2A]))
		&& check(buf, [0x43, 0x52], {offset: 8})
	) {
		return {
			ext: 'cr2',
			mime: 'image/x-canon-cr2'
		};
	}

	if (check(buf, [0x49, 0x49, 0x52, 0x4F, 0x08, 0x00, 0x00, 0x00, 0x18])) {
		return {
			ext: 'orf',
			mime: 'image/x-olympus-orf'
		};
	}

	if (
		check(buf, [0x49, 0x49, 0x2A, 0x00])
		&& (check(buf, [0x10, 0xFB, 0x86, 0x01], {offset: 4})
			|| check(buf, [0x08, 0x00, 0x00, 0x00, 0x13, 0x00], {offset: 4})
			|| check(buf, [0x08, 0x00, 0x00, 0x00, 0x12, 0x00], {offset: 4}))
	) {
		return {
			ext: 'arw',
			mime: 'image/x-sony-arw'
		};
	}

	if (
		check(buf, [0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00])
		&& (check(buf, [0x2D, 0x00, 0xFE, 0x00], {offset: 8})
			|| check(buf, [0x27, 0x00, 0xFE, 0x00], {offset: 8}))
	) {
		return {
			ext: 'dng',
			mime: 'image/x-adobe-dng'
		};
	}

	if (
		check(buf, [0x49, 0x49, 0x2A, 0x00])
		&& check(buf, [0x1C, 0x00, 0xFE, 0x00], {offset: 8})
	) {
		return {
			ext: 'nef',
			mime: 'image/x-nikon-nef'
		};
	}

	if (check(buf, [0x49, 0x49, 0x55, 0x00, 0x18, 0x00, 0x00, 0x00, 0x88, 0xE7, 0x74, 0xD8])) {
		return {
			ext: 'rw2',
			mime: 'image/x-panasonic-rw2'
		};
	}

	// `raf` is here just to keep all the raw image detectors together.
	if (check(buf, stringToBytes('FUJIFILMCCD-RAW'))) {
		return {
			ext: 'raf',
			mime: 'image/x-fujifilm-raf'
		};
	}

	if (
		check(buf, [0x49, 0x49, 0x2A, 0x0])
		|| check(buf, [0x4D, 0x4D, 0x0, 0x2A])
	) {
		return {
			ext: 'tif',
			mime: 'image/tiff'
		};
	}

	if (check(buf, [0x42, 0x4D])) {
		return {
			ext: 'bmp',
			mime: 'image/bmp'
		};
	}

	if (check(buf, [0x49, 0x49, 0xBC])) {
		return {
			ext: 'jxr',
			mime: 'image/vnd.ms-photo'
		};
	}

	if (check(buf, [0x38, 0x42, 0x50, 0x53])) {
		return {
			ext: 'psd',
			mime: 'image/vnd.adobe.photoshop'
		};
	}
};

/* eslint-disable no-underscore-dangle */
if (process.env.NODE_ENV === 'test') {
	module.exports._check = check;
	module.exports._stringToBytes = stringToBytes;
}
/* eslint-enable no-underscore-dangle */
