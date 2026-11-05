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
  console.log('PASS initial workspace, six nodes, six connectors, clean validation');

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

  await page.screenshot({path:'branchlab-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#stage').waitFor();
  assert.equal(await page.locator('#nodes-layer .node').count(),7);
  await page.screenshot({path:'branchlab-mobile.png',fullPage:true});
  console.log('PASS responsive mobile viewport');

  assert.deepEqual(errors,[],'No uncaught JavaScript errors');
  console.log('PASS No uncaught browser JavaScript exceptions');
}catch(e){
  console.error('BROWSER SMOKE FAILURE',e);
  try{await page.screenshot({path:'branchlab-failed.png',fullPage:true});}catch{}
  process.exitCode=1;
}finally{await browser.close();}
