/**
 * ChatGPT-style report artifacts: small title cards in the conversation open a
 * right-hand report panel with multi-report tabs and a draggable width.
 * @module
 */

import { useRef, useState, useSyncExternalStore } from 'react'
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

/** Panel width bounds for the drag handle. */
export const REPORT_PANEL_MIN_WIDTH = 320
export const REPORT_PANEL_MAX_WIDTH = 800
export const REPORT_PANEL_DEFAULT_WIDTH = 520

/** Artifact store state. */
interface ReportArtifactState {
  artifacts: ReportArtifact[]
  active: number
  width: number
}

const EMPTY_STATE: ReportArtifactState = {
  artifacts: [],
  active: -1,
  width: REPORT_PANEL_DEFAULT_WIDTH,
}

let state: ReportArtifactState = EMPTY_STATE
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

function setState(next: ReportArtifactState): void {
  state = next
  emit()
}

function clampWidth(width: number): number {
  return Math.max(REPORT_PANEL_MIN_WIDTH, Math.min(width, REPORT_PANEL_MAX_WIDTH))
}

/** Module-level artifact store shared by the conversation and the panel. */
export const reportArtifactStore = {
  get: (): ReportArtifactState => state,
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  open(artifact: ReportArtifact): void {
    const index = state.artifacts.findIndex(existing => existing.title === artifact.title)
    if (index >= 0) {
      setState({
        ...state,
        artifacts: state.artifacts.map((existing, i) => i === index ? artifact : existing),
        active: index,
      })
    } else {
      setState({ ...state, artifacts: [...state.artifacts, artifact], active: state.artifacts.length })
    }
  },
  sync(artifact: ReportArtifact): void {
    if (state.active < 0) return
    setState({
      ...state,
      artifacts: state.artifacts.map((existing, i) => i === state.active ? artifact : existing),
    })
  },
  close(): void {
    if (state.active < 0) return
    const artifacts = state.artifacts.filter((_artifact, i) => i !== state.active)
    setState({
      ...state,
      artifacts,
      active: artifacts.length === 0 ? -1 : Math.min(state.active, artifacts.length - 1),
    })
  },
  select(index: number): void {
    if (index >= 0 && index < state.artifacts.length) setState({ ...state, active: index })
  },
  setWidth(width: number): void {
    setState({ ...state, width: clampWidth(width) })
  },
  reset(): void {
    setState(EMPTY_STATE)
  },
}

/** Read the artifact store. */
export function useReportArtifact(): ReportArtifactState & {
  open: (artifact: ReportArtifact) => void
  sync: (artifact: ReportArtifact) => void
  close: () => void
  select: (index: number) => void
  setWidth: (width: number) => void
} {
  const snapshot = useSyncExternalStore(reportArtifactStore.subscribe, reportArtifactStore.get)
  return {
    ...snapshot,
    open: reportArtifactStore.open,
    sync: reportArtifactStore.sync,
    close: reportArtifactStore.close,
    select: reportArtifactStore.select,
    setWidth: reportArtifactStore.setWidth,
  }
}

/**
 * The small title card in the conversation. Clicking it opens the right-hand
 * panel (or switches to that report's tab).
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

/** Width drag handle on the panel's left edge. */
function PanelDragHandle() {
  const { setWidth } = useReportArtifact()
  const drag = useRef<{ startX: number; startWidth: number } | null>(null)
  return (
    <div
      className={css.dragHandle}
      data-report-drag
      onPointerDown={(event) => {
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        drag.current = { startX: event.clientX, startWidth: state.width }
      }}
      onPointerMove={(event) => {
        if (drag.current === null) return
        setWidth(drag.current.startWidth + (drag.current.startX - event.clientX))
      }}
      onPointerUp={() => {
        drag.current = null
      }}
    />
  )
}

/**
 * The right-hand report panel with tabs and a draggable width. Renders nothing
 * until a card opens an artifact.
 * @param props - localized labels.
 * @returns the panel, or null when no artifact is open.
 */
export function ReportArtifactPanel({ labels }: { labels: ReportArtifactLabels }) {
  const { artifacts, active, width, select, close } = useReportArtifact()
  const [reload, setReload] = useState(0)
  if (artifacts.length === 0 || active < 0) return null
  const artifact = artifacts[active]
  if (artifact === undefined) return null
  return (
    <aside className={css.panel} data-report-panel style={{ width }} aria-label={artifact.title ?? 'Report'}>
      <PanelDragHandle />
      <div className={css.tabs} data-report-tabs>
        {artifacts.map((item, index) => (
          <button
            key={item.title ?? index}
            type="button"
            className={index === active ? `${css.tab} ${css.tabActive}` : css.tab}
            data-report-tab=""
            data-report-tab-active={index === active ? '' : undefined}
            onClick={() => select(index)}
          >
            {item.title ?? `Report ${index + 1}`}
          </button>
        ))}
      </div>
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
          key={`${reload}-${artifact.title ?? ''}`}
          fillHeight
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
          className={css.reportFill}
        />
      </div>
    </aside>
  )
}
