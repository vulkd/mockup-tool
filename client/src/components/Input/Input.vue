<template>
	<div class="relative w-full">
		<div v-if='label' class="flex justify-between">
			<label v-if="label" :for="inputID" class="uppercase tracking-wide text-xs font-bold mb-2 pl-1">
				{{ inputID.split('_')[0] }}
				<span v-if="req && !reqHide" class="text-green-400 ml-2">*</span>
			</label>
			<span class="tracking-wide text-xs font-bold mb-2">
				<span v-if="error" class="text-orange-400">{{ typeof error === "string" ? error : '' }}</span>
				<span v-else="warning" class="text-brand-400">{{ warning }}</span>
			</span>
		</div>

		<input
		:id="inputID"
		ref="input"
		class="pr-6 font-sans p-4 border block appearance-none w-full rounded leading-tight bg-white dark:border-gray-700 dark:bg-gray-800 text-gray-900 dark:text-gray-500 hover:border-brand-400"
		:class="{
			'pl-6': icon,
			'pr-6': closeIcon,
			'py-1 px-2 text-xs leading-sm': size === 'sm',
			'pr-10': type === 'password',
			'border-transparent border-brand-400': !error && !success && isFocused,
			'show-border border-orange-400 ': error,
			'show-border border-green-400 ': success
		}"
		:type="inputType"
		:name="inputID"
		:minlength="minlength"
		:maxlength="inputType === 'email' ? 254 : maxlength"
		:autofocus="autofocus"
		:placeholder="placeholder"
		:spellcheck="spellcheck"
		:value="value"
		:required="req"
		@input="$emit('input', $event.target.value)"
		@keyup.enter="onBlur"
		@keyup="onKeyup"
		@focus="onFocus"
		@blur="onBlur"
		/>

		<div v-if='icon' class='absolute top-0 left-0 flex h-full items-center mx-2 text-gray-500'>
			<Icon :name='icon' scale='.8'></Icon>
		</div>

		<div v-if='closeIcon && value.length' class='absolute top-0 right-0 flex h-full items-center mx-2 text-gray-500 cursor-pointer'>
			<Icon @click='$emit("closeIconClick")' name='times' scale='.8'></Icon>
		</div>

		<div class="input-icon absolute top-0 right-0 flex items-center px-3"
		:class="{
		'cursor-pointer': value.length,
		'text-brand-500': value.length && !success && !error,
		'text-green-400': value.length && success,
		'text-orange-400': value.length && error,
		'pointer-events-none text-gray-300': !value.length}"
		>
		<Icon v-if="type === 'password'" @click.native="revealPassword()" class="h-6 w-6 -mt-2" title="Reveal Password" :name="inputType !== 'password' ? 'eye' : 'eye-slash'"></Icon>
	</div>
</div>
</template>

<script>
export default {
	props: {
		type: { type: String, default: "text" },
		value: { type: String|Number, required: true },
		label: String,
		req: Boolean,
		reqHide: Boolean,
		autofocus: Boolean,
		spellcheck: Boolean,
		placeholder: { type: String, default: null },
		minlength: Number,
		maxlength: Number,
		icon: String,
		closeIcon: String,
		size: {
			type: String,
			default: "lg"
		}
	},
	data() {
		return {
			inputType: "text",
			isFocused: false,
			success: false,
			error: "",
			warning: ""
		};
	},
	watch: {
		value(val) {
			this.error = "";
		}
	},
	created() {
		// Use the label+component uid as the ID, and if no label supplied, use vnode tag+component uid
		const label = `${!this.label ? this.$vnode.tag : this.label.trim()}_${this._uid}`.trim();
		this.inputID = label.charAt(0).toUpperCase() + label.slice(1);
		this.inputType = this.type;
	},
	methods: {
		onFocus(e) {
			this.isFocused = true;
		},
		onBlur(e) {
			this.isFocused = false;
		},
		revealPassword() {
			this.$refs.input.focus();
			this.inputType = this.inputType === "text" ? "password" : "text";
			if (this.inputType !== "password") setTimeout(() => this.inputType = "password", 1200);
			this.$refs.input.focus();
		},
		onKeyup(e) {
			if (this.type !== "password") return;
			this.warning = e.getModifierState && e.getModifierState("CapsLock")
				? "Caps Lock is on!"
				: null;
		}
	}
};
</script>

<style scoped>
input:focus {
	box-shadow: none;
	/*border: none;*/
	outline: none;
}

.input-icon {
	margin-top: 3.1rem;
	transition: all .17s ease;
}
</style>
