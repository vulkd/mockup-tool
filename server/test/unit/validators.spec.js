const expect = require("chai").expect;

const {
	_separateUrlFromProtocol,
	_isIllegalUrl,
	_hasValidTld,
	_isValidIpAddress,
	isValidUsername,
	isValidEmail,
	isValidPassword,
	isValidUrl
} = require("../../util/validators");

describe("validators.spec.js Private Methods", () => {
	it("_separateUrlFromProtocol()", (done) => {
		done();
	});

	it("_isIllegalUrl()", (done) => {
		expect(_isIllegalUrl(`${process.env.HOSTNAME}`)).to.equal(true);
		expect(_isIllegalUrl(`www.${process.env.HOSTNAME}`)).to.equal(true);
		expect(_isIllegalUrl(`www.${process.env.HOSTNAME}/n8a7dhgas69d7bavs`)).to.equal(true);
		expect(_isIllegalUrl("0.0.0.1")).to.equal(true);
		expect(_isIllegalUrl("file://docs/f.respects")).to.equal(true);
		expect(_isIllegalUrl("~/asd")).to.equal(true);
		expect(_isIllegalUrl("~/asd.asd")).to.equal(true);
		expect(_isIllegalUrl("2130706433")).to.equal(true);
		expect(_isIllegalUrl("017700000001")).to.equal(true);
		expect(_isIllegalUrl("google.com")).to.equal(false);
		expect(_isIllegalUrl("http://google.com")).to.equal(false);
		expect(_isIllegalUrl("https://google.com")).to.equal(false);
		done();
	});

	it("_hasValidTld()", (done) => {
		expect(_hasValidTld("www.example.com")).to.equal(true);
		expect(_hasValidTld("www.example.com.au")).to.equal(true);
		expect(_hasValidTld("www.example.gov.au")).to.equal(true);
		expect(_hasValidTld("www.example.aq")).to.equal(true);
		expect(_hasValidTld("www.example.ajsdhjaksdasjdasdaskjdhasjkdajkshdasdajsdhjaksdasjdasdaskjdhasjkdajkshdasdajsdhjaksdasjdasdaskjdhasjkdajkshdasdajsdhjaksdasjdasdaskjdhasjkdajkshdasdajsdhjaksdasjdasdaskjdhasjkdajkshdasdajsdhjaksdasjdasdaskjdhasjkdajkshdasdakjsd")).to.equal(false);
		expect(_hasValidTld("www.example.comma")).to.equal(false);
		expect(_hasValidTld("www.example.ĉom")).to.equal(false);
		expect(_hasValidTld("www.example")).to.equal(false);
		expect(_hasValidTld("ajsdh.asdj12.123")).to.equal(false);
		expect(_hasValidTld("com.blah.invalid")).to.equal(false);
		expect(_hasValidTld("blah.com.blah.invalid")).to.equal(false);
		expect(_hasValidTld("wot")).to.equal(false);
		done();
	});

	it("_isValidIpAddress()", (done) => {
		expect(_isValidIpAddress("127.0.0.1")).to.equal(true);
		expect(_isValidIpAddress("123.123.123.123")).to.equal(true);
		expect(_isValidIpAddress("123123")).to.equal(false);
		expect(_isValidIpAddress("example.com")).to.equal(false);
		expect(_isValidIpAddress("123.231.123.342")).to.equal(false);
		expect(_isValidIpAddress("256.256.256.256")).to.equal(false);
		expect(_isValidIpAddress("12323.123.123.123.com")).to.equal(false);
		expect(_isValidIpAddress("1111111111")).to.equal(false);
		expect(_isValidIpAddress("10011010.00011111.00010000.00001101")).to.equal(false);
		done();
	});
});

describe("validators.spec.js", () => {
	it("isValidUsername()", (done) => {
		expect(isValidUsername("test")).to.equal(true);
		expect(isValidUsername("taskjdhajksdhaksjdajksdest")).to.equal(true);
		expect(isValidUsername("12o31h23jhk1")).to.equal(true);
		expect(isValidUsername("asd_")).to.equal(true);
		expect(isValidUsername("asd_123")).to.equal(true);
		expect(isValidUsername("asd.123")).to.equal(true);
		expect(isValidUsername("null")).to.equal(true);
		expect(isValidUsername("undefined")).to.equal(true);
		expect(isValidUsername("t")).to.equal(false);
		expect(isValidUsername("kjasdhjk@@akjsdhaj")).to.equal(false);
		expect(isValidUsername("@@@")).to.equal(false);
		expect(isValidUsername(null)).to.equal(false);
		expect(isValidUsername(0)).to.equal(false);
		expect(isValidUsername(123)).to.equal(false);
		expect(isValidUsername("")).to.equal(false);
		done();
	});

	it("isValidPassword()", (done) => {
		const bannedPassword = "10061989";
		expect(isValidPassword(bannedPassword)).to.equal(false);
		expect(isValidPassword("aalsdnaksnd")).to.equal(true);
		expect(isValidPassword("µ˚˙ß¨hakushdajh")).to.equal(true);
		expect(isValidPassword("asd alskdjhasd asd")).to.equal(true);
		expect(isValidPassword("")).to.equal(false);
		expect(isValidPassword("_")).to.equal(false);
		expect(isValidPassword("onetwo")).to.equal(false);
		expect(isValidPassword("password")).to.equal(false);
		expect(isValidPassword("sevense")).to.equal(false);
		expect(isValidPassword("eighteig")).to.equal(true);
		expect(isValidPassword(9187239812387)).to.equal(false);
		expect(isValidPassword(String(9187239812387))).to.equal(true);
		expect(isValidPassword(91872398121823719082361827361872391825316238387)).to.equal(false);
		expect(isValidPassword(String(91872398121823719082361827361872391825316238387))).to.equal(true);
		done();
	});

	it("isValidUrl()", (done) => {
		process.env.TESTING_ENABLE_URL_VALIDATION = true;

		expect(isValidUrl("http://localhost")).to.equal(false);
		expect(isValidUrl("https://localhost")).to.equal(false);
		expect(isValidUrl("abc://localhost")).to.equal(false);
		expect(isValidUrl("ftp://localhost")).to.equal(false);
		expect(isValidUrl("ftp://127.1")).to.equal(false);
		expect(isValidUrl("0.0.0.1")).to.equal(false);
		expect(isValidUrl("localhost")).to.equal(false);
		expect(isValidUrl("0.1.2.3")).to.equal(false);
		expect(isValidUrl("127.0.0.1")).to.equal(false);
		expect(isValidUrl("127.1")).to.equal(false);
		expect(isValidUrl("::1")).to.equal(false);
		expect(isValidUrl("0.0.0.0")).to.equal(false);
		expect(isValidUrl("254.254.254.254")).to.equal(false);
		expect(isValidUrl("192.168.")).to.equal(false);
		expect(isValidUrl("100:")).to.equal(false);
		expect(isValidUrl("192.168.")).to.equal(false);

		expect(isValidUrl("google.com")).to.equal(true);
		expect(isValidUrl("http://google.com")).to.equal(true);
		expect(isValidUrl("https://google.com")).to.equal(true);
		expect(isValidUrl("https://google.com.au")).to.equal(true);
		expect(isValidUrl("https://en.wikipedia.org/wiki/Reserved_IP_addresses")).to.equal(true);
		expect(isValidUrl("https://www.google.com/search?q=esoteric+URLs&oq=esoteric+URLs&aqs=chrome..69i57j69i59l3j69i60l2.2127j0j0&sourceid=chrome&ie=UTF-8")).to.equal(true);
		expect(isValidUrl("https://www.jstor.org/stable/pdf/23283480.pdf?seq=1#page_scan_tab_contents")).to.equal(true);
		done();
	});

	it("isValidEmail()", (done) => {
		const valid = [
			`email@example.com`,
			`firstname.lastname@example.com`,
			`email@subdomain.example.com`,
			`firstname+lastname@example.com`,
			// `email@123.123.123.123`,
			// `email@[123.123.123.123]`,
			// `"email"@example.com`,
			`1234567890@example.com`,
			`email@example-one.com`,
			`_______@example.com`,
			`email@example.name`,
			`email@example.museum`,
			`email@example.co.jp`,
			`firstname-lastname@example.com`
			// `much.”more\ unusual”@example.com`,
			// `very.unusual.”@”.unusual.com@example.com`,
			// `very.”(),:;<>[]”.VERY.”very@\\ "very”.unusual@strange.example.com`,
		];
		const invalid = [
			"",
			`@`,
			`@.`,
			`@@@...`,
			`plainaddress`,
			`#@%^%#$@#$@#.com`,
			`@example.com`,
			`Joe Smith <email@example.com>`,
			`email.example.com`,
			`email@example@example.com`,
			`.email@example.com`,
			`email.@example.com`,
			`email..email@example.com`,
			`あいうえお@example.com`,
			`email@example.com (Joe Smith)`,
			`email@example`,
			`email@-example.com`,
			// `email@example.web`, // validator.js isEmail doesn't capture this
			`email@111.222.333.44444`,
			`email@example..com`,
			`Abc..123@example.com`,
			`”(),:;<>[\\]@example.com`,
			`just”not”right@example.com`,
			`this\\ is"really"not\\allowed@example.com`
		];
		valid.forEach((emailAddress) => {
			expect(isValidEmail(emailAddress)).to.equal(true);
		});
		invalid.forEach((emailAddress) => {
			expect(isValidEmail(emailAddress)).to.equal(false);
		});

		process.env.TESTING_ENABLE_URL_VALIDATION = false;
		done();
	});
});
