const config = require('config');
const knex = require('../models');
const fs = require('fs');
const uuidv4 = require('uuid/v4');
const sharp = require('sharp');

const { resolveError } = require('../util/expressHelpers');
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

const queryAssetBrandImageAll = async (account_id) => {
	const records = await knex('account_asset')
		.where({ 'account_asset.account_id': account_id })
		.join('account_asset_image_brand', 'account_asset_image_brand.account_asset_id', '=', 'account_asset.id')
		.join('account_user as userCreator', 'account_asset.created_by_account_user_id', '=', 'userCreator.id')
		.join('account_user as userUpdator', 'account_asset.updated_by_account_user_id', '=', 'userUpdator.id')
		.select({ id: 'account_asset_image_brand.id' },
			{ name: 'account_asset_image_brand.name' },
			{ desc: 'account_asset_image_brand.desc' },
			{ src: 'account_asset_image_brand.filename' },
			{ asset_id: 'account_asset.id' },
			{ date_created: 'account_asset.date_created' },
			{ date_updated: 'account_asset.date_updated' },
			{ created_by: 'userCreator.name' },
			{ updated_by: 'userUpdator.name' })
		.orderBy('date_updated', 'desc');
	return records;
};

const queryAssetBrandImage = async (id, account_id) => {
	const record = await knex('account_asset_image_brand')
		.where({ 'account_asset_image_brand.id': id })
		.join('account_asset', 'account_asset_image_brand.account_asset_id', '=', 'account_asset.id')
		.join('account_user as userCreator', 'account_asset.created_by_account_user_id', '=', 'userCreator.id')
		.join('account_user as userUpdator', 'account_asset.updated_by_account_user_id', '=', 'userUpdator.id')
		.select({ id: 'account_asset_image_brand.id' },
			{ name: 'account_asset_image_brand.name' },
			{ desc: 'account_asset_image_brand.desc' },
			{ src: 'account_asset_image_brand.filename' },
			{ asset_id: 'account_asset.id' },
			{ date_created: 'account_asset.date_created' },
			{ date_updated: 'account_asset.date_updated' },
			{ created_by: 'userCreator.name' },
			{ updated_by: 'userUpdator.name' });
	return record[0];
};

module.exports.getBrandImages = async (req, res) => {
	try {
		if (req.params.id === 'all') {
			const records = await queryAssetBrandImageAll(req.jwt.acc);
			res.json(records);
		} else {

		}
	} catch (err) {
		console.error(err);
		res.sendStatus(500);
	}
};

module.exports.patchBrandImage = async (req, res) => {
	const records = await knex('account_asset_image_brand');
	// desc: req.body.desc,
	res.sendStatus(200);
};

module.exports.postBrandImage = async (req, res) => {
	const errors = [];
	const brandImages = [];

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
				const brandImageId = uuidv4();
				await knex('account_asset_image_brand').insert({
					id: brandImageId,
					name: f.originalname,
					originalname: f.originalname,
					mimetype: f.mimetype,
					filename: f.filename,
					size: f.size,
					account_asset_id
				});
				const record = await queryAssetBrandImage(brandImageId, req.jwt.acc);
				brandImages.push(record);
			} catch (err) {
				console.error(err);
				errors.push(idx);
				// delete file incase it's been saved
			}
		}
	}
	return res.json({ errors, brandImages });
};

module.exports.deleteBrandImages = async (req, res) => {
	try {
		const record = await knex(`account_asset_image_brand`)
			.where({ id: req.params.id });

		await knex(`account_asset_image_brand`)
			.where({ id: req.params.id })
			.del();

		await knex('account_asset')
			.where({ id: record[0].account_asset_id })
			.del();

		for (const size of config.APPLICATION_IMAGE_SIZES) {
			fs.unlink(`${config.UPLOAD_DIR}/${req.jwt.acc}/asset-brand/${size}/${record[0].filename}`, (e) => {
				if (e) {
					console.error(e);
				}
			});
		}
		fs.unlink(`${config.UPLOAD_DIR}/${req.jwt.acc}/asset-brand/original/${record[0].filename}`, (e) => {
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
