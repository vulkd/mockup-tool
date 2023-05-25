import Vue from "vue";
import router from "@/router";

import { uuidv4 } from '@/lib/uuid';

const defaultState = () => ({
	id: '',
	asset_id: '',
	name: '',
	desc: '',
	baseImages: {}, // [ { id: { masks: [ { id: null, brandimage: { id, mods: {} } } ] } } ]

	// baseImages: {
	// 	id: {
	// 		masks: {
	// 				id: {
		// 				brandImage: {
		// 					id: 000,
		// 					mods: 000
		// 				}
	// 			}
	// 	}
	// }

	selectedBaseImage: null,
	selectedBrandImage: null
});

const state = defaultState();

const mutations = {
	LOAD_MOCKUP(state, mockup) {
		state = Object.assign(state, mockup);
	},
	UNLOAD_MOCKUP(state) {
		state = Object.assign(state, defaultState());
	},
	UPDATE_MOCKUP(state, payload) {
		for (const k of Object.keys(payload)) {
			Vue.set(state, k, payload[k]);
		}
	},



	ADD_BASE_IMAGE(state, { baseImageId, masks}) {
		Vue.set(state.baseImages, baseImageId, { masks });
	},
	REMOVE_BASE_IMAGE(state, baseImageId) {
		Vue.delete(state.baseImages, baseImageId);
	},
	SELECT_BASE_IMAGE(state, baseImageId) {
		state.selectedBaseImage = baseImageId;
	},



	ADD_BRAND_IMAGE(state, brandImageId) {
		for (const baseImageId of Object.keys(state.baseImages)) {
			for (const maskId of Object.keys(state.baseImages[baseImageId].masks)) {
				if (state.baseImages[baseImageId].masks[maskId].brandImage &&
						!state.baseImages[baseImageId].masks[maskId].brandImage.id) {
					Vue.set(state.baseImages[baseImageId].masks[maskId], 'brandImage', {
						id: brandImageId,
						mods: {}
					});
					break;
				}
			}
		}
	},
	REMOVE_BRAND_IMAGE(state, brandImageId) {
		for (const baseImageId of Object.keys(state.baseImages)) {
			for (const maskId of Object.keys(state.baseImages[baseImageId].masks)) {
				if (state.baseImages[baseImageId].masks[maskId].brandImage &&
						state.baseImages[baseImageId].masks[maskId].brandImage.id &&
						state.baseImages[baseImageId].masks[maskId].brandImage.id === brandImageId) {
					Vue.set(state.baseImages[baseImageId].masks[maskId], 'brandImage', {});
				}
			}
		}
	},
	SELECT_BRAND_IMAGE(state, brandImageId) {
		state.selectedBrandImage = brandImageId;
	},
	REMOVE_BRAND_IMAGE_FROM_BASE_IMAGE(state, { baseImageId, brandImageId }) {

	},
	UPDATE_BRAND_IMAGE(state, { baseImageId, brandImageId, maskId, brandImageMods }) {

	}


};

const actions = {
	async loadMockup({ commit, dispatch }, mockupId) {
		dispatch("setLoading", true, { root: true });
		try {
			const resp = await this.$http.get(`app/asset/mockup/${mockupId}`);
			commit('LOAD_MOCKUP', resp.data);
		} catch (err) {
			console.error(err);
		}
		dispatch("setLoading", false, { root: true });
	},
	async unloadMockup({ commit }) {
		commit('UNLOAD_MOCKUP');
	},

	selectBaseImage({ commit }, baseImageId) {
		commit('SELECT_BASE_IMAGE', baseImageId);
	},




	async addBaseImage({ commit }, { baseImageId, masks }) {
		commit('ADD_BASE_IMAGE', { baseImageId, masks });
	},
	async removeBaseImage({ commit }, baseImageId) {
		commit('REMOVE_BASE_IMAGE', baseImageId);
	},
	async setBaseImageIds({ commit }, baseImageIds) {
		commit('SET_BASE_IMAGE_IDS', baseImageIds);
	},



	addBrandImage({ commit }, brandImageId) {
		commit('ADD_BRAND_IMAGE', brandImageId);
	},
	removeBrandImage({ commit }, brandImageId) {
		commit('REMOVE_BRAND_IMAGE', brandImageId);
	},
	selectBrandImage({ commit }, brandImageId) {
		commit('SELECT_BRAND_IMAGE', brandImageId);
	},


	async addMockup({ commit }) {
		try {
			const id = `tmp-${uuidv4()}`;
			commit('UPDATE_MOCKUP', { id, name: 'New Mockup' });
			return id;
		} catch (err) {
			console.error(err);
		}
	},

	async updateMockup({ commit }, mockupData) {
		try {
			commit('UPDATE_MOCKUP', mockupData);
		} catch (err) {
			console.error(err);
		}
	},

	async saveNewMockup({ commit, state, dispatch }) {
		dispatch("setLoading", true, { root: true });
		try {
			const resp = await this.$http.post('app/asset/mockup', {
				name: state.name,
				desc: state.desc,
				baseImages: state.baseImages
			});
			commit('UPDATE_MOCKUP', resp.data);
			dispatch('User/Application/updateMockup', state.id, { root: true });
			// await router push so setMessages is displayed
			await router.push({ name: 'application-create-mockup', params: { id: resp.data.id } });
			dispatch('setMessages', { infoMessage: 'Mockup saved successfully' }, { root: true });
		} catch (err) {
			console.error(err);
			dispatch('setMessages', { errorMessage: err }, { root: true });
		}
		dispatch("setLoading", false, { root: true });
	},

	async saveMockup({ commit, state, dispatch }, mockupData) {
		dispatch("setLoading", true, { root: true });
		try {
			const resp = await this.$http.patch(`app/asset/mockup/${state.id}`, {
				asset_id: state.asset_id,
				name: state.name,
				desc: state.desc,
				baseImages: state.baseImages
			});
			commit('UPDATE_MOCKUP', resp.data);
			dispatch('setMessages', { infoMessage: 'Mockup saved successfully' }, { root: true });
			dispatch('User/Application/updateMockup', state.id, { root: true });
		} catch (err) {
			console.error(err);
			dispatch('setMessages', { errorMessage: err }, { root: true });
		}
		dispatch("setLoading", false, { root: true });
	},

	// async setBrandImageId({ commit }, id) {
	// 	commit('SET_BRAND_IMAGE_ID', id);
	// }
};

const getters = {
	activeBaseImages: (state, getters, rootState) => {
		const _makeThisReactive = state.selectedBrandImage;

		const accountId = rootState.User.account_id;
		return rootState.User.Application.baseImages
		.slice()
		.filter(baseImage => Object.keys(state.baseImages).includes(baseImage.id) && baseImage.masks.length)
			// .sort((a, b) => state.baseImageIds.indexOf(a.id) - state.baseImageIds.indexOf(b.id))
			// .filter(baseImage => baseImage.id) shouldnt have '-del in rootstate baseimags'
		.map(baseImage => ({
			...baseImage,
			src: `${process.env.VUE_APP_ROOT_API}/upload/${accountId}/asset-base/original/${baseImage.src}`,
			masks: baseImage.masks
			.filter(mask => !mask.id.startsWith('del-'))
			.map(mask => ({ ...mask, mask: JSON.parse(mask.mask)}))
		}));
	},

	activeBrandImages: (state, getters, rootState) => {
		const _makeThisReactive = state.selectedBrandImage;

		const accountId = rootState.User.account_id;

		const brandImageIdsInUse = [];
		const baseImagesInUse = Object.keys(state.baseImages).map(k => state.baseImages[k]);
		for (const baseImage of baseImagesInUse) {
			for (const k of Object.keys(baseImage.masks)) {
				const mask = baseImage.masks[k]
				if (mask.brandImage && mask.brandImage.id) {
					brandImageIdsInUse.push(mask.brandImage.id)
				}
			}
		}

		return rootState.User.Application.brandImages
		.slice()
		.filter(brandImage => brandImageIdsInUse.includes(brandImage.id))
			// .sort((a, b) => state.brandImageIds.indexOf(a.id) - state.brandImageIds.indexOf(b.id))
		.map(brandImage => ({
			...brandImage,
			src: `${process.env.VUE_APP_ROOT_API}/upload/${accountId}/asset-brand/original/${brandImage.src}`
		}));
	}
};

export default {
	namespaced: true,
	state,
	mutations,
	actions,
	getters
};
