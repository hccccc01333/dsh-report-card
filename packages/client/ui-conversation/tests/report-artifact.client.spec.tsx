// @vitest-environment jsdom
// The ChatGPT-style report artifact flow: a small title card in the
// conversation opens a right-side panel showing the full HTML report.

import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { ReportArtifactPanel, ReportArtifactProvider, ReportCardBox } from '../src/client/chat/report-artifact.tsx'

afterEach(cleanup)

const HTML = '<!DOCTYPE html><html><body>report</body></html>'

const LABELS = {
  cardHint: 'hint',
  closePanel: 'close',
  expand: 'expand',
  collapse: 'collapse',
  open: 'open',
  copy: 'copy',
  copied: 'copied',
  download: 'download',
}

describe('report artifacts', () => {
  it('opens the right-side panel from a card and closes it again', () => {
    const view = render(
      <ReportArtifactProvider>
        <ReportCardBox title="Sales" html={HTML} hint={LABELS.cardHint} />
        <ReportArtifactPanel labels={LABELS} />
      </ReportArtifactProvider>,
    )
    expect(view.container.querySelector('[data-report-panel]')).toBeNull()
    fireEvent.click(view.getByText('Sales'))
    const panel = view.container.querySelector('[data-report-panel]')!
    expect(panel).toBeTruthy()
    expect(panel.querySelector('iframe')?.getAttribute('srcdoc')).toBe(HTML)
    fireEvent.click(view.getByText('close'))
    expect(view.container.querySelector('[data-report-panel]')).toBeNull()
  })
})
