  <template>
   <div class='px-4 pb-4'>
    <div class='flex items-center justify-between md:block'>
      <b class='my-2 block text-xs'>{{ label }}</b>
      <span class='my-2 block text-xxxs text-gray-500 dark:text-gray-600'>{{ subLabel ? subLabel : multiple ? 'Select one or more' : 'Select one' }}</span>
    </div>

    <div class='md:pt-1 md:block flex md:flex-col flex-row h-20 md:h-auto overflow-x-auto overflow-y-hidden md:overflow-x-hidden md:overflow-y-auto'>
     <div
     v-for='i,idx in options'
     :key='idx'
     @click='onClick(i,idx)'
     class='card flex-shrink-0 w-32 select-none cursor-pointer hover-translate-y relative mr-2 md:mb-4 md:mr-0 shadow rounded-lg overflow-hidden'
     :class='`${ selected.includes(i.id) && clickedThumbnail === i.id ? "border-8" : selected.includes(i.id) ? "border-4" : ""}`'
     :style='`border-color: ${selectionColors ? selectionColors[idx] : defaultSelectionColor};`'
     >
     <img :src='i.src'>
   </div>
 </div>

</div>
</template>

<script>
export default {
 props: {
  label: String,
  subLabel: String,
  multiple: Boolean,
  options: Array,
  defaultSelectionColor: { type: String, default: 'lime' },
  selectionColors: Array,
  disabledLimit: Number
},
data() {
  return {
    selected: [],
    clickedThumbnail: null
  }
},
methods: {
  onClick(thumbnail, thumbnailIdx) {
    if (this.multiple) {
      if (this.disabledLimit && (this.disabledLimit <= this.selected.length) && !this.selected.includes(thumbnail.id)) {
        return;
      }

      let shouldSelect = true;
      for (const selectedIdx in this.selected) {
        if (this.selected[selectedIdx] === thumbnail.id) {
          this.selected.splice(selectedIdx, 1);
          shouldSelect = false;
          break;
        }
      }
      if (shouldSelect) {
        this.selected.push(thumbnail.id);
      }
    } else {
      if (this.selected.length) {
        this.selected.splice(0, 1);
      }
      this.selected.push(thumbnail.id);
    }

    this.$emit("input", { selected: this.selected, value: thumbnail });
  }
}
};
</script>

<style scoped>
.card {
 transition: transform .17s ease-out;
}

.card > .absolute {
 background-color: rgba(0,0,0,.5)
}
.card:hover > .absolute {
 display: block;
}
</style>
