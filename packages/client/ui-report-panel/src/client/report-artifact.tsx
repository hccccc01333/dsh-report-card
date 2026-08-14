/**
 * ChatGPT-style report artifacts: small title cards in the conversation open a
 * right-hand report panel with multi-report tabs, search, scroll memory, and a
 * draggable width.
 * @module @deepseek-ai/dsh-client-ui-report-panel/client/report-artifact
 */

import { useMemo, useRef, useState, useSyncExternalStore } from 'react'
import {
  ReportBlock,
  type ReportSearchRequest,
  type ReportSearchResult,
} from '@deepseek-ai/dsh-client-ui-primitives'
import css from './report-artifact.module.css'

/** One document of a multi-document report delivery (e.g. a batch zip). */
export interface ReportDocument {
  name: string
  title: string
  html: string
}

/** One open report artifact. */
export interface ReportArtifact {
  title: string | undefined
  html: string
  /** Multi-document delivery; expands into one tab per document when set. */
  documents?: ReportDocument[] | undefined
  /** Document file name inside a multi-document delivery (tab identity). */
  docName?: string | undefined
  /** Last known document scroll offset, restored on tab switch. */
  scrollTop?: number | undefined
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
  searchPlaceholder: string
  searchPrev: string
  searchNext: string
  searchClear: string
  minimizePanel: string
  expandPanel: string
  closeAll: string
  askPlaceholder: string
  askInChat: string
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
  minimized: boolean
}

const EMPTY_STATE: ReportArtifactState = {
  artifacts: [],
  active: -1,
  width: REPORT_PANEL_DEFAULT_WIDTH,
  minimized: false,
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
    if (artifact.documents !== undefined && artifact.documents.length > 0) {
      // A multi-document delivery owns the panel: expand one tab per document,
      // with index.html as the initial tab (matching the zip entry order).
      const entries: ReportArtifact[] = artifact.documents.map(document => ({
        title: document.title,
        html: document.html,
        docName: document.name,
        scrollTop: 0,
      }))
      const indexEntry = entries.findIndex(entry => entry.docName === 'index.html')
      setState({
        ...state,
        artifacts: entries,
        active: indexEntry >= 0 ? indexEntry : 0,
        minimized: false,
      })
      return
    }
    // Clicking a card always adds (or activates) a tab: same-title reports
    // from different turns stay distinct. Automatic replacement of the active
    // panel content belongs to `sync` (the turn-tail effect), not `open`.
    const existing = state.artifacts.findIndex(candidate =>
      candidate.title === artifact.title && candidate.docName === artifact.docName)
    setState(existing >= 0
      ? { ...state, active: existing, minimized: false }
      : {
        ...state,
        artifacts: [...state.artifacts, { ...artifact, scrollTop: 0 }],
        active: state.artifacts.length,
        minimized: false,
      })
  },
  sync(artifact: ReportArtifact): void {
    if (state.active < 0) return
    // Only refresh the panel when the newer report is the same title as the
    // one being viewed (an edit-prompt rerun). A differently-titled report is
    // left for the user to open as its own tab, so turn-tail auto-sync never
    // hijacks the tab set.
    const activeArtifact = state.artifacts[state.active]
    if (activeArtifact === undefined || activeArtifact.title !== artifact.title) return
    setState({
      ...state,
      artifacts: state.artifacts.map((existing, i) => i === state.active
        ? { ...existing, title: artifact.title, html: artifact.html, documents: artifact.documents }
        : existing),
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
  closeAll(): void {
    if (state.artifacts.length === 0) return
    setState({ ...state, artifacts: [], active: -1, minimized: false })
  },
  select(index: number): void {
    if (index >= 0 && index < state.artifacts.length) setState({ ...state, active: index })
  },
  selectDocument(name: string): void {
    const index = state.artifacts.findIndex(existing => existing.docName === name)
    if (index >= 0) setState({ ...state, active: index })
  },
  recordScrollTop(top: number): void {
    if (state.active < 0) return
    setState({
      ...state,
      artifacts: state.artifacts.map((existing, index) => index === state.active
        ? { ...existing, scrollTop: top }
        : existing),
    })
  },
  minimize(): void {
    if (state.artifacts.length > 0) setState({ ...state, minimized: true })
  },
  restore(): void {
    setState({ ...state, minimized: false })
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
  closeAll: () => void
  select: (index: number) => void
  selectDocument: (name: string) => void
  recordScrollTop: (top: number) => void
  minimize: () => void
  restore: () => void
  setWidth: (width: number) => void
} {
  const snapshot = useSyncExternalStore(reportArtifactStore.subscribe, reportArtifactStore.get)
  // Keep the method handles referentially stable for a given snapshot: a
  // freshly-spread object on every render makes effect deps change each time
  // and can loop a `sync` effect into an infinite render cycle.
  return useMemo(() => ({
    ...snapshot,
    open: reportArtifactStore.open,
    sync: reportArtifactStore.sync,
    close: reportArtifactStore.close,
    closeAll: reportArtifactStore.closeAll,
    select: reportArtifactStore.select,
    selectDocument: reportArtifactStore.selectDocument,
    recordScrollTop: reportArtifactStore.recordScrollTop,
    minimize: reportArtifactStore.minimize,
    restore: reportArtifactStore.restore,
    setWidth: reportArtifactStore.setWidth,
  }), [snapshot])
}

/**
 * The small title card in the conversation. Clicking it opens the right-hand
 * panel (or switches to that report's tab).
 * @param props - report title, html, multi-document payload, and the hint label.
 * @returns the card button.
 */
export function ReportCardBox({
  title, html, documents, hint,
}: {
  title: string | undefined
  html: string
  documents?: ReportDocument[] | undefined
  hint: string
}) {
  const { open } = useReportArtifact()
  return (
    <button type="button" className={css.card} data-report-card onClick={() => open({ title, html, documents })}>
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
 * The right-hand report panel with tabs, search, scroll memory, and a
 * draggable width. Renders nothing until a card opens an artifact.
 * @param props - localized labels and the ask-in-chat bridge.
 * @returns the panel, or null when no artifact is open.
 */
export function ReportArtifactPanel({
  labels,
  onAsk,
}: {
  labels: ReportArtifactLabels
  /** Compose a question about the active report into the main composer. */
  onAsk?: (question: string, artifact: ReportArtifact) => void
}) {
  const {
    artifacts, active, width, minimized, select, selectDocument, close, closeAll, recordScrollTop, minimize, restore,
  } = useReportArtifact()
  const [reload, setReload] = useState(0)
  const [search, setSearch] = useState<ReportSearchRequest & { nonce: number }>(
    { query: '', action: 'clear', nonce: 0 },
  )
  const [searchResult, setSearchResult] = useState<ReportSearchResult | null>(null)
  if (minimized) {
    return (
      <aside className={css.minBar} data-report-min-bar>
        <button type="button" className={css.minExpand} onClick={restore} title={labels.expandPanel}>
          {labels.expandPanel}（{artifacts.length}）
        </button>
        <button type="button" className={css.closeButton} onClick={closeAll} title={labels.closeAll}>
          {labels.closeAll}
        </button>
      </aside>
    )
  }
  if (artifacts.length === 0 || active < 0) return null
  const artifact = artifacts[active]
  if (artifact === undefined) return null
  return (
    <aside className={css.panel} data-report-panel style={{ width }} aria-label={artifact.title ?? 'Report'}>
      <PanelDragHandle />
      <div className={css.tabs} data-report-tabs>
        {artifacts.map((item, index) => (
          <button
            key={item.docName ?? item.title ?? index}
            type="button"
            className={index === active ? `${css.tab} ${css.tabActive}` : css.tab}
            data-report-tab=""
            data-report-tab-active={index === active ? '' : undefined}
            onClick={() => select(index)}
          >
            {item.docName === 'index.html' ? '目录' : (item.title ?? `Report ${index + 1}`)}
          </button>
        ))}
      </div>
      <div className={css.panelHeader}>
        <span className={css.panelTitle}>{artifact.title ?? 'HTML Report'}</span>
        <div className={css.panelActions}>
          <button type="button" className={css.closeButton} onClick={() => setReload(value => value + 1)}>
            {labels.refresh}
          </button>
          <button type="button" className={css.closeButton} onClick={minimize} title={labels.minimizePanel}>
            {labels.minimizePanel}
          </button>
          <button type="button" className={css.closeButton} onClick={close}>
            {labels.closePanel}
          </button>
        </div>
      </div>
      <ReportSearchBox
        key={artifact.docName ?? artifact.title ?? active}
        labels={labels}
        search={search}
        onSearch={setSearch}
        result={searchResult}
      />
      <div className={css.panelBody}>
        <ReportBlock
          key={`${artifact.docName ?? artifact.title ?? ''}-${reload}`}
          fillHeight
          title={artifact.title}
          html={artifact.html}
          initialScrollTop={artifact.scrollTop}
          search={search.query === '' ? undefined : search}
          onScrollTop={recordScrollTop}
          onOpenDocument={selectDocument}
          onSearchResult={setSearchResult}
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
      {onAsk !== undefined && (
        <ReportAskBox labels={labels} artifact={artifact} onAsk={onAsk} />
      )}
    </aside>
  )
}

/**
 * In-report search: a query box that drives the frame bridge. The box is
 * remounted per tab (keyed by the parent), so search state resets on switch.
 * @param props - labels, the current search request, and the result counter.
 * @returns the search row.
 */
function ReportSearchBox({
  labels,
  search,
  onSearch,
  result,
}: {
  labels: ReportArtifactLabels
  search: ReportSearchRequest & { nonce: number }
  onSearch: (request: ReportSearchRequest & { nonce: number }) => void
  result: ReportSearchResult | null
}) {
  const [query, setQuery] = useState('')
  const nonceRef = useRef(search.nonce)
  const inputRef = useRef<HTMLInputElement>(null)
  const send = (action: ReportSearchRequest['action'], nextQuery: string = query) => {
    nonceRef.current += 1
    onSearch({ query: nextQuery, action, nonce: nonceRef.current })
  }
  return (
    <div className={css.searchRow} data-report-search>
      <input
        ref={inputRef}
        type="search"
        className={css.searchInput}
        placeholder={labels.searchPlaceholder}
        value={query}
        onChange={(event) => {
          const value = event.currentTarget.value
          setQuery(value)
          send(value === '' ? 'clear' : 'find', value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            send(event.shiftKey ? 'prev' : 'next')
          } else if (event.key === 'Escape') {
            setQuery('')
            send('clear', '')
            inputRef.current?.blur()
          }
        }}
      />
      {result !== null && result.total > 0 && (
        <span className={css.searchCount} data-report-search-count>
          {result.current}/{result.total}
        </span>
      )}
      <button type="button" className={css.searchNav} onClick={() => send('prev')} disabled={query === ''}>
        {labels.searchPrev}
      </button>
      <button type="button" className={css.searchNav} onClick={() => send('next')} disabled={query === ''}>
        {labels.searchNext}
      </button>
      <button type="button" className={css.searchNav} onClick={() => {
        setQuery('')
        send('clear', '')
      }} disabled={query === ''}>
        {labels.searchClear}
      </button>
    </div>
  )
}

/**
 * Ask-about-report row: compose a question into the main conversation.
 * @param props - labels, the active artifact, and the bridge callback.
 * @returns the ask row.
 */
function ReportAskBox({
  labels,
  artifact,
  onAsk,
}: {
  labels: ReportArtifactLabels
  artifact: ReportArtifact
  onAsk: (question: string, artifact: ReportArtifact) => void
}) {
  const [question, setQuestion] = useState('')
  const empty = question.trim() === ''
  return (
    <div className={css.askRow} data-report-ask>
      <input
        type="text"
        className={css.askInput}
        placeholder={labels.askPlaceholder}
        value={question}
        onChange={event => setQuestion(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !empty) {
            onAsk(question.trim(), artifact)
            setQuestion('')
          }
        }}
      />
      <button
        type="button"
        className={css.askButton}
        disabled={empty}
        onClick={() => {
          onAsk(question.trim(), artifact)
          setQuestion('')
        }}
      >
        {labels.askInChat}
      </button>
    </div>
  )
}
