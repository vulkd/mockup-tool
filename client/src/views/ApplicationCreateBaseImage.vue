<template>
	<div class='h-full bg-black flex-1' ref='workingArea'>
		<TheTitleBar>
			<div slot='title' v-on='{ click: baseImage ? onTitleClick : () => {}}' class='cursor-pointer flex justify-between items-center pr-4'>
				<input v-if='baseImage' ref='titleInput' v-show='isEditingTitle' :value='baseImage.name' @blur='onTitleInputBlur' @keyup.enter='onTitleInputBlur' class='w-full px-4'>
				<div v-show='!isEditingTitle' class='flex justify-between items-center w-full'>
					<b class='tracking-wide mr-4'>{{ baseImage ? baseImage.name : 'Modify a Base Image' }}</b>
					<Icon v-if='baseImage' name='edit'></Icon>
				</div>
			</div>

			<div v-if='baseImage' slot='content' class='flex'>
				<Button :class="{'disabled': isLoading}" class='ml-4' @click='onClickSave' icon='save' color='green'>Save Changes</Button>
				<Button class='ml-4' icon='trash-alt' color='pink' @click='onClickDelete'>Delete Base Image</Button>
			</div>
		</TheTitleBar>

		<!-- Canvas -->
		<div class='flex-1 flex flex-col w-full md:flex-row overflow-hidden h-full'>
			<div class='md:border-r bg-white dark:bg-black dark:border-gray-700 w-full h-32 md:w-40 md:h-full overflow-x-auto overflow-y-hidden md:overflow-x-hidden md:overflow-y-auto'>
				<ThumbnailSelect
				label='Select Base Image'
				v-if='baseImagesOptions.length'
				:options='baseImagesOptions'
				@input='onClickThumbnailBaseImage'
				></ThumbnailSelect>
				<div v-else class='text-center pt-2'>
					<router-link to='/app/library/base-images' class='text-sm text-indigo-500 underline'>Add base image</router-link>
				</div>
			</div>

			<div class='md:border-r bg-white dark:bg-black dark:border-gray-700 w-full h-32 md:w-40 md:h-full overflow-x-auto overflow-y-hidden md:overflow-x-hidden md:overflow-y-auto'>
				<!-- Same as ThumbnailSelect -->
				<div class='px-4 pb-4' v-if='baseImagesOptions.length'>
					<div class='flex items-center justify-between md:block'>
						<b class='my-2 block text-xs'>Masks</b>
						<span class='my-2 block text-xxxs text-gray-500 dark:text-gray-600'>1 required to use in mockup</span>
					</div>

					<div class='md:pt-1 md:block flex md:flex-col flex-row h-20 md:h-auto overflow-x-auto overflow-y-hidden md:overflow-x-hidden md:overflow-y-auto'>
						<div
						v-for='(mask, maskIdx) in baseImage ? baseImage.masks : []'
						:key='maskIdx'
						@click='onClickMaskThumbnail(mask, maskIdx)'
						class='hover-translate-y flex-shrink-0 select-none cursor-pointer relative mr-2 md:mb-4 md:mr-0 overflow-hidden'>
						<svg :ref='`maskSvg${maskIdx}`' class='mask-preview' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none' :stroke-width='mask.id === selectedMaskId ? 24 : 8'></svg>
						<button @click='$refs.canvas.onLeafletControlClickDrawDelete(mask)' class='absolute opacity-0 hover:opacity-75 hover:bg-gray-700 top-0 right-0 bg-black w-4 h-4 text-white rounded-sm flex justify-center items-center mt-2 mr-2'><Icon name='trash-alt' scale='.75' class=''></Icon></button>
					</div>
				</div>

				<Button v-if='$refs.canvas && !isDrawing && baseImage && baseImage.masks.length < MASK_COLORS.length' @click='$refs.canvas.onLeafletControlClickDrawPolygon' icon='vector-square'>Add Mask</Button>
			</div>
		</div>

		<BaseImageCanvas
		ref='canvas'
		:baseImage='baseImage'
		@drawing='isDrawing=$event'
		@redrawMasks='drawMaskThumbnails'
		@maskEdit='drawMaskThumbnail'
		@maskClick='onInputMaskClick'
		></BaseImageCanvas>
	</div>
</div>
</template>

<script>
import TheTitleBar from '@/components/TheTitleBar';
import ThumbnailSelect from '@/components/Input/ThumbnailSelect';
import BaseImageCanvas from '@/components/ApplicationBaseImage/BaseImageCanvas';

import { fitPathToSvg } from '@/lib/svg';
import { MASK_COLORS } from '@/constants';

export default {
	components: {
		TheTitleBar,
		ThumbnailSelect,
		BaseImageCanvas
	},
	data() {
		return {
			isEditingTitle: false,
			activeBaseImage: [],
			selectedMaskId: null,
			isDrawing: false
		}
	},
	beforeRouteEnter (to, from, next) {
		next(async vm => {
			if (to.params.id) {
				await vm.$store.dispatch('User/Application/ApplicationBaseImage/loadBaseImage', to.params.id);
				vm.selectedMaskId = null;
				if (vm.baseImage) vm.$refs.canvas.setImage();
			}
		});
	},
	beforeRouteUpdate (to, from, next) {
		if (this.baseImage) this.$refs.canvas.setImage();
		this.selectedMaskId = null;
		next();
	},
	beforeRouteLeave (to, from, next) {
		this.$store.dispatch('User/Application/ApplicationBaseImage/unloadBaseImage');
		this.selectedMaskId = null;
		next();
	},
	created() {
		this.MASK_COLORS = MASK_COLORS;
	},
	mounted() {
		this.$refs.workingArea.style.height = `calc(100vh - ${21 + (this.$refs.workingArea.offsetTop * 2)}px)`;

		if (!this.baseImagesOptions.length) {
			this.$store.dispatch('User/Application/loadBaseImages');
		}
		if (this.baseImage) {
			this.$refs.canvas.setImage();
		}
	},
	computed: {
		isLoading() {
			return this.$store.state.isLoading;
		},
		accountId() {
			return this.$store.state.User.account_id;
		},
		baseImage() {
			return this.$store.getters['User/Application/ApplicationBaseImage/getBaseImage'];
		},
		baseImagesOptions() {
			return this.$store.state.User.Application.baseImages.map(i => ({
				name: i.name,
				id: i.id,
				src: `${process.env.VUE_APP_ROOT_API}/upload/${this.accountId}/asset-base/original/${i.src}`
			}));
		},
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
			this.$store.dispatch('User/Application/ApplicationBaseImage/updateBaseImage', { name: e.target.value });
		},
		async onClickThumbnailBaseImage({ selected, value }) {
			const id = selected[0];
			if (this.$route.params.id === id) return;
			await this.$store.dispatch('User/Application/ApplicationBaseImage/loadBaseImage', id);
			this.$router.push({ name: 'application-create-base-image', params: { id }});
		},
		onClickSave() {
			this.$store.dispatch('User/Application/ApplicationBaseImage/saveBaseImage');
		},
		onClickDelete() {
			if (confirm('Are you sure? This will remove the image from any mockups using it')) {
				this.$store.dispatch('User/Application/removeBaseImage', this.baseImage);
			}
		},
		onClickMaskThumbnail(mask, maskIdx) {
			if (this.selectedMaskId === mask.id) {
				this.selectedMaskId = null;
				this.$refs.canvas.setActiveMask(mask, null);
			} else {
				this.$refs.canvas.setActiveMask(mask, maskIdx);
			}
		},
		onInputMaskClick(maskId) {
			this.selectedMaskId = maskId;
		},
		drawMaskThumbnails() {
			for (const maskIdx in this.baseImage.masks) {
				this.drawMaskThumbnail(maskIdx);
			}
		},
		drawMaskThumbnail(maskIdx) {
			this.$nextTick(() => {
				const pathElMask = this.$refs.canvas.$el.querySelectorAll('.leaflet-editable-feature')[maskIdx];
				const svgElMask = pathElMask.parentElement.parentElement;

				const pathElMaskPreview = document.createElementNS('http://www.w3.org/2000/svg', 'path');
				pathElMaskPreview.setAttribute('d', pathElMask.getAttribute('d'));
				pathElMaskPreview.setAttribute('fill', pathElMask.getAttribute('fill'));
				pathElMaskPreview.setAttribute('stroke', pathElMask.getAttribute('stroke'));
				pathElMaskPreview.setAttribute('fill-opacity', pathElMask.getAttribute('fill-opacity'));

				const svgElMaskPreview = this.$refs[`maskSvg${maskIdx}`][0];
				svgElMaskPreview.setAttribute('viewBox', svgElMask.getAttribute('viewBox'));
				svgElMaskPreview.innerHTML = '';
				svgElMaskPreview.appendChild(pathElMaskPreview);

				fitPathToSvg(pathElMaskPreview, svgElMaskPreview);
			});
		}
	}
};
</script>

<style scoped>
.mask-preview:hover + button {
	opacity: 75%;
}
</style>
