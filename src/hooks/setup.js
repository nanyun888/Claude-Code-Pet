#!/usr/bin/env node
/**
 * Auto-configure Claude Code hooks for Desktop Pet
 *
 * Run: node src/hooks/setup.js
 *
 * Reads ~/.claude/settings.json and adds hook entries
 * that notify the pet of Claude Code events.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const isWin = process.platform === 'win32';
const homeDir = os.homedir();
const settingsPath = path.join(homeDir, '.claude', 'settings.json');

// Path to notify.js — resolve relative to this script
const notifyScript = path.resolve(__dirname, 'notify.js').replace(/\\/g, '/');

// Hook entries to add
const hookEntries = {
  PreToolUse: [
    {
      matcher: '*',
      command: `node "${notifyScript}" working`,
    },
  ],
  PostToolUse: [
    {
      matcher: '*',
      command: `node "${notifyScript}" working`,
    },
  ],
  Stop: [
    {
      command: `node "${notifyScript}" celebrate`,
    },
  ],
};

function run() {
  console.log('Claude Code Pet — Hook Setup');
  console.log('=============================\n');

  // Read existing settings
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      console.log(`Found existing settings: ${settingsPath}`);
    } catch (e) {
      console.error(`Warning: Could not parse ${settingsPath}, will create new.`);
    }
  } else {
    console.log(`No settings file found, will create: ${settingsPath}`);
  }

  // Ensure directory exists
  const dir = path.dirname(settingsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Merge hooks
  if (!settings.hooks) settings.hooks = {};

  let added = 0;
  for (const [hookType, entries] of Object.entries(hookEntries)) {
    if (!settings.hooks[hookType]) {
      settings.hooks[hookType] = [];
    }

    // Check if already configured (avoid duplicates)
    const existing = settings.hooks[hookType];
    const alreadyHas = entries.every((entry) =>
      existing.some((e) => e.command && e.command.includes('claude-code-pet'))
    );

    if (!alreadyHas) {
      // Remove old pet hooks if any
      settings.hooks[hookType] = existing.filter(
        (e) => !e.command || !e.command.includes('notify.js')
      );
      // Add new
      settings.hooks[hookType].push(...entries);
      added++;
      console.log(`  [+] ${hookType} → pet working/celebrate`);
    } else {
      console.log`  [=] ${hookType} — already configured`);
    }
  }

  // Write back
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');

  console.log(`\nDone! ${added} hook(s) added.`);
  console.log(`Settings: ${settingsPath}`);
  console.log('\nRestart Claude Code for hooks to take effect.');
}

run();