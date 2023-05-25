const config = require('config');
const knex = require('../models');
const uuidv4 = require('uuid/v4');
const sharp = require('sharp');

const { resolveError } = require('../util/expressHelpers');
const { logbot } = require('../util/logbot');

const resizeImage = (file) => {
	return new Promise(async (resolve, reject) => {
		for (const size of config.APPLICATION_IMAGE_SIZES) {
			try {
				await sharp(file.path)
					.resize(size)
					.jpeg({ quality: 100 })
					.toFile(`${file.path.split('original')[0]}${size}/${file.filename}`);
			} catch (err) {
				reject(err);
			}
		}
		resolve();
	});
};

const queryAssetMockupAll = async (account_id) => {
	const records = await knex('account_asset')
		.where({ 'account_asset.account_id': account_id })
		.join('account_asset_mockup', 'account_asset_mockup.account_asset_id', '=', 'account_asset.id')
		.join('account_user as userCreator', 'account_asset.created_by_account_user_id', '=', 'userCreator.id')
		.join('account_user as userUpdator', 'account_asset.updated_by_account_user_id', '=', 'userUpdator.id')
		.select({ id: 'account_asset_mockup.id' },
			{ name: 'account_asset_mockup.name' },
			{ desc: 'account_asset_mockup.desc' },
			{ asset_id: 'account_asset.id' },
			{ date_created: 'account_asset.date_created' },
			{ date_updated: 'account_asset.date_updated' },
			{ created_by: 'userCreator.name' },
			{ updated_by: 'userUpdator.name' })
		.orderBy('date_updated', 'desc');
	return records;
};

const queryAssetMockup = async (id, account_id) => {
	const record = await knex('account_asset_mockup')
		.where({ 'account_asset_mockup.id': id })
		.join('account_asset', 'account_asset_mockup.account_asset_id', '=', 'account_asset.id')
		.join('account_user as userCreator', 'account_asset.created_by_account_user_id', '=', 'userCreator.id')
		.join('account_user as userUpdator', 'account_asset.updated_by_account_user_id', '=', 'userUpdator.id')
		.select({ id: 'account_asset_mockup.id' },
			{ name: 'account_asset_mockup.name' },
			{ desc: 'account_asset_mockup.desc' },
			{ asset_id: 'account_asset.id' },
			{ date_created: 'account_asset.date_created' },
			{ date_updated: 'account_asset.date_updated' },
			{ created_by: 'userCreator.name' },
			{ updated_by: 'userUpdator.name' });

	const finalRecord = {
		...record[0],
		baseImages: {}
	};

	const baseImages = await knex('account_asset_mockup_base_images_junc')
		.where({ 'account_asset_mockup_base_images_junc.account_asset_mockup_id': finalRecord.id })
		.select({
			id: 'account_asset_mockup_base_images_junc.account_asset_image_base_id'
		});

	for (const baseImage of baseImages) {
		finalRecord.baseImages[baseImage.id] = {
			masks: {}
		};

		const brandImages = await knex('account_asset_mockup_brand_image')
			.where({'account_asset_mockup_brand_image.account_asset_mockup_id': id});

		for (const brandImage of brandImages) {
			finalRecord.baseImages[baseImage.id].masks[brandImage.account_asset_mask_id] = {
				brandImage: {
					id: brandImage.account_asset_image_brand_id,
					mods: {}
				}
			};
		}
	}

	return finalRecord;
};

module.exports.getMockup = async (req, res) => {
	console.log('getMockup', req.params.id);

	try {
		if (req.params.id === 'all') {
			const records = await queryAssetMockupAll(req.jwt.acc);
			res.json(records);
		} else {
			const record = await queryAssetMockup(req.params.id, req.jwt.acc);
			res.json(record);
		}
	} catch (err) {
		console.error(err);
		res.sendStatus(500);
	}
};

module.exports.patchMockup = async (req, res) => {
	console.log('patchMockup');

	const mockupId = req.params.id;
	const accountAssetId = req.body.asset_id;

	try {
		const date_updated = knex.fn.now();
		const updateObj = { date_updated };
		if (req.body.name) {
			updateObj.name = String(req.body.name.trim());
		}
		if (req.body.desc) {
			updateObj.desc = String(req.body.desc.trim());
		}

		// Update Account Asset
		await knex('account_asset')
			.where({ 'account_asset.id': accountAssetId })
			.update({
				date_updated,
				updated_by_account_user_id: req.jwt.sub
			});

		// Update Mockup
		await knex('account_asset_mockup')
			.where({ 'account_asset_mockup.id': mockupId })
			.update(updateObj);

		// @todo update, dont be lazy and recreate...
		await knex('account_asset_mockup_base_images_junc')
			.where({ 'account_asset_mockup_base_images_junc.account_asset_mockup_id': mockupId })
			.del();
		await knex('account_asset_mockup_brand_image')
			.where({'account_asset_mockup_brand_image.account_asset_mockup_id': mockupId })
			.del();

		const baseImages = {};

		for (const baseImageId of Object.keys(req.body.baseImages)) {
			const baseImageJuncId = uuidv4();
			// table.uuid('account_asset_mockup_id').references('id').inTable('account_asset_mockup').notNullable();
			// table.uuid('account_asset_image_base_id').references('id').inTable('account_asset_image_base').notNullable();
			await knex('account_asset_mockup_base_images_junc').insert({
				id: baseImageJuncId,
				account_asset_mockup_id: mockupId,
				account_asset_image_base_id: baseImageId
			});

			baseImages[baseImageJuncId] = { masks: {} };

			for (const maskId of Object.keys(req.body.baseImages[baseImageId].masks)) {
				const mask = req.body.baseImages[baseImageId].masks[maskId];
				if (!mask.brandImage.id) {
					continue;
				}
				const brandImageId = mask.brandImage.id;
				// const brandImageMods = mask.brandImage.mods;
				const brandImageJuncId = uuidv4();

				baseImages[baseImageJuncId].masks[maskId] = { brandImage: { id: brandImageJuncId, mods: {} }};

				await knex('account_asset_mockup_brand_image').insert({
					id: brandImageJuncId,
					account_asset_mask_id: maskId, // specific mask in base image it belongs to
					account_asset_image_brand_id: brandImageId,
					account_asset_mockup_id: mockupId
				});
			}
		}

		res.json({
			id: mockupId,
			asset_id: accountAssetId
			// baseImages
		});
	} catch (err) {
		console.error(err);
	}
};

module.exports.postMockup = async (req, res) => {
	console.log('postMockup');
	try {
		const accountAssetId = uuidv4();
		const mockupId = uuidv4();
		await knex('account_asset').insert({
			id: accountAssetId,
			created_by_account_user_id: req.jwt.sub,
			updated_by_account_user_id: req.jwt.sub,
			account_id: req.jwt.acc
		});
		await knex('account_asset_mockup').insert({
			id: mockupId,
			account_asset_id: accountAssetId,
			name: req.body.name ? String(req.body.name.trim()) : 'New Mockup',
			desc: req.body.desc ? String(req.body.desc.trim()) : null
		});

		const baseImages = {};

		for (const baseImageId of Object.keys(req.body.baseImages)) {
			const baseImageJuncId = uuidv4();
			// table.uuid('account_asset_mockup_id').references('id').inTable('account_asset_mockup').notNullable();
			// table.uuid('account_asset_image_base_id').references('id').inTable('account_asset_image_base').notNullable();
			await knex('account_asset_mockup_base_images_junc').insert({
				id: baseImageJuncId,
				account_asset_mockup_id: mockupId,
				account_asset_image_base_id: baseImageId
			});

			baseImages[baseImageJuncId] = { masks: {} };

			for (const maskId of Object.keys(req.body.baseImages[baseImageId].masks)) {
				const mask = req.body.baseImages[baseImageId].masks[maskId];
				if (!mask.brandImage.id) {
					continue;
				}
				const brandImageId = mask.brandImage.id;
				// const brandImageMods = mask.brandImage.mods;
				const brandImageJuncId = uuidv4();

				baseImages[baseImageJuncId].masks[maskId] = { brandImage: { id: brandImageJuncId, mods: {} }};

				await knex('account_asset_mockup_brand_image').insert({
					id: brandImageJuncId,
					account_asset_mask_id: maskId, // specific mask in base image it belongs to
					account_asset_image_brand_id: brandImageId,
					account_asset_mockup_id: mockupId
				});
			}
		}

		res.json({
			id: mockupId,
			asset_id: accountAssetId,
			baseImages
		});
	} catch (err) {
		console.error(err);
		res.sendStatus(500);
	}
};

module.exports.deleteMockup = async (req, res) => {
	console.log('deleteMockup');
	const records = await knex('account_asset_image_base');
	try {
		const record = await knex(`account_asset_mockup`)
			.where({ id: req.params.id });
		await knex(`account_asset_mockup`)
			.where({ id: req.params.id })
			.del();
		await knex('account_asset')
			.where({id: record[0].account_asset_id })
			.del();

		// @todo delete all the things
		// for (const size of config.APPLICATION_IMAGE_SIZES) {
		// 	fs.unlink(`${config.UPLOAD_DIR}/${req.user.account_id}/asset-mockup/${size}/${record[0].filename}`, e => {
		// 		if (e) console.error(e)
		// 	});
		// }

		// fs.unlink(`${config.UPLOAD_DIR}/${req.user.account_id}/asset-mockup/original/${record[0].filename}`, e => {
		// 	if (e) console.error(e)
		// });

		res.sendStatus(200);
	} catch (err) {
		console.error(err);
		logbot(config.LOGBOT_LVL_ERROR, err);
		resolveError(res, 500);
	}
};
