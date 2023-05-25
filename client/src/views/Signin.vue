<template>
	<div class="w-full max-w-lg px-8 lg:px-0 text-brand-900 dark:text-gray-500 font-semibold">
		<h1 class="text-2xl font-semibold tracking-wide text-center mt-12 mb-4">Welcome back!</h1>
		<span class="text-gray-500 text-sm text-center block mb-12">{{ forgotPasswordClicked ? 'Forgot your password?' : 'Sign in' }}</span>
		<div class="bg-gray-200 dark:bg-gray-700 border dark:border-gray-800 rounded-lg shadow-lg p-8">

			<form :class="{'disabled': loading}" v-if="!hideForm" @submit.prevent="onSubmit" ref="form" autocomplete="on">
				<InputHidden v-model="hiddenVal" :req="hiddenReq"></InputHidden>
				<Input :autofocus="true" :placeholder="forgotPasswordClicked ? 'Please enter your email address' : ''" ref="email" :req="true" :reqHide="true" class="pb-2" label="Email Address" v-model="formData.email" type="email"/>
				<Input v-if="!forgotPasswordClicked" :minlength="8" :req="true" :reqHide="true" class="pb-2" label="Password" v-model="formData.password" type="password"/>

				<div v-if="!forgotPasswordClicked" class="py-2 flex items-center justify-between w-full">
					<InputCheckbox v-model="formData.remember_me" class="mr-3 text-sm">Keep me logged in</InputCheckbox>
					<span @click="forgotPasswordClicked = true" class="block cursor-pointer text-sm">Forgot your password?</span>
				</div>

				<div class="mt-8 flex justify-center">
					<Button @click="onSubmitButtonClick" type="submit">
						<Loading v-show="loading" color="white" size="sm" class='mr-4'></Loading>{{forgotPasswordClicked ? "Reset Password" : "Sign In"}}
					</Button>
				</div>
			</form>
		</div>
	</div>
</template>

<script>
import validators from "@/lib/validators.js";

import Loading from '@/components/Loading';
import InputHidden from "@/components/Input/InputHidden";
import InputCheckbox from "@/components/Input/InputCheckbox";

let timerTrap = true;

export default {
	components: {
		Loading,
		InputHidden,
		InputCheckbox
	},
	data() {
		return {
			formData: {
				email: "",
				password: "",
				remember_me: false
			},
			hiddenVal: "",
			hiddenReq: true,
			forgotPasswordClicked: false,
			hideForm: false
		}
	},
	created() {
		if (this.$route.path === "/forgotpassword") {
			this.forgotPasswordClicked = true;
		}
	},
	mounted() {
		this.$store.dispatch('setLoading', false);

		this.hiddenReq = true;
		setTimeout(() => { timerTrap = false }, 750);

		this.$nextTick(() => {
			this.$refs.email.$refs.input.focus();
		});

		this.$bus.$on("signin-clicked", () => {
			this.hideForm = false;
			this.formData.email = "";
			this.forgotPasswordClicked = false;
			try {
				this.$refs.email.$refs.input.focus();
			} catch {}
		});
	},
	computed: {
		loading() {
			return this.$store.state.isLoading;
		}
	},
	watch: {
		$route(newVal, oldVal) {
			if (newVal.path === "/signin" && oldVal.path === "/forgotpassword") {
				this.forgotPasswordClicked = false;
				this.hideForm = false;
				this.$nextTick(() => {
					this.$refs.email.$refs.input.focus();
				});
			} else if (newVal.path === "/forgotpassword" && oldVal.path === "/signin") {
				this.forgotPasswordClicked = true;
			}
		},
		forgotPasswordClicked(val) {
			if (val === true && this.$route.path !== "/forgotpassword") {
				this.$router.push("/forgotpassword");
				this.$refs.email.$refs.input.focus();
			}
			this.formData.password = "";
			this.formData.remember_me = false
		},
		formData: {
			handler(val, oldVal) {
				this.$store.dispatch("setMessages", {errorMessage: "", infoMessage: ""})
			},
			deep: true
		}
	},
	methods: {
		onSubmitButtonClick() {
			this.hiddenReq = false;
		},
		async onSubmit(e) {
			e.preventDefault();
			if (!this.$refs.form.checkValidity() || timerTrap) {
				this.hiddenReq = true;
				return;
			}
			if (this.forgotPasswordClicked) {
				this.submitForgotPassword();
				return;
			}
			await this.$store.dispatch("Auth/signin", {...this.formData, firstName: this.hiddenVal});
		},
		async submitForgotPassword() {
			this.hiddenReq = false;
			if (!validators.email(this.formData.email) || !this.$refs.form.checkValidity()) {
				this.$store.dispatch("setMessages", {errorMessage: "Please enter a valid email address"});
				this.hiddenReq = true;
				return;
			}
			this.hideForm = await this.$store.dispatch("Auth/resetRequest", { email: this.formData.email, firstName: this.hiddenVal });
			this.hiddenReq = true;
		}
	}
};
</script>

<style scoped>
input[type="checkbox"] {
	box-shadow: none;
	border: 1px solid #cbd5e0;
}

input[type="checkbox"]:hover,
input[type="checkbox"]:focus,
input[type="checkbox"]:checked {
	border: 1px solid #666666;
}

input[type="checkbox"]:focus {
	box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

</style>
