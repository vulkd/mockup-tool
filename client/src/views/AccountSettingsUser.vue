<template>
	<div>
		<TheTitleBar>
			<div slot='title'>
				<b class='tracking-wide mr-4'>Welcome, {{ user.name.split(' ')[0] }}!</b>
			</div>
			<div slot='end'>
				<span class='text-gray-600 text-xs'>Last signed in {{ user.last_sign_in_at }}</span>
			</div>
		</TheTitleBar>

		<div ref='workingArea' class='overflow-auto'>
			<div class='flex flex-col items-center md:flex-row py-8'>

				<div class='w-64 relative md:mx-8 mb-8 lg:mb-0 flex flex-col items-center'>
					<div @click='onAvatarClick' class='flex items-center text-white justify-center cursor-pointer z-30 opacity-0 hover:opacity-25 bg-black absolute w-40 h-40 rounded-full'>
						<Icon name='file-image' scale='2'></Icon>
					</div>
					<div v-if='!user.avatar_src' class='absolute w-40 h-40 bg-white rounded-full shadow-lg'></div>
					<img v-if='user.avatar_src' :src='user.avatar_src' class='object-cover w-40 h-40 rounded-full shadow-lg'>
					<div v-else class='w-40 h-40 text-black flex bg-transparent justify-center items-center z-20 relative'>
						<Icon name='file-image' scale='2'></Icon>
					</div>
					<p :class='user.role === "admin" ? "text-purple-500" : "text-indigo-500"' class='mt-8 text-center font-semibold uppercase text-xs tracking-wide'>{{ user.role }}</p>
				</div>

				<form ref="form" :class="{'disabled': loading}" @submit.prevent="onSubmit" class='flex-1 max-w-md md:px-8 lg:px-0'>
					<Input v-model.trim="form.name" :maxlength="254" class="mb-4 pb-2" label="Name"></Input>
					<Input v-model.trim="form.email" :maxlength="254" class="mb-4 pb-2" label="Email Address" type="email"></Input>
					<Input v-model="form.password" :minlength="8" class="mb-4 pb-2" label="Password" type="password" autocomplete="new-password"></Input>
					<Input v-show="form.password" ref="passwordConfirmInput" v-model="form.confirmPassword" :minlength="8" class="pb-2" label="Confirm Current Password" type="password"></Input>

					<div class='flex flex-1 justify-between mt-4'>
						<Button v-if='hasChanged' color="indigo" @click="resetForm"><Icon name="undo" class="mr-4 select-none"></Icon>Undo Changes</Button>
						<div v-else></div>
						<Button color='green' type="submit"><Icon v-show="!loading" name="save" class="mr-4 select-none"></Icon><Loading v-show="loading" color="white" size="sm" class="mr-4"></Loading>Save Changes</Button>
					</div>
				</form>
			</div>

		</div>
	</div>
</template>

<script>
import Loading from "@/components/Loading";
import InputCheckbox from "@/components/Input/InputCheckbox";
import TheTitleBar from '@/components/TheTitleBar';
import fileUpload from '@/lib/fileUpload';

export default {
	components: {
		Loading,
		InputCheckbox,
		TheTitleBar
	},
	data() {
		return {
			form: {
				name: '',
				email: "",
				password: "",
				confirmPassword: "",
			},
			avatar_src: '',
			hasChanged: false
		};
	},
	mounted() {
		this.$refs.workingArea.style.height = `calc(100vh - ${this.$refs.workingArea.offsetTop}px)`;
		this.$store.dispatch('User/loadUser');
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
		form: {
			handler(newValue, oldValue) {
				this.hasChanged = (this.form.password || this.form.confirmPassword || this.form.email !== this.user.email || this.form.name !== this.user.name);
			},
			deep: true
		}
	},
	created() {
		this.resetForm();
	},
	methods: {
		async resetForm(e) {
			if (e) e.preventDefault();
			this.form.password =  '';
			this.form.confirmPassword =  '';
			await this.$store.dispatch("User/loadUser");
			this.form.name = this.user.name;
			this.form.email = this.user.email;
			this.avatar_src = this.user.avatar;
		},
		async onSubmit(e) {
			e.preventDefault();

			if (!this.$refs.form.checkValidity()) return;

			if (this.form.password && !this.form.confirmPassword) {
				this.$store.dispatch("setMessages", { errorMessage: "Please confirm your current password to make changes" });
				this.$nextTick(() => this.$refs.passwordConfirmInput.$refs.input.focus());
				return;
			}

			// const formData = new FormData();
			// formData.append('images', this.files);
			// await this.$http.post('app/upload', formData);

			await this.$store.dispatch("User/patchUser", this.form);

			this.form.password = "";
			this.form.confirmPassword = "";
		},
		async onAvatarClick() {
			fileUpload({ multiple: false }, e => {
				try {
					const files = e.path[0].files;
					const reader = new FileReader();
					const formData = new FormData();
					formData.append('image', files[0])
					this.$store.dispatch('User/postUserAvatar', formData);
				} catch (err) {
					console.log(err);
					this.$store.dispatch("setMessages", { errorMessage: err });
				}
			});
		}
	}
};
</script>

<style scoped>
</style>
