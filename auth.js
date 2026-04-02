// ── AUTH ──
async function doLogin(){
  const email=document.getElementById('li-email').value.trim();
  const pass=document.getElementById('li-pass').value;
  const err=document.getElementById('li-err');
  const btn=document.getElementById('btn-login');
  err.style.display='none';
  if(!email||!pass){err.style.display='block';err.textContent='يرجى إدخال البريد وكلمة المرور';return;}
  btn.disabled=true; btn.textContent='جاري تسجيل الدخول...';
  const {data,error}=await sb.auth.signInWithPassword({email,password:pass});
  btn.disabled=false; btn.textContent='تسجيل الدخول';
  if(error){err.style.display='block';err.textContent='البريد أو كلمة المرور غير صحيحة';return;}
  CU=data.user;
  const {data:prof}=await sb.from('profiles').select('*').eq('id',CU.id).single();
  if(!prof){err.style.display='block';err.textContent='لم يتم العثور على بيانات المستخدم';return;}
  CP=prof;
  if(prof.is_first_login){showChpwModal(true);}else{initApp();}
}

async function doLogout(){
  const ok=await confirm('هل تريد تسجيل الخروج؟','👋');
  if(!ok)return;
  await sb.auth.signOut();
  CU=null;CP=null;
  document.getElementById('app').style.display='none';
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('li-email').value='';
  document.getElementById('li-pass').value='';
}

function showChpwModal(isFirst=false){
  const ov=document.getElementById('chpw-overlay');
  document.getElementById('chpw-sub').textContent=isFirst?'أول تسجيل دخول — يرجى تغيير كلمة المرور للمتابعة':'تغيير كلمة المرور';
  ov.style.display='flex';
}

async function doChpw(){
  const np=document.getElementById('chpw-new').value;
  const nc=document.getElementById('chpw-confirm').value;
  const err=document.getElementById('chpw-err');
  err.style.display='none';
  if(np.length<8){err.style.display='block';err.textContent='يجب أن تكون 8 أحرف على الأقل';return;}
  if(np!==nc){err.style.display='block';err.textContent='كلمتا المرور غير متطابقتين';return;}
  const {error}=await sb.auth.updateUser({password:np});
  if(error){err.style.display='block';err.textContent='خطأ: '+error.message;return;}
  await sb.from('profiles').update({is_first_login:false}).eq('id',CU.id);
  CP.is_first_login=false;
  document.getElementById('chpw-overlay').style.display='none';
  initApp();
}

// ── APP INIT ──
async function initApp(){
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app').style.display='block';
  document.getElementById('nav-name').textContent=CP.fullname;
  document.getElementById('nav-role').textContent=CP.role==='manager'?'مدير':'مندوب';
  document.getElementById('v-date').value=new Date().toISOString().split('T')[0];
  document.getElementById('perf-month').value=new Date().toISOString().slice(0,7);
  document.getElementById('dash-month').value=new Date().toISOString().slice(0,7);
  document.getElementById('tp-month').value=new Date().toISOString().slice(0,7);
  document.getElementById('rep-month').value=new Date().toISOString().slice(0,7);
  if(CP.month) document.getElementById('setup-month').value=CP.month;
  else document.getElementById('setup-month').value=new Date().toISOString().slice(0,7);
  await loadMasterData();
  buildMenubar();
  showPage(CP.role==='manager'?'dashboard':'visit');
}

// ── MASTER DATA ──
async function loadMasterData(){
  st('جاري تحميل البيانات...','loading');
  const [{data:prods},{data:custs},{data:profs}]=await Promise.all([
    sb.from('products').select('*').eq('is_active',true).order('name'),
    sb.from('customers').select('*,profiles!assigned_agent_id(fullname)').eq('is_active',true).order('name'),
    sb.from('profiles').select('*').order('fullname')
  ]);
  allProducts=prods||[];
  allCustomers=custs||[];
  allProfiles=profs||[];
  st('جاهز');
}

// ── MENUBAR ──
function buildMenubar(){
  const menus=document.getElementById('mb-menus');
  menus.innerHTML='';
  const isManager=CP.role==='manager';

  // SVG icon set — clean, consistent
  const icons={
    dashboard: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    visit:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    plan:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    weekly:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>`,
    perf:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    customers:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    newcust:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="12" y1="17" x2="12" y2="23"/><line x1="9" y1="20" x2="15" y2="20"/></svg>`,
    class:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    unvisited:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    products: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
    stagnant: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>`,
    topprods: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
    report:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
    users:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    setup:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>`,
  };

  const menuData=[
    {
      label:'الرئيسية',
      pages:[{page:'dashboard',label:'لوحة التحكم',icon:icons.dashboard}]
    },
    {
      label:'المبيعات',
      group:'تسجيل ومتابعة',
      pages:[
        {page:'visit',   label:'تسجيل زيارة / مبيعة', icon:icons.visit},
        {page:'plan',    label:'الخطة الشهرية',        icon:icons.plan},
        {page:'weekly',  label:'المتابعة الأسبوعية',   icon:icons.weekly},
        {page:'perf',    label:'تقييم أدائي',           icon:icons.perf},
      ]
    },
    {
      label:'العملاء',
      group:'إدارة العملاء',
      pages:[
        {page:'customers',     label:'قائمة العملاء',         icon:icons.customers},
        {page:'customer-form', label:'إضافة عميل جديد',       icon:icons.newcust},
        {page:'cust-class',    label:'تقرير التصنيف ABC',     icon:icons.class},
        {page:'unvisited',     label:'العملاء غير المزارين',  icon:icons.unvisited},
      ]
    },
    {
      label:'المنتجات',
      group:'مخزون وحركة',
      pages:[
        {page:'products',     label:'قائمة المنتجات',   icon:icons.products},
        {page:'stagnant',     label:'المنتجات الراكدة', icon:icons.stagnant},
        {page:'top-products', label:'الأكثر مبيعاً',    icon:icons.topprods},
      ]
    },
    ...(isManager?[
      {
        label:'التقارير',
        group:'تحليل وأداء',
        pages:[
          {page:'report-company',label:'تقرير الشركة الشامل',icon:icons.report},
        ]
      },
      {
        label:'الإعدادات',
        group:'النظام',
        pages:[
          {page:'users', label:'إدارة المستخدمين', icon:icons.users},
          {page:'setup', label:'إعداد الخطة',       icon:icons.setup},
        ]
      },
    ]:[
      {
        label:'الإعدادات',
        pages:[{page:'setup',label:'إعداد الخطة',icon:icons.setup}]
      },
    ])
  ];

  menuData.forEach(m=>{
    const div=document.createElement('div');
    div.className='mb-menu';

    const btn=document.createElement('button');
    btn.className='mb-menu-btn';
    btn.innerHTML=m.label+' <span class="arrow">▾</span>';

    const dd=document.createElement('div');
    dd.className='mb-dropdown';

    // Group header
    if(m.group){
      const title=document.createElement('div');
      title.className='mb-dd-title';
      title.textContent=m.group;
      dd.appendChild(title);
    }

    m.pages.forEach(p=>{
      const item=document.createElement('div');
      item.className='mb-dd-item';
      item.innerHTML=`<span class="dd-icon">${p.icon}</span><span>${p.label}</span>`;
      item.addEventListener('click',()=>{
        closeDds();
        showPage(p.page);
        // Mark active menu
        document.querySelectorAll('.mb-menu-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
      });
      dd.appendChild(item);
    });

    btn.addEventListener('click',e=>{
      e.stopPropagation();
      const isOpen=dd.classList.contains('open');
      closeDds();
      if(!isOpen){ dd.classList.add('open'); btn.classList.add('open'); }
    });

    div.appendChild(btn);
    div.appendChild(dd);
    menus.appendChild(div);
  });

  document.addEventListener('click', closeDds);
}

function closeDds(){
  document.querySelectorAll('.mb-dropdown').forEach(d=>d.classList.remove('open'));
  document.querySelectorAll('.mb-menu-btn').forEach(b=>b.classList.remove('open'));
}

// ── SHOW PAGE ──
function showPage(name){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const pg=document.getElementById('page-'+name);
  if(pg) pg.classList.add('active');
  if(name==='dashboard')loadDashboard();
  else if(name==='visit'){loadVisitSelects();loadTodayVisits();}
  else if(name==='plan')loadPlan();
  else if(name==='weekly')loadWeekly();
  else if(name==='perf')loadPerformance();
  else if(name==='customers')loadCustomers();
  else if(name==='customer-form'){clearCustomerForm();loadAgentSelect();}
  else if(name==='cust-class')loadClassReport();
  else if(name==='unvisited')loadUnvisited();
  else if(name==='products')loadProducts();
  else if(name==='stagnant')loadStagnant();
  else if(name==='top-products')loadTopProducts();
  else if(name==='report-company')loadCompanyReport();
  else if(name==='users'){loadUsers();loadAuditLog();}
  else if(name==='setup')loadSetup();
}
