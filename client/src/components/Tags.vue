<template>
  <div>
  	<div
    v-if='Object.values(tags[0])[0]'
    v-for='tag in tags'
    :class='`bg-${tag.color}-100 text-${tag.color}-600 hover:text-${tag.color}-500 ${noUnderline ? "cursor-default" : "hover:underline"} ${isInteractive ? "" : "pr-1"}`'
    class='mr-1  text-xxxs inline-flex items-center justify-center rounded-full'
    :style='tag.color || !tag.name ? "" : `color: ${getColorFromHash(tag.name, {l:45})}; background-color: ${getColorFromHash(tag.name, {l:90})}`'
    ><span class='pl-1' @click.stop='$emit("tagClick", tag)'>{{ tag.name }}</span><Icon v-if='isInteractive' @click.stop='deleteTag(tag.name)' name='times' scale='.6' class='mx-1'></Icon></div>

    <div v-if='isInteractive'>
      <div v-if='isAddingNewTag'>
        <input
        ref='input'
        v-model.trim='newTag'
        @blur='cancelNewTag'
        @keyup.enter='addNewTag'
        class='select-none border bg-gray-100 text-gray-600 hover:text-gray-500 mr-1 px-1 text-xxxs inline-flex items-center justify-center rounded-full'
        >
        <!-- <div @click='addNewTag' class='select-none bg-gray-100 text-gray-600 hover:text-gray-500 mr-1 px-1 text-xxxs inline-flex items-center justify-center rounded-full'>Save New Tag</div> -->
      </div>

      <div
      v-else
      @click.stop='onNewTagClick'
      class='select-none bg-gray-100 text-gray-600 hover:text-gray-500 mr-1 px-1 text-xxxs inline-flex items-center justify-center rounded-full'>Add Tag</div>
    </div>
  </div>
</template>

<script>

import { getColorFromHash } from '@/lib/color';

export default {
 props: {
  tags: Array|String,
  noUnderline: Boolean
},
data() {
  return {
   newTag: '',
   isAddingNewTag: false,
 }
},
computed: {
  isInteractive() {
    return this.$listeners && this.$listeners.newTag;
  }
},
methods: {
  getColorFromHash,
  onNewTagClick() {
    this.isAddingNewTag = true;
    this.$nextTick(() => {
     this.$refs.input.focus();
   });
  },
  cancelNewTag() {
    this.isAddingNewTag = false;
    this.newTag = '';
  },
  addNewTag() {
    this.isAddingNewTag = false;
    this.$emit('newTag', this.newTag)
    this.newTag = '';
  },
  deleteTag(name) {
    this.$emit('deleteTag', name)
  }
}
};
</script>
