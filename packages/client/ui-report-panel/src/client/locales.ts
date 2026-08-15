/**
 * Report panel dictionary: card, panel, search, and ask-in-chat copy.
 * @module dsh-client-ui-report-panel/client/locales
 */

export const NS = 'reportPanel'

/** Simplified Chinese copy. */
export const zh = {
  'reportPanel.cardHint': '点击在右侧查看完整报告',
  'reportPanel.closePanel': '关闭',
  'reportPanel.refresh': '刷新',
  'reportPanel.expand': '展开',
  'reportPanel.collapse': '收起',
  'reportPanel.open': '新标签打开',
  'reportPanel.copy': '复制 HTML',
  'reportPanel.copied': '已复制',
  'reportPanel.download': '下载 HTML',
  'reportPanel.searchPlaceholder': '在报告中搜索…',
  'reportPanel.searchPrev': '上一个',
  'reportPanel.searchNext': '下一个',
  'reportPanel.searchClear': '清除',
  'reportPanel.minimizePanel': '最小化',
  'reportPanel.expandPanel': '展开面板',
  'reportPanel.closeAll': '全部关闭',
  'reportPanel.askPlaceholder': '就这份报告提问…',
  'reportPanel.askInChat': '在对话中提问',
}

/** Union of this namespace's dictionary keys. */
export type ReportPanelKey = keyof typeof zh

/** English copy. */
export const en: Record<ReportPanelKey, string> = {
  'reportPanel.cardHint': 'Click to view the full report on the right',
  'reportPanel.closePanel': 'Close',
  'reportPanel.refresh': 'Refresh',
  'reportPanel.expand': 'Expand',
  'reportPanel.collapse': 'Collapse',
  'reportPanel.open': 'Open in new tab',
  'reportPanel.copy': 'Copy HTML',
  'reportPanel.copied': 'Copied',
  'reportPanel.download': 'Download HTML',
  'reportPanel.searchPlaceholder': 'Search in report…',
  'reportPanel.searchPrev': 'Previous',
  'reportPanel.searchNext': 'Next',
  'reportPanel.searchClear': 'Clear',
  'reportPanel.minimizePanel': 'Minimize',
  'reportPanel.expandPanel': 'Expand panel',
  'reportPanel.closeAll': 'Close all',
  'reportPanel.askPlaceholder': 'Ask about this report…',
  'reportPanel.askInChat': 'Ask in chat',
}
