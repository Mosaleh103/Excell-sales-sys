// ── CUSTOMERS ──
async function loadCustomers(search=''){
  st('جاري تحميل العملاء...','loading');
  let q=sb.from('customers').select('*,profiles!assigned_agent_id(fullname)').eq('is_active',true).order('name');
  if(CP.role!=='manager') q=q.eq('assigned_agent_id',CP.id);
  if(search) q=q.ilike('name','%'+search+'%');
  const {data}=await q;
  const tbody=document.getElementById('customers-body');
  tbody.innerHTML='';
  if(!(data||[]).length){tbody.innerHTML='<tr><td colspan="7" class="empty-state"><div class="ei">👥</div>لا يوجد عملاء</td></tr>';st('جاهز');return;}
  (data||[]).forEach(c=>{
    const abc=c.final_classification||c.manual_classification||'BB';
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${c.account_no}</td><td style="text-align:right;font-weight:700;">${c.name}</td><td>${c.profiles?.fullname||'—'}</td><td>${abcBadge(abc)}</td><td>${c.monthly_target>0?fmtNum(c.monthly_target)+' ر.س':'—'}</td><td>${badge(c.is_active?'نشط':'موقوف',c.is_active?'bg-green':'bg-red')}</td><td class="no-print" style="white-space:nowrap;"><button class="btn bp btn-sm edit-cust" data-id="${c.id}" style="margin-left:4px;">✏️</button><button class="btn br btn-sm del-cust" data-id="${c.id}" data-name="${c.name}">🗑</button></td>`;
    tr.querySelector('.edit-cust').addEventListener('click',()=>editCustomer(c));
    tr.querySelector('.del-cust').addEventListener('click',()=>deleteCustomer(c.id,c.name));
    tbody.appendChild(tr);
  });
  st('جاهز');
}

function loadAgentSelect(){
  const sel=document.getElementById('cf-agent');
  sel.innerHTML='<option value="">-- اختر المندوب --</option>';
  allProfiles.filter(p=>p.role==='agent').forEach(p=>{sel.innerHTML+=`<option value="${p.id}">${p.fullname}</option>`;});
}

function clearCustomerForm(){
  ['cf-id','cf-account','cf-name','cf-phone','cf-address','cf-notes'].forEach(id=>{document.getElementById(id).value='';});
  document.getElementById('cf-class').value='BB';
  document.getElementById('cf-target').value='';
  document.getElementById('cf-agent').value='';
  document.getElementById('cform-title').textContent='👤 عميل جديد';
}

function editCustomer(c){
  document.getElementById('cf-id').value=c.id;
  document.getElementById('cf-account').value=c.account_no;
  document.getElementById('cf-name').value=c.name;
  document.getElementById('cf-phone').value=c.phone||'';
  document.getElementById('cf-address').value=c.address||'';
  document.getElementById('cf-class').value=c.manual_classification||'BB';
  document.getElementById('cf-target').value=c.monthly_target||'';
  document.getElementById('cf-notes').value=c.notes||'';
  document.getElementById('cf-agent').value=c.assigned_agent_id||'';
  document.getElementById('cform-title').textContent='✏️ تعديل عميل: '+c.name;
  showPage('customer-form');
}

async function saveCustomer(){
  const id=document.getElementById('cf-id').value;
  const acc=document.getElementById('cf-account').value.trim();
  const name=document.getElementById('cf-name').value.trim();
  if(!acc||!name){alert('رقم الحساب والاسم مطلوبان');return;}
  const data={account_no:acc,name,phone:document.getElementById('cf-phone').value,address:document.getElementById('cf-address').value,manual_classification:document.getElementById('cf-class').value,monthly_target:parseFloat(document.getElementById('cf-target').value)||0,notes:document.getElementById('cf-notes').value,assigned_agent_id:document.getElementById('cf-agent').value||null};
  st('جاري الحفظ...','loading');
  if(id){await sb.from('customers').update(data).eq('id',id);}
  else{await sb.from('customers').insert(data);}
  await loadMasterData();
  st('تم حفظ العميل ✓');
  showPage('customers');
}

async function deleteCustomer(id,name){
  const ok=await confirm(`حذف العميل "${name}"؟ لن يتم حذف بياناته التاريخية.`,'🗑️');
  if(!ok)return;
  await sb.from('customers').update({is_active:false}).eq('id',id);
  await loadMasterData();
  loadCustomers();
  st('تم الحذف ✓');
}

// ── CLASSIFICATION REPORT ──
async function loadClassReport(){
  st('جاري تحميل تقرير التصنيف...','loading');
  let q=sb.from('customers').select('*,profiles!assigned_agent_id(fullname)').eq('is_active',true).order('final_classification');
  if(CP.role!=='manager') q=q.eq('assigned_agent_id',CP.id);
  const {data}=await q;
  ['AA','AB','BA','BB'].forEach(c=>{document.getElementById('cnt-'+c).textContent=(data||[]).filter(d=>(d.final_classification||d.manual_classification||'BB')===c).length;});
  const tbody=document.getElementById('class-body');
  tbody.innerHTML='';
  (data||[]).forEach(c=>{
    const abc=c.final_classification||c.manual_classification||'BB';
    const tr=document.createElement('tr');
    tr.innerHTML=`<td style="text-align:right;font-weight:700;">${c.name}</td><td>${c.profiles?.fullname||'—'}</td><td>${abcBadge(abc)}</td><td>—</td><td>—</td><td>—</td>`;
    tbody.appendChild(tr);
  });
  st('جاهز');
}

// ── UNVISITED CUSTOMERS ──
async function loadUnvisited(){
  st('جاري البحث...','loading');
  const days=parseInt(document.getElementById('unvisited-days').value)||7;
  const cutoff=new Date();cutoff.setDate(cutoff.getDate()-days);
  const cutoffStr=cutoff.toISOString().split('T')[0];
  let q=sb.from('customers').select('*,profiles!assigned_agent_id(fullname)').eq('is_active',true);
  if(CP.role!=='manager') q=q.eq('assigned_agent_id',CP.id);
  const {data:custs}=await q;
  const {data:visits}=await sb.from('daily_visits').select('customer_id,visit_date').gte('visit_date',cutoffStr);
  const recentIds=new Set((visits||[]).map(v=>v.customer_id).filter(Boolean));
  const unvisited=(custs||[]).filter(c=>!recentIds.has(c.id));
  const {data:lastVisits}=await sb.from('daily_visits').select('customer_id,visit_date,next_visit_date').order('visit_date',{ascending:false});
  const lastMap={};(lastVisits||[]).forEach(v=>{if(!lastMap[v.customer_id])lastMap[v.customer_id]=v;});
  const tbody=document.getElementById('unvisited-body');
  tbody.innerHTML='';
  if(!unvisited.length){tbody.innerHTML=`<tr><td colspan="5" class="empty-state"><div class="ei">✅</div>جميع العملاء تمت زيارتهم خلال ${days} أيام</td></tr>`;}
  else{unvisited.forEach(c=>{
    const lv=lastMap[c.id];
    const daysSince=lv?Math.floor((new Date()-new Date(lv.visit_date))/86400000):999;
    const tr=document.createElement('tr');
    tr.innerHTML=`<td style="text-align:right;font-weight:700;">${c.name}</td><td>${c.profiles?.fullname||'—'}</td><td style="font-size:11px;">${lv?.visit_date||'لم تتم زيارة'}</td><td><span class="badge ${daysSince>30?'bg-red':'bg-amber'}">${daysSince===999?'لم تتم':daysSince+' يوم'}</span></td><td style="font-size:11px;">${lv?.next_visit_date||'—'}</td>`;
    tbody.appendChild(tr);
  });}
  st('جاهز');
}
