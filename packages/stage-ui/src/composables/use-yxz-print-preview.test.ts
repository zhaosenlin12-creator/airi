import { describe, expect, it, vi } from 'vitest'

import { buildYXZPreviewPrompt, createYXZPreview, previewImageSrc } from './use-yxz-print-preview'

describe('YXZ print preview adapter', () => {
  it('adds selected design constraints without changing the original description', () => {
    expect(buildYXZPreviewPrompt('一个小猫摆件', ['圆润可爱', '适合 3D 打印']))
      .toBe('一个小猫摆件\n\n设计约束：圆润可爱、适合 3D 打印')
  })

  it('normalizes backend preview payloads and image URLs', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      session_id: 'abc123',
      prompt: '一个小猫摆件',
      previews: [{ index: 0, b64: 'ZmFrZQ==', caption: '正面' }, { index: 1, path: '/api/data/abc/previews/img_1.png' }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))

    const result = await createYXZPreview({ prompt: '一个小猫摆件', sessionId: 'abc123' }, fetcher)
    expect(result.sessionId).toBe('abc123')
    expect(result.previews).toHaveLength(2)
    expect(previewImageSrc(result.previews[0])).toBe('data:image/png;base64,ZmFrZQ==')
    expect(previewImageSrc(result.previews[1], 'http://127.0.0.1:8000'))
      .toBe('http://127.0.0.1:8000/api/data/abc/previews/img_1.png')
  })

  it('rejects malformed responses instead of rendering untrusted data', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 200 }))
    await expect(createYXZPreview({ prompt: '测试' }, fetcher)).rejects.toThrow('数据格式')
  })
})
