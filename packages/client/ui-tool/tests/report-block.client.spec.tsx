// @vitest-environment jsdom
// The ReportBlock primitive surface: a sandboxed iframe that renders the
// report HTML as a compact card preview, expands to the full report, resizes
// from a postMessage height contract, and opens/copies/downloads the HTML.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import {
  applyReportHeightMessage,
  injectReportFrameBridge,
  injectReportAnchorNavigation,
  REPORT_HEIGHT_MESSAGE,
  ReportBlock,
} from '@deepseek-ai/dsh-client-ui-primitives'

afterEach(cleanup)

beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:report')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

const HTML = '<!DOCTYPE html><html><body>ok</body></html>'

describe('ReportBlock', () => {
  it('renders the compact card preview in a sandboxed blob iframe without same-origin', () => {
    const { container } = render(<ReportBlock title="Sales" html={HTML} />)
    const frame = container.querySelector('iframe')!
    expect(frame.getAttribute('sandbox')).toBe('allow-scripts')
    expect(frame.getAttribute('src')).toBe('blob:report')
    expect(container.textContent).toContain('Sales')
    expect(container.textContent).toContain('Expand')
    expect(container.textContent).toContain('Open in new tab')
    // The collapsed preview has no overlay: the frame stays scrollable.
    expect(container.querySelector('[class*="previewOverlay"]')).toBeNull()
  })

  it('expands to the full report when Expand is clicked', () => {
    const { container } = render(<ReportBlock title="Sales" html={HTML} />)
    const buttons = container.querySelectorAll('button')
    fireEvent.click(buttons[0]!)
    expect(container.querySelector('[data-report-open]')!.getAttribute('data-report-open')).toBe('true')
    expect(buttons[0]!.getAttribute('aria-expanded')).toBe('true')
    expect(container.textContent).toContain('Collapse')
  })

  it('starts expanded when defaultExpanded is set', () => {
    const { container } = render(<ReportBlock html={HTML} defaultExpanded />)
    expect(container.querySelector('[data-report-open]')!.getAttribute('data-report-open')).toBe('true')
    expect(container.textContent).toContain('Collapse')
  })

  it('fills the available height when fillHeight is set', () => {
    const { container } = render(<ReportBlock html={HTML} fillHeight />)
    const wrap = container.querySelector('[data-report-fill]')!
    expect(wrap).toBeTruthy()
    expect(wrap.hasAttribute('style')).toBe(false)
  })

  it('applies the height contract as a pure function', () => {
    expect(applyReportHeightMessage({ type: REPORT_HEIGHT_MESSAGE, height: 700 }, 480)).toBe(700)
    expect(applyReportHeightMessage({ type: REPORT_HEIGHT_MESSAGE, height: 9999 }, 480)).toBe(1200)
    expect(applyReportHeightMessage({ type: REPORT_HEIGHT_MESSAGE, height: 5000 }, 480, 2000)).toBe(2000)
    expect(applyReportHeightMessage({ type: REPORT_HEIGHT_MESSAGE, height: 10 }, 480)).toBe(120)
    expect(applyReportHeightMessage({ type: 'other', height: 700 }, 480)).toBe(480)
    expect(applyReportHeightMessage({ type: REPORT_HEIGHT_MESSAGE, height: '700' }, 480)).toBe(480)
    expect(applyReportHeightMessage(null, 480)).toBe(480)
  })

  it('injects the anchor navigation shim before the head close tag', () => {
    const injected = injectReportAnchorNavigation('<!DOCTYPE html><html><head><title>toc</title></head><body>ok</body></html>')
    expect(injected.indexOf('document.addEventListener("click"')).toBeGreaterThan(-1)
    expect(injected.indexOf('</head>')).toBeGreaterThan(injected.indexOf('<script>'))
    // The original content stays intact around the shim.
    expect(injected.startsWith('<!DOCTYPE html><html><head><title>toc</title>')).toBe(true)
    expect(injected.endsWith('</head><body>ok</body></html>')).toBe(true)
  })

  it('injects the shim before the body when the head is not explicitly closed', () => {
    const injected = injectReportAnchorNavigation('<html><head><title>toc</title><body>ok</body></html>')
    expect(injected.indexOf('<script>')).toBeLessThan(injected.indexOf('<body'))
    expect(injected.endsWith('<body>ok</body></html>')).toBe(true)
  })

  it('prepends the shim to documents without a body', () => {
    const injected = injectReportAnchorNavigation('<html><head><title>toc</title></html>')
    expect(injected.startsWith('<script>')).toBe(true)
    expect(injected.endsWith('</html>')).toBe(true)
  })

  it('injects the full frame bridge with search, scroll, and document-link handling', () => {
    const injected = injectReportFrameBridge('<!DOCTYPE html><html><head><title>toc</title></head><body>ok</body></html>')
    expect(injected).toContain('dsh-report-search')
    expect(injected).toContain('dsh-report-scroll-top')
    expect(injected).toContain('dsh-report-restore-scroll')
    expect(injected).toContain('dsh-report-open-document')
    expect(injected).toContain('dsh-report-search-result')
    expect(injected).toContain('createTreeWalker')
    expect(injected).toContain('scrollIntoView')
  })

  it('opens the report in a new tab from a blob URL', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const { container } = render(<ReportBlock html={HTML} />)
    const buttons = container.querySelectorAll('button')
    fireEvent.click(buttons[1]!)
    expect(open).toHaveBeenCalledWith('blob:report', '_blank', 'noopener')
    open.mockRestore()
  })

  it('copies the report html to the clipboard with feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const { container } = render(<ReportBlock html={HTML} />)
    const buttons = container.querySelectorAll('button')
    fireEvent.click(buttons[2]!)
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(HTML))
    expect(container.textContent).toContain('Copied')
  })

  it('downloads the report html with a title-derived file name', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const { container } = render(<ReportBlock title="Sales Report" html={HTML} />)
    const buttons = container.querySelectorAll('button')
    fireEvent.click(buttons[3]!)
    expect(click).toHaveBeenCalled()
    expect((click.mock.instances[0] as HTMLAnchorElement | undefined)?.download).toBe('sales-report.html')
    click.mockRestore()
  })
})
