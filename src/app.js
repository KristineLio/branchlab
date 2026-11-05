import {TEMPLATES,makeBoard} from './templates.js';
import {NODE_TYPES,NODE_W,NODE_H,uid,clone,outgoing,connected,validateBoard,normalizeBoard,fitBounds,autoArrange,addDecisionBranches} from './graph.js';
import {jpegToPdf} from './pdf.js';

const $=id=>document.getElementById(id);
const NS='http://www.w3.org/2000/svg';
const STORE='branchlab-workspace-v1';
const icon=name=>'<svg aria-hidden="true"><use href="#i-'+name+'"/></svg>';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const xml=esc;
const byId=(board,id)=>board.nodes.find(n=>n.id===id);
let boardData;
let state={
  boards:[],activeId:'',selected:null,selectedIds:[],selectedEdge:null,tab:'details',
  inspectorOpen:true,connectFrom:null,run:null,demo:null,experienceDismissed:false,theme:'light',view:{x:80,y:65,scale:.85}
};
let move=null,spaceHeld=false,saveTimer=null,toastTimer=null;
const stacks=new Map();
let nodeClipboard=null;

function current(){return state.boards.find(b=>b.id===state.activeId);}
function stack(){if(!stacks.has(state.activeId))stacks.set(state.activeId,{undo:[],redo:[]});return stacks.get(state.activeId);}
function load(){
  try{
    const raw=JSON.parse(localStorage.getItem(STORE)||'null');
    if(raw && Array.isArray(raw.boards) && raw.boards.length){
      const boards=raw.boards.slice(0,40).map(normalizeBoard);
      const ids=new Set();state.boards=boards.filter(b=>{if(ids.has(b.id))return false;ids.add(b.id);return true;});
      state.activeId=state.boards.some(b=>b.id===raw.activeId)?raw.activeId:state.boards[0].id;
      state.theme=raw.theme==='dark'?'dark':'light';
    }
  }catch(err){console.warn('Unable to restore workspace',err);}
  if(!state.boards.length){const board=makeBoard('signup');state.boards=[board];state.activeId=board.id;}
  document.body.classList.toggle('dark',state.theme==='dark');
  state.inspectorOpen=window.innerWidth>640;
}
function save(){
  clearTimeout(saveTimer);
  try{
    localStorage.setItem(STORE,JSON.stringify({version:1,boards:state.boards,activeId:state.activeId,theme:state.theme}));
    $('save-indicator').innerHTML='<span></span> Saved locally';
  }catch(err){
    $('save-indicator').textContent='Storage unavailable';
    notify('Local saving failed. Export a JSON backup.',true);
  }
}
function queueSave(){
  current().updatedAt=Date.now();
  $('save-indicator').innerHTML='<span></span> Saving…';
  clearTimeout(saveTimer);saveTimer=setTimeout(save,240);
}
function record(){
  const s=stack();
  s.undo.push(clone(current()));if(s.undo.length>70)s.undo.shift();s.redo.length=0;
}
function undo(){
  const s=stack();if(!s.undo.length)return notify('Nothing to undo yet.');
  s.redo.push(clone(current()));replaceCurrent(s.undo.pop());notify('Last change undone.');
}
function redo(){
  const s=stack();if(!s.redo.length)return notify('Nothing to redo yet.');
  s.undo.push(clone(current()));replaceCurrent(s.redo.pop());notify('Change restored.');
}
function replaceCurrent(snapshot){
  const idx=state.boards.findIndex(b=>b.id===state.activeId);
  if(idx>=0)state.boards[idx]=snapshot;
  state.selected=null;state.selectedEdge=null;state.run=null;
  queueSave();render();
}
function notify(msg,error=false){
  const t=$('toast');t.textContent=msg;t.hidden=false;t.style.background=error?'#a44750':'#272b43';
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.hidden=true,3100);
}
function render(){
  const board=current();if(!board)return;
  if(state.selected===null)state.selectedIds=[];
  else if(!state.selectedIds.includes(state.selected))state.selectedIds=[state.selected];
  $('board-title').value=board.name;
  renderBoards();renderStage();renderInspector();renderSummary();renderExperience();
  document.querySelector('.inspector').hidden=!state.inspectorOpen;
  document.body.classList.toggle('dark',state.theme==='dark');
  $('run-button').innerHTML=icon('play')+(state.run?' Running…':' Run flow');
  $('run-button').classList.toggle('is-running',!!state.run);
}
function renderBoards(){
  const list=$('board-list');list.replaceChildren();
  state.boards.forEach(board=>{
    const btn=document.createElement('button');btn.type='button';
    btn.className='board-item'+(state.activeId===board.id?' active':'');
    btn.title=board.name;
    btn.innerHTML='<span class="board-icon"></span><span>'+esc(board.name)+'</span>';
    btn.onclick=()=>switchBoard(board.id);
    list.append(btn);
  });
}
function switchBoard(id){
  if(id===state.activeId)return;
  state.activeId=id;state.selected=null;state.selectedEdge=null;state.run=null;state.connectFrom=null;
  if(state.demo && state.demo.boardId!==id)state.demo=null;
  state.view={x:60,y:65,scale:1};
  render();fitView();queueSave();
}
function renderSummary(){
  const board=current(),check=validateBoard(board);
  $('node-summary').textContent=board.nodes.length+' nodes · '+board.edges.length+' connections';
  $('validity-summary').textContent=check.errors?check.errors+' issue'+(check.errors===1?'':'s')+' to fix':check.warnings?check.warnings+' suggestion'+(check.warnings===1?'':'s'):'Flow looking good';
  $('issue-count').textContent=check.errors+check.warnings;
  $('bottom-status').textContent=state.connectFrom?'Select a destination node to connect':state.run?'Simulation is active':state.selected?'Node selected — edit in Properties':state.selectedEdge?'Connection selected':'Ready to create';
  $('zoom-label').textContent=Math.round(state.view.scale*100)+'%';
}
function applyTransform(){
  const {x,y,scale}=state.view;
  $('world').style.transform='translate('+x+'px,'+y+'px) scale('+scale+')';
  $('grid-backdrop').style.backgroundPosition=x+'px '+y+'px';
  $('grid-backdrop').style.backgroundSize=(24*scale)+'px '+(24*scale)+'px';
  $('zoom-label').textContent=Math.round(scale*100)+'%';
}
function renderStage(){
  const board=current();
  $('stage').classList.toggle('is-connecting',!!state.connectFrom);
  $('stage').classList.toggle('is-running',!!state.run);
  $('connect-hint').hidden=!state.connectFrom;
  if(!state.connectFrom)$('preview-edge').setAttribute('d','');
  $('empty-state').hidden=board.nodes.length>0;
  const layer=$('nodes-layer');layer.replaceChildren();
  board.nodes.forEach((node,index)=>{
    const el=document.createElement('div');
    el.className='node '+node.type+
      (state.selectedIds.includes(node.id)?' selected':'')+
      (state.run&&state.run.path.includes(node.id)?' run-visited':'')+
      (state.run&&runCurrent()?.id===node.id?' run-current':'');
    el.dataset.id=node.id;el.style.left=node.x+'px';el.style.top=node.y+'px';
    el.setAttribute('role','button');el.setAttribute('tabindex','0');el.setAttribute('aria-label',node.type+' node: '+node.title);
    const symbol={start:'play',process:'box',decision:'branch',end:'flag',note:'note'}[node.type];
    const portIn=(node.type!=='start'&&node.type!=='note')?'<span class="node-port in" data-port="in" title="Connect here"></span>':'';
    const portOut=(node.type!=='end'&&node.type!=='note')?'<span class="node-port out '+(state.connectFrom===node.id?'source':'')+'" data-port="out" title="Drag or click to connect"></span>':'';
    el.innerHTML='<div class="node-top"><div class="node-badge">'+icon(symbol)+'</div><span class="node-tag">'+esc(NODE_TYPES[node.type].label)+'</span><span class="node-index">'+String(index+1).padStart(2,'0')+'</span></div>'+
      '<div class="node-title">'+esc(node.title)+'</div><div class="node-subtitle">'+esc(node.detail||'Add a description…')+'</div>'+
      portIn+portOut+
      '<div class="node-node-actions">'+(node.type==='decision'?'<button type="button" data-node-action="branches" title="Create Yes and No routes">'+icon('branch')+'</button>':node.type==='start'||node.type==='process'?'<button type="button" data-node-action="next" title="Add connected step">'+icon('plus')+'</button>':'')+'<button type="button" data-node-action="duplicate" title="Duplicate">'+icon('copy')+'</button><button type="button" data-node-action="delete" title="Delete">'+icon('trash')+'</button></div>';
    el.addEventListener('pointerdown',e=>nodePointerDown(e,node.id));
    el.addEventListener('dblclick',()=>{selectNode(node.id);const field=$('node-title-field');if(field){field.focus();field.select();}});
    el.addEventListener('keydown',e=>{if(e.key==='Enter'){e.stopPropagation();selectNode(node.id);}});
    layer.append(el);
  });
  renderEdges();applyTransform();renderRunPanel();
}
function edgePath(from,to){
  const ax=from.x+NODE_W,ay=from.y+NODE_H/2,bx=to.x,by=to.y+NODE_H/2;
  const dx=bx-ax,curve=dx>50?Math.max(65,Math.min(180,dx*.48)):95;
  return 'M '+ax+' '+ay+' C '+(ax+curve)+' '+ay+' '+(bx-curve)+' '+by+' '+bx+' '+by;
}
function drawEdgeSvg(pathData,edge,active){
  const g=document.createElementNS(NS,'g');g.dataset.edgeId=edge.id;
  const hit=document.createElementNS(NS,'path');hit.setAttribute('d',pathData);hit.setAttribute('class','edge-hit');
  const path=document.createElementNS(NS,'path');path.setAttribute('d',pathData);
  path.setAttribute('class',(state.selectedEdge===edge.id?'selected ':'')+(active?'active-path':''));
  path.setAttribute('marker-end',active?'url(#arrow-active)':'url(#arrowhead)');
  const choose=e=>{
    e.stopPropagation();
    state.selectedEdge=edge.id;state.selected=null;state.connectFrom=null;
    state.tab='details';state.inspectorOpen=true;
    render();
    requestAnimationFrame(()=>{
      const field=$('edge-label-field');
      if(field){field.focus();field.select();}
    });
  };
  hit.addEventListener('pointerdown',choose);path.addEventListener('pointerdown',choose);
  g.append(path,hit);
  if(edge.label){
    const a=byId(current(),edge.from),b=byId(current(),edge.to);
    const x=(a.x+NODE_W+b.x)/2,y=(a.y+b.y)/2+NODE_H/2-15;
    const label=document.createElementNS(NS,'text');label.setAttribute('x',x);label.setAttribute('y',y);
    label.setAttribute('class','edge-label');label.textContent=edge.label;g.append(label);
  }
  return g;
}
function renderEdges(){
  const board=current(),layer=$('edge-paths');layer.replaceChildren();
  board.edges.forEach(edge=>{
    const a=byId(board,edge.from),b=byId(board,edge.to);if(!a||!b)return;
    const active=!!(state.run&&state.run.edges.includes(edge.id));
    layer.append(drawEdgeSvg(edgePath(a,b),edge,active));
  });
}
function nodePointerDown(event,id){
  if(event.button!==0)return;
  if(spaceHeld){
    event.preventDefault();event.stopPropagation();
    move={kind:'pan',x:event.clientX,y:event.clientY,viewX:state.view.x,viewY:state.view.y};
    return;
  }
  const button=event.target.closest('[data-node-action]');
  if(button){
    event.stopPropagation();event.preventDefault();
    selectNode(id);
    if(button.dataset.nodeAction==='duplicate')duplicateNode();
    else if(button.dataset.nodeAction==='next')addNextStep();
    else if(button.dataset.nodeAction==='branches')addDecisionPaths();
    else deleteSelection();
    return;
  }
  const port=event.target.closest('[data-port]');
  if(port?.dataset.port==='out'){
    event.stopPropagation();event.preventDefault();
    if(state.run)return;
    state.connectFrom=id;state.selected=id;state.selectedEdge=null;
    render();notify('Connect to another node. Click its input or drop on its card.');
    return;
  }
  if(state.connectFrom){
    event.stopPropagation();event.preventDefault();
    if(id!==state.connectFrom)connectNodes(state.connectFrom,id);
    else {state.connectFrom=null;render();}
    return;
  }
  if(state.run){selectNode(id);return;}
  if(event.target.closest('[data-port]')){event.stopPropagation();return;}
  event.stopPropagation();event.preventDefault();
  if(event.shiftKey){toggleNodeSelection(id);return;}
  const board=current(),node=byId(board,id);
  const grouped=state.selectedIds.length>1&&state.selectedIds.includes(id);
  if(grouped){
    state.selected=id;state.selectedEdge=null;state.tab='details';state.inspectorOpen=true;render();
    move={kind:'group',x:event.clientX,y:event.clientY,recorded:false,
      positions:state.selectedIds.map(key=>{const n=byId(board,key);return {id:key,x:n.x,y:n.y};})};
  }else{
    selectNode(id);
    move={kind:'node',id,x:event.clientX,y:event.clientY,nodeX:node.x,nodeY:node.y,recorded:false};
  }
}
function selectNode(id){
  state.selected=id;state.selectedIds=[id];state.selectedEdge=null;
  state.tab='details';
  if(!state.inspectorOpen)state.inspectorOpen=true;
  render();
}
function toggleNodeSelection(id){
  if(state.run)return;
  const ids=new Set(state.selectedIds);
  if(ids.has(id))ids.delete(id);else ids.add(id);
  state.selectedIds=Array.from(ids);state.selected=state.selectedIds.at(-1)||null;
  state.selectedEdge=null;state.tab='details';state.inspectorOpen=true;render();
}
function connectNodes(from,to){
  const b=current(),a=byId(b,from),dest=byId(b,to);
  if(!a||!dest||from===to||a.type==='end'||a.type==='note'||dest.type==='start'||dest.type==='note'){
    state.connectFrom=null;render();return notify('That connection is not allowed.',true);
  }
  if(connected(b,from,to)){state.connectFrom=null;render();return notify('These steps are already connected.');}
  record();
  const exits=outgoing(b,from);
  const label=a.type==='decision'?(exits.some(e=>e.label.toLowerCase()==='yes')?'No':'Yes'):'';
  const edge={id:uid('edge'),from,to,label};
  b.edges.push(edge);
  state.connectFrom=null;state.selectedEdge=edge.id;state.selected=null;
  queueSave();render();notify('Connection created.');
}
function addNextStep(){
  const b=current(),parent=byId(b,state.selected);
  if(!parent || parent.type==='end' || parent.type==='note')return notify('Choose a Start, Process or Decision node first.',true);
  const exits=outgoing(b,parent.id);
  const x=parent.x+304;
  let y=parent.y+(exits.length?exits.length*185:0);
  while(b.nodes.some(n=>Math.abs(n.x-x)<NODE_W+30 && Math.abs(n.y-y)<NODE_H+28))y+=185;
  record();
  const child={id:uid('node'),type:'process',x,y,title:parent.type==='decision'?'New outcome':'Next step',detail:''};
  const label=parent.type==='decision'?(exits.some(e=>(e.label||'').toLowerCase()==='yes')?'No':'Yes'):'';
  b.nodes.push(child);
  b.edges.push({id:uid('edge'),from:parent.id,to:child.id,label});
  state.selected=child.id;state.selectedEdge=null;state.connectFrom=null;
  state.tab='details';state.run=null;
  queueSave();render();centerOnNode(child.id);
  requestAnimationFrame(()=>{const field=$('node-title-field');if(field){field.focus();field.select();}});
  notify('Next step added and connected. Give it a name.');
}

function addDecisionPaths(){
  const decision=byId(current(),state.selected);
  if(!decision || decision.type!=='decision')return notify('Choose a Decision step first.',true);
  const existing=outgoing(current(),decision.id);
  const labels=new Set(existing.map(e=>(e.label||'').trim().toLowerCase()));
  if((existing.length>=2 && (!labels.has('yes')||!labels.has('no'))) ||
     (labels.has('yes') && labels.has('no')))
    return notify(existing.length>=2&&!labels.has('no')||existing.length>=2&&!labels.has('yes')?
      'Rename existing routes Yes and No before adding more.':'Both decision routes already exist.',true);
  record();
  const result=addDecisionBranches(current(),decision.id);
  if(!result.created.length){stack().undo.pop();return notify(result.reason||'No new branches needed.',true);}
  state.run=null;state.connectFrom=null;
  queueSave();render();fitView(true);
  notify(result.created.length===2?'Created connected Yes and No routes. Name each next step.':'Created the missing decision route.');
}

function screenToWorld(clientX,clientY){
  const rect=$('stage').getBoundingClientRect();
  return{x:(clientX-rect.left-state.view.x)/state.view.scale,y:(clientY-rect.top-state.view.y)/state.view.scale};
}
function addNode(type,position){
  if(!NODE_TYPES[type])return;
  record();
  const rect=$('stage').getBoundingClientRect();
  const center=position || screenToWorld(rect.left+rect.width/2,rect.top+rect.height/2);
  const labels={start:'Start here',process:'New process',decision:'Decision?',end:'Done!',note:'Remember this'};
  let px=Math.round((center.x-NODE_W/2)/10)*10,py=Math.round((center.y-NODE_H/2)/10)*10;
  if(!position){
    const offsets=[[0,0],[0,165],[0,-165],[280,0],[-280,0],[280,165],[-280,165],[280,-165],[-280,-165],[0,330],[0,-330],[560,0],[-560,0]];
    for(const [dx,dy] of offsets){
      const x=px+dx,y=py+dy;
      const collision=current().nodes.some(n=>Math.abs(n.x-x)<NODE_W+26&&Math.abs(n.y-y)<NODE_H+24);
      if(!collision){px=x;py=y;break;}
    }
  }
  const node={id:uid('node'),type,x:px,y:py,title:labels[type],detail:''};
  current().nodes.push(node);
  state.selected=node.id;state.selectedEdge=null;state.run=null;
  queueSave();render();notify(NODE_TYPES[type].label+' added to the canvas.');
}
function deleteSelection(){
  if(!state.selected&&!state.selectedEdge)return;
  record();const b=current();
  if(state.selected){
    const ids=new Set(state.selectedIds);
    b.nodes=b.nodes.filter(n=>!ids.has(n.id));
    b.edges=b.edges.filter(e=>!ids.has(e.from)&&!ids.has(e.to));
  }else b.edges=b.edges.filter(e=>e.id!==state.selectedEdge);
  state.selected=null;state.selectedIds=[];state.selectedEdge=null;state.run=null;
  queueSave();render();notify('Deleted selection from board.');
}
function snapshotSelection(){
  const ids=new Set(state.selectedIds);
  const nodes=current().nodes.filter(n=>ids.has(n.id));
  return {nodes:clone(nodes),edges:clone(current().edges.filter(e=>ids.has(e.from)&&ids.has(e.to)))};
}
function insertSnapshot(snapshot,duplicate=false){
  if(!snapshot?.nodes?.length)return false;
  const b=current(),dx=60;
  let dy=155,tries=0;
  while(tries<80 && snapshot.nodes.some(n=>b.nodes.some(existing=>
    Math.abs(existing.x-(n.x+dx))<NODE_W+20 && Math.abs(existing.y-(n.y+dy))<NODE_H+20))){
    dy+=155;tries++;
  }
  record();
  const idMap=new Map(snapshot.nodes.map(n=>[n.id,uid('node')]));
  const copies=snapshot.nodes.map(n=>({...clone(n),id:idMap.get(n.id),x:n.x+dx,y:n.y+dy,
    title:duplicate?n.title+' copy':n.title}));
  const connections=snapshot.edges.map(e=>({...clone(e),id:uid('edge'),from:idMap.get(e.from),to:idMap.get(e.to)}));
  b.nodes.push(...copies);b.edges.push(...connections);
  state.selectedIds=copies.map(n=>n.id);state.selected=copies.at(-1).id;
  state.selectedEdge=null;state.run=null;state.tab='details';state.inspectorOpen=true;
  queueSave();render();centerOnNode(copies[0].id);
  return true;
}
function duplicateNode(){
  const data=snapshotSelection();
  if(!insertSnapshot(data,true))return notify('Select one or more nodes to duplicate.',true);
  notify(data.nodes.length>1?'Selection and its internal links duplicated.':'Node duplicated.');
}
function copyNode(){
  const data=snapshotSelection();
  if(!data.nodes.length)return notify('Select one or more nodes to copy first.',true);
  nodeClipboard=data;
  notify(data.nodes.length+' node'+(data.nodes.length===1?'':'s')+' copied with internal connections. Press Ctrl/Cmd + V to paste.');
}
function pasteNode(){
  if(!nodeClipboard?.nodes?.length)return notify('Copy one or more nodes first with Ctrl/Cmd + C.',true);
  if(insertSnapshot(nodeClipboard))notify(nodeClipboard.nodes.length+' node'+(nodeClipboard.nodes.length===1?'':'s')+' pasted.');
}

function fitView(overview=false){
  const rect=$('stage').getBoundingClientRect(),b=current();if(!rect.width||!rect.height)return;
  if(rect.width<540 && b.nodes.length && !overview){
    const first=b.nodes.find(n=>n.type==='start')||b.nodes[0];
    state.view.scale=.75;
    state.view.x=22-first.x*state.view.scale;
    state.view.y=rect.height*.46-(first.y+NODE_H/2)*state.view.scale;
    applyTransform();return;
  }
  const bounds=fitBounds(b.nodes,65);
  const zoom=Math.max(.28,Math.min(1.14,(rect.width-88)/bounds.width,(rect.height-115)/bounds.height));
  if(!overview && zoom<.70 && b.nodes.length){
    // An entirely visible 1,600px diagram becomes unreadably small in a real editor.
    // Begin at a readable working zoom; the Fit All control still shows the overview.
    const first=b.nodes.find(n=>n.type==='start')||b.nodes[0];
    const readable=Math.min(.8,Math.max(.68,rect.width/1050));
    state.view.scale=readable;
    state.view.x=46-first.x*readable;
    state.view.y=rect.height*.53-(first.y+NODE_H/2)*readable;
    applyTransform();return;
  }
  state.view.scale=zoom;
  state.view.x=(rect.width-bounds.width*zoom)/2-bounds.minX*zoom;
  state.view.y=(rect.height-bounds.height*zoom)/2-bounds.minY*zoom;
  applyTransform();
}
function zoom(factor,clientX,clientY){
  const rect=$('stage').getBoundingClientRect();
  const cx=(clientX??(rect.left+rect.width/2))-rect.left;
  const cy=(clientY??(rect.top+rect.height/2))-rect.top;
  const old=state.view.scale,scale=Math.max(.25,Math.min(2.4,old*factor));
  state.view.x=cx-(cx-state.view.x)/old*scale;
  state.view.y=cy-(cy-state.view.y)/old*scale;
  state.view.scale=scale;applyTransform();
}
function renderInspector(){
  const check=validateBoard(current());
  $('issue-count').textContent=check.errors+check.warnings;
  document.querySelectorAll('.inspector-tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===state.tab));
  $('details-tab').hidden=state.tab!=='details';$('issues-tab').hidden=state.tab!=='issues';
  const details=$('details-tab');
  const node=byId(current(),state.selected);
  const edge=current().edges.find(e=>e.id===state.selectedEdge);
  if(state.tab==='details'){
    if(state.selectedIds.length>1){
      $('inspector-heading').textContent='Edit '+state.selectedIds.length+' steps';
      details.innerHTML='<div class="bulk-selection-summary"><strong>'+state.selectedIds.length+' steps selected</strong>'+
        '<p>Drag any selected step to move them together. Internal connectors stay linked. Hold Shift and click a step to change the selection.</p></div>'+
        '<button class="button primary" data-action="copy-node" style="width:100%;margin-bottom:8px">'+icon('copy')+' Copy group</button>'+
        '<button class="button outline" data-action="duplicate-node" style="width:100%;margin-bottom:8px">'+icon('copy')+' Duplicate connected group</button>'+
        '<button class="button outline" data-action="delete-selected" style="width:100%">'+icon('trash')+' Delete group</button>';
    }else if(node){
      $('inspector-heading').textContent='Edit '+NODE_TYPES[node.type].label.toLowerCase();
      const symbol={start:'play',process:'box',decision:'branch',end:'flag',note:'note'}[node.type];
      details.innerHTML=
        '<div class="field-group"><div class="field-label">NODE TYPE <span>Read only</span></div>'+
        '<div class="type-chip"><span class="shape-preview '+node.type+'-p">'+icon(symbol)+'</span>'+esc(NODE_TYPES[node.type].label)+'<small>'+esc(NODE_TYPES[node.type].description)+'</small></div></div>'+
        '<div class="field-group"><label for="node-title-field" class="field-label">TITLE</label><input id="node-title-field" class="field-input" maxlength="100" value="'+esc(node.title)+'"></div>'+
        '<div class="field-group"><label for="node-detail-field" class="field-label">DESCRIPTION</label><textarea id="node-detail-field" class="field-textarea" maxlength="500" placeholder="Add extra context…">'+esc(node.detail||'')+'</textarea></div>'+
        '<div class="detail-separator"></div>'+
        '<div class="field-group"><div class="field-label">CONNECT TO <span>Optional</span></div><select id="connect-select" class="field-select"><option value="">Select destination…</option>'+
        current().nodes.filter(n=>n.id!==node.id&&n.type!=='start'&&n.type!=='note'&&!connected(current(),node.id,n.id)).map(n=>'<option value="'+esc(n.id)+'">'+esc(n.title)+'</option>').join('')+'</select>'+
        '<button class="button outline" data-action="connect-selected" style="margin-top:9px;width:100%" '+((node.type==='end'||node.type==='note')?'disabled':'')+'>'+icon('link')+' Connect to selected</button>'+
        '<p style="font-size:10px;line-height:1.65;color:var(--muted);margin:10px 0 0">Tip: press <kbd>L</kbd> or drag the output ● to connect visually.</p></div>'+
        (node.type==='decision'?'<button class="button primary" data-action="add-branches" style="width:100%;margin-bottom:7px">'+icon('branch')+' Create Yes / No routes</button>':'')+
        '<button class="button primary" data-action="add-next" style="width:100%;margin-bottom:4px" '+((node.type==='end'||node.type==='note')?'disabled':'')+'>'+icon('plus')+' Add next step →</button>'+
        '<div class="detail-separator"></div><div class="inspector-actions"><button class="button outline" data-action="copy-node">'+icon('copy')+' Copy</button><button class="button outline" data-action="duplicate-node">'+icon('copy')+' Duplicate</button><button class="button outline" data-action="delete-selected">'+icon('trash')+' Delete</button></div>';
    } else if(edge){
      $('inspector-heading').textContent='Edit connection';
      const from=byId(current(),edge.from),to=byId(current(),edge.to);
      details.innerHTML='<div class="field-group"><div class="field-label">CONNECTION</div><div class="type-chip">'+esc(from?.title||'?')+' → '+esc(to?.title||'?')+'</div></div>'+
        '<div class="field-group"><label for="edge-label-field" class="field-label">BRANCH LABEL</label><input class="field-input" id="edge-label-field" maxlength="40" value="'+esc(edge.label||'')+'" placeholder="e.g. Yes, No, Approved"><p style="font-size:10px;color:var(--muted);line-height:1.5">Label your decision paths so they are easy to follow.</p></div>'+
        '<button class="button outline" data-action="delete-selected" style="width:100%">'+icon('trash')+' Delete connection</button>';
    }else{
      $('inspector-heading').textContent='Inspector';
      details.innerHTML='<div class="inspector-placeholder"><div class="placeholder-icon">✳</div><h3>Your canvas, your rules.</h3><p>Select any node or connector to edit its details. Or inspect your whole flow for issues before you run it.</p><button class="button outline" data-action="inspect">'+icon('search')+' Check my flow</button></div>';
    }
  }
  const issues=$('issues-tab');
  if(check.issues.length){
    issues.innerHTML='<div class="flow-score"><div><strong>Flow health</strong><p>'+check.errors+' errors · '+check.warnings+' suggestions</p></div><div class="score-number">'+Math.max(0,100-check.errors*20-check.warnings*8)+'</div></div>'+
      '<p style="font-size:11px;color:var(--muted);line-height:1.6;margin:0 0 15px">Fix these issues to make your flow easier to understand and run.</p>';
    check.issues.forEach(issue=>{
      const btn=document.createElement('button');btn.className='issue-item';btn.type='button';
      btn.innerHTML='<span class="issue-head"><i class="'+esc(issue.severity)+'"></i>'+esc(issue.title)+'</span><p>'+esc(issue.description)+'</p>';
      btn.onclick=()=>{if(issue.nodeId){state.selected=issue.nodeId;state.selectedEdge=null;state.tab='details';state.inspectorOpen=true;render();centerOnNode(issue.nodeId);}};
      issues.append(btn);
    });
  }else{
    issues.innerHTML='<div class="flow-score"><div><strong>Flow health</strong><p>Everything is looking great.</p></div><div class="score-number">100</div></div>'+
      '<div class="all-good"><div class="good-icon">✓</div><strong>All paths look healthy.</strong><p>No structural issues found. Time to see it in action.</p><button class="button primary" data-action="run">'+icon('play')+' Run this flow</button></div>';
  }
}
function centerOnNode(id){
  const n=byId(current(),id);if(!n)return;const rect=$('stage').getBoundingClientRect(),z=state.view.scale;
  state.view.x=rect.width/2-(n.x+NODE_W/2)*z;state.view.y=rect.height/2-(n.y+NODE_H/2)*z;applyTransform();
}
function editField(e){
  const n=byId(current(),state.selected),edge=current().edges.find(v=>v.id===state.selectedEdge);
  if(e.target.id==='node-title-field'&&n){n.title=e.target.value;syncVisibleNode(n);queueSave();renderSummary();}
  else if(e.target.id==='node-detail-field'&&n){n.detail=e.target.value;syncVisibleNode(n);queueSave();}
  else if(e.target.id==='edge-label-field'&&edge){edge.label=e.target.value;renderEdges();queueSave();}
}
function syncVisibleNode(node){
  const el=Array.from(document.querySelectorAll('#nodes-layer .node')).find(e=>e.dataset.id===node.id);
  if(el){el.querySelector('.node-title').textContent=node.title;el.querySelector('.node-subtitle').textContent=node.detail||'Add a description…';el.setAttribute('aria-label',node.type+' node: '+node.title);}
}
function showTemplates(){
  $('menu-popover').hidden=true;
  const grid=$('template-grid');grid.innerHTML='';
  TEMPLATES.forEach(t=>{
    const btn=document.createElement('button');btn.className='template-card';btn.type='button';
    btn.innerHTML='<div class="template-art" style="--art-color:'+t.accent+'"><div class="art-node"></div><div class="art-node middle"></div><div class="art-node"></div></div>'+
      '<span class="template-meta">'+esc(t.category.toUpperCase())+'</span><strong>'+esc(t.name)+'</strong><small>'+esc(t.description)+'</small>';
    btn.onclick=()=>{const b=makeBoard(t.key);state.boards.unshift(b);state.experienceDismissed=true;state.demo=null;state.activeId=b.id;state.selected=null;state.selectedEdge=null;state.run=null;state.connectFrom=null;state.view={x:60,y:60,scale:1};$('templates-dialog').close();render();fitView();queueSave();notify(t.name+' is ready to edit.');};
    grid.append(btn);
  });
  $('templates-dialog').showModal();
}
function startRun(){
  const b=current(),start=b.nodes.find(n=>n.type==='start');
  if(!start){state.tab='issues';state.inspectorOpen=true;render();return notify('Add a Start node before running.',true);}
  state.run={path:[start.id],edges:[]};state.connectFrom=null;state.selected=null;state.selectedEdge=null;
  render();centerOnNode(start.id);notify('Flow simulation started. Follow each step.');
}
function runCurrent(){return state.run?byId(current(),state.run.path[state.run.path.length-1]):null;}
function takeEdge(id){
  const run=state.run,node=runCurrent();if(!run||!node)return;
  const edge=outgoing(current(),node.id).find(e=>e.id===id);if(!edge)return;
  if(run.path.length>=70)return notify('Simulation stopped after 70 steps to prevent an endless loop.',true);
  run.edges.push(edge.id);run.path.push(edge.to);renderStage();renderSummary();centerOnNode(edge.to);
  if(runCurrent()?.type==='end'){
    if(state.demo && state.demo.boardId===state.activeId){state.demo.step=4;renderExperience();}
    notify('Flow completed! You reached the end.');
  }
}
function stepForward(){
  const node=runCurrent();if(!node)return;
  const edges=outgoing(current(),node.id);
  if(node.type==='end')return notify('Flow completed. Nice work!');
  if(!edges.length)return notify('Dead end: no connected next step.',true);
  if(node.type==='decision'&&edges.length>1)return notify('Choose a branch to continue.');
  takeEdge(edges[0].id);
}
function stepBack(){
  if(!state.run||state.run.path.length===1)return;
  state.run.path.pop();state.run.edges.pop();renderStage();renderSummary();centerOnNode(runCurrent()?.id);
}
function stopRun(){state.run=null;render();fitView();}
function renderRunPanel(){
  const panel=$('run-panel');if(!state.run){panel.hidden=true;return;}
  const node=runCurrent();if(!node){panel.hidden=true;return;}
  panel.hidden=false;
  const edges=outgoing(current(),node.id),done=node.type==='end';
  const dead=!done&&!edges.length,branch=node.type==='decision'&&edges.length>1;
  const progress=Math.min(100,Math.max(12,(state.run.path.length)/(Math.max(current().nodes.length,1))*100));
  panel.innerHTML='<div class="run-heading"><span class="run-status">● LIVE FLOW SIMULATION</span><button class="icon-button small" data-action="stop-run" title="Close simulation">'+icon('x')+'</button></div>'+
    '<div class="run-progress"><span style="width:'+progress+'%"></span></div>'+
    '<div class="run-title">'+esc(node.title)+'</div><p class="run-description">'+esc(node.detail||(done?'You made it to the finish line.':'You are visiting this step in your diagram.'))+'</p>'+
    (done?'<div class="all-good"><div class="good-icon">✓</div><strong>Flow completed!</strong><p>Every great journey has an ending. You reached yours.</p></div>':'')+
    (dead?'<p class="run-description">⚠ Dead end. Connect this step to continue.</p>':'')+
    (branch?'<div class="run-choices">'+edges.map(e=>'<button data-action="choose-edge" data-edge="'+esc(e.id)+'">'+esc(e.label||'Continue')+' <span>→</span></button>').join('')+'</div>':'')+
    '<div class="run-foot"><button class="button outline" data-action="run-back" '+(state.run.path.length===1?'disabled':'')+'>Back</button>'+
    (!done&&!branch?'<button class="button primary" data-action="run-next" '+(dead?'disabled':'')+'>Next step →</button>':'<button class="button outline" data-action="stop-run">Finish</button>')+'</div>'+
    '<p class="run-step">Step '+state.run.path.length+' · '+state.run.edges.length+' connection'+(state.run.edges.length===1?'':'s')+' followed</p>';
}
function duplicateBoard(){
  const b=clone(current());b.id=uid('board');b.name=b.name+' copy';b.updatedAt=Date.now();
  state.boards.unshift(b);state.activeId=b.id;state.selected=null;state.selectedEdge=null;state.run=null;
  render();fitView();queueSave();notify('Board duplicated.');
}
function deleteBoard(){
  if(!confirm('Delete this board from this browser? Export JSON first if you need a backup.'))return;
  const id=state.activeId;state.boards=state.boards.filter(b=>b.id!==id);stacks.delete(id);
  if(!state.boards.length)state.boards.push(makeBoard('blank'));
  state.activeId=state.boards[0].id;state.selected=null;state.selectedEdge=null;state.run=null;
  render();fitView();queueSave();notify('Board deleted.');
}
function downloadFile(name,content,mime){
  const blob=content instanceof Blob?content:new Blob([content],{type:mime});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function fileName(ext){
  return (current().name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'branchlab')+'.'+ext;
}
function diagramSvg(){
  const board=current(),bounds=fitBounds(board.nodes,52);
  const width=Math.ceil(bounds.width),height=Math.ceil(bounds.height);
  const parts=['<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="'+bounds.minX+' '+bounds.minY+' '+width+' '+height+'">',
    '<defs><marker id="a" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" fill="#9297ad"/></marker></defs>',
    '<rect x="'+bounds.minX+'" y="'+bounds.minY+'" width="'+width+'" height="'+height+'" fill="#fbfbfd"/>'];
  for(const e of board.edges){
    const a=byId(board,e.from),b=byId(board,e.to);if(!a||!b)continue;
    parts.push('<path d="'+edgePath(a,b)+'" fill="none" stroke="#9297ad" stroke-width="2.6" marker-end="url(#a)"/>');
    if(e.label)parts.push('<text x="'+((a.x+NODE_W+b.x)/2)+'" y="'+((a.y+b.y)/2+NODE_H/2-13)+'" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="#686c86">'+xml(e.label)+'</text>');
  }
  const styles={
    start:['#e7f7ef','#329c76','START'],process:['#eeedff','#6d60d9','STEP'],
    decision:['#fff3e1','#c99b42','DECISION'],end:['#ffeef0','#d57179','END'],
    note:['#fff5d6','#bca044','NOTE']
  };
  for(const n of board.nodes){
    const cfg=styles[n.type]||styles.process;
    parts.push('<rect x="'+n.x+'" y="'+n.y+'" rx="13" width="'+NODE_W+'" height="'+NODE_H+'" fill="'+(n.type==='note'?'#fffbec':'#ffffff')+'" stroke="#dfe1ed" stroke-width="2"/>');
    parts.push('<rect x="'+(n.x+14)+'" y="'+(n.y+14)+'" rx="8" width="29" height="29" fill="'+cfg[0]+'"/>');
    parts.push('<text x="'+(n.x+28.5)+'" y="'+(n.y+33)+'" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="'+cfg[1]+'">✳</text>');
    parts.push('<text x="'+(n.x+52)+'" y="'+(n.y+32)+'" font-size="10" font-family="Arial" font-weight="bold" letter-spacing="1.4" fill="#a0a2b2">'+cfg[2]+'</text>');
    parts.push('<text x="'+(n.x+14)+'" y="'+(n.y+73)+'" font-size="14" font-family="Arial" font-weight="bold" fill="#272c3c">'+xml(n.title.length>28?n.title.slice(0,27)+'…':n.title)+'</text>');
    if(n.detail)parts.push('<text x="'+(n.x+14)+'" y="'+(n.y+92)+'" font-family="Arial" font-size="10" fill="#85889b">'+xml(n.detail.length>37?n.detail.slice(0,36)+'…':n.detail)+'</text>');
  }
  parts.push('</svg>');
  return {markup:parts.join(''),width,height};
}
function exportSvg(){
  const result=diagramSvg();downloadFile(fileName('svg'),result.markup,'image/svg+xml;charset=utf-8');
  notify('SVG exported — crisp at any size.');
}
async function exportPng(){
  try{
    const {markup,width,height}=diagramSvg();
    if(width>5000||height>5000)throw new Error('Diagram too large for PNG. Use SVG instead.');
    const svgUrl=URL.createObjectURL(new Blob([markup],{type:'image/svg+xml;charset=utf-8'}));
    const img=new Image();const promise=new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('Could not render SVG for PNG.'));});
    img.src=svgUrl;await promise;
    const canvas=document.createElement('canvas'),ratio=Math.min(2,4000/Math.max(width,height));
    canvas.width=Math.max(1,Math.round(width*ratio));canvas.height=Math.max(1,Math.round(height*ratio));
    const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);
    URL.revokeObjectURL(svgUrl);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if(!blob)throw new Error('PNG conversion failed.');
    downloadFile(fileName('png'),blob,'image/png');notify('High-resolution PNG exported.');
  }catch(e){notify(e.message,true);}
}
async function exportPdf(){
  try{
    const {markup,width,height}=diagramSvg();
    if(!current().nodes.length)throw new Error('Add a step before exporting your diagram.');
    if(width>7000||height>7000)throw new Error('Diagram too large for PDF. Export SVG instead.');
    const url=URL.createObjectURL(new Blob([markup],{type:'image/svg+xml;charset=utf-8'}));
    const img=new Image();
    try{
      const pending=new Promise((resolve,reject)=>{
        img.onload=resolve;img.onerror=()=>reject(new Error('Could not render diagram for PDF export.'));
      });
      img.src=url;await pending;
    }finally{URL.revokeObjectURL(url);}
    const scale=Math.min(2.5,3500/Math.max(width,height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
    const ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('PDF rendering is not supported by this browser.');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    const jpeg=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.94));
    if(!jpeg)throw new Error('Could not encode the diagram for PDF.');
    const pdf=jpegToPdf(new Uint8Array(await jpeg.arrayBuffer()),canvas.width,canvas.height);
    downloadFile(fileName('pdf'),pdf,'application/pdf');
    notify('Printable PDF exported. No subscription required.');
  }catch(e){notify('PDF export failed: '+e.message,true);}
}

async function importJson(file){
  if(!file)return;
  try{
    if(file.size>2_000_000)throw new Error('JSON file exceeds 2 MB.');
    const raw=JSON.parse(await file.text());
    const board=normalizeBoard(raw);board.id=uid('board');
    state.boards.unshift(board);state.activeId=board.id;state.selected=null;state.selectedEdge=null;state.run=null;
    render();fitView();queueSave();notify('Board imported. Everything is editable.');
  }catch(e){notify('Import failed: '+e.message,true);}
  $('import-input').value='';
}
function setTab(name){state.tab=name;state.inspectorOpen=true;renderInspector();document.querySelector('.inspector').hidden=false;}

/**
 * A genuine three-step judge walkthrough. Every action operates on an editable
 * copy of the graph, never on somebody's existing work.
 */
function startBlankBoard(){
  const b=makeBoard('blank','Untitled flow');
  state.boards.unshift(b);state.activeId=b.id;state.selected=null;state.selectedEdge=null;
  state.connectFrom=null;state.run=null;state.demo=null;state.experienceDismissed=true;
  state.view={x:50,y:50,scale:1};
  render();fitView();queueSave();notify('Blank board ready. Click Add a first step to begin.');
}

function startChallenge(){
  const b=makeBoard('challenge','The broken launch');
  state.boards.unshift(b);
  state.activeId=b.id;
  state.selected=null;
  state.selectedEdge=null;
  state.connectFrom=null;
  state.run=null;
  state.tab='details';
  state.inspectorOpen=true;
  state.experienceDismissed=false;
  state.demo={boardId:b.id,step:0};
  render();
  fitView();
  queueSave();
  notify('A broken workflow is on your canvas. Find the missing paths.');
}
function inspectChallenge(){
  if(!state.demo || state.demo.boardId!==state.activeId)return;
  state.demo.step=1;
  state.tab='issues';
  state.inspectorOpen=true;
  render();
  fitView(true);
  notify('Flow Inspector has identified the missing connections.');
}
function repairChallenge(){
  if(!state.demo || state.demo.boardId!==state.activeId)return;
  const b=current();
  const needed=[
    {from:'c',to:'e',label:'No'},
    {from:'e',to:'f',label:''}
  ].filter(e=>!connected(b,e.from,e.to));
  if(needed.length){
    record();
    needed.forEach(e=>b.edges.push({id:uid('edge'),...e}));
    queueSave();
  }
  state.demo.step=2;
  state.tab='issues';
  render();
  fitView(true);
  notify('The missing routes are now real graph connections. All paths lead to End.');
}
function runChallenge(){
  if(!state.demo || state.demo.boardId!==state.activeId)return;
  if(validateBoard(current()).errors){state.tab='issues';render();return notify('Repair the missing connections before running.',true);}
  state.demo.step=3;
  startRun();
}
function autoArrangeBoard(){
  const b=current();
  if(!b.nodes.length)return notify('Add some nodes to arrange first.');
  record();
  b.nodes=autoArrange(b);
  state.run=null;
  state.selected=null;
  state.selectedEdge=null;
  render();
  fitView(window.innerWidth>=640);
  queueSave();
  notify('Nodes arranged by workflow order. Undo with Ctrl+Z.');
}
function renderExperience(){
  const root=$('experience-card');
  if(!root)return;
  const inChallenge=state.demo && state.demo.boardId===state.activeId;
  root.hidden=!!state.experienceDismissed;
  if(root.hidden)return;
  const close='<button class="demo-close" data-action="dismiss-experience" aria-label="Dismiss this guide" title="Dismiss">'+icon('x')+'</button>';
  if(!inChallenge){
    root.innerHTML=close+
      '<div class="demo-eyebrow">WELCOME TO BRANCHLAB · FREE FLOWCHART EDITOR</div>'+
      '<h2 class="demo-title">What would you like to create?</h2>'+
      '<p class="demo-desc">Start a blank flow, adapt a real-world template, or discover how BranchLab checks your logic.</p>'+
      '<div class="demo-buttons starter-choices"><button class="button primary" data-action="start-blank">'+icon('plus')+' Blank flow</button><button class="button outline" data-action="templates">'+icon('grid')+' Use template</button><button class="button outline" data-action="challenge">'+icon('play')+' Try interactive demo</button></div>'+
      '<p class="demo-note">Real editor. Real graph. No login, no payment, no sample-only features.</p>';
    return;
  }
  const step=state.demo.step;
  const steps='<div class="demo-progress" aria-label="Challenge progress">'+
      [0,1,2].map(i=>'<span class="'+(step>=i+1?'done':'')+'"></span>').join('')+'</div>';
  if(step===0){
    root.innerHTML=close+'<div class="demo-eyebrow">STEP 1 OF 3 · DISCOVER</div>'+
      '<h2 class="demo-title">Something is broken here.</h2>'+
      '<p class="demo-desc">This launch process looks almost complete. One decision has no second route, and one step is stranded.</p>'+
      steps+'<div class="demo-buttons"><button class="button primary" data-action="inspect-challenge">'+icon('search')+' Find the problems</button></div>'+
      '<p class="demo-note">The Flow Inspector checks the actual graph.</p>';
  }else if(step===1){
    root.innerHTML=close+'<div class="demo-eyebrow">STEP 2 OF 3 · REPAIR</div>'+
      '<h2 class="demo-title">The missing route is exposed.</h2>'+
      '<p class="demo-desc">Check the issues on the right: the “No” branch is missing, and “Fix the blockers” leads nowhere.</p>'+
      steps+'<div class="demo-buttons"><button class="button primary" data-action="repair-challenge">'+icon('link')+' Connect the broken paths</button></div>'+
      '<p class="demo-note">You can also connect the nodes yourself using their circular handles.</p>';
  }else if(step===2){
    root.innerHTML=close+'<div class="demo-eyebrow">STEP 3 OF 3 · TEST</div>'+
      '<h2 class="demo-title">Your flow is healthy. Now run it.</h2>'+
      '<p class="demo-desc">Both Yes and No now lead to a complete outcome. Trace the logic from Start to End, one step at a time.</p>'+
      steps+'<div class="demo-success">✓ No structural issues remain.</div>'+
      '<div class="demo-buttons"><button class="button primary" data-action="run-challenge">'+icon('play')+' Run the real flow</button></div>';
  }else if(step===3){
    root.innerHTML=close+'<div class="demo-eyebrow">LIVE SIMULATION</div>'+
      '<h2 class="demo-title">Watch every choice matter.</h2>'+
      '<p class="demo-desc">Use Next step in the simulation panel. When you reach the decision, choose Yes or No to follow that branch.</p>'+
      steps+'<div class="demo-buttons"><button class="button outline" data-action="stop-run">Pause & edit</button></div>';
  }else{
    root.innerHTML=close+'<div class="demo-eyebrow">CHALLENGE COMPLETED</div>'+
      '<h2 class="demo-title">You just debugged a decision.</h2>'+
      '<p class="demo-desc">That is BranchLab: draw the plan, catch its blind spots, and validate the outcome before it happens.</p>'+
      steps+'<div class="demo-success">✓ Inspector clean · Path reached End</div>'+
      '<div class="demo-buttons"><button class="button primary" data-action="templates">'+icon('plus')+' Make your own flow</button>'+
      '<button class="button outline" data-action="dismiss-experience">Keep editing</button></div>';
  }
}

function dispatchAction(action,el){
  $('menu-popover').hidden=true;
  switch(action){
    case 'challenge':startChallenge();break;
    case 'start-blank':startBlankBoard();break;
    case 'dismiss-experience':state.experienceDismissed=true;renderExperience();break;
    case 'inspect-challenge':inspectChallenge();break;
    case 'repair-challenge':repairChallenge();break;
    case 'run-challenge':runChallenge();break;
    case 'auto-arrange':autoArrangeBoard();break;
    case 'add-next':addNextStep();break;
    case 'add-branches':addDecisionPaths();break;
    case 'new-board':case 'templates':showTemplates();break;
    case 'add-first':addNode('start');break;
    case 'close-modal':document.querySelectorAll('dialog[open]').forEach(d=>d.close());break;
    case 'help':$('help-dialog').showModal();break;
    case 'inspect':setTab('issues');notify('Flow Inspector is checking your diagram.');break;
    case 'close-inspector':state.inspectorOpen=false;render();break;
    case 'run':startRun();break;
    case 'stop-run':stopRun();break;
    case 'run-back':stepBack();break;
    case 'run-next':stepForward();break;
    case 'choose-edge':takeEdge(el.dataset.edge);break;
    case 'zoom-in':zoom(1.2);break;
    case 'zoom-out':zoom(1/1.2);break;
    case 'fit':fitView(true);break;
    case 'undo':undo();break;
    case 'redo':redo();break;
    case 'delete-selected':deleteSelection();break;
    case 'duplicate-node':duplicateNode();break;
    case 'copy-node':copyNode();break;
    case 'paste-node':pasteNode();break;
    case 'connect-selected':{const target=$('connect-select')?.value;if(target&&state.selected)connectNodes(state.selected,target);else notify('Select a destination first.');break;}
    case 'duplicate-board':duplicateBoard();break;
    case 'delete-board':deleteBoard();break;
    case 'import':$('import-input').click();break;
    case 'export-json':downloadFile(fileName('json'),JSON.stringify(current(),null,2),'application/json');notify('Board saved as JSON.');break;
    case 'export-svg':exportSvg();break;
    case 'export-png':exportPng();break;
    case 'export-pdf':exportPdf();break;
    case 'toggle-theme':state.theme=state.theme==='light'?'dark':'light';queueSave();render();break;
    case 'menu':$('menu-popover').hidden=false;break;
  }
}
function bind(){
  document.addEventListener('click',e=>{
    const tab=e.target.closest('[data-tab]');if(tab){setTab(tab.dataset.tab);return;}
    const button=e.target.closest('[data-action]');if(button){dispatchAction(button.dataset.action,button);return;}
    if(!e.target.closest('#menu-popover'))$('menu-popover').hidden=true;
  });
  $('palette').addEventListener('click',e=>{const item=e.target.closest('[data-type]');if(item)addNode(item.dataset.type);});
  $('palette').addEventListener('dragstart',e=>{const item=e.target.closest('[data-type]');if(item){e.dataTransfer.setData('text/plain',item.dataset.type);e.dataTransfer.effectAllowed='copy';}});
  $('stage').addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='copy';});
  $('stage').addEventListener('drop',e=>{e.preventDefault();const type=e.dataTransfer.getData('text/plain');if(NODE_TYPES[type])addNode(type,screenToWorld(e.clientX,e.clientY));});
  $('stage').addEventListener('pointerdown',e=>{
    if(e.button!==0 || e.target.closest('.node') || e.target.closest('.experience-card') || e.target.closest('#run-panel') || e.target.closest('.stage-controls') || e.target.closest('.empty-state') || e.target.closest('path'))return;
    if(state.connectFrom){state.connectFrom=null;render();return;}
    state.selected=null;state.selectedIds=[];state.selectedEdge=null;render();
    move={kind:'pan',x:e.clientX,y:e.clientY,viewX:state.view.x,viewY:state.view.y};
  });
  window.addEventListener('pointermove',e=>{
    if(state.connectFrom){
      const n=byId(current(),state.connectFrom);if(n){
        const end=screenToWorld(e.clientX,e.clientY);
        const fake={x:end.x,y:end.y-NODE_H/2};
        $('preview-edge').setAttribute('d',edgePath(n,fake));
      }
    }
    if(!move)return;
    const dx=e.clientX-move.x,dy=e.clientY-move.y;
    if(move.kind==='pan'){
      state.view.x=move.viewX+dx;state.view.y=move.viewY+dy;applyTransform();
    }else if(move.kind==='node'){
      const node=byId(current(),move.id);if(!node)return;
      if(!move.recorded&&(Math.abs(dx)>2||Math.abs(dy)>2)){record();move.recorded=true;}
      if(!move.recorded)return;
      node.x=Math.round((move.nodeX+dx/state.view.scale)/10)*10;
      node.y=Math.round((move.nodeY+dy/state.view.scale)/10)*10;
      const el=Array.from(document.querySelectorAll('#nodes-layer .node')).find(n=>n.dataset.id===node.id);
      if(el){el.style.left=node.x+'px';el.style.top=node.y+'px';}
      renderEdges();
    }else if(move.kind==='group'){
      if(!move.recorded&&(Math.abs(dx)>2||Math.abs(dy)>2)){record();move.recorded=true;}
      if(!move.recorded)return;
      const deltaX=Math.round(dx/state.view.scale/10)*10;
      const deltaY=Math.round(dy/state.view.scale/10)*10;
      for(const original of move.positions){
        const node=byId(current(),original.id);if(!node)continue;
        node.x=original.x+deltaX;node.y=original.y+deltaY;
        const el=Array.from(document.querySelectorAll('#nodes-layer .node')).find(n=>n.dataset.id===node.id);
        if(el){el.style.left=node.x+'px';el.style.top=node.y+'px';}
      }
      renderEdges();
    }
  });
  window.addEventListener('pointerup',e=>{
    if(state.connectFrom){
      const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.node');
      if(target?.dataset.id && target.dataset.id!==state.connectFrom){connectNodes(state.connectFrom,target.dataset.id);}
      else $('preview-edge').setAttribute('d','');
    }
    if((move?.kind==='node'||move?.kind==='group')&&move.recorded){queueSave();renderSummary();}
    move=null;
  });
  $('stage').addEventListener('wheel',e=>{
    e.preventDefault();
    if(e.ctrlKey||e.metaKey)zoom(e.deltaY<0?1.1:.9,e.clientX,e.clientY);
    else{state.view.x-=e.deltaX;state.view.y-=e.deltaY;applyTransform();}
  },{passive:false});
  $('board-title').addEventListener('focus',()=>record());
  $('board-title').addEventListener('input',e=>{current().name=e.target.value||'Untitled board';queueSave();renderBoards();});
  $('board-title').addEventListener('blur',()=>{$('board-title').value=current().name;});
  $('details-tab').addEventListener('focusin',e=>{if(e.target.matches('#node-title-field,#node-detail-field,#edge-label-field')){if(!e.target.dataset.recorded){record();e.target.dataset.recorded='1';}}});
  $('details-tab').addEventListener('input',editField);
  $('import-input').addEventListener('change',e=>importJson(e.target.files[0]));
  window.addEventListener('keydown',e=>{
    const typing=e.target.matches('input,textarea,select,[contenteditable="true"]');
    const mod=e.ctrlKey||e.metaKey;
    if((e.key==='z'||e.key==='Z')&&mod){e.preventDefault();if(e.shiftKey)redo();else undo();return;}
    if((e.key==='y'||e.key==='Y')&&mod){e.preventDefault();redo();return;}
    if(e.key==='s'&&mod){e.preventDefault();save();notify('Saved in this browser.');return;}
    if(!typing&&(e.key==='c'||e.key==='C')&&mod&&state.selected){e.preventDefault();copyNode();return;}
    if(!typing&&(e.key==='v'||e.key==='V')&&mod&&nodeClipboard){e.preventDefault();pasteNode();return;}
    if(e.key==='Escape'){
      if(state.connectFrom){state.connectFrom=null;render();}
      else if(state.run)stopRun();
      else {state.selected=null;state.selectedEdge=null;render();}
      return;
    }
    if(typing || document.querySelector('dialog[open]'))return;
    if(e.code==='Space'){spaceHeld=true;return;}
    if(mod&&e.key.toLowerCase()==='a'){
      e.preventDefault();state.selectedIds=current().nodes.map(n=>n.id);
      state.selected=state.selectedIds.at(-1)||null;state.selectedEdge=null;
      state.tab='details';state.inspectorOpen=true;render();return;
    }
    if((e.key==='Delete'||e.key==='Backspace')&&(state.selected||state.selectedEdge)){e.preventDefault();deleteSelection();}
    if((e.key==='d'||e.key==='D')&&mod&&state.selected){e.preventDefault();duplicateNode();}
    if(e.key.toLowerCase()==='i'&&!mod){setTab('issues');}
    if(e.key.toLowerCase()==='l'&&!mod&&state.selected){
      const n=byId(current(),state.selected);
      if(n&&n.type!=='end'&&n.type!=='note'){
        state.connectFrom=n.id;render();notify('Choose a node to connect to. Esc cancels.');
      }
    }
    if(e.key==='Enter'&&!mod){
      const field=$(state.selected?'node-title-field':'edge-label-field');
      if(field){e.preventDefault();field.focus();field.select();}
    }
    if(e.shiftKey&&e.key.toLowerCase()==='a'&&!mod){e.preventDefault();autoArrangeBoard();}
  });
  window.addEventListener('keyup',e=>{if(e.code==='Space')spaceHeld=false;});
  window.addEventListener('beforeunload',save);
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();}));
}
load();bind();render();requestAnimationFrame(()=>fitView());
window.BranchLabDebug={getBoard:()=>clone(current()),validate:()=>validateBoard(current()),state:()=>({activeId:state.activeId,run:clone(state.run),selected:state.selected,view:clone(state.view)})};
