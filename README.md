# BranchLab

**Draw the plan. Find the missing paths. Test the outcome.**

BranchLab is a privacy-friendly, offline-capable visual flowchart editor built for the SkyCastle **Cancel My Subscription** Hackathon (Nov 4–7, 2026). It replaces the personal flowchart design and export workflow of Whimsical Pro with a fast, no-account browser tool.

**Core features:** drag-and-drop graph editor, one-click linked next steps, directional connections and labelled decisions, deterministic auto-arrange, **Flow Inspector with Yes/No route-to-End coverage and quick fixes**, interactive Run Flow simulation, **step-by-step blank-board builder**, prebuilt templates, multiple boards, local autosave, undo/redo, JSON import/export, SVG, PNG and **print-ready PDF exports**, and multi-node copy/paste that preserves connections between selected steps.

**Stack:** semantic HTML, custom CSS, vanilla JavaScript ES modules. No account, backend, paid APIs or runtime library required. Optional web fonts fall back to system fonts when offline.

## Try the 45-second challenge

**Start here:** [Open the guided demo](https://kristinelio.github.io/branchlab/?demo=1). The `?demo=1` link works on static deployments, including a VibeFlow import with the same JavaScript; share the final **VibeFlow** URL with `?demo=1` in the contest, not GitHub Pages.

The first-run card now highlights **Try the 45-second demo**, with Template and Blank as alternatives. The four-step story runs on real editable data:

1. **Find** — open a six-node customer-support escalation workflow with three genuine structural issues. The unresolved request has no path to an owner. Inspect the editable diagram.
2. **Fix** — press "Connect this path" twice. Each action adds **one** real edge, updates the warnings, and changes route coverage from **1/2** to **2/2** outcomes reaching an End.
3. **Test** — simulate **Customer asks for help → Investigate the issue → Resolved on first reply?**, choose **No**, then follow **Escalate to specialist → Update the customer**.
4. **Share** — export the repaired flow to a printable PDF or open another editable template.

The support example is a simplified illustration of escalation rather than a substitute for an actual support policy. This isn't a fake animated demo. It exercises the exact graph editor, conservative route checker, simulation, and export code available for personal diagrams. The Inspector now links to affected nodes and provides context-aware quick actions for incomplete decisions and dead ends. Note that **route coverage is a structural check, not a guarantee of real-world business correctness**.

Closing the guide stays remembered across refreshes. The direct demo link deliberately creates a separate challenge board, preserving any previous workspace content.

## Create your first useful flow from blank

Select **Blank board** from the first-use card. A lightweight, dismissible guide helps you build a real diagram in six simple actions:

1. Name the **Start**.
2. Name and connect the **first action**.
3. Add a **decision** with a meaningful question.
4. Name the **Yes** and **No** paths; BranchLab adds two real links.
5. Connect both outcomes to an editable **End**.
6. Check the **Flow Inspector** to verify both routes reach an ending.

The guide never changes users' boards without a click, all steps can be renamed, and the diagram is saved locally. On completion, users can simulate the result or export a printable PDF. The guide persists through refresh, can be dismissed at any time, and supports undo.

### Useful shortcuts

| Shortcut | Action |
| --- | --- |
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + Shift + Z | Redo |
| Ctrl/Cmd + D | Duplicate selected node |
| Ctrl/Cmd + C / V | Copy / paste selected nodes and their internal links |
| Shift + click | Multi-select connected or disconnected nodes |
| Ctrl/Cmd + A | Select all nodes on the current board |
| L | Start a connection from selected node |
| Enter | Edit selected node or connector label |
| Shift + A | Auto-arrange nodes |
| I | Open Flow Inspector |
| Space + drag | Pan canvas |
| Ctrl/Cmd + wheel | Zoom canvas |
| Esc | Cancel linking or simulation |

Drag any node in a multi-selection to move the entire set while keeping its connectors attached. Duplicate and delete also work for grouped selections.

Zoom with the toolbar buttons; **Fit all** returns the full-board overview. Select a Decision node and click **Create Yes / No routes** to generate any missing linked outcomes in one action. The inspector keeps the existing connection labels, so you can revise each branch without recreating it.

## Export for real work

Use the top-bar **Export** menu to download a print-ready **PDF**, a high-resolution **PNG**, an editable **SVG**, or a **JSON** backup. PDF is generated directly in the browser without an account, third-party API or network access. Exported PDF pages are A4 landscape or portrait and embed the diagram at raster export resolution.

Three practical examples have been added to the template gallery: **Bug triage**, **Study session planner** and **Content approval**, alongside onboarding, support and expense approval.

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
