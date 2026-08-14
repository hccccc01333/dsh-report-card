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
  searchPlaceholder: 'search…',
  searchPrev: 'prev',
  searchNext: 'next',
  searchClear: 'clear',
  minimizePanel: 'minimize',
  expandPanel: 'expand panel',
  closeAll: 'close all',
  askPlaceholder: 'ask…',
  askInChat: 'ask in chat',
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

  it('minimizes to a bar and restores with the tabs intact', () => {
    const view = render(
      <>
        <ReportCardBox title="Sales" html={HTML} hint={LABELS.cardHint} />
        <ReportArtifactPanel labels={LABELS} />
      </>,
    )
    fireEvent.click(view.container.querySelector('[data-report-card]')!)
    fireEvent.click(view.getByRole('button', { name: 'minimize' }))
    expect(view.container.querySelector('[data-report-min-bar]')).toBeTruthy()
    expect(view.container.querySelector('[data-report-panel]')).toBeNull()
    expect(reportArtifactStore.get().artifacts.length).toBe(1)
    fireEvent.click(view.getByRole('button', { name: /expand panel/ }))
    expect(view.container.querySelector('[data-report-panel]')).toBeTruthy()
    expect(view.container.querySelectorAll('[data-report-tab]').length).toBe(1)
  })

  it('closes every artifact from the minimized bar', () => {
    const view = render(
      <>
        <ReportCardBox title="Sales" html={HTML} hint={LABELS.cardHint} />
        <ReportArtifactPanel labels={LABELS} />
      </>,
    )
    fireEvent.click(view.container.querySelector('[data-report-card]')!)
    fireEvent.click(view.getByRole('button', { name: 'minimize' }))
    fireEvent.click(view.getByRole('button', { name: 'close all' }))
    expect(reportArtifactStore.get().artifacts.length).toBe(0)
    expect(view.container.querySelector('[data-report-min-bar]')).toBeNull()
  })

  it('expands a multi-document delivery into one tab per document', () => {
    const view = render(
      <>
        <ReportCardBox
          title="Batch"
          html={HTML}
          hint={LABELS.cardHint}
          documents={[
            { name: 'index.html', title: 'Batch', html: HTML },
            { name: '01-sales.html', title: 'Sales', html: V2_HTML },
          ]}
        />
        <ReportArtifactPanel labels={LABELS} />
      </>,
    )
    fireEvent.click(view.container.querySelector('[data-report-card]')!)
    expect(reportArtifactStore.get().artifacts.length).toBe(2)
    expect(reportArtifactStore.get().active).toBe(0)
    fireEvent.click(view.container.querySelectorAll('[data-report-tab]')[1]!)
    expect(reportArtifactStore.get().active).toBe(1)
    reportArtifactStore.selectDocument('index.html')
    expect(reportArtifactStore.get().active).toBe(0)
  })

  it('records scroll offsets per artifact and restores them on switch', () => {
    const view = render(
      <>
        <ReportCardBox title="Sales" html={HTML} hint={LABELS.cardHint} />
        <ReportCardBox title="Churn" html={V2_HTML} hint={LABELS.cardHint} />
        <ReportArtifactPanel labels={LABELS} />
      </>,
    )
    const cards = view.container.querySelectorAll('[data-report-card]')
    fireEvent.click(cards[0]!)
    fireEvent.click(cards[1]!)
    reportArtifactStore.recordScrollTop(420)
    expect(reportArtifactStore.get().artifacts[1]?.scrollTop).toBe(420)
    fireEvent.click(view.container.querySelectorAll('[data-report-tab]')[0]!)
    fireEvent.click(view.container.querySelectorAll('[data-report-tab]')[1]!)
    expect(reportArtifactStore.get().artifacts[1]?.scrollTop).toBe(420)
  })

  it('renders the search row and composes ask-about-report into the callback', () => {
    const onAsk = vi.fn()
    const view = render(
      <>
        <ReportCardBox title="Sales" html={HTML} hint={LABELS.cardHint} />
        <ReportArtifactPanel labels={LABELS} onAsk={onAsk} />
      </>,
    )
    fireEvent.click(view.container.querySelector('[data-report-card]')!)
    expect(view.container.querySelector('[data-report-search]')).toBeTruthy()
    const askInput = view.container.querySelector('[data-report-ask] input') as HTMLInputElement
    fireEvent.change(askInput, { target: { value: 'What is the trend?' } })
    fireEvent.click(view.getByRole('button', { name: 'ask in chat' }))
    expect(onAsk).toHaveBeenCalledWith('What is the trend?', expect.objectContaining({ title: 'Sales' }))
  })
})
