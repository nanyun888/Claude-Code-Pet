#!/usr/bin/env node
/**
 * Claude Code Hook → Desktop Pet notifier
 *
 * Reads hook event from stdin (Claude Code sends JSON with tool details)
 * and forwards task info to the pet app.
 *
 * Usage: node notify.js <state>
 * States: idle, working, talking, walk, celebrate, error
 */

const net = require('net');
const path = require('path');
const fs = require('fs');

const state = (process.argv[2] || 'idle').toLowerCase();
const validStates = ['idle', 'working', 'talking', 'walk', 'celebrate', 'error'];

if (!validStates.includes(state)) {
  process.exit(1);
}

const isWin = process.platform === 'win32';
const socketPath = isWin
  ? path.join('\\\\.\\pipe', 'claude-code-pet')
  : path.join(process.env.HOME || '/tmp', '.claude-code-pet.sock');

// Read stdin for task details from Claude Code
let inputData = '';
if (!process.stdin.isTTY) {
  process.stdin.setEncoding('utf-8');
  process.stdin.on('data', (chunk) => { inputData += chunk; });
  process.stdin.on('end', () => sendEvent());
} else {
  sendEvent();
}

function sendEvent() {
  let taskInfo = {};

  // Parse Claude Code hook stdin (JSON)
  try {
    if (inputData.trim()) {
      const hookData = JSON.parse(inputData.trim());
      taskInfo = {
        tool: hookData.tool_name || hookData.tool || '',
        description: hookData.description || hookData.input?.description || '',
        command: hookData.input?.command || hookData.input?.cmd || '',
        filePath: hookData.input?.file_path || hookData.input?.path || '',
        query: hookData.input?.query || hookData.input?.pattern || '',
        prompt: hookData.input?.prompt || '',
      };
    }
  } catch {}

  // Also check environment variables
  if (!taskInfo.tool && process.env.CLAUDE_TOOL_NAME) {
    taskInfo.tool = process.env.CLAUDE_TOOL_NAME;
  }

  const payload = JSON.stringify({ state, task: taskInfo });

  const client = net.createConnection(socketPath, () => {
    client.write(payload);
    client.end();
  });

  client.on('error', () => {
    // Pet app might not be running — that's ok
    process.exit(0);
  });

  // Timeout
  setTimeout(() => process.exit(0), 2000);
}