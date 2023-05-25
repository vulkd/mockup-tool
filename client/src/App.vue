<template>
  <div id="app" class="text-black dark:text-gray-500 bg-gray-100 dark:bg-gray-900 antialiased dark:subpixel-antialiased m-auto overflow-x-hidden flex flex-col min-h-screen">

    <!-- <WIP></WIP> -->

    <TheToast v-if="errorMessage || infoMessage" :fade="infoMessage" :color="errorMessage ? 'red' : 'green'" :icon="infoMessage ? 'check' : 'exclamation'">{{ errorMessage || infoMessage }}</TheToast>

    <TheModals></TheModals>

    <TheNav></TheNav>

    <main class="flex-1 flex">
      <transition name="fade" mode="out-in">
        <router-view class="flex-1 mx-auto"></router-view>
      </transition>
    </main>

    <!-- <TheFooter></TheFooter> -->
  </div>
</template>

<script>
import WIP from '@/components/WIP';

import TheNav from '@/components/TheNav';
import TheFooter from '@/components/TheFooter';
import TheToast from '@/components/TheToast';
import TheModals from '@/components/TheModals';

export default {
  components: {
    WIP,

    TheNav,
    TheFooter,
    TheToast,
    TheModals
  },
  beforeCreate() {
    if (this.$store.state.shouldUseDarkMode) {
      document.querySelector('html').classList.toggle('mode-dark');
    }
  },
  computed: {
    errorMessage() {
      return this.$store.state.errorMessage;
    },
    infoMessage() {
      return this.$store.state.infoMessage;
    }
  },
  watch: {
    $route() {
      this.$store.dispatch("setMessages", {});
      this.$store.dispatch("setLoading", false);
      if (!this.$store.User || !this.$store.User.account_id) this.$store.dispatch('User/loadUser');
    }
  }
};
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition-duration: 0.075s;
  transition-property: opacity;
  transition-timing-function: ease;
}

.fade-enter,
.fade-leave-active {
  opacity: 0
}
</style>

