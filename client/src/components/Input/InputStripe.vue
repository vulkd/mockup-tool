<template>
  <div class="relative w-full">
    <div class="flex justify-between">
      <label
        for="card-element"
        class="uppercase tracking-wide text-xs font-bold mb-2 pl-1"
      >
        Payment
      </label>
      <span class="tracking-wide text-xs font-bold mb-2">
        <span
          v-if="error"
          class="text-orange-400"
        >{{ error }}</span>
      </span>
    </div>
    <div
      id="card-element"
      class="dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 cursor-text font-sans p-4 mb-3 border border-gray-400 block appearance-none text-block w-full rounded leading-tight bg-white text-gray-900 hover:border-brand-500"
      :class="{
        'border-transparent border-brand-500': !error && !success && isFocused,
        'show-border border-orange-400 ': error,
        'show-border border-green-400 ': success,
        'isFocused': isFocused
      }"
    />
  </div>
</template>

<script>
const stripe = Stripe(process.env.VUE_APP_STRIPE_PUBLIC_KEY);
const elements = stripe.elements();

const style = {
	base: {
		fontSize: "16px",
		fontWeight: 500,
		color: "#131720",
		fontSmoothing: "subpixel-antialiased",
		"::placeholder": {
			color: "#8f9eb2"
		}
	}
	// complete: {},
	// empty: {},
	// todo focus: {},
	// webkitAutofill: {},
	// invalid: {
	// 	color: '#e5424d',
	// 	':focus': {
	// 		color: '#303238',
	// 	},
	// },
};

// paymentRequestButton: true,
const card = elements.create("card", {
	hidePostalCode: true,
	style
});

export default {
	props: {
		req: Boolean
	},
	data() {
		return {
			success: null,
			error: null,
			isFocused: false
		};
	},
	mounted() {
		card.mount("#card-element");
		card.addEventListener("focus", (event) => {
			this.isFocused = true;
		});
		card.addEventListener("blur", (event) => {
			this.isFocused = false;
		});
		card.addEventListener("change", async ({error}) => {
			// this.error = error ? error.message : "";
			// if (this.req && this.complete and !this.empty) {
			// 	let form.checkVlaidity be true ofr this elemnet
			// }

			const { token, tokenError } = await stripe.createToken(card);
			this.$emit("input", {token, tokenError});
			this.error = error ? error.message : null;
		});
	},
	methods: {
		fireClear() {
			card.clear();
		}
	}
};
</script>
