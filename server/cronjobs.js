/** @module cronjobs */

// const config = require('config');
const CronJob = require('cron').CronJob;

// const requestPromiseNative = require("request-promise-native");

// @weekly
// find all password reset tokens and their expiry fields where the expiry fields are > 1hr and set them to NULL
// @todo write sql bulk update method
new CronJob('0 0 * * 3', () => {
	const title = 'destroy old password reset tokens';
	try {
		// knex('account_user')
		// 	.where('reset_password_link_expires', '<=', Date.now() + config.constants.time.HOUR_MS)
		// 	.update({
		// 		reset_password_token: null,
		// 		reset_password_link_expires: null
		// 	});
		console.log('CRON success:', title);
	} catch (err) {
		console.log('CRON error:', title, 'message:', err);
	}
}, null, true);

// @weekly
// update valid TLD list (to use in email validity checking)
// @todo write strict validator
// new CronJob("0 0 * * 4", () => {
// 	const title = "update valid tld list"
// 	requestPromiseNative.get("http://data.iana.org/TLD/tlds-alpha-by-domain.txt").then(resp => {
// 		const arr = resp.data.toString().split("\n").map(tld => tld.toLowerCase());
// 		const file = fs.createWriteStream("./util/validTlds-new.js");
// 		file.on('error', (err) => { throw new Error("File handling error.") });
// 		file.write(`module.exports = ['${arr.join(', ')}'];`);
// 		file.end();
// 		console.log("CRON success:", title)
// 	}).catch(error => {
// 		console.log("CRON error:", title, "message:", error)
// 	});
// }, null, true);

// @daily
// Invoice users
// @todo
// new CronJob("0 0 * * *", () => {
// }, null, true);

// @todo
// update cloudflare ips
// v4_ips = requests.get('https://www.cloudflare.com/ips-v4', timeout=1)
// v6_ips = requests.get('https://www.cloudflare.com/ips-v6', timeout=1)
