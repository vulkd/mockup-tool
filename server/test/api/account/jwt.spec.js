require("../../init");
const { deleteAllUsers } = require("../../init");

// Chai
const chai = require("chai");
const chaiHttp = require("chai-http");
const expect = chai.expect;
chai.use(chaiHttp);

// Required modules
const config = require("config");

// Other
const redisClient = require("../../../util/redisClient");
const { JwtRevokeToken } = require("../../../middleware/express-auth-jwt");
const { AccountUser } = require("../../../models");

const getCookie = (res, cookieName) => res.headers["set-cookie"] ? res.headers["set-cookie"].find((cookie) => cookie.substring(0, cookieName.length) === cookieName) : null;

const TESTACCOUNT = { email: "accountTest@example.com", password: "thisismypassword" };
const API_URL = "http://127.0.0.1:5001"; // @todo use an env var

let agent = chai.request.agent(API_URL);

async function loginUser(opts) {
	const res = await agent.post("/signin").send({ ...TESTACCOUNT, ...opts });
	expect(res).to.have.status(200);
	expect(agent).to.have.cookie(config.COOKIE_ACCESS_TOKEN);
	expect(agent).to.have.cookie(config.COOKIE_REFRESH_TOKEN);
	expect(res.headers["set-cookie"][1].includes("Max-Age=")).to.equal(!!(opts && opts.remember_me));
	expect(res.headers["set-cookie"][1].includes("Expires=")).to.equal(!!(opts && opts.remember_me));
	expect(res.headers).to.have.property("x-xsrf-token");
	return res;
}

describe("jwt.spec.js", () => {
	let res, xsrfToken, accessToken, refreshToken;

	beforeEach(async () => {
		agent = chai.request.agent(API_URL);
		await deleteAllUsers({ usersOnly: true });
		await AccountUser.create({ email: TESTACCOUNT.email, email_lower: TESTACCOUNT.email.toLowerCase(), password: TESTACCOUNT.password });
		res = await loginUser();
		xsrfToken = res.headers["x-xsrf-token"];
		accessToken = getCookie(res, config.COOKIE_ACCESS_TOKEN).split("=")[1].split("; ")[0];
		refreshToken = getCookie(res, config.COOKIE_REFRESH_TOKEN).split("=")[1].split("; ")[0];
	});

	after(async () => await agent.close());

	it("should return 401 for expired access token (with www-authenticate header)", (done) => {
		setTimeout(async () => {
			try {
				res = await agent.get("/account").set({"x-xsrf-token": xsrfToken});
				expect(res).to.have.status(401);
				expect(agent).to.not.have.cookie(config.COOKIE_ACCESS_TOKEN);
				expect(agent).to.have.cookie(config.COOKIE_REFRESH_TOKEN);
				expect(res.headers).to.have.own.property("www-authenticate");
				expect(res.headers).to.not.have.own.property("x-xsrf-token");

				done();
			} catch (error) {
				done(error);
			}
		}, config.JWT_EXPIRY);
	});

	it("should return 401 for expired refresh token", (done) => {
		setTimeout(async () => {
			try {
				res = await agent.get("/account").set({"x-xsrf-token": xsrfToken})
				expect(res).to.have.status(401);
				expect(agent).to.not.have.cookie(config.COOKIE_ACCESS_TOKEN);
				expect(agent).to.have.cookie(config.COOKIE_REFRESH_TOKEN);
				expect(res.headers).to.have.own.property("www-authenticate");
				expect(res.headers).to.not.have.own.property("x-xsrf-token");

				res = await agent.post("/refreshtoken").set({"x-xsrf-token": xsrfToken})
				expect(res).to.have.status(401);
				expect(agent).to.not.have.cookie(config.COOKIE_ACCESS_TOKEN);
				expect(agent).to.not.have.cookie(config.COOKIE_REFRESH_TOKEN);
				expect(res.headers).to.not.have.own.property("www-authenticate");
				expect(res.headers).to.not.have.own.property("x-xsrf-token");

				done();
			} catch (error) {
				done(error);
			}
		}, config.JWT_REFRESH_EXPIRY);
	});

	it("should refresh token", (done) => {
		setTimeout(async () => {
			try {
				// recieve request to refresh token
				res = await agent.get("/account").set({"x-xsrf-token": xsrfToken});
				expect(res.headers).to.have.own.property("www-authenticate");

				// refresh the token
				res = await agent.post("/refreshtoken").set({"x-xsrf-token": xsrfToken});
				expect(res).to.have.status(200);
				expect(agent).to.have.cookie(config.COOKIE_ACCESS_TOKEN);
				expect(agent).to.have.cookie(config.COOKIE_REFRESH_TOKEN);
				expect(res.headers).to.not.have.own.property("www-authenticate");
				expect(res.headers).to.have.own.property("x-xsrf-token");
				xsrfToken = res.headers["x-xsrf-token"];
				let oldAccessToken = accessToken;
				accessToken = getCookie(res, config.COOKIE_ACCESS_TOKEN).split("=")[1].split("; ")[0];
				expect(accessToken).to.not.equal(oldAccessToken);

				// it should access protected account route after refreshing token
				res = await agent.get("/account").set({"x-xsrf-token": xsrfToken});
				expect(res).to.have.status(200);
				expect(agent).to.have.cookie(config.COOKIE_ACCESS_TOKEN);
				expect(agent).to.have.cookie(config.COOKIE_REFRESH_TOKEN);
				expect(res.headers).to.not.have.own.property("www-authenticate");
				expect(res.headers).to.not.have.own.property("x-xsrf-token");

				done();
			} catch (error) {
				done(error);
			}
		}, config.JWT_EXPIRY);
	});

	it("should store revoked access token in redis", (done) => {
		JwtRevokeToken(accessToken, config.JWT_SECRET);
		// wait 10 for redis
		setTimeout(async () => {
			try {
				const key = JSON.stringify(`jwt:revoked:${accessToken}`);
				const entry = JSON.parse(await redisClient.getAsync(key));
				expect(entry).to.equal(true);

				done();
			} catch (error) {
				done(error);
			}
		}, 10);
	});

	it("should store revoked refresh token in redis", (done) => {
		JwtRevokeToken(refreshToken, config.JWT_REFRESH_SECRET);
		// wait 10 for redis
		setTimeout(async () => {
			try {
				const key = JSON.stringify(`jwt:revoked:${refreshToken}`);
				const entry = JSON.parse(await redisClient.getAsync(key));
				expect(entry).to.equal(true);
				done();
			} catch (error) {
				done(error);
			}
		}, 10);
	});

	it("should return 401 on revoked access token found in redis", (done) => {
		JwtRevokeToken(accessToken, config.JWT_SECRET);
		// wait 10 for redis
		setTimeout(async () => {
			try {
				// return 401 on revoked access token and request refresh
				res = await agent.get("/account").set({"x-xsrf-token": xsrfToken});
				expect(res).to.have.status(401);
				expect(agent).to.not.have.cookie(config.COOKIE_ACCESS_TOKEN);
				expect(agent).to.have.cookie(config.COOKIE_REFRESH_TOKEN);
				expect(res.headers).to.not.have.own.property("www-authenticate");
				expect(res.headers).to.not.have.own.property("x-xsrf-token");

				// it should fetch a new access token via refresh token
				res = await agent.post("/refreshtoken").set({ "x-xsrf-token": xsrfToken });
				expect(res).to.have.status(200);
				expect(agent).to.have.cookie(config.COOKIE_ACCESS_TOKEN);
				expect(agent).to.have.cookie(config.COOKIE_REFRESH_TOKEN);
				expect(res.headers).to.not.have.own.property("www-authenticate");
				expect(res.headers).to.have.own.property("x-xsrf-token");
				xsrfToken = res.headers["x-xsrf-token"];
				let oldAccessToken = accessToken;
				accessToken = getCookie(res, config.COOKIE_ACCESS_TOKEN).split("=")[1].split("; ")[0];
				expect(accessToken).to.not.equal(oldAccessToken);

				// it should access protected account route after refreshing token
				res = await agent.get("/account").set({ "x-xsrf-token": xsrfToken });
				expect(res).to.have.status(200);
				expect(agent).to.have.cookie(config.COOKIE_ACCESS_TOKEN);
				expect(agent).to.have.cookie(config.COOKIE_REFRESH_TOKEN);
				expect(res.headers).to.not.have.own.property("x-xsrf-token");

				done();
			} catch (error) {
				done(error);
			}
		}, 10);
	});

	it("should return 401 on revoked refresh token found in redis", (done) => {
		JwtRevokeToken(refreshToken, config.JWT_REFRESH_SECRET);

		// res = await agent.get("/account").set({"x-xsrf-token": xsrfToken});
		// 	expect(res).to.have.status(200);

		// wait 10 for redis
		setTimeout(async () => {
			try {
				// return 401 on expired access token and request refresh
				res = await agent.get("/account").set({ "x-xsrf-token": xsrfToken });
				expect(res).to.have.status(401);
				expect(agent).to.not.have.cookie(config.COOKIE_ACCESS_TOKEN);
				expect(agent).to.have.cookie(config.COOKIE_REFRESH_TOKEN);
				expect(res.headers).to.have.own.property("www-authenticate");
				expect(res.headers).to.not.have.own.property("x-xsrf-token");

				// should reject refresh attempt and remove all cookies
				res = await agent.post("/refreshtoken").set({ "x-xsrf-token": xsrfToken });
				expect(res).to.have.status(401);
				expect(agent).to.not.have.cookie(config.COOKIE_ACCESS_TOKEN);
				expect(agent).to.not.have.cookie(config.COOKIE_REFRESH_TOKEN);
				expect(res.headers).to.not.have.own.property("www-authenticate");
				expect(res.headers).to.not.have.own.property("x-xsrf-token");

				done()
			} catch (error) {
				done(error);
			}
		}, config.JWT_EXPIRY); // Expire the access token but not the refresh token
	});
});
