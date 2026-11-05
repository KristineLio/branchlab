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

> Import the complete public source project at https://github.com/KristineLio/branchlab . It is already implemented and tested. Serve its index.html as the app entry point; preserve styles.css, favicon.svg, src/app.js, src/graph.js, and src/templates.js. Preserve relative paths. The app uses native ES modules and requires a static HTTP host; no compilation, backend, authentication, API key or framework is necessary.
>
> Do not redesign or rebuild the editor from scratch. Do not remove core functionality or replace it with static placeholders. Keep localStorage persistence, graph editor, node dragging, connecting handles, decision labels, Flow Inspector, Run Flow simulation, templates, undo/redo, and JSON/SVG/PNG exports.
>
> Check the published portal URL, not only the editor preview: inspect network requests and fix any 404s for ./styles.css and ./src/*.js assets. Avoid absolute paths such as /branchlab/; they can break VibeFlow snapshots. Verify the initial onboarding board has exactly six nodes and six links; Run Flow should complete the Yes branch; exports must download actual files.
>
> Tell me the finished VibeFlow public URL when it is published.

## Judge's first 45 seconds

1. Open the actual VibeFlow public URL in a clean private browsing tab.
2. A guided product card should appear on the canvas: **Try the interactive demo**.
3. Click to open **The broken launch** (six nodes, four edges).
4. Click **Find the problems**. The inspector flags an incomplete decision, a dead end, and an unreachable step.
5. Click **Connect the broken paths**. Two real graph connections are created; health becomes 100, with no issues.
6. Click **Run the real flow**. Advance through Request → Review → Decision, choose **No**, visit Fix the blockers, then reach Launch confirmed.
7. Dismiss the guide. Select a node and press **Add next step** to extend the graph. Try **Auto-arrange**, undo and export.

This judge demo is a working, editable board, not a scripted animation. It is intentionally designed to make the unique value obvious in less than one minute. It can be started from the app again by opening the **More** menu → **Try the flow challenge**.

## Production QA checklist

- [ ] The first-use challenge card displays without covering the main controls.
- [ ] The challenge completes fully in the live deployed app (see steps above).
- [ ] The initial onboarding template renders: six nodes and six real connections.
- [ ] Drag a node and see the lines follow it.
- [ ] Drag or click a port to connect two nodes.
- [ ] Rename a node, refresh the page, and confirm the edit persists.
- [ ] Inspect a healthy flow and an intentionally disconnected node.
- [ ] Run Flow from Start, choose Yes, and reach End.
- [ ] Undo and redo edits and movement; auto-arrange creates a reversible layout.
- [ ] Select a node → **Add next step** creates a new editable node plus a connector.
- [ ] Press `L` on a selected node to connect, and `Shift+A` to auto-arrange.
- [ ] Create a second board from the templates gallery.
- [ ] Export SVG, PNG and JSON; import the JSON backup.
- [ ] Open the published portal URL on desktop and mobile, check browser console for errors.
- [ ] Confirm no visual branding from the paid tool was copied.

## Required Slack submission

**BranchLab** — Make ideas move.  
**Replaces:** Whimsical Pro — $12/month on the monthly Pro plan (verify current price before posting).  
**Description:** A visual flowchart editor that goes beyond drawing: build real diagrams, instantly inspect broken paths and incomplete decisions, **repair the flow**, test each Yes/No route in a live simulation, auto-arrange nodes, and export SVG, PNG or JSON. Try the 45-second interactive challenge! No signup, no watermark, and your data stays in your browser.  
**Live app:** [insert working VibeFlow public URL]

**Important:** Submitting the GitHub repository URL alone is not enough. The rules specifically require a functioning VibeFlow live link.

## Development

Run locally with \`python3 -m http.server 8080\`. Test with \`npm test\`. The GitHub Actions workflow also launches a headless Chromium browser to exercise actual app workflows, including file exports and mobile layout.

The app intentionally omits account sync, real-time collaboration and enterprise workspace administration. Its goal is to replace the *solo* flowcharting workflow cleanly, not the entire paid service.
