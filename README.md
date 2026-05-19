# Claude Code Pet

A cute pixel fox desktop pet designed for Claude Code.

[中文文档](README_CN.md)

## Features

- Pixel fox living on your desktop with 10 animation states
- Claude Code Hook integration: shows "working" when executing tools, celebrates on completion
- Double-click to chat (powered by Claude Code CLI with project context)
- Right-click menu: chat, settings, switch state, toggle auto-walk, exit
- Auto-walks across the desktop when idle
- Random idle animations every 8-15 seconds (wink / nibble cookie / sleep / jump)
- Click interaction: bounce + heart animation
- Task bubble: shows tool name and details during Claude Code tasks
- Session picker: connect to running Claude Code CLI sessions
- Streaming output with progressive loading indicator
- i18n support (Chinese / English, auto-detect system language)

## Installation

```bash
git clone https://github.com/nanyun888/Claude-Code-Pet.git
cd Claude-Code-Pet
npm install
npm run dev
```

## Claude Code Hook Configuration

Hooks are auto-configured on first launch. Manual setup:

Add to `~/.claude/settings.json`:

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

Or run auto-setup:

```bash
node src/hooks/setup.js
```

## Chat

Double-click the pet to open chat. Powered by Claude Code CLI (`claude --print --resume`):

- **Session picker**: dropdown shows all Claude CLI sessions, select to connect
- **Default session**: auto-selects the most recent non-active session
- **Streaming**: text appears progressively as Claude generates
- **Project context**: Claude Code has full access to codebase, CLAUDE.md, and tools

## Supported AI Models

| Model | Format | Default URL |
|-------|--------|-------------|
| Claude | Anthropic Messages | api.anthropic.com |
| MiMo-v2.5-Pro | Anthropic Messages | token-plan-cn.xiaomimimo.com/anthropic |
| DeepSeek | OpenAI Chat | api.deepseek.com |
| DeepSeek-v4-Pro | OpenAI Chat | api.deepseek.com |

## Animation States

| State | Trigger | Animation |
|-------|---------|-----------|
| IDLE | Idle | Breathing + blinking + ear twitch |
| WORKING | Claude Code executing tool | Typing animation |
| TALKING | Streaming output | Mouth open/close |
| CELEBRATE | Task completed | Jumping + rainbow |
| ERROR | Execution error | Shaking + ears droop |
| WALK | Auto-walk | Side walking |
| WINK | Idle bonus | Wink + heart |
| NIBBLE | Idle bonus | Cookie nibble + crumbs |
| SLEEP | Idle bonus | Curl up + ZZZ |
| JUMP | Idle bonus | Jump + rainbow |

## Controls

- Left click: interact (bounce + heart)
- Left double-click: open chat
- Right click: menu (chat / settings / switch state / auto-walk toggle / exit)
- System tray: show/hide/settings/exit

## Internationalization

Supports Chinese and English. Auto-detects system language, manually switchable in Settings.

## Tech Stack

- Electron + TypeScript
- SVG pixel art (crispEdges)
- CSS keyframe animations
- Unix Socket / Named Pipe hook communication
- Claude Code CLI integration (`claude --print --resume`)

## License

MIT
