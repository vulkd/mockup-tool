<template functional>
	<button
	v-on='listeners.click ? { click: listeners.click } : {}'
	:type='props.type'
	:class='
		`${data.staticClass || ""} ${data.class || ""}
		${
			(data && data.staticClass && data.staticClass.includes("rounded"))
				? ""
				: "rounded"
		}
		byzantine byzantine-button
		select-none
		flex items-center text-center text-xs px-2 py-1 border tracking-wide

		text-${props.color}-600 dark:text-${props.color}-400
		hover:text-${props.color}-400 dark-hover:text-${props.color}-300
		bg-${props.color}-100 dark:bg-${props.color}-800
		border-${props.color}-300 dark:border-${props.color}-600
		`'

	>
	<Icon
	v-if='props.icon'
	:name='props.icon'
	:class='{"mr-2": $slots.default}'
	scale='.8'></Icon>
	<slot></slot>
</button>
</template>

<script>
export default {
	props: {
		type: { type: String, default: null },
		icon: String,
		color: {
			type: String,
			default: 'indigo'
		}
	}
};
</script>
