<script setup lang="ts">
withDefaults(defineProps<{
  previewSrc: string
  caption: string
  description?: string
  modelUrl?: string
  stlUrl?: string
  interactive?: boolean
}>(), {
  description: '',
  interactive: true,
})

const emit = defineEmits<{
  (event: 'adopt'): void
  (event: 'redescribe'): void
}>()
</script>

<template>
  <article class="yxz-creation-card" aria-label="宜小智创作方案">
    <div class="yxz-creation-card-heading">
      <div>
        <span class="yxz-creation-card-eyebrow">宜小智创作方案</span>
        <strong>{{ caption }}</strong>
      </div>
      <span class="yxz-creation-card-badge">可继续制作</span>
    </div>
    <img :src="previewSrc" :alt="caption" class="yxz-creation-card-image">
    <p v-if="description" class="yxz-creation-card-description">{{ description }}</p>
    <div v-if="interactive" class="yxz-creation-card-actions">
      <button type="button" class="yxz-creation-card-primary" @click="emit('adopt')">采用这个方案</button>
      <button type="button" class="yxz-creation-card-secondary" @click="emit('redescribe')">重新描述</button>
    </div>
    <div v-if="modelUrl || stlUrl" class="yxz-creation-card-links">
      <a v-if="modelUrl" :href="modelUrl" target="_blank" rel="noreferrer">打开 GLB 预览</a>
      <a v-if="stlUrl" :href="stlUrl" target="_blank" rel="noreferrer">下载 STL</a>
    </div>
  </article>
</template>

<style scoped>
.yxz-creation-card {
  display: flex;
  flex-direction: column;
  gap: .65rem;
  padding: .85rem;
  border: 1px solid color-mix(in srgb, #18a8e0 32%, transparent);
  border-radius: 1rem;
  background: linear-gradient(145deg, rgba(255, 255, 255, .96), rgba(232, 248, 255, .86));
  box-shadow: 0 12px 30px rgba(25, 110, 150, .12);
}

.yxz-creation-card-heading,
.yxz-creation-card-actions,
.yxz-creation-card-links {
  display: flex;
  gap: .55rem;
  align-items: center;
  justify-content: space-between;
}

.yxz-creation-card-heading > div {
  display: flex;
  flex-direction: column;
  gap: .15rem;
}

.yxz-creation-card-eyebrow {
  color: #087eae;
  font-size: .68rem;
  letter-spacing: .04em;
}

.yxz-creation-card-heading strong {
  color: #15547c;
  font-size: .9rem;
}

.yxz-creation-card-badge {
  flex: none;
  padding: .25rem .45rem;
  border-radius: 999px;
  background: rgba(24, 168, 224, .12);
  color: #087eae;
  font-size: .68rem;
}

.yxz-creation-card-image {
  display: block;
  width: 100%;
  max-height: 15rem;
  border-radius: .7rem;
  object-fit: cover;
}

.yxz-creation-card-description {
  margin: 0;
  color: #52758a;
  font-size: .76rem;
  line-height: 1.5;
}

.yxz-creation-card-actions button {
  flex: 1;
  min-height: 2.25rem;
  border-radius: .65rem;
  cursor: pointer;
  font-size: .76rem;
}

.yxz-creation-card-primary {
  border: 0;
  background: #18a8e0;
  color: #fff;
}

.yxz-creation-card-secondary {
  border: 1px solid #b5dce9;
  background: rgba(255, 255, 255, .72);
  color: #15547c;
}

.yxz-creation-card-links {
  justify-content: flex-start;
  font-size: .73rem;
}

.yxz-creation-card-links a {
  color: #087eae;
  text-decoration: underline;
}
</style>
