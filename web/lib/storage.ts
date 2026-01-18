/**
 * localStorage 工具函数
 * 用于持久化保存对话记录
 */

const STORAGE_KEYS = {
  CONVERSATIONS: 'aitutor_conversations',
  SETTINGS: 'aitutor_settings',
};

/**
 * 保存对话记录到 localStorage
 */
export function saveConversations(conversations: any[]): void {
  try {
    const data = {
      conversations,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save conversations to localStorage:', error);
  }
}

/**
 * 从 localStorage 加载对话记录
 */
export function loadConversations(): any[] {
  try {
    const dataStr = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!dataStr) return [];

    const data = JSON.parse(dataStr);

    // 检查是否过期（30天）
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    if (data.savedAt && Date.now() - data.savedAt > thirtyDaysInMs) {
      // 过期了，清除数据
      localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
      return [];
    }

    return data.conversations || [];
  } catch (error) {
    console.error('Failed to load conversations from localStorage:', error);
    return [];
  }
}

/**
 * 清除所有对话记录
 */
export function clearConversations(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
  } catch (error) {
    console.error('Failed to clear conversations from localStorage:', error);
  }
}

/**
 * 保存设置到 localStorage
 */
export function saveSettings(settings: {
  apiKey?: string;
  language?: string;
  modelMode?: 'auto' | 'quality' | 'fast';
  persona?: string;
}): void {
  try {
    const currentSettings = loadSettings();
    const newSettings = { ...currentSettings, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
  }
}

/**
 * 从 localStorage 加载设置
 */
export function loadSettings(): {
  apiKey?: string;
  language?: string;
  modelMode?: 'auto' | 'quality' | 'fast';
  persona?: string;
} {
  try {
    const dataStr = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!dataStr) return {};
    return JSON.parse(dataStr);
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
    return {};
  }
}

/**
 * 获取对话记录数量
 */
export function getConversationCount(): number {
  try {
    const dataStr = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!dataStr) return 0;

    const data = JSON.parse(dataStr);
    return data.conversations?.length || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * 检查是否有保存的对话记录
 */
export function hasSavedConversations(): boolean {
  return getConversationCount() > 0;
}
