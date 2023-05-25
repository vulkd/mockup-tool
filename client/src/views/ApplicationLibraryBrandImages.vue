<template>
	<div>
		<TheTitleBar>
				<b slot='title' class='tracking-wide mr-8'>Brand Image Library</b>
				<div slot='content' class='flex w-full justify-end'>
					<Button color="green" icon='plus' @click='$store.dispatch("setModal", "ApplicationModalBrandImageNew")'>New Brand Image</Button>
				</div>
				<div slot='end' class='flex-1 flex'>
					<InputSelect :showNoneOption="false" class='w-40 mr-4' placeholder='Sort' size='sm' v-model='searchSort' :options="['Date Created', 'Date Updated', 'Creator', 'Recent User']"></InputSelect>
					<Input icon='search' closeIcon='times' @closeIconClick='searchTerm=""' v-model='searchTerm' size='sm' :placeholder='`Search ${files.length} brand images...`'></Input>
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
import InputSelect from '@/components/Input/InputSelect';
import FileViewer from '@/components/FileViewer';
import TheTitleBar from '@/components/TheTitleBar';
import fileUpload from '@/lib/fileUpload';

export default {
	components: {
		Input,
		InputSelect,
		FileViewer,
		TheTitleBar
	},
	data() {
		return {
			searchSort: 'Date Updated',
			searchTerm: ''
		}
	},
	mounted() {
		if (!this.$store.state.User.account_id) this.$store.dispatch('User/loadUser');
		this.$refs.fileviewer.$el.style.height = `calc(100vh - ${this.$refs.fileviewer.$el.offsetTop}px)`;
		this.$store.dispatch('User/Application/loadBrandImages');
	},
	computed: {
		files() {
			const files = JSON.parse(JSON.stringify(this.$store.state.User.Application.brandImages));
			for (const f of files) {
				f.src = `${process.env.VUE_APP_ROOT_API}/upload/${this.$store.state.User.account_id}/asset-brand/320/${f.src}`;
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
				this.$store.dispatch('User/Application/removeBrandImage', e);
			}
		},
		onEditFilename(e) {
			console.log(e)
		},
		onFileDrop(e) {
			console.log(e);
		},
		onFileClick() {

		},
		onTagClick(name) {
			this.searchTerm = `#${name}`;
		}
	}
};
</script>
