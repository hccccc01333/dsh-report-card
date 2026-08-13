/**
 * Demo tool for the `card: 'report'` render intent: returns a small
 * self-contained interactive HTML report rendered inline in the conversation.
 * @module dsh-report-card-demo
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

/** A compact self-contained interactive report for the inline card. */
const SAMPLE_HTML = `<!DOCTYPE html>
<html data-theme="light">
<head>
<meta charset="utf-8">
<style>
body { margin: 0; padding: 20px; font-family: system-ui, sans-serif; background: #fff; color: #0f172a; }
h1 { margin: 0 0 4px; font-size: 20px; }
p { margin: 0 0 14px; color: #64748b; font-size: 13px; }
.kpis { display: flex; gap: 12px; margin-bottom: 16px; }
.kpi { flex: 1; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; }
.kpi b { display: block; font-size: 20px; }
.kpi span { color: #64748b; font-size: 12px; }
.bar { height: 10px; border-radius: 5px; margin-top: 6px; }
</style>
</head>
<body>
<h1>Inline report card</h1>
<p>This HTML is rendered inside the conversation by card: 'report'.</p>
<div class="kpis">
  <div class="kpi"><b>4.06M</b><span>Revenue</span><div class="bar" style="width:82%;background:#2563eb"></div></div>
  <div class="kpi"><b>27,810</b><span>Orders</span><div class="bar" style="width:64%;background:#16a34a"></div></div>
  <div class="kpi"><b>12.4%</b><span>Growth</span><div class="bar" style="width:91%;background:#d97706"></div></div>
</div>
<svg viewBox="0 0 320 160" width="100%" role="img" aria-label="bar chart">
  <rect x="30" y="90" width="60" height="60" fill="#2563eb"><title>Jan: 1.20M</title></rect>
  <rect x="130" y="60" width="60" height="90" fill="#2563eb"><title>Feb: 1.35M</title></rect>
  <rect x="230" y="30" width="60" height="120" fill="#2563eb"><title>Mar: 1.51M</title></rect>
</svg>
</body>
</html>`

export const name = 'report-card-demo'
export const inject = ['tools']

export function apply(ctx: Context): void {
  ctx.tools.register(defineTool({
    name: 'demo_report',
    description: 'Return a small interactive HTML report rendered inline in the conversation via the report card render intent.',
    parameters: {
      title: { type: 'string', description: 'Optional report title for the card header.' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    presentResult: (args, result) => ({
      card: 'report',
      title: args.title ?? 'Inline report card',
      html: result.isError ? '' : SAMPLE_HTML,
    }),
    async execute(args) {
      return args.title === undefined
        ? 'Inline report card generated.'
        : `Inline report card generated: ${args.title}.`
    },
  }))
}
