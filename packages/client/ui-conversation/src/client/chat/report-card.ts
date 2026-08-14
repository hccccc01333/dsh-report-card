/**
 * Report-card extraction for the core conversation renderer: reads a validated
 * `card: 'report'` result view off a tool-call Chat node. Rendering happens at
 * the turn tail (below the assistant reply), fully outside the tool-call tree.
 * @module
 */

import type { ChatNode } from '../contract/chat-nodes.ts'

/** One validated report-card payload carried by a tool-call node result view. */
export interface ReportCardViewPayload {
  title: string | undefined
  html: string
}

/**
 * Extract a validated `card: 'report'` result view from a Chat node.
 * @param node - a Chat node from the conversation snapshot.
 * @returns the report card payload, or null for non-report or malformed views.
 */
export function reportViewFromNode(node: ChatNode | undefined): ReportCardViewPayload | null {
  if (node === undefined || node.kind !== 'tool-call') return null
  const root = (node as unknown as { data?: { root?: { resultView?: unknown } } }).data?.root
  const view = root?.resultView as { card?: unknown; title?: unknown; html?: unknown } | null | undefined
  if (view === null || typeof view !== 'object' || view.card !== 'report') return null
  // `html` rides the untrusted wire frame; an empty document would render a
  // blank preview, so select the generic path instead.
  if (typeof view.html !== 'string' || view.html === '') return null
  return {
    title: typeof view.title === 'string' ? view.title : undefined,
    html: view.html,
  }
}
