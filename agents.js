// ── USERS / AGENTS ──
async function loadUsers(){
  if(CP.role!=='manager')return;
  const {data}=await sb.from('profiles').select('*').order('created_at');
  const tbody=document.getElementById('users-body');
  tbody.innerHTML='';
  (data||[]).forEach(u=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td style="font-weight:700;">${u.fullname}</td><td style="font-size:11px;">${u.username||'—'}</td><td>${badge(u.role==='manager'?'مدير':'مندوب',u.role==='manager'?'bg-blue':'bg-green')}</td><td>${badge(u.is_first_login?'في انتظار تسجيل الدخول':'نشط',u.is_first_login?'bg-amber':'bg-green')}</td><td><button class="btn ba btn-sm reset-pw" data-id="${u.id}" data-name="${u.fullname}">🔑 إعادة تعيين</button></td>`;
    tr.querySelector('.reset-pw').addEventListener('click',async function(){
      const ok=await confirm(`إعادة تعيين كلمة مرور ${this.dataset.name}؟`,'🔑');
      if(!ok)return;
      await sb.from('profiles').update({is_first_login:true}).eq('id',this.dataset.id);
      alert('تم — سيطلب من المستخدم تغيير كلمة المرور عند دخوله التالي');
    });
    tbody.appendChild(tr);
  });
}

async function addUser(){
  const email=document.getElementById('nu-email').value.trim();
  const name=document.getElementById('nu-name').value.trim();
  const pass=document.getElementById('nu-pass').value;
  const role=document.getElementById('nu-role').value;
  if(!email||!name||!pass){alert('يرجى تعبئة جميع الحقول');return;}
  st('جاري إضافة المستخدم...','loading');
  const {data,error}=await sb.auth.signUp({email,password:pass,options:{data:{fullname:name,role}}});
  if(error){alert('خطأ: '+error.message);st('خطأ','error');return;}
  ['nu-email','nu-name','nu-pass'].forEach(id=>document.getElementById(id).value='');
  await loadUsers();
  await loadMasterData();
  st('تم إضافة المستخدم ✓');
  alert(`تم إضافة ${name} ✓`);
}

async function loadAuditLog(){
  const {data}=await sb.from('audit_log').select('*,profiles(fullname)').order('created_at',{ascending:false}).limit(50);
  const tbody=document.getElementById('audit-body');
  tbody.innerHTML='';
  if(!(data||[]).length){tbody.innerHTML='<tr><td colspan="4" class="empty-state">لا توجد عمليات</td></tr>';return;}
  (data||[]).forEach(log=>{
    const ab=log.action==='DELETE'?'bg-red':log.action==='INSERT'?'bg-green':'bg-amber';
    const ar=log.action==='DELETE'?'حذف':log.action==='INSERT'?'إضافة':'تعديل';
    tbody.innerHTML+=`<tr><td style="font-size:10px;">${new Date(log.created_at).toLocaleString('ar')}</td><td>${log.profiles?.fullname||'—'}</td><td>${badge(ar,ab)}</td><td style="font-size:10px;text-align:right;direction:ltr;">${log.table_name}</td></tr>`;
  });
}
