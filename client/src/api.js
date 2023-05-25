import axios from "axios";
import store from "./store";
import router from "./router";

const axiosInstance = axios.create({
	baseURL: process.env.VUE_APP_ROOT_API,
	withCredentials: true,
	config: {
		headers: {
			"content-type": "application/json"
			// "access-control-allow-origin": "https://byzantine.test",
			// "access-control-allow-methods": "GET,PUT,POST,DELETE"
		}
	}
});

// Request interceptor:
// - Add the CSRF token to requests
// - Return errors as usual
axiosInstance.interceptors.request.use((request) => {
	if (store.state.Auth.csrfToken) {
		request.headers["x-xsrf-token"] = store.state.Auth.csrfToken;
	}

	return request;
}, (error) => {
	throw error
});

// Response interceptor:
// - Refresh tokens
axiosInstance.interceptors.response.use((response) => response, async (error) => {
	// Store the original request.
	const originalRequest = error.config;

	// If the token is expired, refresh the token.
	if (
		error.response &&
		error.response.status &&
		error.response.status === 401 &&
		error.response.headers["www-authenticate"] &&
		!originalRequest._retry
	) {
		originalRequest._retry = true;

		try {
			await store.dispatch("Auth/refreshToken");
			// Repeat the original request
			originalRequest.headers["x-xsrf-token"] = store.state.Auth.csrfToken;
			return axios(originalRequest);
		} catch (error) {
			// Refresh failed. Logout.
			store.dispatch("Auth/logout");
			return Promise.reject(error);
		}
	}

	// Return any error not due to refreshing tokens:
	return Promise.reject(error);
});

export default axiosInstance;
