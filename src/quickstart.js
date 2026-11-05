import {uid,outgoing,analyzeOutcomes,validateBoard,addDecisionBranches} from './graph.js';

const named=(name,fallback)=>String(name??'').trim().slice(0,100)||fallback;
const getNode=(board,id)=>board.nodes.find(n=>n.id===id);
const route=(board,from,type)=>{
  if(!from)return null;
  return outgoing(board,from.id).map(edge=>getNode(board,edge.to)).find(node=>node?.type===type)||null;
};

export function getQuickStartStep(board){
  const start=board.nodes.find(n=>n.type==='start');
  if(!start)return 'start';
  const action=route(board,start,'process');
  if(!action)return 'process';
  const decision=route(board,action,'decision');
  if(!decision)return 'decision';
  const next=(label)=>outgoing(board,decision.id)
    .filter(e=>(e.label||'').trim().toLowerCase()===label)
    .map(e=>getNode(board,e.to)).find(n=>n?.type==='process');
  const yes=next('yes'),no=next('no');
  if(!yes||!no)return 'branches';
  const coverage=analyzeOutcomes(board);
  const both=coverage.routes.filter(r=>r.decisionId===decision.id);
  if(both.length!==2||!both.every(r=>r.covered))return 'finish';
  return board.quickStartChecked?(validateBoard(board).issues.length===0?'done':'fix'):'check';
}

/**
 * Progressive, honest start-to-finish workflow builder. Every click mutates the
 * same diagram used by the editor, inspector and simulation. The owner can
 * rename and rearrange every generated step; no hidden sample-only graph.
 */
export function advanceQuickStart(board,labels={}){
  const step=getQuickStartStep(board);
  if(step==='done')return {step,created:[],message:'This workflow is already ready to use.'};
  if(step==='check'){
    board.quickStartChecked=true;
    return {step,created:[],message:'The structural check is ready.'};
  }
  const create=(type,x,y,title,detail='')=>{
    const node={id:uid('node'),type,x,y,title,detail};
    board.nodes.push(node);
    return node;
  };
  const connect=(a,b,label='')=>{
    if(!board.edges.some(e=>e.from===a.id&&e.to===b.id))
      board.edges.push({id:uid('edge'),from:a.id,to:b.id,label});
  };
  const start=board.nodes.find(n=>n.type==='start');
  const action=route(board,start,'process');
  const decision=route(board,action,'decision');
  let created=[],message='';
  if(step==='start'){
    created=[create('start',80,220,named(labels.title,'A request arrives'))];
    message='Your starting point is ready.';
  }else if(step==='process'){
    const node=create('process',start.x+310,start.y,named(labels.title,'Review the request'));
    connect(start,node);created=[node];
    message='Your first action is connected.';
  }else if(step==='decision'){
    const node=create('decision',action.x+310,action.y,named(labels.title,'Can we proceed?'));
    connect(action,node);created=[node];
    message='Your decision is connected to the process.';
  }else if(step==='branches'){
    const result=addDecisionBranches(board,decision.id);
    created=result.created;
    if(!created.length)return {step,created:[],message:result.reason||'Review this decision before adding outcomes.'};
    for(const node of created){
      const edge=board.edges.find(e=>e.to===node.id&&e.from===decision.id);
      if(edge?.label==='Yes')node.title=named(labels.yes,'Proceed with the request');
      if(edge?.label==='No')node.title=named(labels.no,'Escalate for review');
    }
    message='Yes and No are both connected and editable.';
  }else if(step==='finish'){
    const endings=board.nodes.filter(n=>n.type==='end');
    const branches=outgoing(board,decision.id)
      .filter(e=>['yes','no'].includes((e.label||'').trim().toLowerCase()))
      .map(e=>getNode(board,e.to)).filter(Boolean);
    const finish=endings[0]||create('end',Math.max(...branches.map(n=>n.x))+310,
      Math.round(branches.reduce((n,node)=>n+node.y,0)/branches.length),
      named(labels.title,'Share the outcome'));
    if(!endings.length)created=[finish];
    for(const node of branches)connect(node,finish);
    message='Both outcomes now reach a finished step.';
  }
  board.quickStartChecked=false;
  return {step,created,message};
}
