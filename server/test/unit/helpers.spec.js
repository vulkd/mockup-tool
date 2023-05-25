require("../init");

// Chai
const chai = require("chai");
const expect = chai.expect;

// Required modules
const _ = require("lodash");

// Units to test
const {
	range,
	getDaysInMonth,
	countDigits,
	toBuffer,
	toArrayBuffer
} = require("../../util/helpers");

describe("helpers.spec.js", () => {
	// it("range()", (done) => {
	// 	// @todo
	// 	done();
	// });

	// it("countDigits()", (done) => {
	// 	// @todo
	// 	done();
	// });

	// it("getDaysInMonth()", (done) => {
	// 	// @todo
	// 	done();
	// });

	it("toBuffer()", (done) => {
		const abuf = new ArrayBuffer(2);
		expect(_.isArrayBuffer(abuf)).to.equal(true);
		expect(_.isBuffer(toBuffer(abuf))).to.equal(true);
		expect(_.isArrayBuffer(toBuffer(abuf))).to.equal(false);
		done();
	});

	it("toArrayBuffer()", (done) => {
		const buf = Buffer.from([1, 2]);
		expect(_.isBuffer(buf)).to.equal(true);
		expect(_.isArrayBuffer(toArrayBuffer(buf))).to.equal(true);
		expect(_.isBuffer(toArrayBuffer(buf))).to.equal(false);
		done();
	});
});
