# Claude Code Pet

可爱的像素小狐狸桌面宠物，专为 Claude Code 设计。

## 功能

- 像素小狐狸常驻桌面，10 种动画状态
- Claude Code Hook 联动：执行工具时显示工作中，任务完成时庆祝
- 双击宠物打开聊天（接入 Claude API）
- 右键菜单切换状态、设置、聊天
- 空闲时自动在桌面漫步
- 空闲 8-15 秒随机休闲动作（wink / 啃饼干 / 睡觉 / 跳跃）

## 安装

```bash
git clone https://github.com/nanyun888/Claude-Code-Pet.git
cd Claude-Code-Pet
npm install
npm run dev
```

## Claude Code Hook 配置

在 `~/.claude/settings.json` 中添加：

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "*", "command": "node /path/to/src/hooks/notify.js working" }
    ],
    "PostToolUse": [
      { "matcher": "*", "command": "node /path/to/src/hooks/notify.js working" }
    ],
    "Stop": [
      { "command": "node /path/to/src/hooks/notify.js celebrate" }
    ]
  }
}
```

或运行自动配置：

```bash
node src/hooks/setup.js
```

## 状态说明

| 状态 | 触发 | 动画 |
|------|------|------|
| IDLE | 空闲 | 呼吸 + 眨眼 + 耳朵微动 |
| WORKING | Claude Code 执行工具 | 专注打字 |
| TALKING | 流式输出 | 嘴巴开合 |
| CELEBRATE | 任务完成 | 跳跃 + 彩虹 |
| ERROR | 执行出错 | 抖动 |
| WALK | 自动漫步 | 侧面行走 |
| WINK | 空闲休闲 | 单眼闭合 + 爱心 |
| NIBBLE | 空闲休闲 | 啃饼干 + 碎屑 |
| SLEEP | 空闲休闲 | 蜷成球 + ZZZ |
| JUMP | 空闲休闲 | 跳跃 + 彩虹 |

## 操作

- 左键拖拽：移动宠物
- 左键双击：打开聊天
- 右键：菜单（聊天 / 设置 / 切换状态 / 退出）
- 系统托盘：显示/隐藏/设置/退出

## 技术栈

- Electron + TypeScript
- SVG 像素画（crispEdges）
- CSS 关键帧动画
- Unix Socket / Named Pipe Hook 通信
- Claude Messages API
