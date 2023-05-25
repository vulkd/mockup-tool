<template>
  <div>
  	<input type='range' :min='min' :max='max' :step='step' :value='value' @input='$emit("input", parseFloat($event.target.value))'>
  </div>
</template>

<script>
  export default {
  	props: {
  		min: Number,
  		max: Number,
  		step: {
  			type: Number,
  			default: 1
  		},
  		value: Number|String
  	},
    data() {
      return {

      }
    },
  };
</script>
