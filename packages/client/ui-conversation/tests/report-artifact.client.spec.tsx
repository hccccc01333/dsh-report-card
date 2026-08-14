// @vitest-environment jsdom
// The ChatGPT-style report artifact flow: a small title card in the
// conversation opens a right-side panel showing the full HTML report.

import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import {
  ReportArtifactPanel, ReportArtifactProvider, ReportCardBox, useReportArtifact,
} from '../src/client/chat/report-artifact.tsx'

afterEach(cleanup)

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

/** Probe that syncs a newer report into an open panel. */
function SyncProbe({ html }: { html: string }) {
  const { sync } = useReportArtifact()
  return <button type="button" onClick={() => sync({ title: 'v2', html })}>sync</button>
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

  it('refreshes the open panel with a newer report and re-mounts on refresh', () => {
    const view = render(
      <ReportArtifactProvider>
        <ReportCardBox title="Sales" html={HTML} hint={LABELS.cardHint} />
        <SyncProbe html={V2_HTML} />
        <ReportArtifactPanel labels={LABELS} />
      </ReportArtifactProvider>,
    )
    fireEvent.click(view.getByText('Sales'))
    expect(view.container.querySelector('[data-report-panel] iframe')?.getAttribute('srcdoc')).toBe(HTML)
    // A newer report replaces the panel content without reopening.
    fireEvent.click(view.getByText('sync'))
    expect(view.container.querySelector('[data-report-panel] iframe')?.getAttribute('srcdoc')).toBe(V2_HTML)
    // The refresh button re-mounts the report frame.
    fireEvent.click(view.getByText('refresh'))
    expect(view.container.querySelector('[data-report-panel] iframe')).toBeTruthy()
  })
})
