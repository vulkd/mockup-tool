import Vue from 'vue';
import Application from './Application';

const defaultState = () => ({
	name: '',
	email: '',
	role: '',
	last_sign_in_at: '',
	avatar_src: '',
	account_id: ''
});

const state = defaultState();

const mutations = {
	LOAD_USER(state, user) {
		state = Object.assign(state, user);
	},
	UNLOAD_USER(state) {
		state = defaultState();
	},
	PATCH_USER(state, payload) {
		state = Object.assign(state, payload);
	},
	SET_USER_AVATAR(state, payload) {
		Vue.set(state, 'avatar_src', payload);
	}
};

const actions = {
	async loadUser({ commit, dispatch }) {
		dispatch('setLoading', true, { root: true });
		try {
			const resp = await this.$http.get('/account');
			commit('LOAD_USER', resp.data);
		} catch (error) {
			console.log(error);
		}
		dispatch('setLoading', false, { root: true });
	},
	async unloadUser({ commit }) {
		commit('UNLOAD_USER');
	},
	async deleteUser({ commit, dispatch }, { feedback }) {
		dispatch('setLoading', true, { root: true });
		try {
			await this.$http.delete('/account');
			this.$http.post('/feedback', { feedback });
			dispatch('Auth/logout', null, { root: true }); // unloads user
			this.$router.push('/');
		} catch (error) {
			dispatch('setMessages', { errorMessage: 'There was an error with your request' }, { root: true });
		}
		dispatch('setLoading', false, { root: true });
	},
	async patchUser({ commit, dispatch }, { name, email, password, confirmPassword }) {
		dispatch('setLoading', true, { root: true });
		dispatch('setMessages', {}, { root: true });
		setTimeout(async () => {
			try {
				const resp = await this.$http.patch('/account', { name, email, password, confirmPassword });
				const newCsrfToken = resp.headers['x-xsrf-token'];
				if (newCsrfToken) await dispatch('Auth/setCsrfToken', newCsrfToken, { root: true });
				commit('PATCH_USER', { name, email });
				dispatch('setMessages', { infoMessage: 'Changes saved' }, { root: true });
			} catch (error) {
				console.log(error);
				dispatch('setMessages', { errorMessage: error && error.response && error.response.data && error.response.data.message ? error.response.data.message : 'There was an error with your request' }, { root: true });
			}
			dispatch('setLoading', false, { root: true });
		}, 500);
	},
	async postUserAvatar({ commit, dispatch }, formData) {
		dispatch('setLoading', true, { root: true });
		dispatch('setMessages', {}, { root: true });
		try {
			const resp = await this.$http.post('account/avatar', formData);
			commit('SET_USER_AVATAR', resp.data.src);
			dispatch('setMessages', { infoMessage: 'Changes saved' }, { root: true });
		} catch (err) {
			dispatch('setMessages', { errorMessage: err }, { root: true });
		}
		dispatch('setLoading', false, { root: true });
	}
};

const getters = {
	isUserAdmin: (state) => state.role === 'admin'
};

export default {
	namespaced: true,
	state,
	mutations,
	actions,
	getters,
	modules: {
		Application
	}
};
