<template>
  <div class="hidden">
    <label for="email">
      Confirm Your Email Address
    </label>
    <input
      id="email"
      ref="input"
      name="email"
      type="text"
      tabindex="-1"
      autocomplete="off"
      :value="value"
      :required="req"
      @input="$emit('input', $event.target.value)"
    >
    {{ value }}
  </div>
  <!-- pattern="^hi$" -->
  <!-- aria-hidden -->
</template>

<script>
export default {
	props: {
		value: {
			type: String,
			required: true
		},
		req: {
			type: Boolean,
			default: true
		}
	}
};
</script>

