import type { ChatHistoryItem } from '../types/chat'

export const YXZ_PROACTIVE_INTRO_ID = 'yxz-proactive-intro'
export const YXZ_PROACTIVE_INTRO_TEXT = '你好，我是宜小智，你的 AI 智能创造伙伴。你可以直接告诉我想做的产品、用途和喜欢的风格，我会一步一步帮你确认方案、生成预览，再进入 3D 制作。'

export function createYXZProactiveIntro(createdAt = Date.now()): ChatHistoryItem {
  return {
    role: 'assistant',
    content: YXZ_PROACTIVE_INTRO_TEXT,
    slices: [{ type: 'text', text: YXZ_PROACTIVE_INTRO_TEXT }],
    tool_results: [],
    createdAt,
    id: YXZ_PROACTIVE_INTRO_ID,
  }
}

export function ensureYXZProactiveIntro(messages: ChatHistoryItem[], createdAt = Date.now()) {
  if (messages.some(message => message.id === YXZ_PROACTIVE_INTRO_ID))
    return { messages, added: false }

  return {
    messages: [...messages, createYXZProactiveIntro(createdAt)],
    added: true,
  }
}
