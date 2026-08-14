/**
 * Slot entry types for the report panel plugin: the turn-tail card entry and
 * the composer-dock panel entry. Both slots are declared and typed by
 * ui-conversation; this package only contributes entries.
 * @module @deepseek-ai/dsh-client-ui-report-panel/client/slots
 */

import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from './locales.ts'

/** Full props of the turn-tail report-card entry. */
export type TurnReportCardProps =
  PropsRuntime<'conversation.chat.turnTail'>
  & PropsLocale<'reportPanel'>

/** Full props of the composer-dock report-panel entry. */
export type ReportPanelProps =
  PropsRuntime<'conversation.composer.dock'>
  & PropsLocale<'reportPanel'>
