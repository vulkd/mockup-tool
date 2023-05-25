<template>
	<div
	@click='isToggled = !isToggled'
	class='toggle w-12 p-1 px-2 border dark:border-gray-800 dark:bg-gray-700 rounded-full flex items-center cursor-pointer'
	:class='{ "bg-white": isToggled, "bg-gray-200": !isToggled }'
	>
		<Icon
		:name='isToggled ? onIcon : offIcon'
		:scale='iconScale'
		class='rounded-full flex items-center justify-center'
		:class='isToggled ? `toggled text-${onColor}` : `text-${offColor}`'
		></Icon>
	</div>
</template>

<script>
export default {
	props: {
		value: {
			type: Boolean,
			required: false,
			default: undefined
		},
		onIcon: {
			type: String,
			default: 'regular/circle'
		},
		offIcon: {
			type: String,
			default: 'regular/circle'
		},
		onColor: {
			type: String,
			default: 'gray-500'
		},
		offColor: {
			type: String,
			default: 'gray-500'
		},
		iconScale: {
			type: Number,
			default: 1
		}
	},
	data() {
		return {
			isToggled: this.value
		}
	},
	watch: {
		isToggled(value) {
			this.$emit(this.value === undefined ? 'toggle' : 'input', value);
		}
	}
};
</script>

<style scoped>
.toggle > svg {
	transition: transform .5s;
}

.toggled {
	transform: translateX(calc(24px - (0.25rem * 2)));
}
</style>
