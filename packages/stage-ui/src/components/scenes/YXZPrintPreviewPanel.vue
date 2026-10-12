<script setup lang="ts">
import type { YXZInteractionStatus } from '../../assets/yxz/interaction'
import type { ChatHistoryItem, YXZCreationPayload } from '../../types/chat'

import { nanoid } from 'nanoid'
import { computed, onUnmounted, ref } from 'vue'

import YXZCreationMessageCard from './YXZCreationMessageCard.vue'

import {
  buildYXZPreviewPrompt,
  createYXZCartoonModel,
  createYXZPreview,
  getYXZPrintApiBase,
  previewImageSrc,
} from '../../composables/use-yxz-print-preview'
import { getYXZRequirementNextQuestion, useYXZRequirementMemory } from '../../composables/use-yxz-requirement-memory'
import { useChatSessionStore } from '../../stores/chat/session-store'

const emit = defineEmits<{
  status: [status: YXZInteractionStatus]
}>()

const options = [
  '圆润可爱',
  '简洁造型',
  '适合 3D 打印',
  '单色模型',
  '保留明显轮廓',
] as const

const chatSession = useChatSessionStore()
const requirementMemory = useYXZRequirementMemory()
const storedRequirement = requirementMemory.state.value
const isOpen = ref(false)
const description = ref(storedRequirement?.description ?? '')
const selectedOptions = ref<string[]>(storedRequirement?.constraints.length
  ? storedRequirement.constraints.filter(option => options.includes(option as typeof options[number]))
  : ['圆润可爱', '适合 3D 打印'])
const previews = ref<Array<{ index: number, src: string, caption: string }>>([])
const sessionId = ref<string>()
const selectedIndex = ref<number>()
const model = ref<{ modelUrl: string, stlUrl: string, glbUrl: string }>()
const modelProgress = ref({ percent: 0, message: '' })
const errorMessage = ref('')
const isLoading = ref(false)
const isModelLoading = ref(false)
const controller = ref<AbortController>()
const chatMessageId = ref<string>()

const buttonLabel = computed(() => isLoading.value ? '正在生成…' : '生成预览')
const modelButtonLabel = computed(() => isModelLoading.value ? `正在制作 ${modelProgress.value.percent}%` : '把这个方案做成 3D')
const selectedPreview = computed(() => previews.value.find(preview => preview.index === selectedIndex.value))
const nextQuestion = computed(() => getYXZRequirementNextQuestion(requirementMemory.state.value))

function rememberCurrentRequirement() {
  requirementMemory.update({
    description: description.value,
    constraints: selectedOptions.value,
  })
}

async function persistCreation(status: YXZCreationPayload['status']) {
  const preview = selectedPreview.value
  if (!preview)
    return

  try {
    await chatSession.initialize()
    const sessionId = chatSession.activeSessionId
    if (!sessionId)
      return

    const text = `我已整理好「${preview.caption}」创作方案，你可以继续确认预览或进入 3D 制作。`
    const message: ChatHistoryItem = {
      role: 'assistant',
      content: text,
      slices: [{ type: 'text', text }],
      tool_results: [],
      yxzCreation: {
        kind: 'yxz-creation',
        description: description.value.trim(),
        options: [...selectedOptions.value],
        preview,
        model: model.value,
        status,
      },
      createdAt: Date.now(),
      id: chatMessageId.value ?? nanoid(),
    }

    const messages = chatSession.getSessionMessages(sessionId)
    const existingIndex = messages.findIndex(item => item.id === chatMessageId.value)
    if (existingIndex >= 0) {
      const next = [...messages]
      next[existingIndex] = message
      chatSession.setSessionMessages(sessionId, next)
    }
    else {
      chatMessageId.value = message.id
      chatSession.appendSessionMessage(sessionId, message)
    }
  }
  catch {
    // Preview generation remains usable even when chat persistence is unavailable.
  }
}

function toggleOption(option: string) {
  selectedOptions.value = selectedOptions.value.includes(option)
    ? selectedOptions.value.filter(item => item !== option)
    : [...selectedOptions.value, option]
}

function selectPreview(index: number) {
  selectedIndex.value = index
  model.value = undefined
  void persistCreation('preview')
}

function openPanel() {
  isOpen.value = true
}

function clearRequirementMemory() {
  requirementMemory.clear()
  description.value = ''
  selectedOptions.value = ['圆润可爱', '适合 3D 打印']
}

async function generatePreview() {
  if (isLoading.value)
    return

  errorMessage.value = ''
  rememberCurrentRequirement()
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
      index: item.index,
      src: previewImageSrc(item),
      caption: item.caption ?? `方案 ${item.index + 1}`,
    }))
    selectedIndex.value = result.previews[0]?.index
    model.value = undefined
    void persistCreation('preview')
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

async function generateModel() {
  if (isModelLoading.value || !sessionId.value || selectedIndex.value === undefined)
    return

  errorMessage.value = ''
  model.value = undefined
  isModelLoading.value = true
  modelProgress.value = { percent: 0, message: '准备生成 3D 模型…' }
  emit('status', 'processing')
  controller.value?.abort()
  controller.value = new AbortController()

  try {
    model.value = await createYXZCartoonModel({
      sessionId: sessionId.value,
      imageIndex: selectedIndex.value,
      signal: controller.value.signal,
      onProgress: (progress) => {
        modelProgress.value = { percent: Math.max(0, Math.min(100, progress.percent)), message: progress.message }
      },
    })
    void persistCreation('model-ready')
    emit('status', 'success')
  }
  catch (error) {
    if ((error as Error)?.name !== 'AbortError') {
      errorMessage.value = error instanceof Error ? error.message : '3D 生成失败，请稍后再试'
      emit('status', 'idle')
    }
  }
  finally {
    isModelLoading.value = false
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
      @click="openPanel"
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
        <div class="yxz-print-header-actions">
          <button type="button" class="yxz-print-memory-clear" @click="clearRequirementMemory">
            清除记忆
          </button>
          <button type="button" class="yxz-print-close" aria-label="关闭预览面板" @click="closePanel">
            ×
          </button>
        </div>
      </header>

      <textarea
        v-model="description"
        class="yxz-print-input"
        rows="3"
        maxlength="500"
        placeholder="例如：一个戴着红围巾的小熊桌面摆件"
        :disabled="isLoading"
      />
      <p class="yxz-print-hint" role="status">
        宜小智：{{ nextQuestion }}
      </p>
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
      <p v-if="errorMessage" class="yxz-print-error" role="alert">
        {{ errorMessage }}
      </p>
      <div v-if="previews.length" class="yxz-print-grid" aria-live="polite">
        <figure v-for="preview in previews" :key="preview.src" class="yxz-print-card">
          <button type="button" class="yxz-print-card-button" :class="{ selected: selectedIndex === preview.index }" :aria-label="`选择${preview.caption}`" @click="selectPreview(preview.index)">
            <img :src="preview.src" :alt="preview.caption">
          </button>
          <figcaption>{{ preview.caption }}</figcaption>
        </figure>
      </div>
      <YXZCreationMessageCard
        v-if="selectedPreview"
        :preview-src="selectedPreview.src"
        :caption="selectedPreview.caption"
        :description="description"
        :model-url="model?.modelUrl"
        :stl-url="model?.stlUrl"
        @adopt="void persistCreation('adopted'); emit('status', 'success')"
        @redescribe="model = undefined; void persistCreation('redescribe')"
      />
      <div v-if="previews.length" class="yxz-print-model-actions">
        <button type="button" class="yxz-print-submit" :disabled="isModelLoading || selectedIndex === undefined" @click="generateModel">
          {{ modelButtonLabel }}
        </button>
        <div v-if="isModelLoading" class="yxz-print-progress" role="status" aria-live="polite">
          <span :style="{ width: `${modelProgress.percent}%` }" />
          <small>{{ modelProgress.message }}</small>
        </div>
        <div v-if="model" class="yxz-print-model-result">
          3D 模型已生成，可继续预览或下载 STL。
        </div>
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

.yxz-print-header-actions {
  display: flex;
  align-items: center;
  gap: .35rem;
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

.yxz-print-memory-clear {
  border: 0;
  background: transparent;
  color: #6b8798;
  font-size: .68rem;
  cursor: pointer;
}

.yxz-print-memory-clear:hover {
  color: #087eae;
  text-decoration: underline;
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

.yxz-print-hint {
  margin: .45rem 0 0;
  color: #52758a;
  font-size: .72rem;
  line-height: 1.45;
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

.yxz-print-card-button {
  display: block;
  width: 100%;
  padding: 0;
  border: 2px solid transparent;
  background: transparent;
  cursor: pointer;
}

.yxz-print-card-button.selected {
  border-color: #18a8e0;
}

.yxz-print-card img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.yxz-print-model-actions {
  margin-top: .8rem;
}

.yxz-print-progress {
  overflow: hidden;
  margin-top: .55rem;
  border-radius: .5rem;
  background: #e5f1f5;
}

.yxz-print-progress > span {
  display: block;
  height: .35rem;
  background: #18a8e0;
  transition: width 300ms ease;
}

.yxz-print-progress small {
  display: block;
  padding: .35rem .45rem;
  color: #52758a;
  font-size: .7rem;
}

.yxz-print-model-result {
  display: flex;
  flex-wrap: wrap;
  gap: .45rem .7rem;
  align-items: center;
  margin-top: .6rem;
  color: #15547c;
  font-size: .75rem;
}

.yxz-print-model-result a {
  color: #087eae;
  text-decoration: underline;
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
