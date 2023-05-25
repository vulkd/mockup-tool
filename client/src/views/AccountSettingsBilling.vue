<template>
	<div>

		<TheTitleBar>
			<div slot='title'>
				<b class='tracking-wide mr-8'>Billing</b>
			</div>
			<div slot='content'>
			</div>
			<div slot='end'>
			</div>
		</TheTitleBar>


		<div class="w-full max-w-2xl">

			<div v-if="showDeleteAccountMenu">
				<h2 class="text-xl tracking-wide pb-4">Account Deletion</h2>
				<p class="py-2">Once your account is deleted, you will lose access to your current plan, and requests made with your API key will not work. Your account information will not be recoverable and if you wish to have an account again in the future, will have to repeat the sign-up process.</p>
				<p class="py-2">If any outstanding payments are due, you will be billed afterwards.</p>
				<p class="py-2">If you choose to go ahead with deletion, thankyou for signing up. If there was anything in particular that you liked or disliked about the service please let me know in the feedback box below.</p>
				<div class="m-auto w-full flex items-center py-4">
					<InputCheckbox v-model="deleteAccountConfirmed" class="mr-3" color="pink"></InputCheckbox><span class="cursor-pointer" @click="deleteAccountConfirmed=!deleteAccountConfirmed">I understand, please delete my account.</span>
				</div>
				<InputTextarea v-show="deleteAccountConfirmed" v-model="deleteAccountFeedback" class="py-4" label="Any feedback is appreciated :)"></InputTextarea>
				<div class="mt-8 flex flex-col md:flex-row justify-between">
					<Button class="mt-8 ml-0 md:mt-0" @click="resetForm; showDeleteAccountMenu=false"><Icon name="undo" class="mr-4 select-none"></Icon>Cancel</Button>
					<Button color="pink" class="mt-8 ml-0 md:mt-0" :class="{'disabled': !deleteAccountConfirmed}" @click="deleteAccount"><Icon name="skull" class="mr-4 select-none"></Icon>Delete My Account</Button>
				</div>
			</div>

			<div class="mt-12 text-sm">
				<span @click="deleteAccount" class="cursor-pointer underline text-red-500">Delete Account</span>
			</div>

		</div>
	</div>
</template>

<script>
import Loading from "@/components/Loading";
import TheTitleBar from "@/components/TheTitleBar";
import InputCheckbox from "@/components/Input/InputCheckbox";
import InputTextarea from "@/components/Input/InputTextarea";

export default {
	components: {
		Loading,
		TheTitleBar,
		InputCheckbox,
		InputTextarea
	},
	data() {
		return {
			showDeleteAccountMenu: false,
			deleteAccountConfirmed: false,
			deleteAccountFeedback: ""
		};
	},
	computed: {
		user() {
			return this.$store.state.User;
		},
		loading() {
			return this.$store.state.isLoading;
		}
	},
	watch: {
		showDeleteAccountMenu(val) {
			if (!val) {
				this.showDeleteAccountMenu = false;
				this.deleteAccountConfirmed = false;
				this.deleteAccountFeedback = "";
			}
		}
	},
	methods: {
		deleteAccount() {
			if (!this.showDeleteAccountMenu) {
				this.showDeleteAccountMenu = true;
				return;
			} else if (this.deleteAccountConfirmed) {
				this.$store.dispatch("User/deleteUser", { feedback: this.deleteAccountFeedback });
			}
		}
	}
};
</script>

<style scoped>
</style>
