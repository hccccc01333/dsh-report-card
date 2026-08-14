// Report-card extraction and turn-ref selection for the panel plugin.

import { describe, expect, it } from 'vitest'
import { reportViewFromNode } from '../src/client/report-card.ts'
import { selectReports } from '../src/client/turn-reports.ts'
import type { TurnReportsData } from '../src/client/turn-reports.ts'

const HTML = '<!DOCTYPE html><html><body>report</body></html>'

function toolNode(resultView: unknown): unknown {
  return { kind: 'tool-call', data: { root: { resultView } } }
}

function ownerWithReports(reports: TurnReportsData['reports'], seq: number): never {
  return {
    turn: {
      data: {
        get: (key: string) => key === 'report-refs' ? { reports } : undefined,
      },
    },
    seq,
    openFile: () => {},
  } as never
}

describe('reportViewFromNode', () => {
  it('extracts a validated report view from a tool-call node', () => {
    expect(reportViewFromNode(toolNode({ card: 'report', title: 'Sales', html: HTML }) as never)).toEqual({
      title: 'Sales',
      html: HTML,
    })
    expect(reportViewFromNode(toolNode({ card: 'report', html: HTML }) as never)).toEqual({
      title: undefined,
      html: HTML,
    })
  })

  it('returns null for non-report and malformed views', () => {
    expect(reportViewFromNode(toolNode({ card: 'generic' }) as never)).toBeNull()
    expect(reportViewFromNode(toolNode({ card: 'report', html: '' }) as never)).toBeNull()
    expect(reportViewFromNode(toolNode(null) as never)).toBeNull()
    expect(reportViewFromNode(undefined)).toBeNull()
  })

  it('validates multi-document deliveries and drops malformed entries', () => {
    expect(reportViewFromNode(toolNode({
      card: 'report',
      title: 'Batch',
      html: HTML,
      documents: [
        { name: 'index.html', title: 'Batch', html: HTML },
        { name: '01-sales.html', title: 'Sales', html: HTML },
        { name: '', title: 'Bad', html: HTML },
        { name: '02-empty.html', title: 'Empty', html: '' },
        { name: '03-no-title.html', html: HTML },
      ],
    }) as never)).toEqual({
      title: 'Batch',
      html: HTML,
      documents: [
        { name: 'index.html', title: 'Batch', html: HTML },
        { name: '01-sales.html', title: 'Sales', html: HTML },
        { name: '03-no-title.html', title: '03-no-title.html', html: HTML },
      ],
    })
  })
})

describe('selectReports', () => {
  it('claims the tail only for reports at or before the closing seq', () => {
    expect(selectReports(ownerWithReports([
      { seq: 10, title: 'First' },
      { seq: 20, title: 'Second' },
    ], 20))).toEqual({ reports: [
      { seq: 10, title: 'First' },
      { seq: 20, title: 'Second' },
    ] })
    expect(selectReports(ownerWithReports([
      { seq: 10, title: 'First' },
      { seq: 20, title: 'Second' },
    ], 10))).toEqual({ reports: [{ seq: 10, title: 'First' }] })
    expect(selectReports(ownerWithReports([{ seq: 20, title: 'Second' }], 10))).toBeNull()
    expect(selectReports(ownerWithReports([], 10))).toBeNull()
  })
})
