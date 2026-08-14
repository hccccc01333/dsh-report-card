// @vitest-environment jsdom
// Report cards in the conversation: the tool row stays a compact one-liner;
// the standalone ChatGPT-style card itself renders in the core message
// renderer (ui-conversation ChatNodeSeat), covered by its own spec.

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

describe('report cards in the conversation', () => {
  const ownerProps = (block: RunningToolCall | ToolResultNode, toolName: string): GenericToolCardProps => ({
    callId: 'c1',
    toolName,
    block,
    openFile: vi.fn(),
    t,
  })

  it('keeps the tool row as a compact one-liner, expanding on toggle', () => {
    const view = render(<GenericToolCard {...ownerProps(settledReport(), 'report_analysis')} />)
    expect(view.container.querySelector('iframe')).toBeNull()
    fireEvent.click(view.container.querySelector('[data-expandable]')!)
    expect(view.container.querySelector('iframe')?.getAttribute('srcdoc')).toBe(REPORT_HTML)
  })
})
