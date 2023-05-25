<template>
  <div class="w-full max-w-lg px-8 lg:px-0 text-brand-900 font-semibold">
    <h1 class="text-2xl font-semibold tracking-wide text-center mt-12 mb-4">
      Activate Your Account
    </h1>
    <span class="text-gray-500 text-sm text-center block mb-12">You've been invited!</span>
    <div class="bg-gray-200 rounded-lg px-8 pb-8 pt-6">
      <form
        ref="form"
        :class="{'disabled': loading}"
        @submit.prevent="onSubmit"
      >
        <InputHidden v-model="hiddenVal" :req="hiddenReq"></InputHidden>
        <Input
          ref="newPassword"
          v-model="password"
          :minlength="8"
          :req="true"
          :req-hide="true"
          class="pb-2"
          label="Choose a Password"
          type="password"
        />
        <Input
          v-model="confirmPassword"
          :minlength="8"
          :req="true"
          :req-hide="true"
          class="pb-2"
          label="Confirm Password"
          type="password"
        />

        <div class="mt-8 flex justify-center">
          <Button type="submit" @click='onSubmitButtonClick'>
            <Loading
              v-show="loading"
              color="white"
              size="sm"
              class="mr-4"
            />Activate Account
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import Loading from "@/components/Loading";
import InputHidden from "@/components/Input/InputHidden";

let timerTrap = true;

export default {
	components: {
		Loading,
		InputHidden
	},
	data() {
		return {
			password: "",
			confirmPassword: "",
			hiddenVal: "",
			hiddenReq: true,
		};
	},
	computed: {
		loading() {
			return this.$store.state.isLoading;
		}
	},
	watch: {
		password() {
			this.$store.dispatch("setMessages", {errorMessage: "", infoMessage: ""});
		},
		confirmPassword() {
			this.$store.dispatch("setMessages", {errorMessage: "", infoMessage: ""});
		}
	},
	mounted() {
		this.hiddenReq = true;
		this.$refs.newPassword.$refs.input.focus();
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
			if (this.password !== this.confirmPassword) {
				this.hiddenReq = true;
				this.$store.dispatch("setMessages", { errorMessage: "Passwords do not match." });
				return;
			}
			await this.$store.dispatch("Auth/activateInvitation", {
				password: this.password,
				token: this.$route.params.token,
				firstName: this.hiddenVal
			});
      this.hiddenReq = true;
		}
	}
};
</script>
