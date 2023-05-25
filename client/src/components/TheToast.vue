<template>
	<div
	ref="notification"
	class="notification w-full cursor-pointer fixed top-0 italic left-0 inline-flex overflow-hidden"
	:class="`${visible ? 'notification-visible' : ''} text-${color}-300 bg-${color}-500`"
	@click="fadeOut(10)"
	>


	<div ref="notificationTimer" v-if="fade" class="notification-timer absolute top-0 left-0 h-full w-full bg-white"></div>

	<div class="inline-flex tracking-wide font-semibold text-sm py-2 subpixel-antialiased">
		<div v-if="icon" class="flex justify-center items-center ml-8 mr-10">
			<Icon :name="icon" class="absolute" :class="`text-${color}-300`"></Icon>
		</div>
		<slot></slot>
	</div>
</div>
</template>

<script>
export default {
	props: {
		icon: String,
		fade: Number|Boolean,
		color: { type: String, default: "pink" }
	},
	data() {
		return {
			visible: false
		};
	},
	mounted() {
		const vW = document.body.clientWidth;
		const navHeight = 38;
		// const sidebarWidth = this.$store.state.isSidebarCollapsed
		// ? 65
		// : 256;
		// const toastWidth = vW - sidebarWidth;


		this.$nextTick(() => {
			setTimeout(() => {

				this.visible = true;
				this.$refs.notification.style.height = `${navHeight}px`;
				// this.$refs.notification.style.top = `${navHeight}px`;
				// this.$refs.notification.style.width = `${toastWidth}px`;
				// this.$refs.notification.style.left = `${sidebarWidth}px`;

				const fadeTime = typeof this.fade === "number" ? this.fade : 2500;
				this.$refs.notificationTimer.style.transition = `${fadeTime / 1000}s transform`;
				this.$refs.notificationTimer.classList.add("notification-timer-complete");
			}, 44);

			if (this.fade) {
				this.fadeOut();
			}
		});
	},
	methods: {
		fadeOut(fadeTime) {
			fadeTime = fadeTime || typeof this.fade === "number" ? this.fade : 2500;
			setTimeout(() => this.visible = false, fadeTime);
			setTimeout(() => this.$store.dispatch("setMessages", {}), fadeTime + 300); // Account for fadeout transition
		}
	}
};
</script>

<style scoped>
.notification {
	z-index: 99999999999;
	opacity: 0;
	transform: translateX(-100%);
	transition: none;
}

.notification-visible {
	opacity: 1;
	transform: translateX(0);
	transition: .3s opacity ease-in, .17s transform ease-in;
}

.notification-timer {
	opacity: .1;
	transform: translateX(-100%);
}

.notification-timer-complete {
	transform: translateX(0);
}
</style>
