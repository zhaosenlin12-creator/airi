export interface YXZPreviewRequest {
  prompt: string
  n?: number
  prefer?: 'minimax' | 'jojo' | 'local'
  sessionId?: string
  signal?: AbortSignal
}

export interface YXZPreviewItem {
  index: number
  caption?: string
  b64?: string
  path?: string
  source?: string
}

export interface YXZPreviewResponse {
  sessionId: string
  prompt: string
  source?: string
  previews: YXZPreviewItem[]
}

export interface YXZModelRequest {
  sessionId: string
  imageIndex: number
  signal?: AbortSignal
  onProgress?: (progress: YXZModelProgress) => void
}

export interface YXZModelProgress {
  percent: number
  message: string
  step?: string
}

export interface YXZModelResponse {
  sessionId: string
  modelUrl: string
  stlUrl: string
  glbUrl: string
}

export function getYXZPrintApiBase() {
  return (import.meta.env.VITE_CARTOON_PRINT_API || 'http://127.0.0.1:8000').replace(/\/$/, '')
}

export function buildYXZPreviewPrompt(description: string, options: string[] = []) {
  const normalized = description.trim()
  const constraints = options.map(option => option.trim()).filter(Boolean)
  if (!constraints.length)
    return normalized

  return `${normalized}\n\n设计约束：${constraints.join('、')}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parsePreviewItem(value: unknown, fallbackIndex: number): YXZPreviewItem | null {
  if (!isRecord(value))
    return null

  const index = typeof value.index === 'number' ? value.index : fallbackIndex
  const b64 = typeof value.b64 === 'string' ? value.b64 : undefined
  const path = typeof value.path === 'string' ? value.path : undefined
  if (!b64 && !path)
    return null

  return {
    index,
    b64,
    path,
    caption: typeof value.caption === 'string' ? value.caption : undefined,
    source: typeof value.source === 'string' ? value.source : undefined,
  }
}

export function previewImageSrc(item: YXZPreviewItem, baseUrl = getYXZPrintApiBase()) {
  if (item.b64)
    return item.b64.startsWith('data:') ? item.b64 : `data:image/png;base64,${item.b64}`
  if (!item.path)
    return ''
  if (/^https?:\/\//i.test(item.path))
    return item.path
  return `${baseUrl}${item.path.startsWith('/') ? item.path : `/${item.path}`}`
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal?.aborted) {
      resolve()
      return
    }

    const timer = setTimeout(done, ms)
    signal?.addEventListener('abort', done, { once: true })

    function done() {
      clearTimeout(timer)
      signal?.removeEventListener('abort', done)
      resolve()
    }
  })
}

function absolutePrintApiUrl(path: string, baseUrl = getYXZPrintApiBase()) {
  if (/^https?:\/\//i.test(path))
    return path
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

async function pollYXZModelProgress(sessionId: string, signal: AbortSignal, onProgress?: (progress: YXZModelProgress) => void, fetcher: typeof fetch = fetch) {
  let since = 0
  while (!signal.aborted) {
    try {
      const response = await fetcher(`${getYXZPrintApiBase()}/api/progress/${encodeURIComponent(sessionId)}?since=${since}`, { signal })
      if (response.ok) {
        const raw: unknown = await response.json()
        if (isRecord(raw)) {
          const events = Array.isArray(raw.events) ? raw.events : []
          for (const event of events) {
            if (!isRecord(event))
              continue
            const timestamp = typeof event.ts === 'number' ? event.ts : since
            since = Math.max(since, timestamp)
            onProgress?.({
              percent: typeof event.percent === 'number' ? event.percent : 0,
              message: typeof event.message === 'string' ? event.message : '正在生成 3D 模型…',
              step: typeof event.step === 'string' ? event.step : undefined,
            })
          }
        }
      }
    }
    catch (error) {
      if ((error as Error)?.name === 'AbortError')
        return
    }
    if (signal.aborted)
      return
    await sleep(1200, signal)
  }
}

export async function createYXZCartoonModel(request: YXZModelRequest, fetcher: typeof fetch = fetch): Promise<YXZModelResponse> {
  if (!request.sessionId)
    throw new Error('缺少预览会话，无法生成 3D 模型')

  const progressController = new AbortController()
  const onAbort = () => progressController.abort()
  request.signal?.addEventListener('abort', onAbort, { once: true })
  const progressTask = pollYXZModelProgress(request.sessionId, progressController.signal, request.onProgress, fetcher)

  try {
    const response = await fetcher(`${getYXZPrintApiBase()}/api/3d_cartoon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: request.sessionId,
        image_index: request.imageIndex,
        layers: 6,
        layer_step_mm: 4,
        base_mm: 2,
        target_side: 384,
      }),
      signal: request.signal,
    })
    if (!response.ok)
      throw new Error(`3D 生成服务暂时不可用（HTTP ${response.status}）`)

    const raw: unknown = await response.json()
    if (!isRecord(raw) || typeof raw.session_id !== 'string' || typeof raw.model_url !== 'string')
      throw new Error('3D 生成服务返回的数据格式无法识别')

    request.onProgress?.({ percent: 100, message: '3D 模型已生成', step: 'done' })
    return {
      sessionId: raw.session_id,
      modelUrl: absolutePrintApiUrl(raw.model_url),
      glbUrl: absolutePrintApiUrl(`/api/export/${raw.session_id}/glb`),
      stlUrl: absolutePrintApiUrl(`/api/export/${raw.session_id}/stl`),
    }
  }
  finally {
    progressController.abort()
    request.signal?.removeEventListener('abort', onAbort)
    await progressTask.catch(() => undefined)
  }
}

export async function createYXZPreview(request: YXZPreviewRequest, fetcher: typeof fetch = fetch): Promise<YXZPreviewResponse> {
  const prompt = request.prompt.trim()
  if (!prompt)
    throw new Error('请输入想要制作的产品描述')

  const response = await fetcher(`${getYXZPrintApiBase()}/api/previews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      n: Math.min(Math.max(request.n ?? 4, 1), 4),
      prefer: request.prefer ?? 'minimax',
      session_id: request.sessionId ?? crypto.randomUUID().replace(/-/g, '').slice(0, 12),
    }),
    signal: request.signal,
  })

  if (!response.ok)
    throw new Error(`预览服务暂时不可用（HTTP ${response.status}）`)

  const raw: unknown = await response.json()
  if (!isRecord(raw) || typeof raw.session_id !== 'string' || !Array.isArray(raw.previews))
    throw new Error('预览服务返回的数据格式无法识别')

  const previews = raw.previews
    .map((item, index) => parsePreviewItem(item, index))
    .filter((item): item is YXZPreviewItem => item !== null)
  if (!previews.length)
    throw new Error('预览服务没有返回可展示的图片')

  return {
    sessionId: raw.session_id,
    prompt: typeof raw.prompt === 'string' ? raw.prompt : prompt,
    source: typeof raw.source === 'string' ? raw.source : undefined,
    previews,
  }
}
