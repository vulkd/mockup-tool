<template>
	<div class='px-8 bg-white dark:bg-black border-b dark:border-gray-700 flex justify-between items-center w-full' style='height: 60px'>
		<div v-if='$slots.title' class='flex items-center text-black dark:text-gray-500'>
			<slot name='title'></slot>
		</div>
		<div v-if='$slots.content' class='flex flex-1 items-center px-4'>
			<slot name='content'></slot>
		</div>
		<div v-if='$slots.end' class='flex items-center flex-1 justify-end'>
			<slot name='end'></slot>
		</div>
	</div>
</template>

<script>
export default {
	data() {
		return {

		}
	}
};
</script>
