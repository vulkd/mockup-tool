const config = require('config');
const path = require('path');

const DATABASE_NAME = `${config.DATABASE_NAME}_${process.env.NODE_ENV}`;

if (config.DATABASE_TYPE === 'pg') {
	module.exports = require('knex')({
		client: 'pg',
		version: '9.5',
		connection: {
			host: config.DATABASE_POSTGRES_HOST,
			port: config.DATABASE_POSTGRES_PORT,
			user: config.DATABASE_POSTGRES_USER,
			password: config.DATABASE_POSTGRES_PASSWORD,
			database: DATABASE_NAME
		}
	});
} else if (config.DATABASE_TYPE === 'sqlite3') {
	module.exports = require('knex')({
		client: config.DATABASE_TYPE,
		connection: {
			filename: path.join(__dirname, '../..', `${DATABASE_NAME}.sqlite3`)
		},
		useNullAsDefault: true
	});
} else {
	throw new Error('config.DATABASE_TYPE not valid');
}
