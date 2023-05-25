module.exports.getDaysInMonth = (dateTime) => {
	const month = dateTime.getMonth();
	const year = dateTime.getYear();
	return new Date(year, month, 0).getDate() + 1;
}

module.exports.getFirstDayOfCurrentMonth = () => {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), 1);
}

module.exports.getLastDayOfCurrentMonth = () => {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth() + 1, 0);
}

module.exports.dateToUtcEpoch = (date) => {
	const MS_PER_MINUTE = 60000;
	const OFFSET = new Date().getTimezoneOffset();
	let epoch = date.getTime();
	if (OFFSET === 0) return epoch;
	let offsetConverted;
	if (OFFSET < 0) offsetConverted = new Date(epoch - ((Math.abs(OFFSET)) * MS_PER_MINUTE));
	else if (OFFSET > 0) offsetConverted = new Date(epoch + (OFFSET * MS_PER_MINUTE));
	return offsetConverted.getTime();
}

const convertDateToUtc = (date) => new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
module.exports.convertDateToUtc = convertDateToUtc;
