require("../init");
// Chai
const chai = require("chai");
const chaiHttp = require("chai-http");
const expect = chai.expect;
chai.use(chaiHttp);
// Required modules
const config = require("config");
const fs = require("fs");
const path = require("path");
const _ = require("lodash");

const API_URL = "http://127.0.0.1:5001";

describe("public.spec.js", () => {
	it("returns 404 root route", async () => {
	  const res = await chai.request(API_URL).get("/");
	  expect(res).to.have.status(404);
	});

	it("returns 404 wildcard route", async () => {
	  const res = await chai.request(`${API_URL}/random/route/goes/here/hahaha`).get("/");
	  expect(res).to.have.status(404);
	});

	it("returns 204 for favicon", async () => {
	  const res = await chai.request(API_URL).get("/favicon.ico")
	  expect(res).to.have.status(204);
	});

	describe("/contact", async () => {
		it("returns 400 without email field", async () => {
			expect(await chai.request(API_URL).post("/contact").send({ message: "zzz" })).to.have.status(400);
		});
		it("returns 400 without message field", async () => {
			expect(await chai.request(API_URL).post("/contact").send({ email: "a@b.com" })).to.have.status(400);
		});
		it("returns 400 without email or message field", async () => {
			expect(await chai.request(API_URL).post("/contact").send()).to.have.status(400);
			expect(await chai.request(API_URL).post("/contact").send({ haha: 123 })).to.have.status(400);
		});
		it("returns 400 without valid email field", async () => {
			expect(await chai.request(API_URL).post("/contact").send({ email: "what", message: "zzz" })).to.have.status(400);
		});
		it("returns 422 when firstName field is filled in", async () => {
			expect(await chai.request(API_URL).post("/contact").send({ email: "a@b.com", message: "zzz", firstName: "" })).to.have.status(200);
			expect(await chai.request(API_URL).post("/contact").send({ email: "a@b.com", message: "zzz", firstName: "bob" })).to.have.status(422);
		});
		it("returns 200 with email and message fields", async () => {
			expect(await chai.request(API_URL).post("/contact").send({ email: "a@b.com", message: "zzz" })).to.have.status(200);
		});
	});
});

