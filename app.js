// ── STATE ── (global, available to all modules)
let CU = null;   // Current User (Supabase Auth)
let CP = null;   // Current Profile (DB)
let allProducts = [];
let allCustomers = [];
let allProfiles = [];
let currentWeek = 1;
let selAgentId = null;
let saleItems = [];

// ── HELPERS ──
function st(msg, type='ok') {
  const el = document.getElementById('smsg');
  const dot = document.getElementById('sdot');
  if(el) el.textContent = msg;
  if(dot) dot.style.background = type==='ok'?'#059669':type==='loading'?'#d97706':'#dc2626';
}

function kpi(l,v,s,t='teal'){
  return `<div class="kpi ${t}"><div class="kpi-lbl">${l}</div><div class="kpi-val">${v}</div><div class="kpi-sub">${s}</div></div>`;
}

function badge(text, cls){
  return `<span class="badge ${cls}">${text}</span>`;
}

function abcBadge(cls){
  const map={'AA':'bg-blue','AB':'bg-teal','BA':'bg-amber','BB':'bg-red'};
  return `<span class="badge ${map[cls]||'bg-red'} abc-${cls}">${cls}</span>`;
}

function fmtNum(n){
  return (parseFloat(n)||0).toLocaleString('ar-SA',{minimumFractionDigits:0,maximumFractionDigits:2});
}

function confirm(msg, icon='⚠️'){
  return new Promise(res=>{
    document.getElementById('cm').textContent=msg;
    document.getElementById('ci').textContent=icon;
    const ov=document.getElementById('confirm-overlay');
    ov.style.display='flex';
    document.getElementById('cy').onclick=()=>{ov.style.display='none';res(true);};
    document.getElementById('cn').onclick=()=>{ov.style.display='none';res(false);};
  });
}

// ── WIRE ALL BUTTONS ──
function wireButtons(){
  // Auth
  document.getElementById('btn-login').addEventListener('click',doLogin);
  document.getElementById('li-pass').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
  document.getElementById('li-email').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('li-pass').focus();});
  document.getElementById('btn-logout').addEventListener('click',doLogout);
  document.getElementById('btn-chpw').addEventListener('click',doChpw);

  // Forgot password
  document.getElementById('btn-forgot').addEventListener('click',function(){
    const box=document.getElementById('forgot-box');
    const isOpen=box.style.display!=='none';
    box.style.display=isOpen?'none':'block';
    this.textContent=isOpen?'نسيت كلمة المرور؟':'✖️ إلغاء';
    if(!isOpen){const em=document.getElementById('li-email');if(em.value)document.getElementById('forgot-email').value=em.value;}
  });
  document.getElementById('btn-reset').addEventListener('click',async function(){
    const email=document.getElementById('forgot-email').value.trim();
    const msg=document.getElementById('reset-msg');
    if(!email){alert('يرجى إدخال البريد الإلكتروني');return;}
    this.disabled=true;this.textContent='جاري الإرسال...';
    const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:window.location.href});
    this.disabled=false;this.textContent='إرسال رابط إعادة التعيين';
    msg.style.display='block';
    if(error){msg.style.background='#fee2e2';msg.style.color='#991b1b';msg.textContent='خطأ: '+error.message;}
    else{msg.style.background='#dcfce7';msg.style.color='#166534';msg.textContent='✓ تم الإرسال — تحقق من بريدك';}
  });

  // Password toggles
  document.querySelectorAll('.pw-eye').forEach(btn=>{
    btn.addEventListener('click',function(){
      const inp=document.getElementById(this.dataset.t);
      if(!inp)return;
      inp.type=inp.type==='password'?'text':'password';
      this.textContent=inp.type==='text'?'🙈':'👁️';
    });
  });

  // Visit page
  document.getElementById('v-customer').addEventListener('change',function(){
    document.getElementById('v-customer-new').style.display=this.value==='__new__'?'block':'none';
  });
  document.getElementById('v-date').addEventListener('change',loadTodayVisits);
  document.getElementById('btn-add-item').addEventListener('click',()=>{saleItems.push({product_id:'',lot:'',qty:'',price:''});renderSaleItems();});
  document.getElementById('btn-save-visit').addEventListener('click',saveVisit);
  document.getElementById('btn-clear-visit').addEventListener('click',()=>{initSaleItems();document.getElementById('v-notes').value='';document.getElementById('v-next').value='';document.getElementById('v-customer').value='';});

  // Week tabs
  document.querySelectorAll('.wtab').forEach(btn=>btn.addEventListener('click',function(){
    currentWeek=parseInt(this.dataset.w);
    document.querySelectorAll('.wtab').forEach(t=>t.classList.remove('active'));
    this.classList.add('active');
    loadWeekly();
  }));

  // Customer form
  document.getElementById('btn-new-customer').addEventListener('click',()=>{clearCustomerForm();loadAgentSelect();showPage('customer-form');});
  document.getElementById('btn-save-customer').addEventListener('click',saveCustomer);
  document.getElementById('btn-cancel-customer').addEventListener('click',()=>showPage('customers'));
  document.getElementById('btn-back-customers').addEventListener('click',()=>showPage('customers'));

  // Search
  document.getElementById('cust-search').addEventListener('input',function(){loadCustomers(this.value);});
  document.getElementById('prod-search').addEventListener('input',function(){loadProducts(this.value);});

  // Users
  document.getElementById('btn-add-user').addEventListener('click',addUser);

  // Setup
  document.getElementById('btn-save-setup').addEventListener('click',saveSetup);

  // Dashboard
  document.getElementById('btn-dash-refresh').addEventListener('click',loadDashboard);
  document.getElementById('dash-month').addEventListener('change',loadDashboard);

  // Performance
  document.getElementById('btn-perf-refresh').addEventListener('click',loadPerformance);
  document.getElementById('perf-month').addEventListener('change',loadPerformance);

  // Reports
  document.getElementById('btn-rep-refresh').addEventListener('click',loadCompanyReport);
  document.getElementById('rep-month').addEventListener('change',loadCompanyReport);

  // Stagnant / Unvisited / Top Products
  document.getElementById('btn-stagnant-refresh').addEventListener('click',loadStagnant);
  document.getElementById('btn-unvisited-refresh').addEventListener('click',loadUnvisited);
  document.getElementById('tp-month').addEventListener('change',loadTopProducts);

  // New product
  document.getElementById('btn-new-product')?.addEventListener('click',()=>{
    const name=prompt('اسم المنتج:');
    const code=prompt('كود المنتج:');
    if(name&&code){sb.from('products').insert({name,code}).then(()=>{loadProducts();loadMasterData();});}
  });

  // Print buttons
  document.getElementById('btn-print-daily').addEventListener('click',()=>{document.getElementById('ph-sub').textContent='مبيعات يوم '+document.getElementById('v-date').value;window.print();});
  document.getElementById('btn-print-plan').addEventListener('click',()=>{document.getElementById('ph-sub').textContent='الخطة الشهرية — '+CP.month;window.print();});
  document.getElementById('btn-print-weekly').addEventListener('click',()=>{document.getElementById('ph-sub').textContent='المتابعة الأسبوعية — الأسبوع '+currentWeek;window.print();});
  document.getElementById('btn-print-perf').addEventListener('click',()=>{document.getElementById('ph-sub').textContent='تقرير أداء — '+CP.fullname;window.print();});
  document.getElementById('btn-print-customers').addEventListener('click',()=>{document.getElementById('ph-sub').textContent='قائمة العملاء';window.print();});
  document.getElementById('btn-print-class').addEventListener('click',()=>{document.getElementById('ph-sub').textContent='تقرير تصنيف العملاء';window.print();});
  document.getElementById('btn-print-tp').addEventListener('click',()=>{document.getElementById('ph-sub').textContent='المنتجات الأكثر حركة';window.print();});
  document.getElementById('btn-print-stagnant').addEventListener('click',()=>{document.getElementById('ph-sub').textContent='المنتجات الراكدة';window.print();});
  document.getElementById('btn-print-rep').addEventListener('click',()=>{document.getElementById('ph-sub').textContent='تقرير الشركة الشامل';window.print();});

  // Auth state change (password reset flow)
  sb.auth.onAuthStateChange(async(event,session)=>{
    if(event==='PASSWORD_RECOVERY'){
      CU=session.user;
      const {data:prof}=await sb.from('profiles').select('*').eq('id',CU.id).single();
      CP=prof;
      document.getElementById('login-screen').style.display='none';
      document.getElementById('chpw-sub').textContent='أدخل كلمة مرور جديدة';
      document.getElementById('chpw-overlay').style.display='flex';
    }
  });
}

// ── INIT ──
wireButtons();
sb.auth.getSession().then(({data:{session}})=>{
  if(session){
    CU=session.user;
    sb.from('profiles').select('*').eq('id',CU.id).single().then(({data:prof})=>{
      if(prof){CP=prof;if(prof.is_first_login)showChpwModal(true);else initApp();}
    });
  }
});
