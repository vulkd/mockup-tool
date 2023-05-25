<template>
	<div class='w-full'>
		<h1 class="block text-2xl text-brand-900 font-semibold tracking-wide text-center mt-16 mb-12">Page not found</h1>
		<Button class="mx-auto" @click="click">Go Back</Button>
	</div>
</template>

<script>
export default {
	methods: {
		click() {
			window.history.go(-1);
		}
	}
};
</script>
