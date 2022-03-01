const express = require('express');
const app = express();

const { type } = require('./config.js');
// const { andromedaAuthorization } = require('./authorization.js');
// const { getStartTime, submitStartTime } = require('./functions/runTimes.js');
// const { sendErrorReport } = require('./functions/errorReporting.js');

const { getSQLServerData } = require('./sql')

const server = app.listen(6000, async () => {
	console.log('App is listening...');
	// let authorizationResult = await andromedaAuthorization();
	// console.log(authorizationResult)
	await getSQLServerData()

	// if (authorizationResult.indexOf('Error') === -1) {
	// 	console.log('Authorization complete');
	// 	///const { lastRunTime, nextRunTime } = await getStartTime(type);

	// 	// let allErrors = [
	// 	// 	{
	// 	// 		err: 'Test',
	// 	// 		lastId: 1,
	// 	// 	},
	// 	// ];

	// 	// allErrors = allErrors.flat();

	// 	// if (allErrors.length) {
	// 	// 	await sendErrorReport(allErrors, type);
	// 	// }

	// 	//await submitStartTime(type, nextRunTime);
	// }

	//process.kill(process.pid, 'SIGTERM');
});

process.on('SIGTERM', () => {
	server.close(() => {
		console.log('Process terminated');
	});
});
