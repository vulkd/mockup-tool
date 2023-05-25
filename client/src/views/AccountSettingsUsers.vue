<template>
	<div>

		<TheTitleBar>
			<div slot='title'>
				<b class='tracking-wide mr-8'>Users</b>
			</div>
			<div slot='content'>
				<Button v-if='isUserAdmin' color="green" icon='plus' @click='$store.dispatch("setModal", "AccountModalNewUser")'>Add User</Button>
			</div>
		</TheTitleBar>


		<div ref='workingArea' class='overflow-auto'>

			<div v-for='user in users' class='flex bg-white dark:bg-gray-800 dark:border-gray-700 border rounded-lg shadow-lg m-8 w-full max-w-md'>
				<img v-if='user.avatar_src' :src='user.avatar_src' class='border-4 dark:border-gray-700 m-4 w-24 h-24 object-cover rounded-full'>
				<div v-else class='m-4 border-4 dark:border-gray-700 w-24 h-24 rounded-full text-gray-300 dark:text-gray-700 flex justify-center items-center'><Icon name='user'></Icon></div>
				<div class='py-4 pr-4 flex flex-col flex-1'>
					<div class='mb-1 flex items-start justify-between'>
						<p class='text-lg tracking-wide'>{{ user.name }}</p>
						<p @click='changeUserRole(user)' :class='user.role === "admin" ? "text-purple-500" : "text-indigo-500"' class='cursor-pointer font-semibold uppercase text-xs tracking-wide'>{{ user.role }}</p>
					</div>
					<p class='text-xs text-gray-600 dark:text-gray-500'>{{ user.email }}</p>
					<p class='text-xxs text-gray-500 dark:text-gray-600'>Joined {{ user.date_joined }}</p>

					<div class='flex-1'></div>
					<div v-if='user.activated' class='text-xxs text-gray-700 flex justify-between items-center'>
						<span class='flex rounded-full pr-2 items-center hover:text-indigo-500 hover:bg-indigo-100 cursor-pointer'><span class='inline-block w-5 h-5 flex items-center justify-center rounded-full text-indigo-600 bg-indigo-100 mr-1'>{{user.count_mockups}}</span> Mockups</span>
						<span class='flex rounded-full pr-2 items-center hover:text-indigo-500 hover:bg-indigo-100 cursor-pointer'><span class='inline-block w-5 h-5 flex items-center justify-center rounded-full text-indigo-600 bg-indigo-100 mr-1'>{{user.count_base_images}}</span> Base Images</span>
						<span class='flex rounded-full pr-2 items-center hover:text-indigo-500 hover:bg-indigo-100 cursor-pointer'><span class='inline-block w-5 h-5 flex items-center justify-center rounded-full text-indigo-600 bg-indigo-100 mr-1'>{{user.count_brand_images}}</span> Brand Images</span>
					</div>

					<div v-if='!user.activated && isUserAdmin'>
						<span class='text-pink-500 cursor-pointer font-semibold uppercase text-xs tracking-wide'>INACTIVE - RESEND ACTIVATION EMAIL</span>
					</div>

				</div>
			</div>


		</div>

	</div>
</template>

<script>
import Loading from "@/components/Loading";
import TheTitleBar from "@/components/TheTitleBar";

export default {
	components: {
		Loading,
		TheTitleBar
	},
	data() {
		return {
			searchTerm: ''
		};
	},
	mounted() {
		this.$refs.workingArea.style.height = `calc(100vh - ${this.$refs.workingArea.offsetTop}px)`;

		this.$store.dispatch('Organization/loadUsers');
	},
	computed: {
		isUserAdmin() {
			return this.$store.getters['User/isUserAdmin'];
		},
		users() {
			return this.$store.state.Organization.users;
		},
		loading() {
			return this.$store.state.isLoading;
		}
	},
	methods: {
		createUser() {
		},
		patchUser() {
		},
		deleteUser() {
		},
		changeUserRole(user) {
			const isOnlyOneAdmin = this.users.filter(i => i.role === 'admin').length === 1;

			if (user.role === 'admin' && isOnlyOneAdmin) {
				this.$store.dispatch('setMessages', { errorMessage: `There needs to be at least one administrator` })
				return;
			}

			const newPermissions = user.role === 'admin'
			? `They'll no longer be able to add and delete users, as well as change account settings, including billing.`
			: `They'll be able to add and delete users, as well as change account settings, including billing.`;

			if (confirm(`Change ${user.name}'s role to ${user.role === 'admin' ? 'user' : 'admin'}? ${newPermissions}`)) {
				this.$store.dispatch('setMessages', { infoMessage: `${user.name} is now an administrator` })
			}
		}
	}
};
</script>

<style scoped>
</style>
