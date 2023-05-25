module.exports.caseInsensitiveParamsMiddleware = (req, res, next) => {
	// @see https://stackoverflow.com/questions/15521876/nodejs-express-is-it-possible-to-have-case-insensitive-querystring
	req.query = new Proxy(req.query, {
		get: (target, name) => target[Object.keys(target).find((key) => key.toLowerCase() === name.toLowerCase())]
	});

	req.body = new Proxy(req.body, {
		get: (target, name) => target[Object.keys(target).find((key) => key.toLowerCase() === name.toLowerCase())]
	});

	next();
};

