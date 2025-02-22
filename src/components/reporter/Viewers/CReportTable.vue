<template>
  <b-card
    no-body
    class="h-100 rounded-0"
  >
    <b-table-simple
      :table-variant="options.tableVariant"
      :dark="options.dark"
      :bordered="options.bordered"
      :borderless="options.borderless"
      :outlined="options.outlined"
      :striped="options.striped"
      :responsive="options.responsive"
      :fixed="options.fixed"
      :hover="options.hover"
      :small="options.small"
      :no-border-collapse="options.noCollapse"
      sticky-header
      class="flex-grow-1 mh-100 mb-0"
    >
      <colgroup
        v-for="(cg, i) in tabelify.colgroups"
        :key="i"
        :class="{ local: cg.isLocal, foreign: !cg.isLocal }"
        :span="cg.size"
      />

      <b-thead
        :head-variant="options.headVariant"
      >
        <b-tr
          v-if="dataframes.length > 1"
        >
          <b-th
            v-for="(c, i) in tabelify.header"
            :key="i"
            v-bind="c.column.attrs || {}"
            class="border-0"
          >
            <p
              v-if="c.sourceName"
              class="m-0"
            >
              {{ c.sourceName }}
            </p>
          </b-th>
        </b-tr>
        <b-tr>
          <b-th
            v-for="(c, i) in tabelify.header"
            :key="i"
            class="border-0"
            :class="{ 'pointer': !c.meta.sortKey.includes('.') }"
            @click="handleSort(c.meta.sortKey)"
          >
            <div
              class="d-flex align-items-center"
            >
              <div
                class="d-flex text-nowrap"
              >
                {{ c.column.label }}
              </div>

              <font-awesome-layers
                v-if="!c.meta.sortKey.includes('.')"
                class="ml-2"
              >
                <font-awesome-icon
                  :icon="['fas', 'angle-up']"
                  class="mb-1"
                  :style="{
                    color: sort.field === c.meta.sortKey && !sort.descending ? 'black' : 'grey',
                  }"
                />
                <font-awesome-icon
                  :icon="['fas', 'angle-down']"
                  class="mt-1"
                  :style="{
                    color: sort.field === c.meta.sortKey && sort.descending ? 'black' : 'grey',
                  }"
                />
              </font-awesome-layers>
            </div>
          </b-th>
        </b-tr>
      </b-thead>

      <b-tbody
        class="h-100"
      >
        <b-tr
          v-for="(r, i) in tabelify.rows"
          :key="i"

          :class="{
            separator: !!r[0].separator,
          }"
        >
          <b-td
            v-for="(c, j) in r"
            :key="j"
            v-bind="c.attrs || {}"
          >
            {{ c.value }}
          </b-td>
        </b-tr>
      </b-tbody>
    </b-table-simple>

    <b-card-footer
      class="d-flex p-1 rounded-0"
    >
      <b-button-group
        class="ml-auto"
      >
        <b-button
          :disabled="!hasPrevPage"
          variant="link"
          class="d-flex align-items-center text-dark px-1"
          @click="goToPage()"
        >
          <font-awesome-icon
            :icon="['fas', 'angle-double-left']"
          />
        </b-button>
        <b-button
          :disabled="!hasPrevPage"
          variant="link"
          class="d-flex align-items-center text-dark"
          @click="goToPage('prevPage')"
        >
          <font-awesome-icon
            :icon="['fas', 'angle-left']"
            class="mr-1"
          />
          {{ labels.previous }}
        </b-button>
        <b-button
          :disabled="!hasNextPage"
          variant="link"
          class="d-flex align-items-center text-dark"
          @click="goToPage('nextPage')"
        >
          {{ labels.next }}
          <font-awesome-icon
            :icon="['fas', 'angle-right']"
            class="ml-1"
          />
        </b-button>
      </b-button-group>
    </b-card-footer>
  </b-card>
</template>

<script>
import base from './base.vue'

export default {
  extends: base,

  data () {
    return {
      sort: {
        field: '',
        descending: false,
      },

      cursors: [],
      cursor: undefined,
    }
  },

  computed: {
    localDataframe () {
      return this.dataframes[0]
    },

    // indexFrames groups frames based on the related DS identifiers
    // for easier work.
    indexFrames () {
      const ix = {}
      for (const df of this.dataframes || []) {
        if (!df.relSource) {
          continue
        }

        if (!ix[df.relSource]) {
          ix[df.relSource] = {}
        }
        if (!ix[df.relSource][df.refValue]) {
          ix[df.relSource][df.refValue] = []
        }
        ix[df.relSource][df.refValue].push(df)
      }

      return ix
    },

    tabelify () {
      if (!this.dataframes.length) {
        return {}
      }

      return this.tabelifyFrame(this.localDataframe)
    },

    hasPrevPage () {
      return !!this.cursors.length
    },

    nextPage () {
      if (this.localDataframe) {
        const { nextPage } = this.localDataframe.paging || {}
        return nextPage
      }

      return undefined
    },

    hasNextPage () {
      return !!this.nextPage
    },
  },

  watch: {
    localDataframe: {
      immediate: true,
      handler (dataframe, oldDataframe) {
        if (dataframe && !oldDataframe) {
          const firstField = dataframe.sort.includes(',') ? dataframe.sort.split(',')[0] : dataframe.sort

          if (firstField.includes('DESC')) {
            this.sort.descending = true
            this.sort.field = firstField.split(' ')[0]
          } else {
            this.sort.field = firstField
          }
        }
      },
    },
  },

  methods: {
    // keyColumns returns all of the key columns with indexes for all of the
    // columns that are used in joins.
    keyColumns (frame) {
      const foreignFrames = this.getForeignFrames(frame)
      const keys = {}
      if (foreignFrames === undefined) {
        return keys
      }

      for (const ff of Object.values(foreignFrames)) {
        for (const f of ff) {
          keys[f.relColumn] = f.columns.findIndex(({ name }) => name === f.relColumn)
        }
      }

      return keys
    },

    getForeignFrames (frame) {
      return this.indexFrames[frame.ref]
    },

    // tabelifyFrame returns a set of rows and columns that should be shown
    // for this frame.
    //
    // maxSize is used to calculate the rowSpan that should be applied to joined
    // frames with fewer rows then the other.
    //
    // Flow outline:
    //  * for each row of the frame:
    //  ** find all foreign frames
    //  ** tabelify foreign frames
    //  ** merge with the current tabelified result
    tabelifyFrame (frame, maxSize = 1) {
      const outRows = []
      const isLocal = frame.ref === this.localDataframe.ref

      // Index selected columns
      const selectedCols = new Set()
      for (const c of this.options.columns[frame.ref] || []) {
        selectedCols.add(frame.columns.findIndex(({ name }) => name === c.name))
      }

      const hSeanFrames = {}
      const outHeader = [...selectedCols].map(index => {
        const column = frame.columns[index]
        return {
          column,
          meta: {
            ref: frame.ref,
            sortKey: isLocal ? column.name : `${frame.ref}.${column.name}`,
          },
        }
      })

      const outColgroups = [{ size: outHeader.length, isLocal: isLocal }]

      const relFrames = this.getForeignFrames(frame)
      const usedKeys = this.keyColumns(frame)

      for (const r of frame.rows || []) {
        maxSize = 1

        const row = this.tabelifyRow(r, [...selectedCols])

        const auxRows = []
        for (const colIndex of Object.values(usedKeys)) {
          const relFrame = relFrames[r[colIndex]]

          // Determine the largest frame so our maxSize will match
          for (const rf of relFrame || []) {
            maxSize = Math.max(maxSize, rf.rows.length)
          }

          // Tabelify related frames
          for (const rf of relFrame || []) {
            // const refColumnIndexes = (this.options.columns[rf.ref] || []).map(({ name }) => {
            //   return frame.columns.findIndex(fc => fc.name === name)
            // })

            const aux = this.tabelifyFrame(rf, Math.max(rf.rows.length, maxSize))

            // Optionally append header
            if (!hSeanFrames[rf.ref]) {
              const x = [...aux.header]
              x[0].sourceName = rf.ref
              outHeader.push(...x)
              hSeanFrames[rf.ref] = true
              outColgroups.push(...aux.colgroups)
            }

            // Rowspan smaller frames so the table is nice and aligned
            if (aux.rows.length < maxSize) {
              for (const col of aux.rows[aux.rows.length - 1]) {
                col.attrs = { rowspan: (maxSize - aux.rows.length) + 1 }
              }
            }

            auxRows.push(aux.rows)
          }
        }

        // Merge the original row with joined rows
        // - the forst row of the merged row gets joined with the original row
        // - the rest are appended to the list (they are offsetted by rowspan)
        if (auxRows.length > 0) {
          for (const c of row) {
            c.attrs = { rowspan: maxSize }
          }
          row[0].separator = true

          const merged = this.mergeRows(auxRows).pop()
          row.push(...merged[0])
          outRows.push(row)
          outRows.push(...merged.slice(1))
        } else {
          outRows.push(row)
        }
      }

      return { rows: outRows, maxSize, header: outHeader, colgroups: outColgroups }
    },

    mergeRows (auxRows, maxSize) {
      if (auxRows.length <= 1) {
        return auxRows
      }

      const a = auxRows[auxRows.length - 2]
      const b = auxRows[auxRows.length - 1]

      const tmpRows = []
      for (let i = 0; i < a.length; i++) {
        const row = a[i]
        if (i >= b.length) {
          tmpRows.push(row)
          continue
        }
        row.push(...b[i])
        tmpRows.push(row)
      }

      if (b.length > a.length) {
        tmpRows.push(...b.slice(a.length))
      }

      auxRows.splice(auxRows.length - 2, 2, tmpRows)
      return this.mergeRows(auxRows)
    },

    tabelifyRow (row, selectedCols = []) {
      const out = []

      selectedCols.forEach(index => {
        out.push({ value: row[index] })
      })

      return out
    },

    // Sorting
    handleSort (fieldName) {
      let relatedDatasource
      if (fieldName.includes('.')) {
        [relatedDatasource, fieldName] = fieldName.split('.')
        return // Uncomment this when foreign frame sorting is implemented
      }

      if (fieldName) {
        const { field, descending } = this.sort

        if (this.cursor) {
          this.cursor = undefined
          this.cursors = []
        }

        if (fieldName === field) {
          this.sort.descending = !descending
        } else {
          this.sort.field = fieldName
          this.sort.descending = false
        }
      }

      this.updateDefinition(relatedDatasource)
    },

    goToPage (dir) {
      switch (dir) {
        case 'nextPage':
          if (!this.cursors.length) {
            this.cursors.push(undefined)
          }
          this.cursors.push(this.nextPage)
          this.cursor = this.nextPage
          break

        case 'prevPage':
          this.cursors.pop()
          this.cursor = this.cursors.pop()
          break

        default:
          this.cursor = undefined
          this.cursors = []
      }

      this.updateDefinition()
    },

    // Meta
    updateDefinition (updatedDatasource) {
      if (this.localDataframe) {
        // Get related datasource
        let ref = this.localDataframe.ref

        if (updatedDatasource) {
          ref = (this.dataframes.find(({ ref }) => ref === updatedDatasource) || {}).ref
        }

        if (ref) {
          const def = {
            ref,
          }
  
          // Sorting
          const { field, descending } = this.sort
          if (field) {
            // Generate sort string
            const sort = descending ? `${field} DESC` : field
            def.sort = sort
          }

          // Paging
          if (this.cursor) {
            let { limit } = this.localDataframe.paging || {}

            if (!limit) {
              limit = this.options.datasources[0] ? this.options.datasources[0].paging.limit || 20 : 20
            }

            def.paging = {
              cursor: this.cursor,
              limit,
            }
          }

          const definition = {}
          definition[ref] = def

          this.$emit('update', definition)
        }
      }
    },
  },
}
</script>

<style scoped lang="scss">
.foreign {
  border: 1px solid rgba(#162425, 0.8);
  border-top: 0;
  border-bottom: 0;
}

.separator {
  border-top: 2px solid rgba(#162425, 0.5);
}

.card-rounded {
  border-radius: 1rem 1rem 0 0;
}
</style>
