/**
 * Report panel plugin, browser half: registers the turn-tail report card and
 * the right-hand report panel (tabs/search/scroll memory/ask-in-chat) for the
 * `card: 'report'` render intent. Composing this plugin out removes both
 * surfaces; the conversation stays a plain chat.
 * @module dsh-client-ui-report-panel/client
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the ui-conversation SlotMap merge (turnTail + composer.dock).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { ReportPanel } from './report-panel.tsx'
import { TurnReportCard } from './turn-report-card.tsx'
import { en, NS, zh, type ReportPanelKey } from './locales.ts'
import { reportRefsDefinition, selectReports } from './turn-reports.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Report card and panel copy. */
    'reportPanel': ReportPanelKey
  }
}

export { reportArtifactStore, type ReportArtifact } from './report-artifact.tsx'
export { reportViewFromNode, type ReportCardViewPayload } from './report-card.ts'
export { selectReports, reportRefsDefinition, type TurnReportsData } from './turn-reports.ts'

/** Required services: the slot registry, the locale dictionaries, and the conversation event engine. */
export const inject = ['slots', 'locale', 'conversationEvents']

/**
 * Client plugin body: register the dictionaries, the report-refs node
 * definition, the turn-tail card entry, and the composer-dock panel entry.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.conversationEvents.register(reportRefsDefinition)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-report-panel: dictionaries')
  ctx.slots.inject(
    'conversation.chat.turnTail',
    () => ctx.slots.register({
      name: 'conversation.chat.turnTail',
      select: selectReports,
      locale: NS,
    }, TurnReportCard),
  )
  ctx.slots.inject(
    'conversation.composer.dock',
    () => ctx.slots.register({
      name: 'conversation.composer.dock',
      id: 'report-panel',
      order: 100,
      locale: NS,
    }, ReportPanel),
  )
}
