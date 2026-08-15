/**
 * Turn-tail report card entry: renders the last `card: 'report'` view of the
 * closing turn as a ChatGPT-style card, fully outside the tool-call tree, and
 * syncs newer reports into the already-open panel.
 * @module dsh-client-ui-report-panel/client/turn-report-card
 */

import { useEffect, useRef } from 'react'
import type { ChatNode } from '@deepseek-ai/dsh-client-ui-conversation/client'
import { reportViewFromNode } from './report-card.ts'
import { ReportCardBox, useReportArtifact } from './report-artifact.tsx'
import type { TurnReportCardProps } from './slots.ts'

/**
 * The turn-tail card: renders the turn's last report card. The selector
 * matched the turn through `report-refs` turn data; the full HTML is read
 * from the conversation snapshot here so location data stays tiny.
 * @param props - matched turn references, owner currency, session hook, locale.
 * @returns the card, or nothing when no report view resolves.
 */
export function TurnReportCard({ turn, useSession, t }: TurnReportCardProps) {
  const { sync } = useReportArtifact()
  const syncedHtml = useRef<string | null>(null)
  const reportView = useSession((snapshot) => {
    const keys = snapshot.chat.locations.getTurn(turn.turn)
    for (let index = keys.length - 1; index >= 0; index -= 1) {
      const key = keys[index]
      if (key === undefined) continue
      const view = reportViewFromNode(snapshot.chat.nodes.get(key) as ChatNode | undefined)
      if (view !== null) return view
    }
    return null
  })
  useEffect(() => {
    if (reportView === null || syncedHtml.current === reportView.html) return
    syncedHtml.current = reportView.html
    sync(reportView)
  }, [reportView, sync])
  if (reportView === null) return null
  return (
    <div data-report-standalone>
      <ReportCardBox
        title={reportView.title}
        html={reportView.html}
        documents={reportView.documents}
        hint={t('reportPanel.cardHint')}
      />
    </div>
  )
}
