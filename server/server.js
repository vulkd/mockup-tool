const config = require('config');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');

// @todo write pino into logbot
const pino = require('pino')();
// Use existing pino logger
const expressPino = require('express-pino-logger')({
	logger: pino
});
const { logbot } = require('./util/logbot');
const { resolveError } = require('./util/expressHelpers');

const app = express();
app.locals.env = process.env.NODE_ENV;
app.set('trust proxy', true);
// app.set('port', config.APP_PORT);
app.use(expressPino);
app.use(cookieParser());

// @todo set a limit for json bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging') {
	app.use(cors({
		origin: 'http://127.0.0.1:8080',
		credentials: true
	}));
}

// @see nginx.prod.conf for CSP policy
app.use(helmet());
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));
// Helmet not removing x-powered-by...
app.disable('x-powered-by');

app.use('/upload', express.static(path.join(__dirname, 'upload')));

// /routes
app.use(config.NGINX_PROXY_PATH, require('./routes/public'));
app.use(`${config.NGINX_PROXY_PATH}/account/`, require('./routes/account'));
app.use(`${config.NGINX_PROXY_PATH}/app/`, require('./routes/application'));

app.post('/report-violation', (req, res) => {
	logbot(config.LOGBOT_LVL_ERROR, 'CSP Violation');
	resolveError(res, 204);
});

app.get('*', (req, res) => resolveError(res, 404));

app.use((error, req, res, next) => {
	if (error) {
		logbot(config.LOGBOT_LVL_WARN, error);
		resolveError(res, error.status);
	} else {
		next();
	}
});

module.exports = app;
