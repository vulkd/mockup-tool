require("../init");

// Chai
const chai = require("chai");
const expect = chai.expect;
const assert = chai.assert;

// Units to test
const {
	queryParamIsTrue,
	removeQueryParamFromURL,
	extractIPAddressFromReq,
	getResponseForHttpStatusCode
} = require("../../util/expressHelpers");

describe("expressHelpers.spec.js", () => {
	it("queryParamIsTrue()", (done) => {
		assert.equal(queryParamIsTrue(""), true);
		assert.equal(queryParamIsTrue("true"), true);
		assert.equal(queryParamIsTrue(null), false);
		assert.equal(queryParamIsTrue(true), false);
		assert.equal(queryParamIsTrue(false), false);
		assert.equal(queryParamIsTrue("false"), false);
		assert.equal(queryParamIsTrue(" "), false);
		assert.equal(queryParamIsTrue("asdasdkey"), false);
		done();
	});

	it("removeQueryParamFromURL()", (done) => {
		[
			"https://example.com/test?key=BANG&url=key=123",
			"https://example.com/test?key=BANG&url=key=123&img",
			"https://example.com/test?key=BANG&url=?key=123",
			"https://example.com/test?url=asdasdkey=",
			"https://example.com/test?url=asdasdkey=&key=BANG",
			"https://example.com/test?url=&key=BANG",
			"https://example.com/test?key=BANG",
			"https://example.com/test?key=BANG&z=",
			"https://example.com/test?key=BANG&",
			"https://example.com/test?key=BANG&img",
			"https://example.com/test?img&key=BANG",
			"https://example.com/test?img=1&key=BANG&b=2",
			"https://example.com/test?url=ajsdas?key=BANG",
			"https://example.com/test?key=BANG",
			"https://example.com/test?url=?key&key=BANG"
		].forEach((url) => {
			const urlWithParamRemoved = removeQueryParamFromURL(url, "key", "key=SECRET_KEY");
			expect(urlWithParamRemoved.includes("BANG")).to.equal(false);
		});
		expect(removeQueryParamFromURL("https://www.google.com/search?q=esoteric+URLs&oq=esoteric+URLs&aqs=chrome..69i57j69i59l3j69i60l2.2127j0j0&sourceid=chrome&ie=UTF-8", "aqs", "aqs=REPLACED").includes("chrome..69i57j69i59l3j69i60l2.2127j0j0")).to.equal(false);
		expect(removeQueryParamFromURL("https://example.com/test?z=1", "replaceMe", "replacement").includes("replacement")).to.equal(false);
		expect(removeQueryParamFromURL("https://example.com/test?url=asdakey=BANG", "key", "key=SECRET_KEY").includes("BANG")).to.equal(true);
		done();
	});

	it("extractIPAddressFromReq()", (done) => {
		// const _ = {
		// 	headers: {
		// 		"cf-connecting-ip": null,
		// 		"x-real-ip": null,
		// 		"x-forwarded-for": null
		// 	},
		// 	connection: {
		// 		remoteAddress: null,
		// 		socket: {
		// 			remoteAddress: null
		// 		}
		// 	},
		// 	socket: {
		// 		remoteAddress: null
		// 	},
		// 	ip: null
		// };

		let req;
		// cf ip not array
		req = { headers: { "x-real-ip": "test", "cf-connecting-ip": "127.0.0.1"} };
		assert.equal(extractIPAddressFromReq(req), "test");
		// cf ip cant be comapred as no remoteAddress
		req = { headers: { "x-real-ip": "test", "cf-connecting-ip": "127.0.0.1, 128.0.0.1"} };
		assert.equal(extractIPAddressFromReq(req), "test");
		// cf ip not a real cf ip
		req = { headers: { "x-real-ip": "test", "cf-connecting-ip": "127.0.0.1, 128.0.0.1"}, connection: { remoteAddress: "129.0.0.1" } };
		assert.equal(extractIPAddressFromReq(req), "test");
		// cf ip is a real cf ip
		req = { headers: { "x-real-ip": "test", "cf-connecting-ip": "127.0.0.1, 128.0.0.1"}, connection: { remoteAddress: "173.245.48.0/20" } };
		assert.equal(extractIPAddressFromReq(req), "127.0.0.1");

		req = { headers: {"x-real-ip": "test"} };
		assert.equal(extractIPAddressFromReq(req), "test");
		req = { headers: {"x-forwarded-for": "test"} };
		assert.equal(extractIPAddressFromReq(req), "test");
		req = { headers: {}, socket: {}, connection: {remoteAddress: "test"} };
		assert.equal(extractIPAddressFromReq(req), "test");
		req = { headers: {}, socket: {}, connection: {socket: {remoteAddress: "test"} }};
		assert.equal(extractIPAddressFromReq(req), "test");
		req = { headers: {}, socket: {remoteAddress: "test"}, connection: {socket: {}} };
		assert.equal(extractIPAddressFromReq(req), "test");
		req = { headers: {}, socket: {}, ip: "test", connection: { socket: {}} };
		assert.equal(extractIPAddressFromReq(req), "test");

		req = { headers: {"x-forwarded-for": "a", "x-real-ip": "b"} };
		assert.equal(extractIPAddressFromReq(req), "b");

		done();
	});

	// @todo
	// it("getResponseForHttpStatusCode()", (done) => {

	// });
});
