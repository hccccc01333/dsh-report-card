# Changelog

## [0.20.0] - 2026-08-14

- **Panel plugin extraction**: the report card + right-hand panel moved out of
  `dsh-client-ui-conversation` into a standalone client plugin
  `dsh-client-ui-report-panel`. `ui-conversation` is back to the
  upstream baseline; the plugin contributes the turn-tail card entry and the
  composer-dock panel entry through public slots.
- The plugin is mounted through the web-app browser roster, so hosts can
  include or remove the surface by composing the entry; the `card: 'report'`
  protocol and `ReportBlock` renderer stay in the core packages.
- All panel features carry over unchanged: in-report search, per-tab scroll
  memory, minimize, multi-document (batch) tabs with index links, and
  ask-in-chat.

## [0.19.0] - 2026-08-14

- In-report search: the panel search box drives an in-frame bridge that finds,
  highlights, and steps through matches (`n/m` counter, Enter/Shift+Enter,
  Esc clears). Search works inside the sandboxed frame where host Ctrl+F
  cannot reach.
- Per-document scroll memory: each tab remembers its scroll offset and
  restores it on switch; refresh resets to the top.
- Panel minimize: close collapses the panel into a narrow bar that keeps all
  tabs and scroll state; the bar offers expand and close-all.
- Multi-document deliveries: `card: 'report'` gains an optional `documents`
  payload (`report_batch_analysis` sends every report HTML plus `index.html`);
  the panel opens one tab per document and relative `.html` links switch tabs
  inside the frame.
- Ask-about-report: the panel question box composes a titled question plus a
  report excerpt into the main composer for the agent to answer in chat.
- Clicking a report card now always adds (or activates) a tab; turn-tail
  auto-sync only refreshes the panel when the newer report keeps the same
  title, so an edit-prompt rerun replaces in place while new reports stack.

## [0.17.0] - 2026-08-14

- Fix: opening the report panel no longer unmounts the conversation cards
  (a render-loop crash in the artifact store removed the turn tails; the store
  methods are now referentially stable and the sync effect only fires when the
  report HTML actually changes).
- Fix: table-of-contents anchor links inside a report now scroll the target
  into view. The frame injects an in-document navigation shim before it loads,
  so hash jumps work inside the sandboxed blob frame without granting
  same-origin access.

## [0.16.0] - 2026-08-14

- Report frames load through a blob URL instead of `srcdoc`, so table-of-
  contents anchor links inside a report become same-document hash navigation
  and never blank the frame.
- The collapsed preview no longer shows an overlay: the preview stays
  scrollable and expand/collapse lives on the header button.

## [0.15.0] - 2026-08-14

- The right-hand report panel supports multiple reports as tabs (click a card
  to add/switch, click a tab to switch, close removes the active one) and a
  draggable width (drag the panel's left edge, 320-800px). The conversation
  reserves the current panel width.

## [0.14.0] - 2026-08-14

- The report inside the right panel fills the available panel height
  (`fillHeight`), so the panel uses the full viewport space instead of leaving
  empty area below a fixed 480px frame.

## [0.13.0] - 2026-08-14

- The report panel is now fixed to the right side of the viewport
  (full-height, independent scroll) and the conversation reserves its width so
  it is pushed left — no dependence on the layout scroll host, so the panel
  never scrolls away and never collapses in height.

## [0.12.0] - 2026-08-14

- Split-view fix: when the report panel is open, the conversation becomes its
  own full-height scrollport and the panel is an independent right-hand space
  (Codex-style). The outer chat scroll no longer carries the panel away, and
  the panel fills the full height with its own scroll.

## [0.11.0] - 2026-08-14

- The report artifact opens as an inline right-hand pane in the same layout
  plane: the conversation is pushed left instead of an overlay window.
- The panel has a Refresh action and auto-replaces its content when the model
  produces a newer report in the conversation (e.g. after an edit prompt).

## [0.10.0] - 2026-08-14

- ChatGPT-style report artifacts: the conversation shows a small title card;
  clicking it opens a right-side application panel with the full HTML report
  (expand/collapse, open, copy, download).
- Card and panel controls are localized (zh/en) and follow the UI language.

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
