# report-card-demo

Demo tool for the `card: 'report'` render intent. Ask the model to call
`demo_report` in the Web UI and the returned HTML renders inline in the
conversation inside a sandboxed frame.

## Run

```sh
pnpm install
pnpm dsh --profile web --patch ./demo/report-card-demo/cordis.yml
```

Open `http://127.0.0.1:3080` and ask: `Use the demo_report tool.`
