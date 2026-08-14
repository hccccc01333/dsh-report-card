# DeepSeek Harness

> This repository is a feature fork: **dsh-report-card** adds a `card: 'report'`
> render intent to DeepSeek Harness so tools can render interactive HTML
> reports directly inside the conversation.

## What this fork adds

- `packages/core/tools/src/presentation.ts` — new `ReportCallView` /
  `ReportResultView` (`card: 'report'`, carrying a self-contained HTML
  document), wired into the `ToolCallView` / `ToolResultView` unions. The wire
  types flow to clients automatically, so any tool can emit the card.
- `packages/client/ui-primitives/src/ReportBlock.tsx` — sandboxed inline
  renderer: the report HTML is displayed in an `<iframe sandbox="allow-scripts">`
  (no same-origin), so report scripts can run but cannot touch the host page.
  The frame auto-resizes via a `postMessage` height contract
  (`dsh-report-height`), can open the report in a new tab, copy the HTML, or
  download it as a title-named file. The details panel renders the report as a
  full-height reading surface (up to 4096px).
- `packages/client/ui-tool` — `reportCardModel` derivation plus render wiring
  in the chat tool row and the details panel; malformed wire payloads (bad
  `title`, empty or >5MB `html`) fall back to the generic card instead of
  crashing. Report cards show up in the conversation immediately as standalone
  ChatGPT-style cards: a compact preview with an Expand action to view the
  full HTML and Collapse to shrink it back. The standalone card renders in the
  core conversation renderer at the turn tail (the bottom of the message),
  fully outside the tool-call tree. Clicking the card opens a right-side
  application panel showing the full report; the panel shares the same layout
  plane (the conversation is pushed left), includes a Refresh action, and
  auto-replaces its content when a newer report arrives. Controls follow the
  UI language (zh/en).
- `demo/report-card-demo` — a demo tool that emits the card.
- `demo/report-html-integration` — mounts the
  [dsh-report-html](https://github.com/hccccc01333/dsh-report-html) plugin so
  its report tools emit the card; verified end to end with a real headless run.

## Try the demo

```sh
pnpm install
pnpm dsh --profile web --patch ./demo/report-card-demo/cordis.yml
```

Open `http://127.0.0.1:3080` and ask: `Use the demo_report tool.` The returned
HTML report renders inline in the conversation.

Any tool can use the intent by declaring a `presentResult` that returns
`{ card: 'report', title, html }`; `dsh-report-html` is the full report
generator companion that produces the HTML payload.

English | [中文](README.zh.md)

DeepSeek Harness (`dsh`) is an open-source agent harness developed by [DeepSeek AI](https://deepseek.com).

It uses an architecture where **everything is a plugin**, and is powered by [Cordis](https://github.com/cordiverse/cordis), whose design is described in [_A Programming Paradigm for Spatiotemporal Composability_](https://github.com/cordiverse/paper).

## Developer preview

DeepSeek Harness is currently in _developer preview_ and is iterating rapidly. **THERE WILL BE COMPATIBILITY-BREAKING CHANGES.**

## Run

### Run from `npm`

Install `Node.js`, then run:

```sh
npx @deepseek-ai/dsh web
```

The command starts the Web UI, served at `http://127.0.0.1:3080` by default. See [Web UI guide](docs/user/guide/index.md).

### Run from source

To run from a repository checkout:

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

## Community and support

- Feel free to submit feedback or bug reports through [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions).
- Add the [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic to your plugin repository for discoverability.
- Join <a href="https://discord.gg/Ycq5dCaS4">DeepSeek Harness Discord community</a>.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Development

Start with the [development guide](docs/development.md) and [architecture documentation](docs/architecture.md).

For agents, follow [AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE)

Third-party dependencies and their licenses are disclosed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
