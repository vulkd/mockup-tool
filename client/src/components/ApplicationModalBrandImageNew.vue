<template>
	<TheModal :show="show" @close="close" :title='title'>
		<div slot='body'>
			<div class='flex justify-between'>
				<Button icon='file-image' @click='onClickUpload'>Select Image(s)</Button>
				<Button :class='shouldDisableUpload ? "disabled" : ""' color='green' icon='upload' @click='onClickSave'>Upload</Button>
			</div>

			<div v-for='preview in filePreviews' class='flex bg-white rounded-lg shadow-lg my-6 w-full'>
				<img :src='preview.src' class='p-4 w-32 h-32 object-cover'>
				<div class='py-4 pr-4 flex flex-col flex-1'>
					<p class='text-lg tracking-wide'>{{ preview.name }}</p>
					<div class='flex-1'></div>
				</div>
			</div>

		</div>
	</TheModal>
</template>

<script>
import TheModal from '@/components/TheModal';
import fileUpload from '@/lib/fileUpload';

const VALID_FILETYPES = ['image/jpg', 'image/jpeg', 'image/png'];

export default {
	components: {
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
			files: [],
			filePreviews: []
		}
	},
	computed: {
		loading() {
			return this.$store.state.isLoading;
		},
		shouldDisableUpload() {
			return !this.files.length || this.loading
		}
	},
	methods: {
		close() {
			this.$emit('close');
		},
		onClickUpload() {
			this.$store.dispatch("setLoading", true);
			fileUpload({ multiple: true }, e => {
				const files = e.path[0].files;
				this.files = Object.values(files);

				this.filePreviews = [];

				for (const idx in this.files) {
					const f = this.files[idx];
					const { name, size, type } = f;
					this.filePreviews.push({ name, size, valid: !VALID_FILETYPES.includes(type) });
					const reader = new FileReader();
					reader.onload = e => {
						this.filePreviews.splice(idx, 1, {
							...this.filePreviews[idx], src: e.target.result
						});
					};
					reader.readAsDataURL(f);
				}
			});
			this.$store.dispatch("setLoading", false);
		},
		async onClickSave() {
			const formData = new FormData();
			for (const f of this.files) {
				formData.append('image', f);
			}
			await this.$store.dispatch('User/Application/addBrandImage', formData);
		}
	}
};
</script>
