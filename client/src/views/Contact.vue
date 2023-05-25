<template>
	<div class="w-full max-w-lg md:max-w-xl px-8 lg:px-0 text-brand-900 dark:text-gray-500 font-semibold">
		<h1 class="text-2xl font-semibold tracking-wide text-center mt-12 mb-4">Contact</h1>
		<span class="text-gray-500 text-sm text-center block mb-12">Get in touch</span>
		<div class="bg-gray-200 dark:bg-gray-700 border dark:border-gray-800 rounded-lg shadow-lg p-8">
			<form v-if="!hideForm" ref="form" :class="{'disabled': loading}" autocomplete="off" @submit.prevent="onSubmit">
				<InputHidden v-model="hiddenVal" :req="hiddenReq"></InputHidden>
				<Input v-model="formData.email" :req="true" placeholder="..." :req-hide="true" class="pb-2" label="Email Address" type="email"></Input>
				<InputTextarea v-model="formData.message" :rows="7" :req="true" class="py-4" label="Your Message" placeholder="..."></InputTextarea>
				<div class="mt-8 flex justify-center">
					<Button type="submit" @click="onSubmitButtonClick">
						<Icon v-show="!loading" name="paper-plane" class="mr-4 select-none"></Icon>
						<Loading v-show="loading" color="white" size="sm" class="mr-4"></Loading>
						Send Message
					</Button>
				</div>
			</form>
		</div>
	</div>
</template>

<script>
import Loading from "@/components/Loading";
import InputHidden from "@/components/Input/InputHidden";
import InputTextarea from "@/components/Input/InputTextarea";

let timerTrap = true;

export default {
	components: {
		Loading,
		InputHidden,
		InputTextarea
	},
	data() {
		return {
			formData: {
				email: "",
				message: ""
			},
			hiddenVal: "",
			hiddenReq: true,
			hideForm: false
		};
	},
	computed: {
		errorMessage() {
			return this.$store.state.errorMessage;
		},
		infoMessage() {
			return this.$store.state.infoMessage;
		},
		loading() {
			return this.$store.state.isLoading;
		}
	},
	mounted() {
		this.hiddenReq = true;
		setTimeout(() => {
			timerTrap = false;
		}, 750);
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
			try {
				this.$store.dispatch("setLoading", true);
				await this.$http.post("contact", {...this.formData, firstName: this.hiddenVal});
				this.hideForm = true;
				this.$store.dispatch("setMessages", { infoMessage: "Your message was sent successfully! We'll respond ASAP" });
			} catch (error) {
				this.$store.dispatch("setMessages", { errorMessage: "There was an error with your request" });
				this.hiddenReq = true;
			}
			this.$store.dispatch("setLoading", false);
		}
	}
};
</script>
