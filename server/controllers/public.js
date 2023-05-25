const config = require('config');
const uuidv4 = require('uuid/v4');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const knex = require('../models');
const stripeService = require('../stripe');
const mailer = require('../mailer/mailer.js');

const { logbot } = require('../util/logbot');
const { JwtResolveTokens, JwtEatCookiesAndRevoke, JwtRefreshToken } = require('../middleware/express-auth-jwt.js');
const { isValidEmail, isValidPassword } = require('../util/validators');
const { generateToken, createB64Hash, encryptPassword } = require('../util/auth.js');
const { resolveError, getResponseForHttpStatusCode } = require('../util/expressHelpers');

// const { distanceInWords, format } = require("date-fns")

module.exports.get = (req, res) => {
	resolveError(res, 404);
};

module.exports.favicon = (req, res) => {
	res.status(204).json({message: getResponseForHttpStatusCode(204).message});
};

module.exports.refreshJwt = JwtRefreshToken;

module.exports.stripeGetAvailablePlans = async (req, res) => {
	try {
		// @todo unit test
		// @todo test returned value(s) - hide non-needed properties
		// @todo bring back specific plans we have
		const plans = await stripeService.getAvailablePlans();
		res.json(plans.map((plan) => ({
			id: plan.id,
			interval: plan.interval,
			amount: plan.amount,
			name: plan.product.name
		})));
	} catch (err) {
		console.log(err);
		resolveError(res, getResponseForHttpStatusCode(500));
	}
};

module.exports.join = async (req, res) => {
	const {
		email,
		password,
		stripeToken,
		plan: stripePlan,
		last4
	} = req.body;

	const name = String(req.body.name).trim();
	if (!name || name.length > 254) {
		return resolveError(res, getResponseForHttpStatusCode(422, 'Please enter your name'));
	}

	// We want to respond with email / password errors before payment errors in
	// case they've filled in payment details and can make a password change.
	// If they have to make a payment details change then get another error for eg
	// password that would probably be more frustrating.
	if (!isValidPassword(password)) {
		resolveError(res, getResponseForHttpStatusCode(422, 'Please choose a more difficult password (longer than 8 characters)'));
		return;
	} else if (!isValidEmail(email)) {
		resolveError(res, getResponseForHttpStatusCode(422, 'Please choose a valid email address'));
		return;
	} else if (!stripeToken || !last4 || String(last4).length !== 4 || !_.isNumber(last4) || !_.isFinite(last4)) {
		resolveError(res, getResponseForHttpStatusCode(422, 'Payment data required'));
		return;
	} else if (!stripePlan || stripePlan.length < 10) {
		// @todo @later better pre-validation than "< 10" before sending to Stripe.
		resolveError(res, getResponseForHttpStatusCode(422, 'Please select a plan!'));
		return;
	}

	try {
		// Check for existing user
		const email_lower = email.trim().toLowerCase();
		const user = await knex('account_user').first().where({ email_lower });
		if (user) {
			return resolveError(res, getResponseForHttpStatusCode(422, 'Email already in use'));
		}

		const {
			password: passwordEncrypted,
			salt
		} = encryptPassword(password);

		const accountId = uuidv4();

		try {
			const customer = await stripeService.createCustomer({
				email: email_lower,
				source: stripeToken
			}, accountId);
			await stripeService.createSubscription(customer, last4, { plan_id: stripePlan });
		} catch (err) {
			console.log(err);
			// @todo return stripe errors to ensure we can inform user!
			// @todo https://stripe.com/docs/error-codes
			return resolveError(res, getResponseForHttpStatusCode(422, 'Payment data required'));
		}

		try {
			await knex('account').insert({ id: accountId });
		} catch (err) {
			console.log('err creating account model', err);
		}

		// await knex("account_user_role").insert([
		// 	{ id: , account_id: accountId, name: 'admin' },
		// 	{ id: , account_id: accountId, name: 'user' }
		// ]);
		await knex('account_user').insert({
			id: uuidv4(),
			account_id: accountId,
			role: 'admin',
			name,
			email,
			email_lower: email.toLowerCase(),
			password: passwordEncrypted,
			password_salt: salt,
			is_activated: true
		});

		// create upload folders
		try {
			const dirpath = path.join(config.UPLOAD_DIR, accountId);
			fs.mkdir(dirpath, () => {
				fs.mkdir(path.join(config.UPLOAD_DIR, accountId, 'asset-base'), () => {
					fs.mkdir(path.join(config.UPLOAD_DIR, accountId, 'asset-base', 'original'), (e) => {
						console.log(e);
					});
					for (const size of config.APPLICATION_IMAGE_SIZES) {
						fs.mkdir(path.join(config.UPLOAD_DIR, accountId, 'asset-base', String(size)), (e) => {
							console.log(e);
						});
					}
				});
				fs.mkdir(path.join(config.UPLOAD_DIR, accountId, 'asset-brand'), () => {
					fs.mkdir(path.join(config.UPLOAD_DIR, accountId, 'asset-brand', 'original'), (e) => {
						console.log(e);
					});
					for (const size of config.APPLICATION_IMAGE_SIZES) {
						fs.mkdir(path.join(config.UPLOAD_DIR, accountId, 'asset-brand', String(size)), (e) => {
							console.log(e);
						});
					}
				});
				fs.mkdir(path.join(config.UPLOAD_DIR, accountId, 'asset-mockup'), () => {
					fs.mkdir(path.join(config.UPLOAD_DIR, accountId, 'asset-mockup', 'original'), (e) => {
						console.log(e);
					});
					for (const size of config.APPLICATION_IMAGE_SIZES) {
						fs.mkdir(path.join(config.UPLOAD_DIR, accountId, 'asset-mockup', String(size)), (e) => {
							console.log(e);
						});
					}
				});
			});
		} catch (err) {
			console.log('err creating dir for account', err);
		}

		// Send the welcome email
		// @todo
		mailer.send('JOIN', email,	null, `Welcome to ${config.HOSTNAME}`, {
			plan: `${config.FRONTEND_URL}`,
			support_email: `${config.FRONTEND_URL}`,
			docs_link: `${config.FRONTEND_URL}`
		});

		res.sendStatus(200);
	} catch (err) {
		console.log(err);
		// @todo ensure all errors / responses we send are first-party!
		if (err.error) {
			return resolveError(res, getResponseForHttpStatusCode(422, err.error));
		}
		resolveError(res, 500);
	}
};

module.exports.signin = async (req, res) => {
	const rememberMe = _.isBoolean(req.body.remember_me) ? req.body.remember_me : false;
	// req.user is from local strategy middleware
	JwtResolveTokens(req.user, res, rememberMe);
};

module.exports.signout = (req, res) => {
	try {
		JwtEatCookiesAndRevoke(req, res);
		res.sendStatus(200);
	} catch (err) {
		resolveError(res, 500);
	}
};

module.exports.requestPasswordReset = async (req, res) => {
	// Send "forgot password" email
	const email = String(req.body.email);

	if (!isValidEmail(email)) {
		return resolveError(res, getResponseForHttpStatusCode(401, 'Please choose a valid email address'));
	}

	const token = process.env.NODE_ENV === 'test'
		? 'testkey'
		: await generateToken();

	try {
		const b64str = createB64Hash(token, config.PASSWORD_SECRET);
		const accountUser = await knex('account_user')
			.first()
			.where({ email_lower: email.trim().toLowerCase() });

		mailer.send('FORGOT_PASSWORD', email,	null, 'Reset Password', {
			url: `${config.FRONTEND_URL}/reset/${token}`
		});

		if (accountUser) {
			await knex('account_user')
				.where({ email_lower: email.trim().toLowerCase() })
				.update({
					reset_password_token: b64str,
					reset_password_link_expires: Date.now() + config.constants.time.HOUR_MS
				});
		}

		// Don't let an attacker enumerate email addresses -  "If there's an email, pretend it's been sent."
		res.sendStatus(200);
	} catch (err) {
		resolveError(res, 500);
	}
};

module.exports.passwordReset = async (req, res) => {
	// Get the user to submit a new password
	try {
		const token = req.params.token;
		const currentEpoch = Date.now();

		// Decrypt the token hash
		const b64str = createB64Hash(token, config.PASSWORD_SECRET);
		const accountUser = await knex('account_user').first().where({
			reset_password_token: b64str
		}).andWhereBetween({
			reset_password_link_expires: [currentEpoch, currentEpoch + config.constants.time.HOUR_MS]
		});

		if (!accountUser) {
			return resolveError(res, getResponseForHttpStatusCode(422, 'Your password reset link is invalid or has expired'));
		}

		const password = String(req.body.password);
		if (!isValidPassword(password)) {
			return resolveError(res, getResponseForHttpStatusCode(422, 'Please choose a more difficult password (longer than 8 characters)'));
		}

		await knex('account_user').where({
			reset_password_token: b64str
		}).andWhereBetween({
			reset_password_link_expires: [currentEpoch, currentEpoch + config.constants.time.HOUR_MS]
		}).update({
			password,
			reset_password_token: null,
			reset_password_link_expires: null
		});

		JwtEatCookiesAndRevoke(req, res);

		res.status(200).json({ email: accountUser.email });
	} catch (err) {
		console.log(err);
		resolveError(res, 400);
	}
};

module.exports.activateAccount = async (req, res) => {
	// Get the user to submit a new password
	try {
		const token = req.params.token;
		const currentEpoch = Date.now();

		// Decrypt the token hash
		const b64str = createB64Hash(token, config.PASSWORD_SECRET);
		const accountUser = await knex('account_user').first().where({
			activation_token: b64str
		}).andWhereBetween('activation_token_expires', [currentEpoch, currentEpoch + config.constants.time.HOUR_MS]);

		if (!accountUser) {
			return resolveError(res, getResponseForHttpStatusCode(422, 'Your password reset link is invalid or has expired'));
		}

		const password = String(req.body.password);
		if (!isValidPassword(password)) {
			return resolveError(res, getResponseForHttpStatusCode(422, 'Please choose a more difficult password (longer than 8 characters)'));
		}

		await knex('account_user').where({ activation_token: b64str })
			.andWhereBetween('activation_token_expires', [currentEpoch, currentEpoch + config.constants.time.HOUR_MS])
			.update({
				password,
				activation_token: null,
				activation_token_expires: null
			});

		JwtEatCookiesAndRevoke(req, res);

		res.status(200).json({ email: accountUser.email });
	} catch (err) {
		console.log(err);
		resolveError(res, 400);
	}
};

// Common process user message func
async function processUserMessage(email, message, messageType) {
	email = String(email);
	message = String(message).trim().substr(0, 65535);
	logbot(config.LOGBOT_LVL_SPECIAL, { type: messageType, msg: `${messageType}: ${message}`, email });
	await MessageData.create({ message_type: messageType, message, email });
}

// Used when deleting account
module.exports.feedback = async (req, res) => {
	try {
		if (req.body.email && req.body.feedback) {
			await processUserMessage(req.body.email, req.body.message, 'FEEDBACK');
		}
		// Just respond with 200 if they're deleting their account
		res.sendStatus(200);
	} catch (error) {
		logbot(config.LOGBOT_LVL_ERROR, `Receiving feedback error: ${error}`);
		res.sendStatus(400);
	}
};

// Used for public contact form
module.exports.contact = async (req, res) => {
	try {
		if (req.body.email && req.body.message) {
			await processUserMessage(req.body.email, req.body.message, 'CONTACT');
			return res.sendStatus(200);
		}
		res.sendStatus(400);
	} catch (error) {
		logbot(config.LOGBOT_LVL_ERROR, `Receiving contact error: ${error}`);
		res.sendStatus(400);
	}
};

