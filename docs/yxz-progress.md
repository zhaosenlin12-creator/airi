# 宜小智 AI 智能创造系统进度记录

更新时间：2026-10-12（Asia/Shanghai）

## 当前分支

`feature/yxz-character-foundation`

## 已完成

### 切片 0：资源底座

- 从 `C:\kaifa_senlin\pingdou\yxz-img` 引入宜小智 5 张透明 PNG 姿态图。
- 建立资源清单、角色名称、品牌标识和姿态用途。
- 提交：`f6ef113 feat: add yxz character pose assets`

### 切片 1：默认形象接入

- 新增 `image` 模型格式和 `preset-yxz` 内置模型。
- AIRI 默认启动形象切换为宜小智。
- 设置页支持预览和选择“宜小智 2D”，原有 Live2D/VRM 保留。
- 提交：`64f3cc4 feat: use yxz image as default stage model`

### 切片 2：互动状态与姿态

- 新增状态气泡：欢迎、聆听、思考、回应、处理中、完成。
- 状态映射到不同宜小智姿态：正面、侧身、坐姿、俯身、背面。
- 对话生命周期已接入：用户消息开始 → 聆听；模型生成 → 思考；语音播放 → 回应；播放结束 → 完成。
- 气泡使用 `role="status"` 和 `aria-live="polite"`，可被辅助技术感知。

### 切片 3：参考 emotion-ball 的动作语言

- 研究 `zhaosenlin-bit/emotion-ball` 的状态机设计：由状态 ID 驱动表现，表现层消费配置，不把角色模型和交互引擎强耦合。
- 参考其呼吸、漂移、扫视、脉冲、关键帧过渡等动画原语，为宜小智加入克制的状态动作：待机漂浮、聆听轻倾、思考脉冲、回应上浮、完成弹跳。
- 保留宜小智 PNG 形象，不复制 emotion-ball 的球形角色视觉；当前动作在浏览器和桌面容器均使用 CSS 可暂停动画实现。
- 参考仓库明确区分角色视觉许可和引擎/表情数据许可，因此本项目只借鉴交互模式，不直接引入其角色素材。

### 切片 4：可扩展状态配置

- 将状态到姿态/文案的映射抽到 `assets/yxz/interaction.ts`，组件只负责渲染，后台可以复用同一份状态协议。
- 预留 `emotion/status + tips` 形式的接入点，后续打印预览、切片、打印和取件流程可统一驱动角色反馈。

### 切片 5：只读产品预览链路

- 新增 `use-yxz-print-preview.ts`，对接 Cartoon Print Studio 现有 `POST /api/previews`。
- 新增“开始创作”面板：输入描述、选择设计约束、生成 2D 预览并在 AIRI 内展示结果。
- 预览请求默认指向 `http://127.0.0.1:8000`，可通过 `VITE_CARTOON_PRINT_API` 覆盖；当前只读，不触发 3D 生成、切片软件或打印。
- 对后端响应做边界校验，支持 base64 和相对路径图片，接口失败只在面板内提示，不阻塞聊天主流程。
- 生成中驱动宜小智 `processing`，成功驱动 `success`，与之前的状态动作层连通。

### 切片 6：2D 方案到 3D 模型

- 预览卡片支持选中具体方案，避免把多个候选图直接混在后续任务中。
- 新增 `createYXZCartoonModel` 适配器，对接 Cartoon Print Studio 的 `POST /api/3d_cartoon`。
- 生成期间并行轮询 `/api/progress/{session_id}`，将后端的 `percent / message / step` 映射到宜小智面板进度条。
- 生成成功后提供 GLB 预览和 STL 下载入口；本阶段仍不自动打开切片软件，也不直接触发打印。
- 3D 任务仍由显式按钮触发，失败只在面板内提示，不阻塞聊天主流程。

### 切片 7：Voicebox 宜小智男声

- 新增 `voicebox-local` 语音提供商，调用 Voicebox 本地 `POST /generate/stream`，兼容浏览器和 Windows 桌面容器。
- 默认使用 Qwen CustomVoice 1.7B，推荐在 Voicebox 中建立中文男声 `Eric` 档案；该音色明亮、有活力，适合宜小智的卡通感。
- 将上游 OpenAI 风格 TTS 请求转换为 Voicebox 请求，默认语气为“温暖、活泼、亲切，带一点可爱的卡通感”。
- 通过 Voicebox `/profiles` 自动发现本地声音档案；Voicebox 未启动时只提示配置问题，不影响 AIRI 其他功能。

#### Voicebox 验收准备

1. Windows 安装并启动 Voicebox，保持本地 API `http://127.0.0.1:17493` 可访问。
2. 在 Voicebox → Profiles 创建 `Qwen CustomVoice` 档案，选择中文男声 `Eric`，建议模型为 1.7B。
3. 打开 AIRI 设置 → Speech → Voicebox（Local），刷新声音档案并选择刚创建的 Eric 档案。
4. 先在 Voicebox provider playground 播放一句测试文本，再回到宜小智对话验证整段 TTS。

### 切片 8：创作方案消息卡片

- 新增宜小智创作方案卡片，包含预览图、方案描述、“采用这个方案”和“重新描述”。
- 3D 生成成功后，卡片继续提供 GLB 预览和 STL 下载入口。
- 卡片已同时挂载在创作面板和聊天历史中，生成预览、切换候选方案、生成 3D、采用/重新描述都会更新同一条消息。

### 切片 9：多轮需求记忆与消息持久化

- 新增 `use-yxz-requirement-memory.ts`，将描述、设计约束、风格、受众、数量和更新时间保存到浏览器本地存储。
- 每次生成预览前合并本轮回答，自动去重约束；面板会显示下一步最值得确认的问题，避免一次性让用户填写长表单。
- 支持“清除记忆”，清除只影响宜小智创作需求，不会清空 AIRI 普通聊天历史。
- 新增 `yxzCreation` 聊天消息类型，方案图片、描述、GLB/STL 链接和当前状态会随会话存储，可刷新后继续回看。
- 创建方案消息使用同一条消息 ID 更新，避免生成 3D 后重复刷屏。

### 切片 10：Voicebox 连接向导

- Voicebox 设置页新增连接状态提示，会显示检测中、未连接、已连接声音档案数量等状态。
- 新增“重新检测”按钮，Voicebox 启动后无需刷新 AIRI 页面即可重新发现 `/profiles` 中的声音档案。
- 仍保留 Eric 创建提示、模型大小和宜小智语气配置，完成连接后可直接在 playground 播放测试。

### 切片 11：主动开场

- Web 和 Windows 桌面入口在宜小智形象启用后，会在首次进入当前会话时自动添加自我介绍。
- 介绍包含身份、可提供的创作帮助和下一步表达方式；固定消息 ID 保证刷新或重新挂载不会重复插入。
- 视觉层仍会同步显示“欢迎，我是宜小智”状态气泡；语音自动播放受浏览器音频策略和 Voicebox 服务状态影响。

### 切片 12：质量、健壮性与性能验收

- 历史聊天中的创作卡片改为只读展示，移除不会生效的“采用/重新描述”按钮；可操作按钮只保留在当前创作面板，避免误导。
- 预览请求增加 2 分钟超时，3D 请求增加 10 分钟超时；超时会显示明确错误并终止进度轮询，避免后台任务无限挂起。
- 创作消息持久化增加版本保护，快速切换候选方案时只允许最后一次状态写入，避免异步请求乱序覆盖。
- 候选预览图启用 lazy loading 与异步解码，降低一次展示多张图片时的主线程和首屏压力。
- 本轮真实验收：Web 首页连续 5 次返回 HTTP 200，首请求约 502 ms、后续约 5–10 ms；打印服务 `/api/health` 连续 5 次返回 HTTP 200，首请求约 1.05 s、后续约 2–5 ms。

## 本阶段验收

- [x] `pnpm -F @proj-airi/stage-ui typecheck`
- [x] 浏览器端 `http://127.0.0.1:5174/` 加载成功。
- [x] 浏览器 DOM 中存在宜小智图片节点和状态气泡。
- [x] 默认浏览器截图显示宜小智正面姿态及“欢迎，我是宜小智”气泡。
- [x] `YXZImageScene` 已支持状态动作类名和 `prefers-reduced-motion` 降级。
- [x] 状态映射已从组件内抽离为可复用配置。
- [x] Cartoon Print Studio `/api/health` 本机连通（服务运行于 `127.0.0.1:8000`）。
- [x] 预览与 3D 任务适配器单测：4 项通过。
- [x] 3D 任务进度字段与 Cartoon Print Studio `progress.py` 的 `percent / message / step` 对齐。
- [x] 3D 结果链接已接入面板，未自动执行切片或打印。
- [x] Voicebox TTS 请求适配器测试：2 项通过。
- [x] `stage-pages` typecheck 通过，Voicebox 设置页可被路由发现。
- [x] 创作方案卡片已接入预览面板，支持采用/重新描述。
- [x] 需求记忆单测 3 项通过，聊天历史支持持久化创作方案卡片。
- [x] `pnpm -F @proj-airi/stage-web build` 成功；保留现有构建警告。
- [x] 未修改 AIRI 工作区中已有的语音、providers、国际化等未提交变更。
- [x] stage-ui 聚焦测试 9 项通过，stage-ui / stage-web / stage-pages 类型检查通过。
- [x] 本轮 Web 生产构建成功；仅保留既有的大包、wasm、Browserslist 等构建警告。
- [x] 已对 Web 首页、打印服务健康接口和空提示词错误响应做真实 HTTP 验证。

## 当前限制

现有素材是透明 PNG，不是 Live2D 或 VRM 绑定模型。因此目前是“姿态切换 + 状态气泡”，还不是连续面部变形、眨眼和口型同步。后续如需连续表情，需要补充或制作 Live2D/VRM 模型。

## 下一阶段

1. 将“受众/风格/数量”从记忆字段接入聊天中的结构化确认按钮。
2. 接入打开切片软件、打印确认和取件流程，并为 Windows 桌面容器增加安全白名单。
