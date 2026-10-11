<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelSrc?: string
  paused?: boolean
  xOffset?: number | string
  yOffset?: number | string
  scale?: number
}>(), {
  paused: false,
  scale: 1,
})

const componentState = defineModel<'pending' | 'loading' | 'mounted'>('state', { default: 'pending' })

function onLoad() {
  componentState.value = 'mounted'
}

function onError() {
  componentState.value = 'pending'
}

function cssLength(value?: number | string) {
  if (value === undefined)
    return undefined

  return typeof value === 'number' ? `${value}px` : value
}
</script>

<template>
  <div
    relative h-full w-full overflow-hidden
    aria-label="宜小智"
  >
    <img
      v-if="modelSrc"
      :src="modelSrc"
      alt="宜小智"
      left="50%" top="50%"

      pointer-events-none absolute h-full max-h-full max-w-full w-full select-none object-contain
      :style="{
        transform: `translate(calc(-50% + ${cssLength(props.xOffset) ?? '0px'}), calc(-50% + ${cssLength(props.yOffset) ?? '0px'})) scale(${props.scale})`,
        opacity: props.paused ? 0.94 : 1,
      }"
      @load="onLoad"
      @error="onError"
    >
  </div>
</template>
