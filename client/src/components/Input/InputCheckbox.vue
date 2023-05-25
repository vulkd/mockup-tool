<template>
	<div class="flex items-center">
		<input
		:id="$vnode.tag + _uid"
		:checked="value"
		ref="input"
		type="checkbox"
		@change="$emit('input', $event.target.checked); $event.target.blur()"
		class="
		form-checkbox
		mr-4
		cursor-pointer
		font-sans
		block
		appearance-none
		text-block
		rounded
		focus:shadow-lg
		focus:outline-none
		bg-white
		border
		"
		:class="`${size === 'sm' ? '' : 'p-3'} text-${color}-500 hover:border-${color}-400 focus:border-${color}-400`"
		>
		<span @click='$emit("input", !$refs.input.checked)' class='cursor-pointer select-none'><slot></slot></span>
	</div>


</template>

<script>
export default {
	props: {
		value: { type: String|Boolean|Number, required: true },
		color: { type: String, default: 'indigo' },
		size: { type: String, default: '' }
	}
};
</script>

<style scoped>
input,
input:focus {
	transition: all .17s ease;
}
</style>
