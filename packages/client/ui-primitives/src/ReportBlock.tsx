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
  /** Copy-HTML button label; defaults to `Copy HTML`. */
  copyLabel?: string | undefined
  /** Copied feedback label; defaults to `Copied`. */
  copiedLabel?: string | undefined
  /** Download-HTML button label; defaults to `Download HTML`. */
  downloadLabel?: string | undefined
  /** Initial frame height; defaults to {@link REPORT_DEFAULT_HEIGHT}. */
  initialHeight?: number | undefined
  /** Upper bound for report-reported heights; defaults to {@link REPORT_MAX_HEIGHT}. */
  maxHeight?: number | undefined
  /** Start with the full report open instead of the compact card preview. */
  defaultExpanded?: boolean | undefined
  /** Expand button label; defaults to `Expand`. */
  expandLabel?: string | undefined
  /** Collapse button label; defaults to `Collapse`. */
  collapseLabel?: string | undefined
}

/** Default frame height before a report reports its own height. */
export const REPORT_DEFAULT_HEIGHT = 480

/** Upper bound for report-reported heights, so a buggy report cannot stretch the row. */
export const REPORT_MAX_HEIGHT = 1200

/** Compact preview height for the collapsed card view. */
export const REPORT_PREVIEW_HEIGHT = 180

/** Initial height for the details-panel reading surface. */
export const REPORT_DETAILS_INITIAL_HEIGHT = 720

/** Upper bound for report-reported heights in the details panel. */
export const REPORT_DETAILS_MAX_HEIGHT = 4096

/** PostMessage contract a report script may use to size its frame. */
export const REPORT_HEIGHT_MESSAGE = 'dsh-report-height'

/**
 * Resolve the next frame height from one postMessage payload.
 * @param data - the raw message payload from the report frame.
 * @param current - the current frame height.
 * @param maxHeight - the upper clamp; defaults to {@link REPORT_MAX_HEIGHT}.
 * @returns the new height, clamped to `maxHeight`, or the current height when
 * the payload is not a valid height message.
 */
export function applyReportHeightMessage(data: unknown, current: number, maxHeight: number = REPORT_MAX_HEIGHT): number {
  if (data === null || typeof data !== 'object') return current
  const message = data as { type?: unknown; height?: unknown }
  if (message.type !== REPORT_HEIGHT_MESSAGE || typeof message.height !== 'number') return current
  return Math.max(120, Math.min(message.height, maxHeight))
}

/** Derive a file name from a report title, falling back to `report.html`. */
export function reportFileName(title: string | undefined): string {
  const base = (title ?? 'report')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${base === '' ? 'report' : base}.html`
}

/**
 * Render a completed `card: 'report'` result inside a sandboxed iframe.
 * The frame starts at {@link REPORT_DEFAULT_HEIGHT}; a report script can send
 * `{ type: 'dsh-report-height', height }` via `parent.postMessage` and the
 * frame resizes to fit (clamped to {@link REPORT_MAX_HEIGHT}).
 * @param props - title, self-contained HTML, and optional open button label.
 * @returns the report surface.
 */
export function ReportBlock({
  title,
  html,
  className,
  openLabel = 'Open in new tab',
  copyLabel = 'Copy HTML',
  copiedLabel = 'Copied',
  downloadLabel = 'Download HTML',
  initialHeight = REPORT_DEFAULT_HEIGHT,
  maxHeight = REPORT_MAX_HEIGHT,
  defaultExpanded = false,
  expandLabel = 'Expand',
  collapseLabel = 'Collapse',
}: ReportBlockProps) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(initialHeight)
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(defaultExpanded === true)
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // Only the report inside THIS frame may size it.
      if (event.source !== frameRef.current?.contentWindow) return
      const data = event.data as { type?: unknown; height?: unknown } | null
      setHeight(previous => applyReportHeightMessage(data, previous, maxHeight))
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [maxHeight])
  const openInNewTab = () => {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    window.open(url, '_blank', 'noopener')
    // Keep the blob alive long enough for the tab to load, then release it.
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }
  const copyHtml = async () => {
    try {
      if (navigator.clipboard?.writeText !== undefined) {
        await navigator.clipboard.writeText(html)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = html
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        textarea.remove()
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable: leave the button without feedback.
    }
  }
  const downloadHtml = () => {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    const link = document.createElement('a')
    link.href = url
    link.download = reportFileName(title)
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }
  const frameHeight = open ? Math.max(height, initialHeight) : REPORT_PREVIEW_HEIGHT
  return (
    <div className={clsx(css.root, className)} data-report-open={open}>
      <div className={css.header}>
        {title !== undefined && title !== '' && <div className={css.title}>{title}</div>}
        <div className={css.actions}>
          <button
            type="button"
            className={css.actionButton}
            aria-expanded={open}
            onClick={() => setOpen(value => !value)}
          >
            {open ? collapseLabel : expandLabel}
          </button>
          <button type="button" className={css.actionButton} onClick={openInNewTab}>
            {openLabel}
          </button>
          <button type="button" className={css.actionButton} onClick={copyHtml}>
            {copied ? copiedLabel : copyLabel}
          </button>
          <button type="button" className={css.actionButton} onClick={downloadHtml}>
            {downloadLabel}
          </button>
        </div>
      </div>
      <div className={css.frameWrap} style={{ height: frameHeight }}>
        <iframe
          ref={frameRef}
          className={css.frame}
          title={title ?? 'report'}
          sandbox="allow-scripts"
          srcDoc={html}
        />
        {!open && (
          <button
            type="button"
            className={css.previewOverlay}
            aria-label={expandLabel}
            onClick={() => setOpen(true)}
          >
            {expandLabel}
          </button>
        )}
      </div>
    </div>
  )
}
