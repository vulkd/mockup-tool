const knex = require('../models');
const uuidv4 = require('uuid/v4');

module.exports.getTags = async (req, res) => {
	try {
		const records = await knex('account_asset_tagged_assets_junc')
			.join('account_tag', 'account_tag.id', '=', 'account_asset_tagged_assets_junc.account_tag_id')
			.where({ 'account_tag.account_id': req.jwt.acc })
			.select({
				tag: 'account_tag.name',
				asset_id: 'account_asset_tagged_assets_junc.account_asset_id'
			});

		const result = {};

		for (const record of records) {
			if (!result.hasOwnProperty(record.asset_id)) {
				result[record.asset_id] = [];
			}
			result[record.asset_id].push(record.tag);
		}

		res.json(result);
	} catch (err) {
		console.error(err);
		res.sendStatus(500);
	}
};

module.exports.addTag = async (req, res) => {
	try {
		// @todo use composite keys and Promise.all to fix this mess
		const existingRecords = await knex('account_tag')
			.where({
				'account_tag.name': req.body.name
			});

		if (existingRecords.length) {
			const tagId = existingRecords.map((tag) => tag.name === req.body.name).id;
			const existingRecordsOnJunc = await knex('account_asset_tagged_assets_junc')
				.where({
					'account_asset_tagged_assets_junc.account_asset_id': req.body.asset_id,
					'account_asset_tagged_assets_junc.account_tag_id': tagId
				});
			if (existingRecordsOnJunc.length) {
				res.sendStatus(400);
			} else {
				await knex('account_asset_tagged_assets_junc').insert({
					id: uuidv4(),
					account_asset_id: req.body.asset_id,
					account_tag_id: tagId
				});
			}
		} else {
			const tagId = uuidv4();
			await knex('account_tag').insert({
				id: tagId,
				account_id: req.jwt.acc,
				name: req.body.name
			});
			await knex('account_asset_tagged_assets_junc').insert({
				id: uuidv4(),
				account_asset_id: req.body.asset_id,
				account_tag_id: tagId
			});
			res.sendStatus(200);
		}
	} catch (err) {
		console.error(err);
		res.sendStatus(500);
	}
};

module.exports.deleteTag = async (req, res) => {
	try {
		const record = await knex('account_tag').where({
			'account_tag.name': req.params.id,
			'account_tag.account_id': req.jwt.acc
		});
		try {
			await knex('account_asset_tagged_assets_junc').where({
				'account_asset_tagged_assets_junc.account_asset_id': req.body.asset_id,
				'account_asset_tagged_assets_junc.account_tag_id': record[0].id
			}).del();
		} catch (err) {
			console.log(err);
		}

		// @todo composite keys = if none left delete permanently from account_tag table
		res.sendStatus(200);
	} catch (err) {
		console.error(err);
		res.sendStatus(500);
	}
};
