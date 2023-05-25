// @todo test

const dotenv = require('dotenv').config({ path: '.env' });
const _ = require('lodash');
const config = require('config');
const stripe = require('stripe')(config.STRIPE_SECRET_KEY);
const uuidv4 = require('uuid/v4');

const knex = require('./models');

// @todo @asap try catch
async function createCustomer(customer, accountUserId) {
	const resp = await stripe.customers.create({ ...customer });

	const recordId = uuidv4();

	await knex('account_stripe_customer').insert({
		id: recordId,
		customer_id: resp.id,
		account_id: accountUserId,
		..._.pick(resp, ['name', 'email'])
	});

	return {
		id: recordId,
		customer_id: resp.id
	};
}

// @todo @asap try catch
async function createSubscription(customer, last4, plan) {
	const resp = await stripe.subscriptions.create({
		customer: customer.customer_id,
		items: [{ plan: plan.plan_id }]
	});

	const stripePlan = await knex('stripe_plan')
		.first()
		.where({ plan_id: plan.plan_id });

	await knex('account_stripe_customer_subscription').insert({
		id: uuidv4(),
		subscription_id: resp.id,
		default_payment_card_last4: parseInt(last4),
		account_stripe_customer_id: customer.id,
		stripe_plan_id: stripePlan.id, ..._.pick(resp, ['start_date', 'current_period_end', 'status'])
	});
// @todo @asap before launch active might be set to false and we have to reject the payment (stripe will allow it for 23hr)
// You now have a customer subscribed to a plan. If the first payment succeeds,
// the subscription is in status active. Otherwise, the status is incomplete and
// the subscription expires in 23 hours unless payment on the latest_invoice is collected.
// Behind the scenes, Stripe creates further invoices for every billing cycle.
// The invoice outlines what the customer owes, reflects when they will be or were charged,
// and tracks the payment status. You can even add additional items to an invoice to factor in one-off charges like setup fees.
//
// Since most subscription activity happens automatically from this point forward
// (see the invoice workflow and lifecycle docs for more detail), you’ll want to
// establish webhooks to be notified of events as they occur.
}

async function getSubscriptionsAll() {
	const subscriptions = await stripe.subscriptions.list();
}

async function getCustomers() {

}

async function doesCustomerHaveSubscription(customer, subscription) {
	const subscriptions = await stripe.subscriptions.list({ customer: customer.id });
}

// await stripe.products.list()
// return await stripe.plans.list({expand: ["data.product"]});
async function getAvailableProducts() {
	const products = await stripe.products.list({ active: true });
	const activeProducts = await knex('stripe_products').where({ active: true });
	const activeProductIds = activeProducts.map((activeProduct) => activeProduct.product_id);
	return products.data.filter((product) => activeProductIds.includes(product.id));
}

// @todo @asap try catch
async function getAvailablePlans() {
	const plans = await stripe.plans.list({ active: true, expand: ['data.product'] });
	const activePlans = await knex('stripe_plan').where({ active: true });
	const activePlanIds = activePlans.map((activePlan) => activePlan.plan_id);
	return plans.data.filter((plan) => activePlanIds.includes(plan.id));
}

module.exports = {
	createCustomer,
	createSubscription,
	getAvailablePlans,
	getAvailableProducts
};

// @todo @asap try catch
async function createProduct(product) {
	const resp = await stripe.products.create(product);
	const recordId = uuidv4();
	await knex('stripe_product').insert({
		id: recordId,
		product_id: resp.id,
		..._.pick(resp, ['name', 'type', 'active'])
	});
	return {
		id: recordId,
		name: resp.name
	};
}

// @todo @asap try catch
async function createPlan(plan, product) {
	const resp = await stripe.plans.create({ ...plan, product: product.product_id });
	const recordId = uuidv4();
	await knex('stripe_plan').insert({
		id: recordId,
		plan_id: resp.id,
		stripe_product_id: product.id,
		..._.pick(resp, ['nickname', 'amount', 'interval', 'currency', 'active'])
	});
	return {
		id: recordId,
		name: resp.name
	};
}

module.exports.init = async () => {
	if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
		// await seedPlans();
	}
};

async function seedPlans() {
	console.log('stripe.js - seeding plans');
	// Create some bogus plans and just test the db for them in testing (unless stripe.js specific testing - then we should do that - webhooks and all etc.)
	const PRODUCT_BASIC = { name: 'AcmeBot Basic', type: 'service' };
	const PRODUCT_PREMIUM = { name: 'AcmeBot Premium', type: 'service' };
	const PLAN_BASIC = { amount: 5000, interval: 'month', currency: 'USD' };
	const PLAN_PREMIUM = { amount: 30000, interval: 'month', currency: 'USD' };

	try {
		const stripePlans = await stripe.plans.list({ active: true, expand: ['data.product'] });
		if (stripePlans.data.length < 2) {
			let product;
			let plan;
			product = await createProduct(PRODUCT_BASIC);
			plan = await createPlan({...PLAN_BASIC, nickname: `${product.name} Plan`}, product);
			product = await createProduct(PRODUCT_PREMIUM);
			plan = await createPlan({...PLAN_PREMIUM, nickname: `${product.name} Plan`}, product);
		}
		await knex('stripe_product').whereNotNull('id').del();
		await knex('stripe_plan').whereNotNull('id').del();

		const STRIPE_BASIC_PLAN = stripePlans.data.find((x) => x.nickname === 'AcmeBot Basic Plan');
		const STRIPE_PREMIUM_PLAN = stripePlans.data.find((x) => x.nickname === 'AcmeBot Premium Plan');
		const STRIPE_BASIC_PROD = STRIPE_BASIC_PLAN.product;
		const STRIPE_PREMIUM_PROD = STRIPE_PREMIUM_PLAN.product;

		const STRIPE_BASIC_PROD_recordId = uuidv4();
		await knex('stripe_product').insert({
			id: STRIPE_BASIC_PROD_recordId,
			product_id: STRIPE_BASIC_PROD.id,
			..._.pick(STRIPE_BASIC_PROD, ['name', 'type', 'active'])
		});

		const STRIPE_PREMIUM_PROD_recordId = uuidv4();
		await knex('stripe_product').insert({
			id: STRIPE_PREMIUM_PROD_recordId,
			product_id: STRIPE_PREMIUM_PROD.id,
			..._.pick(STRIPE_PREMIUM_PROD, ['name', 'type', 'active'])
		});

		const STRIPE_BASIC_PLAN_recordId = uuidv4();
		await knex('stripe_plan').insert({
			id: STRIPE_BASIC_PLAN_recordId,
			stripe_product_id: STRIPE_BASIC_PROD.id,
			plan_id: STRIPE_BASIC_PLAN.id,
			..._.pick(STRIPE_BASIC_PLAN, ['nickname', 'interval', 'amount', 'currency', 'active'])
		});

		const STRIPE_PREMIUM_PLAN_recordId = uuidv4();
		await knex('stripe_plan').insert({
			id: STRIPE_PREMIUM_PLAN_recordId,
			stripe_product_id: STRIPE_PREMIUM_PROD.id,
			plan_id: STRIPE_PREMIUM_PLAN.id,
			..._.pick(STRIPE_PREMIUM_PLAN, ['nickname', 'interval', 'amount', 'currency', 'active'])
		});
	} catch (error) {
		console.log(error);
	}
}
module.exports.seedPlans = seedPlans;
