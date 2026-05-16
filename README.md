# Claude Code Pet

可爱的像素小狐狸桌面宠物，专为 Claude Code 设计。

## 功能

- 像素小狐狸常驻桌面，10 种动画状态
- Claude Code Hook 联动：执行工具时显示工作中，任务完成时庆祝
- 双击宠物打开聊天（接入 Claude Code CLI，有项目上下文）
- 右键菜单切换状态、设置、聊天
- 空闲时自动在桌面漫步
- 空闲 8-15 秒随机休闲动作（wink / 啃饼干 / 睡觉 / 跳跃）
- 单击互动：弹跳 + 爱心动画
- 任务气泡：Claude Code 执行任务时显示工具名和详情

## 安装

```bash
git clone https://github.com/nanyun888/Claude-Code-Pet.git
cd Claude-Code-Pet
npm install
npm run dev
```

## Claude Code Hook 配置

首次启动会自动配置 Hooks。也可以手动配置：

在 `~/.claude/settings.json` 中添加：

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "*", "hooks": [{ "type": "command", "command": "node /path/to/src/hooks/notify.js working" }] }
    ],
    "PostToolUse": [
      { "matcher": "*", "hooks": [{ "type": "command", "command": "node /path/to/src/hooks/notify.js working" }] }
    ],
    "Stop": [
      { "hooks": [{ "type": "command", "command": "node /path/to/src/hooks/notify.js celebrate" }] }
    ]
  }
}
```

或运行自动配置：

```bash
node src/hooks/setup.js
```

## 聊天功能

双击宠物打开聊天窗口，接入 Claude Code CLI：

- 选择 Session：下拉菜单显示所有 Claude CLI 会话，选择连接到正在运行的会话
- 默认会话：自动选择最近的非活跃会话
- 流式输出：文字逐块显示，带加载进度提示
- 项目上下文：Claude Code 有完整项目访问权限

## 支持的 AI 模型

| 模型 | 格式 | 默认地址 |
|------|------|---------|
| Claude | Anthropic Messages | api.anthropic.com |
| MiMo-v2.5-Pro | Anthropic Messages | token-plan-cn.xiaomimimo.com/anthropic |
| DeepSeek | OpenAI Chat | api.deepseek.com |
| DeepSeek-v4-Pro | OpenAI Chat | api.deepseek.com |

## 状态说明

| 状态 | 触发 | 动画 |
|------|------|------|
| IDLE | 空闲 | 呼吸 + 眨眼 + 耳朵微动 |
| WORKING | Claude Code 执行工具 | 专注打字 |
| TALKING | 流式输出 | 嘴巴开合 |
| CELEBRATE | 任务完成 | 跳跃 + 彩虹 |
| ERROR | 执行出错 | 抖动 + 耳朵耷拉 |
| WALK | 自动漫步 | 侧面行走 |
| WINK | 空闲休闲 | 单眼闭合 + 爱心 |
| NIBBLE | 空闲休闲 | 啃饼干 + 碎屑 |
| SLEEP | 空闲休闲 | 蜷成球 + ZZZ |
| JUMP | 空闲休闲 | 跳跃 + 彩虹 |

## 操作

- 左键单击：互动（弹跳 + 爱心）
- 左键双击：打开聊天
- 右键：菜单（聊天 / 设置 / 切换状态 / 漫步开关 / 退出）
- 系统托盘：显示/隐藏/设置/退出

## 国际化

支持中文和英文，自动检测系统语言，可在设置中手动切换。

## 技术栈

- Electron + TypeScript
- SVG 像素画（crispEdges）
- CSS 关键帧动画
- Unix Socket / Named Pipe Hook 通信
- Claude Code CLI 集成（`claude --print --resume`）
