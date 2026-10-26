# 宜小智 AI 智能创造系统进度记录

更新时间：2026-10-20（Asia/Shanghai）

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

### 切片 13：对话直连创作后台

- 将 `yxz_generatePreview` 和 `yxz_generate3DModel` 注册到宜小智聊天流的工具列表；满足需求后由模型直接调用 Cartoon Print Studio，不再要求用户手动点击“开始创作”。
- 预览结果自动写入当前会话的 `yxzCreation` 卡片；3D 工具要求本轮已有预览、用户在预览之后明确确认，并校验预览 `sessionId`，防止串会话或误触发。
- 系统提示明确要求中文、多轮单问题引导、先预览后 3D，禁止未经确认自动打印或承诺取件。
- 真实后台验收：`/api/health` 返回正常；真实预览来源为 `minimax-image`；同一会话成功生成并读取 GLB（约 20.9 MB）和 STL（约 52.4 MB）。

### 切片 14：动态 3D 形象、中文 ASR 与语音欢迎

- 宜小智默认形象由静态 PNG 渲染切换为 Three.js WebGL 程序化 3D 原型，包含眨眼、漂浮、倾头、挥手、说话口型、状态气泡和头顶光环；保留其他 AIRI 图像/Live2D/VRM 模型路径。
- 宜小智入口挂载中文欢迎语 TTS：进入页面自动播报，并提供“播放欢迎语”按钮作为浏览器自动播放策略下的可恢复入口。
- Web Speech 中文识别在宜小智模式显式使用 `zh-CN`，兼容旧版本遗留的 `en-US` 本地配置，避免中文被转写成英文。
- 聊天历史标签在宜小智模式显示“宜小智”，不再显示 AIRI，减少产品身份混淆。

### 切片 15：Tripo 高质量真实模型接入

- 核查本机工具链：Codex 当前没有可用的 Blender/Tripo MCP server，但本机 Blender 5.2、Cartoon Print Studio 的 Tripo OpenAPI key 和转换脚本均可用。
- 使用宜小智正面 JPG 参考图真实调用 Tripo v3.1 图生 3D，生成带 PBR 贴图的高质量 GLB；原始文件约 49.8 MB，经过 glTF Transform 简化与 Draco 压缩后得到约 9.97 MB 的 `model_web.glb`。
- 新增 `YXZRealModelScene.vue`：用 `GLTFLoader` 加载真实 GLB，保留 PBR 材质、色彩空间和 ACES 色调映射；根据状态提供呼吸浮动、倾斜、回应/思考/聆听姿态，并保留状态气泡。
- 宜小智模式优先使用真实 GLB；网络、后台或资源加载失败时自动回退原程序化场景，避免页面空白。
- 浏览器真实验收：`http://127.0.0.1:5174/` 可加载真实宜小智网格、面部显示屏、光环、翅膀和完整身体，状态气泡与欢迎语按钮均可见；模型资源 GET 200，约 9.97 MB。

## 本轮新增验收

- [x] `pnpm -F @proj-airi/stage-ui typecheck`
- [x] `pnpm -F @proj-airi/stage-ui-three typecheck`
- [x] 宜小智/预览/需求记忆/听写聚焦测试：4 个测试文件、14 项通过。
- [x] 真实浏览器截图看到 WebGL 3D 形象、状态气泡、欢迎语按钮和中文开场消息。
- [x] Blender/Tripo 真实模型链路完成：Tripo 生成、glTF 压缩、GLB 加载器、失败回退和浏览器验证。
- [x] `stage-ui-three` 与 `stage-ui` 类型检查通过；新增真实模型组件 lint 通过。
- [x] 真实 `/api/previews` → `/api/3d_cartoon` 链路通过，同一 session 返回有效 GLB/STL。

### 切片 16：Blender 骨骼与状态动作

- 使用本机 Blender 5.2 将 Tripo Draco 网格绑定到 20 根宜小智骨骼，采用适合单体扫描网格的包络权重，避免热权重在高密度网格上失败。
- 导出 `model_rigged.glb`：包含 1 个 skin、20 个 joints、`YXZ_Idle / Listening / Thinking / Speaking / Success` 五组动作、285 个动画通道；再经 Draco 压缩为 Web 版约 10.47 MB，可由打印后台静态接口直接提供。
- `YXZRealModelScene` 改为加载带蒙皮的 GLB，并按对话状态交叉淡入对应动作；`processing` 自动映射到思考动作，减少状态切换时的突跳。
- 保留真实模型加载失败时的程序化 Three.js 回退，保证浏览器和 Windows 容器在后台未启动时仍可打开界面。

### 切片 17：动作表现层与运行时性能

- 修正骨架坐标轴：根据 Tripo 网格实际 Z 轴竖直方向重新放置骨骼，包络权重从躯干集中修正为头部、双臂、双腿均有有效影响区域。
- Blender 验证 `YXZ_Success` 动作时，网格顶点最大位移约 0.063、平均位移约 0.0032，确认动作会真实驱动蒙皮，而不是只有空动画轨道。
- Three.js 运行时增加动作交叉淡入、完成动作单次播放、回应节奏缩放脉冲和面部区域状态光呼吸；不依赖 morph target，避免破坏当前高质量材质。
- 生产构建成功，保留既有大包与 wasm 警告；`stage-ui-three` lint/typecheck 均通过。

### 切片 18：面部表现提示层

- 由于当前 Tripo 单图网格没有面部 morph target，未伪装成“真实眨眼/口型”；改为加入可验证的运行时表现提示：面部光按状态变色、周期性亮度收放，回应状态显示语音节奏点。
- 说话状态的气泡增加无障碍标签和动态语音点，配合 TTS 播放状态，让用户能直观看到宜小智正在回应。
- 保持 `prefers-reduced-motion` 降级逻辑，减少动画时不会持续做光效和缩放脉冲。
- 真实服务回归：前端 HTTP 200、打印后台健康正常、Web 动态 GLB GET 200（10,469,100 bytes）。

### 切片 19：真实面部控制几何

- 新增 `scripts/add_yxz_face_controls.py`：在原始 Tripo 骨骼网格前方添加跟随宜小智模型的轻量面部控制层，不修改原始高密度网格和 PBR 贴图。
- 面部控制层包含左右眨眼遮罩、嘴部遮罩和嘴形曲线；通过 Draco 压缩后的 `model_face_controls_web.glb` 提供给 Web 端，约 10.59 MB。
- `YXZRealModelScene` 已从单纯光效提示升级为实际控制几何：运行时周期性改变眨眼遮罩高度，TTS 回应时改变嘴形曲线的垂直幅度；没有 morph target 时仍可安全降级。
- Blender 预览确认默认睁眼状态、嘴形层位置和角色整体比例；GLB 保留 1 个 skin、20 个 joints、5 组骨骼动画及 Draco 压缩。
- Web 端补齐本地 `DRACOLoader` 解码器（`apps/stage-web/public/draco/`），修复压缩 GLB 在浏览器中因缺少解码器而回退的问题，Windows 离线运行不依赖 CDN。

## 本轮新增验收

- [x] Blender 脚本在本机真实运行并成功导出带 skin/animations 的 GLB。
- [x] GLB JSON 校验：1 skin、20 joints、5 animations、285 channels。
- [x] Cartoon Print Studio `/api/health` 返回正常，`model_rigged_web.glb` GET 200（约 10.47 MB；当前导出 10,469,100 bytes）。
- [x] `stage-ui-three` 类型检查通过，`stage-web` 生产构建成功。
- [x] 前端开发服务已恢复在 `http://127.0.0.1:5174/`，后台服务在 `http://127.0.0.1:8000/`。
- [x] 面部控制 GLB 已通过 Blender 导入/导出和 Draco 解码回读验证，动画列表与骨骼 skin 未丢失。
- [x] 真实面部控制预览已输出到 `docs/yxz-face-controls-open.png`，确认默认状态不是闭眼遮罩。
- [x] 新建本地浏览器标签真实加载 3D GLB；页面截图可见高质量宜小智模型、状态气泡和嘴形层，控制台无新的模型加载错误。

### 切片 20：科技节现场体验闭环评估

- 缩短主动欢迎语：进入宜小智模式后自动显示中文自我介绍，并以“今天最想做什么？”收束，减少现场观众等待和阅读负担。
- 在聊天输入框增加三个现场示例入口：校园纪念徽章、桌面摆件、环保创意 3D 作品；点击后直接进入对话，不再依赖“打开创作面板”才能开始。
- 欢迎语继续优先走已配置的 Voicebox/语音提供商；浏览器阻止自动播放时显示“点一下让我开口”，保留明确可恢复入口。
- 真实浏览器闭环验证：首屏加载高质量 GLB、状态气泡和主动中文开场；点击“校园纪念徽章”后，后台模型真实返回中文追问“徽章主要是给谁用的”，确认聊天不是静态演示文案。
- 生产构建、前端/后台健康、Draco 解码器和面部控制 GLB 均通过；控制台未发现模型加载错误，保留 AIRI 原有的路由、Ollama 检查和国际化提示警告。

#### 现场可用性结论

- 互动吸引力：适合科技节首屏展示，模型、气泡、欢迎语和一键示例能在几秒内让学生开始体验。
- 主动引导：已达到“主动打招呼 → 单问题追问 → 记住需求 → 可调用预览/3D 工具”的产品链路；现场必须使用支持 tool calling 的 LLM provider 才能自动生成文件。
- 语音健壮性：Voicebox 正常时走男声卡通感 TTS；浏览器自动播放受系统策略影响，点击欢迎语按钮即可恢复，不会阻塞文字对话。
- 安全边界：预览和 3D 仍需用户确认，系统不会未经确认登录切片软件、启动打印或承诺取件。

### 切片 21：画布个性化与现场工作台

- 修复输入栏被快捷话术遮挡的问题：体验话术改为输入区上方独立的提示/按钮行，用户可以直接输入、语音输入或点击示例，不再互相覆盖。
- 将“创作面板”明确升级为“宜小智创作工作台”，用 1→4 步骤区分普通聊天和执行流程：描述想法、确认预览、画布个性化、生成 3D。
- 新增 `YXZPreviewCanvasEditor`：支持在选中的预览图上画笔标记、调颜色/粗细、添加文字、撤销和清空；应用后的 PNG 会显示为个性化预览。
- 扩展 Cartoon Print Studio `/api/3d_cartoon` 的 `custom_image` 参数。画布导出的 data URL 会在后台保存为 `custom_edit.png`，3D 浮雕处理直接使用这张编辑后的图，而不是悄悄回退到原始预览。
- 真实验收：生成校园纪念徽章预览 → 打开画布 → 添加“科技节 2026” → 应用到 3D → 生成 GLB/STL 成功；后台实际写入 `custom_edit.png`，模型结果可打开和下载。
- 角色动画增强：提高待机漂浮、身体摆动和说话脉冲幅度，并对命名骨骼叠加头部/手臂/翅膀微动作；900ms 两帧截图采样差异约 412,395，确认不是静态画面。

### 切片 22：动态表现根因修复与稳定性回归

- 重新检查 GLB 动画 JSON：原有 5 个片段主要只有根节点 STEP 位移，不能单独带来明显的头部、手臂和眼睑表演；`YXZRealModelScene` 现在使用命名骨骼的状态驱动程序化动作，待机有呼吸/摆动，思考有点头，回应有手臂/手部节奏，动作幅度足以在现场被看见。
- 修正面部控制层的轴向：眨眼遮罩原先只缩放局部 Z，视觉上几乎不变；现在按原始比例扩展局部 Y，并使用更易观察的眨眼周期，嘴形也以导出基准缩放叠加回应幅度。
- 修正取景：将角色目标高度从 3.25 调整为 2.35，并增加安全底边距；真实浏览器截图已确认双脚完整露出，不再被底部工具栏裁切。
- 新增 `cloneForTransport` 安全快照工具：工具调用中出现函数、符号、循环引用或 DOM 对象时降级为可传输快照，不再让 `structuredClone` 失败打断跨窗口聊天广播；旧会话中残留的内部克隆错误只在展示层隐藏，不删除用户聊天记录。
- 气泡文案改为状态语义：欢迎提问、认真听取、理解整理、介绍方案、生成预览/模型、完成可编辑/下载；语音点只在回应/思考/处理中显示，减少“随便变化”的感觉。

#### 本轮新增验收

- [x] `clone-for-transport.test.ts`：普通对象、函数字段、循环引用 2 项通过。
- [x] `stage-ui-three` 类型检查通过。
- [x] `stage-ui` 类型检查通过。
- [x] 生产构建 `pnpm -F @proj-airi/stage-web build` 成功。
- [x] 浏览器连续帧 900ms 采样存在明显字节差异；截图确认人物完整、脚底未裁切，历史 `structuredClone` 错误不再显示。

### 切片 23：聊天卡死与内部错误恢复

- 定位到真正的卡死根因：`@xsai/stream-text` 会对最终消息数组再次执行原生 `structuredClone`，旧消息中的 DOM/函数/循环引用会让 DeepSeek、MiniMax 等候选连续失败；在 LLM 入口对最终 provider payload 统一执行 `cloneForTransport`，确保送入 SDK 的消息可克隆。
- 当前发送队列为活动请求保存 `AbortController`。桌面端、移动端发送都增加 45 秒硬超时；超时会取消活动请求并恢复输入，不会把聊天永久留在“处理中”。
- provider 失败不再把原始异常（`Window`、`structuredClone`、堆栈）写进聊天气泡；输入内容保留，使用中文 toast 告知可重试，并触发宜小智回到 idle。旧会话里已有的内部克隆错误在展示层隐藏，不删除聊天数据。
- 宜小智额外监听 orchestrator 的发送状态从进行中回落到结束，在 provider 尚未产生首 token 就失败时也能回到可继续交流状态。

#### 本轮真实验证

- [x] 真实浏览器输入“连接恢复测试”并回车：收到宜小智中文回复，输入框恢复为空，状态气泡回到“你好，我是宜小智，想做什么？”。
- [x] 失败场景显示“刚才没有连接成功 / 我已经保留你的内容，请再试一次”，不再展示 `structuredClone` 技术卡片。
- [x] 修复后再次发送没有新增 `DataCloneError`；此前的 provider 失败日志仅属于修复前缓存日志，重新加载后不再复现。
- [x] `stage-ui`、`stage-layouts`、`stage-ui-three` 类型检查通过；`stage-web` 生产构建成功。

### 切片 24：解决 reduced-motion 导致的“静止模型”

- 真实浏览器检查发现当前 Windows/Chrome 返回 `prefers-reduced-motion: reduce`；旧实现把该偏好直接映射为 `still = true`，从而停止待机漂浮、骨骼动作、眨眼和嘴形更新，这就是用户看到“完全不动”的根因。
- 现在改为保留连续渲染；减少动效时只将 GLB 原生动作速度降到 82%，并放慢眨眼周期。这样动作更平缓但不会像静止画面，且仍尊重系统偏好。
- 角色目标高度从 2.35 提升到 2.8，适配宽桌面展示；保留底部安全间距，避免重新出现脚部被工具栏裁切。

#### 本轮真实验收

- [x] 浏览器读取到 `prefers-reduced-motion: true`，修复后不再冻结渲染。
- [x] 用户 Chrome 窗口连续帧角色区域采样存在明显变化；截图确认角色比之前更醒目且双脚完整。
- [x] `stage-ui-three` 类型检查和 ESLint 通过。

## 当前限制

当前 Tripo GLB 已完成 Blender 骨骼、蒙皮、状态动作和可见面部控制层接入；眨眼/嘴形现在是实际几何控制，不是只改变光效。但它仍是单图重建，未达到 AIRI 女孩 VRM 的原生面部 morph/口型精度，也没有逐关节手工修正的高阶表演动作。下一步应做浏览器逐状态验收和动作细修，而不是继续堆叠静态装饰。

聊天工具已经真实连接打印后台，但模型是否会在“信息足够”时主动调用，仍取决于当前 LLM provider 是否支持 tool calling；若 provider 自动降级为纯文本模式，界面会继续聊天但不会生成文件。当前安全策略仍不会未经确认自动打开切片软件、启动打印机或处理取件。

## 下一阶段

1. 将“受众/风格/数量”从记忆字段接入聊天中的结构化确认按钮。
2. 接入打开切片软件、打印确认和取件流程，并为 Windows 桌面容器增加安全白名单。

### 切片 25：预览地址、导出接力与本机软件入口

- 预览卡片不再直接把 GLB 当作“可打开网页”文件：新增宜小智独立 3D 预览页，支持拖动旋转、滚轮缩放、明确显示预览地址和复制地址；GLB 响应改为 inline，STL 使用 `?download=1` 明确下载。
- 画布保存结果继续沿用 `custom_image` 进入 `/api/3d_cartoon`，并在模型生成后提供预览、下载和本机软件接力入口。
- 后台新增 `/api/software/detect` 与 `/api/software/open`：只检测 Windows 上的 Bambu Studio、OrcaSlicer、PrusaSlicer、Cura、Blender、LightBurn、LaserGRBL；打开动作仅把模型/预览图交给用户选择的软件，不会自动打印或切割。当前机器真实检测到 Bambu Studio。
- 宜小智工作台提供“检测本机软件”和“打开软件”按钮；激光工具接收已编辑的 PNG 预览，3D 打印工具接收 STL，Blender 接收 GLB。
- 应用网页标题、主标识和默认角色卡名称统一为“宜小智”，移除首屏可见的 AIRI/ReLU 品牌文案。
- 动作反馈修正：去掉整体上下漂浮、整体缩放脉冲和夸张骨骼摆动，脚底保持接地，保留低幅度关节动作、眨眼和说话嘴形。

#### 本轮验收

- [x] `stage-ui` 与 `stage-web` 类型检查通过；预览页及相关组件 ESLint 无 error（仅模板换行 warning）。
- [x] 后端语法检查通过；`GET /api/software/detect` 返回 Bambu Studio 已安装路径。
- [x] 真实 HTTP GET `/api/export/94198887fe66/glb` 返回 200、`Content-Disposition: inline`；预览页在浏览器加载 GLB，控制台无错误。
- [x] 主界面刷新后宜小智模型保持脚底接地，连续帧仍有动作变化，不再通过整体漂浮/变形制造“动感”。

### 切片 26：形体稳定优先，改用 GLB 原生动作

- 删除运行时对头、颈、眼、翅膀、肩、前臂和手部骨骼的正弦摇摆与挥动叠加；这些叠加会和蒙皮动画相互覆盖，造成用户看到的“漂浮、扭动、变形”。
- 删除宜小智整个角色的运行时旋转；脚底位置和模型比例在加载后固定，动画循环只更新 GLB 自带的 `YXZ_Idle / Listening / Thinking / Speaking / Success` 片段。
- 眨眼只操作导出的 `YXZ_FaceBlink.L/R` 专用网格，嘴形只操作 `YXZ_FaceMouth` 专用网格，不再改变身体蒙皮的比例。

#### 本轮真实验收

- [x] `stage-ui-three` 类型检查通过。
- [x] `YXZRealModelScene.vue` ESLint 通过。
- [x] 浏览器刷新后模型仍保持接地；连续 1.2 秒截图存在变化，且控制台无本轮新增错误。

### 切片 27：欢迎挥手动作的离线修正

- 通过 Blender 读取宜小智原始面部控制 GLB，确认 5 组动作均包含骨骼关键帧；其中 `YXZ_Success` 已驱动上臂/前臂，但 `hand.R` 只有静态两帧，所以现场看起来更像“抬手”而不是挥手。
- 新增 `cartoon-print-studio/tools/add_yxz_hand_wave.py`：基于原始 GLB 单独导出 `model_face_controls_wave.glb`，只给 `hand.R` 写入 6 个缓和旋转关键帧，保持网格顶点、蒙皮权重和缩放不变。
- Web 端改用新的挥手模型资源；导出结果保留 1 个 skin、5 组动作和 Draco 压缩，文件约 10.6 MB。

#### 本轮真实验收

- [x] Blender 导出成功，Draco 编码器正常工作。
- [x] GLB 结构校验：5 组动作保留；`YXZ_Success` 的 `hand.R` 从 2 帧变为 120 帧采样，其他动作不变。
- [x] 浏览器刷新加载新 GLB，眨眼控制可见，模型材质/比例/脚底保持正常，控制台无模型加载错误。
- [x] `stage-ui-three` 类型检查和 `stage-web` 生产构建通过（仅保留既有的包体与插件性能警告）。

### 切片 28：3D 接地质感与现场验证

- 为真实模型渲染器启用 `PCFSoftShadowMap`，给主光源配置阴影相机，并添加低透明度接触阴影平面；不改变模型顶点、骨骼和动作，只改善脚底与背景的空间关系。
- 真实浏览器重新启动前端和打印后台后验证：宜小智 GLB 正常加载，脚底有接触阴影，角色完整露出，眨眼和挥手动作仍可播放。
- 连续 1.5 秒截图采样存在 4,063 个变化采样点，控制台无本轮新增错误。
- 本轮同时修正了本地验收启动方式：后台必须使用 `cartoon-print-studio/ai/forge-webui/venv/Scripts/python.exe`，否则全局 Python 缺少 `trimesh` 会导致连接拒绝。
- [x] 接地阴影改动后再次完成 `pnpm -F @proj-airi/stage-web build`，PWA 资源生成成功。

### 切片 29：修正眨眼轴向与说话手势

- 修正 `YXZ_FaceBlink.L/R` 的运行时控制轴：导出层在本地 Z 轴压扁，旧逻辑误放大 Y 轴，会把眼部横向拉长；现在只恢复专用眼皮网格的 Z 轴，不触碰身体蒙皮。
- 基于现有 GLB 增加 `YXZ_Speaking` 的克制手部节奏手势（上臂、前臂、手腕），保持顶点、蒙皮权重、整体位置和脚底接地不变；资源输出为 `model_face_controls_wave.speaking3.glb`，并使用与原动作一致的四元数轨道，避免导出时丢失手势。
- Blender 关键帧验收：5 组动作均保留；主体尺寸在 1/30/60/90/120 帧保持稳定（说话动作尺寸误差 < 0.2%），没有出现整体拉伸。
- Web 端默认改用 speaking2 资源，继续使用本地 Draco 解码器。

### 切片 30：运行时形体保护与真实对话验收

- 在 Three.js 动画循环中加入轻量形体保护：按约 240ms 检查一次角色包围盒，相对加载时基准尺寸超过 ±12% 时自动回退到安全 `YXZ_Idle`，避免异常 GLB 动作把畸变展示给观众。
- 真实浏览器发送“动作测试”，验证状态从理解/处理中进入中文播报，再回到待机；模型完整显示、脚底接地、没有新增错误。
- 连续 1.8 秒截图采样保持持续渲染，浏览器页面和后台服务均正常。

### 切片 31：停止自动蒙皮扭曲，进入形体安全模式

- 现场复核后确认当前 Tripo 单图模型的自动包络蒙皮不具备 AIRI/VRM 级关节质量；即使幅度很小，身体动作仍可能产生不自然拉扯。
- 默认关闭这套身体骨骼动作，保留原始模型比例、脚底接地、专用眨眼网格、嘴形和语音状态；不再用扭曲来伪造动态感。
- `bodyMotionEnabled` 只在接入正式手工修正的 VRM/BlendShape 资产后重新打开，避免把当前低质量蒙皮动作带入科技节现场。

### 切片 32：建立动画资产准入检查

- 新增 `scripts/validate_yxz_avatar.py`，在接入模型前检查 skin、morph target、眼球骨骼和动作轨道。
- 当前 speaking3 资源检查结果：`skins=1`、`morphTargetSets=0`、`eyeBones=[]`，因此明确判定 `bodyMotion=block`；这解释了为什么不能继续拿它做 AIRI 级身体动作。
- 后续只有具备 BlendShape 或眼球骨骼的正式资产才进入身体动作验收，避免再次把自动蒙皮问题带到前端。

### 切片 33：闭嘴/张嘴双几何层，去掉“笑线拉伸”

- 现场复核确认旧嘴形是把 `YXZ_FaceMouth` 整体缩放，视觉上像贴纸被拉伸，和真实说话不一致。
- 新增 Blender 导出脚本 `scripts/add_yxz_mouth_visemes.py`，在不改动主体顶点、蒙皮和比例的前提下加入独立的 `YXZ_FaceMouthOpen` 深色嘴腔几何；闭嘴笑线与张嘴嘴腔由前端按说话状态切换。
- 前端不再缩放闭嘴笑线；张嘴层只做很小且有界的开合变化，身体动作继续保持安全关闭，避免再出现扭曲、漂浮或变形。
- 当前运行资源：`model_face_controls_wave.mouth1.glb`；资源校验仍为 1 个 skin、0 个 morph target，故身体骨骼动作继续禁用，等待正式 VRM/BlendShape 资产。

#### 本轮真实验收

- [x] Blender 导出成功，Draco 压缩正常，`YXZ_FaceMouthOpen` 节点存在。
- [x] 后端 GET mouth1 GLB 返回 200，浏览器实际加载新资源。
- [x] 真实中文消息“嘴形测试”从处理中进入方案完成；截图确认说话时显示张嘴嘴腔，结束后恢复固定闭嘴笑线，没有拉伸主体脸部。
- [x] `stage-ui-three` 类型检查与 ESLint 通过。

### 切片 43：上线前完整链路验收与预览坐标修正（2026-10-20）

- 修复确认消息的会话校验：聊天会话 ID 与预览后台会话 ID 不再混用。用户回复“可以生成模型/继续制作这个 3D 模型”时，即使当前 provider 不发出函数调用，也会在当前宜小智预览卡片上安全执行同一 `/api/3d_cartoon` 后台任务。
- 宜小智模式不再向对话模型暴露通用 MCP/调试工具，避免生成 `builtIn_mcpCallTool` 等内部技术名称；聊天渲染层也隐藏纯内部工具失败卡片，保留中文进度和方案卡片。
- 3D 预览页修正坐标系：打印后台导出的 GLB 为 Z-up，网页 Three.js 场景为 Y-up；加载时完成轴向校正，并按包围球自动计算相机距离，避免模型边缘裁切、贴脸或被误看成变形。
- 主模型材质继续采用保守的现场参数：主体 roughness 至少 0.50、envMapIntensity 0.55、metalness 不高于 0.05、specularIntensity 不高于 0.35；眼睛和嘴形仍由独立几何层控制，保持眨眼、张嘴和 TTS 状态反馈。

#### 本轮真实验收证据

- [x] 前端 `127.0.0.1:5174` 与后台 `127.0.0.1:8000` 均由真实进程监听；浏览器首屏可见中文欢迎语、主动提问和 TTS“语音播放中”状态。
- [x] 真实中文五轮需求采集完成：产品、受众、风格、元素、尺寸/颜色均被记住，并生成预览方案卡片。
- [x] 真实输入“可以生成模型”后，后台日志出现 `POST /api/3d_cartoon` `200 OK`；聊天卡片出现“3D 模型已完成，请查看方案卡片。”并提供可点击 GLB 预览、STL 下载和可复制地址。
- [x] 预览页真实打开并加载模型：`GET /api/export/489df6d0563d/glb` 返回 `200 model/gltf-binary`（10,815,620 bytes），STL 返回 `200 model/stl`（27,036,284 bytes）；页面显示“拖动旋转 · 滚轮缩放”。
- [x] `stage-ui` 类型检查与相关 ESLint 通过；`stage-web` 类型检查、预览页 ESLint（仅既有模板换行 warning）和生产构建通过。
- [x] 当前模型资产复核结果仍为 `VRM=false`、`jointCount=20`、`morphTargetSets=0`、`eyeBones=[]`、`qualityTier=facade-only`、`bodyMotion=block`。因此当前版本可以作为稳定的科技节展示版投入使用，但不能把动态质量宣传为已经达到 AIRI 女孩 VRM/BlendShape 同等级；要达到该目标，必须替换为正式手工绑定的 VRM/BlendShape 资产后再开启全身动作。

### 切片 42：按实测坐标校准眼部层与安全对话动作

- 用 Blender 对当前 Tripo 面部贴图做前表面扫描，确认眼部高亮区域中心约为模型空间 `x=0.0967 / z=0.1557`（探针坐标经 `-90° Z` 变换，实际前向深度约为 `x=0.24`），原先眼睛覆盖层的位置并非凭感觉设置。
- 重新从 `mouth1.glb` 生成 `mouth2.glb`/`mouth3.glb`，避免重复节点；睁眼层现在使用青色发光材质、独立渲染顺序，瞳孔层仍保留但运行时关闭，眨眼时只切换独立眼皮层。
- 运行时增加受限的对话手势：播报时头部轻微点动、右肩/前臂/手腕小幅往复；待机只做很轻的头部微动。没有根节点漂浮、没有整体缩放，也不打开已判定会变形的 Tripo 全身动作剪辑。

#### 本轮真实验收

- [x] Blender 资源重新导出成功；后端 GET `mouth3.glb`（带缓存版本参数）返回 200，大小约 10.6 MB。
- [x] 浏览器重新加载后角色全身、光环、翅翼、书本和脚底阴影仍在边界内；欢迎语、中文聊天历史和 TTS 播报状态可见。
- [x] 连续截图采样确认渲染循环持续工作；动作仅作用于已列出的局部骨骼和面部控制层，没有出现整体拉伸或漂浮。
- [x] `stage-ui-three` `vue-tsc --noEmit`、`YXZRealModelScene.vue` ESLint、`stage-web` 生产构建均通过。
- [ ] 仍未达到 AIRI 女孩同等级的 VRM/BlendShape 动态质量：验证器仍为 `VRM=false`、`jointCount=20`、`morphTargetSets=0`、`bodyMotion=block`。要达到该质量，需要正式手工绑定的 VRM/BlendShape 资产；当前 GLB 只能作为外观与安全交互展示版。

### 切片 39：修正动画资产准入误判

- 校验器原先只按节点名称匹配 `eye/pupil`，会把面部控制网格误判成眼睛骨骼，错误放行身体动作。
- 现在只统计 `skin.joints` 实际引用的关节；独立的眼白、瞳孔、眼皮和嘴形网格单独列为 `faceControlNodes`。
- mouth3 重新校验结果：`skins=1`、`morphTargetSets=0`、`eyeBones=[]`、`bodyMotion=block`。这与当前 Tripo 资产实际能力一致，避免后续再次打开会变形的身体动作。

### 切片 38：非机械眨眼节奏

- 将固定周期眨眼改为短时事件：每次闭合约 0.2 秒，间隔在安全范围内轻微随机，减少“定时器机器人感”。
- reduced-motion 环境下仍保留眨眼，但间隔变长、动作更克制；暂停时完全保持当前眼睛状态。
- 眨眼继续只切换独立眼皮层，不对眼白、瞳孔、脸壳和身体蒙皮做缩放。

#### 本轮真实验收

- [x] 浏览器刷新后模型完整加载，眼睛保持白眼+瞳孔，身体无变形。
- [x] 欢迎语、聊天历史和 TTS 状态正常，页面未出现新增技术错误。
- [x] `stage-ui-three` 类型检查与 ESLint 通过。

### 切片 40：用实测数据确认 AIRI 级动态差距

- 直接解析当前宜小智 `mouth3.glb`：`VRM=false`、`skins=1`、`jointCount=20`、`morphTargetSets=0`、`eyeBones=[]`，质量分级为 `facade-only`，身体动作保持阻断。
- 直接解析 AIRI 自带 `AvatarSample_A.vrm`：`VRM=true`、`skins=3`、`jointCount=91`、`morphTargetSets=228`、存在眼球关节，质量分级为 `vrm-expression-ready`。
- 这个数据差距说明 AIRI 女孩的灵动感来自模型资产的 VRM/BlendShape/眼球系统，而不是简单增加 CSS、光效或正弦摆动；当前宜小智不能诚实地宣称已达到同等动态质量。
- 校验器新增 `qualityTier`、`jointCount`、`vrm` 输出，后续正式宜小智 VRM 资产必须先通过 `vrm-expression-ready` 再接入身体动作。

### 切片 37：受控瞳孔视线

- 为两只瞳孔增加极小幅度的同步视线偏移：思考时幅度略大，聆听/播报时更克制，待机时几乎不动。
- 偏移只作用于 `YXZ_FaceEyePupil.L/R`，范围小于眼白半径的 15%，不移动眼白、眼皮、面罩或身体，避免再次出现跑位和变形。
- 保留眨眼的显示/隐藏切换，视线和眨眼可以同时工作。

#### 本轮真实验收

- [x] 浏览器重新加载后白眼、瞳孔、嘴形和完整身体均正常显示。
- [x] 页面聊天历史和主动欢迎语不受影响。
- [x] `stage-ui-three` 类型检查与 ESLint 通过。

### 切片 36：稳定睁眼层与瞳孔细节

- 定位到 GLB 导出后眨眼网格缩放被烘焙的问题：前端不再把眼皮 Z 轴放大，而是通过显示/隐藏专用眼皮层完成眨眼。
- 新增独立的 `YXZ_FaceEyeOpen.L/R` 睁眼层和 `YXZ_FaceEyePupil.L/R` 瞳孔层，资源升级为 `model_face_controls_wave.mouth3.glb`。
- 睁眼时显示白色眼睛与深蓝瞳孔，眨眼时隐藏睁眼层并显示原有眼皮层；全程不改变主体脸壳、身体蒙皮和模型比例。

#### 本轮真实验收

- [x] Blender mouth3 导出成功，Draco 压缩正常，眼睛控制节点存在。
- [x] 浏览器实际加载 mouth3：白色睁眼与瞳孔位置对齐，没有遮挡或身体变形。
- [x] `stage-ui-three` 类型检查与 ESLint 通过。

### 切片 34：嘴形接入真实 TTS 音频能量

- 新增 `speakingLevel` 通道：`Stage.vue` 从 TTS 播放链路的 `AnalyserNode` 读取音量，限制在 0 到 1 后传给 `YXZRealModelScene`。
- 宜小智张嘴层现在跟随实际播报能量开合，而不是只按固定正弦节奏；闭嘴笑线仍保持固定几何，不再被拉伸。
- 对浏览器原生 `speechSynthesis` 这类无法接入分析器的回退路径，保留低幅度节奏作为保底，避免模型长时间张嘴或完全静止。

#### 本轮真实验收

- [x] 重新加载浏览器后发送中文“实时嘴形测试”，处理状态、中文回复和方案完成状态均正常。
- [x] TTS 播放期间嘴形层可进入张嘴状态，播放结束后回到闭嘴笑线。
- [x] `stage-ui`、`stage-ui-three` 类型检查及相关 ESLint 通过。

### 切片 35：音频嘴形平滑与开合滞后

- 对 TTS 音量电平加入指数平滑，避免辅音瞬态导致嘴部每帧闪烁。
- 增加开合滞后阈值：张嘴阈值高于闭嘴阈值，连续发声更自然，低音量间隙不会反复切换两套几何。
- 平滑逻辑只改变 `YXZ_FaceMouthOpen` 的专用嘴腔层，主体脸壳、身体蒙皮、脚底位置和安全模式保持不变。

#### 本轮真实验收

- [x] 浏览器重新加载后角色保持完整、接地，无形体变形。
- [x] 欢迎语和历史中文对话仍能正常播报，页面状态可回到方案完成/待机。

### 切片 41：模型外观回退与刚性骨骼试验

- 对照 `pingdou/yxz-img` 的正面、侧面、背面和仰视参考图，首个代码程序化原始模型原型在首屏实测中出现比例过简、面部层次不足的问题，未达到参考图外观要求，因此没有作为展示入口继续使用。
- 展示入口恢复到外观更接近参考图的 `model_face_controls_wave.mouth3.glb`，并把角色目标高度从 2.8 调到 3.3，增加可视主体占比，同时保留脚底接触阴影和完整边界。
- 运行时增加受限骨骼姿态试验：只对 `head/neck/shoulder.R/upper_arm.R/forearm.R/hand.R` 等现有关节做小幅四元数插值，绝不播放当前 Tripo 的整套蒙皮动作；形体保护和专用眨眼、嘴形继续生效。
- 参考图使用青色发光椭圆眼，当前 GLB 的眼部控制层仍在做对位校准；本轮先隐藏白色控制层和深色瞳孔层，避免把脸部变成白圆眼，待眼部覆盖位置校准后再恢复眨眼覆盖。

#### 本轮实测结论

- [x] 前后端重新启动，`http://127.0.0.1:5174/` 正常加载，欢迎语、聊天历史和 TTS 状态可见。
- [x] 浏览器截图确认角色全身、光环、翅翼、书本和接触阴影均在边界内，页面无新增控制台错误。
- [x] `validate_yxz_avatar.py` 仍明确报告 `VRM=false`、`jointCount=20`、`morphTargetSets=0`、`qualityTier=facade-only`、`bodyMotion=block`；当前版本不能声称达到 AIRI/VRM 级动态质量。
- [x] `stage-ui-three` 类型检查和 `YXZRealModelScene.vue` ESLint 通过。
- [x] `stage-ui-three` 类型检查与 ESLint 通过。

### 切片 42：MToon 卡通渲染与描边来源重做

- `vrm_postprocess.py` 之前把 `outlineWidthMode` 写成整数 `1`。VRM 1.0 的该字段是字符串枚举
  （`"none"` / `"worldCoordinates"` / `"screenCoordinates"`），整数 0/1/2 是 VRM 0.x 旧写法；
  three-vrm 3.5.1 原样透传该字段且只对字符串生成描边材质，所以整数写法会让描边材质**完全不生成**，
  角色退化成单材质光泽渲染——这正是“塑料感/玻璃感”的直接来源。运行时探针确认过：改之前每个 mesh
  只有 slot 0 一个材质槽。
- 描边改成由 `YXZRealModelScene.vue` 的 `OutlinePass`（深度/法线边缘检测）提供，VRM 文件不再声明
  MToon outline。原因是几何层面的，不是参数问题：
  - 新增 `probe_yxz_shell_geometry.py` 统计导出 GLB：外壳 146446 顶点 / 256973 三角形，
    **43% 三角形背向相机**，绕向与顶点法线 99.7% 自洽（不一致面积占比 0.0002）——说明网格数据本身
    没问题，背向三角形是头盔内衬、面板缝隙、耳朵罩内侧等**真实内部薄片**。
  - MToon outline 靠“渲染背面并沿法线外扩”实现，只在均匀厚度的封闭壳体上才能得到干净轮廓线。
    这些内部薄片会直接漏墨到角色身上：单独渲染描边 pass 时可见头盔下沿在脸上压出一道带子、
    每条面板接缝在身上画一条线，叠起来就是一层灰雾而非轮廓线（证据：`docs/yxz-rig-review/outline-depth-proof.png`，
    该图让表面只写深度不写颜色，红色即为描边几何赢过表面的像素）。
  - 深度/法线边缘检测只对深度真正断开处反应，因此对内部薄片免疫。
- 同步验证过仓库自带的 `outline.ts`（AIRI 的 view-space 描边实验，接入后 `patched=1` 确实生效），
  灰雾依旧——它同样依赖背面剔除，因此不解决内部薄片问题，未接入。
- 接 composer 后每帧要渲染 3 次（beauty + outline 的深度/法线两趟），故把
  `shadowMap.autoUpdate` 改为手动、每帧只置一次 `needsUpdate`，避免阴影贴图重复计算三次。
- 接入 composer 时确认 three 在渲染到 render target 时会关闭 tone mapping，由 `OutputPass`
  统一处理，因此保留 `renderer.toneMapping` 不会二次映射；画布透明背景也正常保留。

#### 本轮真实验收

- [x] `node scripts/verify_yxz_runtime.mjs http://localhost:5199` 全绿：27 骨；idle/listening/thinking/
      speaking/success 五个状态都有真实骨骼运动（maxBoneTranslation 0.21–0.51，
      maxBoneRotationDeg 10.82–44.39）；表情与 viseme 峰值非零（speaking 下 aa/ih/ou/ee
      0.25–0.43）；`gazeYawSpread` 1.0297；mixer 6 个 action、`YXZ_Success` playing、weight 1；
      `pageErrors: []`。
- [x] `node scripts/capture_yxz_avatar.mjs` 抓到 idle/listening/thinking/speaking/processing/success
      六个状态，姿势各不相同且正确（见 `docs/yxz-ship/`），剪影墨线清晰、无灰雾、无面板接缝网。
- [x] `pnpm -C packages/stage-ui-three typecheck` 与相关 ESLint 通过。

#### 已知限制（如实记录）

- 源网格是 Tripo 机器人扫描件，手臂偏细、头部造型偏机器人，网格精度达不到 AIRI 女孩；本轮可优化的是
  绑定、动作与 MToon 材质表现。
- VRM 必需骨覆盖 27 骨，达不到 AIRI 女孩的 80 骨门槛，判定为 `vrm-expression-ready`。
- 角色始终保持“左手举起挥手、右手拿书”的原始站姿作为 rest pose（未做中性 A-pose 重摆）。
- MToon dithering 在眼部周围可见轻微网点，属正常 toon 渲染特性。
- 轮廓线在面部等法线噪声较多的区域仍可见极少量细碎点，正常观看距离下不可辨。
- 主聊天舞台 `packages/stage-ui/src/components/scenes/Stage.vue` 的接入不在本轮范围内，
  当前 3D 角色只在 `/yxz-avatar` QA 页可用。

---

## 2026-10-21 轮：动态模型观感质量（第六轮）

本轮范围**只有模型观感**。主动询问、TTS、聊天流程、`packages/stage-ui/src/**` 一律未动。

### 诊断反转：破碎感的主因不是洞，是被剔除的内翻面

前几轮一直按“壳体有洞”处理。新写的两个探针把这件事量清楚了：

- `probe_yxz_openings.py`：按位置 weld 后，整模只剩 **7 个闭合小洞**（最大 span 0.026）。
  屏幕上看起来像“大洞”的靴子、胯部并不在名单里。
- `probe_yxz_raycast.py`：从相机方向（身体帧 +X）按 0.005 网格投射射线，看**第一个命中的面朝哪边**。
  结果 `front 15406 / back 1179`——约 7% 的可见表面法线背向相机。

材质是单面（`side: FrontSide`），背向面**根本不画**。于是“面还在那儿，只是朝反了”看起来
和“面没了”一模一样：靴子像open cage、腿像撕开的条、胯部像缺一块。补洞永远补不上这种洞，
因为那里并不缺面。

`probe_yxz_doubleside.mjs` 是决定性证据：实时页面把材质切成 DoubleSide，靴子立刻变实、
下巴白条消失、胯部碎片消失。所以修法就是**把翻过来的面转回来**。

### `scripts/fix_yxz_winding.py`：新增构建步骤

- **为什么不用 Blender 自带的 `normals_make_consistent`**：它靠“沿法线打射线看是否穿出体外”判断内外，
  而壳体本身有裂口，射线从洞里直接出去了、永远不返回，于是那片面被判定为“本来就朝外”。
  实测跑完 refused 面数 1853 → 1874，等于没改。
- **改用相机当判据**：按页面同样的方式打射线，被正面看到却被剔除的面**按定义就是错的**。
  再沿共享边做测地扩散（默认 6 跳）覆盖整片，扩散在“相机已经能画的面”处停下——那正是碎片边界。
- **不移动任何顶点**，只翻转绕向。
- **自测量**：改前改后各打一次同样的射线。实测 `refused 1448 → 0`，`drawn 17011 → 18459`，
  可见面只增不减（没有误翻）。翻转 6015 个多边形。

已接进 `scripts/build_yxz_variant.ps1`，链路变为
`clean → repair_yxz_holes → fix_yxz_winding → rig → vrm`。

### 翅膀灰片：不是几何也不是贴图，是明暗

先排除了两个可能：`probe_yxz_wings.py` 确认翅膀法线朝 ±Y（侧向），
把 base color 图集导出后发现**整张图集只有白/蓝，没有灰色**。所以翅膀在 Blender 里直接渲染
（`render_yxz_turntable.py`）是**正常的白色羽翼、带蓝色描线**——几何和贴图都没问题。

问题在 MToon：翅膀是躯干两侧近水平的薄片，主光从上前方来只能掠过去，它们永远进不了受光面，
而 `shadeColorFactor` 当时是 `(0.36, 0.43, 0.60)`，一落到阴面就是灰卡片。

- `shadeColorFactor` 提到 `(0.84, 0.87, 0.94)`。形体交给主光去撑，明暗斜坡保持浅。
- 新增一盏正面柔光 `DirectionalLight(0xE8F1FF, 0.42)`：只打到“朝相机、背离主光”的面，
  不动身体 terminator。
- 深度值和机位有关（正面看翅膀沿长度方向、显白；舞台的宽机位下更侧、显灰），
  现在这个深度在两种机位下都是白的。
- A/B 用新增的 `probe_yxz_mtoon_ab.mjs` 跑，`setUniform` 调试钩子在实时模型上扫参数。

### 新增的诊断/工具脚本

`probe_yxz_openings.py`、`probe_yxz_raycast.py`、`probe_yxz_islands_winding.py`、
`probe_yxz_wings.py`、`probe_yxz_doubleside.mjs`、`probe_yxz_mtoon_ab.mjs`、`shot_yxz_page.mjs`。
`YXZRealModelScene.vue` 加了 `setSide` / `setUniform` 两个调试钩子（只给 QA 用，不影响运行时）。

### 本轮验收

- [x] `node scripts/verify_yxz_runtime.mjs`：`boneCount 27`、`pageErrors: []`；
      idle/listening/thinking/speaking/success 五态均有真实骨骼运动
      （maxBoneTranslation 0.16–0.36、maxBoneRotationDeg 8.8–31.9）与非零表情峰值；
      `gazeYawSpread` 1.0166；mixer 6 个 action、`YXZ_Success` playing。
- [x] `pnpm --filter @proj-airi/stage-ui-three run typecheck` 通过。
- [x] `shot_yxz_page.mjs` 整页截图：挂载 `mounted`、错误“无”、主动询问气泡正常显示。

### 仍然存在（如实记录）

- **下巴/下颌一条横向薄片**：扫描件把壳体自己折出来的一小片，焊进主壳里了，
  既不属于独立连通块、UV 也和邻面连续，无法用现有的 UV 矩形法安全摘除。
- **头盔顶部几条暗色细线**：同样是折叠薄片。已确认**不是描边造成的**——
  描边 pass 是纯轮廓（基于 alpha 膨胀），不会勾内部线。
- **躯干/大腿少量深色斑点**：烘焙在 base color 图集里的扫描脏点，不在几何上。
- 眼周 MToon dithering 网点、27 骨达不到 AIRI 女孩 80 骨门槛等前轮限制依旧。

---

## 第二十五轮：把"晃脑"从猜的变成量的，并修掉光环竖环

用户反馈动作"一直晃脑转圈，不像 AIRI 女孩那样随意随机"。这一轮不再靠肉眼看，
因为 headless chromium 在这台机器上只有约 0.6fps，根本没法用截图迭代动作。

### 新增 `scripts/probe_yxz_motion.mjs`

离线跑同一个 `AnimationMixer`、同一份 VRM，60Hz 采样，输出四个决定观感的量：

- `spread` 骨骼离"平均姿态"最远多少度（幅度）
- `deg/10s` 每十秒走过的角度路程（动作量）
- `lag6` t 与 t+6s 的平均角距离（低=重复，高=真的不重复）
- `axis corr` 三个轴之间的相关性（都接近 ±1 = 在描闭合的李萨如曲线 = 转圈）

`^bone` 前缀表示在父骨骼的局部系里采样，用来把"头自己在动"和"身体带着头动"分开。
生命层的常量表和 `lifeDrift`/`lifeMicro` 是**从组件源码里解析出来**的，
所以探针不会和浏览器跑的东西对不上。

### 量出来的三件事

1. **头部世界位移 9.5°，AIRI 基准是 2.2°。** 而且 `^head` 只有 0.32°——
   也就是说头几乎没自己动，**全部幅度是躯干拖过去的**。所以先砍躯干。
2. **光环在 Listening/Speaking 下 `spread` 是 179.99°**，就是"竖环"。
   `stabilise` 分支拿父骨骼的**静止世界**四元数去和**实时世界**四元数共轭，
   两个基准不是一回事，光环就翻了过去。改成直接解进父骨骼的实时系：
   `local = liveParentWorld⁻¹ · restWorld · drift`。修完所有状态统一 0.42°。
3. **`lifeDrift` 三个轴共用一个标量**（只是乘 0.8/0.9），是在 XYZ 空间描闭合曲线。
   改成三轴各自独立，频率全部由无理数相乘（√2、√3、√5、φ）得到，
   十二条频率没有公共周期。头部三轴相关性从 −0.59/0.16/−0.43 降到 −0.33/0.01/−0.44。

### 顺手挖出来的 three.js 行为

`AnimationMixer` **不会重写"整条 track 恒定"的骨骼**。生命层每帧都写，
于是这类骨骼上会无限累积——实测 10 秒漂 115°。
已加 `constantRotationBones()` 跳过这些骨骼（pinned 的光环除外，它整体赋值不受影响）。
目前五个在用 clip 里只有 `halo` 命中，而它走的是整体赋值分支，所以是纯粹的保险。

### 本轮验收

- [x] 待机头部世界位移 9.5° → **3.58°**，`^head` 2.0°，三轴相关性接近 0。
- [x] 五态 + Wave 全部无 180° 翻转；光环五态一致 0.42°，不再竖起、不扫脸。
- [x] `pnpm --filter @proj-airi/stage-ui-three run typecheck` 通过。
- [x] `node scripts/verify_yxz_runtime.mjs`：`pageErrors: []`，六态骨骼峰值非零。
- [x] `capture_yxz_avatar.mjs` 六态截图（`docs/yxz-motion/pass2/`）：光环姿态正常，
      待机/思考/说话无破碎感、无玻璃感。

### 仍然存在（如实记录）

- 面罩正中一条横向白条、头盔顶部几处暗色斑点：bake 进 base color 图集的扫描脏点，
  属于资产级 UV/贴图问题，和动作无关，本轮未动。
- `scripts/_tmp_dumptracks.mjs` 是上一轮的临时探针，本轮想删但被沙箱策略拦下，留着无害。

---

## 第二十七轮：把"晃脑的转圈"换成"站着的人"

### 上一轮为什么没治好

上一轮把头骨的三轴正弦打散成无理数频率，头部三轴相关性确实降到了 0 附近，
但 **idle clip 自己的头部曲线还在**：8.07 秒闭环、原始各轴 sd 8.67/3.29/4.65，
轴间相关 −0.58/0.61/**−1.00**——一个标准的三维闭合椭圆。

`CLIP_CALM` 当时给 head 留了 0.06。**这不是"更轻的晃"，还是同一个晃**：
周期没变、形状没变，只是振幅小了 6 倍。眼睛分辨不出 1.7° 是"在想事情"，
只分辨得出"每 8 秒重复一次的抖动"——这在视觉上恰好就是"晃脑"，
而 −1.00 的 z-y 相关让这个椭圆看起来像在**画圈**。

实测（`--calm` 之后、动作层之前）：头 sd 1.66/0.57/0.39，
相关 **−0.53/0.31/−0.96**，闭环依旧。

### 这一轮的做法

1. **`CLIP_CALM.YXZ_Idle.head` 从 0.06 改成 0**——不是调小，是整条取走。
   头现在只由"行为层"驱动，而行为层只会做**一次性的、能看清意图的动作**，
   不会做持续的振荡。
2. **发现 three.js 的第二条相关行为**：`AnimationMixer` 对"整条 track 恒定"的
   骨骼**只写一次就不再写**。所以 head 一旦被清零，生命层的 `premultiply`
   就变成无限累积——实测头部位移 **179.99°**，角色会被拧出骨架。
   新增 `ownedBy` / `base`：被 `CLIP_CALM` 归零的骨骼由生命层**整体赋值**
   （`base · lifeLocal`），而不是叠加。光环的 `stabilise` 分支本来就是整体赋值，
   所以不受影响。
3. **把"随机手势"换成"行为词表 + 不重复调度"**（`LIFE_ACTIONS`）：
   12 个成品动作，每个带**预备(lead) / 主笔(out) / 保持(hold) / 回程超调**四段包络，
   角度全部作用在多个骨骼上（转头时颈、上胸一起走）。
   - 预备：先反向微动一下。没有这个就是舵机。
   - 主笔：出去快、到得慢，眼睛才看得到"它开始了"。
   - 回程：比去程慢，并越过中位 **11%** 再收——收尾不落在整数帧上。
   - 调度：最近两次用过的动作不再出现；间隔用 `random^1.9 · 12`，
     压低均值、拉长尾巴，所以"大多数 3–8 秒、偶尔十几秒"。
4. **视线独立成层**（`updateGaze`）：不再是"锁死相机 + 每秒抖 ±0.25"。
   - 锚点每 3.4–10 秒走一次（±0.34/±0.22），一分钟内不会盯着一个像素。
   - 微扫视每 0.22–1.8 秒一次，幅度 0.05–0.12，约 60ms 到位。
   - 眼神**都是跳的，不是滑的**：定点先选好，眼睛 60ms 内弹过去。
     滑过去是相机在漂，弹过去才是视线。
   - 头动的时候眼睛**先走**（`GAZE_LEAD` 90ms），回来的时候**头先回、眼睛后回**。
     去程眼睛先、回程眼睛后，这两种顺序真人脸上都有。
5. **眨眼自己写了一套**（`updateBlink`）：间隔 `1.9 + random^1.6·6.2`，
   1/6 概率连眨，1/7 概率是慢眨（0.42s，半闭）。快闭—停—慢开。

### 本轮验收（`node scripts/probe_yxz_motion.mjs --calm --life`，300s）

| | 上一轮 | 本轮 |
|---|---|---|
| 头部世界 spread | 3.58° | **27.3°**（张望幅度变大，但绝大多数时间不在） |
| 头部三轴相关 | −0.53/0.31/−0.96 | **−0.17/0.03/0.05** |
| 头部 p10/50/90 | — | 1.1 / 2.6 / 7.3° |
| 头部 6 秒相关性 lag6 | — | 6.8（闭环已破） |
| 躯干 spread（neck→hips） | 3.4/2.2/1.3/1.3 | 20.9/20.9/17.1/12.0/5.8 |

关键不是 spread 变大，而是 **p50 只有 2.6°、p10 只有 1.1°**：
中位数那 2.6° 基本全是呼吸（光 clip 的头部世界 sd 就是 2.2°），
剩下的时间头是真的停着。头动变成了一件**偶尔发生、看得清意图的事**，
而不是一件一直在发生的小事。

- [x] 五态 + Wave 无 180° 翻转，光环五态一致（0.4–4.0°，不再竖起）。
- [x] `pnpm --filter @proj-airi/stage-ui-three run typecheck` 通过。
- [x] `moeru-lint` 该文件 0 error。
- [x] `node scripts/verify_yxz_runtime.mjs http://127.0.0.1:5199`：`pageErrors: []`，
      六态骨骼峰值非零，`gazeYawSpread 1.02`（眼睛确实在动）。
- [x] `capture_yxz_avatar.mjs` 截图（`docs/yxz-motion/pass3/`）：面部正常、
      眼睛没有交叉、光环姿态正常。

### 仍然存在（如实记录）

- **破碎感还在**，位置和上一轮判断不同，这次看清楚了：
  双肩外侧那几片白色锯齿碎片是**扫描本体网格的一部分**（`lit.glb` 单网格 118310 面、
  `probe_yxz_holes.py` 报 `total: 0` 无洞），不是 wing 网格、也不是独立部件——
  是扫描残留的薄壳碎片。面罩上那条横白条、头盔顶的暗斑同属一类。
  下一步应该跑 `render_yxz_head.py --unlit`，用"忽略法线只留自发光"的办法
  判定黑斑到底是**翻面**还是**真洞**，再决定是 `fix_winding` 修法线还是补面。
- `scripts/_tmp_*` 几个临时探针删除被沙箱策略拦下，留着无害。

---

## 第二十九轮：动作改成「注意力目标」，不再回中位

用户反馈：动作"一直晃脑转圈，不像 airi 那样随意随机"。这一轮只动动作。

### 先量，再改

`scripts/probe_yxz_motion.mjs` 加了 `held%`（0.5 秒窗口内位移 < 0.4° 的帧占比）
和 `episodes`（连续运动段数）。改之前的生产链路（offline 60Hz）：

| 状态 | 头部 spread | deg/10s | 相对平均姿态 still% |
|---|---|---|---|
| idle | 15.7° | 0.5 | **10%** |
| listening | 24.6° | 0.8 | **1%** |
| speaking | 45.4° | 1.2 | **1%** |

根因不是幅度，是结构：

1. `actionEnvelope` 首尾归零 → 每个动作都是「偏出去 → 回来」，
   于是头永远在穿过中位来回。这就是"晃脑／转圈"的形状。
2. `YXZ_Idle` 上身还残留 3.9°／8 秒周期的闭环，头坐在上面等于一直在摇。

### 改法

- **注意力模型**（新）：头不再走动作列表，而是有一个 `attention` 目标
  （yaw/pitch/roll），动作只剩"走过去"这一段行程。
  dwell 6–25 秒、side 有惯性（不左右等距交替）、步长幂曲线（多为 2–7°，
  偶尔 10–15°）、34% 概率是 <1.3° 的微调。`attentionEnvelope` 单调趋近目标，
  **不回中位**。
- **呼吸层**（新）：`lifeBreath`，4.35s 周期、吸快呼慢、周期本身缓慢漂移，
  幅度 <1°。上半身循环被拿掉之后，胸腔必须还有东西在动，否则是"渲染图被冻住"。
- **共享姿态游走**（改）：原来每根骨头各自随机选目标，会出现胯往左歪、胸往右扭。
  现在全身一个目标，按 lag 逐级延迟传递（hips 0 → spine 0.35 → chest 0.72
  → upperChest 1.05 → neck 1.28 → head 1.5），即真实重心转移的传导顺序。
- **动作表瘦身**（改）：删掉 5 个以转头为主的动作（glance / glanceFar /
  glanceDown / glanceUp / tilt），动作表只管身体；新增 weightShift /
  shoulderDrop / hipTwist；lean 与 sigh 的各轴角度下调 20–30%（它们沿骨链叠加）。
- **间隔改成成簇**（改）：`nextLifeGap` 18% 概率进入 2–3 连发的短动作簇，
  其余时候 12–40 秒的真正静止。人是" fidget 一阵 → 安静半分钟"，
  任何稳定节拍都像机器。
- `lifeMicro` 从 1.9/3.1Hz 降到 0.83/1.31Hz：0.03° 的高频抖看不见，
  但眼睛读得出那是"振动"而不是"活着"。

### 顺带修掉的真 bug

- **`CLIP_CALM` 里 Listening 漏了 `hips`**：髋骨还在被片段的循环摆动驱动，
  这是 listening 一直动的直接原因。统一规则：**生活层要动的骨头，在所有片段里
  一律归零**，由生活层独占。
- `pickAttention` 的 recentre 分支写成 `yaw = 0`，而 target 是
  `attention.yaw + yaw`，等于"原地不动"——头一路漂到 −32.7° 再没回来。
  改成 `yaw = -attention.yaw`。
- `attentionEnvelope(k<=0)` 返回 1（目标值），应为 0（起点值），
  否则过渡开始的那一帧是瞬移。
- roll 只在 22% 的重新瞄准里参与，避免两个轴同相位走成小闭环——那正是"转圈"。

### 结果（240s，offline 60Hz，含全部图层）

| 状态 | 头部 spread | held% | busy% | episodes |
|---|---|---|---|---|
| idle | 16.8° | 32 | 68 | 118 |
| listening | 12.3° | 33 | 66 | 121 |
| thinking | 10.8° | 34 | 66 | 115 |
| speaking | 13.6° | 36 | 64 | 108 |
| hips（四态） | 2.7–4.5° | 83–99 | 1–7 | 2–19 |

之前 listening 的头部 spread 是 24.6° 且 99% 的时间在动；
现在是 12.3°，且髋骨基本不动（只有姿态游走）。

### 验证

- [x] `vue-tsc --noEmit` 通过；`moeru-lint` 组件 0 error。
- [x] `verify_yxz_runtime.mjs`：`pageErrors: []`，`gazeYawSpread 0.042`。
- [x] 新增 `scripts/plot_yxz_motion.mjs`：把时间序列画成图。
      轨迹形状是「长平台 + 偶发有意图的动作」，不再有周期性振荡
      （`docs/yxz-audit/motion-head.png`、`motion-speaking.png`）。
- [x] 新增 `scripts/capture_yxz_idle_sequence.mjs`：t≈20s 与 t≈80s 是两个
      不同的驻留姿态，而不是一次摆动的中间帧（`docs/yxz-rig-review/idle/`）。

### 仍然存在（如实记录）

- 本轮**没有碰外观**。冠部白色碎片、面罩上的暗色碎点、嘴部那道黑色乱线、
  面罩的大块玻璃高光，仍然在（`docs/yxz-rig-review/idle/idle-1.png` 上可见）。
  那是下一轮的目标。
- `scripts/` 下的探针脚本本来就有大量 `console.log` / `no-use-before-define`
  的 lint 报错（历史遗留），本轮只保证组件本体 0 error。

---

## 第三十四轮：把"晃脑的转圈"换成"没有周期的动作"

用户反馈：**动作要像原来的 airi 女孩那样随意随机，不要一直晃脑、转圈，要更高级。**
这一轮只做动态，**没有动 `packages/stage-ui/src/**`**（主动询问、TTS、聊天流程原样）。

### 先量，再改

上一轮把"随机游走"换成了四条正弦叠加（周期 7.4 / 11.3 / 17.9 / 23.1 秒）。
它平滑，但**平滑不等于活着**：四条正弦的和还是有周期的，眼睛会锁定最快的那条，
剩下的就是"每 2–3 秒摆一下头"。

离线探针（`scripts/probe_yxz_motion.mjs`，60s，60Hz，真实 mixer + 真实生活层）
在改之前的读数：

| 指标 | 改之前 | airi 参照 |
|---|---|---|
| head busy%（0.5s 内变化 >0.4°） | 88 | 94 |
| head held%（基本不动的时间） | 12 | 6 |
| head spread（离平均姿态最远） | 7.0° | — |
| head 轴向 sd x/y/z | 2.27 / 0.84 / 2.04 | 2.61 / 0.42 / 3.61 |
| head 轴相关 xy | -0.12 | 0.60 |

`busy 88%` 就是"一直在动"，而轴向 sd 里 roll 有 2.04°：在一个脑袋占了大半个
轮廓的 chibi 上，2° 的持续侧倾就是摆头。

### 改了什么

**1. 姿态信号从正弦换成噪声（无周期）**

新增 `motionHash / motionNoise / motionFbm`（五次插值，三倍频程），
`MOTION_SEED` 每次进页面重新随机——**每次打开，角色的站姿都不一样**。

- `swayValue()`：中频噪声减去 0.19 倍频的慢层，慢层把姿态拉回原处，
  所以它是"绕着一个姿势游走"，不是"一路走出去"。
- `swaySwell()`：一个很慢的闸门，平时关着（幅度只剩 18%），
  一阵一阵打开——**人站着就是一阵动、一阵静**，一直等幅地摇就是节拍器。
- 三个轴给三段互不相干的噪声（`SWAY_PHASE_PITCH/YAW/ROLL`），
  两个轴不会一起升降，所以不会画出圆。

**2. 头不再自己摇**

`HEAD_SWAY_PITCH/ROLL` 从 1.9 / 2.3 降到 1.2 / 1.05，并且**跟着身体的
安静段一起安静**。yaw 仍然不加——加了就是画圆。

**3. 注意力模型改成"看别处，然后待在那儿"**

- 注视间隔从 `5.5 + rand^1.7 × 20`（最长 25 秒）改成 `2.8 + rand^1.5 × 11`
  （最长 14 秒）。25 秒不是"长看"，是"忘了动"。
- 步长从 `0.8 + rand^1.5 × 13` 改成 `1.5 + rand^1.1 × 12`，
  并且每次都往中间拉一点点（0.3–1.2°），所以头会真的转头看别处，
  又会在接下来几次里慢慢回到你这边。
- 回到正前方时落在**附近**而不是正正的中位（±2.4°）——
  每次回到完全一样的角度就是节拍器。
- 侧向惯性 0.62 → 0.82：两次看同一边像"还在看那个东西"，
  左右等距交替像节拍器。
- 微调（<1°）概率 0.34 → 0.24。

**4. 保持注视时不是冻的**

新增 `attentionDrift()`：保持期间头有 ±0.42° 的慢漂移。
僵住的姿势像暂停的渲染，慢漂移才像后面站了个人。

**5. 身体跟着视线走一点点**

`LIFE_BONES` 新增 `follow`：脊柱 0.05 / 胸 0.13 / 上胸 0.17。
人转头看东西，肩膀会跟一小部分（`TORSO_FOLLOW = 0.35`），
头把这部分原样还回去（`attentionNow.yaw × (1 - TORSO_FOLLOW)`），
所以最终朝向就是模型要的那个角度。

**6. 其它**

- 光环漂移 0.22/0.34 → 0.08/0.14，`haloSettle` 3.6°/2.4° → 1.5°/1.0°：
  光环是画面上最大的形状，它一转，整个角色看起来都在转。
- 身体动作间隔 `12 + rand^1.7 × 28` → `9 + rand^1.7 × 22`。

### 结果（120s，离线 60Hz）

| 指标 | 改之前 | 改之后 |
|---|---|---|
| head busy% | 88 | 65 |
| head held%（基本不动） | 12 | **34** |
| head spread | 7.0° | 18.7°（走出去看别处再回来） |
| head 轴向 sd x/y/z | 2.27 / 0.84 / 2.04 | 2.06 / 7.29 / 1.76 |
| head 轴相关 xy/xz/yz | -0.12 / 0.02 / 0.17 | -0.13 / -0.29 / 0.15 |
| lag6（t 与 t+6s 的平均差） | 4.51 | **7.08** |
| hips busy% | 7 | 8 |
| halo busy% | 4 | 1 |

轴相关全部远离 ±1（那才是"转圈"），lag6 从 4.5 涨到 7.1：同一个姿势
不再每 6 秒复现一次。

轨迹图 `docs/yxz-audit/series-r35/head-r35.png`（120s）：
pitch 是一条平的基线 + 很细的抖动 + 偶尔一个明确的下沉；
yaw 是 20 秒一个平台、平台之间一次明确的转头；
roll 是缓慢漂移。**长平台 + 偶发有意图的动作**，没有周期性振荡。

胶片图 `docs/yxz-audit/film-r35/contact-sheet.png`（37s / 18 帧）：
头不再左右摆，眼睛在转、在眨，身体重心在换。

### 验证

- [x] `npx moeru-lint packages/stage-ui-three/src/components/YXZRealModelScene.vue` → 0 error。
- [x] `scripts/verify_yxz_runtime.mjs http://127.0.0.1:5199` → `pageErrors: []`。
- [x] `scripts/probe_yxz_motion.mjs --status idle/listening/thinking/speaking` 全部跑通，
      四种状态 head spread 9.6–11.0°、held 34–37%，没有哪种状态退化成抖动。
- [x] `scripts/capture_yxz_headfilm.mjs` / `capture_yxz_avatar.mjs` 浏览器实拍。
- [x] 探针新增 `--attention`（打印注意力目标）和 `--euler`（打印世界欧拉角），
      用来查"模型说转了、实际没转"这类问题；新增 `--follow` 相关的 `TORSO_FOLLOW` 同步。
- [x] `scripts/build_yxz_variant.ps1` 的 `--debris-radius` 默认值 0.293 → 0.2905，
      和实际部署的那版一致，流水线能复现出同一个模型。

### 仍然存在（如实记录）

- 面罩上沿到冠盖之间那条浅色"面板拼片带"、面罩上的白色划痕、耳罩处的黑洞：
  都在，只在贴脸近景可见（`docs/yxz-audit/closeup-r34/head.png`），常规视角看不出来。
- **Ollama 与 Voicebox 没有在本机运行**（11434 端口拒绝连接），
  所以对话、语音、主动询问里的回答都出不来——这是环境问题，不是代码问题，
  这一轮没有为了绕过它去改 `packages/stage-ui/src/**` 的流程。

## 第三十六～四十一轮（补记）：破碎感的来源被翻过来了

### 一、原始扫描模型是好的，破碎是流水线造出来的

这一段翻了一个很重要的案：之前所有"碎片、接缝、孔洞"的修复，
都是在**症状**上打补丁，而症状的来源是重建流水线本身。

逐步排除之后确认，破坏来自这五个步骤：

- `strip_yxz_crown_debris.py`：按半径剔壳，把正常的外壳一起剔了。
- `build_yxz_helmet.py`：重新生成冠盖时法线方向不一致。
- `clean_yxz_shell_flakes.py`：清理薄片时把贴着模型的正常面一起删了。
- `smooth_yxz_normals.py`：全局平滑法线，把锐边也抹了。
- `repaint_yxz_visor.py`：重画面罩时 UV 越界。

结论：**用原始扫描件重建（`scripts/build_yxz_pristine.ps1`，
unwrecked → nohalo → fixed.glb → rig → vrm）出来的模型本身没有碎片。**
这一条记在这里，后面不要再往"清理壳"的方向加步骤了。

### 二、面罩上的白色亮条

`scripts/fix_yxz_visor_bump.py` 接入 `build_yxz_pristine.ps1`，
把面罩法线上的凸起压回去。部署的是 `docs/yxz-variants/pr4/yxz.vrm`
（23,851,392 bytes），贴图 diff 只有一个连通区（44730 texel，
x 2969–3204 / y 2648–2909），mean RGB 没有漂移。

整页截图里白条已经没有了（`docs/yxz-audit/page-r40.png`），
但极近景里还剩一条较淡的白条（`docs/yxz-audit/defects-r40/visor.png`），
新增了 `scripts/probe_yxz_visor_bar2.mjs` 来定位它属于哪个 mesh / UV。

### 三、"晃脑"的真凶是呼吸，不是注意力模型

这是这一段最值钱的一条结论，因为它推翻了几轮以来一直在改的东西。

旧的 breath 系数沿脊椎一路累加到头上：

```
hips .10 + spine .17 + chest .34 + upperChest .26 + neck .06 + head .04 = 0.93°
```

也就是说**每一个呼吸周期，头上有将近一度的俯仰在上下摆**，
而呼吸周期是 `BREATH_BASE = 5.25` 秒——一个不快不慢、非常容易被眼睛
锁住的周期。这就是"晃脑"的节拍器，跟注意力模型没有关系。

新系数：hips 0 / spine 0 / chest **0.44** / upperChest **-0.14** /
neck **-0.30** / head 0。胸腔起伏、肩微升，头完全不动。

### 四、按参考（airi 女孩）重建体重转移

实测参考动画：两条腿**同向**摆 4~4.8°、脚反向补偿保持贴地、
骨盆只 yaw ±1°、头的倾斜主要来自身体。

新增 `WEIGHT_CELL = 13.4`、`lifeWeight()`、`WEIGHT_SWAY` 表，
腿和脚从 clip 里全部归零（`CALM_LEGS`），改由动作层驱动。

### 五、这一段之后的数字（120s，离线 60Hz）

| 指标 | 参考 airi | 第三十六～四十一轮 |
|---|---|---|
| head busy% | 94 | 42 |
| head held% | 6 | 57 |
| head still% | 4 | 18 |
| head 轨迹 deg/s | 3.70 | 1.25 |
| head 单帧最大角变 | 8.26°/0.1s | **60.7°** |
| 腿 deg/s | 2.48 | 0 |

参考是**连续恒速流**（p95≈max，从不跳）；
我们是"静止 + 偶尔跳变"。这两者不是同一个东西，
而且"跳变"是这一段留下的主要问题。

## 第四十二～四十八轮：把动作改成和 airi 女孩同一套统计

### 一、找到"跳变"的真凶

`scripts/probe_yxz_motion.mjs` 加了 `--frameFrom/--frameTo/--frames`，
可以逐帧打印每一根骨头的 offset / move / posture / attention /
 local 四元数。

用它在 `t=14.8s` 抓到现场：

```
f888  hips move [0, 0,  0.5599]   amount -0.2000
f889  hips move [0, 0,  0.0949]   amount -0.0339   <-- 一帧之内掉了 0.47°
f890  hips move [0, 0, -0.6882]   amount  0.2458
f891  hips move [0, 0, -1.3314]   amount  0.4755
```

动作是 `weightShift`（dur 3.6 / lead 0.28 / hold 0.42）。
旧的 `actionEnvelope()` 把四个阶段铺成
`lead → out → hold → 剩下`，其中 `out = max(0.04, 0.62 - lead - hold)`。

`weightShift` 要 `0.28 + 0.42 = 0.70`，超过 0.62，
于是 **`out` 被压到 0.04**——整个"出"段只剩
`0.04 × 3.6s = 0.144s`。动作在七分之一秒里走完全程，
然后定住一秒半，再慢慢回来。

这就是"跳变"：**不是姿态噪声、不是漂移、不是呼吸，
是几个动作的出段被挤成了四分之一秒**。
`lean` / `hipShift` / `hipTwist` / `shoulderDrop` 同样中招。

### 二、`actionEnvelope()` 重写

改成：先给"出"段一份**保底份额**（18%），
不够的时候**先让 hold 退让、再让 lead 退让**
（hold 短一点几乎看不出来，wind-up 短一点根本看不出来）。

出段的曲线也从 `1-(1-t)^2.4` 换成升余弦
`0.5 - 0.5cos(πt)`：
前者的速度峰值在行程的前 1/5，眼睛正好盯着那一段；
升余弦的峰值在行程正中，而且峰值只有平均速度的 1.5 倍
（人的动作也差不多是这个比值），两端都连续导数，没有折角。

### 三、头的"生命"：三路信号，常开

参考的 airi 女孩实测（120s）：

- 头部**始终在动**（busy 94%，held 6%，still 4%）；
- 速度中位数 3.56 deg/s，**最快 8.26 deg/s，从不跳**；
- yaw 通道几乎是平的（sd 0.41°）——**她从不左右转头**；
- 她做的是"抬下巴 / 垂下巴 + 歪头"的慢摇，pitch 摆幅 ±3.6°、roll ±5.2°，
  两者高度相关（corr 0.98），周期约 3~4 秒。

原来的实现是：头 81% 的时间定住，剩下的时间偶尔以 66 deg/s 甩一下，
而且 yaw 是最大的一路（sd 1.27）——所以它看起来在"转圈"。

新的头部分三层：

1. **rock（摇）**：一路信号，pitch 和 roll 共用，roll 落后 0.45s，
   所以头是"一个形状"在摇，不是两个形状碰巧重叠。
2. **wander（游走）**：每个轴各有一路独立信号压在 rock 上面，
   所以 rock 不会退化成钟摆，姿势也不会重复。
3. **turn（转）**：很小的一路 yaw（±0.25°）。
   转头是注意力模型的事，不是待机的事。

信号用**正弦和**而不是噪声：噪声有时快有时慢，
眼睛会把快的那些读成抽动；正弦和的速度是可以跟随的，
而四个周期（8.3 / 10.9 / 14.3 / 19.7 秒）互不成整数倍，
所以它永远回不到起点。

脖子也读同一路信号（晚 0.5s、取 0.32/0.34 份），
于是头和身体对"往哪边倾"达成一致，而不是在一个静止的脖子上转轴。

### 四、注意力模型收口

- yaw 上限 6.5° → **0.9°**：参考的 yaw 是平的 Ours 不能转成扫视；
- pitch 上限 4.6° → 2.4°，roll 2.4° → 1.2°；
- 步长、回收力度同步收紧，trip 时长 1.05~4s → **1.7~5.5s**；
- trip 的曲线也换成升余弦。

### 五、手势全部改小改慢

一个动作是**好几根骨头的角度相加**。旧的 `leanForward`
在脊柱 2.4° + 胸 2° + 上胸 1.4° + 颈 1.6° + 头 2.2°，
头实际被带走 8.5°，而且在三分之一秒内走完——
听起来是"前倾"，实际上是一次猛扑。

现在每个手势的角度大约减半、时长增加 25~40%：
动作变成"一个本来就在动的角色身上的重音"，而不是"唯一在动的东西"。

### 六、结果（120s，离线 60Hz，与参考同一套指标）

| 指标 | 参考 airi | 第三十六～四十一轮 | 本轮 |
|---|---|---|---|
| head busy% | 94 | 42 | **91** |
| head held% | 6 | 57 | **8** |
| head still% | 4 | 18 | **4** |
| head 速度中位数 deg/s | 3.56 | 1.25 | **3.02** |
| head 速度最大 deg/s | 8.26 | 60.7 | **9.68** |
| head 超过 10 deg/s 的采样 | 0 | 多处 | **0** |
| head 轴向 sd x/y/z | 2.62 / 0.41 / 3.61 | 1.20 / 1.27 / 1.63 | **2.45 / 0.72 / 4.07** |
| head 轴相关 xz | 0.98 | 0.31 | 0.73 |
| 腿 deg/s | 2.48 | 0 | 0.54 |

head busy/held/still 三个数字现在已经和参考基本一致：
头始终在动、但从不甩、也几乎不左右转。

### 七、验证

- [x] `npx moeru-lint packages/stage-ui-three/src/components/YXZRealModelScene.vue` → 0 error。
- [x] `scripts/verify_yxz_runtime.mjs http://127.0.0.1:5199` → `pageErrors: []`。
- [x] `scripts/shot_yxz_page.mjs http://127.0.0.1:5199 docs/yxz-audit/page-r48.png` → 整页截图正常。
- [x] `scripts/capture_yxz_headfilm.mjs` 浏览器实拍接触印相表。
- [x] 探针新增 `--frameFrom/--frameTo/--frames`（逐帧 dump）与 `--jump`，
      用来定位动作包络里的不连续点。

### 仍然存在（如实记录）

- 面罩近景里那条较淡的白条、以及额头星徽上的 magenta 粉污，
  还在（整页视角看不出来，近景可见）。
- **Ollama 与 Voicebox 没有在本机运行**，
  所以对话、语音、主动询问里的回答都出不来——这是环境问题，不是代码问题，
  这一轮依然没有为了绕过它去改 `packages/stage-ui/src/**` 的流程。

## 2026-10-24：随机姿态调度与当前质量复核（r70）

本轮响应“不要一直晃脑转圈，要像 Airi 一样随意随机”。原质量目标未完成，
不能将以下动作验证当作破碎感、材质及正式业务流程的完整验收。

### 实际修改

- 删除运动核心中约 10.375 秒的头、颈、髋循环采样表，改成有边界的随机姿态目标、
  阻尼过渡、独立的重心调整以及稀疏的小点头/侧倾/短暂看向旁边。
- 保留头部世界旋转反解、眨眼和视线管线。未改 `packages/stage-ui/src/**`，
  未重建或重写 VRM 模型资源。
- 修复低帧率下姿态只推进半个时间步的问题：采用小步积分，保留完整的动画 delta。
- 补齐组件骨骼类型、手势空值检查；窄容器按模型宽度取景，状态气泡允许换行。
- 连拍工具改为真正裁剪页面区域，并记录模型时钟，不再将墙钟间隔标成动作时长。

### 验证与证据

- `node scripts/test-yxz-motion-core.mjs`：四个种子，每个模拟 5 分钟；
  检查姿态目标边界、同帧幂等性、有限旋转、重置、小动作触发。
  10Hz 对比 120Hz 的一秒姿态误差由约 0.699 度降低到约 0.00064 度。
- 正确带 `--calm` 的 150 秒完整骨链探针：
  `docs/yxz-audit/motion-r70-final/YXZ_Idle.json`。
  head 轴标准差约 1.85 / 0.28 / 2.55 度，小动作约 5.2 次/分钟。
  旧的固定周期表已移除，但随机姿态仍有慢漂相关性；不能说所有时间尺度自相关都很低。
- 前两组 `motion-r70`、`motion-r70b` 漏传 `--calm`，叠加了未经收敛的源 clip，
  不代表网页运行效果，不应用于验收比较。
- `npx moeru-lint packages/stage-ui-three/src/components/YXZRealModelScene.vue`：
  最终 0 error；`pnpm --filter @proj-airi/stage-ui-three typecheck`：通过。
- `scripts/verify_yxz_runtime.mjs`：待机、聆听、思考、说话、完成五状态，
  `pageErrors: []`，输出 `docs/yxz-audit/runtime-r70-final.json`。
  这是模型测试页的模拟状态/口型，不证明真实 TTS、主动引导或完整创作流程可用。
- `scripts/verify-yxz-visual.mjs`：1440x900、390x844 截图和画布像素变化检查，
  产物在 `docs/yxz-audit/visual-r70/`。窄屏测试页有固定控制栏，模型完整可见但较小。
- 服务地址：`http://127.0.0.1:5199/yxz-avatar`。

### 未解决项与实验结论

- 冠部薄片/缺口、面罩白线、额头深色贴面斑点、局部深色接缝仍可见，
  整体仍不满足用户“全部瑕疵修好”的交付要求。
- 同姿势降低 rim 的浏览器对照没有消除上述几何/贴面缺陷，未写入产品参数。
- 全局 FrontSide 会丢失眼部细节；仅外壳 FrontSide 正面减少薄片，
  但左右 15 度视角暴露侧面孔洞，因此该方案被否决，未写入产品。
- 所有 A/B 改动仅在隔离的 Playwright 浏览器里执行，浏览器已关闭。

## 2026-10-25：谐波化 idle 动作与网格复原（r83–r90）

这一轮把两件事做完：**头部的破碎感从几何上根治**，**动作按 Airi 参考信号的
实测频谱重写**，并把速度上限纳入模型。

### 一、破碎感：根因是抽面，不是贴图

对照扫描原片与部署版后确认，原始扫描网格本身是完好的（736941 顶点，
boundaryEdges = 0），破损是后续"清理碎屑"脚本抽面造成的：

| 文件 | 顶点 | 面 | boundaryEdges |
|---|---|---|---|
| `model_pbr.glb`（原扫描） | 736941 | 1427774 | 0 |
| `model_simplified.glb` | 146292 | — | 35232 |
| 旧部署版 `yxz.vrm` | 116536 | — | 1164 |

`model_pbr.glb` 与旧部署版**共享顶点数为 0**，嫁接路线经实测不可行。

改为**把原始完好主网格装回 VRM 1.0 容器**：
`scripts/restore_yxz_pristine_mesh.py` 搬运主网格并保留 halo / 眼睛 / 贴图 /
动画 / 表情，`scripts/trim_yxz_restored.py` 删掉两片原始光环比翼
（island 845/428，10244 + 7124 面）。
最终件 `docs/yxz-audit/candidates/yxz-trimmed.vrm`
→ 覆盖 `packages/stage-ui-three/src/assets/vrm/models/yxz.vrm`
（SHA256 `9E5199B7…1DE5`，31003980 bytes，136993 顶点 / 239628 面 /
**boundaryEdges = 0**）。旧件留档 `docs/yxz-audit/candidates/yxz-deployed-preRestore.vrm`。

贴图兼容性已核：restored 与部署版主贴图**字节完全相同**（11621181 bytes），
115670 个共享顶点中 100337 个 UV 完全一致，其余属原被清理过的破碎冠部区域。

光环材质另外修过：`totalEmissiveRadiance *= 0.20 + 1.45*haloBand`
→ `0.62 + 0.78*haloBand`（旧值让边缘掉到 1/5 亮度，读作"带深色边框的扁塑料环"）。

### 二、动作：照着参考信号重写

把 `docs/yxz-audit/motion-ref/animation-bare.json`（Airi 原 girl's idle clip）
做最小二乘谐波分解，结果非常干净：**一个基频 + 2/3/4/5 次谐波**，
各轴的相对相位各不相同。

| 谐波 | 频率 | 下巴(pitch) | 侧倾(roll) | 转(yaw) | pitch 相位 | roll 相位 | yaw 相位 |
|---|---|---|---|---|---|---|---|
| 1 | 0.0962 Hz | 3.336 | 4.723 | 0.2637 | 0 | 0 | 0 |
| 2 | 0.1924 Hz | 0.7566 | 1.3189 | 0.0840 | −3π/2 | −3π/2 | −π/2 |
| 3 | 0.2886 Hz | 1.3458 | 1.1525 | 0.3773 | 0 | 0 | 0 |
| 4 | 0.3848 Hz | 0.0696 | 0.5213 | 0.0961 | +π/2 | −π/2 | −π/2 |
| 5 | 0.4810 Hz | 0.1032 | 0.2179 | 0.2032 | +π | 0 | −π |

这解释了参考信号的全部结构特征：基频处 chin/roll 同步（相关系数 0.976），
第 3 次谐波处 **chin 领先 roll**（比例反过来），所以她的头是"点头 + 摇摆"，
不是画圈。

改造后的实现（全部在 `packages/stage-ui-three/src/components/YXZRealModelScene.vue`）：

1. **删除三条独立的 headRock/headPitch/headRoll 轴**，只留 `headYaw`。
   原来 pitch/roll 各自独立 → 轨迹是椭圆 → 视觉上就是"转圈"。
2. **rock 改为参考信号的谐波分解**：三个独立的和（chin / tilt / turn），
   各自按上表的振幅与相位，不再是"一个信号 × 固定比例"。
3. **谐波精确锁相**：试过失谐 1.5%–4%，几次谐波会在几分钟内滑到同时到达峰值，
   头部瞬间走 9+ 度/秒——**已否决**。改为：谐波精确锁相，**节拍缓慢呼吸**
   （±2.5%，周期 41 秒），周期永不重复且波形始终是同一个手势。
4. **摆幅缓慢起伏**（±5%，周期 29 秒），避免"一直同一个幅度摆"的节拍器感。
5. **注意力层的漂移改为全程连续**：原先注视行程中完全不加漂移、落位瞬间突然加上，
   是一次 1/4 度的跳变；现已全程叠加。
6. **头部速度上限** `HEAD_SPEED_CEILING = 8.4`：手势在挑起时按"岩石接下来
   0.5 秒会用掉多少余量"缩放，塞不进余量就缩小，不会叠上去把头推过上限。
   `GESTURE_SPEED` 由 7.0 降到 4.8：只在头部平静时出手。
7. 注视行程时长下限 1.0 → 1.7 秒、包络行程占比 0.62 → 0.80；
   注意力天花板 `{yaw 0.34, pitch 0.55, roll 0.82}` → `{yaw 0.38, pitch 0.34, roll 0.46}`
   （头部保持克制，眼神与头部仍共用同一注意力通道，两者始终一致）。

### 三、量化结果（150 秒实测，`--calm`）

| 指标 | Airi 参考 | r82（旧） | **r90（现在）** |
|---|---|---|---|
| 轴标准差 pitch/yaw/roll | 2.62 / 0.41 / 3.61 | 2.49 / 0.25 / 3.59 | **2.61 / 0.46 / 3.58** |
| 椭圆相关 pitch~roll | 0.976 | 0.999 | **0.976** |
| 椭圆相关 pitch~yaw | 0.594 | −0.09 | **0.524** |
| 静止占比 held % | 8 | 19 | **9** |
| 路径速度 deg/s | 3.48 | 2.77 | **3.36** |
| 主周期 s | 10.4 | 10.2 | **10.4** |
| 自相关峰（越低越不循环） | 1.0 | 0.938 | **0.97** |
| 频段 漂移/沉静/摇动 | 0.002/0.794/0.194 | 0.028/0.877/0.092 | **0.009/0.793/0.192** |
| 动作段 /分钟 | 20.5 | 21 | **20.8** |
| 瞬时速度 p99 d/s | 8.23 | 7.80 | **7.46** |
| 瞬时速度 max d/s | 8.25 | 10.93 | **9.88** |

除 `snap max`（9.88 vs 8.25）外全部对齐参考值。剩余的 1.6 度/秒来自
**参考信号没有的"注意力层"**——她那一段是纯 clip，而我们额外叠了一层
"看向别处"。已确认该峰值是 0.5 秒内平滑加速到顶再平滑减速的连续运动，
不是跳帧；再压下去就要牺牲"主动看向某处"的行为，故保留。

复现命令：

```
node scripts/probe_yxz_motion.mjs --vrm packages/stage-ui-three/src/assets/vrm/models/yxz.vrm \
  --life packages/stage-ui-three/src/components/YXZRealModelScene.vue \
  --calm packages/stage-ui-three/src/components/YXZRealModelScene.vue \
  --seconds 150 --dump docs/yxz-audit/motion-r90 --clip YXZ_Idle
node scripts/compare_yxz_motion_ref.mjs docs/yxz-audit/motion-ref/animation-bare.json \
  docs/yxz-audit/motion-r90/YXZ_Idle.json
```

**必须带 `--calm`**，否则测的是未收敛的源 clip（head pitch 标准差 8.63 度，是假数据）。

### 四、验证

- [x] `node scripts/test-yxz-motion-core.mjs` → 通过（4 个种子，姿态幂等、
      边界、有限旋转、重置、小动作频率 15.6–18.2/分钟）。
- [x] `npx moeru-lint packages/stage-ui-three/src/components/YXZRealModelScene.vue` → 0 warning / 0 error。
- [x] `pnpm --filter @proj-airi/stage-ui-three typecheck` → 通过。
- [x] `node scripts/verify_yxz_runtime.mjs http://127.0.0.1:5199` → `pageErrors: []`。
- [x] `node scripts/capture_yxz_headfilm.mjs` 浏览器实拍接触印相表
      （`docs/yxz-audit/headfilm-r90/`）与宽幅 12 帧
      （`docs/yxz-audit/widefilm-r90/`）：头部起伏与侧倾自然，无画圈、无跳变。
- [x] `node scripts/shot_yxz_home.mjs` → 主页主动问候全文在位、
      `speechSynthesisAvailable: true`、3 个中文音色可用。
- [x] 部署模型 SHA256 与 `docs/yxz-audit/candidates/yxz-trimmed.vrm` 一致；
      `packages/stage-ui/src/**` 本轮未改。

### 五、如实记录

- 6121 后端未在本机运行，`ws://localhost:6121/ws` 连接被拒；这是服务端环境，
  与模型无关。
- 面罩近景那条较淡的白条、额头星徽上的 magenta 粉污仍在（整页视角看不出）。
- `snap max` 高于参考 1.6 度/秒，代价是保留了"主动看向别处"的行为。

---

## 2026-10-27：嘴部收尾（r146 → r148）与交付验收

本轮只做嘴部几何与交付验收，**聊天、语音、主动开场、引导思考、项目流程
一行未改**（`packages/stage-ui/src/**` 保持原样）。

### 一、这一轮解决的东西

**1. 嘴巴露出脸的白色“泡泡”（最大的破碎感来源）**

嘴板是一张“脸自己的皮”挖了一个洞，洞后面原本就是脸。脸的口鼻部是个隆起，
所以一开口就从洞里露出隆起的顶部——一个白色圆顶，像嘴里含了个泡泡。

做法（`scripts/finish_yxz_mouth.py`）：

- 把隆起挖成浅碗（`BOWL_DEPTH=0.0100`，在嘴板归一化椭圆内渐隐回脸面）；
- 在碗里放一层深色内衬（`YXZ_MouthCavity`），材质改成口腔色
  （base `rgb(54,15,20)`、shade `rgb(26,7,10)`、rim 归零）；
- 把穿出嘴板的脸顶点推回去（`CLEARANCE=0.06mm`，最多推 4mm），并重算法线。

**2. 唇缝里的白斑（z-fighting）**

内衬原本按“嘴孔边缘沿椭圆角的高度”插值定位。但嘴孔是一根 30mm × 0.9mm 的
细缝，边缘点沿椭圆参数**并不等距**，插值会取到比真实边缘更高的位置，
把内衬顶到嘴板前面 0.07mm——两个面贴在一起抢深度缓冲，唇线上就炸出一片
白点。

修法：内衬在洞内的高度改用**邻域最低**的边缘高度（`window=1`），
保证它永远在嘴板之后；间隙由 0.07mm 提到 0.43mm。

实测（`scripts/probe_yxz_lining_cover.py`）：

| | r146 | **r148** |
|---|---|---|
| 嘴孔边缘被内衬挡住 | 144/144 | 144/144 |
| 内衬在唇后最小距离 | 0.069 mm | **0.434 mm** |
| 内衬在唇后平均距离 | 1.82 mm | 2.09 mm |
| 内衬跑到唇前面 | 0 处 | 0 处 |

1× 实际像素对比（`docs/yxz-audit/closed-1x-compare.png`）：r146 的上唇深红线
中间是断的、有白缝；r148 的唇线连续。

**3. 嘴部逐层定位**

新增 `scripts/shot_yxz_mouth_layers.mjs`（逐层隐藏：脸／嘴板／内衬）、
`scripts/shot_yxz_visemes.mjs`（实况页面强制开合 aa/ih/ou/ee 四种口型）、
`scripts/probe_yxz_lining_cover.py`（内衬覆盖与间隙）、
`scripts/probe_yxz_plate_standoff.py`（嘴板逐环离脸面多高）。

结论：唇上那道淡色**不是缝**——几何上嘴是闭合的，内衬 144 个边缘点全部挡住，
它是 MToon 打在唇缘折痕上的背光色，保留（读作唇部高光）。

### 二、部署

- 部署件：`packages/stage-ui-three/src/assets/vrm/models/yxz.vrm`
  = `docs/yxz-variants/r148-mouth/yxz.vrm`
  （SHA256 `401357ECCD9117A0E96DF8806569C6F34E39EB60C789240301075FE46DDC2683`）。
- 上一版留档：`docs/yxz-audit/candidates/yxz-pre-r146.vrm`。
- 候选件：`docs/yxz-variants/r146|r147|r148-mouth/`。

### 三、验收

- [x] `node scripts/verify_yxz_runtime.mjs http://127.0.0.1:5199` → `pageErrors: []`。
- [x] `node scripts/shot_yxz_home.mjs` → 主动开场全文在位
      （“你好，我是宜小智，你的 AI 智能创造伙伴……今天最想做什么？”）、
      `speechSynthesisAvailable: true`、3 个中文音色可用。
- [x] `node scripts/shot_yxz_visemes.mjs` → 四种口型实况截图，
      开口只有暗红口腔，**没有白色圆顶**（`docs/yxz-audit/visemes-r148/`）。
- [x] `node scripts/probe_yxz_motion.mjs --life ... --calm ...` +
      `compare_yxz_motion_ref.mjs` → 动作仍与 airi 女孩参考一致
      （pitch/roll 椭圆相关 0.976 对 0.976，静止占比 9% 对 8%，
      动作段 20.8/分钟对 20.5，频段 0.009/0.793/0.192 对 0.002/0.794/0.194）。
- [x] `node scripts/capture_yxz_headfilm.mjs` → 头部实拍胶片
      （`docs/yxz-audit/headfilm-r146/contact-sheet.png`）：57 秒内头部缓慢
      漂移并停留，没有画圈、没有跳变。

### 四、如实记录（仍然存在）

- 唇缘有一道淡色高光（背光色打在折痕上），近看可见，整页视角看不出。
- 额头星徽附近偏灰、面罩下缘的白灰毛边仍在（整页视角看不出）。
- 6121 后端未在本机运行，`ws://localhost:6121/ws` 连接被拒；服务端环境，与模型无关。
- 浏览器用 SwiftShader 软件渲染，约 4 FPS；实拍胶片只能看姿态，不能当性能验收。

---

## 2026-10-27：整体姿态解算与动作瘦身（r160 → r163）

这一轮的目标只有两条：**动作少一点，但整体**；**模型精致**。
前半句用上游 AIRI 的 idle 当唯一整体姿态源做到了，后半句这轮只做完了
嘴/面罩以外的部分，剩下的如实列在最后。

### 一、身体不再由「每根骨各一层噪声」构成

上游 AIRI 自带的 idle（`packages/stage-ui-three/src/assets/vrm/animations/
idle_loop.vrma`，VRMC_vrm_animation 1.0，10.375s / 250 keys / 28 channels）
被接进来当作**唯一**的整体姿态源。

`.vrma` 不能直接套到别的模型上：它的 33 个节点 rest world rotation 全是
identity，也就是它只带**运动**、不带**姿势**。所以取的是每根 humanoid 骨
相对循环平均姿势的**世界空间增量** Δ(t) —— 这个量与模型无关，再用目标
rig 自己的 rest 姿势换算回局部四元数：

```
W_par(t) = Δ_par(t) · restWorld_par
W_B(t)   = Δ_B(t)   · restWorld_B
local(t) = inv(W_par(t)) · W_B(t)
```

- 提取脚本：`scripts/retarget_vrma_idle.mjs`
- 运行时解算：`packages/stage-ui-three/src/composables/vrm/authored-idle.ts`
- 产物：`packages/stage-ui-three/src/assets/vrm/animations/yxz-idle-authored.json`
- GLB 读取器：`scripts/lib/glb.mjs`

实测幅度（相对平均姿态，度）：head 6.64 / neck 3.65 / leftUpperLeg 2.87 /
upperChest 2.80 / hips 1.54 / 手臂 ~2.6；速度 0.9–3.7 °/s；循环无缝隙。
与 AIRI 参考量级一致（thigh 4.5°、hips yaw 1°）。

**为什么必须是「世界增量」而不是 three-vrm 的 `conj_P · value · P · L`**：
YXZ rig 的 rest world rotation 差异极大（upperChest 180°、legs 180°、
arms 161~172°、hips/spine/chest/neck/head 0°），直接套官方公式会把约 103°
的肩部姿态偏移一并带过来。

authored idle 是**独立 action**，不是 state clip 里的一条轨道：它的时钟跨状态
切换连续，角色站立时的重心不会因为开口说话而跳回去；它也不参与 state clip
的交叉淡化（那会把两个姿势平均成一片糊）。

### 二、这一轮修掉的四个真问题

**1. 翅膀一直在自己乱动（最大的一条）**

three.js 载入时会用 `PropertyBinding.sanitizeNodeName` 清洗节点名，
**把点号去掉** —— 文件里叫 `wing.L` 的骨骼，进到场景里叫 `wingL`。
代码里写的一直是 `wing.L`，于是这个名字什么都匹配不上：

- `LIFE_BONES` 里找不到翅膀 → 行为层完全管不到它；
- `CLIP_CALM` 里的 `'wing.L': 0` 也没生效 → **clip 里 7.3° 的翅膀摆动
  被完整保留**（success 态 28.4°）；
- 切状态时每个 clip 把翅膀停在各自的常量上，彼此相差最多 16°。

结果就是：身体几乎不动，翅膀自己在扇 —— 这正是「不整体」「毛躁」的直接
来源。修正名字后，翅膀连同光环一起**退出 clip**，改由行为层持有。

**2. 切状态时各部件跳到不同姿势**

量了每个 clip 的常量姿势两两之差：wings 4–16°、手臂 4–8°、
thinking 的右臂 42.7°（下巴手势，本就该动）、head 10.8°、halo 12.2°。

- wings / halo：退出 clip，行为层持有 → 任何状态切换都不再跳。
- 手臂：站立各态（idle / listening / speaking / success）**共用同一个
  held 姿势**（取 idle 的），只有 thinking 和 wave 保留自己的手势。
- head：本来就是行为层直接赋值，不会跳。
- 状态交叉淡化 0.22s → **0.5s**：0.22s 里把手臂抬 42° 是「弹」，
  0.5s 才是「手势」。

**3. 脖子在转、头不动 —— 关节扭转**

头原先是**对世界解**的：neck 转 3.65° 时头保持世界朝向不变，于是脖子在
头底下拧着 —— 断掉的关节，而且恰好是「头不是一起动」的成因。

改成头的世界朝向 = 颈部的实时转动（相对 rest）∘ 头自身的瞄准：
`lifeLocal = restParentInv · headShapeSample · restParent · base`。
头部于是**刚性跟随颈部**，头自身的瞄准仍在（眼睛是单独解的，始终对准目标）。

**4. 光环是个贴纸**

halo 之前被「钉」在世界上（用父级实时朝向抵消掉父级运动），身体在它下面
转它自己纹丝不动。改成用父级 rest 解算 → 光环随胸口一起倾斜，
并且不再有当初为了防「翻面」而钉死带来的副作用。

### 三、量化结果（`scripts/capture_yxz_film.mjs` + `scripts/analyze_yxz_film.mjs`）

浏览器实拍 14 帧、模型时钟加速 3×、逐帧记录骨骼世界朝向：

| 骨骼 | r161（前） | **r163（后）** |
|---|---|---|
| wingL | 13.76° | **2.69°** |
| wingR | 12.90° | **2.69°** |
| halo | 1.32°（钉死） | 2.80°（随身体） |
| upperChest | 2.87° | 2.72° |
| neck | 3.93° | 3.82° |
| head | 10.34° | 8.56° |

- 翅膀从 13.8° 降到 2.7°，与身体同量级 → 不再自己扇。
- 头部轨迹**不再闭合**：closing ratio 1.30（r161 是 0.295，闭合 = 转圈）。
- 头相对胸腔的独立位移 9.54°，头/胸步进相关 0.43 —— 身体带动头、头仍有
  自己的决定。

工具本身也是这轮的新东西：`capture_yxz_film.mjs` 抓片并同时记录数值，
`analyze_yxz_film.mjs` 出 travel / coherence / closing 三组指标
（注意四元数平均：这批 rig 有几根骨 rest 就转了 180°，直接平均分量会互相
抵消，所以改成**相对首帧求增量再平均**）。

### 四、验收

- [x] `pnpm --filter @proj-airi/stage-ui-three typecheck` → 通过。
- [x] `node scripts/verify_yxz_runtime.mjs http://127.0.0.1:5199`
      → `actionCount: 6`、`pageErrors: []`、口型 aa/ih/ou/ee 峰值 0.18–0.31、
      注视 yaw spread 0.018。
- [x] `node scripts/shot_yxz_home.mjs` → 主动开场全文在位
      （“你好，我是宜小智，你的 AI 智能创造伙伴……今天最想做什么？”）、
      `speechSynthesisAvailable: true`、3 个中文音色。
- [x] `node scripts/capture_yxz_film.mjs` → `docs/yxz-audit/film-r162/`。

### 五、如实记录（仍然存在）

- **嘴部**：闭合时是一道带白点的细缝，4× 放大下仍像表面裂纹而不是嘴。
  1× 观看尺寸读作一个小微笑。彻底修需要重做嘴板几何 + 重绘 atlas，
  风险高，这轮没有动。
- **面罩下缘白灰毛边**仍在（1× 看不出）。
- **左手常年抬起**：这是扫描原姿（clip 的常量姿势与 rig 的 rest **完全
  相同，0.0°**），不是动画问题。要放下来得改 rest 姿势，会动到蒙皮，
  这轮没做。对迎宾角色而言也算合理。
- 6121 后端未在本机运行，`ws://localhost:6121/ws` 被拒；服务端环境，与模型无关。
- 浏览器 SwiftShader 软件渲染，约 1.2 FPS；实拍胶片只能看姿态，不能当性能验收。
