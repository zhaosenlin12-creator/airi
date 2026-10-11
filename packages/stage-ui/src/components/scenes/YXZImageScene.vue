<script setup lang="ts">
import type { YXZPoseId } from '../../assets/yxz'

import { computed } from 'vue'

import { getYXZPose } from '../../assets/yxz'

export type YXZInteractionStatus = keyof typeof statusPresentation

const props = withDefaults(defineProps<{
  modelSrc?: string
  pose?: YXZPoseId
  status?: YXZInteractionStatus
  statusText?: string
  paused?: boolean
  xOffset?: number | string
  yOffset?: number | string
  scale?: number
}>(), {
  paused: false,
  scale: 1,
})

const statusPresentation = {
  idle: { label: '欢迎，我是宜小智', pose: 'frontWave' },
  listening: { label: '我在听，请告诉我', pose: 'sideWave' },
  thinking: { label: '正在思考…', pose: 'seatedWave' },
  speaking: { label: '正在回应', pose: 'topWave' },
  processing: { label: '正在处理，请稍候', pose: 'backWave' },
  success: { label: '完成了，看看效果吧', pose: 'topWave' },
} as const

const componentState = defineModel<'pending' | 'loading' | 'mounted'>('state', { default: 'pending' })
const activeStatus = computed(() => props.status ?? 'idle')
const activePresentation = computed(() => statusPresentation[activeStatus.value])
const resolvedModelSrc = computed(() => {
  if (props.status || props.pose)
    return getYXZPose(props.pose ?? activePresentation.value.pose).image

  return props.modelSrc ?? getYXZPose('frontWave').image
})

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
    aria-label="宜小智互动形象"
  >
    <div
      role="status"
      aria-live="polite"
      absolute left="50%" top="4%" z-10
      max-w="calc(100% - 2rem)"
      translate-x="-50%"
      whitespace-nowrap
      rounded-lg border="1 solid rgba(27, 111, 177, 0.22)"
      bg="white/90"
      px-4 py-2
      text-sm text="[#15547c]"
      shadow="[0_6px_20px_rgba(27,111,177,0.12)]"
      transition="all 300 ease-out"
    >
      <span mr-2 inline-block h-2 w-2 rounded-full bg="[#18a8e0]" align-middle />
      <span>{{ props.statusText ?? activePresentation.label }}</span>
    </div>
    <img
      :key="resolvedModelSrc"
      :src="resolvedModelSrc"
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
