<template>
  <b-input-group>
    <b-form-input
      v-if="!noDate"
      v-model="date"
      type="date"
      class="d-inline w-50"
    />

    <b-form-input
      v-if="!noTime"
      v-model="time"
      type="time"
      class="d-inline w-50"
    />
  </b-input-group>
</template>
<script lang="js">
import moment from 'moment'
import { getDate, setDate, getTime, setTime } from './lib/index.ts'

export default {
  props: {
    value: {
      type: String,
      required: true,
    },

    noTime: {
      type: Boolean,
      default: false,
    },

    noDate: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    date: {
      get () {
        return getDate(this.value)
      },

      set (date) {
        date = setDate(date, this.value, this.noDate, this.noTime)

        if (date) {
          this.$emit('input', date)
        }
      },
    },

    time: {
      get () {
        return getTime(this.value)
      },

      set (time) {
        time = setTime(time, this.value, this.noDate, this.noTime)

        if (time) {
          this.$emit('input', time)
        }
      },
    },
  },
}
</script>
