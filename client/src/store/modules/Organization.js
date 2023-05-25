import Vue from 'vue';

const defaultState = () => ({
	users: []
});

const state = defaultState();

const mutations = {
	LOAD_USERS(state, users) {
		Vue.set(state, 'users', users);
	}
};

const actions = {
	async loadUsers({ commit, dispatch }) {
		dispatch('setLoading', true, { root: true });
		try {
			const resp = await this.$http.get('/account/all');
			commit('LOAD_USERS', resp.data);
		} catch (error) {
			console.log(error);
		}
		dispatch('setLoading', false, { root: true });
	},
	async addUser({ commit, dispatch }, { name, email }) {
		dispatch('setLoading', true, { root: true });
		try {
			await this.$http.post('/account', { name, email });
			dispatch('setMessages', { infoMessage: `An invitation email was sent to ${email}! The activation link will expire in 24hrs` }, { root: true });
		} catch (error) {
			dispatch('setMessages', { errorMessage: error }, { root: true });
		}
		dispatch('setLoading', false, { root: true });
	},
	async deleteUser({ commit, dispatch }, { feedback }) {
		// dispatch('setLoading', true, { root: true });
		// try {
		// 	await this.$http.delete('/account');
		// 	this.$http.post('/feedback', { feedback });
		// 	dispatch('Auth/logout', null, { root: true }); // unloads user
		// 	this.$router.push('/');
		// } catch (error) {
		// 	dispatch('setMessages', { errorMessage: 'There was an error with your request' }, { root: true });
		// }
		// dispatch('setLoading', false, { root: true });
	}
};

const getters = {
};

export default {
	namespaced: true,
	state,
	mutations,
	actions,
	getters
};
