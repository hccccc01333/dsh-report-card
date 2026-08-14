// @vitest-environment jsdom
// The ReportBlock primitive surface: a sandboxed iframe that renders the
// report HTML, resizes from a postMessage height contract, and opens the
// report in a new tab.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { applyReportHeightMessage, REPORT_HEIGHT_MESSAGE, ReportBlock } from '@deepseek-ai/dsh-client-ui-primitives'

afterEach(cleanup)

const HTML = '<!DOCTYPE html><html><body>ok</body></html>'

describe('ReportBlock', () => {
  it('renders the report in a sandboxed iframe without same-origin', () => {
    const { container } = render(<ReportBlock title="Sales" html={HTML} />)
    const frame = container.querySelector('iframe')!
    expect(frame.getAttribute('sandbox')).toBe('allow-scripts')
    expect(frame.getAttribute('srcdoc')).toBe(HTML)
    expect(container.textContent).toContain('Sales')
    expect(container.textContent).toContain('Open in new tab')
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

  it('opens the report in a new tab from a blob URL', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:report')
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const { container } = render(<ReportBlock html={HTML} />)
    fireEvent.click(container.querySelector('button')!)
    expect(create).toHaveBeenCalled()
    expect(open).toHaveBeenCalledWith('blob:report', '_blank', 'noopener')
    open.mockRestore()
    create.mockRestore()
    revoke.mockRestore()
  })

  it('copies the report html to the clipboard with feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const { container } = render(<ReportBlock html={HTML} />)
    const buttons = container.querySelectorAll('button')
    fireEvent.click(buttons[1]!)
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(HTML))
    expect(container.textContent).toContain('Copied')
  })

  it('downloads the report html with a title-derived file name', () => {
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:report')
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const { container } = render(<ReportBlock title="Sales Report" html={HTML} />)
    const buttons = container.querySelectorAll('button')
    fireEvent.click(buttons[2]!)
    expect(click).toHaveBeenCalled()
    expect((click.mock.instances[0] as HTMLAnchorElement | undefined)?.download).toBe('sales-report.html')
    click.mockRestore()
    create.mockRestore()
    revoke.mockRestore()
  })
})
