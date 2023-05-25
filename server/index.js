/** @module server index */
if (!process.env.NODE_ENV) {
	throw 'MISSING NODE_ENV';
}
const dotenv = require('dotenv').config({ path: '.env' });
if (dotenv.error) {
	throw dotenv.error;
}
const config = require('config');
const fs = require('fs');

try {
	fs.mkdir(config.UPLOAD_DIR, () => {});
} catch (err) {
	// eslint-disable-line no-empty
}

if (config.APP_USE_CLUSTER) {
	const os = require('os');
	const cluster = require('cluster');
	const express = require('express');
	const app = express();

	if (cluster.isMaster) {
		console.log(`Starting ${process.env.NODE_ENV} server`);
		console.log('booting master', process.pid);

		require('./stripe').init();

		if (process.env.NODE_ENV === 'production') {
			require('./cronjobs');
		}

		let isShuttingDown;
		const workerCount = config.APP_WORKER_COUNT || Math.max(1, os.cpus().length - 1);

		cluster.on('message', (worker, message) => {
			console.log('cluster.on.message');
			console.log(message);
		});

		cluster.on('exit', (worker, code, signal) => {
			console.log('cluster.on.exit');
			console.log(isShuttingDown ? 'worker shutdown' : 'worker died');
			console.log(worker.process.pid, code, signal);
			if (!isShuttingDown) {
				cluster.fork();
			}
		});

		for (let i = 0; i < workerCount; i++) {
			cluster.fork();
		}

		// Shutdown force
		process.on('SIGINT', () => {
			console.log('process.on.SIGINT');
			process.exit(); // eslint-disable-line no-process-exit
		});

		// Shutdown gracefully
		process.on('SIGTERM', () => {
			console.log('process.on.SIGTERM');
			isShuttingDown = true;
			for (const worker of cluster.workers) {
				worker.send({ type: 'shutdown' });
				const timeout = setTimeout(() => worker.kill(), 20 * 1000);
				worker.on('disconnect', () => clearTimeout(timeout));
			}
			cluster.disconnect(() => {
				console.log('cluster.disconnect');
				process.exit(); // eslint-disable-line no-process-exit
			});
		});
	} else {
		console.log('booting worker', process.pid);
		require('./models/seedDatabase');
		app.use(require('./server')).listen(config.APP_PORT);
	}
} else {
	console.log(`${process.env.NODE_ENV} server starting...`);
	require('./models/seedDatabase');
	require('./stripe').init();
	require('./server').listen(config.APP_PORT, () => {
		console.log(`${process.env.NODE_ENV} server listening on port ${config.APP_PORT}`);
	});
}
