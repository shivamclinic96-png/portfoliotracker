// Portfolio
function renderPortfolio(){
const tb=document.querySelector('#portfolio-table tbody');tb.innerHTML='';
const s=document.getElementById('portfolio-search').value.toLowerCase();
let pt=0;state.assets.forEach(a=>pt+=getAssetValue(a));
const f=state.assets.filter(a=>a.symbol.toLowerCase().includes(s)||(a.sector||'').toLowerCase().includes(s));
f.forEach(a=>{
const inv=a.qty*a.avgPrice,cur=getAssetValue(a),pl=cur-inv,plP=inv>0?(pl/inv)*100:0,alP=pt>0?(cur/pt)*100:0;
const cls=pl>=0?'profit':'loss';
let extra='';
if(a.assetClass==='FD'&&a.fdMaturity){
const md=new Date(a.fdMaturity),now=new Date(),days=Math.ceil((md-now)/(1000*60*60*24));
extra='<br><span style="font-size:10px;color:var(--text-muted)"><i class="fa-regular fa-clock"></i> '+(days>0?days+' days to maturity':'Matured')+'</span>';
}
tb.innerHTML+='<tr><td><strong>'+a.symbol+'</strong><span class="tag">'+(a.assetClass||'STOCK')+'</span>'+extra+'</td><td>'+a.sector+'</td><td>'+a.qty+'</td><td>'+formatCurrency(a.avgPrice)+'</td><td>'+formatCurrency(a.currentPrice)+'</td><td>'+formatCurrency(cur)+'</td><td><strong>'+alP.toFixed(1)+'%</strong></td><td><span class="'+(pl>=0?'bg-profit':'bg-loss')+'">'+(pl>=0?'+':'')+formatCurrency(Math.abs(pl))+'</span><br><small class="'+cls+'">'+plP.toFixed(2)+'%</small></td><td><button class="action-btn" title="Add" onclick="prefillAsset(\''+a.symbol+'\')"><i class="fa-solid fa-plus"></i></button><button class="action-btn delete" title="Remove" onclick="sellAllAsset(\''+a.id+'\')"><i class="fa-solid fa-trash"></i></button></td></tr>';
});
if(!f.length)tb.innerHTML='<tr><td colspan="9" style="text-align:center;color:var(--text-muted)">No assets found.</td></tr>';
}
function prefillAsset(sym){switchView('add-asset');document.getElementById('asset-symbol').value=sym;}

// Transactions
function renderTransactions(){
const tb=document.querySelector('#transactions-table tbody');tb.innerHTML='';
const fl=document.getElementById('transaction-filter').value;
let tx=[...state.transactions].reverse();
if(fl!=='all')tx=tx.filter(t=>t.type===fl);
tx.forEach(t=>{
tb.innerHTML+='<tr><td>'+t.date+'</td><td><strong>'+t.symbol+'</strong></td><td>'+(t.assetClass||'STOCK')+'</td><td><span class="'+(t.type==='buy'?'bg-profit':'bg-loss')+'" style="text-transform:capitalize">'+t.type+'</span></td><td>'+t.qty+'</td><td>'+formatCurrency(t.price)+'</td><td>'+formatCurrency(t.qty*t.price)+'</td></tr>';
});
if(!tx.length)tb.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">No transactions.</td></tr>';
}
function clearAllTransactions(){if(confirm('Clear all transaction history?')){state.transactions=[];saveData(state);updateAllViews();}}

// Analytics
function renderAnalytics(){
const sd={},ac={};
state.assets.forEach(a=>{const v=getAssetValue(a);sd[a.sector]=(sd[a.sector]||0)+v;const c=a.assetClass||'STOCK';ac[c]=(ac[c]||0)+v;});
const c1=document.getElementById('sectorChart');
if(charts.sector)charts.sector.destroy();
charts.sector=new Chart(c1,{type:'bar',data:{labels:Object.keys(sd),datasets:[{label:'Value (₹)',data:Object.values(sd),backgroundColor:'rgba(99,102,241,0.7)',borderRadius:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#8b8fa3'}},x:{grid:{display:false},ticks:{color:'#8b8fa3'}}}}});
const c2=document.getElementById('assetClassChart');
if(charts.assetClass)charts.assetClass.destroy();
const acColors=['#6366f1','#22c55e','#f59e0b','#ef4444','#8b5cf6'];
charts.assetClass=new Chart(c2,{type:'doughnut',data:{labels:Object.keys(ac),datasets:[{data:Object.values(ac),backgroundColor:acColors.slice(0,Object.keys(ac).length),borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'bottom',labels:{color:'#8b8fa3',padding:12}}}}});
const c3=document.getElementById('riskReturnChart');
if(charts.risk)charts.risk.destroy();
const sc=state.assets.filter(a=>a.assetClass!=='FD').map(a=>({x:Math.random()*20,y:a.avgPrice>0?((a.currentPrice-a.avgPrice)/a.avgPrice)*100:0,symbol:a.symbol}));
charts.risk=new Chart(c3,{type:'scatter',data:{datasets:[{label:'Assets',data:sc,backgroundColor:'#22c55e',pointRadius:6,pointHoverRadius:8}]},options:{responsive:true,maintainAspectRatio:false,plugins:{tooltip:{callbacks:{label:function(ctx){return ctx.raw.symbol+': '+ctx.raw.y.toFixed(2)+'%'}}}},scales:{x:{title:{display:true,text:'Risk %',color:'#8b8fa3'},grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#8b8fa3'}},y:{title:{display:true,text:'Return %',color:'#8b8fa3'},grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#8b8fa3'}}}}});
}

// Rebalancing
function renderRebalancing(){
const tb=document.querySelector('#rebalance-table tbody');tb.innerHTML='';
let tv=0;const sv={};
state.assets.forEach(a=>{const v=getAssetValue(a);tv+=v;sv[a.sector]=(sv[a.sector]||0)+v;});
Object.keys(sv).forEach(s=>{
const cp=(sv[s]/tv)*100,tp=state.targetAllocations[s]||0,df=cp-tp;
const act=df>5?'Sell':(df<-5?'Buy':'Hold');
const acl=act==='Sell'?'loss':(act==='Buy'?'profit':'');
const dcl=Math.abs(df)>5?(df>0?'loss':'profit'):'';
tb.innerHTML+='<tr><td><strong>'+s+'</strong></td><td>'+cp.toFixed(2)+'%</td><td><input type="number" class="target-input" data-sector="'+s+'" value="'+tp+'" style="width:60px;background:var(--bg-input);border:1px solid var(--border-color);color:var(--text-primary);padding:4px 8px;border-radius:6px;font-weight:600"> %</td><td class="'+dcl+'">'+(df>0?'+':'')+df.toFixed(2)+'%</td><td class="'+acl+'"><strong>'+act+'</strong></td></tr>';
});
}
function calculateRebalance(){
let tt=0;document.querySelectorAll('.target-input').forEach(i=>{const v=parseFloat(i.value)||0;state.targetAllocations[i.dataset.sector]=v;tt+=v;});
if(Math.abs(tt-100)>0.1){alert('Total must equal 100% (currently '+tt.toFixed(1)+'%)');return;}
saveData(state);renderRebalancing();
}

// Add Asset Form
function updateCostSummary(){
const q=parseFloat(document.getElementById('asset-qty').value)||0;
const p=parseFloat(document.getElementById('asset-price').value)||0;
const cs=document.getElementById('cost-summary');
if(q>0&&p>0){cs.style.display='block';document.getElementById('cost-total').textContent=formatCurrency(q*p);}
else cs.style.display='none';
}
function handleAddTransaction(e){
e.preventDefault();
const type=document.querySelector('input[name="tx-type"]:checked').value;
const ac=document.getElementById('asset-class').value;
let sector=document.getElementById('asset-sector').value.trim();
const symbol=document.getElementById('asset-symbol').value.trim().toUpperCase();
const qty=parseFloat(document.getElementById('asset-qty').value);
const price=parseFloat(document.getElementById('asset-price').value);
const date=document.getElementById('asset-date').value;
const fdRate=parseFloat(document.getElementById('fd-rate').value)||0;
const fdMat=document.getElementById('fd-maturity').value||'';
// Validate
let valid=true;
if(!symbol){showErr('err-symbol');valid=false;}else hideErr('err-symbol');
if(!qty||qty<=0){showErr('err-qty');valid=false;}else hideErr('err-qty');
if(!price||price<0){showErr('err-price');valid=false;}else hideErr('err-price');
if(!date){showErr('err-date');valid=false;}else hideErr('err-date');
if(ac==='FD'){
if(!fdRate){showErr('err-fdrate');valid=false;}else hideErr('err-fdrate');
if(!fdMat){showErr('err-fdmat');valid=false;}else hideErr('err-fdmat');
}
if(!valid)return;
if(!sector){sector=guessSector(symbol);if(ac==='FD')sector='Fixed Income';if(ac==='MF')sector='Mutual Funds';}
state.transactions.push({id:Date.now(),date,symbol,assetClass:ac,type,qty,price});
const ai=state.assets.findIndex(a=>a.symbol===symbol);
if(type==='buy'){
if(ai>=0){const a=state.assets[ai];const ti=(a.qty*a.avgPrice)+(qty*price);a.qty+=qty;a.avgPrice=ti/a.qty;a.currentPrice=price;}
else state.assets.push({id:Date.now()+Math.random(),symbol,assetClass:ac,sector,qty,avgPrice:price,currentPrice:price,purchaseDate:date,fdRate,fdMaturity:fdMat});
}else{
if(ai>=0){const a=state.assets[ai];if(a.qty<qty){alert('Not enough qty!');return;}a.qty-=qty;if(a.qty===0)state.assets.splice(ai,1);}
}
saveData(state);
document.getElementById('add-asset-form').reset();
document.getElementById('asset-date').value=new Date().toISOString().split('T')[0];
document.getElementById('cost-summary').style.display='none';
selectCategory('STOCK');
switchView('portfolio');updateAllViews();
}
function showErr(id){const e=document.getElementById(id);if(e)e.style.display='block';}
function hideErr(id){const e=document.getElementById(id);if(e)e.style.display='none';}
function sellAllAsset(id){
const a=state.assets.find(x=>String(x.id)===String(id));
if(a){state.transactions.push({id:Date.now(),date:new Date().toISOString().split('T')[0],symbol:a.symbol,assetClass:a.assetClass,type:'sell',qty:a.qty,price:a.currentPrice});state.assets=state.assets.filter(x=>String(x.id)!==String(id));saveData(state);updateAllViews();}
}
window.selectCategory=function(cat){
document.getElementById('asset-class').value=cat;
document.querySelectorAll('.cat-btn').forEach(b=>{b.classList.remove('active');});
const ab=document.getElementById('btn-cat-'+cat.toLowerCase());if(ab)ab.classList.add('active');
const fd=document.getElementById('fd-extra-fields');
if(cat==='FD'){document.getElementById('lbl-qty').textContent='Number of FDs';document.getElementById('lbl-price').textContent='Principal (₹)';document.getElementById('lbl-symbol').textContent='FD Name *';fd.style.display='grid';}
else{document.getElementById('lbl-qty').textContent='Quantity *';document.getElementById('lbl-price').textContent='Purchase Price (₹) *';document.getElementById('lbl-symbol').textContent='Asset Name / Symbol *';fd.style.display='none';}
};

// Notifications
function toggleNotifications(){document.getElementById('notif-dropdown').classList.toggle('active');}
function clearNotifications(e){e.stopPropagation();document.getElementById('notif-list').innerHTML='<li style="text-align:center;padding:10px 0;color:var(--text-muted)">All caught up!</li>';const b=document.getElementById('notif-badge');if(b)b.style.display='none';setTimeout(()=>document.getElementById('notif-dropdown').classList.remove('active'),1500);}

// View Mode
window.setViewMode=function(mode){
const c=document.querySelector('.main-content');
document.querySelectorAll('.device-btn').forEach(b=>b.classList.remove('active'));
document.querySelector('.device-btn[data-mode="'+mode+'"]').classList.add('active');
if(mode==='mobile'){c.style.maxWidth='400px';c.style.margin='0 auto';c.style.borderLeft='1px solid var(--border-color)';c.style.borderRight='1px solid var(--border-color)';}
else if(mode==='tablet'){c.style.maxWidth='768px';c.style.margin='0 auto';c.style.borderLeft='1px solid var(--border-color)';c.style.borderRight='1px solid var(--border-color)';}
else{c.style.maxWidth='100%';c.style.margin='0';c.style.border='none';}
setTimeout(()=>Object.values(charts).forEach(ch=>ch&&ch.resize()),300);
};

// Data Export/Import
function exportJSON(){const d="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(state));const a=document.createElement('a');a.href=d;a.download='kuber_backup_'+new Date().toISOString().split('T')[0]+'.json';document.body.appendChild(a);a.click();a.remove();}
function importJSON(event){const f=event.target.files[0];if(!f)return;const r=new FileReader();r.onload=function(e){try{const d=JSON.parse(e.target.result);if(d&&d.assets){state=d;saveData(state);updateAllViews();alert('Restored!');}else alert('Invalid file.');}catch(err){alert('Error reading file.');}};r.readAsText(f);}
function importCSV(){const fi=document.getElementById('csv-file');const f=fi.files[0];if(!f){alert('Select a CSV file.');return;}
Papa.parse(f,{header:true,skipEmptyLines:true,complete:function(r){let c=0;r.data.forEach(row=>{const date=row.Date||row.date,symbol=(row.Symbol||row.symbol||'').toUpperCase(),ac=(row.AssetType||row.assetType||'STOCK').toUpperCase(),qty=parseFloat(row.Qty||row.qty),price=parseFloat(row.Price||row.price),type=(row.Type||row.type||'buy').toLowerCase();if(!date||!symbol||isNaN(qty)||isNaN(price))return;state.transactions.push({id:Date.now()+Math.random(),date,symbol,assetClass:ac,type,qty,price});let ai=state.assets.findIndex(a=>a.symbol===symbol);if(type==='buy'){if(ai>=0){const a=state.assets[ai];const ti=(a.qty*a.avgPrice)+(qty*price);a.qty+=qty;a.avgPrice=ti/a.qty;a.currentPrice=price;}else{let s=guessSector(symbol);if(ac==='FD')s='Fixed Income';if(ac==='MF')s='Mutual Funds';state.assets.push({id:Date.now()+Math.random(),symbol,assetClass:ac,sector:s,qty,avgPrice:price,currentPrice:price});}}else if(type==='sell'&&ai>=0){const a=state.assets[ai];if(a.qty>=qty){a.qty-=qty;if(a.qty===0)state.assets.splice(ai,1);}}c++;});if(c>0){saveData(state);updateAllViews();alert('Imported '+c+' transactions!');fi.value='';}else alert('No valid rows found.');}});}
function exportPDF(){const ov=document.querySelector('.view.active').id;if(ov!=='view-dashboard')switchView('dashboard');setTimeout(()=>{html2pdf().set({margin:0.2,filename:'Kuber_Report.pdf',image:{type:'jpeg',quality:0.98},html2canvas:{scale:2,useCORS:true,backgroundColor:'#0f1117'},jsPDF:{unit:'in',format:'letter',orientation:'portrait'}}).from(document.getElementById('view-dashboard')).save().then(()=>{if(ov!=='view-dashboard')switchView(ov.replace('view-',''));});},500);}

// Live Prices
async function fetchLivePrices(){
const btn=document.getElementById('btn-sync-prices');const oh=btn.innerHTML;btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Syncing...';btn.disabled=true;let uc=0;
const idx=[{sym:'^NSEI',vId:'idx-nifty50-val',cId:'idx-nifty50-change',tId:'tick-nifty50'},{sym:'^BSESN',vId:'idx-sensex-val',cId:'idx-sensex-change',tId:'tick-sensex'}];
for(let ix of idx){try{const u='https://query1.finance.yahoo.com/v8/finance/chart/'+ix.sym+'?interval=1d&range=2d';const r=await fetch('https://api.allorigins.win/get?url='+encodeURIComponent(u));const d=await r.json();if(d.contents){const y=JSON.parse(d.contents);if(y.chart&&y.chart.result&&y.chart.result.length>0){const m=y.chart.result[0].meta,p=m.regularMarketPrice,pc=m.chartPreviousClose,ch=p-pc,cp=(ch/pc)*100;const ve=document.getElementById(ix.vId);if(ve)ve.textContent=p.toLocaleString('en-IN',{maximumFractionDigits:0});const ce=document.getElementById(ix.cId);if(ce){ce.textContent=(ch>=0?'+':'')+cp.toFixed(2)+'%';ce.className='idx-change '+(ch>=0?'profit':'loss');}const te=document.getElementById(ix.tId);if(te){te.textContent=(ch>=0?'+':'')+cp.toFixed(2)+'%';te.className=ch>=0?'profit':'loss';}}}}catch(e){}}
const ua=[];state.assets.forEach(a=>{const ac=a.assetClass||'STOCK';if(!ua.find(x=>x.symbol===a.symbol&&x.ac===ac))ua.push({symbol:a.symbol,ac});});
for(let it of ua){try{if(it.ac==='FD')continue;
if(it.ac==='MF'){let sc=it.symbol;if(isNaN(sc)){const sr=await fetch('https://api.mfapi.in/mf/search?q='+encodeURIComponent(it.symbol));const sd=await sr.json();if(sd&&sd.length>0)sc=sd[0].schemeCode;}if(sc&&!isNaN(sc)){const mr=await fetch('https://api.mfapi.in/mf/'+sc);const md=await mr.json();if(md&&md.data&&md.data.length>0){const nav=parseFloat(md.data[0].nav);if(!isNaN(nav)){state.assets.forEach(a=>{if(a.symbol===it.symbol&&a.assetClass==='MF')a.currentPrice=nav;});uc++;}}}}
else{const u='https://query1.finance.yahoo.com/v8/finance/chart/'+it.symbol+'.NS';const r=await fetch('https://api.allorigins.win/get?url='+encodeURIComponent(u));if(!r.ok)continue;const d=await r.json();if(d.contents){const y=JSON.parse(d.contents);if(y.chart&&y.chart.result&&y.chart.result.length>0){const lp=y.chart.result[0].meta.regularMarketPrice;if(lp){state.assets.forEach(a=>{if(a.symbol===it.symbol&&(!a.assetClass||a.assetClass==='STOCK'||a.assetClass==='ETF'))a.currentPrice=lp;});uc++;}}}}}catch(e){}}
if(uc>0){saveData(state);updateAllViews();btn.innerHTML='<i class="fa-solid fa-check" style="color:var(--profit)"></i> Synced!';setTimeout(()=>{btn.innerHTML=oh;btn.disabled=false;},2000);}else{btn.innerHTML=oh;btn.disabled=false;}
}
