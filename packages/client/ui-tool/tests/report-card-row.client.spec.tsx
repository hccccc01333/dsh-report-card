// @vitest-environment jsdom
// The report card in the chat tool row: because GenericToolCard passes
// defaultExpanded for report cards, the inline report is visible immediately,
// ChatGPT-style, without a click on the collapsed row.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import type { RunningToolCall, ToolResultNode } from '@deepseek-ai/dsh-client-runtime/client'
import type { ToolResultView } from '@deepseek-ai/dsh-api-remotes/client'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { zh as commonZh } from '@deepseek-ai/dsh-client-locale/src/locales/zh.ts'
import { zh } from '@deepseek-ai/dsh-client-ui-conversation/src/client/locales.ts'
import { GenericToolCard, type GenericToolCardProps } from '../src/client/tool/toolviews/GenericToolCard.tsx'

afterEach(cleanup)

const t: GenericToolCardProps['t'] = makeTranslate(zh, commonZh)

const REPORT_HTML = '<!DOCTYPE html><html><body>report</body></html>'

/** A settled report_analysis call carrying a report result view. */
const settledReport = (over?: Partial<ToolResultNode>): ToolResultNode => ({
  kind: 'tool-result',
  seq: 10,
  time: 2_000,
  callId: 'c1',
  call: { name: 'report_analysis', argsRaw: '{}' },
  callTime: 1_000,
  content: [{ type: 'text', text: 'Analyzed 3 rows.' }],
  isError: false,
  callView: { card: 'generic', title: 'Analyze' },
  resultView: { card: 'report', title: 'Sales', html: REPORT_HTML } as ToolResultView,
  subCalls: [],
  ...over,
})

describe('chat row report card (GenericToolCard)', () => {
  const ownerProps = (block: RunningToolCall | ToolResultNode, toolName: string): GenericToolCardProps => ({
    callId: 'c1',
    toolName,
    block,
    openFile: vi.fn(),
    t,
  })

  it('renders the inline report immediately without expanding', () => {
    const view = render(<GenericToolCard {...ownerProps(settledReport(), 'report_analysis')} />)
    const frame = view.container.querySelector('iframe')!
    expect(frame).toBeTruthy()
    expect(frame.getAttribute('srcdoc')).toBe(REPORT_HTML)
    expect(view.container.textContent).toContain('Open in new tab')
    expect(view.container.textContent).toContain('Copy HTML')
    expect(view.container.textContent).toContain('Download HTML')
  })

  it('collapses the report when the row is toggled', () => {
    const view = render(<GenericToolCard {...ownerProps(settledReport(), 'report_analysis')} />)
    expect(view.container.querySelector('iframe')).toBeTruthy()
    fireEvent.click(view.container.querySelector('[data-expandable]')!)
    // The report frame leaves the DOM once the row is closed.
    expect(view.container.querySelector('iframe')).toBeNull()
  })
})
