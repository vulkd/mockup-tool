<template>
	<div class='h-full bg-black'>

		<!-- Title Bar -->
		<TheTitleBar>
			<div slot='title' v-on='{ click: mockup ? onTitleClick : () => {}}'  class='cursor-pointer flex justify-between items-center pr-4 w-72'>
				<input ref='titleInput' v-show='isEditingTitle' :value='mockup.name' @blur='onTitleInputBlur' @keyup.enter='onTitleInputBlur' class='w-full px-4'>
				<div v-show='!isEditingTitle' class='flex justify-between items-center w-full'>
					<b class='tracking-wide mr-4'>{{ mockup ? mockup.name : 'Create a Mockup' }}</b>
					<Icon v-if='mockup' name='edit'></Icon>
				</div>
			</div>

			<div slot='content' v-if='activeBaseImages.length' class='flex'>
				<Button @click='onClickRender' class='mr-4' icon='star-half-alt' color='yellow'>Render</Button>
				<Button @click='onClickSave' :class="{'disabled': isLoading}" class='mr-4' icon='save' color='green'>Save</Button>
				<Button @click='onClickDelete' :class="{'disabled': isLoading}"  class='mr-4' icon='trash-alt' color='pink'>Delete Mockup</Button>
				<div class='px-4 flex items-center select-none'>
					<InputToggle v-model='shouldShowMasks' onIcon='eye' offIcon='eye-slash'></InputToggle>
					<label class="uppercase text-xxs text-gray-300 font-bold pl-4 dark:text-gray-700">Masks</label>
				</div>
				<div class='px-4 flex items-center select-none'>
					<InputToggle v-model='shouldDisplayMosaic' onIcon='th' offIcon='indent'></InputToggle>
					<label class="uppercase text-xxs text-gray-300 font-bold pl-4 dark:text-gray-700">Grid Layout</label>
				</div>
			</div>
		</TheTitleBar>

		<!-- Working Area -->
		<div class='flex-1 flex flex-col w-full md:flex-row overflow-hidden' ref='workingArea'>
			<!-- Thumbs Left (Base Images) -->
			<div class='md:border-r bg-white dark:bg-black dark:border-gray-700 w-full h-32 md:w-40 md:h-full overflow-x-auto overflow-y-hidden md:overflow-x-hidden md:overflow-y-auto'>
				<ThumbnailSelect label='Base Images' :multiple='true' v-if='baseImagesOptions.length' :options='baseImagesOptions' @input='onChangeBaseImages'></ThumbnailSelect>
				<div v-else class='text-center pt-2'>
					<router-link to='/app/library/base-images' class='text-sm text-indigo-500 underline'>Add base image and mask</router-link>
				</div>
			</div>

			<!-- Thumbs Right (Brand Images) -->
			<div class='md:border-r bg-white dark:bg-black dark:border-gray-700 w-full h-32 md:w-40 md:h-full overflow-x-auto overflow-y-hidden md:overflow-x-hidden md:overflow-y-auto'>
				<ThumbnailSelect :subLabel='!activeBaseImages.length ? "Select base image" : null' :class="{ 'disabled': !activeBaseImages.length }" label='Brand Images' :multiple='true' :selectionColors='MASK_COLORS' :disabledLimit='MASK_COLORS.length' v-if='brandImagesOptions.length' :options='brandImagesOptions' @input='onChangeBrandImages'></ThumbnailSelect>
				<div v-else class='text-center pt-2'>
					<router-link to='/app/library/brand-images' class='text-sm text-indigo-500 underline'>Add brand image</router-link>
				</div>
			</div>

			<!-- Canvas -->
			<div ref='mockupArea' class='flex-1 p-2 overflow-auto bg-black w-full h-full relative'>
				<div v-for='(baseImage, idx) in activeBaseImages' :key='baseImage.id' class='float-left p-2'>
					<MockupCanvas
					:shouldShowMasks='shouldShowMasks'
					:selectionColors='MASK_COLORS'
					:baseImage='baseImage'
					></MockupCanvas>
				</div>
			</div>
		</div>

	</div>
</template>

<script>
import Button from '@/components/Button';
import Input from '@/components/Input/Input';
import TheTitleBar from '@/components/TheTitleBar';
import ThumbnailSelect from '@/components/Input/ThumbnailSelect';
import InputToggle from '@/components/Input/InputToggle';
import MockupCanvas from '@/components/ApplicationMockup/MockupCanvas';

import { MASK_COLORS } from '@/constants';

export default {
	components: {
		Button,
		Input,
		TheTitleBar,
		InputToggle,
		ThumbnailSelect,
		MockupCanvas
	},
	async beforeRouteEnter (to, from, next) {
		next(async vm => {
			if (!to.params.id) {
				const id = await vm.$store.dispatch('User/Application/ApplicationMockup/addMockup');
				vm.$router.push({ name: 'application-create-mockup', params: { id }});
			} else if (!to.params.id.startsWith('tmp-')) {
				await vm.$store.dispatch('User/Application/ApplicationMockup/loadMockup', to.params.id);
			}
		});
	},
	async beforeRouteUpdate (to, from, next) {
		if (to.params.id && !to.params.id.startsWith('tmp-')) {
			await this.$store.dispatch('User/Application/ApplicationMockup/loadMockup', to.params.id);
		}

		// if (this.baseImage) this.$refs.canvas.setImage();
		// this.selectedMaskId = null;
		next();
	},
	beforeRouteLeave (to, from, next) {
		// todo warn of unsaved changes

		this.$store.dispatch('User/Application/ApplicationMockup/unloadMockup');
		// this.selectedMaskId = null;
		next();
	},
	data() {
		return {
			isEditingTitle: false,
			activeBrandImage: [],
			shouldShowMasks: true,
			shouldDisplayMosaic: false
		}
	},
	computed: {
		isLoading() {
			return this.$store.state.isLoading;
		},
		mockup() {
			return this.$store.state.User.Application.ApplicationMockup;
		},
		activeBaseImages() {
			return this.$store.getters['User/Application/ApplicationMockup/activeBaseImages'];
		},
		baseImagesOptions() {
			return this.$store.state.User.Application.baseImages
			.filter(i => i.masks.length)
			.map(i => ({
				name: i.name,
				id: i.id,
				masks: i.masks,
				src: `${process.env.VUE_APP_ROOT_API}/upload/${this.$store.state.User.account_id}/asset-base/128/${i.src}`
			}));
		},
		brandImagesOptions() {
			return this.$store.state.User.Application.brandImages
			.map(i => ({
				name: i.name,
				id: i.id,
				src: `${process.env.VUE_APP_ROOT_API}/upload/${this.$store.state.User.account_id}/asset-brand/128/${i.src}`
			}));
		}
	},
	watch: {
		activeBaseImages(value) {
			this.$nextTick(() => {
				this.reorderMockupArea();
			});
		}
	},
	created() {
		this.MASK_COLORS = MASK_COLORS;
	},
	mounted() {
		this.$refs.workingArea.style.height = `calc(100vh - ${this.$refs.workingArea.offsetTop}px)`;

		//if (!this.baseImages.length) this.$store.dispatch('User/Application/loadBaseImages');
		//if (!this.brandImages.length) this.$store.dispatch('User/Application/loadBrandImages');
		this.$store.dispatch('User/Application/loadBaseImages');
		this.$store.dispatch('User/Application/loadBrandImages');

		if (this.mockup) {
			this.$nextTick(() => {
				this.reorderMockupArea();
			});
		}

		window.onresize = () => {
			if (this.activeBaseImages.length) {
				this.reorderMockupArea();
			}
		}
	},
	methods: {
		onTitleClick() {
			this.isEditingTitle = true;
			this.$nextTick(() => {
				this.$refs.titleInput.focus();
				this.$refs.titleInput.select();
			});
		},
		onTitleInputBlur(e) {
			this.isEditingTitle = false;
			this.$store.dispatch('User/Application/ApplicationMockup/updateMockup', { name: e.target.value });
		},
		onChangeBrandImages({ selected, value }) {
			if (selected.includes(value.id)) {
				// next available mask id (set specific when user drags, not when thumb select)
				this.$store.dispatch(`User/Application/ApplicationMockup/addBrandImage`, value.id);
			} else {
				this.$store.dispatch(`User/Application/ApplicationMockup/removeBrandImage`, value.id);
			}
			this.$store.dispatch(`User/Application/ApplicationMockup/selectBrandImage`, value.id);
		},
		onChangeBaseImages({ selected, value }) {
			if (selected.includes(value.id)) {
				const masks = {}
				for (const mask of value.masks) {
					masks[mask.id] = {
						brandImage: {}
					}
				}
				this.$store.dispatch(`User/Application/ApplicationMockup/addBaseImage`, {
					baseImageId: value.id,
					masks
				});
			} else {
				this.$store.dispatch(`User/Application/ApplicationMockup/removeBaseImage`, value.id);
			}
			this.$store.dispatch(`User/Application/ApplicationMockup/selectBaseImage`, value.id);
		},
		async onClickRender(e) {
			// @todo save first!
			this.$http.post(`app/render/${this.mockup.id}`);
		},
		async onClickSave(e) {
			if (this.$route.params.id.startsWith('tmp-')) {
				await this.$store.dispatch(`User/Application/ApplicationMockup/saveNewMockup`);
			} else {
				await this.$store.dispatch(`User/Application/ApplicationMockup/saveMockup`, this.mockup);
			}
		},
		onClickDelete(e) {
			if (confirm('Are you sure? This mockup will be unrecoverable, and any renders will be lost.')) {
				this.$store.dispatch('User/Application/removeMockup', this.mockup);
				this.$nextTick(() => {
					this.$router.push({ name: 'application-library-mockups' });
				});
			}
		},
		reorderMockupArea() {
			const maxCols = 3;

			const mockupArea = this.$refs.mockupArea;
			const mockupAreaBbox = mockupArea.getBoundingClientRect();
			const mockupCanvases = document.querySelectorAll('.mockupCanvas');
			const count = mockupCanvases.length;

			const cardWidth = mockupAreaBbox.width / ( count >= maxCols ? maxCols : count);

			const padding = 4;
			for (const card of mockupCanvases) {
				card.style.width = `${cardWidth - (padding * 2)}px`;
			}


			// let cards = [...mockupCanvases];
			// const colsPerRow = mockupAreaBbox.width / cardWidth;
			// const totalRows = Math.ceil(cards.length / colsPerRow);

		// 	// https://stackoverflow.com/questions/1484506/random-color-generator
		// 	function getRandomColor() {
		// 	  var letters = '0123456789ABCDEF';
		// 	  var color = '#';
		// 	  for (var i = 0; i < 6; i++) {
		// 	    color += letters[Math.floor(Math.random() * 16)];
		// 	  }
		// 	  return color;
		// 	}


		// 	const cardsWrapper = mockupArea;
		// 	const sortCards = () => {
		// 		let row = [];
		// 		let rowPrev = [];
		// 		const cardsProcessed = [];

		// 		const cardWidth = 200;
		// 		const totalRows = cards.length / (cardsWrapper.offsetWidth / cardWidth);

		// 		for (let rowIdx = 0; rowIdx < totalRows; rowIdx++)  {
		// 			rowPrev = row.slice();
		// 			row = [];

		// 			for (const card of cards.filter((c, idx) => !cardsProcessed[idx])) {
		// 				if (card.offsetTop === 0) row.push(card);
		// 				else break;
		// 			}

		// 			const rowColor = getRandomColor();

		// 			let currentRowWidth = 0;
		// 			for (const colIdx in row) {
		// 				const card = row[colIdx];
		// 				const cardPrevBbox = rowIdx ? rowPrev[colIdx].getBoundingClientRect() : null;
		// 				card.style.position = 'absolute';
		// 				card.style.top = rowIdx ? `${(cardPrevBbox.y - cardsWrapper.offsetTop) + cardPrevBbox.height}px` : 0;
		// 				card.style.left = `${currentRowWidth}px`;
		// 				card.style.background = rowColor;
		// 				currentRowWidth += card.clientWidth;
		// 				cardsProcessed.push(colIdx);
		// 			}
		// 		}
		// 	}

		// 	sortCards();
		}
	}
};
</script>
