
import Vue from 'vue';
import Vuex from 'vuex';
import VuexPersistence from 'vuex-persist';

import api from '@/api';
Vuex.Store.prototype.$http = api;

import Auth from './modules/Auth';
import User from './modules/User';
import Organization from './modules/Organization';

Vue.use(Vuex);

const useSession = false;

const vuexStorage = new VuexPersistence({
	storage: useSession ? window.sessionStorage : window.localStorage,
	supportCircular: false,
	reducer: (state) => ({
		isSidebarCollapsed: state.isSidebarCollapsed,
		shouldUseDarkMode: state.shouldUseDarkMode,
		Auth: state.Auth,
	})
});

const defaultState = () => ({
	modal: null,
	errorMessage: '',
	infoMessage: '',
	isSidebarCollapsed: false,
	isLoading: false,
	shouldUseDarkMode: false
});

const state = defaultState();

const mutations = {
	TOGGLE_SIDEBAR_IS_COLLAPSED(state) {
		Vue.set(state, 'isSidebarCollapsed', !state.isSidebarCollapsed);
	},
	TOGGLE_DARK_MODE(state) {
		state.shouldUseDarkMode = !state.shouldUseDarkMode;
		document.querySelector('html').classList.toggle('mode-dark');
	},
	SET_MODAL(state, modalName) {
		state.modal = modalName
	},
	SET_MESSAGES(state, messages) {
		state = Object.assign(state, {errorMessage: '', infoMessage: '', ...messages});
	},
	SET_LOADING(state, isLoading) {
		state.isLoading = isLoading;
	}
};

const actions = {
	async toggleSidebarCollapsed({ commit }) {
		commit('TOGGLE_SIDEBAR_IS_COLLAPSED');
	},
	toggleDarkMode({ commit }) {
		commit('TOGGLE_DARK_MODE');
	},
	setModal({ commit }, modalName) {
		commit('SET_MODAL', modalName)
	},
	setMessages({ commit }, messages) {
		commit('SET_MESSAGES', messages);
	},
	setLoading({ commit }, isLoading) {
		commit('SET_LOADING', isLoading);
	}
};

export default new Vuex.Store({
	state,
	mutations,
	actions,
	modules: {
		Auth,
		User,
		Organization
	},
	plugins: [vuexStorage.plugin],
	strict: process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging'
});
