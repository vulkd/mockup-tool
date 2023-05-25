const config = require('config');
const knex = require('../models');
const fs = require('fs');
const path = require('path');
const uuidv4 = require('uuid/v4');
const sharp = require('sharp');

const { resolveError, getResponseForHttpStatusCode } = require('../util/expressHelpers');
const { logbot } = require('../util/logbot');

const resizeImage = async (file) => {
	return new Promise(async (resolve, reject) => {
		for (const size of config.APPLICATION_IMAGE_SIZES) {
			await sharp(file.path)
				.resize(size)
				.jpeg({ quality: 100 })
				.toFile(`${file.path.split('original')[0]}${size}/${file.filename}`);
		}
		resolve();
	});
};

const queryAssetBaseImageAll = async (account_id) => {
	const records = await knex('account_asset')
		.where({ 'account_asset.account_id': account_id })
		.join('account_asset_image_base', 'account_asset_image_base.account_asset_id', '=', 'account_asset.id')
		.join('account_user as userCreator', 'account_asset.created_by_account_user_id', '=', 'userCreator.id')
		.join('account_user as userUpdator', 'account_asset.updated_by_account_user_id', '=', 'userUpdator.id')
		.select({ id: 'account_asset_image_base.id' },
			{ name: 'account_asset_image_base.name' },
			{ desc: 'account_asset_image_base.desc' },
			{ src: 'account_asset_image_base.filename' },
			{ asset_id: 'account_asset.id' },
			{ date_created: 'account_asset.date_created' },
			{ date_updated: 'account_asset.date_updated' },
			{ created_by: 'userCreator.name' },
			{ updated_by: 'userUpdator.name' })
		.orderBy('date_updated', 'desc');

	// @todo
	for (const record of records) {
		record.masks = await knex('account_asset_mask')
			.where({ 'account_asset_mask.account_asset_image_base_id': record.id })
			.select({
				id: 'account_asset_mask.id',
				mask: 'account_asset_mask.mask',
				z: 'account_asset_mask.z'
			})
			.orderBy('account_asset_mask.date_created', 'asc');
	}

	return records;
};

const queryAssetBaseImage = async (id, account_id) => {
	const record = await knex('account_asset_image_base')
		.where({ 'account_asset_image_base.id': id })
		.join('account_asset', 'account_asset_image_base.account_asset_id', '=', 'account_asset.id')
		.join('account_user as userCreator', 'account_asset.created_by_account_user_id', '=', 'userCreator.id')
		.join('account_user as userUpdator', 'account_asset.updated_by_account_user_id', '=', 'userUpdator.id')
		.select({ id: 'account_asset_image_base.id' },
			{ name: 'account_asset_image_base.name' },
			{ desc: 'account_asset_image_base.desc' },
			{ src: 'account_asset_image_base.filename' },
			{ asset_id: 'account_asset.id' },
			{ date_created: 'account_asset.date_created' },
			{ date_updated: 'account_asset.date_updated' },
			{ created_by: 'userCreator.name' },
			{ updated_by: 'userUpdator.name' });

	const masks = await knex('account_asset_mask')
		.where({ 'account_asset_mask.account_asset_image_base_id': id })
		.select({
			id: 'account_asset_mask.id',
			mask: 'account_asset_mask.mask',
			z: 'account_asset_mask.z'
		})
		.orderBy('account_asset_mask.date_created', 'asc');

	record[0].masks = masks.map((mask) => ({
		...mask,
		mask: JSON.parse(mask.mask)
	}));

	return record[0];
};

module.exports.getBaseImages = async (req, res) => {
	try {
		if (req.params.id === 'all') {
			const records = await queryAssetBaseImageAll(req.jwt.acc);
			res.json(records);
		} else if (req.params.id) {
			const record = await queryAssetBaseImage(req.params.id, req.jwt.acc);
			res.json(record);
		}
	} catch (err) {
		console.error(err);
		res.sendStatus(500);
	}
};

module.exports.patchBaseImage = async (req, res) => {
	console.log('patchBaseImage');

	try {
		const date_updated = knex.fn.now();
		const updateObj = { date_updated };
		if (req.body.name) {
			updateObj.name = String(req.body.name.trim());
		}
		if (req.body.desc) {
			updateObj.desc = String(req.body.desc.trim());
		}

		const baseImageId = req.params.id;
		const assetId = req.body.asset_id;

		await knex('account_asset')
			.where({ 'account_asset.id': assetId })
			.update({
				date_updated,
				updated_by_account_user_id: req.jwt.sub
			});

		await knex('account_asset_image_base')
			.where({ 'account_asset_image_base.id': baseImageId })
			.update(updateObj);

		const masks =	await knex('account_asset_mask')
			.where({ 'account_asset_mask.account_asset_image_base_id': baseImageId })
			.orderBy('account_asset_mask.date_created', 'desc');

		// @todo write efficient upsert method
		// upsert masks, return new ids
		const maskIds = {};
		for (const mask of req.body.masks) {
			const newMaskId = uuidv4();
			if (mask.id.startsWith('del-')) {
				await knex('account_asset_mask').where({
					'account_asset_mask.account_asset_image_base_id': baseImageId,
					'account_asset_mask.id': mask.id.slice(4)
				}).del();
			} else if (mask.id.startsWith('tmp-')) {
				await knex('account_asset_mask').insert({
					id: newMaskId,
					mask: JSON.stringify(mask.mask),
					z: mask.z || 0,
					account_asset_image_base_id: baseImageId
				});
				maskIds[mask.id] = newMaskId;
			} else {
				console.log('updating mask', mask.id);
				await knex('account_asset_mask')
					.where({
						'account_asset_mask.account_asset_image_base_id': baseImageId,
						'account_asset_mask.id': mask.id
					})
					.update({
						date_updated,
						mask: JSON.stringify(mask.mask),
						z: mask.z || 0
					});
				maskIds[mask.id] = mask.id;
			}
		}

		res.json(maskIds);
	} catch (err) {
		console.log(err);
	}
};

module.exports.postBaseImage = async (req, res) => {
	const errors = [];
	const baseImages = [];

	for (const idx in req.files) {
		const f = req.files[idx];
		await resizeImage(f); // @todo just resize 512 here and the rest w/ res.on('finsi')

		if (!config.UPLOAD_FILETYPES.some((i) => i === f.mimetype)) {
			errors.push(idx);
		} else {
			try {
				const account_asset_id = uuidv4();
				await knex('account_asset').insert({
					id: account_asset_id,
					created_by_account_user_id: req.jwt.sub,
					updated_by_account_user_id: req.jwt.sub,
					account_id: req.jwt.acc
				});
				const baseImageId = uuidv4();
				await knex('account_asset_image_base').insert({
					id: baseImageId,
					name: f.originalname,
					originalname: f.originalname,
					mimetype: f.mimetype,
					filename: f.filename,
					size: f.size,
					account_asset_id
				});
				const record = await queryAssetBaseImage(baseImageId, req.jwt.acc);
				baseImages.push(record);
			} catch (err) {
				console.error(err);
				errors.push(idx);
				// delete file incase it's been saved
			}
		}
	}
	return res.json({ errors, baseImages });
};

module.exports.deleteBaseImages = async (req, res) => {
	const records = await knex('account_asset_image_base');
	try {
		const record = await knex(`account_asset_image_base`)
			.where({ id: req.params.id });

		await knex(`account_asset_image_base`)
			.where({ id: req.params.id })
			.del();

		await knex('account_asset')
			.where({ id: record[0].account_asset_id })
			.del();

		await knex('account_asset_mask')
			.where({ account_asset_image_base_id: req.params.id })
			.del();

		for (const size of config.APPLICATION_IMAGE_SIZES) {
			fs.unlink(`${config.UPLOAD_DIR}/${req.jwt.acc}/asset-base/${size}/${record[0].filename}`, (e) => {
				if (e) {
					console.error(e);
				}
			});
		}
		fs.unlink(`${config.UPLOAD_DIR}/${req.jwt.acc}/asset-base/original/${record[0].filename}`, (e) => {
			if (e) {
				console.error(e);
			}
		});

		res.sendStatus(200);
	} catch (err) {
		console.error(err);
		logbot(config.LOGBOT_LVL_ERROR, err);
		resolveError(res, 500);
	}
};

module.exports.deleteBaseImageMask = async (req, res) => {
	try {
		await knex('account_asset_mask')
			.where({ id: req.params.id })
			.del();
	} catch (err) {
		console.error(err);
	}
};
