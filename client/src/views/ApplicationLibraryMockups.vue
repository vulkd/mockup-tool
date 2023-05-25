<template>
	<div>
		<TheTitleBar>
			<b slot='title' class='tracking-wide mr-8'>Mockup Library</b>
			<div slot='content' class='flex w-full justify-end'>
				<div v-if='files.length' class='flex ml-4'>
					<Button color="yellow" icon='star-half-alt' class='mr-4'>Render</Button>
					<Button icon='file-export' class='mr-4'>Export</Button>
					<Button icon='share' class='mr-4'>Share</Button>
				</div>

				<Button color="green" icon='plus' @click='$router.push({ name: "application-create-mockup" })'>New Mockup</Button>
				<!-- <Button icon='file-import' iconFlip='horizontal'>Import Mockups</Button> -->
			</div>
			<div slot='end' class='flex-1 flex'>
					<InputSelect :showNoneOption="false" class='w-40 mr-4' placeholder='Sort' size='sm' v-model='searchSort' :options="['Date Created', 'Date Updated', 'Creator', 'Recent User']"></InputSelect>
				<Input icon='search' closeIcon='times' @closeIconClick='searchTerm=""' v-model='searchTerm' size='sm' :placeholder='`Search ${files.length} mockups...`'></Input>
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


export default {
	components: {
		Input,
		FileViewer,
		InputSelect,
		TheTitleBar
	},
	data() {
		return {
			searchSort: 'Date Updated',
			searchTerm: '',
		}
	},
	mounted() {
		this.$refs.fileviewer.$el.style.height = `calc(100vh - ${this.$refs.fileviewer.$el.offsetTop}px)`;
		this.$store.dispatch('User/Application/loadMockups');
	},
	computed: {
		files() {
			const files = JSON.parse(JSON.stringify(this.$store.state.User.Application.mockups));
			for (const f of files) {
				f.src = `${process.env.VUE_APP_ROOT_API}/upload/${this.$store.state.User.account_id}/asset-mockup/320/${f.src}`;
			}
			return files;
		},
		loading() {
			return this.$store.state.isLoading;
		}
	},
	methods: {
		onFileDelete(e) {
			if (confirm('Are you sure? This mockup will be unrecoverable, and any renders will be lost.')) {
				this.$store.dispatch('User/Application/removeMockup', e);
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
			this.$store.dispatch('User/Application/ApplicationMockup/loadMockup', id);
			this.$router.push({ name: 'application-create-mockup', params: { id }});
		},
		onTagClick(name) {
			this.searchTerm = `#${name}`;
		}
	}
};
</script>
