/**
 * Demo tool for the `card: 'report'` render intent: returns a small
 * self-contained interactive HTML report rendered inline in the conversation.
 * The report posts its scroll height back to the host so the sandboxed frame
 * resizes to fit the content.
 * @module dsh-report-card-demo
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

/** One KPI point rendered as a card with a proportional bar. */
export interface DemoPoint {
  label: string
  value: number
}

/** Escape one text value for safe HTML embedding. */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => {
    switch (char) {
      case '&': return '&amp;'
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '"': return '&quot;'
      default: return '&#39;'
    }
  })
}

/**
 * Build a compact self-contained report for the given title and points. The
 * closing script posts the document height to the host frame for auto-resize.
 * @param title - report title.
 * @param points - KPI points rendered as proportional cards.
 * @returns the report HTML document.
 */
export function buildDemoHtml(title: string, points: readonly DemoPoint[]): string {
  const bars = points.map(point => (
    `<div class="kpi"><b>${escapeHtml(String(point.value))}</b><span>${escapeHtml(point.label)}</span>`
    + `<div class="bar" style="width:${Math.min(100, Math.max(4, Math.round(point.value * 10)))}%;background:#2563eb"></div></div>`
  )).join('')
  return `<!DOCTYPE html>
<html data-theme="light">
<head>
<meta charset="utf-8">
<style>
body { margin: 0; padding: 20px; font-family: system-ui, sans-serif; background: #fff; color: #0f172a; }
h1 { margin: 0 0 4px; font-size: 20px; }
p { margin: 0 0 14px; color: #64748b; font-size: 13px; }
.kpis { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.kpi { flex: 1 1 140px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; }
.kpi b { display: block; font-size: 20px; }
.kpi span { color: #64748b; font-size: 12px; }
.bar { height: 10px; border-radius: 5px; margin-top: 6px; }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<p>This HTML is rendered inside the conversation by card: 'report'.</p>
<div class="kpis">${bars}</div>
<script>
addEventListener('load', function () {
  parent.postMessage({ type: 'dsh-report-height', height: document.body.scrollHeight }, '*')
})
</script>
</body>
</html>`
}

export const name = 'report-card-demo'
export const inject = ['tools']

export function apply(ctx: Context): void {
  ctx.tools.register(defineTool({
    name: 'demo_report',
    description: 'Return a small interactive HTML report rendered inline in the conversation via the report card render intent.',
    parameters: {
      title: { type: 'string', description: 'Optional report title for the card header.' },
      points: {
        type: 'array',
        description: 'KPI points rendered as proportional cards; defaults to a demo set.',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            label: { type: 'string', required: true, description: 'Metric name.' },
            value: { type: 'number', required: true, description: 'Metric value; bar width is proportional to it.' },
          },
        },
      },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    presentResult: (args, result) => ({
      card: 'report',
      title: args.title ?? 'Inline report card',
      html: result.isError ? '' : buildDemoHtml(args.title ?? 'Inline report card', args.points ?? [
        { label: 'Revenue', value: 4.06 },
        { label: 'Orders', value: 2.78 },
        { label: 'Growth %', value: 1.24 },
      ]),
    }),
    async execute(args) {
      return args.title === undefined
        ? 'Inline report card generated.'
        : `Inline report card generated: ${args.title}.`
    },
  }))
}
