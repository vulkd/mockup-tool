import Vue from 'vue';
import ApplicationMockup from './ApplicationMockup';
import ApplicationBaseImage from './ApplicationBaseImage';

const defaultState = () => ({
	baseImages: [],
	brandImages: [],
	mockups: [],
	tags: {}
});

const state = defaultState();

const mutations = {
	LOAD_APPLICATION_STATE(state, payload) {
		state = Object.assign(state, payload);
	},
	UNLOAD_APPLICATION_STATE(state) {
		state = defaultState();
	},






	LOAD_BASE_IMAGES(state, baseImages) {
		Vue.set(state, 'baseImages', baseImages)
	},
	ADD_BASE_IMAGE(state, baseImage) {
		state.baseImages.unshift(baseImage);
	},
	UPDATE_BASE_IMAGE(state, baseImage) {
		const idx = state.baseImages.findIndex(i => baseImage.id === i.id);
		Vue.set(state.baseImages, idx, baseImage);
	},
	REMOVE_BASE_IMAGE(state, baseImageId) {
		const baseImageIdx = state.baseImages.findIndex(x => x.id === baseImageId);
		Vue.delete(state.baseImages, baseImageIdx);
	},
	SET_ACTIVE_BASE_IMAGE(state, baseImage) {
		state.activeBaseImage = baseImage;
	},



	LOAD_BRAND_IMAGES(state, brandImages) {
		Vue.set(state, 'brandImages', brandImages)
	},
	ADD_BRAND_IMAGE(state, brandImage) {
		state.brandImages.unshift(brandImage);
	},
	UPDATE_BRAND_IMAGE(state, brandImage) {
		const idx = state.brandImages.findIndex(i => brandImage.id === i.id);
		Vue.set(state.brandImages, idx, brandImage);
	},
	REMOVE_BRAND_IMAGE(state, brandImageId) {
		const brandImageIdx = state.brandImages.findIndex(x => x.id === brandImageId);
		Vue.delete(state.brandImages, brandImageIdx);
	},



	LOAD_MOCKUPS(state, mockups) {
		Vue.set(state, 'mockups', mockups)
	},
	UPDATE_MOCKUP(state, mockup) {
		const idx = state.mockups.findIndex(i => mockup.id === i.id);
		Vue.set(state.mockups, idx, mockup);
	},
	REMOVE_MOCKUP(state, mockupId) {
		const mockupIdx = state.mockups.findIndex(x => x.id === mockupId);
		Vue.delete(state.mockups, mockupIdx);
	},

	LOAD_TAGS(state, tags) {
		Vue.set(state, 'tags', tags);
	},
	ADD_TAG(state, {tag, asset_id}) {
		if (!state.tags.hasOwnProperty(asset_id)) {
			Vue.set(state.tags, asset_id, []);
		}
		Vue.set(state.tags, asset_id, state.tags[asset_id].concat([tag]));
	},
	REMOVE_TAG(state, {tag, asset_id}) {
		const idx = state.tags[asset_id].indexOf(tag);
		Vue.delete(state.tags[asset_id], idx);
	}
};











const actions = {
	async loadTags({ commit }) {
		try {
			const resp = await this.$http.get('app/tags');
			const tags = resp.data;
			commit('LOAD_TAGS', tags);
		} catch (err) {
			console.error(err);
		}
	},
	async addTag({ commit }, { tag, asset_id }) {
		try {
			await this.$http.post('app/tag', {
				name: tag,
				asset_id: asset_id
			})
			commit('ADD_TAG', { tag, asset_id });
		} catch (err) {
			console.error(err);
		}
	},
	async removeTag({ commit }, { tag, asset_id }) {
		try {
			// api delete tag
			this.$http.delete(`app/tag/${tag}`, {
				data: {
					asset_id: asset_id
				}
			});
			commit('REMOVE_TAG', {tag, asset_id});
		} catch (err) {
			console.error(err);
		}
	},









	// load all
	// POST new
	// get specific record and update state with it
	// remvoe
	async loadBaseImages({ commit }) {
		try {
			const resp = await this.$http.get('app/asset/base/all');
			commit('LOAD_BASE_IMAGES', resp.data);
		} catch (err) {
			console.error(err);
		}
	},
	async addBaseImage({ commit, dispatch }, formData) {
		dispatch('setLoading', true, { root: true });
		try {
			const resp = await this.$http.post('app/asset/base', formData);
			if (resp.data.baseImages && resp.data.baseImages.length) {
				for (const newBaseImage of resp.data.baseImages) {
					commit('ADD_BASE_IMAGE', newBaseImage);
				}
			}
			if (resp.data.errors && resp.data.errors.length) {
				dispatch('setModal', { errorMessage: `${resp.data.baseImages.length} images uploaded successfully. ${resp.data.errors.length} failed to upload.` }, { root: true });
			} else {
				dispatch('setModal', { infoMessage: `${resp.data.baseImages.length} images uploaded successfully.` }, { root: true });
			}
		} catch (err) {
			console.error(err);
		}
		dispatch('setLoading', false, { root: true });
	},
	async updateBaseImage({ commit }, id) {
		try {
			const resp = await this.$http.get(`app/asset/base/${id}`);
			commit('UPDATE_BASE_IMAGE', resp.data);
		} catch (err) {
			console.error(err);
		}
	},
	async removeBaseImage({ commit }, baseImage) {
		try {
			commit('REMOVE_BASE_IMAGE', baseImage.id);
			this.$http.delete(`/app/asset/base/${baseImage.id}`);
		} catch (err) {
			console.error(err);
		}
	},








	// load all
	// POST new
	// get specific record and update state with it
	// remvoe


	async loadBrandImages({ commit, dispatch }) {
		try {
			const resp = await this.$http.get('app/asset/brand/all');
			commit('LOAD_BRAND_IMAGES', resp.data);
		} catch (err) {
			console.error(err);
		}
	},
	async addBrandImage({ commit, dispatch }, formData) {
		dispatch('setLoading', true, { root: true });
		try {
			const resp = await this.$http.post('app/asset/brand', formData);
			if (resp.data.brandImages && resp.data.brandImages.length) {
				for (const bewBrandImage of resp.data.brandImages) {
					commit('ADD_BRAND_IMAGE', bewBrandImage);
				}
			}
			if (resp.data.errors && resp.data.errors.length) {
				dispatch('setModal', { errorMessage: `${resp.data.brandImages.length} images uploaded successfully. ${resp.data.errors.length} failed to upload.` }, { root: true });
			} else {
				dispatch('setModal', { infoMessage: `${resp.data.brandImages.length} images uploaded successfully.` }, { root: true });
			}
		} catch (err) {
			console.error(err);
		}
		dispatch('setLoading', false, { root: true });
	},
	async updateBrandImage({ commit }, id) {
		try {
			const resp = await this.$http.get(`app/asset/brand/${id}`);
			commit('UPDATE_BRAND_IMAGE', resp.data);
		} catch (err) {
			console.error(err);
		}
	},
	async removeBrandImage({ commit }, brandImage) {
		try {
			commit('REMOVE_BRAND_IMAGE', brandImage.id);
			this.$http.delete(`/app/asset/brand/${brandImage.id}`);
		} catch (err) {
			console.error(err);
		}
	},









	// load all
	// POST new
	// get specific record and update state with it
	// remvoe

	async loadMockups({ commit }) {
		try {
			const resp = await this.$http.get('app/asset/mockup/all');
			commit('LOAD_MOCKUPS', resp.data);
		} catch (err) {
			console.error(err);
		}
	},
	async updateMockup({ commit, dispatch }, id) {
		try {
			const resp = await this.$http.get(`app/asset/mockup/${id}`);
			commit('UPDATE_MOCKUP', resp.data);
		} catch (err) {
			console.error(err);
		}
	},
	async removeMockup({ commit }, mockup) {
		try {
			this.$http.delete(`/app/asset/mockup/${mockup.id}`);
			commit('REMOVE_MOCKUP', mockup.id);
		} catch (err) {
			console.error(err);
		}
	},












};

const getters = {
};

export default {
	namespaced: true,
	state,
	mutations,
	actions,
	getters,
	modules: {
		ApplicationMockup,
		ApplicationBaseImage
	}
};
