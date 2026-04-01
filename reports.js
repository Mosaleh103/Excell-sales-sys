// ── DASHBOARD ──
async function loadDashboard(){
  st('جاري تحميل لوحة التحكم...','loading');
  const month=document.getElementById('dash-month').value;
  const [{data:sales},{data:plans},{data:visits}]=await Promise.all([
    sb.from('sale_items').select('*,daily_visits!visit_id(agent_id,visit_date)'),
    sb.from('monthly_plans').select('*').eq('month',month),
    sb.from('daily_visits').select('*').gte('visit_date',month+'-01')
  ]);
  const totalSales=(sales||[]).reduce((s,x)=>s+(parseFloat(x.total)||0),0);
  const totalTarget=(plans||[]).reduce((s,p)=>s+(parseFloat(p.target_qty)||0)*(parseFloat(p.target_price)||0),0);
  const pct=totalTarget>0?Math.round((totalSales/totalTarget)*100):0;
  const visitCount=(visits||[]).length;
  const uniqueCustomers=new Set((visits||[]).map(v=>v.customer_id).filter(Boolean)).size;
  document.getElementById('dash-kpis').innerHTML=
    kpi('إجمالي المبيعات',fmtNum(totalSales)+' ر.س','هذا الشهر','teal')+
    kpi('المستهدف الشهري',fmtNum(totalTarget)+' ر.س','','blue')+
    kpi('نسبة الإنجاز',pct+'%','من المستهدف',pct>=100?'green':pct>=70?'amber':'red')+
    kpi('عدد الزيارات',visitCount,'زيارة هذا الشهر','teal')+
    kpi('العملاء المزارون',uniqueCustomers,'عميل','green');

  const agentSales={};
  (sales||[]).forEach(s=>{
    const aid=s.daily_visits?.agent_id;
    if(aid) agentSales[aid]=(agentSales[aid]||0)+(parseFloat(s.total)||0);
  });
  const ranked=Object.entries(agentSales).sort((a,b)=>b[1]-a[1]);
  const ar=document.getElementById('agents-rank');
  ar.innerHTML='';
  if(!ranked.length){ar.innerHTML='<tr><td colspan="4" class="empty-state">لا توجد بيانات</td></tr>';}
  else{
    ranked.forEach(([aid,total],i)=>{
      const prof=allProfiles.find(p=>p.id===aid);
      const agentTarget=(plans||[]).filter(p=>p.agent_id===aid).reduce((s,p)=>s+(parseFloat(p.target_qty)||0)*(parseFloat(p.target_price)||0),0);
      const ap=agentTarget>0?Math.round((total/agentTarget)*100):0;
      const medals=['🥇','🥈','🥉'];
      ar.innerHTML+=`<tr><td>${medals[i]||i+1}</td><td style="text-align:right;">${prof?.fullname||'—'}</td><td>${fmtNum(total)} ر.س</td><td><div class="pb" style="width:80px;margin:0 auto;"><div class="pf" style="width:${Math.min(ap,100)}%;background:${ap>=100?'var(--green)':ap>=70?'var(--amber)':'var(--red)'};"></div></div><div style="font-size:10px;font-weight:700;">${ap}%</div></td></tr>`;
    });
  }

  const prodSales={};
  (sales||[]).forEach(s=>{
    if(!prodSales[s.product_code]) prodSales[s.product_code]={qty:0,total:0,code:s.product_code,name:s.product_name};
    prodSales[s.product_code].qty+=parseFloat(s.qty)||0;
    prodSales[s.product_code].total+=parseFloat(s.total)||0;
  });
  const topP=Object.values(prodSales).sort((a,b)=>b.total-a.total).slice(0,10);
  const tp=document.getElementById('top-products');
  tp.innerHTML='';
  topP.forEach((p,i)=>{
    tp.innerHTML+=`<tr><td>${i+1}</td><td style="text-align:right;font-size:11px;">${p.name.substring(0,35)}</td><td>${fmtNum(p.qty)}</td><td>${fmtNum(p.total)} ر.س</td></tr>`;
  });
  if(!topP.length) tp.innerHTML='<tr><td colspan="4" class="empty-state">لا توجد بيانات</td></tr>';
  st('جاهز');
}

// ── PLAN ──
async function loadPlan(){
  st('جاري تحميل الخطة...','loading');
  const month=CP.month||new Date().toISOString().slice(0,7);
  document.getElementById('plan-info').textContent=CP.fullname+' — '+month;
  const {data:custs}=await sb.from('customers').select('*').eq('assigned_agent_id',CP.id);
  const {data:plans}=await sb.from('monthly_plans').select('*').eq('agent_id',CP.id).eq('month',month);
  const planMap={};
  (plans||[]).forEach(p=>{planMap[p.product_id+'|'+(p.customer_id||'new')]=p;});
  const clients=[...(custs||[]),{id:'new',name:'عملاء جدد'}];
  const thead=document.getElementById('plan-thead');
  const tbody=document.getElementById('plan-tbody');
  const tfoot=document.getElementById('plan-tfoot');

  let h1=`<tr><th style="min-width:160px;text-align:right;background:var(--blue);">المنتج</th>`;
  clients.forEach(c=>{h1+=`<th colspan="3" style="background:var(--teal);">${c.name}</th>`;});
  h1+=`<th style="background:var(--teal);">الإجمالي</th></tr>`;
  let h2='<tr>';
  clients.forEach(()=>{h2+='<th style="background:#1e4976;font-size:10px;">السعر</th><th style="background:#1e4976;font-size:10px;">الكمية</th><th style="background:#1e4976;font-size:10px;">الإجمالي</th>';});
  h2+='</tr>';
  thead.innerHTML=h1+h2;

  let rows='';
  allProducts.forEach(p=>{
    rows+=`<tr><td style="text-align:right;padding:5px 8px;font-size:11px;font-weight:600;color:var(--blue);" title="${p.name}">${p.name.substring(0,38)}${p.name.length>38?'…':''}</td>`;
    clients.forEach(c=>{
      const key=p.id+'|'+(c.id==='new'?'new':c.id);
      const pl=planMap[key]||{target_price:'',target_qty:''};
      const tot=(parseFloat(pl.target_price)||0)*(parseFloat(pl.target_qty)||0);
      rows+=`<td><input type="number" class="plan-inp" value="${pl.target_price||''}" placeholder="0" data-pid="${p.id}" data-cid="${c.id}" data-f="price" step="0.01" min="0"></td>`;
      rows+=`<td><input type="number" class="plan-inp" value="${pl.target_qty||''}" placeholder="0" data-pid="${p.id}" data-cid="${c.id}" data-f="qty" min="0"></td>`;
      rows+=`<td class="tc-total" id="pc_${p.id}_${c.id}">${tot>0?fmtNum(tot):''}</td>`;
    });
    const rowTot=clients.reduce((s,c)=>{const k=p.id+'|'+(c.id==='new'?'new':c.id);const x=planMap[k]||{};return s+(parseFloat(x.target_price)||0)*(parseFloat(x.target_qty)||0);},0);
    rows+=`<td class="tc-total" id="pr_${p.id}">${rowTot>0?fmtNum(rowTot):''}</td></tr>`;
  });
  tbody.innerHTML=rows;

  tbody.querySelectorAll('.plan-inp').forEach(inp=>{
    inp.addEventListener('change',async function(){
      const pid=this.dataset.pid,cid=this.dataset.cid,f=this.dataset.f;
      const key=pid+'|'+cid;
      const existing=planMap[key];
      const val=parseFloat(this.value)||0;
      if(existing){
        const upd={};upd['target_'+f]=val;
        await sb.from('monthly_plans').update(upd).eq('id',existing.id);
        existing['target_'+f]=val;
      } else {
        const ins={agent_id:CP.id,month,product_id:pid,customer_id:cid==='new'?null:cid,target_qty:0,target_price:0};
        ins['target_'+f]=val;
        const {data:r}=await sb.from('monthly_plans').insert(ins).select().single();
        if(r) planMap[key]=r;
      }
      const pl=planMap[key]||{};
      const tot=(parseFloat(pl.target_price)||0)*(parseFloat(pl.target_qty)||0);
      const cel=document.getElementById('pc_'+pid+'_'+cid);
      if(cel) cel.textContent=tot>0?fmtNum(tot):'';
      const rowTot=clients.reduce((s,c)=>{const k=pid+'|'+(c.id==='new'?'new':c.id);const x=planMap[k]||{};return s+(parseFloat(x.target_price)||0)*(parseFloat(x.target_qty)||0);},0);
      const pr=document.getElementById('pr_'+pid);if(pr)pr.textContent=rowTot>0?fmtNum(rowTot):'';
      st('تم الحفظ ✓');
    });
  });

  let foot='<tr><td style="text-align:right;padding:7px 8px;">الإجمالي</td>';
  let grand=0;
  clients.forEach(c=>{
    const col=allProducts.reduce((s,p)=>{const k=p.id+'|'+(c.id==='new'?'new':c.id);const pl=planMap[k]||{};return s+(parseFloat(pl.target_price)||0)*(parseFloat(pl.target_qty)||0);},0);
    grand+=col;
    foot+=`<td colspan="3">${col>0?fmtNum(col)+' ر.س':''}</td>`;
  });
  foot+=`<td>${fmtNum(grand)} ر.س</td></tr>`;
  tfoot.innerHTML=foot;
  st('جاهز');
}

// ── WEEKLY ──
function getWeekDates(w,month){
  if(!month)return[];
  const [y,m]=month.split('-').map(Number);
  const dates=[];
  const d=new Date(y,m-1,1);
  while(d.getMonth()===m-1){
    const day=d.getDate();
    const wk=day<=7?1:day<=14?2:day<=21?3:4;
    if(wk===w)dates.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate()+1);
  }
  return dates;
}

async function loadWeekly(){
  st('جاري تحميل الأسبوعي...','loading');
  const month=CP.month||new Date().toISOString().slice(0,7);
  const {data:custs}=await sb.from('customers').select('*').eq('assigned_agent_id',CP.id);
  const {data:plans}=await sb.from('monthly_plans').select('*').eq('agent_id',CP.id).eq('month',month);
  const planMap={};(plans||[]).forEach(p=>{planMap[p.product_id+'|'+(p.customer_id||'new')]=p;});
  const weekDates=getWeekDates(currentWeek,month);
  const {data:sales}=await sb.from('sale_items').select('*').eq('agent_id',CP.id).in('sale_date',weekDates.length?weekDates:['9999-99-99']);
  const salesMap={};
  (sales||[]).forEach(s=>{const k=s.product_id+'|'+(s.customer_id||'new');salesMap[k]=(salesMap[k]||0)+parseFloat(s.qty);});
  const clients=[...(custs||[]),{id:'new',name:'عملاء جدد'}];
  const thead=document.getElementById('wk-thead');
  const tbody=document.getElementById('wk-tbody');
  const tfoot=document.getElementById('wk-tfoot');

  let h1=`<tr><th style="min-width:140px;text-align:right;background:var(--blue);">المنتج</th>`;
  clients.forEach(c=>{h1+=`<th colspan="2" style="background:var(--teal);">${c.name}</th>`;});
  h1+=`<th style="background:var(--teal);">المجموع</th><th style="background:var(--green);">% إنجاز</th></tr>`;
  let h2='<tr>';
  clients.forEach(()=>{h2+='<th style="background:#1e4976;font-size:10px;">المستهدف</th><th style="background:#166534;font-size:10px;">المحقق ✓</th>';});
  h2+='</tr>';
  thead.innerHTML=h1+h2;

  let rows='';let gTgt=0,gDone=0;
  allProducts.forEach(p=>{
    rows+=`<tr><td style="text-align:right;padding:5px 8px;font-size:11px;font-weight:600;color:var(--blue);">${p.name.substring(0,35)}${p.name.length>35?'…':''}</td>`;
    let rowTgt=0,rowAct=0;
    clients.forEach(c=>{
      const cid=c.id==='new'?'new':c.id;
      const mTgt=parseFloat((planMap[p.id+'|'+cid]||{}).target_qty||0);
      const wTgt=parseFloat((mTgt/4).toFixed(1));
      const actual=salesMap[p.id+'|'+cid]||0;
      rowTgt+=wTgt;rowAct+=actual;
      rows+=`<td style="text-align:center;font-size:11px;background:#fffbeb;">${wTgt||'—'}</td>`;
      rows+=`<td style="text-align:center;font-size:12px;font-weight:700;color:var(--green);background:#f0fff4;">${actual>0?actual:'—'}</td>`;
    });
    gTgt+=rowTgt;gDone+=rowAct;
    const pct=rowTgt>0?Math.round((rowAct/rowTgt)*100):0;
    const col=pct>=100?'var(--green)':pct>=70?'var(--amber)':'var(--red)';
    rows+=`<td class="tc-total">${rowAct.toFixed(1)}</td>`;
    rows+=`<td style="background:#f0f9ff;"><div class="pb" style="width:70px;margin:0 auto;"><div class="pf" style="width:${Math.min(pct,100)}%;background:${col};"></div></div><div style="font-size:10px;font-weight:700;color:${col};">${pct}%</div></td></tr>`;
  });
  tbody.innerHTML=rows;

  const gPct=gTgt>0?Math.round((gDone/gTgt)*100):0;
  let foot='<tr><td style="text-align:right;padding:7px 8px;">الإجمالي</td>';
  clients.forEach(c=>{
    const cid=c.id==='new'?'new':c.id;
    const cTgt=allProducts.reduce((s,p)=>s+parseFloat(((planMap[p.id+'|'+cid]||{}).target_qty||0)/4).toFixed(1)*1,0);
    const cDone=allProducts.reduce((s,p)=>s+(salesMap[p.id+'|'+cid]||0),0);
    foot+=`<td>${cTgt.toFixed(1)}</td><td>${cDone.toFixed(1)}</td>`;
  });
  foot+=`<td>${gDone.toFixed(1)}</td><td>${gPct}%</td></tr>`;
  tfoot.innerHTML=foot;
  st('جاهز');
}

// ── PERFORMANCE ──
async function loadPerformance(){
  st('جاري تحميل تقرير الأداء...','loading');
  const month=document.getElementById('perf-month').value;
  const [{data:custs},{data:sales},{data:plans}]=await Promise.all([
    sb.from('customers').select('*').eq('assigned_agent_id',CP.id),
    sb.from('sale_items').select('*').eq('agent_id',CP.id).gte('sale_date',month+'-01').lt('sale_date',month+'-32'),
    sb.from('monthly_plans').select('*').eq('agent_id',CP.id).eq('month',month)
  ]);
  const totalSales=(sales||[]).reduce((s,x)=>s+(parseFloat(x.total)||0),0);
  const totalTarget=(plans||[]).reduce((s,p)=>s+(parseFloat(p.target_qty)||0)*(parseFloat(p.target_price)||0),0);
  const pct=totalTarget>0?Math.round((totalSales/totalTarget)*100):0;
  const visitedIds=new Set((sales||[]).map(x=>x.customer_id).filter(Boolean));
  const unvisited=(custs||[]).filter(c=>!visitedIds.has(c.id));

  document.getElementById('perf-kpis').innerHTML=
    kpi('إجمالي مبيعاتي',fmtNum(totalSales)+' ر.س',month,'teal')+
    kpi('المستهدف',fmtNum(totalTarget)+' ر.س','','blue')+
    kpi('نسبة الإنجاز',pct+'%','',pct>=100?'green':pct>=70?'amber':'red')+
    kpi('مزارون',visitedIds.size+'/'+(custs||[]).length,'عميل','green')+
    kpi('غير مزارين',unvisited.length,'',unvisited.length===0?'green':'red');

  let alerts='';
  if(unvisited.length) alerts+=`<div class="alert al-red"><span>🔴</span><div><strong>عملاء لم تتم زيارتهم:</strong> ${unvisited.map(c=>c.name).join('، ')}</div></div>`;
  if(pct>=100) alerts+=`<div class="alert al-grn"><span>🎉</span><strong>تجاوزت المستهدف! أداء ممتاز.</strong></div>`;
  document.getElementById('perf-alerts').innerHTML=alerts||'<div class="alert al-grn"><span>✅</span>لا تنبيهات</div>';

  const tbody=document.getElementById('perf-clients');
  tbody.innerHTML='';
  (custs||[]).forEach(c=>{
    const cSales=(sales||[]).filter(x=>x.customer_id===c.id).reduce((s,x)=>s+(parseFloat(x.total)||0),0);
    const cTarget=(plans||[]).filter(p=>p.customer_id===c.id).reduce((s,p)=>s+(parseFloat(p.target_qty)||0)*(parseFloat(p.target_price)||0),0);
    const cp2=cTarget>0?Math.round((cSales/cTarget)*100):0;
    const lastV=(sales||[]).filter(x=>x.customer_id===c.id).map(x=>x.sale_date).sort().reverse()[0];
    const days=lastV?Math.floor((new Date()-new Date(lastV))/86400000):999;
    const abc=c.final_classification||c.manual_classification||'BB';
    const vb=days<=7?badge('تمت','bg-green'):days<=14?badge('تأخر','bg-amber'):badge('لم تتم','bg-red');
    const tr=document.createElement('tr');
    tr.innerHTML=`<td style="text-align:right;font-weight:700;">${c.name}</td><td>${abcBadge(abc)}</td><td>${fmtNum(cTarget)} ر.س</td><td>${fmtNum(cSales)} ر.س</td><td style="font-size:11px;">${lastV||'—'}</td><td>${vb}</td>`;
    tbody.appendChild(tr);
  });
  if(!tbody.innerHTML) tbody.innerHTML='<tr><td colspan="6" class="empty-state"><div class="ei">📊</div>لا توجد بيانات</td></tr>';
  st('جاهز');
}

// ── COMPANY REPORT ──
async function loadCompanyReport(){
  if(CP.role!=='manager')return;
  st('جاري تحميل تقرير الشركة...','loading');
  const month=document.getElementById('rep-month').value;
  const agents=allProfiles.filter(p=>p.role==='agent');
  const [{data:allSales},{data:allPlans}]=await Promise.all([
    sb.from('sale_items').select('*').gte('sale_date',month+'-01').lt('sale_date',month+'-32'),
    sb.from('monthly_plans').select('*').eq('month',month)
  ]);
  const totalSales=(allSales||[]).reduce((s,x)=>s+(parseFloat(x.total)||0),0);
  const totalTarget=(allPlans||[]).reduce((s,p)=>s+(parseFloat(p.target_qty)||0)*(parseFloat(p.target_price)||0),0);
  const pct=totalTarget>0?Math.round((totalSales/totalTarget)*100):0;
  document.getElementById('rep-kpis').innerHTML=
    kpi('إجمالي مبيعات الشركة',fmtNum(totalSales)+' ر.س','جميع المناديب','teal')+
    kpi('المستهدف الإجمالي',fmtNum(totalTarget)+' ر.س','','blue')+
    kpi('نسبة الإنجاز',pct+'%','',pct>=100?'green':pct>=70?'amber':'red')+
    kpi('عدد المناديب',agents.length,'مندوب نشط','teal');

  const atabs=document.getElementById('rep-agent-tabs');
  atabs.innerHTML='';
  if(!agents.length){atabs.innerHTML='<p style="color:var(--muted);font-size:12px;">لا يوجد مناديب</p>';return;}
  agents.forEach(agent=>{
    const agSales=(allSales||[]).filter(x=>x.agent_id===agent.id).reduce((s,x)=>s+(parseFloat(x.total)||0),0);
    const agTarget=(allPlans||[]).filter(x=>x.agent_id===agent.id).reduce((s,p)=>s+(parseFloat(p.target_qty)||0)*(parseFloat(p.target_price)||0),0);
    const agPct=agTarget>0?Math.round((agSales/agTarget)*100):0;
    const btn=document.createElement('button');
    btn.className='atab'+(agent.id===selAgentId?' active':'');
    btn.innerHTML=`${agent.fullname}<br><span style="font-size:10px;font-weight:400;">${agPct}% إنجاز</span>`;
    btn.addEventListener('click',()=>{
      selAgentId=agent.id;
      document.querySelectorAll('.atab').forEach(t=>t.classList.remove('active'));
      btn.classList.add('active');
      renderAgentDetail(agent,allSales||[],allPlans||[]);
    });
    atabs.appendChild(btn);
  });
  if(!selAgentId)selAgentId=agents[0]?.id;
  const firstBtn=atabs.querySelector('.atab');
  if(firstBtn){firstBtn.classList.add('active');renderAgentDetail(agents[0],allSales||[],allPlans||[]);}
  st('جاهز');
}

async function renderAgentDetail(agent,allSales,allPlans){
  const report=document.getElementById('rep-agent-detail');
  const {data:custs}=await sb.from('customers').select('*').eq('assigned_agent_id',agent.id);
  const agSales=allSales.filter(x=>x.agent_id===agent.id);
  const agPlans=allPlans.filter(x=>x.agent_id===agent.id);
  const totalSales=agSales.reduce((s,x)=>s+(parseFloat(x.total)||0),0);
  const totalTarget=agPlans.reduce((s,p)=>s+(parseFloat(p.target_qty)||0)*(parseFloat(p.target_price)||0),0);
  const pct=totalTarget>0?Math.round((totalSales/totalTarget)*100):0;
  const visitedIds=new Set(agSales.map(x=>x.customer_id).filter(Boolean));
  const unvisited=(custs||[]).filter(c=>!visitedIds.has(c.id));
  const col=pct>=100?'var(--green)':pct>=70?'var(--amber)':'var(--red)';

  report.innerHTML=`<div class="card"><div class="card-head"><h2>📊 ${agent.fullname}</h2><button class="btn bt btn-sm" id="btn-print-agent">🖨️ طباعة</button></div><div class="card-body">
    <div class="kpi-grid">${kpi('المبيعات',fmtNum(totalSales)+' ر.س','','teal')}${kpi('المستهدف',fmtNum(totalTarget)+' ر.س','','blue')}${kpi('الإنجاز',pct+'%','',pct>=100?'green':pct>=70?'amber':'red')}${kpi('مزار',visitedIds.size+'/'+(custs||[]).length,'','green')}${kpi('غير مزار',unvisited.length,'',unvisited.length===0?'green':'red')}</div>
    <div style="margin:10px 0;"><div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:var(--navy);margin-bottom:3px;"><span>تقدم الإنجاز</span><span style="color:${col};">${pct}%</span></div><div class="pb" style="height:10px;"><div class="pf" style="width:${Math.min(pct,100)}%;background:${col};"></div></div></div>
    ${unvisited.length?`<div class="alert al-amb"><span>⚠️</span><div><strong>غير مزارين:</strong> ${unvisited.map(c=>c.name).join('، ')}</div></div>`:''}
    </div></div>`;
  document.getElementById('btn-print-agent')?.addEventListener('click',()=>{document.getElementById('ph-sub').textContent='تقرير '+agent.fullname;window.print();});
}

// ── SETUP ──
async function loadSetup(){
  const {data}=await sb.from('profiles').select('month').eq('id',CP.id).single();
  if(data?.month) document.getElementById('setup-month').value=data.month;
}

async function saveSetup(){
  const month=document.getElementById('setup-month').value;
  await sb.from('profiles').update({month}).eq('id',CP.id);
  CP.month=month;
  st('تم حفظ الإعداد ✓');
  alert('تم حفظ الإعداد ✓');
}
