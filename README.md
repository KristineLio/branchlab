# BranchLab

**Design the flow. Test the logic. Export the result.**

BranchLab is a privacy-friendly, offline-capable visual flowchart editor built for the SkyCastle **Cancel My Subscription** Hackathon (Nov 4–7, 2026). It replaces the personal flowchart design and export workflow of Whimsical Pro with a fast, no-account browser tool.

**Core features:** drag-and-drop graph editor, directional connections and labelled decisions, Flow Inspector, interactive Run Flow simulation, prebuilt templates, multiple boards, local autosave, undo/redo, JSON import/export, SVG and PNG exports.

**Stack:** semantic HTML, custom CSS, vanilla JavaScript ES modules. No external dependencies or services required to use the app.

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
