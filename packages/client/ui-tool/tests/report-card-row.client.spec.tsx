// @vitest-environment jsdom
// Report cards in the conversation: the tool row stays a compact one-liner,
// while ToolCallTree renders the report as a standalone ChatGPT-style card
// (compact preview, expandable to the full HTML).

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import type { ConversationSnapshot, RunningToolCall, ToolResultNode } from '@deepseek-ai/dsh-client-runtime/client'
import type { ToolResultView } from '@deepseek-ai/dsh-api-remotes/client'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { zh as commonZh } from '@deepseek-ai/dsh-client-locale/src/locales/zh.ts'
import { zh } from '@deepseek-ai/dsh-client-ui-conversation/src/client/locales.ts'
import type { ToolTreeProps } from '../src/client/contract/slots.ts'
import { ToolCallTree } from '../src/client/tool/ToolCallTree.tsx'
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

/** ToolCallTree props with the keyed tool slot falling back to GenericToolCard. */
function treeProps(block: ToolResultNode): ToolTreeProps {
  const snapshot = {} as ConversationSnapshot
  const useSession = ((selector: (value: ConversationSnapshot) => unknown) => selector(snapshot)) as ToolTreeProps['useSession']
  const renderSlot = ((_key: string, _owner: object, options?: { fallback?: React.ReactNode }) =>
    options?.fallback ?? null) as unknown as ToolTreeProps['renderSlot']
  return {
    useSession,
    renderSlot,
    node: {
      key: `tool:${block.callId}`,
      kind: 'tool-call',
      id: block.callId,
      target: 'chat',
      anchorSeq: block.seq,
      location: { kind: 'session' },
      visibility: 'visible',
      data: { root: block },
    },
    openFile: vi.fn(),
    inspectCall: vi.fn(),
    forkAt: vi.fn(),
    fileMentions: vi.fn(),
    t,
  } as unknown as ToolTreeProps
}

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

  it('renders the report as a standalone compact card with an expand action', () => {
    const view = render(<ToolCallTree {...treeProps(settledReport())} />)
    const standalone = view.container.querySelector('[data-report-standalone]')!
    expect(standalone).toBeTruthy()
    const frame = standalone.querySelector('iframe')!
    expect(frame.getAttribute('srcdoc')).toBe(REPORT_HTML)
    const expand = [...standalone.querySelectorAll('button')].find(button => button.textContent === 'Expand')
    expect(expand).toBeTruthy()
    fireEvent.click(expand!)
    expect(expand!.getAttribute('aria-expanded')).toBe('true')
  })
})
