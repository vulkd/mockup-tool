import Vue from 'vue';
import router from '../../router';

const defaultMask = () => ({
	nw: { x: 0, y: 0 },
	ne: { x: 0, y: 0 },
	se: { x: 0, y: 0 },
	sw: { x: 0, y: 0 }
});

const defaultState = () => ({
	id: '',
	asset_id: '',
	name: '',
	desc: '',
	src: '',
	masks: [] // { mask: {nwse}, z: int }
});

const state = defaultState();

const mutations = {
	LOAD_BASE_IMAGE(state, baseImage) {
		state = Object.assign(state, baseImage);
	},

	UNLOAD_BASE_IMAGE(state) {
		state = Object.assign(state, defaultState());
	},

	ADD_MASK(state, mask) {
		state.masks.push(mask);
	},

	SET_MASK(state, mask) {
		const idx = state.masks.findIndex(i => mask.id === i.id);
		Vue.set(state.masks, idx, mask);
	},
	UPDATE_MASK_ID(state, { oldId, newId }) {
		const idx = state.masks.findIndex(i => i.id === oldId);
		Vue.set(state.masks[idx], 'id', newId);
	},
	DESTROY_MASK(state, mask) {
		const idx = state.masks.findIndex(i => mask.id === i.id);
		// Keep with 'del-' prefix. Server uses 'del-' prefix to ascertain masks to
		// delete when patching base image.
		Vue.set(state.masks, idx, { ...mask, id: `del-${mask.id}` });
		// Vue.delete(state.masks, idx);
	},

	UPDATE_BASE_IMAGE(state, payload) {
		for (const k of Object.keys(payload)) {
			Vue.set(state, k, payload[k]);
		}
	}
	// REORDER_MASK()
};

const actions = {
	async loadBaseImage({ commit, dispatch }, baseImageId) {
		dispatch('setLoading', true, { root: true });
		try {
			const resp = await this.$http.get(`app/asset/base/${baseImageId}`);
			commit('LOAD_BASE_IMAGE', resp.data);
		} catch (err) {
			console.error(err);
		}
		dispatch('setLoading', false, { root: true });
	},
	async unloadBaseImage({ commit }) {
		commit('UNLOAD_BASE_IMAGE');
	},

	async updateBaseImage({ commit }, baseImageData) {
		try {
			commit('UPDATE_BASE_IMAGE', baseImageData);
		} catch (err) {
			console.error(err);
		}
	},

	async saveBaseImage({ commit, state, dispatch }) {
		// Returns promise so we can wait for Leaflet map when changing images
		return new Promise(async (resolve, reject) => {
			dispatch('setLoading', true, { root: true });
			try {
				const resp = await this.$http.patch(`app/asset/base/${state.id}`, {
					asset_id: state.asset_id,
					masks: state.masks,
					desc: state.desc,
					name: state.name
				});

				if (Object.keys(resp.data).length) {
					for (const oldMaskId of Object.keys(resp.data)) {
						commit('UPDATE_MASK_ID', {
							oldId: oldMaskId,
							newId: resp.data[oldMaskId]
						});
					}
				}

				dispatch('User/Application/updateBaseImage', state.id, { root: true });
				dispatch('setMessages', { infoMessage: 'Saved' }, { root: true });
				resolve()
			} catch (err) {
				console.error(err);
				reject(err);
				dispatch('setMessages', { errorMessage: err }, { root: true });
			}
			dispatch('setLoading', false, { root: true });
		})
	},

	async addMask({ commit }, mask) {
		if (!mask.id) console.log('store addMask err: mask needs id')
		else commit('ADD_MASK', mask);
	},

	async setMask({ commit }, mask) {
		if (!mask.id) console.log('store setMask err: mask needs id')
		else commit('SET_MASK', mask);
	},

	async destroyMask({ commit }, mask) {
		try {
			commit('DESTROY_MASK', mask);
		} catch (err) {
			console.error(err)
		}
	},
};

const getters = {
	getBaseImage: (state, getters, rootState) => {
		if (!state.id) return null;
		const accountId = rootState.User.account_id;
		return {
			...state,
			masks: state.masks.filter(mask => !mask.id.startsWith('del-')),
			src: `${process.env.VUE_APP_ROOT_API}/upload/${accountId}/asset-base/original/${state.src}`
		}
	}
};

export default {
	namespaced: true,
	state,
	mutations,
	actions,
	getters
};
