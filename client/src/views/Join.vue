<template>
  <div class="pb-20 w-full max-w-lg px-8 lg:px-0 text-brand-900 dark:text-gray-500 font-semibold">
    <h1 class="text-2xl font-semibold tracking-wide text-center mt-12 mb-4">
      Let's get started!
    </h1>
    <span class="text-gray-500 text-sm text-center block mb-12">Create your byzantine account now</span>
    <div class="bg-gray-200 dark:bg-gray-700 border dark:border-gray-800 rounded-lg shadow-lg p-8">
      <form ref="form" :class="{'disabled': loading}" autocomplete="off" @submit.prevent="onSubmit">
        <InputHidden v-model="hiddenVal" :req="hiddenReq"></InputHidden>
        <Input v-model="formData.name" :autofocus="true" :req="true" :req-hide="true" class="pb-4" label="Name"></Input>
        <Input v-model="formData.email" :req="true" :req-hide="true" class="pb-4" label="Email Address" type="email"></Input>
        <Input v-model="formData.password" :minlength="8" :req="true" :req-hide="true" class="pb-4" label="Password" type="password"></Input>

        <div class="">
          <div class="flex justify-between">
            <label for="selectPlan" class="block uppercase tracking-wide text-xs font-bold mb-2 pl-1">Select a Plan</label>
          </div>
    <!--       <select v-model="formData.plan" required="true" class="cursor-pointer form-select pr-6 font-sans p-4 border block appearance-none w-full rounded leading-tight bg-white dark:border-gray-700 dark:bg-gray-800 text-gray-900 dark:text-gray-500 hover:border-brand-400">
            <option v-for="plan in plans" :key="plan.id" :value="plan.id">{{ plan.name }}</option>
          </select> -->
          <div id="selectPlan" class="flex justify-between p-4 mb-3 border border-gray-400 block appearance-none text-block w-full rounded leading-tight focus:shadow-lg dark:border-gray-700 dark:bg-gray-800  focus:outline-none bg-white text-gray-900 hover:border-brand-500">
            <Button v-for="(plan, idx) in plans" :key="plan.id" color="indigo" size="xs" @click="formData.plan = plan.id">{{ plan.name }} Plan</Button>
          </div>
        </div>

        <InputStripe ref='stripeInput' :req="true" class="py-2" @input="stripeToken = $event.token"></InputStripe>

        <div class="py-2 flex items-center justify-between w-full">
          <InputCheckbox v-model="agreeToTerms" class="mr-3 text-sm">I agree to the <router-link to="/legal/tos" class="font-bold" target="_blank">Terms of Service</router-link> &amp; <router-link to="/legal/tos" class="font-bold" target="_blank">Privacy Policy</router-link>.</InputCheckbox>
        </div>

        <div class="mt-12 flex justify-center">
          <Button type="submit" @click="onSubmitButtonClick">
            <Loading v-show="loading" color="white" size="sm" class="mr-4"></Loading>Go to Dashboard
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import Loading from "@/components/Loading";
import InputStripe from "@/components/Input/InputStripe";
import InputHidden from "@/components/Input/InputHidden";
import InputCheckbox from "@/components/Input/InputCheckbox";

let timerTrap = true;

export default {
	components: {
		Loading,
		InputStripe,
		InputHidden,
		InputCheckbox
	},
	data() {
		return {
			formData: {
        name: '',
				email: "",
				password: "",
				plan: ""
			},
			hiddenReq: true,
			hiddenVal: "",
			plans: [],
			error: "",
			stripeToken: null,
			agreeToTerms: false
		};
	},
	watch: {
		formData: {
			handler(val) {
				this.error = "";
			},
			deep: true
		},
    loading(value) {
      if (!value) this.$refs.stripeInput.fireClear();
    }
	},
	async created() {
    const resp = await this.$http.get("/plans");
    this.plans = resp.data;
  },
  mounted() {
    this.$store.dispatch('setLoading', false);

    this.hiddenReq = true;
    setTimeout(() => {
     timerTrap = false;
   }, 750);
  },
  computed: {
    loading() {
      return this.$store.state.isLoading;
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

    if (!this.agreeToTerms) {
      this.error = "To continue you must agree to the Terms of Service and Privacy Policy.";
      this.hiddenReq = true;
    }


    await this.$store.dispatch("Auth/join", {
      ...this.formData,
      stripeToken: this.stripeToken ? this.stripeToken.id : null,
      last4: parseInt(this.stripeToken ? this.stripeToken.card.last4 : 0),
      firstName: this.hiddenVal
    });
    this.hiddenReq = true;
  }
}
};
</script>
