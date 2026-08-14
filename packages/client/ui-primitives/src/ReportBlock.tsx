// ReportBlock: the inline surface for the `card: 'report'` render intent. A
// completed report carries a self-contained HTML document that the client
// renders in a sandboxed frame (no same-origin, scripts allowed), so report
// scripts can run their sorting/tooltips/theme toggles but cannot touch the
// host page, its storage, or its session. The report's own light/dark theme is
// self-contained, so the frame keeps a neutral white background.

import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import css from './ReportBlock.module.css'

/** Props for the inline report surface. */
export interface ReportBlockProps {
  /** Replacement title from the result view, shown above the frame when set. */
  title?: string | undefined
  /** Self-contained HTML document rendered in a sandboxed frame. */
  html: string
  /** Extra class merged onto the wrapper. */
  className?: string | undefined
  /** Open-in-new-tab button label; defaults to `Open in new tab`. */
  openLabel?: string | undefined
}

/** Default frame height before a report reports its own height. */
export const REPORT_DEFAULT_HEIGHT = 480

/** Upper bound for report-reported heights, so a buggy report cannot stretch the row. */
export const REPORT_MAX_HEIGHT = 1200

/** PostMessage contract a report script may use to size its frame. */
export const REPORT_HEIGHT_MESSAGE = 'dsh-report-height'

/**
 * Resolve the next frame height from one postMessage payload.
 * @param data - the raw message payload from the report frame.
 * @param current - the current frame height.
 * @returns the new height, clamped to {@link REPORT_MAX_HEIGHT}, or the current
 * height when the payload is not a valid height message.
 */
export function applyReportHeightMessage(data: unknown, current: number): number {
  if (data === null || typeof data !== 'object') return current
  const message = data as { type?: unknown; height?: unknown }
  if (message.type !== REPORT_HEIGHT_MESSAGE || typeof message.height !== 'number') return current
  return Math.max(120, Math.min(message.height, REPORT_MAX_HEIGHT))
}

/**
 * Render a completed `card: 'report'` result inside a sandboxed iframe.
 * The frame starts at {@link REPORT_DEFAULT_HEIGHT}; a report script can send
 * `{ type: 'dsh-report-height', height }` via `parent.postMessage` and the
 * frame resizes to fit (clamped to {@link REPORT_MAX_HEIGHT}).
 * @param props - title, self-contained HTML, and optional open button label.
 * @returns the report surface.
 */
export function ReportBlock({ title, html, className, openLabel = 'Open in new tab' }: ReportBlockProps) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(REPORT_DEFAULT_HEIGHT)
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // Only the report inside THIS frame may size it.
      if (event.source !== frameRef.current?.contentWindow) return
      const data = event.data as { type?: unknown; height?: unknown } | null
      setHeight(previous => applyReportHeightMessage(data, previous))
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])
  const openInNewTab = () => {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    window.open(url, '_blank', 'noopener')
    // Keep the blob alive long enough for the tab to load, then release it.
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }
  return (
    <div className={clsx(css.root, className)}>
      <div className={css.header}>
        {title !== undefined && title !== '' && <div className={css.title}>{title}</div>}
        <button type="button" className={css.openButton} onClick={openInNewTab}>
          {openLabel}
        </button>
      </div>
      <iframe
        ref={frameRef}
        className={css.frame}
        style={{ height }}
        title={title ?? 'report'}
        sandbox="allow-scripts"
        srcDoc={html}
      />
    </div>
  )
}
