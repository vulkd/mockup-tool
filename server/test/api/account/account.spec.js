// @todo salts passwords

require("../../init");
const { deleteAllUsers, deleteEverything, createNewAPIKey } = require("../../init");

// Chai
const chai = require("chai");
const chaiHttp = require("chai-http");
const expect = chai.expect;
const assert = chai.assert;
chai.use(chaiHttp);

// Required modules
const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const config = require("config");
const mongoose = require("mongoose");
const redisClient = require("../../../util/redisClient");

// Other
const {
	AccountUser,
	AccountUserStripeCustomer,
	AccountUserStripeCustomerSubscription,
	AccountApiKey,
	StripeProduct,
	StripePlan,
	RequestData
} = require("../../../models");

const TESTACCOUNT = { email: "accountTest@example.com", password: "thisismypassword" };
const API_URL = "http://127.0.0.1:5001";
let OLD_API_KEY = "";
let API_KEY = "";
/** @type {Number} */
let LAST_SIGN_IN;
let CSRF_TOKEN = "";
let ACCOUNT_API_KEYS;
let STRIPE_BASIC_PROD;
let STRIPE_BASIC_PLAN;
let STRIPE_PREMIUM_PROD;
let STRIPE_PREMIUM_PLAN;

let agent = chai.request.agent(API_URL);

async function resetDB() {
	await deleteEverything();
	STRIPE_BASIC_PROD = await StripeProduct.findOne({ active: true, name: "AcmeBot Basic" }).lean();
	STRIPE_PREMIUM_PROD = await StripeProduct.findOne({ active: true, name: "AcmeBot Premium" }).lean();
	STRIPE_BASIC_PLAN = await StripePlan.findOne({ active: true, nickname: "AcmeBot Basic Plan", stripe_product_id: STRIPE_BASIC_PROD._id }).lean();
	STRIPE_PREMIUM_PLAN = await StripePlan.findOne({ active: true, nickname: "AcmeBot Premium Plan", stripe_product_id: STRIPE_PREMIUM_PROD._id }).lean();
}

async function createUser(opts) {
	const validDefaultUser = { ...TESTACCOUNT, stripeToken: "tok_visa", last4: 4242, plan: STRIPE_BASIC_PLAN.plan_id };
	const newUser = { ...validDefaultUser, ...opts };
	return await agent.post("/join").send(newUser);
}

async function loginUser(opts) {
	const res = await agent.post("/signin").send({ ...TESTACCOUNT, ...opts });
	expect(res).to.have.status(200);
	expect(agent).to.have.cookie(config.COOKIE_ACCESS_TOKEN);
	expect(agent).to.have.cookie(config.COOKIE_REFRESH_TOKEN);
	expect(res.headers["set-cookie"][1].includes("Max-Age=")).to.equal(!!(opts && opts.remember_me));
	// expect(res.headers["set-cookie"][1].includes("Expires=")).to.equal(!!(opts && opts.remember_me));
	expect(res.headers).to.have.property("x-xsrf-token");
	return res;
}

describe("accounts.spec.js", () => {
	before(async () => await resetDB());

	after(async () => await agent.close());

	describe("creation", () => {
		before(async () => agent = chai.request.agent(API_URL));
		beforeEach(async () => await deleteAllUsers());

		it("should create new user", async () => {
			const res = await createUser();
			expect(res).to.have.status(200);
			expect(res).to.not.have.cookie(config.COOKIE_ACCESS_TOKEN);
			expect(agent).to.not.have.cookie(config.COOKIE_REFRESH_TOKEN);
			expect(res.headers["x-xsrf-token"]).to.equal(undefined);
			const user = await AccountUser.findOne({ email: TESTACCOUNT.email }).lean();
			expect(user.api_keys.length).to.equal(1);
			expect(await AccountApiKey.findById(user.api_keys[0])).to.not.be.null;
			const customers = await AccountUserStripeCustomer.find({ account_user_id: user._id }).lean();
			expect(customers).to.have.length(1);
			expect(await AccountUserStripeCustomerSubscription.find({ account_user_stripe_customer_id: customers[0]._id }).lean()).to.have.length(1);
		});

		describe("invalid duplicates", () => {
			let res;
			let originalUser;

			beforeEach(async () => {
				await deleteAllUsers();
				await createUser({ email: "user@example.com" });
			});

			afterEach(async () => {
				expect(res.body).to.deep.equal({ message: "Email already in use" });
				expect(res).to.have.status(422);
				expect(res.headers["x-xsrf-token"]).to.equal(undefined);
				const users = await AccountUser.find({}).lean();
				expect(users).to.have.length(1);
				expect(users[0]).to.deep.equal(originalUser);
				expect(await AccountUserStripeCustomer.find({}).lean()).to.have.length(1);
				expect(await AccountUserStripeCustomerSubscription.find({}).lean()).to.have.length(1);
			});

			it("should not create a new user with duplicate email", async () => {
				originalUser = await AccountUser.findOne({}).lean();
				res = await createUser({ email: "user@example.com" });
			});

			it("should not create a new user with duplicate email - different casing", async () => {
				originalUser = await AccountUser.findOne({}).lean();
				res = await createUser({ email: "USER@example.com" });
			});
		});

		describe("invalid other", () => {
			let res;

			beforeEach(async () => await deleteAllUsers());

			afterEach(async () => {
				expect(res).to.have.status(422);
				expect(res.headers["x-xsrf-token"]).to.equal(undefined);
				expect(await AccountUser.findOne({ email: TESTACCOUNT.email })).to.be.null;
				expect(await AccountUserStripeCustomer.find({})).to.have.length(0);
				expect(await AccountUserStripeCustomerSubscription.find({})).to.have.length(0);
			});

			it ("should not create new user with invalid TLD in email", async () => {
				res = await createUser({ email: "user@example.cashbucks" });
				expect(res.body.message).to.equal("Please choose a valid email address");
			});

			it("should not create new user with invalid password", async () => {
				res = await createUser({ password: "password" });
				expect(res.body.message).to.equal("Please choose a more difficult password (longer than 8 characters)");
			});

			it("should not create new user with bad payment data - no stripeToken", async () => {
				res = await createUser({ stripeToken: null });
				expect(res.body.message).to.equal("Payment data required");
			});

			it("should not create new user with bad payment data - no last4", async () => {
				res = await createUser({ last4: null });
				expect(res.body.message).to.equal("Payment data required");
			});

			it("should not create new user with bad payment data - no plan", async () => {
				res = await createUser({ plan: null });
				expect(res.body.message).to.equal("Please select a plan!");
			});

			it("should not create new user with bad payment data - invalid stripeToken", async () => {
				res = await createUser({ stripeToken: "TEST_BAD_TOKEN" });
				expect(res.body.message).to.equal("Payment data required");
			});

			it("should not create new user with bad payment data - invalid last4", async () => {
				res = await createUser({ last4: "TEST_BAD_LAST4" });
				expect(res.body.message).to.equal("Payment data required");
			});

			it("should not create new user with bad payment data - invalid plan", async () => {
				res = await createUser({ plan: "TSTBADPLN" });
				expect(res.body.message).to.equal("Please select a plan!");
			});

			it("returns 422 when firstName field is filled in", async () => {
				res = await createUser({ firstName: "bob" });
			});
		});
	});

describe("login / logout", () => {
	beforeEach(async () => {
		agent = chai.request.agent(API_URL)
		await deleteAllUsers({ usersOnly: true })
	});

	it("should login (case-insensitive email)", async () => {
		await createUser({ email: "user@example.com" });
		const res = await loginUser({ email: "USER@EXAMPLE.COM" });
		const user = await AccountUser.findOne({ email_lower: "user@example.com" }).lean();
		const currentEpoch = Date.now();
		const thresholdMs = 300;
		expect(user.sign_in_count).to.equal(1);
		expect(new Date(user.current_sign_in_at).getTime() > (currentEpoch - thresholdMs)).to.equal(true);
		expect(new Date(user.current_sign_in_at).getTime() < currentEpoch).to.equal(true);
		expect(new Date(user.last_sign_in_at).getTime()).to.equal(new Date(user.current_sign_in_at).getTime());
	});

	it("should login (long-term / remember me)", async () => {
		await createUser();
		const res = await loginUser({ remember_me: true });
		expect(res).to.have.status(200);
		expect(res).to.have.cookie(config.COOKIE_ACCESS_TOKEN);
		expect(res).to.have.cookie(config.COOKIE_REFRESH_TOKEN);

		const user = await AccountUser.findOne({}).lean();
		const currentEpoch = Date.now();
		const thresholdMs = 300;``
		expect(user.sign_in_count).to.equal(1);
		expect(new Date(user.current_sign_in_at).getTime() > (currentEpoch - thresholdMs)).to.equal(true);
		expect(new Date(user.current_sign_in_at).getTime() < currentEpoch).to.equal(true);
		expect(new Date(user.last_sign_in_at).getTime()).to.equal(new Date(user.current_sign_in_at).getTime());
	});

	it("should access protected account route", async () => {
		await createUser();
		let res = await loginUser();
		res = await agent.get("/account").set({ "x-xsrf-token": res.headers["x-xsrf-token"] });
		expect(res).to.have.status(200);
		expect(agent).to.have.cookie(config.COOKIE_ACCESS_TOKEN);
		expect(agent).to.have.cookie(config.COOKIE_REFRESH_TOKEN);
		expect(res.headers["x-xsrf-token"]).to.equal(undefined);
	});

	it("should not login with bad credentials", async () => {
		await createUser();
		const res = await agent.post("/signin").send({ ...TESTACCOUNT, password: "12345678" });
		expect(res).to.have.status(401);
		expect(res.headers["x-xsrf-token"]).to.equal(undefined);
	});

	it("should not access protected account route", async () => {
		const res = await agent.get("/account");
		expect(res).to.have.status(401);
		expect(agent).to.not.have.cookie(config.COOKIE_ACCESS_TOKEN);
		expect(agent).to.not.have.cookie(config.COOKIE_REFRESH_TOKEN);
		expect(res.headers["x-xsrf-token"]).to.equal(undefined);
	});

	it("should logout", async () => {
		await createUser();
		await loginUser();
		const res = await agent.post("/signout");
		expect(res).to.have.status(200);
		expect(agent).to.not.have.cookie(config.COOKIE_ACCESS_TOKEN);
		expect(agent).to.not.have.cookie(config.COOKIE_REFRESH_TOKEN);
		expect(res.headers["x-xsrf-token"]).to.equal(undefined);
	});

	it("should remember sign-in count", async () => {
		await createUser();
		await loginUser();
		let user = await AccountUser.findOne({}).lean();
		let lastSignIn = new Date(user.current_sign_in_at).getTime();
		const currentEpoch = Date.now();
		const thresholdMs = 300;
		expect(user.sign_in_count).to.equal(1);
		expect(new Date(user.current_sign_in_at).getTime() > (currentEpoch - thresholdMs)).to.equal(true);
		expect(new Date(user.current_sign_in_at).getTime() < currentEpoch).to.equal(true);
		expect(new Date(user.last_sign_in_at).getTime()).to.equal(new Date(user.current_sign_in_at).getTime());
		await agent.post("/signout");
		await loginUser();
		user = await AccountUser.findOne({}).lean();
		expect(new Date(user.last_sign_in_at).getTime()).to.equal(lastSignIn);
		lastSignIn = new Date(user.current_sign_in_at).getTime();
		expect(user.sign_in_count).to.equal(2);
		await agent.post("/signout");
		await loginUser();
		user = await AccountUser.findOne({}).lean();
		expect(new Date(user.last_sign_in_at).getTime()).to.equal(lastSignIn);
		expect(user.sign_in_count).to.equal(3);
	});

	it("returns 422 when firstName field is filled in", async () => {
		await createUser();
		expect(await agent.post("/signin").send({ ...TESTACCOUNT, firstName: "bob" })).to.have.status(422);
	});
});

describe("deletion", () => {
	before(async () => agent = chai.request.agent(API_URL));
	beforeEach(async () => await deleteAllUsers());

	it("should delete user and their api keys", async () => {
		let res = await createUser();
		expect(res).to.have.status(200);
		res = await loginUser();
		expect(res).to.have.status(200);
		res = await agent.delete("/account").set({ "x-xsrf-token": res.headers["x-xsrf-token"] });
		expect(res).to.have.statu
	});

	it("should not delete a user without authorization", async () => {
		let res = await createUser();
		expect(res).to.have.status(200);
		res = await agent.delete("/account").set({ "x-xsrf-token": res.headers["x-xsrf-token"] || null });
		expect(res).to.have.status(401);
		expect(agent).to.not.have.cookie(config.COOKIE_ACCESS_TOKEN);
		expect(agent).to.not.have.cookie(config.COOKIE_REFRESH_TOKEN);
		expect(res.headers["x-xsrf-token"]).to.equal(undefined);
		expect(await AccountUser.findOne({ email: TESTACCOUNT.email }).lean()).to.not.be.null;
	});

	it("should create a new user with the email of the deleted user", async () => {
		let res = await createUser();
		expect(res).to.have.status(200);
		res = await loginUser();
		expect(res).to.have.status(200);
		res = await agent.delete("/account").set({ "x-xsrf-token": res.headers["x-xsrf-token"] });
		expect(res).to.have.status(200);
		res = await createUser();
		expect(res).to.have.status(200);
	});
});

describe("patch", () => {
	before(async () => agent = chai.request.agent(API_URL));

	describe("email", () => {
		let res;
		let xsrfToken;

		before(async () => {
			await deleteAllUsers();
			await AccountUser.create({ email: TESTACCOUNT.email, email_lower: TESTACCOUNT.email.toLowerCase(), password: TESTACCOUNT.password });
			await AccountUser.create({ email: "user2@example.com", email_lower: "user2@example.com", password: TESTACCOUNT.password });
			res = await loginUser();
			xsrfToken = res.headers["x-xsrf-token"];
		});

		it("should return error on invalid email address", async () => {
			res = await agent.patch("/account").set({ "x-xsrf-token": xsrfToken }).send({ email: "New@example.badtld" });
			expect(res).to.have.status(422);
			expect(res.body.message).to.equal("Please choose a valid email address");
			expect(agent).to.have.cookie(config.COOKIE_ACCESS_TOKEN);
			expect(agent).to.have.cookie(config.COOKIE_REFRESH_TOKEN);
		});

		it("should return error on existing email address", async () => {
			res = await agent.patch("/account").set({ "x-xsrf-token": xsrfToken }).send({ email: "user2@example.com" });
			expect(res).to.have.status(422);
			expect(res.body.message).to.equal("Email already in use");
			expect(agent).to.have.cookie(config.COOKIE_ACCESS_TOKEN);
			expect(agent).to.have.cookie(config.COOKIE_REFRESH_TOKEN);
		});

		it("should update email address", async () => {
			res = await agent.patch("/account").set({ "x-xsrf-token": xsrfToken }).send({ email: "New@example.com" });
			expect(res).to.have.status(200);
			// @todo csrf should not be undefined on res. I think we're keeping it in local storage though, and not keeping track with chai-http as much here.
			expect(agent).to.have.cookie(config.COOKIE_ACCESS_TOKEN);
			expect(agent).to.have.cookie(config.COOKIE_REFRESH_TOKEN);

			let user = await AccountUser.findOne({ email: "New@example.com" });
			expect(user.email).to.equal("New@example.com");
			expect(user.email_lower).to.equal("new@example.com".toLowerCase());

			res = await agent.post("/signout");
			expect(res).to.have.status(200);
			expect(res.headers).to.not.haveOwnProperty("x-xsrf-token");
			expect(agent).to.not.have.cookie(config.COOKIE_ACCESS_TOKEN);
			expect(agent).to.not.have.cookie(config.COOKIE_REFRESH_TOKEN);

			res = await agent.post("/signin").send(TESTACCOUNT);
			expect(res).to.have.status(401);
			expect(res.headers).to.not.haveOwnProperty("x-xsrf-token");
			expect(agent).to.not.have.cookie(config.COOKIE_ACCESS_TOKEN);
			expect(agent).to.not.have.cookie(config.COOKIE_REFRESH_TOKEN);

			res = await loginUser({ email: "New@example.COM" });

			// Check sign in counts
			user = await AccountUser.findOne({ email_lower: "new@example.com" });
			const currentEpoch = Date.now();
			const thresholdMs = 300;
			expect(user.email).to.equal("New@example.com");
			expect(user.email_lower).to.equal("new@example.com");
			expect(user.sign_in_count).to.equal(2);
			expect(new Date(user.current_sign_in_at).getTime() > (currentEpoch - thresholdMs)).to.equal(true);
			expect(new Date(user.current_sign_in_at).getTime() < currentEpoch).to.equal(true);
		});
	});

	describe("password", () => {
		let user;
		let oldPasswordHash;
		let csrfToken;

		before(async () => {
			agent = chai.request.agent(API_URL)
			await deleteAllUsers();
			user = await AccountUser.create({
				email: TESTACCOUNT.email,
				email_lower: TESTACCOUNT.email.toLowerCase(),
				password: TESTACCOUNT.password
			});
			oldPasswordHash = user.password;
			const res = await loginUser();
			csrfToken = res.headers["x-xsrf-token"];
		});

		it("update password returns 422 without confirmPassword field", async () => {
			const res = await agent.patch("/account").set({ "x-xsrf-token": csrfToken}).send({
				password: "MYUPDATEDPASSWORD"
			});
			expect(res).to.have.status(422);
		});

		it("update password requires 401 without authorized confirmPassword field", async () => {
			const res = await agent.patch("/account").set({ "x-xsrf-token": csrfToken }).send({
				password: "MYUPDATEDPASSWORD",
				confirmPassword: "n0t the original pssworD"
			});
			expect(res).to.have.status(401);
		});

		it("update password requires 422 without valid password field", async () => {
			const res = await agent.patch("/account").set({ "x-xsrf-token": csrfToken }).send({
				password: "password",
				confirmPassword: TESTACCOUNT.password
			});
			expect(res).to.have.status(422);
			expect(res.body).to.deep.equal({ message: "Please choose a more difficult password (longer than 8 characters)" });

		});

		it("update password returns 200 with valid password & confirmPassword fields", async () => {
			let res = await agent.patch("/account").set({ "x-xsrf-token": csrfToken}).send({
				password: "MYUPDATEDPASSWORD",
				confirmPassword: TESTACCOUNT.password
			});
			expect(res).to.have.status(200);
			expect(res.headers).to.have.property("x-xsrf-token");
			expect(agent).to.have.cookie(config.COOKIE_ACCESS_TOKEN);
			expect(agent).to.have.cookie(config.COOKIE_REFRESH_TOKEN);
			user = await AccountUser.findOne({email: TESTACCOUNT.email});
			expect(user.password).to.not.equal(oldPasswordHash);
			expect(user.password).to.not.equal("MYUPDATEDPASSWORD");
			oldPasswordHash = user.password;
			res = await loginUser({ password: "MYUPDATEDPASSWORD" });
			csrfToken = res.headers["x-xsrf-token"];
		});

		it("update password even when password is same as current password", async () => {
			const res = await agent.patch("/account").set({ "x-xsrf-token": csrfToken }).send({
				password: "MYUPDATEDPASSWORD",
				confirmPassword: "MYUPDATEDPASSWORD"
			});
			expect(res).to.have.status(200);
			expect(res.headers).to.have.property("x-xsrf-token");
			expect(agent).to.have.cookie(config.COOKIE_ACCESS_TOKEN);
			expect(agent).to.have.cookie(config.COOKIE_REFRESH_TOKEN);
			user = await AccountUser.findOne({ email: TESTACCOUNT.email });
			expect(user.password).to.not.equal(oldPasswordHash);
			expect(user.password).to.not.equal("MYUPDATEDPASSWORD");
			await loginUser({ password: "MYUPDATEDPASSWORD" });
		});
	});

describe("reset password", () => {
	beforeEach(() => agent = chai.request.agent(API_URL));

	// @todo test expiry and token validity and validity of new password
	it("should reset password via expiring email link", async () => {
		await deleteAllUsers({ usersOnly: true });
		await AccountUser.create({ email: TESTACCOUNT.email, email_lower: TESTACCOUNT.email.toLowerCase(), password: TESTACCOUNT.password });

		let res = await agent.post("/reset").send({ email: TESTACCOUNT.email });
		expect(res).to.have.status(200);
		expect(agent).to.not.have.cookie(config.COOKIE_ACCESS_TOKEN);
		expect(agent).to.not.have.cookie(config.COOKIE_REFRESH_TOKEN);
		expect(res.headers).to.not.have.property("x-xsrf-token");
		let user = await AccountUser.findOne({ email: TESTACCOUNT.email });
		// Check stored token is hashed:
		expect(user.reset_password_token).to.not.equal("testkey");

		res = await agent.post("/reset/testkey").send({ password: "platypusDanceOff" });
		expect(res).to.have.status(200);
		user = await AccountUser.findOne({ email: TESTACCOUNT.email });
		expect(user.reset_password_token).to.equal(null);
		expect(user.reset_password_link_expires).to.equal(null);

		await loginUser({ password: "platypusDanceOff"})
	});

	it("returns 422 when firstName field is filled in", async () => {
		await deleteAllUsers({ usersOnly: true });
		await AccountUser.create({ email: TESTACCOUNT.email, email_lower: TESTACCOUNT.email.toLowerCase(), password: TESTACCOUNT.password });
		expect(await agent.post("/reset").send({ email: TESTACCOUNT.email, firstName: "bob" })).to.have.status(422);
	});
});

describe("change api key", () => {
	let apiKey;
	let apiKeyOld;
	let csrfToken;

	before(async () => {
		agent = chai.request.agent(API_URL);
		await deleteAllUsers({ usersOnly: true });
		apiKey = await createNewAPIKey("testkeytestkeytestkeytestkeytestkeytestkeytest__1");
		await AccountUser.create({ api_keys: [apiKey._id], email: TESTACCOUNT.email, email_lower: TESTACCOUNT.email.toLowerCase(), password: TESTACCOUNT.password });
		const res = await loginUser();
		csrfToken = res.headers["x-xsrf-token"];
	});

	// api.spec.js contains basic auth tests (200 / 401 for req.query and req.headers)

	it("generates new api key and soft deletes old one", async () => {
		let res;
		res = await agent.post("/account/key").set({ "x-xsrf-token": csrfToken });
		expect(res.body).to.have.property("key");
		expect(typeof res.body.key).to.be.equal("string");
		expect(await AccountApiKey.find({ key: apiKey.key })).to.be.empty;
		expect(await AccountApiKey.findWithDeleted({ key: apiKey.key })).to.not.be.empty;
		expect(await AccountApiKey.find({ key: res.body.key })).to.not.be.empty;
		apiKeyOld = apiKey;
		apiKey = res.body.key;
		expect(await chai.request(API_URL).get(`/api?key=${apiKey}`)).to.have.status(200);
		expect(await chai.request(API_URL).get(`/api?key=${apiKeyOld}`)).to.have.status(401);
	});
});

