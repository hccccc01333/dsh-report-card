/**
 * Turn-scoped report references: the turn-tail chain selector needs a pure
 * owner read, so a state-only node definition records which tool results in a
 * turn presented `card: 'report'` views (seq + title only; the HTML itself is
 * read from the conversation snapshot by the mounted card, never duplicated
 * into location data).
 * @module @deepseek-ai/dsh-client-ui-report-panel/client/turn-reports
 */

import type {
  ConversationNodeDefinition,
} from '@deepseek-ai/dsh-client-runtime/client'
import { isAppendSurfaceEvent } from '@deepseek-ai/dsh-client-runtime/client'
import type { TurnTailOwnerProps } from '@deepseek-ai/dsh-client-ui-conversation/client'

/** One report result reference within a turn. */
export interface TurnReportRef {
  readonly seq: number
  readonly title: string | undefined
}

/** Turn-scoped report references published for the turn-tail selector. */
export interface TurnReportsData {
  readonly reports: readonly TurnReportRef[]
}

declare module '@deepseek-ai/dsh-client-runtime/client' {
  interface ConversationTurnDataMap {
    /** `card: 'report'` results settled in this Turn, in log order. */
    'report-refs': TurnReportsData
  }
}

interface ReportRefsState extends TurnReportsData {
  readonly turn: number
}

/**
 * The state-only node definition accumulating report references per turn.
 * Accepts every append-surface tool result whose result view is a report.
 */
export const reportRefsDefinition: ConversationNodeDefinition<ReportRefsState> = {
  kind: 'report-refs',
  match: (event) => {
    if (event.type === 'turn/start') return { id: String(event.data.turn), role: 'start' }
    if (event.type === 'tool/result' && isAppendSurfaceEvent(event)) {
      return { id: String(event.data.turn), role: 'update' }
    }
    return null
  },
  start: (_context, match) => {
    if (match.event.type !== 'turn/start') throw new Error('report-refs start requires turn/start')
    return { turn: match.event.data.turn, reports: [] }
  },
  update: (context, match) => {
    if (match.event.type !== 'tool/result') return context.state
    const view = match.view?.for === 'result' ? match.view.view : null
    if (view === null || typeof view !== 'object' || (view as { card?: unknown }).card !== 'report') {
      return context.state
    }
    const result = view as { title?: unknown; html?: unknown }
    if (typeof result.html !== 'string' || result.html === '') return context.state
    return {
      ...context.state,
      reports: [...context.state.reports, {
        seq: match.event.seq,
        title: typeof result.title === 'string' ? result.title : undefined,
      }],
    }
  },
  buildLocationData: (context, scope) => scope !== 'turn' || context.state === undefined
    ? null
    : {
      kind: 'turn',
      turn: context.state.turn,
      key: 'report-refs',
      value: { reports: context.state.reports },
    },
}

/**
 * Claim the turn-tail chain when the closing turn settled at least one report
 * at or before the closing assistant seq.
 * @param owner - Turn-tail owner currency for the closing assistant.
 * @returns The turn's report references, or null to decline before mount.
 */
export function selectReports(owner: TurnTailOwnerProps): TurnReportsData | null {
  const data = owner.turn.data.get('report-refs')
  const reports = data === undefined
    ? []
    : data.reports.filter(report => report.seq <= owner.seq)
  return reports.length === 0 ? null : { reports }
}
