/** @module mailer */

'use strict';

const config = require('config');
const path = require('path');
const nodemailer = require('nodemailer');
const Email = require('email-templates');
const templatesDir = path.resolve(__dirname, 'templates');

let transport;

const stub = require('nodemailer-stub-transport')();
transport = nodemailer.createTransport(stub);

// switch (config.MAIL_TRANSPORT) {
// 	case 'stub': {
// 		const stub = require('nodemailer-stub-transport')();
// 		transport = nodemailer.createTransport(stub);
// 		break;
// 	}
// 	case 'smtp': {
// 		transport = {
// 			host: config.MAIL_SERV_HOST,
// 			port: config.MAIL_SERV_PORT,
// 			secure: config.MAIL_SERV_SECURE
// 		};
// 		if (process.env.NODE_ENV === 'production') {
// 			if (!config.MAIL_SERV_USERNAME || !config.MAIL_SERV_PASSWORD) {
// 				// @todo big error
// 				console.log('ERROR! NO MAIL AUTH!!!');
// 			}
// 			transport.auth = {
// 				user: config.MAIL_SERV_USERNAME,
// 				pass: config.MAIL_SERV_PASSWORD
// 			};
// 		} else if (process.env.NODE_ENV === 'development') {
// 			transport.tls = {
// 				rejectUnauthorized: false
// 			};
// 		}
// 		transport = nodemailer.createTransport(transport);
// 		break;
// 	}
// 	default: {
// 		throw new Error(`Invalid transport: ${config.MAIL_TRANSPORT}`);
// 	}
// }

// if (process.env.NODE_ENV !== "production") {
// 	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
// }

/**
 * @async
 * @param {String} template
 * @param {String} toAddress
 * @param {String} fromAddress
 * @param {String} subject
 * @param {Object} locals
 * @returns {void}
 */
async function sendEmail(template, toAddress, fromAddress, subject, locals) {
	try {
		const email = new Email({
			message: {
				from: fromAddress || config.MAIL_FROM_ADDR
			},
			// uncomment below to send emails in development/test env:
			send: true,
			transport,
			preview: false

			// transport: {
			// 	jsonTransport: true
			// }
		});

		locals = {
			...locals,
			hostname: config.HOSTNAME
		};

		await email.send({
			template: path.join(templatesDir, template),
			message: {
				to: toAddress,
				subject
			},
			locals
		});
	} catch (err) {
		// @todo logbot email
		console.log(err);
	}
}

module.exports.send = sendEmail;
