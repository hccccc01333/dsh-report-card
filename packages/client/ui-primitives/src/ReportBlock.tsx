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
  /** Fill the available height instead of sizing from the height contract. */
  fillHeight?: boolean | undefined
  /** Search command forwarded into the frame (see {@link REPORT_SEARCH_MESSAGE}). */
  search?: ReportSearchRequest | undefined
  /** Document scroll offset to restore once the frame finishes loading. */
  initialScrollTop?: number | undefined
  /** Debounced report document scroll offset, reported by the frame. */
  onScrollTop?: (top: number) => void
  /** A relative `.html` link was clicked inside the report (multi-document delivery). */
  onOpenDocument?: (name: string) => void
  /** Search progress reported by the frame (total matches, 1-based current). */
  onSearchResult?: (result: ReportSearchResult) => void
}

/** One search command forwarded into the report frame. */
export interface ReportSearchRequest {
  query: string
  action: 'find' | 'next' | 'prev' | 'clear'
}

/** Search progress reported back from the report frame. */
export interface ReportSearchResult {
  total: number
  current: number
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

/** Host → frame: search the report (find / next / prev / clear). */
export const REPORT_SEARCH_MESSAGE = 'dsh-report-search'

/** Frame → host: the report's document scroll offset (debounced). */
export const REPORT_SCROLL_TOP_MESSAGE = 'dsh-report-scroll-top'

/** Host → frame: restore the report's document scroll offset. */
export const REPORT_SCROLL_RESTORE_MESSAGE = 'dsh-report-restore-scroll'

/** Frame → host: a relative `.html` link was clicked (multi-document delivery). */
export const REPORT_OPEN_DOCUMENT_MESSAGE = 'dsh-report-open-document'

/** Frame → host: search results (total matches and current cursor). */
export const REPORT_SEARCH_RESULT_MESSAGE = 'dsh-report-search-result'

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
 * Wrap a self-contained report document with the in-frame frame bridge. The
 * sandboxed blob frame is opaque to the host page, so the host cannot reach
 * its DOM; this script runs inside the frame and implements the client
 * message contract: same-document hash jumps, in-report search with temporary
 * highlighting, document scroll reporting/restoration, and relative `.html`
 * link interception for multi-document deliveries.
 * @param html - the self-contained report document.
 * @returns the document with the bridge inserted before `</head>` (or before
 * the body when the document has no head close tag).
 */
export function injectReportFrameBridge(html: string): string {
  const shim = [
    '<script>',
    '(function () {',
    '  var SCROLL_TOP = "dsh-report-scroll-top";',
    '  var SEARCH = "dsh-report-search";',
    '  var RESTORE = "dsh-report-restore-scroll";',
    '  var OPEN_DOC = "dsh-report-open-document";',
    '  var RESULT = "dsh-report-search-result";',
    '  var marks = [];',
    '  var matchIndex = -1;',
    '  var lastQuery = "";',
    '  var scrollTimer = null;',
    '  function post(payload) { parent.postMessage(payload, "*"); }',
    '  function reportScroll() {',
    '    var top = Math.round(window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0);',
    '    post({ type: SCROLL_TOP, top: top });',
    '  }',
    '  window.addEventListener("scroll", function () {',
    '    if (scrollTimer !== null) return;',
    '    scrollTimer = setTimeout(function () { scrollTimer = null; reportScroll(); }, 120);',
    '  }, { passive: true });',
    '  function clearMarks() {',
    '    marks.forEach(function (mark) {',
    '      var parent = mark.parentNode;',
    '      if (parent !== null) { parent.replaceChild(document.createTextNode(mark.textContent), mark); parent.normalize(); }',
    '    });',
    '    marks = [];',
    '    matchIndex = -1;',
    '  }',
    '  function isSkipped(node) {',
    '    var tag = node.nodeName;',
    '    return tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "MARK";',
    '  }',
    '  function collectTextNodes(root, out) {',
    '    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {',
    '      acceptNode: function (node) {',
    '        var parent = node.parentNode;',
    '        return parent !== null && !isSkipped(parent) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;',
    '      },',
    '    });',
    '    var node;',
    '    while ((node = walker.nextNode()) !== null) out.push(node);',
    '  }',
    '  function findMatches(query) {',
    '    var nodes = [];',
    '    collectTextNodes(document.body || document.documentElement, nodes);',
    '    var lower = query.toLowerCase();',
    '    for (var i = 0; i < nodes.length; i += 1) {',
    '      var node = nodes[i];',
    '      var text = node.textContent || "";',
    '      var offsets = [];',
    '      var offset = text.toLowerCase().indexOf(lower);',
    '      while (offset >= 0) { offsets.push(offset); offset = text.toLowerCase().indexOf(lower, offset + query.length); }',
    '      for (var k = offsets.length - 1; k >= 0; k -= 1) {',
    '        var start = offsets[k];',
    '        try {',
    '          var range = document.createRange();',
    '          range.setStart(node, start);',
    '          range.setEnd(node, start + query.length);',
    '          var mark = document.createElement("mark");',
    '          mark.className = "dsh-report-search-hit";',
    '          range.surroundContents(mark);',
    '          marks.push(mark);',
    '        } catch (error) { /* boundary split: skip this occurrence */ }',
    '      }',
    '    }',
    '  }',
    '  function onSearch(payload) {',
    '    var query = typeof payload.query === "string" ? payload.query : "";',
    '    if (query === "" || payload.action === "clear") {',
    '      lastQuery = "";',
    '      clearMarks();',
    '      post({ type: RESULT, total: 0, current: 0 });',
    '      return;',
    '    }',
    '    if (query !== lastQuery) {',
    '      clearMarks();',
    '      findMatches(query);',
    '      lastQuery = query;',
    '      matchIndex = -1;',
    '    }',
    '    var step = payload.action === "prev" ? -1 : 1;',
    '    matchIndex += step;',
    '    if (matchIndex >= marks.length) matchIndex = 0;',
    '    if (matchIndex < 0) matchIndex = marks.length - 1;',
    '    var mark = marks[matchIndex];',
    '    if (mark !== undefined) mark.scrollIntoView({ behavior: "smooth", block: "center" });',
    '    post({ type: RESULT, total: marks.length, current: marks.length === 0 ? 0 : matchIndex + 1 });',
    '  }',
    '  window.addEventListener("message", function (event) {',
    '    var data = event.data;',
    '    if (data === null || typeof data !== "object") return;',
    '    if (data.type === SEARCH) onSearch(data);',
    '    else if (data.type === RESTORE && typeof data.top === "number") window.scrollTo(0, data.top);',
    '  });',
    '  document.addEventListener("click", function (event) {',
    '    var anchor = event.target;',
    '    while (anchor !== null && anchor.nodeName !== "A") anchor = anchor.parentNode;',
    '    if (anchor === null || anchor.nodeName !== "A") return;',
    '    var href = anchor.getAttribute("href") || "";',
    '    if (href.charAt(0) === "#") {',
    '      event.preventDefault();',
    '      var id;',
    '      try { id = decodeURIComponent(href.slice(1)); }',
    '      catch (error) { id = href.slice(1); }',
    '      if (id === "") return;',
    '      var target = document.getElementById(id) || document.querySelector("[name=\\"" + id + "\\"]");',
    '      if (target !== null) target.scrollIntoView({ behavior: "smooth", block: "start" });',
    '      return;',
    '    }',
    '    if (!/^(https?:|mailto:|tel:|javascript:)/i.test(href) && /\\.html($|[?#])/i.test(href)) {',
    '      event.preventDefault();',
    '      post({ type: OPEN_DOC, name: href.split(/[?#]/)[0] });',
    '    }',
    '  }, true);',
    '})();',
    '</script>',
  ].join('\n')
  const headEnd = html.indexOf('</head>')
  if (headEnd >= 0) return `${html.slice(0, headEnd)}${shim}${html.slice(headEnd)}`
  const bodyStart = html.search(/<body[^>]*>/i)
  if (bodyStart >= 0) return `${html.slice(0, bodyStart)}${shim}${html.slice(bodyStart)}`
  return `${shim}\n${html}`
}

/**
 * Backwards-compatible alias of {@link injectReportFrameBridge}: the same
 * in-frame bridge handles anchor jumps, search, scroll sync, and document
 * links in one injected script.
 * @param html - the self-contained report document.
 * @returns the document with the bridge inserted.
 */
export function injectReportAnchorNavigation(html: string): string {
  return injectReportFrameBridge(html)
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
  fillHeight = false,
  search,
  initialScrollTop,
  onScrollTop,
  onOpenDocument,
  onSearchResult,
}: ReportBlockProps) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(initialHeight)
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(defaultExpanded === true)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const initialScrollTopRef = useRef(initialScrollTop)
  initialScrollTopRef.current = initialScrollTop
  useEffect(() => {
    // Load the report through a blob URL instead of srcdoc: anchor links
    // (table-of-contents jumps) become same-document hash navigation and never
    // blank the frame by reloading about:srcdoc. The injected shim handles the
    // scroll itself because the sandboxed frame is opaque to this page.
    const url = URL.createObjectURL(new Blob([injectReportFrameBridge(html)], { type: 'text/html' }))
    setBlobUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [html])
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // Only the report inside THIS frame may size it.
      if (event.source !== frameRef.current?.contentWindow) return
      const data = event.data as { type?: unknown; height?: unknown } | null
      if (data !== null && typeof data === 'object') {
        const type = (data as { type?: unknown }).type
        if (type === REPORT_HEIGHT_MESSAGE) {
          setHeight(previous => applyReportHeightMessage(data, previous, maxHeight))
        } else if (type === REPORT_SCROLL_TOP_MESSAGE) {
          const top = (data as { top?: unknown }).top
          if (typeof top === 'number') onScrollTop?.(top)
        } else if (type === REPORT_OPEN_DOCUMENT_MESSAGE) {
          const name = (data as { name?: unknown }).name
          if (typeof name === 'string' && name !== '') onOpenDocument?.(name)
        } else if (type === REPORT_SEARCH_RESULT_MESSAGE) {
          const payload = data as { total?: unknown; current?: unknown }
          if (typeof payload.total === 'number' && typeof payload.current === 'number') {
            onSearchResult?.({ total: payload.total, current: payload.current })
          }
        }
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [maxHeight, onScrollTop, onOpenDocument, onSearchResult])
  useEffect(() => {
    if (search === undefined || frameRef.current === null) return
    frameRef.current.contentWindow?.postMessage(
      { type: REPORT_SEARCH_MESSAGE, query: search.query, action: search.action },
      '*',
    )
  }, [search])
  const restoreScroll = () => {
    const top = initialScrollTopRef.current
    if (top !== undefined && top > 0 && frameRef.current !== null) {
      frameRef.current.contentWindow?.postMessage({ type: REPORT_SCROLL_RESTORE_MESSAGE, top }, '*')
    }
  }
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
      <div
        className={clsx(css.frameWrap, fillHeight && css.fillFrameWrap)}
        style={fillHeight ? undefined : { height: frameHeight }}
        data-report-fill={fillHeight || undefined}
      >
        <iframe
          ref={frameRef}
          className={css.frame}
          title={title ?? 'report'}
          sandbox="allow-scripts"
          src={blobUrl ?? undefined}
          onLoad={restoreScroll}
        />
      </div>
    </div>
  )
}
