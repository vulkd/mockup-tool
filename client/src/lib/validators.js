export default {
	email(emailAddress) {
		return emailAddress.length > 5 && emailAddress.includes(".");
	}
};
