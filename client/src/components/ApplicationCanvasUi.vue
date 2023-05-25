<template functional>
	<div :class='`${data.staticClass || ""} ${data.class || ""}`' class='canvas-ui absolute top-0 left-0 w-full p-4 text-white opacity-75 text-xs' style='z-index: 9999'>
		<div class='flex'>
			<slot></slot>
		</div>
	</div>
</template>
