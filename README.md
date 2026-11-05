# BranchLab

**Design the flow. Test the logic. Export the result.**

BranchLab is a privacy-friendly, offline-capable visual flowchart editor built for the SkyCastle **Cancel My Subscription** Hackathon (Nov 4–7, 2026). It replaces the personal flowchart design and export workflow of Whimsical Pro with a fast, no-account browser tool.

**Core features:** drag-and-drop graph editor, one-click linked next steps, directional connections and labelled decisions, deterministic auto-arrange, Flow Inspector, interactive Run Flow simulation, prebuilt templates, multiple boards, local autosave, undo/redo, JSON import/export, SVG and PNG exports.

**Stack:** semantic HTML, custom CSS, vanilla JavaScript ES modules. No account, backend, paid APIs or runtime library required. Optional web fonts fall back to system fonts when offline.

## Try the 45-second challenge

The first-use card teaches what makes BranchLab different. Click **Try the interactive demo**:

1. Inspect a six-node launch workflow that has an incomplete decision, an unreachable task and a dead end.
2. Repair missing links on a new editable demo board. Flow Inspector rechecks the actual graph instantly.
3. Run the workflow, choose **No** at the decision, and follow it to a successful finish.

This is real user-editable graph data, not an animated promotional mockup. Afterward, select a node to add a linked step, or use the **Auto-arrange** button to tidy the board.

### Useful shortcuts

| Shortcut | Action |
| --- | --- |
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + Shift + Z | Redo |
| Ctrl/Cmd + D | Duplicate selected node |
| L | Start a connection from selected node |
| Enter | Edit selected node or connector label |
| Shift + A | Auto-arrange nodes |
| I | Open Flow Inspector |
| Space + drag | Pan canvas |
| Ctrl/Cmd + wheel | Zoom canvas |
| Esc | Cancel linking or simulation |

Zoom with the toolbar buttons; **Fit all** returns the full-board overview.

## Run locally

Use a static web server because modules require HTTP:
```sh
python3 -m http.server 8080
```
Then open http://localhost:8080 .

## Test

```sh
npm test
```

## VibeFlow deployment

This repository provides the complete working source, but the competition requires a **separate VibeFlow-published live build**. See [VIBEFLOW_HANDOFF.md](VIBEFLOW_HANDOFF.md) for the import prompt, public-preview QA checklist, and #builds submission format. Publishing only GitHub Pages is not a competition entry.

## Hackathon

- Replaces: Whimsical Pro — basic solo diagrams and exports.
- Design: original BranchLab name, typography, color palette and layout.
- Submission: Live SkyCastle VibeFlow link must be submitted separately in #builds.
- New work created for the November 2026 hackathon.
- Built as a solo entry; AI-assisted tooling is used for implementation.

## Privacy

Your boards live in your own browser's localStorage unless you explicitly export a file. No telemetry, accounts or server storage. JSON export enables backup and transfer. Clearing browser storage deletes unsaved-to-file boards.

## License

MIT. See [LICENSE](LICENSE).
