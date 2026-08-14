// The core message renderer's report-card extraction: reportViewFromNode
// reads a validated `card: 'report'` result view off a tool-call Chat node.

import { describe, expect, it } from 'vitest'
import { reportViewFromNode } from '../src/client/chat/ChatNodeSeat.tsx'

const HTML = '<!DOCTYPE html><html><body>report</body></html>'

/** A Chat node in the shape ChatNodeSeat routes, with the given result view. */
function toolNode(resultView: unknown): unknown {
  return { kind: 'tool-call', data: { root: { resultView } } }
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
    expect(reportViewFromNode({ kind: 'assistant', data: {} } as never)).toBeNull()
    expect(reportViewFromNode(undefined)).toBeNull()
  })
})
