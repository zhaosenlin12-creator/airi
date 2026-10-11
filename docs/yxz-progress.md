# 宜小智 AI 智能创造系统进度记录

更新时间：2026-10-11（Asia/Shanghai）

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

## 本阶段验收

- [x] `pnpm -F @proj-airi/stage-ui typecheck`
- [x] 浏览器端 `http://127.0.0.1:5174/` 加载成功。
- [x] 浏览器 DOM 中存在宜小智图片节点和状态气泡。
- [x] 默认浏览器截图显示宜小智正面姿态及“欢迎，我是宜小智”气泡。
- [x] 未修改 AIRI 工作区中已有的语音、providers、国际化等未提交变更。

## 当前限制

现有素材是透明 PNG，不是 Live2D 或 VRM 绑定模型。因此目前是“姿态切换 + 状态气泡”，还不是连续面部变形、眨眼和口型同步。后续如需连续表情，需要补充或制作 Live2D/VRM 模型。

## 下一阶段

1. 宜小智对话面板与状态气泡的视觉细化。
2. 接入 `cartoon-print-studio` 的预览生成 API，先完成只读预览链路。
3. 添加“需求限定提示词”选项和多轮确认数据结构。
4. 再接入 3D 生成、打印软件打开和取件流程。
