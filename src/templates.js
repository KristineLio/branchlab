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
