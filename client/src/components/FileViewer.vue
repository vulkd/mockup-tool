<template>
	<div class="p-4 pb-6 overflow-auto flex flex-wrap items-start justify-center">
		<Dropzone v-if='shouldShowDropzone' @drop='$emit("drop", $event)'></Dropzone>

		<FileCard
		v-for='f in filesToDisplay'
		:key='f.id'
		:f='f'
		@fileClick='$emit("fileClick", f)'
		@deleteFile='$emit("deleteFile", f)'
		@editFilename='$emit("editFilename", $event)'
		@onTagClick='onTagClick'
		></FileCard>

	</div>
</template>

<script>
import Dropzone from '@/components/Dropzone';
import FileCard from '@/components/FileCard';

export default {
	components: {
		Dropzone,
		FileCard
	},
	props: {
		files: Array,
		searchTerm: String,
		shouldShowDropzone: Boolean,
		dropzoneOptions: Object
	},
	async created() {
		// if (!this.$store.state.User.Application.tags) {
		await this.$store.dispatch('User/Application/loadTags');
		// }
	},
	computed: {
		tags() {
			return this.$store.state.User.Application.tags;
		},
		filesToDisplay() {
			if (this.searchTerm.startsWith('#')) {
				return this.files
				.map(f => ({ ...f, tags: [].concat(this.tags[f.asset_id]).map(t => ({ name: t })) }))
				.filter(f => {
					return f.tags && f.tags.map(t => t.name ? t.name.toUpperCase() : '').includes(this.searchTerm.slice(1).toUpperCase())
				});
			}

			else if (this.searchTerm) {
				return this.files
				.map(f => ({ ...f, tags: [].concat(this.tags[f.asset_id]).map(t => ({ name: t })) }))
				.filter(f => {
					return `${f.desc}${f.name}${f.created_by}${f.updated_by}${JSON.stringify(f.tags)}`.toUpperCase().includes(this.searchTerm.toUpperCase());
				});
			}

			else {
				return this.files.map(f => ({ ...f, tags: [].concat(this.tags[f.asset_id]).map(t => ({ name: t })) }));
			}
		}
	},
	methods: {
		onTagClick(name) {
			this.$emit('onTagClick', name);
		}
	}
};
</script>
