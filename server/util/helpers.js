/**
 * Faster than Math.ceil((to - from) / step) + 1 ... .fill()
 *
 * @see https://stackoverflow.com/questions/3895478/does-javascript-have-a-method-like-range-to-generate-a-range-within-the-supp
 * @param {Number} from
 * @param {Number} to
 * @param {Number} [step=1]
 * @returns {array<Number>}
 */
module.exports.range = (from, to, step=1) => {
	return Array(Math.ceil((to - from) / step))
		.fill(from)
		.map((v, idx) => v + (idx * step));
};

/**
 * Apparently faster than `return Buffer.from(new Uint8Array(abuf));`
 *
 * @see https://stackoverflow.com/questions/8609289/convert-a-binary-nodejs-buffer-to-javascript-arraybuffer
 * @param {arraybuffer} abuf
 * @returns {Buffer}
 */
module.exports.toBuffer = (abuf) => {
	const buf = Buffer.alloc(abuf.byteLength);
	const view = new Uint8Array(abuf);
	for (let i = 0; i < buf.length; ++i) {
		buf[i] = view[i]; // eslint-disable-line security/detect-object-injection
	}
	return buf;
};

/**
 * @see https://stackoverflow.com/questions/8609289/convert-a-binary-nodejs-buffer-to-javascript-arraybuffer
 * @param {Buffer} buf
 * @returns {arraybuffer}
 */
module.exports.toArrayBuffer = (buf) => {
	const arrayBuffer = new ArrayBuffer(buf.length);
	const view = new Uint8Array(arrayBuffer);
	for (let i = 0; i < buf.length; ++i) {
		view[i] = buf[i]; // eslint-disable-line security/detect-object-injection
	}
	return arrayBuffer;
};

/**
 * @see https://stackoverflow.com/questions/14879691/get-number-of-digits-with-javascript/28203456#28203456
 * @param {Number} num
 * @returns {Number}
 */
module.exports.countDigits = (num) => {
	return (Math.log10((num ^ (num >> 31)) - (num >> 31)) | 0) + 1; // eslint-disable-line no-bitwise, no-magic-numbers
};

/**
 * @param {Number} year
 * @param {Number} month
 * @returns {Number}
 */
module.exports.getDaysInMonth = (year, month) => {
	return new Date(year, month, 0).getDate();
};
