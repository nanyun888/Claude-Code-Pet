export type Lang = 'zh' | 'en';

const strings: Record<Lang, Record<string, string>> = {
  zh: {
    // Settings
    settings_title: '设置',
    ai_model: 'AI 模型',
    api_key: 'API Key',
    api_base_url: 'API Base URL（可选，自定义端点）',
    api_key_placeholder: '输入对应模型的 API Key',
    base_url_placeholder: '留空使用默认地址',
    cancel: '取消',
    save: '保存',
    saved: '已保存',
    language: '语言',

    // Tray
    tray_show: '显示宠物',
    tray_hide: '隐藏宠物',
    tray_chat: '聊天...',
    tray_settings: '设置...',
    tray_reset: '重置位置',
    tray_reconfig: '重新配置 Hooks',
    tray_exit: '退出',

    // Context menu
    menu_chat: '聊天',
    menu_settings: '设置...',
    menu_switch_state: '切换状态',
    menu_idle: '待机',
    menu_working: '工作中',
    menu_talking: '说话',
    menu_celebrate: '庆祝',
    menu_error: '错误',
    menu_walk: '漫步',
    menu_on: '开启',
    menu_off: '关闭',
    menu_reset_pos: '重置位置',
    menu_hide: '隐藏宠物',
    menu_exit: '退出',
    menu_switch_char: '切换形象',

    // Tool labels
    tool_Bash: '执行命令',
    tool_Read: '读取文件',
    tool_Write: '写入文件',
    tool_Edit: '编辑文件',
    tool_Grep: '搜索内容',
    tool_Glob: '查找文件',
    tool_Agent: '子任务',
    tool_WebFetch: '获取网页',
    tool_WebSearch: '搜索',
    tool_Skill: '技能',

    // Chat errors
    chat_cli_error: '无法启动 Claude Code CLI: ',
    chat_generic_error: '聊天出错: ',
  },
  en: {
    // Settings
    settings_title: 'Settings',
    ai_model: 'AI Model',
    api_key: 'API Key',
    api_base_url: 'API Base URL (optional, custom endpoint)',
    api_key_placeholder: 'Enter API Key for selected model',
    base_url_placeholder: 'Leave empty for default',
    cancel: 'Cancel',
    save: 'Save',
    saved: 'Saved',
    language: 'Language',

    // Tray
    tray_show: 'Show Pet',
    tray_hide: 'Hide Pet',
    tray_chat: 'Chat...',
    tray_settings: 'Settings...',
    tray_reset: 'Reset Position',
    tray_reconfig: 'Reconfigure Hooks',
    tray_exit: 'Exit',

    // Context menu
    menu_chat: 'Chat',
    menu_settings: 'Settings...',
    menu_switch_state: 'Switch State',
    menu_idle: 'Idle',
    menu_working: 'Working',
    menu_talking: 'Talking',
    menu_celebrate: 'Celebrate',
    menu_error: 'Error',
    menu_walk: 'Walk',
    menu_on: 'On',
    menu_off: 'Off',
    menu_reset_pos: 'Reset Position',
    menu_hide: 'Hide Pet',
    menu_exit: 'Exit',
    menu_switch_char: 'Switch Character',

    // Tool labels
    tool_Bash: 'Run Command',
    tool_Read: 'Read File',
    tool_Write: 'Write File',
    tool_Edit: 'Edit File',
    tool_Grep: 'Search',
    tool_Glob: 'Find Files',
    tool_Agent: 'Subtask',
    tool_WebFetch: 'Fetch Web',
    tool_WebSearch: 'Search',
    tool_Skill: 'Skill',

    // Chat errors
    chat_cli_error: 'Cannot start Claude Code CLI: ',
    chat_generic_error: 'Chat error: ',
  },
};

let currentLang: Lang = 'zh';

function detectLang(): Lang {
  const sys = typeof navigator !== 'undefined' ? navigator.language : (process.env.LANG || '');
  return sys.startsWith('zh') ? 'zh' : 'en';
}

export function initI18n(lang?: string): void {
  currentLang = (lang === 'en' || lang === 'zh') ? lang : detectLang();
}

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang): void {
  currentLang = lang;
}

export function t(key: string): string {
  return strings[currentLang]?.[key] || strings.zh[key] || key;
}
