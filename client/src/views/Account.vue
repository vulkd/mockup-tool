<template>
  <div class="w-full lg:px-0 flex flex-col sm:flex-row">
    <TheSidebar :linksTop='[
      { to: "/account/dashboard", text: "Dashboard" },
      { to: "/account/settings-users", text: "Users" },
      { to: "/account/settings-user", text: "Profile" },
      { to: "/account/settings-billing", text: "Billing" },
    ]'></TheSidebar>

    <div class="flex-1 sm:w-0 w-full">
      <transition v-if="user" name="fade" mode="out-in">
        <router-view class="w-full"></router-view>
      </transition>
    </div>

  </div>
</template>

<script>
import TheSidebar from '@/components/TheSidebar';

export default {
  components: {
    TheSidebar
  },
	computed: {
		user() {
			return this.$store.state.User.email ? this.$store.state.User : false;
		},
		loading() {
			return this.$store.state.isLoading;
		}
	},
	async created() {
		await this.$store.dispatch("User/loadUser");
	}
};
</script>
