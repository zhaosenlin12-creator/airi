<script setup lang="ts">
import type { YXZInteractionStatus } from '../../assets/yxz/interaction'

import { computed, onUnmounted, ref } from 'vue'

import {
  buildYXZPreviewPrompt,
  createYXZPreview,
  getYXZPrintApiBase,
  previewImageSrc,
} from '../../composables/use-yxz-print-preview'

const emit = defineEmits<{
  status: [status: YXZInteractionStatus]
}>()

const isOpen = ref(false)
const description = ref('')
const selectedOptions = ref<string[]>(['圆润可爱', '适合 3D 打印'])
const previews = ref<Array<{ src: string, caption: string }>>([])
const sessionId = ref<string>()
const errorMessage = ref('')
const isLoading = ref(false)
const controller = ref<AbortController>()

const options = [
  '圆润可爱',
  '简洁造型',
  '适合 3D 打印',
  '单色模型',
  '保留明显轮廓',
] as const

const buttonLabel = computed(() => isLoading.value ? '正在生成…' : '生成预览')

function toggleOption(option: string) {
  selectedOptions.value = selectedOptions.value.includes(option)
    ? selectedOptions.value.filter(item => item !== option)
    : [...selectedOptions.value, option]
}

async function generatePreview() {
  if (isLoading.value)
    return

  errorMessage.value = ''
  previews.value = []
  controller.value?.abort()
  controller.value = new AbortController()
  isLoading.value = true
  emit('status', 'processing')

  try {
    const result = await createYXZPreview({
      prompt: buildYXZPreviewPrompt(description.value, selectedOptions.value),
      sessionId: sessionId.value,
      signal: controller.value.signal,
    })
    sessionId.value = result.sessionId
    previews.value = result.previews.map(item => ({
      src: previewImageSrc(item),
      caption: item.caption ?? `方案 ${item.index + 1}`,
    }))
    emit('status', 'success')
  }
  catch (error) {
    if ((error as Error)?.name !== 'AbortError') {
      errorMessage.value = error instanceof Error ? error.message : '预览生成失败，请稍后再试'
      emit('status', 'idle')
    }
  }
  finally {
    isLoading.value = false
    controller.value = undefined
  }
}

function closePanel() {
  controller.value?.abort()
  isOpen.value = false
  emit('status', 'idle')
}

onUnmounted(() => controller.value?.abort())
</script>

<template>
  <div class="yxz-print-preview">
    <button
      v-if="!isOpen"
      type="button"
      class="yxz-print-launch"
      aria-label="打开宜小智产品预览"
      @click="isOpen = true"
    >
      <span class="yxz-print-launch-dot" />
      <span>开始创作</span>
    </button>

    <section v-else class="yxz-print-panel" aria-label="宜小智产品预览">
      <header class="yxz-print-header">
        <div>
          <strong>宜小智创作预览</strong>
          <small>先确认效果，再进入 3D 制作</small>
        </div>
        <button type="button" class="yxz-print-close" aria-label="关闭预览面板" @click="closePanel">×</button>
      </header>

      <textarea
        v-model="description"
        class="yxz-print-input"
        rows="3"
        maxlength="500"
        placeholder="例如：一个戴着红围巾的小熊桌面摆件"
        :disabled="isLoading"
      />
      <div class="yxz-print-options" aria-label="设计约束">
        <button
          v-for="option in options"
          :key="option"
          type="button"
          class="yxz-print-chip"
          :class="{ active: selectedOptions.includes(option) }"
          :aria-pressed="selectedOptions.includes(option)"
          :disabled="isLoading"
          @click="toggleOption(option)"
        >
          {{ option }}
        </button>
      </div>
      <button type="button" class="yxz-print-submit" :disabled="isLoading || !description.trim()" @click="generatePreview">
        {{ buttonLabel }}
      </button>
      <p v-if="errorMessage" class="yxz-print-error" role="alert">{{ errorMessage }}</p>
      <div v-if="previews.length" class="yxz-print-grid" aria-live="polite">
        <figure v-for="preview in previews" :key="preview.src" class="yxz-print-card">
          <img :src="preview.src" :alt="preview.caption">
          <figcaption>{{ preview.caption }}</figcaption>
        </figure>
      </div>
      <small class="yxz-print-endpoint">预览服务：{{ getYXZPrintApiBase() }}</small>
    </section>
  </div>
</template>

<style scoped>
.yxz-print-preview {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  z-index: 20;
  font-family: inherit;
}

.yxz-print-launch,
.yxz-print-submit {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  border: 1px solid rgba(24, 126, 180, .34);
  border-radius: 999px;
  background: rgba(255, 255, 255, .94);
  color: #15547c;
  padding: .55rem .9rem;
  box-shadow: 0 8px 24px rgba(27, 111, 177, .15);
  cursor: pointer;
}

.yxz-print-launch:hover,
.yxz-print-submit:hover:not(:disabled) {
  background: #f1fbff;
}

.yxz-print-launch-dot {
  width: .55rem;
  height: .55rem;
  border-radius: 50%;
  background: #18a8e0;
  box-shadow: 0 0 0 4px rgba(24, 168, 224, .12);
}

.yxz-print-panel {
  width: min(22rem, calc(100vw - 2rem));
  padding: 1rem;
  border: 1px solid rgba(24, 126, 180, .22);
  border-radius: 1rem;
  background: rgba(255, 255, 255, .96);
  box-shadow: 0 16px 40px rgba(24, 83, 120, .18);
  backdrop-filter: blur(14px);
}

.yxz-print-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: .75rem;
  margin-bottom: .8rem;
  color: #15547c;
}

.yxz-print-header strong,
.yxz-print-header small {
  display: block;
}

.yxz-print-header small,
.yxz-print-endpoint {
  margin-top: .2rem;
  color: #6b8798;
  font-size: .72rem;
}

.yxz-print-close {
  border: 0;
  background: transparent;
  color: #62859a;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
}

.yxz-print-input {
  width: 100%;
  resize: vertical;
  border: 1px solid #c8e1ec;
  border-radius: .7rem;
  padding: .65rem .7rem;
  color: #234b61;
  outline: none;
}

.yxz-print-input:focus {
  border-color: #18a8e0;
  box-shadow: 0 0 0 3px rgba(24, 168, 224, .12);
}

.yxz-print-options {
  display: flex;
  flex-wrap: wrap;
  gap: .4rem;
  margin: .7rem 0;
}

.yxz-print-chip {
  border: 1px solid #c8e1ec;
  border-radius: 999px;
  background: #fff;
  color: #44738b;
  padding: .25rem .55rem;
  font-size: .72rem;
  cursor: pointer;
}

.yxz-print-chip.active {
  border-color: #18a8e0;
  background: #eaf8fd;
  color: #15547c;
}

.yxz-print-submit {
  width: 100%;
  justify-content: center;
  border-radius: .7rem;
  background: #eaf8fd;
}

.yxz-print-submit:disabled,
.yxz-print-chip:disabled {
  cursor: not-allowed;
  opacity: .55;
}

.yxz-print-error {
  margin: .7rem 0 0;
  color: #b34646;
  font-size: .78rem;
}

.yxz-print-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .55rem;
  margin-top: .8rem;
}

.yxz-print-card {
  overflow: hidden;
  margin: 0;
  border: 1px solid #d7eaf1;
  border-radius: .7rem;
  background: #f6fbfd;
}

.yxz-print-card img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.yxz-print-card figcaption {
  overflow: hidden;
  padding: .35rem .45rem;
  color: #52758a;
  font-size: .68rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
