<template>
	<TheModal :show="show" @close="close" :title='title'>
		<div slot='body'>

			<form ref="form" :class="{'disabled': loading}" @submit.prevent="onSubmit" class='w-full max-w-lg px-8 lg:px-0'>
				<Input v-model.trim="form.name" :maxlength="254" class="mb-4 pb-2" label="Name"></Input>
				<Input v-model.trim="form.email" :maxlength="254" class="mb-4 pb-2" label="Email Address" type="email"></Input>
				<div class='flex flex-1 justify-end mt-4'>
					<Button color='green' type="submit"><Icon v-show="!loading" name="envelope" class="mr-4 select-none"></Icon><Loading v-show="loading" color="white" size="sm" class="mr-4"></Loading>Send Activation Email</Button>
				</div>
			</form>

		</div>
	</TheModal>
</template>

<script>
import Button from '@/components/Button';
import Input from '@/components/Input/Input';
import TheModal from '@/components/TheModal';

export default {
	components: {
		Button,
		Input,
		TheModal
	},
	props: {
		title: {
			type: String,
			required: true
		},
		show: {
			type: Boolean,
			required: true
		}
	},
	data() {
		return {
			form: {
				name: '',
				email: '',
				isAdmin: false
			}
		}
	},
	computed: {
		loading() {
			return this.$store.state.isLoading;
		}
	},
	methods: {
		close() {
			this.$emit('close');
		},
		async onSubmit(e) {
			e.preventDefault();
			if (!this.$refs.form.checkValidity()) return;
				// send user one time join link
			try {
				await this.$store.dispatch("Organization/addUser", this.form);
				this.$emit('close');
			} catch (err) {
				console.log(err);
			}
		}
	}
};
</script>
