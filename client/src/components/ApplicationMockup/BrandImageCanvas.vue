<template>
	<div ref='workingArea' class='w-full absolute'>

		<ApplicationCanvasUi v-if='isSelected'>
			<div class='flex'>
				<InputHSL :value='modHSLA' class='mr-4' @input='onHSLAInput'></InputHSL>
				<InputCheckbox v-model="shouldPreserveAspectRatio" class='mr-4 text-xs'>Preserve Aspect Ratio</InputCheckbox>
				<button @click='() => {}' class='absolute opacity-0 hover:opacity-75 hover:bg-gray-700 top-0 right-0 bg-black w-4 h-4 text-white rounded-sm flex justify-center items-center mt-2 mr-2'><Icon name='times' scale='.75' class=''></Icon></button>

				<div @click='() => {}'  class='canvas-ui--btn h-8 w-8 cursor-pointer bg-black hover:bg-gray-700 flex justify-center items-center rounded px-2 py-1'>
					<Icon name='plus'></Icon>
				</div>

				<div @click='() => {}'  class='canvas-ui--btn h-8 w-8 ml-4 cursor-pointer bg-black hover:bg-gray-700 flex justify-center items-center rounded px-2 py-1'>
					<Icon name='minus'></Icon>
				</div>
			</div>
		</ApplicationCanvasUi>

<!-- 		<div v-if='isSelected'>
			<div
			v-for='(v, k) in handles'
			:key='k'
			:ref="`handle-${k}`"
			class='z-50 absolute top-0 left-0 cursor-grab rounded-full'
			:style='`width: 12px; height: 12px; border: 3px solid ${color}; transform: translate(${handles[k].x - 6}px, ${handles[k].y - 6}px)`'
			@mousedown='onHandleMousedown($event, k)'
			@mousemove='onHandleMousemove'
			@mouseup='onHandleMouseup'
			></div>
		</div> -->

		<!-- <canvas ref='canvas' class='w-full' @click='onHandleMouseup($event); onCanvasClick($event)' @mousemove='onHandleMousemove'></canvas> -->
		<canvas
			ref='canvas'
			class='w-full'
			:class='{ "cursor-move": isHovered }'
			@click='onCanvasClick'
			@mousemove='onCanvasMousemove'
			@mouseleave='onCanvasMouseleave'
			@mousedown='onCanvasMousedown'
			@mouseup='onCanvasMouseup'
		></canvas>
	</div>
</template>

<script>
import isPointInPolygon from 'robust-point-in-polygon';

import ApplicationCanvasUi from '@/components/ApplicationCanvasUi';
import InputHSL from '@/components/Input/InputHSL';
import InputCheckbox from '@/components/Input/InputCheckbox';

import { relMouseCoords } from '@/lib/relativeMouseCoords';

import { CanvasImage } from './CanvasImage.js'

export default {
	components: {
		ApplicationCanvasUi,
		InputHSL,
		InputCheckbox,
	},
	props: {
		color: {
			type: String
		},
		isSelected: {
			type: Boolean
		},
		brandImage: {
			type: Object,
			required: true,
			validator(value) {
				return value.hasOwnProperty('id') //&& value.hasOwnProperty('mask');
			}
		},
		mask: {
			type: Object,
			required: true,
			validator(value) {
				return value.hasOwnProperty('mask');
			}
		},
		baseImageW: {
			type: Number,
			required: true,
			validator(value) {
				return value >= 0;
			}
		},
		baseImageH: {
			type: Number,
			required: true,
			validator(value) {
				return value >= 0;
			}
		}
	},
	data() {
		return {
			handles: {
				nw: { x: 0, y: 0 },
				ne: { x: 0, y: 0 },
				se: { x: 0, y: 0 },
				sw: { x: 0, y: 0 }
			},
			imWidth: 0,
			imHeight: 0,
			shouldPreserveAspectRatio: false,
			modHSLA: { H: 180, S: 50, L: 50, A: 1 },
			isHovered: false,
			isBeingDragged: false,
			previousX: 0,
			previousY: 0
		}
	},
	watch: {
		modHSLA: {
			handler(newValue, oldValue) {
				const operation = newValue.H !== oldValue.H ? 'hue'
				: newValue.S !== oldValue.S ? 'saturation'
				: newValue.L !== oldValue.L ? 'luminosity'
				: 'luminosity';
    			// this.performGlobalCompositeOperation(operation);
			},
			deep: true
		}
	},
	methods: {
		loadBrandImage() {
			const canvas = this.$refs.canvas;
			canvas.height = String(this.baseImageH);
			canvas.width = String(this.baseImageW);

			this.handleBeingDragged = null;
			this.realMaskCoords = this.getRealCoords(JSON.parse(JSON.stringify(this.getMaskCoords())));
			this.handles = this.realMaskCoords

			const im = new Image();
			im.src = this.brandImage.src;
			im.onload = () => {
				this.imWidth = im.width;
				this.imHeight = im.height;
				this.drawBrandImage(canvas, im, this.getMaskCoords());
			this.im = im;
				
			}
		},
		drawBrandImage(canvas, im, coords) {
			const canvasImage = new CanvasImage(canvas, im);
			canvasImage.draw(coords);
		},
		getMaskCoords() {
			const mask = this.mask.mask;
			return {
				nw: { x: mask.nw.x, y: this.baseImageH - mask.nw.y },
				ne: { x: mask.ne.x, y: this.baseImageH - mask.ne.y },
				se: { x: mask.se.x, y: this.baseImageH - mask.se.y },
				sw: { x: mask.sw.x, y: this.baseImageH - mask.sw.y }
			}
		},
		getRealCoords(handles) {
			const { width, height} = this.$refs.canvas.getBoundingClientRect();
			handles.nw.x = width / (this.baseImageW / handles.nw.x);
			handles.ne.x = width / (this.baseImageW / handles.ne.x);
			handles.se.x = width / (this.baseImageW / handles.se.x);
			handles.sw.x = width / (this.baseImageW / handles.sw.x);
			handles.nw.y = height / (this.baseImageH / handles.nw.y);
			handles.ne.y = height / (this.baseImageH / handles.ne.y);
			handles.se.y = height / (this.baseImageH / handles.se.y);
			handles.sw.y = height / (this.baseImageH / handles.sw.y);
			return handles;
		},
		onCanvasClick(e) {
			const { x, y } = relMouseCoords(e, this.$refs.canvas);
			const polygon = Object.values(this.realMaskCoords).map(v => [v.x, v.y]);
			const eventWasOnBrandImage = isPointInPolygon(polygon, [x, y]) === -1;

			if (eventWasOnBrandImage) {
				if (this.isSelected) {
					// this.$store.dispatch(`User/Application/ApplicationMockup/selectBrandImage`, null);
				} else {
					this.$store.dispatch(`User/Application/ApplicationMockup/selectBrandImage`, this.brandImage.id);
				}
			} else {
				this.$store.dispatch(`User/Application/ApplicationMockup/selectBrandImage`, null);
				this.$nextTick(() => this.$emit('clickThrough', e));
			}
		},
		onCanvasMousemove(e) {
			const { x, y } = relMouseCoords(e, this.$refs.canvas);

			if (!this.realMaskCoords || !this.isSelected) return;

			const polygon = Object.values(this.realMaskCoords).map(v => [v.x, v.y]);
			const eventWasOnBrandImage = isPointInPolygon(polygon, [x, y]) === -1;
			this.isHovered = eventWasOnBrandImage;

			if (this.isBeingDragged) {
				const coords = this.getMaskCoords();

				const mouseDidMoveNorth = y > this.previousY;
				const mouseDidMoveSouth = y < this.previousY;
				const mouseDidMoveWest = x < this.previousX;
				const mouseDidMoveEast = x > this.previousX;

				const yDiff = Math.abs(y - this.previousY);
				const xDiff = Math.abs(x - this.previousX);

				if (mouseDidMoveNorth) {
					coords.nw.y += yDiff;
					coords.ne.y += yDiff;
					coords.sw.y += yDiff;
					coords.se.y += yDiff;
				} else {
					coords.nw.y -= yDiff;
					coords.ne.y -= yDiff;
					coords.sw.y -= yDiff;
					coords.se.y -= yDiff;
				}

				if (mouseDidMoveWest) {
					coords.nw.x -= xDiff;
					coords.ne.x -= xDiff;
					coords.sw.x -= xDiff;
					coords.se.x -= xDiff;
				} else {
					coords.nw.x += xDiff;
					coords.ne.x += xDiff;
					coords.sw.x += xDiff;
					coords.se.x += xDiff;
				}

				this.drawBrandImage(this.$refs.canvas, this.im, coords);
			}

			this.previousX = x;
			this.previousY = y;
		},
		onCanvasMouseleave(e) {
			this.isHovered = false;
		},
		onCanvasMousedown(e) {
			this.isBeingDragged = this.isHovered;
		},
		onCanvasMouseup(e) {
			this.isBeingDragged = false;
		},



		// onHandleMousedown(e, k) {
		// 	const node = e.target;
		// 	this.handleBeingDragged = k;
		// 		// this.pos1 = e.clientX;
		// 		// this.pos2 = e.clientY;
		// 	this.viewport = { bottom: 0, left: 0, right: 0, top: 0 };
		// 	const PADDING = 0;
		// 	this.rect = e.target.getBoundingClientRect();
		// 	this.viewport.bottom = window.innerHeight - PADDING;
		// 	this.viewport.left = PADDING;
		// 	this.viewport.right = window.innerWidth - PADDING;
		// 	this.viewport.top = PADDING;
		// },
		// onHandleMousemove(e) {
		// 	if (this.handleBeingDragged) {
		// 		this.pos1 = this.pos3 - e.clientX;
		// 		this.pos2 = this.pos4 - e.clientY;
		// 		this.pos3 = e.clientX;
		// 		this.pos4 = e.clientY;
		// 		const el = this.$refs[`handle-${this.handleBeingDragged}`][0];

		// 	  // check to make sure the element will be within our viewport boundary
		// 		const newLeft = el.offsetLeft - this.pos1;
		// 		const newTop = el.offsetTop - this.pos2;
		// 		if (newLeft < this.viewport.left
		// 			|| newTop < this.viewport.top
		// 			|| newLeft + this.rect.width > this.viewport.right
		// 			|| newTop + this.rect.height > this.viewport.bottom
		// 			) {
		// 				// pass
		// 		} else {
		// 			el.style.top = (el.offsetTop - this.pos2) + "px";
		// 			el.style.left = (el.offsetLeft - this.pos1) + "px";
		// 		}
		// 		this.dirtyTriangles = true
		// 	}
		// },
		// onHandleMouseup(e) {
		// 	this.handleBeingDragged = null
		// },




		onHSLAInput(e) {
			this.modHSLA = e;
		},
		performGlobalCompositeOperation(operation) {
			const mask = this.baseImage.mask;
			const canvas = this.$refs.midground;
			const ctx = canvas.getContext('2d');

			const { H, S, L, A } = this.modHSLA;

    		// ctx.clearRect(0, 0, canvas.width, canvas.height);

    		// @todo just copy existing without re-doing transform
    		// const hiddenCanvas = this.$refs.hidden;
    		// const hiddenCtx = hiddenCanvas.getContext('2d');
    		// hiddenCanvas.style.width = canvas.width + 'px'
    		// hiddenCanvas.style.height = canvas.height + 'px'
    		// hiddenCanvas.width = canvas.width;
    		// hiddenCanvas.height = canvas.height;
    		// hiddenCtx.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);

    		// const sx = mask.nw.x;
    		// const sy = mask.nw.y;
    		// const dx = mask.se.x;
    		// const dy = mask.se.y;
    		// hiddenCtx.drawImage(canvas, sx, sy, null, null, dx, dy, null, null);
    		// const brandImage = hiddenCanvas.toDataURL('image/png');

    		// ctx.drawImage(hiddenCtx.canvas, sx, sy, null, null, dx, dy, null, null);

    		// redraw image
			this.drawBrandImage(canvas, ctx, this.im);

    		// apply filter in mask region

			ctx.globalCompositeOperation = operation;
			ctx.fillStyle = `hsl(${H}, ${S}%, ${L}%)`;
			ctx.globalAlpha = A;
			ctx.beginPath();
			ctx.moveTo(mask.nw.x, this.baseImageH - mask.nw.y);
			ctx.lineTo(mask.ne.x, this.baseImageH - mask.ne.y);
			ctx.lineTo(mask.se.x, this.baseImageH - mask.se.y);
			ctx.lineTo(mask.sw.x, this.baseImageH - mask.sw.y);
			ctx.lineTo(mask.nw.x, this.baseImageH - mask.nw.y);
			ctx.fill();

    		ctx.globalCompositeOperation = "source-over";  // restore default comp
    	},
    }
  };
  </script>
