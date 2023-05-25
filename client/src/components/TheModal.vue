<template>
	<transition name='modal'>
		<div v-show='show'>
			<div @click='close()' class='modal-bg z-40 bg-brand-800 dark:bg-black opacity-75 w-full h-full absolute inset-0 flex'></div>

			<div class="z-50 pt-32 fixed m-auto w-full" @click='close()'>


				<div @click.stop class="z-50 m-auto bg-gray-100 dark:bg-gray-900 dark:text-gray-500 rounded shadow-xl w-full max-w-xl">
					<div class='flex items-center justify-between rounded-t py-2 pl-2 bg-black subpixel-antialiased tracking-wider font-semibold text-brand-100'>
						<span class='flex-1 px-4 py-2'>{{ title }}</span>
						<div class="px-6 py-2 flex items-center justify-center cursor-pointer hover:text-red-500" @click="close()">
							<Icon name="times" :scale='.8'></Icon>
						</div>
					</div>
					<div class='p-6 overflow-auto' style='max-height: 70vh'>
						<slot name='body'></slot>
					</div>
					<div v-if='!!this.$slots["footer"]' class='flex items-center justify-between py-2 px-4 rounded-b text-sm bg-brand-800 subpixel-antialiased tracking-wide font-semibold text-brand-100'>
						<slot name='footer'></slot>
					</div>
				</div>


			</div>
		</div>
	</transition>
</template>

<script>
export default {
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

	mounted() {
		document.addEventListener("keydown", this.onKeydown);
	},
	methods: {
		onKeydown(e) {
			if (this.show && e.keyCode == 27) {
				this.close();
			}
		},
		close() {
			this.$store.dispatch('setModal', null);
		}
	},
	beforeDestroy() {
		document.removeEventListener('keydown', this.onKeydown);
	}
};

</script>

<style scoped>
.modal {
	z-index: 20000;
	/*background: rgba(0,0,0,.15);*/
	/*transition: opacity .3s ease;*/
	@apply fixed table top-0 left-0 w-full h-full;
}

.modal-bg {
	backdrop-filter: blur(2px) saturate(0.5);
}

.modal > div {
	@apply table-cell align-middle;
}

.modal > div > div {
	/*transition: opacity .3s ease;*/
	@apply my-0 mx-auto bg-gray-100 rounded overflow-hidden shadow-lg;
}

.modal-enter {
	opacity: 0;
}

.modal-leave-active {
	opacity: 0;
}

.modal-enter .modal-container,
.modal-leave-active .modal-container {
	-webkit-transform: scale(1.1);
	transform: scale(1.1);
}
</style>
