// Database
require("../init");

const chai = require("chai");
const expect = chai.expect;

const { compareTimesafe, generateToken, createB64Hash } = require("../../util/auth.js");

describe("auth.spec.js", () => {
	it("compareTimesafe()", (done) => {
		expect(compareTimesafe("abc", "abc")).to.equal(true);
		expect(compareTimesafe("abc", "a")).to.equal(false);
		expect(compareTimesafe("abc", "")).to.equal(false);
		done();
	});

	it("generateToken()", async () => {
		const token = await generateToken();
		expect(token.length).to.equal(48);
		expect(typeof token).to.equal("string");
		expect(["-", "_", "%", "^", "#", "$", "@", "!"].some((char) => token.includes(char))).to.equal(false);
	});

	// todo createB64Hash with null secret
	it("createB64Hash()", (done) => {
		const password = "passwordasdhasd";
		const passwordSecret = "passwashdordSecret";
		const b64str = createB64Hash(password, passwordSecret);
		expect(typeof b64str).to.equal("string");
		expect((/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/).test(b64str)).to.equal(true);
		const buf = Buffer.from(b64str, "base64");
		expect(buf.length).to.equal(128);
		done();
	});
});
