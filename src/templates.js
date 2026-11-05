export const TEMPLATES = [
  {
    key: 'signup',
    name: 'User onboarding',
    category: 'Product',
    description: 'Map and test a signup experience with a branching decision.',
    accent: '#6259ed',
    nodes: [
      {id:'a',type:'start',x:80,y:250,title:'Visitor arrives',detail:'The first impression matters.'},
      {id:'b',type:'process',x:350,y:250,title:'Explore the product',detail:'Preview benefits and choose to register.'},
      {id:'c',type:'decision',x:650,y:250,title:'Already has an account?',detail:'Send returning users to the right next step.'},
      {id:'d',type:'process',x:980,y:100,title:'Sign in',detail:'Use existing account credentials.'},
      {id:'e',type:'process',x:980,y:395,title:'Create an account',detail:'Collect minimum required information.'},
      {id:'f',type:'end',x:1270,y:250,title:'Welcome aboard',detail:'User reaches the main workspace.'}
    ],
    edges: [
      {id:'ab',from:'a',to:'b',label:''},{id:'bc',from:'b',to:'c',label:''},
      {id:'cd',from:'c',to:'d',label:'Yes'},{id:'ce',from:'c',to:'e',label:'No'},
      {id:'df',from:'d',to:'f',label:''},{id:'ef',from:'e',to:'f',label:''}
    ]
  },
  {
    key: 'support',
    name: 'Support triage',
    category: 'Operations',
    description: 'Turn messy customer requests into a calm, repeatable playbook.',
    accent: '#f39a54',
    nodes: [
      {id:'a',type:'start',x:70,y:210,title:'New support request',detail:'Ticket arrives via email or chat.'},
      {id:'b',type:'process',x:330,y:210,title:'Understand the issue',detail:'Gather screenshots and symptoms.'},
      {id:'c',type:'decision',x:650,y:210,title:'Can we resolve it?',detail:'Does the first-line team have the answer?'},
      {id:'d',type:'process',x:990,y:40,title:'Apply the solution',detail:'Explain steps and verify with the user.'},
      {id:'e',type:'process',x:990,y:360,title:'Escalate to specialist',detail:'Send context to the appropriate team.'},
      {id:'f',type:'end',x:1280,y:200,title:'Close the ticket',detail:'Confirm resolution and document it.'}
    ],
    edges: [
      {id:'ab',from:'a',to:'b',label:''},{id:'bc',from:'b',to:'c',label:''},
      {id:'cd',from:'c',to:'d',label:'Yes'},{id:'ce',from:'c',to:'e',label:'No'},
      {id:'df',from:'d',to:'f',label:''},{id:'ef',from:'e',to:'f',label:''}
    ]
  },
  {
    key: 'approval',
    name: 'Expense approval',
    category: 'Business',
    description: 'A clear approval process for small teams.',
    accent: '#27978d',
    nodes: [
      {id:'a',type:'start',x:100,y:230,title:'Expense submitted',detail:'Employee uploads a receipt.'},
      {id:'b',type:'process',x:380,y:230,title:'Review the request',detail:'Check policy and available budget.'},
      {id:'c',type:'decision',x:680,y:230,title:'Within budget?',detail:'Can we reimburse the request?'},
      {id:'d',type:'process',x:1000,y:75,title:'Approve payment',detail:'Schedule reimbursement.'},
      {id:'e',type:'process',x:1000,y:390,title:'Request changes',detail:'Explain what needs adjusting.'},
      {id:'f',type:'end',x:1300,y:230,title:'Notify employee',detail:'Share the outcome of the review.'}
    ],
    edges: [
      {id:'ab',from:'a',to:'b',label:''},{id:'bc',from:'b',to:'c',label:''},
      {id:'cd',from:'c',to:'d',label:'Yes'},{id:'ce',from:'c',to:'e',label:'No'},
      {id:'df',from:'d',to:'f',label:''},{id:'ef',from:'e',to:'f',label:''}
    ]
  },
  {
    key: 'bugtriage',
    name: 'Bug triage',
    category: 'Software',
    description: 'Prioritize a reported bug, choose an urgent fix or backlog, and close the loop.',
    accent: '#6f80de',
    nodes: [
      {id:'a',type:'start',x:80,y:220,title:'Bug reported',detail:'Capture reproduction steps and expected behavior.'},
      {id:'b',type:'process',x:390,y:220,title:'Reproduce and assess',detail:'Confirm the issue and identify its impact.'},
      {id:'c',type:'decision',x:700,y:220,title:'Blocking users?',detail:'Is the issue critical or security sensitive?'},
      {id:'d',type:'process',x:1030,y:60,title:'Fix and deploy urgently',detail:'Patch, test and communicate the change.'},
      {id:'e',type:'process',x:1030,y:390,title:'Prioritize in backlog',detail:'Estimate, assign and schedule the fix.'},
      {id:'f',type:'end',x:1360,y:220,title:'Update the reporter',detail:'Share status, owner and next steps.'}
    ],
    edges: [
      {id:'ab',from:'a',to:'b',label:''},{id:'bc',from:'b',to:'c',label:''},
      {id:'cd',from:'c',to:'d',label:'Yes'},{id:'ce',from:'c',to:'e',label:'No'},
      {id:'df',from:'d',to:'f',label:''},{id:'ef',from:'e',to:'f',label:''}
    ]
  },
  {
    key: 'studyplan',
    name: 'Study session planner',
    category: 'Education',
    description: 'Plan a focused study block, handle knowledge gaps, and finish with a review.',
    accent: '#47a09c',
    nodes: [
      {id:'a',type:'start',x:80,y:220,title:'Choose a learning goal',detail:'Decide exactly what you will be able to explain.'},
      {id:'b',type:'process',x:390,y:220,title:'Study and practice',detail:'Read the material, then solve one exercise.'},
      {id:'c',type:'decision',x:700,y:220,title:'Can you explain it?',detail:'Test yourself without looking at notes.'},
      {id:'d',type:'process',x:1030,y:60,title:'Practice independently',detail:'Complete a new question without assistance.'},
      {id:'e',type:'process',x:1030,y:390,title:'Review the gaps',detail:'Revisit the concept and write an example.'},
      {id:'f',type:'end',x:1360,y:220,title:'Record progress',detail:'Note your confidence and the next topic.'}
    ],
    edges: [
      {id:'ab',from:'a',to:'b',label:''},{id:'bc',from:'b',to:'c',label:''},
      {id:'cd',from:'c',to:'d',label:'Yes'},{id:'ce',from:'c',to:'e',label:'No'},
      {id:'df',from:'d',to:'f',label:''},{id:'ef',from:'e',to:'f',label:''}
    ]
  },
  {
    key: 'contentapproval',
    name: 'Content approval',
    category: 'Marketing',
    description: 'Move creative work from draft to publishing without losing track of feedback.',
    accent: '#dc855c',
    nodes: [
      {id:'a',type:'start',x:80,y:220,title:'Content requested',detail:'Brief, channel and deadline are agreed.'},
      {id:'b',type:'process',x:390,y:220,title:'Draft and review',detail:'Create the asset and check requirements.'},
      {id:'c',type:'decision',x:700,y:220,title:'Approved to publish?',detail:'Does the draft meet quality and brand standards?'},
      {id:'d',type:'process',x:1030,y:60,title:'Schedule the release',detail:'Choose a channel and publishing time.'},
      {id:'e',type:'process',x:1030,y:390,title:'Revise from feedback',detail:'Record the requested changes and owner.'},
      {id:'f',type:'end',x:1360,y:220,title:'Confirm next steps',detail:'Record publication or a new review date.'}
    ],
    edges: [
      {id:'ab',from:'a',to:'b',label:''},{id:'bc',from:'b',to:'c',label:''},
      {id:'cd',from:'c',to:'d',label:'Yes'},{id:'ce',from:'c',to:'e',label:'No'},
      {id:'df',from:'d',to:'f',label:''},{id:'ef',from:'e',to:'f',label:''}
    ]
  },
  {
    key: 'challenge',
    name: 'Unresolved support request',
    category: 'Interactive challenge',
    description: 'Catch a support escalation gap before a customer gets forgotten.',
    accent: '#ea9d61',
    nodes: [
      {id:'a',type:'start',x:80,y:220,title:'Customer asks for help',detail:'A support request arrives via email or chat.'},
      {id:'b',type:'process',x:390,y:220,title:'Investigate the issue',detail:'Check the symptoms and the account history.'},
      {id:'c',type:'decision',x:700,y:220,title:'Resolved on first reply?',detail:'Both the solved and unsolved outcomes need a next step.'},
      {id:'d',type:'process',x:1030,y:60,title:'Confirm the solution',detail:'Verify that the customer can proceed.'},
      {id:'e',type:'process',x:1030,y:390,title:'Escalate to specialist',detail:'Transfer the context and assign an owner.'},
      {id:'f',type:'end',x:1360,y:220,title:'Update the customer',detail:'Confirm the resolution or explain the escalation and next update.'}
    ],
    edges: [
      {id:'ab',from:'a',to:'b',label:''},
      {id:'bc',from:'b',to:'c',label:''},
      {id:'cd',from:'c',to:'d',label:'Yes'},
      {id:'df',from:'d',to:'f',label:''}
    ]
  },
  {
    key: 'blank',
    name: 'Blank canvas',
    category: 'Workspace',
    description: 'Start with a fresh idea. Make the first connection yours.',
    accent: '#8a92a4',
    nodes: [],
    edges: []
  }
];

export function makeBoard(templateKey='signup', name) {
  const source = TEMPLATES.find(t => t.key === templateKey) || TEMPLATES[0];
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'board-' + Date.now() + '-' + Math.random().toString(36).slice(2,7);
  return {
    id,
    name: name || source.name,
    template: source.key,
    updatedAt: Date.now(),
    nodes: source.nodes.map(n => ({...n})),
    edges: source.edges.map(e => ({...e}))
  };
}
