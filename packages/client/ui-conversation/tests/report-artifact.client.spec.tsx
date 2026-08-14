// @vitest-environment jsdom
// The ChatGPT-style report artifact flow: small title cards open a right-hand
// panel with multi-report tabs and a draggable width.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import {
  reportArtifactStore,
  ReportArtifactPanel,
  ReportCardBox,
  REPORT_PANEL_MAX_WIDTH,
  REPORT_PANEL_MIN_WIDTH,
} from '../src/client/chat/report-artifact.tsx'

afterEach(() => {
  cleanup()
  reportArtifactStore.reset()
})

beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:report')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

const HTML = '<!DOCTYPE html><html><body>report</body></html>'
const V2_HTML = '<!DOCTYPE html><html><body>v2</body></html>'

const LABELS = {
  cardHint: 'hint',
  closePanel: 'close',
  refresh: 'refresh',
  expand: 'expand',
  collapse: 'collapse',
  open: 'open',
  copy: 'copy',
  copied: 'copied',
  download: 'download',
}

describe('report artifacts', () => {
  it('opens the panel from a card and closes it again', () => {
    const view = render(
      <>
        <ReportCardBox title="Sales" html={HTML} hint={LABELS.cardHint} />
        <ReportArtifactPanel labels={LABELS} />
      </>,
    )
    expect(view.container.querySelector('[data-report-panel]')).toBeNull()
    fireEvent.click(view.container.querySelector('[data-report-card]')!)
    const panel = view.container.querySelector('[data-report-panel]')!
    expect(panel).toBeTruthy()
    expect(panel.querySelector('iframe')?.getAttribute('src')).toBe('blob:report')
    fireEvent.click(view.getByRole('button', { name: 'close' }))
    expect(reportArtifactStore.get().artifacts.length).toBe(0)
  })

  it('switches between report tabs and closes the active one', async () => {
    const view = render(
      <>
        <ReportCardBox title="Sales" html={HTML} hint={LABELS.cardHint} />
        <ReportCardBox title="Churn" html={V2_HTML} hint={LABELS.cardHint} />
        <ReportArtifactPanel labels={LABELS} />
      </>,
    )
    const cards = view.container.querySelectorAll('[data-report-card]')
    fireEvent.click(cards[0]!)
    expect(reportArtifactStore.get().artifacts.length).toBe(1)
    fireEvent.click(cards[1]!)
    expect(reportArtifactStore.get().artifacts.length).toBe(2)
    await waitFor(() => expect(view.container.querySelectorAll('[data-report-tab]').length).toBe(2))
    await waitFor(() => expect(view.container.querySelector('[data-report-panel] iframe')?.getAttribute('src')).toBe('blob:report'))
    fireEvent.click(view.container.querySelectorAll('[data-report-tab]')[0]!)
    await waitFor(() => expect(view.container.querySelector('[data-report-panel] iframe')?.getAttribute('src')).toBe('blob:report'))
    fireEvent.click(view.getByRole('button', { name: 'close' }))
    await waitFor(() => expect(view.container.querySelectorAll('[data-report-tab]').length).toBe(1))
  })

  it('clamps the panel width', () => {
    reportArtifactStore.setWidth(1000)
    expect(reportArtifactStore.get().width).toBe(REPORT_PANEL_MAX_WIDTH)
    reportArtifactStore.setWidth(10)
    expect(reportArtifactStore.get().width).toBe(REPORT_PANEL_MIN_WIDTH)
  })
})
