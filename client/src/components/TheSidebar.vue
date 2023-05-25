<template>
  <div class='h-full flex flex-col dark:border-gray-800 px-4 pb-4 border-b sm:px-0 sm:pb-0 sm:border-b-0 sm:border-r'>
  	<nav
    class="overflow-hidden w-full flex-1 flex sm:flex-col pt-4"
    :class="isSidebarCollapsed ? 'sm:w-16' : 'sm:w-56 lg:w-64'"
    >
    <div v-for='link in linksTop'>
      <router-link
      v-if='link'
      :key='link.to'
      :to='link.to'
      class="sidebar-link block sm:border-l-4 border-transparent p-2 text-sm hover:bg-brand-400 flex items-center"
      :class="{'justify-center': isSidebarCollapsed}">
      <Icon :name='link.icon' class='icon text-gray-700' :scale='isSidebarCollapsed ? 1.4 : 1' :class="{'ml-1': !isSidebarCollapsed}"></Icon>
      <span v-show='!isSidebarCollapsed' class='pl-4'>
        {{ link.text }}
      </span></router-link>
      <hr v-else class='my-4 dark:border-gray-800 hidden sm:block'>
    </div>

    <div class='flex-1 sm:border-b sm:border-t my-4 dark:border-gray-800'></div>

    <div v-for='link in linksBottom'>
      <router-link
      v-if='link'
      :key='link.to'
      :to='link.to'
      class="sidebar-link block sm:border-l-4 border-transparent p-2 text-sm hover:bg-brand-400 flex items-center"
      :class="{'justify-center': isSidebarCollapsed}"
      >
      <Icon :name='link.icon' class='icon text-gray-700' :scale='isSidebarCollapsed ? 1.4 : 1' :class="{'ml-1': !isSidebarCollapsed}"></Icon>
      <span v-show='!isSidebarCollapsed' class='pl-4'>{{ link.text }}</span></router-link>
      <hr v-else class='my-4 dark:border-gray-800 hidden sm:block'>
    </div>

    <hr v-show='!isSidebarCollapsed'class='my-4 dark:border-gray-800'>
    <div v-show='!isSidebarCollapsed' class='px-4 flex items-center select-none'>
      <InputToggle
      ref='darkModeToggle'
      v-model='shouldUseDarkMode'

      onIcon='moon'
      offIcon='sun'
      onColor='gray-900'
      offColor='yellow-500'
      ></InputToggle>
      <label class="uppercase text-xxs text-gray-300 font-bold pl-4 dark:text-gray-700">
        Dark Mode
      </label>
    </div>
  </nav>

  <div @click='onClickCollapseBtn' class='hidden sm:block cursor-pointer p-4 text-gray-500 dark:text-gray-700 hover:text-gray-400 border-t mt-4 dark:border-gray-800'>
    <div class='float-right'>
      <Icon :name='`chevron-${isSidebarCollapsed ? "right" : "left"}`'></Icon>
      <Icon :name='`chevron-${isSidebarCollapsed ? "right" : "left"}`'></Icon>
      <Icon :name='`chevron-${isSidebarCollapsed ? "right" : "left"}`'></Icon>
    </div>
  </div>
</div>
</template>

<script>
import InputToggle from '@/components/Input/InputToggle';

export default {
  components: {
    InputToggle
  },
  props: {
    linksTop: {
     type: Array,
     required: true
   },
   linksBottom: Array
 },
 computed: {
  shouldUseDarkMode: {
    get() {
      return this.$store.state.shouldUseDarkMode;
    },
    set(value) {
      this.$store.dispatch('toggleDarkMode');
    }
  },
  isSidebarCollapsed() {
    return this.$store.state.isSidebarCollapsed;
  }
},
methods: {
  onClickCollapseBtn() {
    this.$store.dispatch("toggleSidebarCollapsed")
  }
}
};
</script>

<style scoped>
.mode-dark .router-link-active {
  background: var(--color-indigo-700);
  border-color: var(--color-indigo-400);
  color: var(--color-indigo-400);
}

.mode-dark .router-link-active .icon {
  color: var(--color-indigo-400);
}

.mode-dark .sidebar-link:hover {
  background: var(--color-brand-800);
  border-color: var(--color-brand-700);
}

.router-link-active {
  background-color: var(--color-indigo-200);
  border-color: var(--color-indigo-700);
  color: var(--color-indigo-700);
  pointer-events: none;
}
.router-link-active .icon {
  color: var(--color-indigo-700);
}

.sidebar-link:hover {
  background: var(--color-brand-200);
  border-color: var(--color-brand-500);
}
</style>
