<template>
	<div class='relative bg-black h-full w-full select-none'>

		<ApplicationCanvasUi>
			<div class='flex'>
				<div v-show='!selectedBrandImage' @click='() => {}'  class='canvas-ui--btn h-8 cursor-pointer bg-black hover:bg-gray-700 flex justify-center items-center rounded px-2 py-1'>
					Click a brand image to modify it
				</div>
			</div>
		</ApplicationCanvasUi>

		<canvas
		v-show='shouldShowMasks'
		ref='elCanvasMask'
		class='z-40 absolute w-full pointer-events-none'
		></canvas>

		<!-- <canvas ref='foreground' class='z-30 absolute w-full pointer-events-none'></canvas> -->

		<BrandImageCanvas
		v-for='brandImage,idx in activeBrandImages'
		:key='brandImage.id'
		:ref='`brandImageCanvas-${brandImage.id}`'
		:isSelected='selectedBaseImage === baseImage.id && selectedBrandImage === brandImage.id'
		:baseImageW='imWidth'
		:baseImageH='imHeight'
		:brandImage='brandImage'
		:color='MASK_COLORS[idx]'
		:mask='baseImage.masks[idx]'
		@clickThrough='onClickThrough($event, brandImage.id)'
		class='z-20'
		:class='{ "pointer-events-none": clickedBrandImages.includes(brandImage.id) }'
		></BrandImageCanvas>

		<canvas
		ref='elCanvasBaseImage'
		class='opacity-0 z-10 absolute w-full pointer-events-none'
		></canvas>

		<!-- <canvas ref='hidden' class='absolute' style='left: -99999999999px'></canvas> -->

		<img
		ref='image'
		:src='baseImage.src'
		class='max-w-full max-h-full  object-contain'
		>
	</div>
</template>

<script>
import ApplicationCanvasUi from '@/components/ApplicationCanvasUi';
import BrandImageCanvas from './BrandImageCanvas';

import { MASK_COLORS } from '@/constants';

export default {
	components: {
		ApplicationCanvasUi,
		BrandImageCanvas
	},
	props: {
		baseImage: {
			type: Object,
			required: true,
			validator(value) {
				return value.hasOwnProperty('masks') && value.masks.length;
			}
		},
		shouldShowMasks: {
			type: Boolean,
			default: true
		}
	},
	data() {
		return {
			imWidth: 0,
			imHeight: 0,
			clickedBrandImages: []
		}
	},
	computed: {
		activeBrandImages() {
			return this.$store.getters['User/Application/ApplicationMockup/activeBrandImages']
				.slice(0, this.baseImage.masks.length);
		},
		selectedBrandImage() {
			return this.$store.state.User.Application.ApplicationMockup.selectedBrandImage;
		},
		selectedBaseImage() {
			return this.$store.state.User.Application.ApplicationMockup.selectedBaseImage;
		}
	},
	watch: {
		clickedBrandImages(value) {
			console.log(value)
		},
		activeBrandImages(value) {
			this.$nextTick(() => {
				this.loadBrandImages();
			});
		},
	},
	created() {
		this.MASK_COLORS = MASK_COLORS;
	},
	mounted() {
		this.loadBaseImage();
	},
	methods: {
		loadBaseImage() {
			const im = new Image();
			im.src = this.baseImage.src;
			im.onload = () => {
				const vH = Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);
				this.imHeight = im.height;
				this.imWidth = im.width;
				this.imContainerHeight = this.$refs.image.offsetHeight;
				this.imContainerWidth = this.$refs.image.offsetWidth;

				this.loadMasks();
				this.$nextTick(() => {
					this.loadBrandImages();
				});
			}
		},
		loadBrandImages() {
			for (const brandImage of this.activeBrandImages) {
				this.$refs[`brandImageCanvas-${brandImage.id}`][0].loadBrandImage();
			}
		},
		loadMasks() {
			const canvas = this.$refs.elCanvasMask;
			const ctx = canvas.getContext('2d');
			canvas.height = String(this.imHeight);
			canvas.width = String(this.imWidth);

			for (const maskIdx in this.baseImage.masks) {
				const mask = this.baseImage.masks[maskIdx].mask;

				ctx.beginPath();
				ctx.moveTo(mask.nw.x, this.imHeight - mask.nw.y);
				ctx.lineTo(mask.ne.x, this.imHeight - mask.ne.y);
				ctx.lineTo(mask.se.x, this.imHeight - mask.se.y);
				ctx.lineTo(mask.sw.x, this.imHeight - mask.sw.y);
				ctx.lineTo(mask.nw.x, this.imHeight - mask.nw.y);

				ctx.strokeStyle = MASK_COLORS[maskIdx];
				ctx.fillStyle = MASK_COLORS[maskIdx];
				ctx.fillStyle = MASK_COLORS[maskIdx].replace('(', 'a(').replace(')', ',0.3)');
				ctx.lineWidth = 10;
				ctx.stroke();

				ctx.fill();
			}
		},
		onClickThrough(e, clickedBrandImageId) {
			return;

			const colors = {
				'ccfbe1d5-6850-485e-a400-69b63c0008ae': 'magenta',
				'2856b192-e54e-4120-bda9-243cf0afe60a': 'green',
				'99913522-1fc0-40c4-81aa-d81cf3a9a3b6': 'cyan'
			};

			console.log('tried clicking', colors[clickedBrandImageId]);

			// Because we're using multiple canvas elements all with 100%*100% w/h,
			// we're always going to click on the newest brand image as it's canvas
			// covers the whole container. This function takes in x,y coords and loops
			// through each brand image until it hits something.


			this.clickedBrandImages.push(clickedBrandImageId);

			if (this.selectedBrandImage === clickedBrandImageId) {
				this.clickedBrandImages = [];
				return;
			}

			// Original click didn't hit any brand images:
			if (this.brandImages.length === 1 || this.clickedBrandImages.length >= this.brandImages.length) {
				this.clickedBrandImages = [];
				return;
			}

			const imagesToClick = this.brandImages.filter(({id}) => !this.clickedBrandImages.includes(id));

			for (const brandImage of imagesToClick) {
				console.log('click', colors[brandImage.id])
				this.$refs[`brandImageCanvas-${brandImage.id}`][0].onCanvasClick(e);
			}
		}
	}
};
</script>
