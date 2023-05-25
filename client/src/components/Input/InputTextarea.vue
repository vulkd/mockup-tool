<template>
  <div>
    <label
      v-if='label'
      class='block uppercase tracking-wide text-xs font-bold mb-2 pl-1'
    >{{ label }}</label>

    <textarea
      @input='$emit("input", $event.target.value)'
      :value='value'
      :placeholder='placeholder || ""'
      :required='req'
      :rows='rows'
      class='
				font-sans
				p-4
				mb-3
				border
				border-gray-400
				block
				appearance-none
				text-block
				w-full
				rounded
				leading-tight
				focus:border-brand-500
				bg-white
				text-gray-900
				hover:border-brand-500
				border-transparent
			'
    ></textarea>
  </div>
</template>

<script>
export default {
	props: {
		value: {
			type: String,
			required: true
		},
		rows: {
			type: Number,
			default: 4
		},
		label: String,
		placeholder: String,
		req: Boolean
	}
};
</script>
