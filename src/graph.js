export const NODE_TYPES = {
  start: {label:'Start',symbol:'play', description:'Where the journey begins'},
  process: {label:'Step',symbol:'square', description:'An action or task'},
  decision: {label:'Decision',symbol:'git-branch',description:'A yes/no branch'},
  end: {label:'End',symbol:'flag',description:'Where the journey ends'},
  note: {label:'Note',symbol:'sticky-note',description:'Add context to a flow'}
};
export const NODE_W = 236;
export const NODE_H = 110;

export function uid(prefix='id') {
  return prefix + '-' + (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().slice(0,8)
    : Date.now().toString(36) + Math.random().toString(36).slice(2,6));
}
export function clone(data) {
  return JSON.parse(JSON.stringify(data));
}
export function outgoing(board,id) {
  return board.edges.filter(e => e.from === id && board.nodes.some(n=>n.id===e.to));
}
export function incoming(board,id) {
  return board.edges.filter(e => e.to === id && board.nodes.some(n=>n.id===e.from));
}
export function connected(board,from,to) {
  return board.edges.some(e=>e.from===from && e.to===to);
}
export function reachableFrom(board, startId) {
  const seen = new Set();
  if (!startId) return seen;
  const queue = [startId];
  while(queue.length) {
    const id = queue.shift();
    if(seen.has(id)) continue;
    seen.add(id);
    for (const edge of outgoing(board,id)) if(!seen.has(edge.to)) queue.push(edge.to);
  }
  return seen;
}
export function detectCycle(board, reachable) {
  const visited = new Set(), active = new Set();
  function walk(id) {
    if(active.has(id)) return true;
    if(visited.has(id)) return false;
    visited.add(id); active.add(id);
    for(const e of outgoing(board,id)) if(walk(e.to)) return true;
    active.delete(id);
    return false;
  }
  for(const id of reachable) if(walk(id)) return true;
  return false;
}
/**
 * Inspect named Yes/No outcomes from decisions reachable from the main Start.
 * "Covered" means an outcome has a route that eventually reaches an End.
 * This is a structural review, not proof that the business process is correct.
 */
export function analyzeOutcomes(board) {
  const start=(board.nodes||[]).find(n=>n.type==='start');
  const reachable=start?reachableFrom(board,start.id):new Set();
  const decisions=(board.nodes||[]).filter(n=>n.type==='decision'&&reachable.has(n.id));
  const ends=new Set((board.nodes||[]).filter(n=>n.type==='end').map(n=>n.id));
  const reachesEnd=id=>{
    const seen=new Set(),queue=[id];
    for(let i=0;i<queue.length;i++){
      const next=queue[i];
      if(ends.has(next))return true;
      if(seen.has(next))continue;
      seen.add(next);
      for(const edge of outgoing(board,next))if(!seen.has(edge.to))queue.push(edge.to);
    }
    return false;
  };
  const routes=[];
  for(const decision of decisions){
    for(const label of ['Yes','No']){
      const edges=outgoing(board,decision.id).filter(e=>(e.label||'').trim().toLowerCase()===label.toLowerCase());
      const covered=edges.length===1&&reachesEnd(edges[0].to);
      routes.push({decisionId:decision.id,decisionTitle:decision.title,label,
        to:edges.length===1?edges[0].to:null,covered,
        reason:edges.length===0?'missing':edges.length>1?'duplicate':'no-finish'});
    }
  }
  return {covered:routes.filter(r=>r.covered).length,total:routes.length,decisions:decisions.length,routes};
}

export function validateBoard(board) {
  const nodes = board.nodes || [], edges = board.edges || [];
  const issues = [];
  const add = (severity,title,description,nodeId=null) => issues.push({id:uid('issue'),severity,title,description,nodeId});
  const starts = nodes.filter(n=>n.type==='start');
  const ends = nodes.filter(n=>n.type==='end');
  if(!nodes.length) {
    add('info','Your canvas is empty','Add a Start node and connect your first step.');
    return {issues,errors:0,warnings:0,ready:false,reachable:new Set()};
  }
  if(!starts.length) add('error','Missing a starting point','Every executable flow needs one Start node.');
  if(starts.length>1) add('warning','Multiple starting points','Run Flow will begin from the first Start node.');
  if(!ends.length) add('error','Missing an ending','Add an End node to complete the journey.');
  const reachable = starts.length ? reachableFrom({nodes,edges},starts[0].id) : new Set();
  nodes.forEach(node=>{
    if(node.type!=='note' && starts.length && !reachable.has(node.id)) {
      add('warning','Unreachable step',node.title+' cannot be reached from Start.',node.id);
    }
    const out = outgoing({nodes,edges},node.id);
    if(node.type==='end' && out.length) add('warning','End has outgoing connections',node.title+' should be the final step.',node.id);
    if(node.type==='note') return;
    if(node.type!=='end' && out.length===0) add('error','Dead-end step',node.title+' has no next step.',node.id);
    if(node.type==='decision') {
      const labels = out.map(e=>(e.label||'').trim().toLowerCase());
      if(out.length<2) add('error','Incomplete decision',node.title+' needs at least two paths.',node.id);
      else if(!labels.includes('yes') || !labels.includes('no')) add('warning','Label your branches',node.title+' should have Yes and No routes.',node.id);
    }
  });
  if(starts.length && ends.length && !ends.some(n=>reachable.has(n.id)))
    add('error','No reachable finish','Connect a path from Start to an End node.');
  const coverage=analyzeOutcomes({nodes,edges});
  for(const route of coverage.routes){
    if(route.to && !route.covered){
      add('warning','Branch has no finish',
        route.decisionTitle+' → '+route.label+' cannot reach an End step. Check this route before sharing.',
        route.decisionId);
    }else if(route.reason==='duplicate'){
      add('warning','Duplicate branch label',
        route.decisionTitle+' has more than one '+route.label+' route. Rename the extra connection.',
        route.decisionId);
    }
  }

  if(starts.length && detectCycle({nodes,edges},reachable))
    add('warning','Loop detected','Your flow includes a cycle. Review it before running.');
  const errors = issues.filter(i=>i.severity==='error').length;
  const warnings = issues.filter(i=>i.severity==='warning').length;
  return {issues,errors,warnings,ready:errors===0,reachable};
}
/**
 * Create the missing Yes/No outcomes for a decision in one reversible edit.
 * Existing routes are preserved. A fully connected but unlabelled decision is
 * not extended: the user should rename its connections instead.
 */
export function addDecisionBranches(board, decisionId) {
  const parent=(board.nodes||[]).find(n=>n.id===decisionId);
  if(!parent || parent.type!=='decision')return {created:[],reason:'Select a Decision step first.'};
  const exits=outgoing(board,decisionId);
  const labels=new Set(exits.map(e=>(e.label||'').trim().toLowerCase()));
  if(exits.length>=2 && (!labels.has('yes')||!labels.has('no')))
    return {created:[],reason:'This decision already has two routes. Rename their labels to Yes and No.'};
  const missing=['Yes','No'].filter(label=>!labels.has(label.toLowerCase()));
  if(!missing.length)return {created:[],reason:'Both Yes and No routes already exist.'};
  const created=[];
  for(const label of missing){
    const x=parent.x+304;
    let y=parent.y+(label==='Yes'?-150:150);
    let attempts=0;
    while(attempts<100 && board.nodes.some(n=>Math.abs(n.x-x)<NODE_W+24 && Math.abs(n.y-y)<NODE_H+28)){
      y+=label==='Yes'?-165:165;attempts++;
    }
    const child={id:uid('node'),type:'process',x,y,
      title:label==='Yes'?'Yes — next step':'No — next step',detail:''};
    board.nodes.push(child);
    board.edges.push({id:uid('edge'),from:parent.id,to:child.id,label});
    created.push(child);
  }
  return {created,reason:null};
}

export function normalizeBoard(raw) {
  if(!raw || typeof raw!=='object' || !Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) throw new Error('Invalid board format.');
  if(raw.nodes.length>600 || raw.edges.length>1200) throw new Error('This board is too large to import.');
  const ids = new Set();
  const nodes = raw.nodes.map(n=>{
    if(!n || typeof n.id!=='string' || n.id.length>80 || !NODE_TYPES[n.type] || ids.has(n.id)) throw new Error('Invalid or repeated node.');
    ids.add(n.id);
    return {id:n.id.slice(0,80),type:n.type,x:within(n.x,-10000,10000),y:within(n.y,-10000,10000),
      title:String(n.title||NODE_TYPES[n.type].label).slice(0,100),
      detail:String(n.detail||'').slice(0,500)};
  });
  const edgeIds = new Set();
  const edges = raw.edges.map(e=>{
    if(!e || typeof e.id!=='string'||e.id.length>80||edgeIds.has(e.id)||!ids.has(e.from)||!ids.has(e.to)||e.from===e.to) throw new Error('Invalid connector.');
    edgeIds.add(e.id);
    return {id:e.id.slice(0,80),from:e.from,to:e.to,label:String(e.label||'').slice(0,40)};
  });
  return {id:typeof raw.id==='string'?raw.id.slice(0,80):uid('board'),
    name:String(raw.name||'Imported flow').slice(0,80),template:'custom',updatedAt:Date.now(),
    quickStart:raw.quickStart===true,quickStartChecked:raw.quickStartChecked===true,nodes,edges};
}
function within(x,min,max) {
  const n=Number(x);
  return Number.isFinite(n)?Math.max(min,Math.min(max,n)):0;
}
export function fitBounds(nodes,pad=64) {
  if(!nodes.length) return {minX:0,minY:0,width:900,height:600};
  const xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y);
  const minX=Math.min(...xs)-pad,minY=Math.min(...ys)-pad;
  return {minX,minY,width:Math.max(...xs)+NODE_W+pad-minX,height:Math.max(...ys)+NODE_H+pad-minY};
}


/**
 * Create a consistent left-to-right layout without needing a server or graph library.
 * Breadth-first columns represent steps from Start; siblings retain their route order.
 * Cycles are safe because each node is visited at most once.
 */
export function autoArrange(board) {
  const nodes=board.nodes||[];
  if(!nodes.length)return [];
  const byId=new Map(nodes.map(n=>[n.id,n]));
  const depth=new Map(), order=new Map();
  const queue=nodes.filter(n=>n.type==='start').map(n=>n.id);
  let index=0;
  for(const id of queue)if(!depth.has(id)){depth.set(id,0);order.set(id,index++);}
  while(queue.length){
    const id=queue.shift();
    const exits=(board.edges||[]).filter(e=>e.from===id&&byId.has(e.to)).sort((a,b)=>{
      const rank=e=>(e.label||'').toLowerCase()==='yes'?0:(e.label||'').toLowerCase()==='no'?1:2;
      return rank(a)-rank(b);
    });
    for(const edge of exits){
      if(depth.has(edge.to))continue;
      depth.set(edge.to,(depth.get(id)||0)+1);
      order.set(edge.to,index++);
      queue.push(edge.to);
    }
  }
  const furthest=Math.max(0,...depth.values());
  for(const node of nodes){
    if(depth.has(node.id))continue;
    depth.set(node.id,furthest+1);
    order.set(node.id,index++);
  }
  const columns=new Map();
  for(const node of nodes){
    const d=depth.get(node.id);
    if(!columns.has(d))columns.set(d,[]);
    columns.get(d).push(node);
  }
  for(const group of columns.values()){
    group.sort((a,b)=>order.get(a.id)-order.get(b.id));
  }
  const maxRows=Math.max(...Array.from(columns.values(),arr=>arr.length));
  const positions=new Map();
  for(const [d,group] of columns){
    const startY=100+(maxRows-group.length)*92;
    group.forEach((n,row)=>positions.set(n.id,{
      x:80+d*304,y:startY+row*184
    }));
  }
  return nodes.map(n=>({...n,...positions.get(n.id)}));
}
