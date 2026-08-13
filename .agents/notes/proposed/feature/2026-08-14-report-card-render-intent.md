# Report card render intent (`card: 'report'`)

## Status

Proposed

## Decision

Add a new tool render intent `card: 'report'` that carries a self-contained
HTML document rendered inline in the conversation inside a sandboxed iframe
(`sandbox="allow-scripts"`, no same-origin). The pending call view carries the
report title; the result view carries the HTML.

## Why

Rich tool results (data analysis, dashboards, research digests) currently fall
back to generic text cards, forcing users to open files. A sandboxed inline
report keeps the value in the conversation while containing report scripts.

## Files

- `packages/core/tools/src/presentation.ts` — new views in the call/result
  unions; wire types flow to clients automatically.
- `packages/client/ui-primitives/src/ReportBlock.tsx` — sandboxed iframe
  renderer.
- `packages/client/ui-tool` — `reportCardModel` derivation plus ToolRow and
  ToolDetails wiring.

## Notes

- Wire safety: clients validate `html` is a non-empty string and fall back to
  the generic card otherwise.
- Report scripts run sandboxed; host storage and session are unreachable.
- `demo/report-card-demo` shows the intent end to end.
