<template>
  <div
    ref="droparea"
    class="absolute top-0 left-0 h-full w-full select-none"
    :class="{'highlight': isDragging, 'block': isDragging, 'hidden': !isDragging}"
  />
</template>

<script>
export default {
	data() {
		return {
			isDragging: false
		};
	},
	mounted() {
		window.addEventListener("dragenter", (e) => {
			this.isDragging = true;
		});

		const dropArea = this.$refs.droparea;

		for (const eventName of ["dragenter", "dragover", "dragleave", "drop"]) {
			dropArea.addEventListener(eventName, ((e) => {
				e.preventDefault();
				e.stopPropagation();
			}), false);
		}
		for (const eventName of ["dragenter", "dragover"]) {
			dropArea.addEventListener(eventName, ((e) =>{
				this.isDragging = true;
			}), false);
		}
		for (const eventName of ["dragleave", "drop"]) {
			dropArea.addEventListener(eventName, ((e) => {
				this.isDragging = false;
			}), false);
		}
		dropArea.addEventListener("drop", (e) => {
			this.$emit("drop", e);
		}, false);
	}
};
</script>

<style scoped>
.highlight {
	opacity: .25;
	background: lime;
	background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 4 4'%3E%3Cpath fill='%23000000' fill-opacity='.5' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E");
}
</style>
