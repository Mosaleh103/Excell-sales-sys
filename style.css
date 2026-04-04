// ── VISITS / DAILY SALES ──
function loadVisitSelects(){
  const cs=document.getElementById('v-customer');
  cs.innerHTML='<option value="">-- اختر العميل --</option>';
  allCustomers.forEach(c=>{cs.innerHTML+=`<option value="${c.id}">${c.name} (${c.account_no})</option>`;});
  cs.innerHTML+='<option value="__new__">+ عميل جديد</option>';
  initSaleItems();
}

function initSaleItems(){
  saleItems=[{product_id:'',lot:'',qty:'',price:''}];
  renderSaleItems();
}

function renderSaleItems(){
  const tbody=document.getElementById('sale-items-body');
  tbody.innerHTML='';
  let grandTotal=0;
  saleItems.forEach((item,i)=>{
    const total=(parseFloat(item.qty)||0)*(parseFloat(item.price)||0);
    grandTotal+=total;
    const opts=allProducts.map(p=>`<option value="${p.id}" data-code="${p.code}" data-name="${p.name}" ${p.id===item.product_id?'selected':''}>${p.name.substring(0,50)}</option>`).join('');
    const tr=document.createElement('tr');
    tr.innerHTML=`<td><select class="si-prod" data-i="${i}"><option value="">-- اختر --</option>${opts}</select></td><td><input type="text" class="si-lot" data-i="${i}" value="${item.lot||''}" placeholder="مطلوب*" style="${!item.lot&&item.product_id?'border-color:var(--red);':''}"></td><td><input type="number" class="si-qty" data-i="${i}" value="${item.qty||''}" placeholder="0" min="0" step="0.01"></td><td><input type="number" class="si-price" data-i="${i}" value="${item.price||''}" placeholder="0.00" min="0" step="0.01"></td><td style="font-weight:700;color:var(--navy);">${total>0?fmtNum(total):''}</td><td><button class="del-btn si-del" data-i="${i}">×</button></td>`;
    tbody.appendChild(tr);
  });
  document.getElementById('items-total').textContent=grandTotal>0?fmtNum(grandTotal)+' ر.س':'';

  tbody.querySelectorAll('.si-prod').forEach(s=>s.addEventListener('change',function(){
    const i=parseInt(this.dataset.i);
    saleItems[i].product_id=this.value;
    const opt=this.options[this.selectedIndex];
    saleItems[i].product_code=opt.getAttribute('data-code')||'';
    saleItems[i].product_name=opt.getAttribute('data-name')||'';
    const prod=allProducts.find(p=>p.id===this.value);
    if(prod&&prod.list_price) saleItems[i].price=prod.list_price;
    renderSaleItems();
  }));
  tbody.querySelectorAll('.si-lot').forEach(s=>s.addEventListener('input',function(){saleItems[parseInt(this.dataset.i)].lot=this.value;renderSaleItems();}));
  tbody.querySelectorAll('.si-qty').forEach(s=>s.addEventListener('input',function(){saleItems[parseInt(this.dataset.i)].qty=this.value;renderSaleItems();}));
  tbody.querySelectorAll('.si-price').forEach(s=>s.addEventListener('input',function(){saleItems[parseInt(this.dataset.i)].price=this.value;renderSaleItems();}));
  tbody.querySelectorAll('.si-del').forEach(b=>b.addEventListener('click',function(){
    if(saleItems.length<=1)return;
    saleItems.splice(parseInt(this.dataset.i),1);
    renderSaleItems();
  }));
}

async function saveVisit(){
  const custId=document.getElementById('v-customer').value;
  const custName=custId==='__new__'?document.getElementById('v-customer-new').value.trim():(document.querySelector(`#v-customer option[value="${custId}"]`)?.textContent?.split('(')[0]?.trim()||'');
  const vDate=document.getElementById('v-date').value;
  const vType=document.getElementById('v-type').value;
  const vNotes=document.getElementById('v-notes').value;
  const vNext=document.getElementById('v-next').value||null;
  if(!custName){alert('يرجى اختيار العميل');return;}

  const validItems=saleItems.filter(s=>s.product_id&&(parseFloat(s.qty)||0)>0);
  if(vType==='sale'&&validItems.length===0){alert('يرجى إضافة صنف واحد على الأقل');return;}
  for(const item of validItems){
    if(!item.lot){alert(`يرجى إدخال لوت نمبر للصنف: ${item.product_name}`);return;}
  }

  st('جاري الحفظ...','loading');
  let finalCustId=custId==='__new__'?null:custId;
  if(custId==='__new__'&&custName){
    const {data:nc}=await sb.from('customers').insert({account_no:'C'+Date.now(),name:custName,assigned_agent_id:CP.id}).select().single();
    if(nc){finalCustId=nc.id;allCustomers.push(nc);}
  }

  const {data:visit,error}=await sb.from('daily_visits').insert({
    agent_id:CP.id,customer_id:finalCustId,customer_name:custName,
    visit_date:vDate,visit_type:vType,notes:vNotes,next_visit_date:vNext
  }).select().single();
  if(error){alert('خطأ في حفظ الزيارة: '+error.message);st('خطأ','error');return;}

  for(const item of validItems){
    await sb.from('sale_items').insert({
      visit_id:visit.id,agent_id:CP.id,customer_id:finalCustId,
      product_id:item.product_id,product_code:item.product_code,
      product_name:item.product_name,lot_number:item.lot,
      qty:parseFloat(item.qty),unit_price:parseFloat(item.price)||0,
      sale_date:vDate
    });
  }

  st('تم حفظ الزيارة ✓');
  initSaleItems();
  document.getElementById('v-notes').value='';
  document.getElementById('v-next').value='';
  document.getElementById('v-customer').value='';
  loadTodayVisits();
}

async function loadTodayVisits(){
  const date=document.getElementById('v-date').value;
  const {data}=await sb.from('daily_visits').select('*').eq('agent_id',CP.id).eq('visit_date',date).order('created_at');
  const tbody=document.getElementById('today-visits');
  let total=0;
  tbody.innerHTML='';
  if(!(data||[]).length){tbody.innerHTML='<tr><td colspan="5" class="empty-state"><div class="ei">📋</div>لا توجد زيارات لهذا اليوم</td></tr>';}
  else{
    (data||[]).forEach(v=>{
      total+=parseFloat(v.total_amount)||0;
      const typeMap={'sale':'<span class="badge bg-green">بيع</span>','no_sale':'<span class="badge bg-amber">بدون بيع</span>','follow_up':'<span class="badge bg-blue">متابعة</span>','new_customer':'<span class="badge bg-teal">عميل جديد</span>'};
      const canDel=new Date()-new Date(v.created_at)<86400000||CP.role==='manager';
      const tr=document.createElement('tr');
      tr.innerHTML=`<td style="text-align:right;">${v.customer_name}</td><td>${typeMap[v.visit_type]||v.visit_type}</td><td>${v.total_amount>0?fmtNum(v.total_amount)+' ر.س':'—'}</td><td style="text-align:right;font-size:11px;">${v.notes||'—'}</td><td class="no-print"></td>`;
      if(canDel){const db=document.createElement('button');db.className='del-btn';db.textContent='×';db.addEventListener('click',()=>deleteVisit(v.id,v.customer_name));tr.querySelector('td:last-child').appendChild(db);}
      tbody.appendChild(tr);
    });
  }
  document.getElementById('today-total').textContent=total>0?'إجمالي: '+fmtNum(total)+' ر.س':'';
}

async function deleteVisit(id,name){
  const ok=await confirm(`حذف زيارة "${name}"؟ سيتم حذف جميع المبيعات المرتبطة بها.`,'🗑️');
  if(!ok)return;
  st('جاري الحذف...','loading');
  await sb.from('sale_items').delete().eq('visit_id',id);
  await sb.from('daily_visits').delete().eq('id',id);
  loadTodayVisits();
  st('تم الحذف ✓');
}
