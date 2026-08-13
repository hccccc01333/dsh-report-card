// ReportBlock: the inline surface for the `card: 'report'` render intent. A
// completed report carries a self-contained HTML document that the client
// renders in a sandboxed frame (no same-origin, scripts allowed), so report
// scripts can run their sorting/tooltips/theme toggles but cannot touch the
// host page, its storage, or its session. The report's own light/dark theme is
// self-contained, so the frame keeps a neutral white background.

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
}

/**
 * Render a completed `card: 'report'` result inside a sandboxed iframe.
 * @param props - title and self-contained HTML.
 * @returns the report surface.
 */
export function ReportBlock({ title, html, className }: ReportBlockProps) {
  return (
    <div className={clsx(css.root, className)}>
      {title !== undefined && title !== '' && (
        <div className={css.title}>{title}</div>
      )}
      <iframe
        className={css.frame}
        title={title ?? 'report'}
        sandbox="allow-scripts"
        srcDoc={html}
      />
    </div>
  )
}
