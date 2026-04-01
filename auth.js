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
  const menuData=[
    {label:'📊 الرئيسية',pages:[{page:'dashboard',label:'لوحة التحكم',icon:'🏠'}]},
    {label:'💼 المبيعات',pages:[
      {page:'visit',label:'تسجيل زيارة/مبيعة',icon:'📝'},
      {page:'plan',label:'الخطة الشهرية',icon:'📋'},
      {page:'weekly',label:'المتابعة الأسبوعية',icon:'📅'},
      {page:'perf',label:'تقييم أدائي',icon:'📊'},
    ]},
    {label:'👥 العملاء',pages:[
      {page:'customers',label:'استعراض العملاء',icon:'👥'},
      {page:'customer-form',label:'عميل جديد',icon:'➕'},
      {page:'cust-class',label:'تقرير التصنيف',icon:'🏷️'},
      {page:'unvisited',label:'العملاء غير المزارين',icon:'⚠️'},
    ]},
    {label:'📦 المنتجات',pages:[
      {page:'products',label:'استعراض المنتجات',icon:'📦'},
      {page:'stagnant',label:'المنتجات الراكدة',icon:'📉'},
      {page:'top-products',label:'الأكثر حركة',icon:'📈'},
    ]},
    ...(isManager?[
      {label:'📈 التقارير',pages:[
        {page:'report-company',label:'تقرير الشركة الشامل',icon:'🏢'},
      ]},
      {label:'⚙️ الإعدادات',pages:[
        {page:'users',label:'إدارة المستخدمين',icon:'👥'},
        {page:'setup',label:'إعداد الخطة',icon:'⚙️'},
      ]},
    ]:[
      {label:'⚙️ إعداداتي',pages:[
        {page:'setup',label:'إعداد الخطة',icon:'⚙️'},
      ]},
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
    m.pages.forEach(p=>{
      const item=document.createElement('div');
      item.className='mb-dd-item';
      item.innerHTML=`<span>${p.icon}</span> ${p.label}`;
      item.addEventListener('click',()=>{closeDds();showPage(p.page);btn.classList.remove('active','open');});
      dd.appendChild(item);
    });
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      const isOpen=dd.classList.contains('open');
      closeDds();
      if(!isOpen){dd.classList.add('open');btn.classList.add('open');}
    });
    div.appendChild(btn); div.appendChild(dd);
    menus.appendChild(div);
  });
  document.addEventListener('click',closeDds);
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
