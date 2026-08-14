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
  refresh: string
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
  sync: (artifact: ReportArtifact) => void
  close: () => void
}

const ReportArtifactContext = createContext<ReportArtifactContextValue | null>(null)

/** No-op store for render sites without a provider. */
const DEFAULT_ARTIFACT: ReportArtifactContextValue = {
  artifact: null,
  open: () => {},
  sync: () => {},
  close: () => {},
}

/** Read the artifact store; falls back to a no-op outside the provider. */
export function useReportArtifact(): ReportArtifactContextValue {
  return useContext(ReportArtifactContext) ?? DEFAULT_ARTIFACT
}

/** Provide the artifact store for one conversation view. */
export function ReportArtifactProvider({ children }: { children: ReactNode }) {
  const [artifact, setArtifact] = useState<ReportArtifact | null>(null)
  const open = useCallback((next: ReportArtifact) => setArtifact(next), [])
  // Refresh an already-open panel with a newer report; never auto-opens.
  const sync = useCallback((next: ReportArtifact) => {
    setArtifact(previous => previous === null ? previous : next)
  }, [])
  const close = useCallback(() => setArtifact(null), [])
  const value = useMemo(() => ({ artifact, open, sync, close }), [artifact, open, sync, close])
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
  const [reload, setReload] = useState(0)
  if (artifact === null) return null
  return (
    <aside className={css.panel} data-report-panel aria-label={artifact.title ?? 'Report'}>
      <div className={css.panelHeader}>
        <span className={css.panelTitle}>{artifact.title ?? 'HTML Report'}</span>
        <div className={css.panelActions}>
          <button type="button" className={css.closeButton} onClick={() => setReload(value => value + 1)}>
            {labels.refresh}
          </button>
          <button type="button" className={css.closeButton} onClick={close}>
            {labels.closePanel}
          </button>
        </div>
      </div>
      <div className={css.panelBody}>
        <ReportBlock
          key={reload}
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
    </aside>
  )
}
