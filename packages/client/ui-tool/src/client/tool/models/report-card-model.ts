/**
 * Pure derivation of the report-card props from a frozen call slice: the
 * `card:'report'` render intent a report tool declares arrives on the snapshot
 * as `resultView`, and this is the one place that turns it into what
 * {@link ReportBlock} draws.
 *
 * The report card is result-time only: a report call has no HTML before
 * `execute`, so its pending state stays a `GenericCallView`. This derivation
 * therefore reads only `resultView` and returns null for a still-running call.
 * @module
 */

import type { ToolCallBlock } from './tool-call-model.ts'

/**
 * The {@link ReportBlock} props this derivation owns. Held as a nested object
 * (`card`) so a render site spreads exactly the primitive's own surface.
 */
export interface ReportCardModel {
  /** The result view's replacement title, when the presenter supplied one. */
  title: string | undefined
  /** The props {@link ReportBlock} draws. */
  card: { html: string; title?: string }
}

/**
 * Derive the report-card props for a tool call, or null when this call is not
 * a report card and belongs on the generic path. `card` and `html` ride the
 * untrusted wire frame, so a version mismatch or loose producer with a
 * non-string or empty `html` selects the generic path rather than rendering an
 * empty frame.
 * @param block - RunningToolCall or ToolResultNode off the snapshot caches.
 * @returns the report-card props, or null for the generic path.
 */
export function reportCardModel(block: ToolCallBlock): ReportCardModel | null {
  // Running: no result view exists yet, and a report card is result-only.
  if (!('kind' in block)) return null
  const result = block.resultView?.card === 'report' ? block.resultView : null
  if (result === null) return null
  // `html` rides the untrusted wire frame; a missing or empty document would
  // render a blank frame, so select the generic path instead.
  if (typeof result.html !== 'string' || result.html === '') return null
  return {
    title: result.title,
    card: result.title === undefined ? { html: result.html } : { html: result.html, title: result.title },
  }
}
