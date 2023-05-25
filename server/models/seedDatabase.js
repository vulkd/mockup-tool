// @todo add maxlen, etc
// @todo also enums
// @todo multiple constraints

/* eslint-disable no-magic-numbers */

const knex = require('./index');

let SHOULD_SEED_PLANS;

(async function () { // eslint-disable-line func-names
	if (!await knex.schema.hasTable('account')) {
		await knex.schema.createTable('account', (table) => {
		// table.increments('id')
			table.uuid('id').primary().notNullable();
			table.timestamp('date_created').defaultTo(knex.fn.now());
			table.timestamp('date_updated').defaultTo(knex.fn.now());
			table.timestamp('date_deleted');
		});
	}

	if (!await knex.schema.hasTable('account_stripe_customer')) {
		await knex.schema.createTable('account_stripe_customer', (table) => {
			table.uuid('id').primary().notNullable();
			table.timestamp('date_created').defaultTo(knex.fn.now());
			table.timestamp('date_updated').defaultTo(knex.fn.now());
			table.timestamp('date_deleted');
			table.string('customer_id').notNullable();
			table.string('name');
			table.string('email').notNullable();
			table.uuid('account_id').references('id').inTable('account').notNullable().unique();
		});
	}

	if (!await knex.schema.hasTable('account_stripe_customer_subscription')) {
		await knex.schema.createTable('account_stripe_customer_subscription', (table) => {
			table.uuid('id').primary().notNullable();
			table.timestamp('date_created').defaultTo(knex.fn.now());
			table.timestamp('date_updated').defaultTo(knex.fn.now());
			table.timestamp('date_deleted');
			table.timestamp('start_date').notNullable();
			table.timestamp('current_period_end').notNullable();
			table.string('status');
			table.string('subscription_id').unique().notNullable();
			table.string('default_payment_card_last4', 4);
			table.uuid('account_stripe_customer_id').references('id').inTable('account_stripe_customer').notNullable();
			table.uuid('stripe_plan_id').references('id').inTable('stripe_plan').notNullable();
		});
	}

	if (!await knex.schema.hasTable('stripe_plan')) {
		await knex.schema.createTable('stripe_plan', (table) => {
			table.uuid('id').primary().notNullable();
			table.timestamp('date_created').defaultTo(knex.fn.now());
			table.timestamp('date_updated').defaultTo(knex.fn.now());
			table.timestamp('date_deleted');
			table.string('plan_id').unique().notNullable();
			table.string('nickname').notNullable();
			table.string('interval').notNullable();
			table.integer('amount').notNullable();
			table.string('currency').notNullable();
			table.boolean('active').notNullable();
			table.uuid('stripe_product_id').references('id').inTable('stripe_product').notNullable();
		});
	}

	if (!await knex.schema.hasTable('stripe_product')) {
		await knex.schema.createTable('stripe_product', (table) => {
			table.uuid('id').primary().notNullable();
			table.timestamp('date_created').defaultTo(knex.fn.now());
			table.timestamp('date_updated').defaultTo(knex.fn.now());
			table.timestamp('date_deleted');
			table.string('product_id').unique().notNullable();
			table.string('name').notNullable();
			table.string('type').notNullable();
			table.boolean('active').notNullable();
		});

		SHOULD_SEED_PLANS = true;
	}

	if (!await knex.schema.hasTable('account_user')) {
		await knex.schema.createTable('account_user', (table) => {
			table.uuid('id').primary().notNullable();
			table.timestamp('date_created').defaultTo(knex.fn.now());
			table.timestamp('date_updated').defaultTo(knex.fn.now());
			table.timestamp('date_deleted');
			table.string('name').notNullable();
			table.string('email').unique().notNullable();
			table.string('email_lower').notNullable();
			table.string('password').notNullable();
			table.string('password_salt');
			table.boolean('is_activated');
			table.string('activation_token');
			table.string('activation_token_expires');
			table.string('reset_password_token');
			table.string('reset_password_link_expires');
			table.integer('sign_in_count').unsigned().defaultTo(0);
			table.timestamp('current_sign_in_at');
			table.timestamp('last_sign_in_at');
			table.string('avatar');
			table.string('role').notNullable().defaultTo('user');
			// table.uuid('role_id').references('id').inTable('account_user_role').notNullable();
			table.uuid('account_id').references('id').inTable('account').notNullable();
		});
	}

	// if (!await knex.schema.hasTable('account_user_role')) {
	// 	await knex.schema.createTable('account_user_role', (table) => {
	// 		table.uuid('id').primary().notNullable()
	// 		table.timestamp('date_created').defaultTo(knex.fn.now())
	// 		table.timestamp('date_updated').defaultTo(knex.fn.now())
	// 		table.timestamp('date_deleted')
	// 		table.string('name')
	// 		table.uuid('account_id').references('id').inTable('account').notNullable();
	// 	});
	// }

	if (!await knex.schema.hasTable('account_tag')) {
		await knex.schema.createTable('account_tag', (table) => {
			table.uuid('id').primary().notNullable();
			table.timestamp('date_created').defaultTo(knex.fn.now());
			table.timestamp('date_updated').defaultTo(knex.fn.now());
			table.timestamp('date_deleted');
			table.string('name');
			table.uuid('account_id').references('id').inTable('account').notNullable();
			table.unique(['account_id', 'name']);
			// @todo composite unique on account_id + name
		});
	}

	if (!await knex.schema.hasTable('account_asset')) {
		await knex.schema.createTable('account_asset', (table) => {
			table.uuid('id').primary().notNullable();
			table.timestamp('date_created').defaultTo(knex.fn.now());
			table.timestamp('date_updated').defaultTo(knex.fn.now());
			table.timestamp('date_deleted');
			table.uuid('created_by_account_user_id').references('id').inTable('account_user').notNullable();
			table.uuid('updated_by_account_user_id').references('id').inTable('account_user').notNullable();
			table.uuid('account_id').references('id').inTable('account').notNullable();
		});
	}

	if (!await knex.schema.hasTable('account_asset_mask')) {
		await knex.schema.createTable('account_asset_mask', (table) => {
			table.uuid('id').primary().notNullable();
			table.timestamp('date_created').defaultTo(knex.fn.now());
			table.timestamp('date_updated').defaultTo(knex.fn.now());
			table.timestamp('date_deleted');
			table.integer('z').notNullable().default(0);
			table.string('mask').notNullable(); // nw,nw ne,ne se,se sw,sw
			table.uuid('account_asset_image_base_id').references('id').inTable('account_asset_mask_id');
		});
	}

	if (!await knex.schema.hasTable('account_asset_tagged_assets_junc')) {
		await knex.schema.createTable('account_asset_tagged_assets_junc', (table) => {
			table.uuid('id').primary().notNullable();
			table.timestamp('date_created').defaultTo(knex.fn.now());
			table.timestamp('date_updated').defaultTo(knex.fn.now());
			table.timestamp('date_deleted');
			table.uuid('account_tag_id').references('id').inTable('account_tag').notNullable();
			table.uuid('account_asset_id').references('id').inTable('account_asset').notNullable();
		});
	}

	if (!await knex.schema.hasTable('account_asset_image_base')) {
		await knex.schema.createTable('account_asset_image_base', (table) => {
			table.uuid('id').primary().notNullable();
			table.timestamp('date_created').defaultTo(knex.fn.now());
			table.timestamp('date_updated').defaultTo(knex.fn.now());
			table.timestamp('date_deleted');
			table.string('name');
			table.string('desc');
			table.string('originalname').notNullable();
			table.string('mimetype');
			table.string('filename').notNullable();
			table.integer('size').notNullable();
			table.uuid('account_asset_id').references('id').inTable('account_asset').notNullable().unique();
		});
	}

	if (!await knex.schema.hasTable('account_asset_image_brand')) {
		await knex.schema.createTable('account_asset_image_brand', (table) => {
			table.uuid('id').primary().notNullable();
			table.timestamp('date_created').defaultTo(knex.fn.now());
			table.timestamp('date_updated').defaultTo(knex.fn.now());
			table.timestamp('date_deleted');
			table.string('name');
			table.string('desc');
			table.string('originalname').notNullable();
			table.string('mimetype');
			table.string('filename').notNullable();
			table.integer('size').notNullable();
			table.uuid('account_asset_id').references('id').inTable('account_asset').notNullable().unique();
		});
	}

	if (!await knex.schema.hasTable('account_asset_mockup')) {
		await knex.schema.createTable('account_asset_mockup', (table) => {
			table.uuid('id').primary().notNullable();
			table.timestamp('date_created').defaultTo(knex.fn.now());
			table.timestamp('date_updated').defaultTo(knex.fn.now());
			table.timestamp('date_deleted');
			table.string('name');
			table.string('desc');
			table.uuid('account_asset_id').references('id').inTable('account_asset').notNullable().unique();
		});
	}

	if (!await knex.schema.hasTable('account_asset_mockup_base_images_junc')) {
		await knex.schema.createTable('account_asset_mockup_base_images_junc', (table) => {
			table.uuid('id').primary().notNullable();
			// table.timestamp('date_created').defaultTo(knex.fn.now())
			// table.timestamp('date_updated').defaultTo(knex.fn.now())
			// table.timestamp('date_deleted')
			table.uuid('account_asset_mockup_id').references('id').inTable('account_asset_mockup').notNullable();
			table.uuid('account_asset_image_base_id').references('id').inTable('account_asset_image_base').notNullable();
		});
	}

	// also acts as junc
	if (!await knex.schema.hasTable('account_asset_mockup_brand_image')) {
		await knex.schema.createTable('account_asset_mockup_brand_image', (table) => {
			table.uuid('id').primary().notNullable();
			// table.timestamp('date_created').defaultTo(knex.fn.now())
			// table.timestamp('date_updated').defaultTo(knex.fn.now())
			// table.timestamp('date_deleted')
			table.float('mod_scale').defaultTo(1);
			table.float('mod_rotate').defaultTo(0);
			table.float('mod_hue').defaultTo(180);
			table.float('mod_saturation').defaultTo(50);
			table.float('mod_lightness').defaultTo(50);
			table.float('mod_alpha').defaultTo(1);
			table.string('mod_blendmode');
			// table.uuid('custom_account_asset_mask_id').references('id').inTable('account_asset_mask').unique();
			table.uuid('account_asset_mask_id').references('id').inTable('account_asset_mask').notNullable();
			table.uuid('account_asset_image_brand_id').references('id').inTable('account_asset_image_brand').notNullable();
			table.uuid('account_asset_mockup_id').references('id').inTable('account_asset_mockup').notNullable();
		});
	}

	if (SHOULD_SEED_PLANS) {
		if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
			require('../stripe').seedPlans();
			// await seedPlans();
		}
	}
})();

// table.enu('column', ['value1', 'value2'], { useNative: true, enumName: 'foo_type' })
// table.unique(["source_id", "attachment_id"]);

