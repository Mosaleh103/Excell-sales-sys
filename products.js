// ── PRODUCTS ──
async function loadProducts(search=''){
  st('جاري تحميل المنتجات...','loading');
  let q=sb.from('products').select('*').order('name');
  if(search) q=q.ilike('name','%'+search+'%');
  const {data}=await q;
  allProducts=data||[];
  const tbody=document.getElementById('products-body');
  tbody.innerHTML='';
  if(!allProducts.length){tbody.innerHTML='<tr><td colspan="6" class="empty-state"><div class="ei">📦</div>لا توجد منتجات</td></tr>';st('جاهز');return;}
  allProducts.forEach(p=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td style="font-size:11px;">${p.code}</td><td style="text-align:right;">${p.name}</td><td>${p.unit||'كرتونة'}</td><td>${p.list_price>0?fmtNum(p.list_price)+' ر.س':'—'}</td><td>${badge(p.is_active?'نشط':'موقوف',p.is_active?'bg-green':'bg-red')}</td><td class="no-print">${CP.role==='manager'?`<button class="btn br btn-sm" data-id="${p.id}" data-name="${p.name}">🗑</button>`:'—'}</td>`;
    if(CP.role==='manager'){
      tr.querySelector('button')?.addEventListener('click',async()=>{
        const ok=await confirm(`إيقاف المنتج "${p.name}"؟`,'📦');
        if(!ok)return;
        await sb.from('products').update({is_active:false}).eq('id',p.id);
        loadProducts();
      });
    }
    tbody.appendChild(tr);
  });
  st('جاهز');
}

// ── STAGNANT PRODUCTS ──
async function loadStagnant(){
  st('جاري البحث...','loading');
  const days=parseInt(document.getElementById('stagnant-days').value)||30;
  const cutoff=new Date();cutoff.setDate(cutoff.getDate()-days);
  const cutoffStr=cutoff.toISOString().split('T')[0];
  const {data:recentSales}=await sb.from('sale_items').select('product_id,product_code,product_name,sale_date').gte('sale_date',cutoffStr);
  const movedIds=new Set((recentSales||[]).map(s=>s.product_id));
  const stagnant=allProducts.filter(p=>!movedIds.has(p.id));
  const {data:lastSales}=await sb.from('sale_items').select('product_id,sale_date,total').order('sale_date',{ascending:false});
  const lastMap={};(lastSales||[]).forEach(s=>{if(!lastMap[s.product_id])lastMap[s.product_id]=s;});
  const tbody=document.getElementById('stagnant-body');
  tbody.innerHTML='';
  if(!stagnant.length){tbody.innerHTML=`<tr><td colspan="5" class="empty-state"><div class="ei">✅</div>لا توجد منتجات راكدة خلال ${days} يوم</td></tr>`;}
  else{stagnant.forEach(p=>{
    const ls=lastMap[p.id];
    const daysSince=ls?Math.floor((new Date()-new Date(ls.sale_date))/86400000):999;
    const tr=document.createElement('tr');
    tr.innerHTML=`<td style="font-size:11px;">${p.code}</td><td style="text-align:right;">${p.name}</td><td style="font-size:11px;">${ls?.sale_date||'لم يباع من قبل'}</td><td><span class="badge ${daysSince>60?'bg-red':'bg-amber'}">${daysSince===999?'لم يباع':daysSince+' يوم'}</span></td><td>0 ر.س</td>`;
    tbody.appendChild(tr);
  });}
  st('جاهز');
}

// ── TOP PRODUCTS ──
async function loadTopProducts(){
  st('جاري التحميل...','loading');
  const month=document.getElementById('tp-month').value;
  const {data}=await sb.from('sale_items').select('*').gte('sale_date',month+'-01').lt('sale_date',month+'-32');
  const map={};
  (data||[]).forEach(s=>{
    if(!map[s.product_id]) map[s.product_id]={code:s.product_code,name:s.product_name,qty:0,total:0,count:0};
    map[s.product_id].qty+=parseFloat(s.qty)||0;
    map[s.product_id].total+=parseFloat(s.total)||0;
    map[s.product_id].count++;
  });
  const sorted=Object.values(map).sort((a,b)=>b.total-a.total);
  const tbody=document.getElementById('tp-body');
  tbody.innerHTML='';
  const medals=['🥇','🥈','🥉'];
  sorted.forEach((p,i)=>{
    tbody.innerHTML+=`<tr><td>${medals[i]||i+1}</td><td style="font-size:11px;">${p.code}</td><td style="text-align:right;">${p.name.substring(0,45)}</td><td>${fmtNum(p.qty)}</td><td>${fmtNum(p.total)} ر.س</td><td>${p.count}</td></tr>`;
  });
  if(!sorted.length) tbody.innerHTML='<tr><td colspan="6" class="empty-state"><div class="ei">📈</div>لا توجد مبيعات لهذا الشهر</td></tr>';
  st('جاهز');
}
