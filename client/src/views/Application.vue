<template>
	<div class="w-full lg:px-0 flex flex-col sm:flex-row">

<!-- 		{ to: "#", text: "Trash", icon: "trash" },
		{ to: "#", text: "Archived", icon: "archive" } -->

		<TheSidebar

		:linksTop='[
		{ to: "/app/create/mockup", text: "Create Mockup", icon: "paint-roller" },
		{ to: "/app/create/base-image", text: "Modify Base Image", icon: "ruler-combined" },
		,
		{ to: "/app/library/mockups", text: "Mockups", icon: "regular/images" },
		{ to: "/app/library/base-images", text: "Base Image Library", icon: "image" },
		{ to: "/app/library/brand-images", text: "Brand Image Library", icon: "regular/image" },
		]'
		:linksBottom='linksBottom'
		></TheSidebar>

		<div class="flex-1 sm:w-0 w-full">
			<transition name="fade" mode="out-in">
				<!-- <Loading v-if="loading"></Loading> -->
				<router-view  class="w-full"></router-view>
			</transition>
		</div>

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
		loading() {
			return this.$store.state.isLoading;
		},
		isUserAdmin() {
			return this.$store.getters['User/isUserAdmin'];
		},
		linksBottom() {
			const links = [
				{ to: "#", text: "Help", icon: "question-circle" },
				{ to: "/account/team", text: "Team", icon: "users" },
				{ to: "/account/profile", text: "Profile Settings", icon: "user-cog" },
			];
			return this.isUserAdmin
				? links.concat({ to: "/account/billing", text: "Billing", icon: "wallet" })
				: links;
		}
	}
};
</script>
