import Vue from 'vue';
import router from '@/router';

let renewTimeout;

const defaultState = () => ({
	isAuthenticated: false,
	csrfToken: null
});

const state = defaultState();

const mutations = {
	AUTH_SET_IS_AUTH(state, isAuthenticated) {
		state.isAuthenticated = isAuthenticated;
	},
	AUTH_SET_CSRFTOKEN(state, csrfToken) {
		Vue.set(state, 'csrfToken', csrfToken);
	}
};

const actions = {
	setCsrfToken({ commit }, csrfToken) {
		commit('AUTH_SET_CSRFTOKEN', csrfToken);
	},

	setIsAuthenticated({ commit }, isAuthenticated) {
		commit('AUTH_SET_IS_AUTH', isAuthenticated);
	},

	async join({ commit, dispatch }, { name, email, password, stripeToken, last4, plan, firstName }) {
		dispatch('setLoading', true, { root: true });
		try {
			await this.$http.post('join', { name: name.trim(), email: email.trim(), password, stripeToken, last4, plan, firstName });
			await dispatch('signin', { email, password, remember_me: false, firstName });
			dispatch('setLoading', false, { root: true });
		} catch (err) {
			setTimeout(() => {
				dispatch('setMessages', { errorMessage:
					err && err.response && err.response.data && err.response.data.message
					? err.response.data.message
					: 'There was an error with your request. Please email contact@byzantine.test if you\'re having legitimate problems!'
				}, { root: true });
				dispatch('setLoading', false, { root: true });
			}, 500);
			return err
		}
	},

	async signin({ commit, dispatch }, { email, password, remember_me, firstName }) {
		try {
			dispatch('setLoading', true, { root: true });
			const resp = await this.$http.post('signin', { email: email.trim(), password, remember_me, firstName });
			commit('AUTH_SET_IS_AUTH', true);
			commit('AUTH_SET_CSRFTOKEN', resp.headers['x-xsrf-token']);

			// Attempt to renew the refresh token X seconds before it expires
			const renewAt = parseInt(resp.headers['x-renew-at']);
			const now = new Date();
			clearTimeout(renewTimeout);
			renewTimeout = renewAt ? setTimeout(() => dispatch('refreshToken'), renewAt - Math.round(now.getTime() / 1000)) : null;
			router.push({ name: 'account' });
			dispatch('setLoading', false, { root: true });
		} catch (err) {
			setTimeout(() => {
				dispatch('setMessages', {
					errorMessage:
					err && err.response && err.response.status && err.response.status === 401 ? 'Email address or password is invalid'
					: err && err.response && err.response.status && err.response.status === 429 ? 'Too many attempts. Please try again soon - If you\'re having trouble accessing your account, please email contact@byzantine.test'
					: 'There was an error! Please try again soon'
				}, { root: true });
				dispatch('setLoading', false, { root: true });
			}, 500);
		}
	},

	async logout({ commit, dispatch }) {
		try {
			dispatch('setLoading', true, {root: true});
			commit('AUTH_SET_IS_AUTH', false);
			dispatch('User/unloadUser', null, { root: true });
			clearTimeout(renewTimeout);
			await this.$http.post('signout');
		} catch (err) {
			console.log('logout err', err);
		}
		router.replace({ name: 'signin' });
		dispatch('setLoading', false, { root: true });
	},

	async refreshToken({ commit, dispatch }) {
		try {
			const resp = await this.$http.post('refreshtoken');

			commit('AUTH_SET_IS_AUTH', true);
			commit('AUTH_SET_CSRFTOKEN', resp.headers['x-xsrf-token']);

			// Attempt to renew the refresh token X seconds before it expires
			// const renewAt = parseInt(resp.headers['x-renew-at']);
			// const now = new Date();
			// clearTimeout(renewTimeout);
			// renewTimeout = renewAt ? setTimeout(() => {
			// 	dispatch('refreshToken');
			// }, renewAt - Math.round(now.getTime() / 1000)) : null;
		} catch (error) {
			return error;
		}
	},

	async resetRequest({ commit, dispatch }, { email, firstName }) {
		dispatch('setLoading', true, {root: true});
		try {
			const resp = await this.$http.post('reset', { email, firstName });
			dispatch('setMessages', {infoMessage: `We've sent you a link to reset your password. Please check your ${email} inbox`}, { root: true });
			return true;
		} catch (err) {
			dispatch('setMessages', { errorMessage: 'There was an error with your request' }, { root: true });
		}
		dispatch('setLoading', false, { root: true });
	},

	async reset({commit, dispatch}, { password, token }) {
		dispatch('setLoading', true, {root: true});
		try {
			const resp = await this.$http.post(`reset/${token}`, { password }, this.$http.config);
			if (resp.data.email) await dispatch('signin', { email: resp.data.email, password });
			dispatch('setLoading', false, {root: true});
		} catch (err) {
			setTimeout(() => {
				dispatch('setMessages', { errorMessage:
					err && err.response && err.response.data && err.response.data.message
					? err.response.data.message
					: 'There was an error with your request. Please email contact@byzantine.test if you\'re having legitimate problems accessing your account'
				}, { root: true });
				dispatch('setLoading', false, { root: true });
			}, 500);
		}
	},

	async activateInvitation({ commit, dispatch }, { password, token }) {
		dispatch('setLoading', true, {root: true});
		try {
			const resp = await this.$http.post(`activate/${token}`, { password }, this.$http.config);
			if (resp.data.email) await dispatch('signin', { email: resp.data.email, password });
			dispatch('setLoading', false, {root: true});
		} catch (err) {
			setTimeout(() => {
				dispatch('setMessages', { errorMessage:
					err && err.response && err.response.data && err.response.data.message
					? err.response.data.message
					: 'There was an error with your request. Please email contact@byzantine.test if you\'re having legitimate problems accessing your account'
				}, { root: true });
				dispatch('setLoading', false, { root: true });
			}, 500);
		}
	}
};

const getters = {
	// isAuthenticated: (state) => state.isAuthenticated &&
	// token: (state) => state.token
};

export default {
	namespaced: true,
	state,
	mutations,
	actions,
	getters
};
