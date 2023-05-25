<template>
	<div class="relative">
<!-- 		<div class="flex justify-between">
			<label v-if="label" :for="inputID" class="uppercase tracking-wide text-xs font-bold mb-2 pl-1">
				{{ inputID.split('_')[0] }}
				<span v-if="req && !reqHide" class="text-green-400 ml-2">*</span>
			</label>

			<span class="tracking-wide text-xs font-bold mb-2">
				<span v-if="error" class="text-orange-400">{{ typeof error === "string" ? error : '' }}</span>
				<span v-else="warning" class="text-brand-400">{{ warning }}</span>
			</span>
		</div> -->

		<select
		:id="inputID"
		:name="inputID"
		:placeholder='placeholder'
		ref="input"
		:value="value"
		@input="$emit('input', $event.target.value)"
		class="pr-6 font-sans p-4 border dark:border-gray-700 block appearance-none w-full rounded leading-tight bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-500 hover:border-brand-400"
		:class="{
		'py-1 px-2 text-xs leading-sm': size === 'sm',
		'border-transparent border-brand-400': !error && !success && isFocused,
		'show-border border-orange-400 ': error,
		'show-border border-green-400 ': success
	}"
	>
	<option v-if="showNoneOption" value="">{{ value ? 'None' : 'Sort' }}</option>
	<option v-for="opt in options" :value="opt.value ? opt.value : opt">{{ opt.name ? opt.name : opt }}</option>
</select>

<div class='absolute top-0 right-0 flex h-full items-center mx-2 text-gray-500'>
	<Icon name='chevron-down' scale='.8'></Icon>
</div>


</div>
</template>

<script>
export default {
	props: {
		value: { type: String,	required: true },
		options: { type: Array, required: true },
		showNoneOption: { type: Boolean, default: true },
		label: String,
		req: Boolean,
		reqHide: Boolean,
		size: {
			type: String,
			default: "lg"
		},
		placeholder: { type: String, default: ''}
	},
	data() {
		return {
			error: null,
			success: null,
			isFocused: null
		}
	},
	created() {
		// Use the label+component uid as the ID, and if no label supplied, use vnode tag+component uid
		const label = `${!this.label ? this.$vnode.tag : this.label.trim()}_${this._uid}`.trim();
		this.inputID = label.charAt(0).toUpperCase() + label.slice(1);
	},
	// watch: {
	// 	value(val) {
	// 		this.error = "";
	// 	}
	// },

};
</script>
