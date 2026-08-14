# report-html integration

Mounts [dsh-report-html](https://github.com/hccccc01333/dsh-report-html) into
this fork so its `report_html` / `report_analysis` tools render `card: 'report'`
views inline in the conversation.

The patch points at the plugin's source directory (`D:\dsh-report-html`); edit
`cordis.yml` if your checkout lives elsewhere.

## Run headless

```sh
pnpm dsh --profile headless --patch ./demo/report-html-integration/cordis.yml \
  "Use the report_analysis tool on months 2026-01/02/03 with revenue 100/150/130, title 'Demo analysis', no path; summarize the insights."
```

## Run in the Web UI

```sh
pnpm dsh --profile web --patch ./demo/report-html-integration/cordis.yml
```

Then ask the model to analyze a small dataset; the report card appears in the
conversation.

## Notes

- The plugin resolves its own published `@deepseek-ai/dsh-tools`; the fork host
  provides the `card: 'report'` protocol, so the emitted view flows through the
  fork's wire schema and renders with `ReportBlock`.
