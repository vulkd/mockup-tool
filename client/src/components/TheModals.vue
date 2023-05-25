<template>
	<div>
		<AccountModalNewUser
		v-if='modal === "AccountModalNewUser"'
		:show='modal === "AccountModalNewUser"'
		title='Add a new user'
		></AccountModalNewUser>

		<ApplicationModalBaseImageNew
		v-if='modal === "ApplicationModalBaseImageNew"'
		:show='modal === "ApplicationModalBaseImageNew"'
		title='Upload a new base image'
		></ApplicationModalBaseImageNew>

		<ApplicationModalBrandImageNew
		v-if='modal === "ApplicationModalBrandImageNew"'
		:show='modal === "ApplicationModalBrandImageNew"'
		title='Upload a new brand image'
		></ApplicationModalBrandImageNew>
	</div>
</template>

<script>
import AccountModalNewUser from '@/components/AccountModalNewUser';
import ApplicationModalBaseImageNew from '@/components/ApplicationModalBaseImageNew';
import ApplicationModalBrandImageNew from '@/components/ApplicationModalBrandImageNew';

export default {
	components: {
		AccountModalNewUser,
		ApplicationModalBaseImageNew,
		ApplicationModalBrandImageNew
	},
	computed: {
		modal() {
		  return this.$store.state.modal;
		}
	}
};
</script>
