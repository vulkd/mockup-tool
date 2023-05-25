<template>
	<div>
		<TheTitleBar>
				<b slot='title' class='tracking-wide mr-8'>Base Image Library</b>
				<div slot='content' class='flex w-full justify-end'>
					<Button color="green" icon='plus' @click='$store.dispatch("setModal", "ApplicationModalBaseImageNew")'>New Base Image</Button>
				</div>
				<div slot='end' class='flex-1 flex'>
					<InputSelect :showNoneOption="false" class='w-40 mr-4' placeholder='Sort' size='sm' v-model='searchSort' :options="['Date Created', 'Date Updated', 'Creator', 'Recent User']"></InputSelect>
					<Input icon='search' closeIcon='times' @closeIconClick='searchTerm=""' v-model='searchTerm' size='sm' :placeholder='`Search ${files.length} base images...`'></Input>
				</div>
		</TheTitleBar>

		<FileViewer
		:files='files'
		:searchTerm='searchTerm'
		ref='fileviewer'
		:shouldShowDropzone='true'
		@fileClick='onFileClick'
		@deleteFile='onFileDelete'
		@editFilename='onEditFilename'
		@drop='onFileDrop'
		@onTagClick='onTagClick'
		></FileViewer>
	</div>
</template>

<script>
import Input from '@/components/Input/Input';
import FileViewer from '@/components/FileViewer';
import TheTitleBar from '@/components/TheTitleBar';
import fileUpload from '@/lib/fileUpload';
import InputSelect from "@/components/Input/InputSelect";

export default {
	components: {
		Input,
		FileViewer,
		TheTitleBar,
		InputSelect
	},
	data() {
		return {
			searchSort: 'Date Updated',
			searchTerm: '',
		}
	},
	mounted() {
		this.$refs.fileviewer.$el.style.height = `calc(100vh - ${this.$refs.fileviewer.$el.offsetTop}px)`;
		this.$store.dispatch('User/Application/loadBaseImages');
	},
	computed: {
		files() {
			const files = JSON.parse(JSON.stringify(this.$store.state.User.Application.baseImages));
			for (const f of files) {
				f.src = `${process.env.VUE_APP_ROOT_API}/upload/${this.$store.state.User.account_id}/asset-base/320/${f.src}`;
				f.tags = [];
			}
			return files;
		},
		loading() {
			return this.$store.state.isLoading;
		}
	},
	methods: {
		onFileDelete(e) {
			if (confirm('Are you sure? This will remove the image from any mockups using it')) {
				this.$store.dispatch('User/Application/removeBaseImage', e);
			}
		},
		onEditFilename(e) {
			console.log(e)
		},
		onFileDrop(e) {
			// if (this.loading) return;
			console.log(e);
		},
		onFileClick({ id }) {
			this.$store.dispatch('User/Application/ApplicationBaseImage/loadBaseImage', id);
			this.$router.push({ name: 'application-create-base-image', params: { id }});
		},
		onTagClick(name) {
			this.searchTerm = `#${name}`;
		}
	}
};
</script>
