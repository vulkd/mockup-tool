<template>
  <svg :style="{'width': size === 'sm' ? '1em' : '4em'}" :class="`text-${color}-500`" class="m-auto block fill-current" viewBox="0 0 140 140">
    <rect x="0" y="0" width="60" height="60">
      <animate attributeName="fill-opacity" begin="0s" dur="1s" values="1;.2;1" calcMode="linear" repeatCount="indefinite"></animate>
    </rect>
    <rect x="80" y="0" width="60" height="60">
      <animate attributeName="fill-opacity" begin="100ms" dur="1s" values="1;.2;1" calcMode="linear" repeatCount="indefinite"></animate>
    </rect>
    <rect x="0" y="80" width="60" height="60">
      <animate attributeName="fill-opacity" begin="300ms" dur="1s" values="1;.2;1" calcMode="linear" repeatCount="indefinite"></animate>
    </rect>
    <rect x="80" y="80" width="60" height="60">
      <animate attributeName="fill-opacity" begin="600ms" dur="1s" values="1;.2;1" calcMode="linear" repeatCount="indefinite"></animate>
    </rect>
  </svg>
</template>

<script>
export default {
  props: {
    size: {
      type: String,
      default: "base",
      validator: (value) => ["base", "sm"].includes(value)
    },
    color: {
      type: String,
      default: "brand"
    }
  }
};
</script>
