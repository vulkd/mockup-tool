// @todo use node-canvas implementation from /util

const knex = require('../models');

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
	// .join('account_asset_image_base', 'account_asset_mockup_base_images_junc.account_asset_image_base_id', '=', 'account_asset_image_base.id')
		.select({
			id: 'account_asset_mockup_base_images_junc.account_asset_image_base_id'
		});

	for (const baseImage of baseImages) {
		finalRecord.baseImages[baseImage.id] = {
			masks: {}
		};

		const brandImages = await knex('account_asset_mockup_brand_image').where({'account_asset_mockup_brand_image.account_asset_mockup_id': id});
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

module.exports.render = async (req, res) => {
	const mockup = await queryAssetMockup(req.params.id, req.jwt.acc);

	const mask = await knex('account_asset_mask').where('id', '80a6b8a5-3a0c-4c51-ba70-74655e0da8d2');
	console.log(mask);
	console.log(JSON.parse(mask[0].mask));
	// console.log(mockup.baseImages['96e3d2fb-094d-4387-9952-2efe5afac5ea'].masks['80a6b8a5-3a0c-4c51-ba70-74655e0da8d2'].brandImage.id)

	// const mask = {
	//   nw: { x: 1844.1537802936932, y: 2054.247248934747 },
	//   ne: { x: 4746.556143371953, y: 3307.026821201771 },
	//   se: { x: 5205.649278550552, y: 1501.7792388045689 },
	//   sw: { x: 1719.6539470249209, y: 910.4050307778992 }
	// }
};
