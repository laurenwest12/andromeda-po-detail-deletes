const express = require('express');
const app = express();

const { type } = require('./config.js');
const { connectDb } = require('./sql');
const { andromedaAuthorization } = require('./authorization.js');
// const { getStartTime, submitStartTime } = require('./functions/runTimes.js');
const { sendErrorReport } = require('./functions/errorReporting.js');

const { getSQLServerData } = require('./sql');

const server = app.listen(6000, async () => {
	console.log('Andromeda Revisions is running...');
	const authorizationResult = await andromedaAuthorization();
	const connectDbResult = await connectDb();

	const errors = [];

	if (
		authorizationResult.indexOf('Error') === -1 &&
		connectDbResult === 'Complete'
	) {
		console.log('Authorization complete');
		///const { lastRunTime, nextRunTime } = await getStartTime(type);

		// let allErrors = [
		// 	{
		// 		err: 'Test',
		// 		lastId: 1,
		// 	},
		// ];

		// allErrors = allErrors.flat();

		// if (allErrors.length) {
		// 	await sendErrorReport(allErrors, type);
		// }

		//await submitStartTime(type, nextRunTime);
	} else {
		if (authorizationResult.indexOf('Error') === -1) {
			errors.push({
				type,
				err: 'Andromeda Authorization Error',
			});
		}

		if (connectDbResult !== 'Complete') {
			errors.push({
				type,
				err: 'Connect DB Error',
			});
		}
	}

	if (errors.flat().length) {
		await sendErrorReport(errors.flat(), type);
	}

	process.kill(process.pid, 'SIGTERM');
});

process.on('SIGTERM', () => {
	server.close(() => {
		console.log('Process terminated');
	});
});
