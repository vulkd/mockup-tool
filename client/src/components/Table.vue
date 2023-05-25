<template>
  <div class="text-brand-800">
    <table
      class="w-full table-fixed font-normal rounded-lg text-sm shadow border-b-4 border-brand-700 border-separate overflow-hidden"
      style="border-spacing: 0;"
    >
      <thead class="bg-brand-100">
        <tr>
          <td
            v-if="showRowIndexes"
            class="p-3"
            :class="{'cursor-pointer hover:text-brand-400': sortable}"
            style="width: 60px"
            v-on="{click: sortable ? () => sortTableByColumn(0) : () => {}}"
          />
          <th
            v-for="(cell, colIdx) in cols"
            :key="colIdx"
            class="p-3 text-left"
            :class="{'cursor-pointer hover:text-brand-400': sortable}"
            v-on="{click: sortable ? () => sortTableByColumn(colIdx) : () => {}}"
          >
            {{ cell }}
            <Icon
              v-show="currentSort === colIdx"
              :name="currentSortDesc ? 'chevron-up' : 'chevron-down'"
              scale=".5"
              class="select-none"
            />
          </th>
        </tr>
      </thead>
      <tbody
        class="text-xs antialiased"
        :class="{'font-mono': mono}"
      >
        <tr
          v-for="(row, rowIdx) in sortedRows"
          :key="rowIdx"
          :class="rowIdx % 2 === 0 ? 'bg-white' : 'bg-brand-100'"
        >
          <td
            v-if="showRowIndexes"
            class="p-2 text-brand-200 text-center"
          >
            {{ sortable ? row[0] : rowIdx }}
          </td>
          <td
            v-for="(cell, cellIdx) in sortable ? row.splice(1) : row"
            class="px-3 py-2"
          >
            {{ cell }}
          </td>
        </tr>
      </tbody>
      <tfoot v-if="$slots.footer">
        <!-- <template slot="footer">... -->
        <slot name="footer" />
      </tfoot>
    </table>

    <div
      v-if="paginate"
      class="flex items-center justify-between mt-2 pt-1 px-2"
    >
      <div
        class="flex cursor-pointer"
        :class="currentPage === 1 ? 'select-none text-brand' : 'hover:text-brand-400'"
        @click="currentPage = 1"
      >
        <Icon name="chevron-left" />
        <Icon name="chevron-left" />
      </div>
      <Icon
        name="chevron-left"
        class="mx-2 cursor-pointer hover:text-brand-400"
        @click.native="prevPage"
      />
      <span
        style="min-width: 60px"
        class="text-center"
      >{{ currentPage }} / {{ totalPages }}</span>
      <Icon
        name="chevron-right"
        class="mx-2 cursor-pointer hover:text-brand-400"
        @click.native="nextPage"
      />
      <div
        class="flex cursor-pointer hover:text-brand-400"
        @click="currentPage = totalPages"
      >
        <Icon name="chevron-right" />
        <Icon name="chevron-right" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
	props: {
		cols: {
			type: Array,
			required: true
		},
		rows: {
			type: Array,
			required: true
		},
		mono: Boolean,
		sortable: Boolean,
		scrollable: Boolean,
		showRowIndexes: Boolean,
		paginate: {
			type: Number,
			validator: (val) => val > 1
		}
	},
	data() {
		return {
			currentSort: false,
			currentSortDesc: false,
			currentPage: 1
		};
	},
	computed: {
		sortedRows() {
			let rows = this.showRowIndexes ? this.rows.map((r, idx) => [idx, ...r]) : this.rows;
			rows = this.sortable ? rows.sort((a, b) => {
				const modifier = this.currentSortDesc ? -1 : 1;
				return a[this.currentSort] < b[this.currentSort] ? -1 * modifier : a[this.currentSort] > b[this.currentSort] ? 1 * modifier : 0;
			}) : rows;
			return this.paginate ?rows.filter((row, idx) => {
				return idx >= (this.currentPage - 1) * this.paginate && idx < this.currentPage * this.paginate;
			}) : rows;
		}
	},
	created() {
		this.totalPages = Math.ceil(this.rows.length / this.paginate);
	},
	methods: {
		sortTableByColumn(columnIdx) {
			if (columnIdx === this.currentSort) {
				this.currentSortDesc = !this.currentSortDesc;
			}
			this.currentSort = columnIdx;
		},
		nextPage() {
			if (this.currentPage * this.paginate < this.rows.length) {
				this.currentPage++;
			}
		},
		prevPage() {
			if (this.currentPage > 1) {
				this.currentPage--;
			}
		}
	}
};
</script>

<style scoped>
	th {
    border-bottom: 1px solid var(--color-brand-200);
	}
	tr td:not(:last-child) {
    border-right: 1px solid var(--color-brand-200);
	}
</style>
