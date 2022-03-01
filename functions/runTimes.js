const { getLastRunTime, submitQuery } = require('../sql');

const getStartTime = async (type) => {
	const data = await getLastRunTime(type);
	const lastRunTime = data[0].LastRunTime;

	// Date.prototype.addHours = function (h) {
	// 	this.setTime(this.getTime() + h * 60 * 60 * 1000);
	// 	return this;
	// };

	const date = new Date();
	let year = date.getFullYear();
	let month = ('0' + (date.getMonth() + 1)).slice(-2);
	let day = ('0' + date.getDate()).slice(-2);
	let hour = ('0' + date.getHours()).slice(-2);
	let min = ('0' + date.getMinutes()).slice(-2);
	let seconds = ('0' + date.getSeconds()).slice(-2);
	let milliseconds = ('00' + date.getMilliseconds()).slice(-3);
	const currentTime = `${year}-${month}-${day}T${hour}:${min}:${seconds}.${milliseconds}-05:00`;

	return {
		lastRunTime: lastRunTime,
		nextRunTime: currentTime,
	};
};

const submitStartTime = async (type, currentTime) => {
	const res = await submitQuery(
		`INSERT INTO AndromedaSchedule VALUES('${type}', '${currentTime}')`
	);
	return res;
};

module.exports = {
	getStartTime,
	submitStartTime,
};
