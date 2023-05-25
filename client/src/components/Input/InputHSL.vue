<template>
	<div class='relative'>
		<Button icon='swatchbook' @click='shouldShowInputHsl = true'>HSL</Button>

		<div
		v-click-outside="onClickOutside"
		v-if='shouldShowInputHsl'
		ref='inputHSL'
		class='bg-white rounded absolute top-0 left-0 p-4 z-50'
		>

		<div class='bg-gray-400 text-black'>
		</div>

		<div>
			<label>H:</label>
			<input class='input-hsl--H' type='range' min='0' max='360' :step='1' :value='value.H' @input='onInput({ H: $event.target.value })'>
			<span>{{ value.H }}</span>
		</div>
		<div>
			<label>S:</label>
			<input class='input-hsl--S' type='range' min='0' max='100' :step='1' :value='value.S' @input='onInput({ S: $event.target.value })' :style='`background: linear-gradient(to right, hsl(${value.H}, 0%, 50%) 0%, hsl(${value.H}, 100%, 50%) 100%)`'>
			<span>{{ value.S }}</span>
		</div>
		<div>
			<label>L:</label>
			<input class='input-hsl--L' type='range' min='0' max='100' :step='1' :value='value.L' @input='onInput({ L: $event.target.value })'>
			<span>{{ value.L }}</span>
		</div>
		<div>
			<label>A:</label>
			<input class='input-hsl--A' type='range' min='0' max='1' :step='0.01' :value='value.A' @input='onInput({ A: $event.target.value })'>
			<span>{{ value.A }}</span>
		</div>

		<div class="h-12 w-full" :style="`background-color: hsla(${value.H}, ${value.S}%, ${value.L}%, ${value.A})`"></div>

		<input value=''>
	</div>
</div>
</template>

<script>
import vClickOutside from 'v-click-outside'
import InputRange from '@/components/Input/InputRange';
import { hslToRgb, rgbToHsl } from '@/lib/color';

export default {
	directives: {
		clickOutside: vClickOutside.directive
	},
	components: {
		InputRange
	},
	props: {
		value: Object
	},
	data() {
		return {
			shouldShowInputHsl: false,
		}
	},
	methods: {
		onClickOutside(e) {
			if (this.shouldShowInputHsl) this.shouldShowInputHsl = false;
		},
		onInput(e) {
			const value = {
				H: e && e['H'] !== undefined ? e['H'] : this.value.H,
				S: e && e['S'] !== undefined ? e['S'] : this.value.S,
				L: e && e['L'] !== undefined ? e['L'] : this.value.L,
				A: e && e['A'] !== undefined ? e['A'] : this.value.A
			};
			console.log('value', value)
			this.$emit('input', value);
		}
	}
};
</script>

<style scoped>
input[type=range].input-hsl--H {
	outline: 0;
	appearance: none;
	background: linear-gradient(to right,
		hsl(0, 100%, 88%) 0%,
		hsl(30, 100%, 88%) 8.3%,
		hsl(60, 100%, 88%) 16.6%,
		hsl(90, 100%, 88%) 25%,
		hsl(120, 100%, 88%) 33.3%,
		hsl(150, 100%, 88%) 41.6%,
		hsl(180, 100%, 88%) 50%,
		hsl(210, 100%, 88%) 58.3%,
		hsl(240, 100%, 88%) 66.6%,
		hsl(270, 100%, 88%) 75%,
		hsl(300, 100%, 88%) 83.3%,
		hsl(330, 100%, 88%) 91.6%,
		hsl(360, 100%, 88%) 100%
		);
}

input[type=range].input-hsl--S {
	outline: 0;
	appearance: none;
}

input[type=range].input-hsl--L {
	outline: 0;
	appearance: none;
	background: linear-gradient(to right,
		hsl(0, 0%, 0%) 0%,
		hsl(0, 100%, 100%) 100%
		);
}


input[type=range].input-hsl--A {
	outline: 0;
	appearance: none;
	background-image: linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%);
	background-size: 4px 4px;
	background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}
</style>
