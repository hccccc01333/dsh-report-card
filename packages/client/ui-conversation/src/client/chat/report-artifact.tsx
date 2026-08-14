/**
 * ChatGPT-style report artifacts: a small title card in the conversation opens
 * a right-side application panel showing the full HTML report.
 * @module
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { ReportBlock } from '@deepseek-ai/dsh-client-ui-primitives'
import css from './report-artifact.module.css'

/** One open report artifact. */
export interface ReportArtifact {
  title: string | undefined
  html: string
}

/** Localized labels for the report card and panel. */
export interface ReportArtifactLabels {
  cardHint: string
  closePanel: string
  expand: string
  collapse: string
  open: string
  copy: string
  copied: string
  download: string
}

/** Artifact store value. */
interface ReportArtifactContextValue {
  artifact: ReportArtifact | null
  open: (artifact: ReportArtifact) => void
  close: () => void
}

const ReportArtifactContext = createContext<ReportArtifactContextValue | null>(null)

/** Read the artifact store; must be called inside {@link ReportArtifactProvider}. */
export function useReportArtifact(): ReportArtifactContextValue {
  const value = useContext(ReportArtifactContext)
  if (value === null) throw new Error('useReportArtifact must be used inside ReportArtifactProvider')
  return value
}

/** Provide the artifact store for one conversation view. */
export function ReportArtifactProvider({ children }: { children: ReactNode }) {
  const [artifact, setArtifact] = useState<ReportArtifact | null>(null)
  const open = useCallback((next: ReportArtifact) => setArtifact(next), [])
  const close = useCallback(() => setArtifact(null), [])
  const value = useMemo(() => ({ artifact, open, close }), [artifact, open, close])
  return <ReportArtifactContext.Provider value={value}>{children}</ReportArtifactContext.Provider>
}

/**
 * The small title card in the conversation. Clicking it opens the right-side
 * panel with the full report.
 * @param props - report title, html, and the localized hint label.
 * @returns the card button.
 */
export function ReportCardBox({ title, html, hint }: { title: string | undefined; html: string; hint: string }) {
  const { open } = useReportArtifact()
  return (
    <button type="button" className={css.card} data-report-card onClick={() => open({ title, html })}>
      <span className={css.cardTitle}>{title ?? 'HTML Report'}</span>
      <span className={css.cardHint}>{hint}</span>
    </button>
  )
}

/**
 * The right-side application panel showing the full report. Renders nothing
 * until a card opens an artifact.
 * @param props - localized labels.
 * @returns the panel, or null when no artifact is open.
 */
export function ReportArtifactPanel({ labels }: { labels: ReportArtifactLabels }) {
  const { artifact, close } = useReportArtifact()
  if (artifact === null) return null
  return (
    <div className={css.overlay} data-report-panel role="dialog" aria-label={artifact.title ?? 'Report'}>
      <div className={css.panel}>
        <div className={css.panelHeader}>
          <span className={css.panelTitle}>{artifact.title ?? 'HTML Report'}</span>
          <button type="button" className={css.closeButton} onClick={close}>
            {labels.closePanel}
          </button>
        </div>
        <div className={css.panelBody}>
          <ReportBlock
            title={artifact.title}
            html={artifact.html}
            defaultExpanded
            maxHeight={8192}
            expandLabel={labels.expand}
            collapseLabel={labels.collapse}
            openLabel={labels.open}
            copyLabel={labels.copy}
            copiedLabel={labels.copied}
            downloadLabel={labels.download}
          />
        </div>
      </div>
    </div>
  )
}
