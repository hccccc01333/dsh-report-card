# Changelog

## [0.9.0] - 2026-08-14

- Report cards now render at the **turn tail** (the bottom of the
  conversation), fully outside the tool-call tree: after the assistant reply
  completes, the last `card: 'report'` of the turn appears as a standalone
  ChatGPT-style card (compact preview + Expand/Collapse).

## [0.8.0] - 2026-08-14

- Report-card rendering moves into the core conversation renderer
  (`ChatNodeSeat` in `dsh-client-ui-conversation`): the standalone
  ChatGPT-style card (compact preview + Expand/Collapse) renders from the
  message layer itself, independent of the tool-view plugin wiring.
- Verified against a real `report_analysis` call: the host projects
  `card: 'report'` (33KB HTML) without throwing, so the wire carries the view.

## [0.7.0] - 2026-08-14

- Report cards render as ChatGPT-style standalone cards: a compact sandboxed
  preview by default, an Expand action to view the full report (postMessage
  auto-height still applies), and Collapse to shrink it back. Open / Copy /
  Download stay on the card; the tool row stays a compact one-liner and the
  details panel opens full-height.

## [0.6.0] - 2026-08-14

- Report cards render as standalone full-width blocks below the tool row,
  never hidden inside the collapsed tool call.

## [0.5.0] - 2026-08-14

- Report cards in the chat row expand by default: the inline report is visible
  in the conversation immediately (ChatGPT-style) instead of hiding behind the
  collapsed one-line tool row. The Open / Copy / Download actions stay on the
  card.

## [0.4.0] - 2026-08-14

- `demo/report-html-integration`: mount dsh-report-html into this fork so its
  `report_html` / `report_analysis` tools emit `card: 'report'` views; verified
  end to end with a real headless model run (tool executed, result logged, card
  reconstructed at display time from the logged args).

## [0.3.0] - 2026-08-14

- `ReportBlock`: copy-HTML button with feedback and download-HTML button with a
  title-derived file name; configurable `initialHeight`/`maxHeight`.
- Details panel renders the report as a full-height reading surface
  (720px initial, up to 4096px from the height contract).

## [0.2.0] - 2026-08-14

- `ReportBlock`: postMessage height contract (`dsh-report-height`) so the
  sandboxed frame auto-resizes, plus an open-in-new-tab button.
- `reportCardModel`: reject non-string titles and HTML over 5MB from the wire.
- Demo tool: dynamic `title`/`points` input with a height-reporting report.

## [0.1.0] - 2026-08-14

- `card: 'report'` render intent in dsh-tools, the sandboxed `ReportBlock`
  client primitive, `reportCardModel` wiring in the tool row and details
  panel, a demo tool, tests, and docs.
