import { memo, useMemo } from 'react'
import { JsonBlock, ReportBlock } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ChatNodeOwnerProps, ChatViewSlotProps } from '../contract/slots.ts'
import type { ChatNode } from '../contract/chat-nodes.ts'
import css from './ChatView.module.css'

interface ChatNodeSeatProps extends ChatNodeOwnerProps {
  readonly nodeKey: string
  readonly useSession: ChatViewSlotProps['useSession']
  readonly renderSlot: ChatViewSlotProps['renderSlot']
  readonly t: ChatViewSlotProps['t']
}

type RoutedChatNodeOwner = {
  [Kind in ChatNode['kind']]: ChatNodeOwnerProps & { readonly node: ChatNode<Kind> }
}[ChatNode['kind']]

/** One validated report-card payload carried by a tool-call node result view. */
export interface ReportCardViewPayload {
  title: string | undefined
  html: string
}

/**
 * Extract a validated `card: 'report'` result view from a Chat node. This
 * lives in the core message renderer (bundled into the web dist) so report
 * cards render even before runtime client plugins finish loading; malformed
 * wire payloads return null and keep the generic fallback.
 * @param node - the routed Chat node.
 * @returns the report card payload, or null for non-report or malformed views.
 */
export function reportViewFromNode(node: ChatNode | undefined): ReportCardViewPayload | null {
  if (node === undefined || node.kind !== 'tool-call') return null
  const root = (node as unknown as { data?: { root?: { resultView?: unknown } } }).data?.root
  const view = root?.resultView as { card?: unknown; title?: unknown; html?: unknown } | null | undefined
  if (view === null || typeof view !== 'object' || view.card !== 'report') return null
  // `html` rides the untrusted wire frame; an empty document would render a
  // blank preview, so select the generic path instead.
  if (typeof view.html !== 'string' || view.html === '') return null
  return {
    title: typeof view.title === 'string' ? view.title : undefined,
    html: view.html,
  }
}

/** Subscribe and dispatch one stable Context key without observing sibling Nodes. */
export const ChatNodeSeat = memo(function ChatNodeSeat({
  nodeKey, selectedCallId, cwd, openFile, inspectCall, forkAt,
  loadImage, fileMentions, useSession, renderSlot, t,
}: ChatNodeSeatProps) {
  const node = useSession(snapshot => snapshot.chat.nodes.get(nodeKey))
  const routedNode = node as ChatNode | undefined
  const owner = useMemo<ChatNodeOwnerProps | null>(() => node === undefined
    ? null
    : {
      selectedCallId,
      cwd,
      openFile,
      inspectCall,
      forkAt,
      loadImage,
      fileMentions,
    }, [node, selectedCallId, cwd, openFile, inspectCall, forkAt, loadImage, fileMentions])
  if (routedNode === undefined || owner === null) return null
  const reportView = reportViewFromNode(routedNode)
  // Runtime dispatch owns the correlation: every Node's discriminant is the
  // keyed-slot entry passed alongside that same Node. TypeScript does not
  // distribute an object containing a union into a union of objects itself.
  const routedOwner = { ...owner, node: routedNode } as RoutedChatNodeOwner
  return (
    <div
      className={css.flowItem}
      data-chat-anchor-key={routedNode.key}
      data-chat-flow-key={routedNode.key}
      data-chat-flow-kind={routedNode.kind}
    >
      {renderSlot('conversation.chat.node', routedOwner, {
        entryKey: routedNode.kind,
        hookContext: nodeKey,
        fallback: (
          <JsonBlock
            label={t('message.unknownSurface', { type: routedNode.kind })}
            payload={routedNode.data}
            truncatedLabel={total => t('json.truncated', { total })}
          />
        ),
      })}
      {reportView !== null && (
        <div className={css.reportCard} data-report-standalone>
          <ReportBlock title={reportView.title} html={reportView.html} />
        </div>
      )}
    </div>
  )
})
