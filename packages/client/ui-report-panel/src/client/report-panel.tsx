/**
 * Composer-dock report panel entry: the right-hand fixed panel plus the
 * ask-about-report row that composes a question into the main composer.
 * @module dsh-client-ui-report-panel/client/report-panel
 */

import { useMemo } from 'react'
import { ReportArtifactPanel, type ReportArtifact, type ReportArtifactLabels } from './report-artifact.tsx'
import type { ReportPanelProps } from './slots.ts'

/**
 * The report panel dock entry: renders nothing until a card opens an
 * artifact. The ask row uses the standard session `inputActions` to compose
 * the question into the composer for the agent to answer in chat.
 * @param props - standard session kit and the locale seat.
 * @returns the panel (fixed right-hand surface) or the minimized bar.
 */
export function ReportPanel({ inputActions, t }: ReportPanelProps) {
  const labels = useMemo<ReportArtifactLabels>(() => ({
    cardHint: t('reportPanel.cardHint'),
    closePanel: t('reportPanel.closePanel'),
    refresh: t('reportPanel.refresh'),
    expand: t('reportPanel.expand'),
    collapse: t('reportPanel.collapse'),
    open: t('reportPanel.open'),
    copy: t('reportPanel.copy'),
    copied: t('reportPanel.copied'),
    download: t('reportPanel.download'),
    searchPlaceholder: t('reportPanel.searchPlaceholder'),
    searchPrev: t('reportPanel.searchPrev'),
    searchNext: t('reportPanel.searchNext'),
    searchClear: t('reportPanel.searchClear'),
    minimizePanel: t('reportPanel.minimizePanel'),
    expandPanel: t('reportPanel.expandPanel'),
    closeAll: t('reportPanel.closeAll'),
    askPlaceholder: t('reportPanel.askPlaceholder'),
    askInChat: t('reportPanel.askInChat'),
  }), [t])
  const onAsk = inputActions === undefined
    ? undefined
    : (question: string, artifact: ReportArtifact) => {
      const excerpt = artifact.html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 1500)
      inputActions.setDraft(`针对报告《${artifact.title ?? 'HTML Report'}》提问：${question}\n\n报告摘要：${excerpt}`)
    }
  return <ReportArtifactPanel labels={labels} {...(onAsk === undefined ? {} : { onAsk })} />
}
