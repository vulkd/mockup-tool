<template>
  <div class='z-50 absolute top-0 left-0 bg-yellow-500 text-xs text-black font-semibold subpixel-antialiased px-4 py-1'>
  	WIP
  <div class="h-6 w-6 bg-red-500 sm:g-orange-500 md:bg-yellow-500 lg:bg-green-500 xl:bg-teal-500"></div>


  	{{ routeDetails }}
  </div>
</template>

<script>
  export default {
  	data() {
  		return {
  			routeDetails: null
  		}
  	},
    watch: {
    	$route(val) {
    		this.routeDetails = val.matched.slice(-1)[0].components.default.__file
    		console.log(this.routeDetails)
    	}
    }
  };
</script>
