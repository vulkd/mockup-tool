// describe("api keys", () => {
//   beforeEach(async () => await deleteAllUsers());

//   it("returns 200 on api route with key", async () => {
//     await createUser();
//     await loginUser();
//     const key = await AccountApiKey.findOne({}).lean();
//     const res = await chai.request(API_URL).get("/api").query({ key: key.key });
//     expect(res).to.have.status(200);
//     expect(res.headers["x-xsrf-token"]).to.equal(undefined);
//     const user = await AccountUser.findOne({ email: TESTACCOUNT.email })
//     ACCOUNT_API_KEYS = user.api_keys;
//     expect(ACCOUNT_API_KEYS.length).to.equal(2);
//   });

//   it("generates new keys", async () => {
//     await createUser();
//     let res = await loginUser();

//     res = await agent.post("/account/key").set({ "x-xsrf-token": res.headers["x-xsrf-token"] })
//     expect(res).to.have.status(200);
//     expect(res.headers["x-xsrf-token"]).to.equal(undefined);
//     assert.property(res.body, "key");
//     expect(typeof res.body.key).to.equal("string");
//     expect(res.body.key.length).to.be.at.least(48);
//     AccountUser.findOne({ email: TESTACCOUNT.email }).then((user) => {
//       if (!user) {
//         throw new Error("No user found.");
//       }
//       const collection = mongoose.connection.collection("AccountApiKeys");
//       collection.find().toArray((err) => {
//         if (err) {
//           throw new Error(err);
//         }
//         // todo (and deletes previous key!!!)
//         OLD_API_KEY = API_KEY;
//         API_KEY = res.body.key;
//         done();
//       });
//     });

//   });

//   it("returns 401 on api route with old api key", async () => {
//     await createUser();
//     await loginUser();
//     const key = await AccountApiKey.findOneDeleted({}).lean();
//     const res = await chai.request(API_URL).get("/api").query({ key: key.key });
//     expect(res).to.have.status(401);
//     expect(res.headers["x-xsrf-token"]).to.equal(undefined);
//   });

//   it("returns 401 on api route with deleted users old api key", async () => {
//     await createUser();
//     await loginUser();
//     await agent.delete("/account");
//     const res = await chai.request(API_URL).get("/api").query({ key: API_KEY });
//     expect(res).to.have.status(401);
//     expect(agent).to.not.have.cookie(config.COOKIE_ACCESS_TOKEN);
//     expect(agent).to.not.have.cookie(config.COOKIE_REFRESH_TOKEN);
//     expect(res.headers["x-xsrf-token"]).to.equal(undefined);
//   });
// });



// rating limiting
// billing

	// @todo
	// describe("Rate Limiting", () => {
	// it("should return 429 if generic limiter hit", async () => {
	//   let isRateLimited = false;
	//   const attempts = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];
	//   for (const i of attempts) {
	//     const resp = await chai.request(API_URL).post("/signin").send({email: "asdasda@example.com", password: "kajsndadasd"});
	//     isRateLimited = resp.status === 429;
	//   }
	//   expect(isRateLimited).to.equal(true);
	// });

	// todo
	// it("should return 429 if max login attempt reached", (done) => {
	// });
	// });
