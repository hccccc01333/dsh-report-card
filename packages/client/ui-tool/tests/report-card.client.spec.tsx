// @vitest-environment jsdom
// The report render intent on the web side: the pure reportCardModel
// derivation over resultView. The chat tool row and the details panel compose
// it through the shared ToolRow / ToolDetails render sites.

import { describe, expect, it } from 'vitest'
import type { RunningToolCall, ToolResultNode } from '@deepseek-ai/dsh-client-runtime/client'
import type { ToolResultView } from '@deepseek-ai/dsh-api-remotes/client'
import { REPORT_HTML_MAX_BYTES, reportCardModel } from '../src/client/tool/models/report-card-model.ts'

const REPORT_HTML = '<!DOCTYPE html><html><body>ok</body></html>'

/** A report result view with a fixed self-contained document. */
const reportResult = (over?: Partial<Extract<ToolResultView, { card: 'report' }>>): ToolResultView => ({
  card: 'report',
  html: REPORT_HTML,
  ...over,
})

/** A settled report call carrying a report result view. */
const settledReport = (over?: Partial<ToolResultNode>): ToolResultNode => ({
  kind: 'tool-result',
  seq: 10,
  time: 2_000,
  callId: 'c1',
  call: { name: 'report_html', argsRaw: '{"title":"Sales"}' },
  callTime: 1_000,
  content: [{ type: 'text', text: 'report written' }],
  isError: false,
  callView: { card: 'generic', title: 'Generate report' },
  resultView: reportResult(),
  subCalls: [],
  ...over,
})

/** A still-running report call: no result view exists yet. */
const runningReport = (over?: Partial<RunningToolCall>): RunningToolCall => ({
  callId: 'c1',
  name: 'report_html',
  argsRaw: '{"title":"Sales"}',
  turn: 1,
  step: 1,
  time: 1_000,
  callView: { card: 'report', title: 'Generate report' },
  subCalls: [],
  ...over,
})

describe('reportCardModel', () => {
  it('derives a report card from the result view', () => {
    expect(reportCardModel(settledReport())).toEqual({
      title: undefined,
      card: { html: REPORT_HTML },
    })
  })

  it('carries the result view replacement title when the presenter sets one', () => {
    expect(reportCardModel(settledReport({ resultView: reportResult({ title: 'Sales' }) }))).toEqual({
      title: 'Sales',
      card: { html: REPORT_HTML, title: 'Sales' },
    })
  })

  it('returns null for running calls, missing views, and non-report cards', () => {
    // A report card is result-time only: a running call has no result view yet.
    expect(reportCardModel(runningReport())).toBeNull()
    expect(reportCardModel(settledReport({ callView: null, resultView: null }))).toBeNull()
    // A generic result keeps the generic path.
    expect(reportCardModel(settledReport({ resultView: { card: 'generic' } }))).toBeNull()
    // A terminal result view is a different card entirely.
    expect(reportCardModel(settledReport({ resultView: { card: 'terminal', output: 'x' } }))).toBeNull()
    // Empty wire HTML would render a blank frame; select the generic path.
    expect(reportCardModel(settledReport({ resultView: reportResult({ html: '' }) }))).toBeNull()
  })

  it('rejects non-string titles and oversized html from the wire', () => {
    expect(reportCardModel(settledReport({ resultView: reportResult({ title: 42 as unknown as string }) }))).toBeNull()
    expect(reportCardModel(settledReport({ resultView: reportResult({ html: 'x'.repeat(REPORT_HTML_MAX_BYTES + 1) }) }))).toBeNull()
  })
})
