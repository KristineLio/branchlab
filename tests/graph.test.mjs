import test from 'node:test';
import assert from 'node:assert/strict';
import {makeBoard,TEMPLATES} from '../src/templates.js';
import {validateBoard,normalizeBoard,reachableFrom,detectCycle,fitBounds,connected,clone} from '../src/graph.js';

test('Three showcase templates and a blank canvas exist',()=>{
  assert.ok(TEMPLATES.length>=4);
  assert.ok(TEMPLATES.some(t=>t.key==='blank'));
});
test('All shipped workflows are executable and pass structural validation',()=>{
  for(const template of TEMPLATES.filter(t=>t.nodes.length)){
    const b=makeBoard(template.key);
    const result=validateBoard(b);
    assert.equal(result.errors,0,template.key+': '+JSON.stringify(result.issues));
    assert.equal(result.warnings,0,template.key+': '+JSON.stringify(result.issues));
  }
});
test('A blank board prompts the user instead of crashing',()=>{
  const r=validateBoard(makeBoard('blank'));
  assert.equal(r.ready,false);
  assert.equal(r.issues[0].severity,'info');
});
test('Missing start and end are errors',()=>{
  const b=makeBoard('blank');b.nodes.push({id:'p',type:'process',x:0,y:0,title:'Action'});
  const r=validateBoard(b);
  assert.ok(r.issues.some(i=>i.title==='Missing a starting point'));
  assert.ok(r.issues.some(i=>i.title==='Missing an ending'));
});
test('A disconnected step is flagged as unreachable and dead-ended',()=>{
  const b=makeBoard('signup');
  b.nodes.push({id:'lonely',type:'process',x:1800,y:200,title:'Orphan'});
  const r=validateBoard(b);
  assert.ok(r.issues.some(i=>i.nodeId==='lonely'&&i.title==='Unreachable step'));
  assert.ok(r.issues.some(i=>i.nodeId==='lonely'&&i.title==='Dead-end step'));
});
test('Decision nodes require two exits',()=>{
  const b=makeBoard('signup');
  b.edges=b.edges.filter(e=>e.id!=='ce');
  const r=validateBoard(b);
  assert.ok(r.issues.some(i=>i.title==='Incomplete decision'));
});
test('Decision branches without Yes and No labels are warned about',()=>{
  const b=makeBoard('signup');b.edges.find(e=>e.id==='cd').label='Maybe';
  const r=validateBoard(b);
  assert.ok(r.issues.some(i=>i.title==='Label your branches'));
});
test('Graph traversal reaches intended nodes',()=>{
  const b=makeBoard('signup');
  const seen=reachableFrom(b,'a');
  assert.ok(seen.has('f'));assert.equal(seen.size,6);
  assert.ok(connected(b,'a','b'));assert.equal(connected(b,'b','a'),false);
});
test('Cycles are detected',()=>{
  const b=makeBoard('signup');b.edges.push({id:'loop',from:'d',to:'b',label:''});
  assert.equal(detectCycle(b,reachableFrom(b,'a')),true);
  assert.ok(validateBoard(b).issues.some(i=>i.title==='Loop detected'));
});
test('JSON import normalizes valid boards and discards unknown extra attributes',()=>{
  const raw=makeBoard('support');raw.secret='do not keep';
  const normalized=normalizeBoard(raw);
  assert.equal(normalized.nodes.length,raw.nodes.length);
  assert.equal(normalized.secret,undefined);
  assert.equal(normalized.name,raw.name);
});
test('JSON import rejects malformed and unsafe structures',()=>{
  assert.throws(()=>normalizeBoard({nodes:'bad',edges:[]}));
  const b=makeBoard('signup');b.nodes.push({...b.nodes[0]});assert.throws(()=>normalizeBoard(b),/repeated/);
  const c=makeBoard('signup');c.edges.push({id:'oops',from:'a',to:'missing'});assert.throws(()=>normalizeBoard(c),/connector/);
});
test('Graph bounds encompass all nodes with padding',()=>{
  const b=makeBoard('support'),r=fitBounds(b.nodes);
  assert.ok(r.width>1000);assert.ok(r.height>300);
});
test('Boards and nodes are deeply cloneable for undo/redo',()=>{
  const a=makeBoard('approval'),b=clone(a);
  b.nodes[0].title='Changed';assert.notEqual(a.nodes[0].title,b.nodes[0].title);
  assert.notEqual(makeBoard('approval').id,a.id);
});
