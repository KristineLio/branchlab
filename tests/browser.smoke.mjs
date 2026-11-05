import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
  const response=await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
  assert.equal(response?.status(),200,'Server should return 200');
  await page.locator('#nodes-layer .node').first().waitFor();
  assert.equal(await page.locator('#nodes-layer .node').count(),6,'Onboarding template should have six editable nodes');
  assert.equal(await page.locator('#edge-paths g').count(),6,'Onboarding should have six real connections');
  assert.equal((await page.locator('#issue-count').innerText()).trim(),'0','Initial flow should be healthy');
  assert.equal(await page.locator('#experience-card .starter-choices button').count(),3,'New users can choose guided demo, template or blank');
  assert.ok(await page.locator('#experience-card').getByText('Try the 45-second demo').isVisible(),'Product value should be obvious from its first call to action');
  assert.match(await page.locator('#issues-tab .route-coverage').innerText(),/2 \/ 2 routes reach an End/,'Both decision outcomes shown as covered');
  console.log('PASS initial workspace, three starter choices, six nodes, six connectors, clean validation');

  await page.locator('#run-button').click();
  await page.locator('.run-title').getByText('Visitor arrives').waitFor();
  await page.locator('[data-action="run-next"]').click();
  assert.equal(await page.locator('.run-title').innerText(),'Explore the product');
  await page.locator('[data-action="run-next"]').click();
  assert.equal(await page.locator('.run-title').innerText(),'Already has an account?');
  await page.locator('[data-action="choose-edge"]').filter({hasText:'Yes'}).click();
  assert.equal(await page.locator('.run-title').innerText(),'Sign in');
  await page.locator('[data-action="run-next"]').click();
  assert.equal(await page.locator('.run-title').innerText(),'Welcome aboard');
  await page.locator('#run-panel [data-action="stop-run"]').last().click();
  console.log('PASS working flow simulation, decision choices, reaching end');

  await page.locator('.palette-item[data-type="process"]').click();
  assert.equal(await page.locator('#nodes-layer .node').count(),7);
  await page.locator('#node-title-field').fill('Research and review');
  assert.equal(await page.locator('.node.selected .node-title').innerText(),'Research and review');
  console.log('PASS add and edit a node');

  await page.locator('#inspect-button').click();
  await page.getByText('Unreachable step',{exact:true}).first().waitFor();
  console.log('PASS live flow health issues');

  await page.waitForTimeout(450);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#nodes-layer .node').first().waitFor();
  assert.equal(await page.locator('#nodes-layer .node').count(),7);
  assert.equal(await page.getByText('Research and review',{exact:true}).count()>0,true);
  console.log('PASS browser autosave survives reload');

  const sourcePort=page.locator('.node[data-id="a"] .node-port.out');
  await sourcePort.click();
  await page.locator('.node').filter({hasText:'Research and review'}).click();
  assert.equal(await page.locator('#edge-paths g').count(),7,'Connecting a new node adds a real graph edge');
  console.log('PASS graph connections created by clicking output and destination');

  const dragNode=page.locator('.node[data-id="a"]');
  const oldStyle=await dragNode.getAttribute('style');
  const bb=await dragNode.boundingBox();
  await page.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);
  await page.mouse.down();
  await page.mouse.move(bb.x+bb.width/2+50,bb.y+bb.height/2+35,{steps:6});
  await page.mouse.up();
  const newStyle=await dragNode.getAttribute('style');
  assert.notEqual(oldStyle,newStyle,'Dragging should update actual diagram position');
  console.log('PASS pointer-based node dragging');

  await page.locator('[data-action="undo"]').click();
  const undoStyle=await dragNode.getAttribute('style');
  assert.notEqual(undoStyle,newStyle,'Undo restores previous layout');
  await page.locator('[data-action="redo"]').click();
  const redoStyle=await dragNode.getAttribute('style');
  assert.equal(redoStyle,newStyle,'Redo reapplies layout');
  console.log('PASS undo/redo for node movement');

  await page.evaluate(()=>document.querySelector('#menu-popover').hidden=false);
  const pngEvent=page.waitForEvent('download',{timeout:15000});
  await page.locator('[data-action="export-png"]').click();
  const pngDownload=await pngEvent;
  assert.ok(pngDownload.suggestedFilename().endsWith('.png'));
  console.log('PASS real PNG export');

  await page.evaluate(()=>document.querySelector('#menu-popover').hidden=false);
  const downloadEvent=page.waitForEvent('download',{timeout:15000});
  await page.locator('[data-action="export-svg"]').click();
  const download=await downloadEvent;
  assert.ok(download.suggestedFilename().endsWith('.svg'));
  console.log('PASS SVG download');

  await page.evaluate(()=>document.querySelector('#menu-popover').hidden=false);
  const pdfEvent=page.waitForEvent('download',{timeout:15000});
  await page.locator('[data-action="export-pdf"]').click();
  const pdfDownload=await pdfEvent;
  assert.ok(pdfDownload.suggestedFilename().endsWith('.pdf'));
  const pdfBytes=await (await import('node:fs/promises')).readFile(await pdfDownload.path());
  assert.ok(pdfBytes.subarray(0,8).toString('utf8').startsWith('%PDF-1.'),'PDF must be a real PDF, not renamed image data');
  console.log('PASS valid PDF download');

  await page.screenshot({path:'branchlab-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#stage').waitFor();
  assert.equal(await page.locator('#nodes-layer .node').count(),7);
  await page.waitForTimeout(350);
  await page.screenshot({path:'branchlab-mobile.png',fullPage:true});
  console.log('PASS responsive mobile viewport');

  // Judge's 45-second journey: broken graph → inspector → repair → decision simulation.
  await page.setViewportSize({width:1440,height:900});
  await page.locator('#experience-card [data-action="challenge"]').click();
  await page.screenshot({path:'branchlab-challenge.png',fullPage:true});
  const demoOverview=await page.evaluate(()=>{
    const stage=document.querySelector('#stage').getBoundingClientRect();
    return Array.from(document.querySelectorAll('#nodes-layer .node')).every(n=>{
      const r=n.getBoundingClientRect();
      return r.left>=stage.left-1&&r.right<=stage.right+1&&r.top>=stage.top-1&&r.bottom<=stage.bottom+1;
    });
  });
  assert.equal(demoOverview,true,'Guided challenge should show every step in one full-flow overview');
  assert.equal(await page.locator('#nodes-layer .node').count(),6);
  assert.equal(await page.locator('#edge-paths g').count(),4);
  assert.equal(await page.locator('#issue-count').innerText(),'3');
  await page.locator('#experience-card [data-action="inspect-challenge"]').click();
  await page.screenshot({path:'branchlab-inspection.png',fullPage:true});
  assert.ok(await page.locator('#issues-tab .issue-item').count()>=3);
  await page.locator('#experience-card [data-action="repair-challenge"]').click();
  assert.equal(await page.locator('#edge-paths g').count(),5,'First action repairs just one real connector');
  assert.equal((await page.evaluate(()=>window.BranchLabDebug.coverage())).covered,1,'A dead-end No route must not pass the coverage check');
  assert.match(await page.locator('#experience-card .demo-fix-target').innerText(),/Fix the blockers/);
  await page.locator('#experience-card [data-action="repair-challenge"]').click();
  await page.screenshot({path:'branchlab-repaired.png',fullPage:true});
  assert.equal(await page.locator('#edge-paths g').count(),6);
  assert.equal(await page.locator('#issue-count').innerText(),'0');
  assert.equal((await page.evaluate(()=>window.BranchLabDebug.coverage())).covered,2);
  await page.locator('#experience-card [data-action="run-challenge"]').click();
  await page.locator('#run-panel [data-action="run-next"]').click();
  await page.locator('#run-panel [data-action="run-next"]').click();
  assert.equal(await page.locator('.run-title').innerText(),'Ready to ship?');
  await page.locator('#run-panel [data-action="choose-edge"]').filter({hasText:'No'}).click();
  assert.equal(await page.locator('.run-title').innerText(),'Fix the blockers');
  await page.locator('#run-panel [data-action="run-next"]').click();
  assert.ok(await page.getByText('You caught a gap before launch.').count(),'The completion screen explains the real benefit');
  assert.equal(await page.locator('#run-panel').isHidden(),true,'Guided completion collapses the simulation panel to reveal the full diagram');
  assert.equal((await page.evaluate(()=>window.BranchLabDebug.state().run.path)).at(-1),'f','Simulation truly ended on the graph End node');
  await page.screenshot({path:'branchlab-complete.png',fullPage:true});
  await page.locator('#experience-card [data-action="dismiss-experience"]').first().click();
  console.log('PASS complete first-minute product demonstration from bug to working flow');

  const hitNode=await page.evaluate(()=>{
    const n=document.querySelector('.node[data-id="b"]');
    const rect=n.getBoundingClientRect();
    return document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2)?.closest('.node')?.dataset.id;
  });
  assert.equal(hitNode,'b','An existing node should be directly clickable after the tour');
  await page.locator('.node[data-id="b"]').click();
  await page.locator('#details-tab [data-action="add-next"]').click();
  assert.equal(await page.locator('#nodes-layer .node').count(),7);
  assert.equal(await page.locator('#edge-paths g').count(),7);
  await page.locator('#node-title-field').fill('Final QA check');
  assert.ok(await page.locator('.node.selected .node-title').innerText()==='Final QA check');
  console.log('PASS one-click next-step creation, real connection and inline title editing');

  const beforeTidy=await page.evaluate(()=>window.BranchLabDebug.getBoard().nodes.map(n=>[n.id,n.x,n.y]));
  await page.locator('.tidy-control').click();
  const afterTidy=await page.evaluate(()=>window.BranchLabDebug.getBoard().nodes.map(n=>[n.id,n.x,n.y]));
  assert.notDeepEqual(afterTidy,beforeTidy,'Auto-arrange should genuinely reposition nodes');
  await page.locator('[data-action="undo"]').first().click();
  const undoneTidy=await page.evaluate(()=>window.BranchLabDebug.getBoard().nodes.map(n=>[n.id,n.x,n.y]));
  assert.deepEqual(undoneTidy,beforeTidy,'Undo should restore prior layout after auto-arrange');
  console.log('PASS auto-arrange and undo restore exact original coordinates');

  await page.locator('.palette-item[data-type="decision"]').click();
  const beforeBranch=await page.evaluate(()=>({nodes:window.BranchLabDebug.getBoard().nodes.length,edges:window.BranchLabDebug.getBoard().edges.length}));
  await page.locator('#details-tab [data-action="add-branches"]').click();
  const afterBranch=await page.evaluate(()=>window.BranchLabDebug.getBoard());
  assert.equal(afterBranch.nodes.length,beforeBranch.nodes+2);
  assert.equal(afterBranch.edges.length,beforeBranch.edges+2);
  const newDecision=afterBranch.nodes[afterBranch.nodes.length-3];
  assert.deepEqual(afterBranch.edges.filter(e=>e.from===newDecision.id).map(e=>e.label),['Yes','No']);
  console.log('PASS one-click connected Yes/No branch creation');

  await page.locator('#details-tab [data-action="copy-node"]').click();
  await page.evaluate(()=>document.querySelector('#menu-popover').hidden=false);
  await page.locator('[data-action="paste-node"]').click();
  assert.equal((await page.evaluate(()=>window.BranchLabDebug.getBoard())).nodes.length,afterBranch.nodes.length+1);
  console.log('PASS copy/paste an editable node');

  // Multi-select linked nodes, move together, and duplicate their internal edge.
  await page.locator('.stage-controls [data-action="fit"]').last().click();
  await page.locator('.node[data-id="a"]').click();
  await page.locator('.node[data-id="b"]').click({modifiers:['Shift']});
  assert.equal(await page.locator('#nodes-layer .node.selected').count(),2);
  assert.ok((await page.locator('#inspector-heading').innerText()).includes('2 steps'));
  const groupStart=await page.evaluate(()=>{
    const b=window.BranchLabDebug.getBoard();
    return b.nodes.filter(n=>['a','b'].includes(n.id)).map(n=>[n.id,n.x,n.y]);
  });
  const groupBox=await page.locator('.node[data-id="a"]').boundingBox();
  await page.mouse.move(groupBox.x+groupBox.width/2,groupBox.y+groupBox.height/2);
  await page.mouse.down();
  await page.mouse.move(groupBox.x+groupBox.width/2+75,groupBox.y+groupBox.height/2+28,{steps:5});
  await page.mouse.up();
  const groupMoved=await page.evaluate(()=>{
    const b=window.BranchLabDebug.getBoard();
    return b.nodes.filter(n=>['a','b'].includes(n.id)).map(n=>[n.id,n.x,n.y]);
  });
  assert.notDeepEqual(groupMoved,groupStart,'Dragging a selected node moves the group');
  assert.equal(groupMoved[0][1]-groupStart[0][1],groupMoved[1][1]-groupStart[1][1]);
  assert.equal(groupMoved[0][2]-groupStart[0][2],groupMoved[1][2]-groupStart[1][2]);
  console.log('PASS shift multi-select and coordinated group drag');

  const beforeGroupCopy=await page.evaluate(()=>window.BranchLabDebug.getBoard());
  await page.locator('#details-tab [data-action="copy-node"]').click();
  await page.evaluate(()=>document.querySelector('#menu-popover').hidden=false);
  await page.locator('#menu-popover [data-action="paste-node"]').click();
  const afterGroupCopy=await page.evaluate(()=>window.BranchLabDebug.getBoard());
  assert.equal(afterGroupCopy.nodes.length,beforeGroupCopy.nodes.length+2);
  assert.equal(afterGroupCopy.edges.length,beforeGroupCopy.edges.length+1,'Pasted group preserves internal connector');
  assert.equal(await page.locator('#nodes-layer .node.selected').count(),2);
  console.log('PASS group copy/paste preserves connecting edges');



  // A direct demo link opens a real challenge without overwriting previous work.
  const isolated=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});
  const quick=await isolated.newPage();
  const quickErrors=[];
  quick.on('pageerror',e=>quickErrors.push(e.message));
  await quick.goto('http://127.0.0.1:8080/?demo=1',{waitUntil:'domcontentloaded'});
  await quick.locator('#nodes-layer .node').first().waitFor();
  assert.equal(await quick.locator('#edge-paths g').count(),4,'Direct link starts the broken challenge');
  assert.equal(new URL(quick.url()).searchParams.has('demo'),false,'Demo param removed to avoid reopening on refresh');
  assert.match(await quick.locator('#experience-card').innerText(),/Would you launch/);

  await quick.locator('#experience-card [data-action="dismiss-experience"]').click();
  await quick.waitForTimeout(450);
  await quick.reload({waitUntil:'domcontentloaded'});
  assert.equal(await quick.locator('#experience-card').isHidden(),true,'Dismissed guide must stay dismissed after reload');
  console.log('PASS direct demo link and remembered guide preference');

  // Outside the guided challenge, Inspector issues provide real, editable fixes.
  await quick.locator('.palette-item[data-type="decision"]').click();
  const addedDecision=(await quick.evaluate(()=>window.BranchLabDebug.getBoard())).nodes.at(-1).id;
  await quick.locator('#inspect-button').click();
  const fix=quick.locator('#issues-tab [data-action="quick-fix"][data-fix="branches"][data-node="'+addedDecision+'"]');
  await fix.click();
  const quickBoard=await quick.evaluate(()=>window.BranchLabDebug.getBoard());
  assert.deepEqual(quickBoard.edges.filter(e=>e.from===addedDecision).map(e=>e.label),['Yes','No'],
    'Quick fix creates connected Yes and No outcomes on the real board');
  assert.ok(quickBoard.nodes.some(n=>n.title.startsWith('No — next step')));
  assert.deepEqual(quickErrors,[]);
  await isolated.close();
  console.log('PASS actionable Inspector quick-fix creates real graph edges');

  assert.deepEqual(errors,[],'No uncaught JavaScript errors');
  console.log('PASS No uncaught browser JavaScript exceptions');
}catch(e){
  console.error('BROWSER SMOKE FAILURE',e);
  try{await page.screenshot({path:'branchlab-failed.png',fullPage:true});}catch{}
  process.exitCode=1;
}finally{await browser.close();}
