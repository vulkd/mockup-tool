d<template>
	<div @click='$emit("fileClick")' class="cursor-pointer card hover-translate-y relative bg-white dark:bg-gray-800 rounded overflow-hidden border dark:border-gray-700 shadow-xl m-3 w-full sm:w-80">

		<div class='hover-opts absolute top-0 left-0 w-full p-4'>
			<button @click.stop='$emit("deleteFile")' class='w-8 h-8 hover:opacity-100 float-right opacity-50 select-none flex items-center justify-center rounded text-white border border-black bg-black'>
				<Icon name='trash-alt' scale='.8'></Icon>
			</button>
		</div>

		<div class='overflow-hidden'>
			<img ref='img' class="w-full h-48 object-contain bg-black" :src='f.src' :alt='f.desc || ""'>
		</div>

		<div class="py-4 border-t dark:border-gray-700 ">
			<div class='px-6 flex justify-between items-center'>
				<div class='flex justify-between items-center w-full'>
					<b class='text-xs tracking-wide break-all'>{{ f.name }}</b>
				</div>
			</div>

			<div class='px-6 mt-2 text-xxs'>
				<p class='text-gray-600'>Created {{ f.date_created.split(' ')[0] }} by {{ f.created_by }}</p>
				<p class='text-gray-600'>Updated {{ f.date_updated.split(' ')[0] }} by {{ f.updated_by }}</p>

				<div  class='mt-2 text-xxs text-gray-700 flex items-center'>
					<span class='flex rounded-full pr-2 items-center hover:text-indigo-500 hover:bg-indigo-100 cursor-pointer'><span class='inline-block w-5 h-5 flex items-center justify-center rounded-full text-indigo-600 bg-indigo-100 mr-1'>1</span> Mockups</span>
					<span class='ml-4 flex rounded-full pr-2 items-center hover:text-indigo-500 hover:bg-indigo-100 cursor-pointer'><span class='inline-block w-5 h-5 flex items-center justify-center rounded-full text-indigo-600 bg-indigo-100 mr-1'>3</span> Base Images</span>
				</div>
				<div class='mt-2'>
					<Tags :noUnderline='true' :tags='f.masks && f.masks.length ? [{ name: "Masked", color: "green" }] : f.hasOwnProperty("masks") ? [{ name: "Missing Mask", color: "pink" }] : ""'></Tags>
					<Tags :tags='f.tags' @deleteTag='deleteTag' @tagClick='onTagClick' @newTag='onTagNew'></Tags>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Tags from '@/components/Tags';

export default {
	components: {
		Tags
	},
	props: {
		f: {
			type: Object,
			required: true,
			validator(value) {
				return value.hasOwnProperty('asset_id') &&
					value.hasOwnProperty('date_created') &&
					value.hasOwnProperty('date_updated') &&
					value.hasOwnProperty('name') &&
					value.hasOwnProperty('src') &&
					value.hasOwnProperty('desc');
			}
		}
	},
	data() {
		return {
		}
	},
	methods: {
		onTagNew(name) {
			this.$store.dispatch('User/Application/addTag', {
				tag: name,
				asset_id: this.f.asset_id
			});
		},
		onTagClick(tag) {
			this.$emit('onTagClick', tag.name);
		},
		deleteTag(name) {
			console.log('deleteTag')
			this.$store.dispatch('User/Application/removeTag', {
				tag: name,
				asset_id: this.f.asset_id
			})
		}
	}
};
</script>

<style scoped>
.card:hover img {
	/*object-fit: cover;*/
	transform: scale(1.1);
	transition: transform .2s ease-out;
}

.card img {
	transition: transform .2s ease-out;
}

.hover-opts {
	display: none
}
.card:hover .hover-opts {
	display: block;
	z-index: 9999;
}
</style>
