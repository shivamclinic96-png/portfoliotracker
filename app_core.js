let charts={};
document.addEventListener('DOMContentLoaded',()=>{initApp()});
function initApp(){
document.querySelectorAll('.nav-item').forEach(item=>{
item.addEventListener('click',()=>{
document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
item.classList.add('active');switchView(item.dataset.target);
});});
document.getElementById('add-asset-form').addEventListener('submit',handleAddTransaction);
document.getElementById('transaction-filter').addEventListener('change',renderTransactions);
document.getElementById('portfolio-search').addEventListener('input',renderPortfolio);
['asset-qty','asset-price'].forEach(id=>{
document.getElementById(id).addEventListener('input',updateCostSummary);});
const d=new Date();document.getElementById('asset-date').value=d.toISOString().split('T')[0];
updateAllViews();
}
function switchView(v){
document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
document.getElementById('view-'+v).classList.add('active');
const m={'dashboard':'Dashboard','portfolio':'My Portfolio','add-asset':'Add Asset','transactions':'Transactions','analytics':'Analytics','rebalancing':'Rebalancing','data':'Data & Reports'};
document.getElementById('page-title').textContent=m[v]||v;
updateAllViews();
}
function updateAllViews(){calculateAndRenderDashboard();renderPortfolio();renderTransactions();renderAnalytics();renderRebalancing();}
function getAssetValue(a){return a.assetClass==='FD'?getFDCurrentValue(a):a.qty*a.currentPrice;}
function calculateAndRenderDashboard(){
let ti=0,tv=0,dv=0,bestA=null,bestP=-Infinity;
state.assets.forEach(a=>{
const inv=a.qty*a.avgPrice,cur=getAssetValue(a);
ti+=inv;tv+=cur;
const dp=(Math.random()*4-2)/100;dv+=cur*dp;
const ret=inv>0?((cur-inv)/inv)*100:0;
if(ret>bestP){bestP=ret;bestA=a;}
});
const pl=tv-ti,plP=ti>0?(pl/ti)*100:0,dvP=tv>0?(dv/tv)*100:0;
document.getElementById('dash-total-value').textContent=formatCurrency(tv);
document.getElementById('dash-total-invested').textContent=formatCurrency(ti);
document.getElementById('dash-asset-count').textContent=state.assets.length+' assets';
document.getElementById('dash-daily-val').textContent=(dv>=0?'':'-')+formatCurrency(Math.abs(dv));
const dp=document.getElementById('dash-daily-pill');
dp.textContent=(dv>=0?'+':'')+dvP.toFixed(2)+'% today';dp.className='pill '+(dv>=0?'pill-profit':'pill-loss');
const dpc=document.getElementById('dash-daily-percent');
dpc.textContent=(dv>=0?'+':'')+dvP.toFixed(2)+'%';dpc.className='stat-sub '+(dv>=0?'profit':'loss');
const pp=document.getElementById('dash-pl-pill');
pp.textContent='P&L: '+(pl>=0?'+':'')+formatCurrency(pl);pp.className='pill '+(pl>=0?'pill-profit':'pill-loss');
const rp=document.getElementById('dash-return-pill');
rp.textContent=(pl>=0?'+':'')+plP.toFixed(2)+'% return';rp.className='pill '+(pl>=0?'pill-profit':'pill-loss');
const tpl=document.getElementById('dash-total-pl');
tpl.textContent=(pl>=0?'+':'')+formatCurrency(Math.abs(pl));tpl.className='stat-val '+(pl>=0?'profit':'loss');
const tplp=document.getElementById('dash-total-pl-pct');
tplp.textContent=(pl>=0?'+':'')+plP.toFixed(2)+'%';tplp.className='stat-sub '+(pl>=0?'profit':'loss');
const bp=document.getElementById('dash-best-perf'),bpp=document.getElementById('dash-best-perf-pct');
if(bestA){bp.textContent=bestA.symbol;bpp.textContent='+'+bestP.toFixed(1)+'%';bpp.className='stat-sub profit';}
else{bp.textContent='--';bpp.textContent='--';}
// Ticker
const tk=document.getElementById('live-ticker');
if(tk){let h='<span class="ticker-item"><span class="dot"></span> NSE LIVE</span>';
h+='<span class="ticker-item">NIFTY 50 <span class="profit" id="tick-nifty50">--</span></span>';
h+='<span class="ticker-item">SENSEX <span class="profit" id="tick-sensex">--</span></span>';
[...state.assets].sort((a,b)=>getAssetValue(b)-getAssetValue(a)).slice(0,6).forEach(a=>{
const p=a.avgPrice>0?((a.currentPrice-a.avgPrice)/a.avgPrice)*100:0;
h+='<span class="ticker-item">'+a.symbol+' <span class="'+(p>=0?'profit':'loss')+'">'+(p>=0?'+':'')+p.toFixed(2)+'%</span></span>';
});tk.innerHTML=h;}
// Holdings
const hl=document.getElementById('dash-holdings-list');hl.innerHTML='';
const sa=[...state.assets].sort((a,b)=>getAssetValue(b)-getAssetValue(a)).slice(0,5);
sa.forEach(a=>{const v=getAssetValue(a),inv=a.qty*a.avgPrice,p=v-inv,pp=inv>0?((v-inv)/inv)*100:0;
hl.innerHTML+='<div class="holding-row"><div class="holding-left"><div class="holding-icon">'+a.symbol.substring(0,3)+'</div><div class="holding-details"><h4>'+a.symbol+'</h4><p>'+(a.assetClass||'STOCK')+'</p></div></div><div class="holding-right"><div class="holding-val">'+formatCurrency(v)+'</div><div class="holding-pl-pill '+(p<0?'loss':'')+'">'+(p>=0?'+':'')+formatCurrency(Math.abs(p))+' ('+pp.toFixed(1)+'%)</div></div></div>';
});
if(!sa.length)hl.innerHTML='<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px;">No assets yet.</div>';
// Allocation
const al=document.getElementById('dash-allocation-list');al.innerHTML='';
const sv={};state.assets.forEach(a=>{const v=getAssetValue(a);sv[a.sector]=(sv[a.sector]||0)+v;});
const ss=Object.keys(sv).map(s=>({sector:s,val:sv[s]})).sort((a,b)=>b.val-a.val);
const cl=['#6366f1','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];
ss.forEach((it,i)=>{const pc=tv>0?(it.val/tv)*100:0;const c=cl[i%cl.length];
al.innerHTML+='<div class="alloc-row"><div class="alloc-label"><span class="alloc-dot" style="background:'+c+'"></span>'+it.sector.substring(0,12)+'</div><div class="alloc-bar-container"><div class="alloc-bar" style="width:'+pc+'%;background:'+c+'"></div></div><div class="alloc-val">'+pc.toFixed(1)+'%</div></div>';
});
if(!ss.length)al.innerHTML='<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px;">No data.</div>';
renderSparkline();
}
function renderSparkline(){
const c=document.getElementById('heroSparkline');if(!c)return;
if(charts.sparkline)charts.sparkline.destroy();
let v=100;const d=[],l=[];
for(let i=30;i>=0;i--){l.push(i);d.push(v);v=v*(1+(Math.random()*0.08-0.035));}
charts.sparkline=new Chart(c,{type:'line',data:{labels:l,datasets:[{data:d,borderColor:'rgba(99,102,241,0.6)',borderWidth:2,tension:0.4,pointRadius:0,fill:true,backgroundColor:'rgba(99,102,241,0.05)'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{enabled:false}},scales:{y:{display:false},x:{display:false}},layout:{padding:0}}});
}
