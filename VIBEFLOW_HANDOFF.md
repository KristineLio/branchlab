# BranchLab → SkyCastle VibeFlow deployment handoff

**Project:** BranchLab · Cancel My Subscription Hackathon, November 2026  
**Repository:** https://github.com/KristineLio/branchlab  
**Replace target:** Whimsical Pro (solo flowcharts, visual planning, exporting)  
**Runtime:** Static HTML, CSS, and vanilla JavaScript ES modules. No build step.

## Publish in VibeFlow

1. Open a **new** VibeFlow build in https://skycastle.ai/ .
2. Give the agent this public repository URL and the prompt below. If the agent cannot fetch the repository, use **GitHub → Code → Download ZIP** and provide those source files to the agent.
3. Ask VibeFlow to preserve the directory structure and **host the app root as index.html**, not recreate a visual-only copy.
4. Publish from VibeFlow and open the **actual public portal URL**, ideally from a fresh browser tab and on mobile.
5. Test all actions below. Only submit to #builds when the production URL works, because the hackathon requires a working VibeFlow live link.

### Paste this prompt into VibeFlow

> Import the complete public source project at https://github.com/KristineLio/branchlab . It is already implemented and tested. Serve its index.html as the app entry point; preserve styles.css, favicon.svg, src/app.js, src/graph.js, src/templates.js, **src/quickstart.js**, and **src/pdf.js**. Preserve relative paths. The app uses native ES modules and requires a static HTTP host; no compilation, backend, authentication, API key or framework is necessary.
>
> Do not redesign or rebuild the editor from scratch. Do not remove core functionality or replace it with static placeholders. Keep localStorage persistence, graph editor, node dragging, connecting handles, one-click Yes/No decision branches, decision labels, **Flow Inspector with real Yes/No route-to-End coverage and clickable quick fixes**, Run Flow simulation, **the six-step editable blank-board wizard with refresh-safe progress**, all templates, undo/redo, multi-node copy/paste with preserved internal edges, and JSON/SVG/PNG/**PDF** exports.
>
> Check the published portal URL, not only the editor preview: inspect network requests and fix any 404s for ./styles.css and ./src/*.js assets. Avoid absolute paths such as /branchlab/; they can break VibeFlow snapshots. Verify the initial onboarding board has exactly six nodes and six links; Run Flow should complete the Yes branch; exports must download actual files. Open the final VibeFlow URL with **?demo=1** and verify the guided challenge starts on its own separate editable board without deleting previous work.
>
> Tell me the finished VibeFlow public URL when it is published.

## Judge's first 45 seconds

1. Open the actual **VibeFlow** public URL with `?demo=1` appended (or select **Try the 45-second demo** on a fresh first visit). This opens a new six-node editable broken **customer-support escalation** board with **four** links.
2. **Find:** Select **Inspect the real flow**. The right panel identifies structural issues and shows only **1/2** Yes/No outcomes reaching an End.
3. **Fix:** Click **Connect this path** once. Exactly one real new link appears, and the issue list updates. Click it again for the second missing link. The graph should have six links, **zero** issues, and **2/2** decision outcomes covered.
4. **Test:** Click **Simulate the No outcome**. Use Next step, choose **No** at “Resolved on first reply?”, visit “Escalate to specialist”, then finish at “Update the customer”.
5. **Share:** The guide offers **Export as PDF**. Download a real PDF with the six-node diagram, or start the **Blank board** wizard to create a completely new workflow.

The inspector and guide both derive their numbers from **actual graph data**, and each repair is a separate undoable graph change. Decision coverage checks graph reachability, not business correctness.

For a short demo URL, use `https://<your-vibeflow-host>/<build-path>/?demo=1`. **Do not post GitHub Pages as the competition submission.**

## Production QA checklist

- [ ] The first-use welcome card clearly offers **Try the 45-second demo**, **Start with template**, and **Blank board** without covering editor controls.
- [ ] The four-stage challenge completes fully in the live deployed app (see steps above); each click adds one real link, Inspector changes from 1/2 to 2/2 routes covered.
- [ ] The initial onboarding template renders: six nodes and six real connections.
- [ ] Drag a node and see the lines follow it.
- [ ] Drag or click a port to connect two nodes.
- [ ] Rename a node, refresh the page, and confirm the edit persists.
- [ ] Inspect a healthy flow and an intentionally disconnected node; check **Decision coverage** shows 2/2 routes for the healthy template.
- [ ] Create a Decision with one missing outcome: Flow Inspector offers a quick fix that adds an editable Yes/No route (and correctly flags new dead ends).
- [ ] Open the public VibeFlow URL with `?demo=1`; verify a new challenge board appears, the query is removed after launch, and existing boards are preserved.
- [ ] Dismiss the guide, refresh, and confirm it stays dismissed.
- [ ] Run Flow from Start, choose Yes, and reach End.
- [ ] Undo and redo edits and movement; auto-arrange creates a reversible layout.
- [ ] Select a node → **Add next step** creates a new editable node plus a connector.
- [ ] Press `L` on a selected node to connect, and `Shift+A` to auto-arrange.
- [ ] Create a second board from the templates gallery.
- [ ] Export SVG, PNG, PDF and JSON; open the PDF and verify the diagram is present, then import the JSON backup.
- [ ] Choose a Decision and click **Create Yes / No routes**; confirm exactly two connected new outcomes.
- [ ] Shift-click two connected nodes, drag them together, then copy/paste the pair; confirm their connector is preserved and both copies are editable.
- [ ] Use the Blank board wizard: enter names for Start → First action → Decision → Yes/No outcomes → End → Check flow. Confirm six nodes, six real links, and zero issues. Refresh and confirm progress and labels survive.
- [ ] On a mobile viewport, make sure the beginner guide fits horizontally and the created nodes remain reachable by pan/zoom.
- [ ] Dismiss the beginner guide without losing or overwriting the board.
- [ ] Open the published portal URL on desktop and mobile, check browser console for errors.
- [ ] Confirm no visual branding from the paid tool was copied.

## Required Slack submission

**BranchLab** — Make ideas move.  
**Replaces:** Whimsical Pro — $12/month on the monthly Pro plan (verify current price before posting).  
**Description:** A real support example shows what happens when an unresolved customer has no next step. Most flowchart tools let you draw a process. **BranchLab checks whether it actually leads anywhere.** Build and edit workflows, catch disconnected steps and unfinished decisions, see whether both Yes/No routes reach a real ending, repair the links, and simulate the outcome. Export print-ready PDF, PNG, SVG or JSON. No login, paywall or watermark; your work stays in your browser. **Try the live 45-second challenge:** [insert working VibeFlow public URL with `?demo=1`].  
**Live app:** [insert working VibeFlow public URL]

**Important:** Submitting the GitHub repository URL alone is not enough. The rules specifically require a functioning VibeFlow live link.

## Development

Run locally with \`python3 -m http.server 8080\`. Test with \`npm test\`. The GitHub Actions workflow also launches a headless Chromium browser to exercise actual app workflows, including file exports and mobile layout.

The app intentionally omits account sync, real-time collaboration and enterprise workspace administration. Its goal is to replace the *solo* flowcharting workflow cleanly, not the entire paid service.
