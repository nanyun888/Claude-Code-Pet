#!/usr/bin/env node
/**
 * Claude Code Hook → Desktop Pet notifier
 *
 * Usage: node notify.js <state>
 * States: idle, working, talking, walk, celebrate, error
 *
 * Hook configuration (~/.claude/settings.json):
 * {
 *   "hooks": {
 *     "PreToolUse": [{ "matcher": "*", "command": "node /path/to/notify.js working" }],
 *     "PostToolUse": [{ "matcher": "*", "command": "node /path/to/notify.js working" }],
 *     "Stop": [{ "command": "node /path/to/notify.js celebrate" }]
 *   }
 * }
 */

const net = require('net');
const path = require('path');
const fs = require('fs');

const state = (process.argv[2] || 'idle').toLowerCase();
const validStates = ['idle', 'working', 'talking', 'walk', 'celebrate', 'error'];

if (!validStates.includes(state)) {
  console.error(`Invalid state: ${state}. Valid: ${validStates.join(', ')}`);
  process.exit(1);
}

const isWin = process.platform === 'win32';
const socketPath = isWin
  ? path.join('\\\\.\\pipe', 'claude-code-pet')
  : path.join(process.env.HOME || '/tmp', '.claude-code-pet.sock');

const client = net.createConnection(socketPath, () => {
  client.write(state);
  client.end();
});

client.on('error', (err) => {
  // Pet app might not be running — that's ok
  if (err.code === 'ENOENT' || err.code === 'ECONNREFUSED') {
    process.exit(0);
  }
  console.error('Connection error:', err.message);
  process.exit(0);
});