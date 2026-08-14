# Changelog

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
