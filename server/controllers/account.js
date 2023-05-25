const config = require('config');
const knex = require('../models');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { format, formatRelative } = require('date-fns');

const { JwtInvalidateAndReissueTokens, JwtEatCookiesAndRevoke } = require('../middleware/express-auth-jwt');
const { logbot } = require('../util/logbot');
const { comparePassword, encryptPassword } = require('../util/auth');
const { isValidPassword, isValidEmail } = require('../util/validators');
const { resolveError, getResponseForHttpStatusCode } = require('../util/expressHelpers');


module.exports.get = async (req, res) => {
	try {
		const user = await knex('account_user').first().where({ id: req.jwt.sub });

		if (!user) {
			logbot(config.LOGBOT_LVL_ERROR, 'user missing', { stackTrace: false });
			resolveError(res, 401);
			return;
		}

		res.status(200).json({
			name: user.name,
			email: user.email,
			role: user.role,
			last_sign_in_at: formatRelative(new Date(), new Date(user.last_sign_in_at)),
			activated: user.is_activated,
			account_id: user.account_id,
			avatar_src: user.avatar
				? `http://127.0.0.1:3000/${config.UPLOAD_DIR}/${req.jwt.acc}/profile/${user.avatar}`
				: null
		});
	} catch (error) {
		console.log(error);
		logbot(config.LOGBOT_LVL_ERROR, error);
		resolveError(res, 500);
	}
};

module.exports.patch = async (req, res) => {
	const user = await knex('account_user')
		.first()
		.where({ id: req.jwt.sub });

	if (!user) {
		logbot(config.LOGBOT_LVL_ERROR, 'user missing', { stackTrace: false });
		resolveError(res, 401);
		return;
	}

	const fieldsToUpdate = {};

	if (req.body.password) {
		if (!req.body.confirmPassword) {
			resolveError(res, getResponseForHttpStatusCode(
				422,
				'Please confirm your current password to make changes'
			));
			return;
		}
		if (!comparePassword(user.password, req.body.confirmPassword, user.password_salt)) {
			resolveError(res, getResponseForHttpStatusCode(
				401,
				'Invalid password'
			));
			return;
		}
		fieldsToUpdate.password = String(req.body.password);
		if (!isValidPassword(fieldsToUpdate.password)) {
			resolveError(res, getResponseForHttpStatusCode(
				422,
				'Please choose a more difficult password (longer than 8 characters)'
			));
			return;
		}
	}

	if (req.body.email && req.body.email !== user.email) {
		fieldsToUpdate.email = String(req.body.email).trim();
		fieldsToUpdate.email_lower = String(req.body.email).trim().toLowerCase();
		if (!isValidEmail(fieldsToUpdate.email)) {
			resolveError(res, getResponseForHttpStatusCode(
				422,
				'Please choose a valid email address'
			));
			return;
		}

		const existingUser = await knex('account_user')
			.first()
			.where({email_lower: fieldsToUpdate.email_lower});

		if (existingUser) {
			resolveError(res, getResponseForHttpStatusCode(
				422,
				'Email already in use'
			));
			return;
		}
		// @todo mailer send CHANGED_EMAIL to current address
	}

	if (req.body.name) {
		fieldsToUpdate.name = String(req.body.name).trim();
	}

	try {
		const user = await knex('account_user').first().where({ id: user.id });

		if (!user) {
			throw new Error('no user');
		}

		if (fieldsToUpdate.password) {
			const {
				password: passwordEncrypted,
				salt
			} = encryptPassword(fieldsToUpdate.password);
			fieldsToUpdate.password = passwordEncrypted;
			fieldsToUpdate.password_salt = salt;
			fieldsToUpdate.reset_password_token = null;
			fieldsToUpdate.reset_password_link_expires = null;
			// If the user changes password, invalidate all existing long-term auth
			// tokens for that user. Add small delay to account for user performing
			// another action while password is being updated.
			const passwordUpdateDelaySeconds = 2;
			JwtInvalidateAndReissueTokens(req, res, user, passwordUpdateDelaySeconds);
		}

		await knex('account_user').where({ id: user.id }).update(fieldsToUpdate);

		res.sendStatus(200);
	} catch (error) {
		logbot(config.LOGBOT_LVL_ERROR, error);
		resolveError(res, 500);
	}
};

module.exports.postAvatar = async (req, res) => {
	try {
		const user = await knex('account_user')
			.first()
			.where({ id: req.jwt.sub });

		if (!user) {
			logbot(config.LOGBOT_LVL_ERROR, 'user missing', { stackTrace: false });
			resolveError(res, 401);
			return;
		}

		if (!req.file || !config.UPLOAD_FILETYPES.some((i) => i === req.file.mimetype)) {
			return res.sendStatus(400);
		}

		await new Promise(async (resolve, reject) => {
			await sharp(req.file.path)
				.resize(320)
				.jpeg({quality: 100})
				.toBuffer((err, buf) => {
					fs.writeFile(req.file.path, buf, (err) => {
						if (err) {
							reject(err);
						} else {
							resolve();
						}
					});
				});
			// .toFile(req.file.path)
			// fs.unlinkSync(req.file.path)
		});

		await knex('account_user')
			.where({ id: user.id })
			.update({ avatar: req.file.filename });

		// delete old avatar
		if (user.avatar) {
			fs.unlink(path.join(config.UPLOAD_DIR, `${user.account_id}/profile/${user.avatar}`), (e) => {
				console.log(e);
			});
		}

		res.json({
			src: `http://127.0.0.1:3000/${config.UPLOAD_DIR}/${user.account_id}/profile/${req.file.filename}`
		});
	} catch (err) {
		console.log(err);
		res.sendStatus(500);

		// delete avatar if err
		fs.unlink(path.join(config.UPLOAD_DIR, `${user.account_id}/profile/${req.file.filename}`), (e) => {
			console.log(e);
		});
	}
};

module.exports.delete = async (req, res) => {
	try {
		await knex('account_user')
			.where({ id: req.jwt.sub })
			.del();

		JwtEatCookiesAndRevoke(req, res);

		res.sendStatus(200);
	} catch (err) {
		logbot(config.LOGBOT_LVL_ERROR, error);
		resolveError(res, 500);
	}
};

module.exports.getUsers = async (req, res) => {
	try {
		if (req.params.id === 'all') {
			const records = await knex('account_user')
				.where({ 'account_user.account_id': req.jwt.acc })
			// .join('account_asset_image_base', 'account_asset_image_base.account_asset_id', '=', 'account_asset.id')
			// .join('account_user as userCreator', 'account_asset.created_by_account_user_id', '=', 'userCreator.id')
			// .join('account_user as userUpdator', 'account_asset.updated_by_account_user_id', '=', 'userUpdator.id')
				.select({
					role: 'account_user.role',
					name: 'account_user.name',
					email: 'account_user.email',
					avatar_src: 'account_user.avatar',
					date_joined: 'account_user.date_created',
					activated: 'account_user.is_activated'
				});

			for (const i of records) {
				i.date_joined = format(new Date(i.date_joined), 'Do MMM yyyy');
				i.avatar_src = i.avatar_src ? `http://127.0.0.1:3000/${config.UPLOAD_DIR}/${req.jwt.acc}/profile/${i.avatar_src}` : null;
			}

			res.json(records);
		} else {
			const record = await knex('account_user')
				.where({
					'account_user.account_id': req.jwt.acc,
					'account_user.id': req.params.id
				}).select({
					role: 'account_user.role',
					name: 'account_user.name',
					email: 'account_user.email',
					avatar_src: 'account_user.avatar',
					date_joined: 'account_user.date_created',
					activated: 'account_user.is_activated'
				});
			record[0].date_joined = format(new Date(record[0].date_joined), 'Do MMM yyyy');
			record[0].avatar_src = record[0].avatar_src ? `http://127.0.0.1:3000/${config.UPLOAD_DIR}/${req.jwt.acc}/profile/${record[0].avatar_src}` : null;
			res.json(record[0]);
		}
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
};
