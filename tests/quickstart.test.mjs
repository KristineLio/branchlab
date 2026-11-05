import test from 'node:test';
import assert from 'node:assert/strict';
import {makeBoard} from '../src/templates.js';
import {getQuickStartStep,advanceQuickStart} from '../src/quickstart.js';
import {analyzeOutcomes,validateBoard,normalizeBoard} from '../src/graph.js';

test('A blank beginner workflow becomes a complete, connected, testable diagram',()=>{
  const b=makeBoard('blank','Test workflow');
  b.quickStart=true;
  assert.equal(getQuickStartStep(b),'start');
  advanceQuickStart(b,{title:'A client contacts support'});
  assert.equal(getQuickStartStep(b),'process');
  advanceQuickStart(b,{title:'Understand the request'});
  assert.equal(getQuickStartStep(b),'decision');
  advanceQuickStart(b,{title:'Can we resolve it?'});
  assert.equal(getQuickStartStep(b),'branches');
  const routes=advanceQuickStart(b,{yes:'Confirm the solution',no:'Escalate to team'});
  assert.equal(routes.created.length,2);
  assert.equal(getQuickStartStep(b),'finish');
  assert.deepEqual(b.edges.filter(e=>['Yes','No'].includes(e.label)).map(e=>e.label),['Yes','No']);
  const final=advanceQuickStart(b,{title:'Update the client'});
  assert.equal(final.created.length,1);
  assert.equal(getQuickStartStep(b),'check');
  assert.equal(b.nodes.length,6);
  assert.equal(b.edges.length,6);
  assert.equal(analyzeOutcomes(b).covered,2);
  assert.equal(analyzeOutcomes(b).total,2);
  assert.deepEqual(validateBoard(b).issues,[]);
  assert.equal(b.nodes.find(n=>n.type==='end').title,'Update the client');
  advanceQuickStart(b);
  assert.equal(getQuickStartStep(b),'done');
  assert.equal(b.quickStartChecked,true);
  assert.deepEqual(validateBoard(b).issues,[]);
});
test('The wizard does not fake completion when a route becomes disconnected',()=>{
  const b=makeBoard('blank');
  for(const name of ['start','process','decision','branches','finish','check']){
    assert.equal(getQuickStartStep(b),name);
    advanceQuickStart(b);
  }
  assert.equal(getQuickStartStep(b),'done');
  b.edges=b.edges.filter(e=>e.label!=='No');
  assert.equal(getQuickStartStep(b),'branches','Missing No outcome must be repaired before a green state');
  assert.ok(validateBoard(b).issues.length>0);
});
test('Beginner guidance survives save/reload without unsafe coercion',()=>{
  const b=makeBoard('blank');
  b.quickStart=true;
  advanceQuickStart(b);
  const saved=normalizeBoard(JSON.parse(JSON.stringify(b)));
  assert.equal(saved.quickStart,true);
  assert.equal(saved.quickStartChecked,false);
  assert.equal(saved.nodes.length,1);
  const normal=normalizeBoard(makeBoard('signup'));
  assert.equal(normal.quickStart,false);
});
