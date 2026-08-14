/**
 * Report-card extraction for the `card: 'report'` render intent: reads a
 * validated result view off a tool-call Chat node. The panel plugin renders
 * the card at the turn tail, fully outside the tool-call tree.
 * @module @deepseek-ai/dsh-client-ui-report-panel/client/report-card
 */

import type { ChatNode } from '@deepseek-ai/dsh-client-ui-conversation/client'

/** One validated report-card payload carried by a tool-call node result view. */
export interface ReportCardViewPayload {
  title: string | undefined
  html: string
  /** Validated multi-document delivery (batch zips); optional. */
  documents?: ReportCardDocumentView[] | undefined
}

/** One validated document of a multi-document report-card delivery. */
export interface ReportCardDocumentView {
  name: string
  title: string
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
  const view = root?.resultView as {
    card?: unknown
    title?: unknown
    html?: unknown
    documents?: unknown
  } | null | undefined
  if (view === null || typeof view !== 'object' || view.card !== 'report') return null
  // `html` rides the untrusted wire frame; an empty document would render a
  // blank preview, so select the generic path instead.
  if (typeof view.html !== 'string' || view.html === '') return null
  const documents = Array.isArray(view.documents)
    ? view.documents
      .filter(document => document !== null && typeof document === 'object')
      .map((document) => {
        const entry = document as { name?: unknown; title?: unknown; html?: unknown }
        return typeof entry.name === 'string' && entry.name !== ''
            && typeof entry.html === 'string' && entry.html !== ''
          ? { name: entry.name, title: typeof entry.title === 'string' ? entry.title : entry.name, html: entry.html }
          : null
      })
      .filter((document): document is ReportCardDocumentView => document !== null)
    : undefined
  return {
    title: typeof view.title === 'string' ? view.title : undefined,
    html: view.html,
    documents: documents !== undefined && documents.length > 0 ? documents : undefined,
  }
}
