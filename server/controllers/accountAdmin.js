const config = require('config');
const knex = require('../models');
const uuidv4 = require('uuid/v4');

const { logbot } = require('../util/logbot');
const { generateToken, encryptPassword, createB64Hash } = require('../util/auth');
const { isValidEmail } = require('../util/validators');
const { resolveError, getResponseForHttpStatusCode } = require('../util/expressHelpers');
const mailer = require('../mailer/mailer.js');

module.exports.createUser = async (req, res) => {
	try {
		const user = await knex('account_user').first().where({ id: req.jwt.sub });

		if (!user) {
			logbot(config.LOGBOT_LVL_ERROR, 'user missing', { stackTrace: false });
			resolveError(res, 401);
			return;
		}

		if (user.role !== 'admin') {
			resolveError(res, getResponseForHttpStatusCode(
				401,
				'Administrator rights required'
			));
			return;
		}

		let { name, email } = req.body;

		name = String(name.trim());
		email = String(email.trim());

		if (!name) {
			resolveError(res, getResponseForHttpStatusCode(
				422,
				'Please enter a name'
			));
			return;
		}
		name = String(name).trim();
		if ((!name || !name.length) || name.length > 254) {
			resolveError(res, getResponseForHttpStatusCode(
				422,
				'Please enter a name'
			));
			return;
		}

		if (!isValidEmail(email)) {
			resolveError(res, getResponseForHttpStatusCode(
				422,
				'Please choose a valid email address'
			));
			return;
		}

		const existingUser = await knex('account_user')
			.first()
			.where({ email_lower: email.toLowerCase() });
		if (existingUser) {
			resolveError(res, getResponseForHttpStatusCode(
				422,
				'Email already in use'
			));
			return;
		}

		const accountId = uuidv4();

		try {
			const token = process.env.NODE_ENV === 'test'
				? 'testkey'
				: await generateToken();

			// use placeholder password
			const {
				password: passwordEncrypted,
				salt
			} = encryptPassword(`${uuidv4()}-${uuidv4()}`);

			await knex('account_user').insert({
				id: accountId,
				name,
				email,
				role: 'user',
				email_lower: email.toLowerCase(),
				account_id: user.account_id,
				password: passwordEncrypted,
				password_salt: salt,
				is_activated: false,
				activation_token: createB64Hash(token, config.PASSWORD_SECRET),
				activation_token_expires: Date.now() + config.constants.time.HOUR_MS
			});

			mailer.send('ACTIVATE_ACCOUNT', email.toLowerCase(),	null, 'Activate Account', {
				url: `${config.FRONTEND_URL}/activate/${token}`,
				name: name.split(' ')[0]
			});
		} catch (err) {
			console.log('err creating account model', err);
			return res.sendStatus(500);
		}

		res.sendStatus(200);
	} catch (err) {
		console.log(err);
		// @todo ensure all errors / responses we send are first-party!
		if (err.error) {
			resolveError(res, getResponseForHttpStatusCode(
				422,
				err.error
			));
			return;
		}
		resolveError(res, 500);
	}
};
