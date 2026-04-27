// App Navigation and Initialization
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

let charts = {}; // Store chart instances

function initApp() {
    // Setup Navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            switchView(item.dataset.target);
        });
    });

    // Setup Modals
    const addAssetForm = document.getElementById('add-asset-form');
    addAssetForm.addEventListener('submit', handleAddTransaction);
    
    // Setup Filters
    document.getElementById('transaction-filter').addEventListener('change', renderTransactions);
    document.getElementById('portfolio-search').addEventListener('input', renderPortfolio);

    // Initial render
    updateAllViews();
}

function switchView(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show target view
    document.getElementById(`view-${viewId}`).classList.add('active');
    
    // Update Title
    const titleMap = {
        'dashboard': 'Dashboard',
        'portfolio': 'My Portfolio',
        'transactions': 'Transactions',
        'analytics': 'Analytics',
        'rebalancing': 'Portfolio Rebalancing',
        'data': 'Data & Reports'
    };
    document.getElementById('page-title').textContent = titleMap[viewId];
    
    updateAllViews();
}

function updateAllViews() {
    calculateAndRenderDashboard();
    renderPortfolio();
    renderTransactions();
    renderAnalytics();
    renderRebalancing();
}

// ========================
// DASHBOARD LOGIC
// ========================
function calculateAndRenderDashboard() {
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let dailyChangeValue = 0; // Simulated daily change

    state.assets.forEach(asset => {
        const invested = asset.qty * asset.avgPrice;
        const current = asset.qty * asset.currentPrice;
        
        totalInvested += invested;
        totalCurrentValue += current;
        
        // Mock a daily change of random -2% to +2%
        const dailyChangePercent = (Math.random() * 4 - 2) / 100;
        dailyChangeValue += current * dailyChangePercent;
    });

    const totalPL = totalCurrentValue - totalInvested;
    const plPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;
    const dailyChangePercent = totalCurrentValue > 0 ? (dailyChangeValue / totalCurrentValue) * 100 : 0;

    // Update DOM
    document.getElementById('dash-total-value').textContent = formatCurrency(totalCurrentValue);
    document.getElementById('dash-total-invested').textContent = formatCurrency(totalInvested);
    document.getElementById('dash-asset-count').textContent = `${state.assets.length} assets`;
    
    document.getElementById('dash-daily-val').textContent = `${dailyChangeValue >= 0 ? '' : '-'}${formatCurrency(Math.abs(dailyChangeValue))}`;
    
    const dailyPill = document.getElementById('dash-daily-pill');
    dailyPill.textContent = `${dailyChangeValue >= 0 ? '+' : ''}${dailyChangePercent.toFixed(2)}% today`;
    dailyPill.className = `pill ${dailyChangeValue >= 0 ? 'pill-profit' : 'pill-loss'}`;
    
    const dailyPercentText = document.getElementById('dash-daily-percent');
    dailyPercentText.textContent = `${dailyChangeValue >= 0 ? '+' : ''}${dailyChangePercent.toFixed(2)}%`;
    dailyPercentText.className = `stat-sub ${dailyChangeValue >= 0 ? 'profit' : 'loss'}`;

    const plPill = document.getElementById('dash-pl-pill');
    plPill.textContent = `P&L: ${totalPL >= 0 ? '+' : ''}${formatCurrency(totalPL)}`;
    plPill.className = `pill ${totalPL >= 0 ? 'pill-profit' : 'pill-loss'}`;

    const returnPill = document.getElementById('dash-return-pill');
    returnPill.textContent = `${totalPL >= 0 ? '+' : ''}${plPercent.toFixed(2)}% return`;
    returnPill.className = `pill ${totalPL >= 0 ? 'pill-profit' : 'pill-loss'}`;

    // Update Dynamic Ticker
    const tickerEl = document.getElementById('live-ticker');
    if (tickerEl) {
        let tickerHtml = '<span class="ticker-item"><span class="dot"></span> NSE LIVE</span>';
        tickerHtml += '<span class="ticker-item">NIFTY 50 <span class="profit" id="tick-nifty50">--</span></span>';
        tickerHtml += '<span class="ticker-item">SENSEX <span class="profit" id="tick-sensex">--</span></span>';
        
        const tickerAssets = [...state.assets].sort((a,b) => (b.qty*b.currentPrice) - (a.qty*a.currentPrice)).slice(0, 8);
        tickerAssets.forEach(a => {
            const assetPlPercent = a.avgPrice > 0 ? ((a.currentPrice - a.avgPrice)/a.avgPrice)*100 : 0;
            const plCls = assetPlPercent >= 0 ? 'profit' : 'loss';
            tickerHtml += `<span class="ticker-item">${a.symbol} <span class="${plCls}">${assetPlPercent >= 0 ? '+' : ''}${assetPlPercent.toFixed(2)}%</span></span>`;
        });
        tickerEl.innerHTML = tickerHtml;
    }

    // Render Holdings List
    const holdingsList = document.getElementById('dash-holdings-list');
    holdingsList.innerHTML = '';
    
    // Sort by current value
    const sortedAssets = [...state.assets].sort((a, b) => (b.qty * b.currentPrice) - (a.qty * a.currentPrice)).slice(0, 5);

    sortedAssets.forEach(asset => {
        const value = asset.qty * asset.currentPrice;
        const pl = value - (asset.qty * asset.avgPrice);
        const assetPlPercent = asset.avgPrice > 0 ? ((asset.currentPrice - asset.avgPrice) / asset.avgPrice) * 100 : 0;
        const plCls = pl >= 0 ? '' : 'loss';
        
        let iconTxt = asset.symbol.substring(0, 3).toUpperCase();
        
        holdingsList.innerHTML += `
            <div class="holding-row">
                <div class="holding-left">
                    <div class="holding-icon">${iconTxt}</div>
                    <div class="holding-details">
                        <h4>${asset.symbol}</h4>
                        <p>${asset.sector || asset.assetClass || 'Equity'}</p>
                    </div>
                </div>
                <div class="holding-right">
                    <div class="holding-val">${formatCurrency(value)}</div>
                    <div class="holding-pl-pill ${plCls}">${pl >= 0 ? '+' : ''}${formatCurrency(Math.abs(pl))} (${assetPlPercent.toFixed(1)}%)</div>
                </div>
            </div>
        `;
    });

    if(sortedAssets.length === 0) {
        holdingsList.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-secondary); font-size: 13px;">No assets added yet.</div>';
    }

    // Render Allocation List
    const allocList = document.getElementById('dash-allocation-list');
    allocList.innerHTML = '';
    
    const sectorValues = {};
    state.assets.forEach(a => {
        const val = a.qty * a.currentPrice;
        if(sectorValues[a.sector]) sectorValues[a.sector] += val;
        else sectorValues[a.sector] = val;
    });
    
    const sortedSectors = Object.keys(sectorValues).map(s => ({ sector: s, val: sectorValues[s] })).sort((a, b) => b.val - a.val);
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#14b8a6', '#6366f1'];
    
    sortedSectors.forEach((item, index) => {
        const percent = totalCurrentValue > 0 ? (item.val / totalCurrentValue) * 100 : 0;
        const color = colors[index % colors.length];
        
        allocList.innerHTML += `
            <div class="alloc-row">
                <div class="alloc-label"><span class="alloc-dot" style="background: ${color}"></span> ${item.sector.substring(0,12)}</div>
                <div class="alloc-bar-container">
                    <div class="alloc-bar" style="width: ${percent}%; background: ${color}"></div>
                </div>
                <div class="alloc-val">${percent.toFixed(1)}%</div>
            </div>
        `;
    });
    
    if(sortedSectors.length === 0) allocList.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-secondary); font-size: 13px;">No allocation data.</div>';

    renderDashboardCharts();
}

function renderDashboardCharts() {
    const ctx = document.getElementById('heroSparkline');
    if(!ctx) return;
    if (charts.sparkline) charts.sparkline.destroy();
    
    // Generate mock sparkline data
    let startVal = 100;
    const histData = [];
    const histLabels = [];
    for(let i=30; i>=0; i--) {
        histLabels.push(i);
        histData.push(startVal);
        startVal = startVal * (1 + (Math.random() * 0.08 - 0.035));
    }

    charts.sparkline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: histLabels,
            datasets: [{
                data: histData,
                borderColor: 'rgba(255, 255, 255, 0.7)',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                y: { display: false },
                x: { display: false }
            },
            layout: { padding: 0 }
        }
    });
}

// ========================
// PORTFOLIO LOGIC
// ========================
function renderPortfolio() {
    const tbody = document.querySelector('#portfolio-table tbody');
    tbody.innerHTML = '';
    
    const searchTerm = document.getElementById('portfolio-search').value.toLowerCase();
    
    let totalInvested = 0;
    let totalCurrent = 0;
    let portfolioTotal = 0;
    state.assets.forEach(a => portfolioTotal += (a.qty * a.currentPrice));

    const filtered = state.assets.filter(a => a.symbol.toLowerCase().includes(searchTerm) || a.sector.toLowerCase().includes(searchTerm));

    filtered.forEach(asset => {
        const invested = asset.qty * asset.avgPrice;
        const current = asset.qty * asset.currentPrice;
        const pl = current - invested;
        const plPercent = (pl / invested) * 100;
        const allocPercent = portfolioTotal > 0 ? (current / portfolioTotal) * 100 : 0;
        
        totalInvested += invested;
        totalCurrent += current;

        const plCls = pl >= 0 ? 'profit' : 'loss';
        
        let maturityText = '';
        if(asset.assetClass === 'FD' && asset.fdMaturity) {
            // Rough estimate of maturity value for UI using simple interest
            const years = (new Date(asset.fdMaturity) - new Date()) / (1000 * 60 * 60 * 24 * 365);
            const matValue = (asset.qty * asset.avgPrice) + ((asset.qty * asset.avgPrice) * (asset.fdRate || 0)/100 * Math.max(0, years));
            maturityText = `<br><span style="font-size: 10px; color: var(--text-secondary);"><i class="fa-regular fa-clock"></i> Mat. Value: ₹${matValue.toFixed(0)}</span>`;
        }

        tbody.innerHTML += `
            <tr>
                <td><strong>${asset.symbol}</strong> <span style="font-size: 10px; opacity: 0.8; border: 1px solid var(--border-color); color: var(--text-secondary); padding: 2px 4px; border-radius: 4px; margin-left: 6px;">${asset.assetClass || 'STOCK'}</span>${maturityText}</td>
                <td><span style="background: var(--bg-main); padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; color: var(--text-primary); border: 1px solid var(--border-color);">${asset.sector}</span></td>
                <td>${asset.qty}</td>
                <td>${formatCurrency(asset.avgPrice)}</td>
                <td>${formatCurrency(asset.currentPrice)}</td>
                <td>${formatCurrency(current)}</td>
                <td><strong>${allocPercent.toFixed(2)}%</strong></td>
                <td class="${plCls}">${pl >= 0 ? '+' : ''}${formatCurrency(pl)} <br><small>(${plPercent.toFixed(2)}%)</small></td>
                <td>
                    <button class="action-btn" title="Add More" onclick="openAddAssetModal('${asset.symbol}')"><i class="fa-solid fa-plus"></i></button>
                    <button class="action-btn delete" title="Sell All" onclick="sellAllAsset(${asset.id})"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });

    if(filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">No assets found.</td></tr>`;
    }
}

// ========================
// TRANSACTIONS LOGIC
// ========================
function renderTransactions() {
    const tbody = document.querySelector('#transactions-table tbody');
    tbody.innerHTML = '';
    
    const filter = document.getElementById('transaction-filter').value;
    
    let filtered = [...state.transactions].reverse(); // newest first
    if(filter !== 'all') {
        filtered = filtered.filter(t => t.type === filter);
    }

    filtered.forEach(tx => {
        const total = tx.qty * tx.price;
        const typeCls = tx.type === 'buy' ? 'profit' : 'loss';
        
        tbody.innerHTML += `
            <tr>
                <td>${tx.date}</td>
                <td><strong>${tx.symbol}</strong></td>
                <td><span class="${tx.type === 'buy' ? 'bg-profit' : 'bg-loss'}" style="text-transform: capitalize;">${tx.type}</span></td>
                <td>${tx.qty}</td>
                <td>${formatCurrency(tx.price)}</td>
                <td>${formatCurrency(total)}</td>
            </tr>
        `;
    });
    
    if(filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No transaction history found.</td></tr>`;
    }
}

function clearAllTransactions() {
    state.transactions = [];
    saveData(state);
    updateAllViews();
}

// ========================
// ANALYTICS LOGIC
// ========================
function renderAnalytics() {
    // Group by Sector
    const sectorData = {};
    state.assets.forEach(a => {
        const val = a.qty * a.currentPrice;
        if(sectorData[a.sector]) sectorData[a.sector] += val;
        else sectorData[a.sector] = val;
    });

    const ctxSector = document.getElementById('sectorChart');
    if (charts.sector) charts.sector.destroy();
    
    charts.sector = new Chart(ctxSector, {
        type: 'bar',
        data: {
            labels: Object.keys(sectorData),
            datasets: [{
                label: 'Value (₹)',
                data: Object.values(sectorData),
                backgroundColor: '#8b5cf6',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });

    // Market Cap Allocation (Mock logic: large cap > 2000, mid < 2000 > 1000, small < 1000)
    let large = 0, mid = 0, small = 0;
    state.assets.forEach(a => {
        const val = a.qty * a.currentPrice;
        if(a.currentPrice > 2000) large += val;
        else if (a.currentPrice > 1000) mid += val;
        else small += val;
    });

    const ctxCap = document.getElementById('marketCapChart');
    if (charts.marketCap) charts.marketCap.destroy();
    
    charts.marketCap = new Chart(ctxCap, {
        type: 'pie',
        data: {
            labels: ['Large Cap', 'Mid Cap', 'Small Cap'],
            datasets: [{
                data: [large, mid, small],
                backgroundColor: ['#3b82f6', '#f59e0b', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });

    // Risk vs Return (Scatter Mock)
    const ctxRisk = document.getElementById('riskReturnChart');
    if (charts.risk) charts.risk.destroy();
    
    const scatterData = state.assets.map(a => ({
        x: (Math.random() * 20), // mock risk (volatility)
        y: ((a.currentPrice - a.avgPrice)/a.avgPrice)*100, // actual return
        symbol: a.symbol
    }));

    charts.risk = new Chart(ctxRisk, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Assets',
                data: scatterData,
                backgroundColor: '#10b981',
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return ctx.raw.symbol + ': ' + ctx.raw.y.toFixed(2) + '% Return';
                        }
                    }
                }
            },
            scales: {
                x: { 
                    title: { display: true, text: 'Risk (Volatility %)' },
                    grid: { color: 'rgba(0,0,0,0.05)' } 
                },
                y: { 
                    title: { display: true, text: 'Return (%)' },
                    grid: { color: 'rgba(0,0,0,0.05)' } 
                }
            }
        }
    });
}

// ========================
// REBALANCING LOGIC
// ========================
function renderRebalancing() {
    const tbody = document.querySelector('#rebalance-table tbody');
    tbody.innerHTML = '';
    
    let totalValue = 0;
    const sectorValues = {};
    
    // Initialize targets if not complete
    const targets = state.targetAllocations;
    
    state.assets.forEach(a => {
        const val = a.qty * a.currentPrice;
        totalValue += val;
        if(sectorValues[a.sector]) sectorValues[a.sector] += val;
        else sectorValues[a.sector] = val;
    });

    Object.keys(sectorValues).forEach(sector => {
        const currentPercent = (sectorValues[sector] / totalValue) * 100;
        const targetPercent = targets[sector] || 0;
        const diff = currentPercent - targetPercent;
        
        const action = diff > 5 ? 'Sell' : (diff < -5 ? 'Buy' : 'Hold');
        const actionCls = action === 'Sell' ? 'loss' : (action === 'Buy' ? 'profit' : 'text-secondary');
        
        const diffText = `${diff > 0 ? '+' : ''}${diff.toFixed(2)}%`;
        const diffCls = Math.abs(diff) > 5 ? (diff > 0 ? 'loss' : 'profit') : ''; // Overallocated = red, Underallocated = green

        tbody.innerHTML += `
            <tr>
                <td><strong>${sector}</strong></td>
                <td>${currentPercent.toFixed(2)}%</td>
                <td>
                    <input type="number" class="target-input" data-sector="${sector}" value="${targetPercent}" style="width:60px; background:var(--bg-main); border:1px solid var(--border-color); color:var(--text-primary); padding:4px 8px; border-radius:6px; font-weight: 600;"> %
                </td>
                <td class="${diffCls}">${diffText}</td>
                <td class="${actionCls}"><strong>${action}</strong></td>
            </tr>
        `;
    });
}

function calculateRebalance() {
    // Update targets from inputs
    const inputs = document.querySelectorAll('.target-input');
    let totalTarget = 0;
    
    inputs.forEach(input => {
        const val = parseFloat(input.value) || 0;
        state.targetAllocations[input.dataset.sector] = val;
        totalTarget += val;
    });

    if(Math.abs(totalTarget - 100) > 0.1) {
        alert('Total target allocation must equal 100%');
        return;
    }
    
    saveData(state);
    renderRebalancing();
}

// ========================
// MODALS AND ACTIONS
// ========================
function openAddAssetModal(symbol = '') {
    const modal = document.getElementById('add-asset-modal');
    modal.classList.add('active');
    
    if(symbol) {
        document.getElementById('asset-symbol').value = symbol;
    } else {
        document.getElementById('add-asset-form').reset();
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        document.getElementById('asset-date').value = `${yyyy}-${mm}-${dd}`;
    }
}

function closeAddAssetModal() {
    document.getElementById('add-asset-modal').classList.remove('active');
}

function handleAddTransaction(e) {
    e.preventDefault();
    
    const type = document.querySelector('input[name="tx-type"]:checked').value;
    const assetClass = document.getElementById('asset-class').value;
    let sector = document.getElementById('asset-sector').value.trim();
    const symbol = document.getElementById('asset-symbol').value.toUpperCase();
    const qty = parseFloat(document.getElementById('asset-qty').value);
    const price = parseFloat(document.getElementById('asset-price').value);
    const date = document.getElementById('asset-date').value;
    const fdRate = parseFloat(document.getElementById('fd-rate').value) || 0;
    const fdMaturity = document.getElementById('fd-maturity').value || '';

    if (!sector) {
        sector = guessSector(symbol);
        if(assetClass === 'FD') sector = 'Fixed Income';
        if(assetClass === 'MF') sector = 'Mutual Funds';
    }

    // 1. Add to transactions
    state.transactions.push({
        id: Date.now(), date, symbol, type, qty, price
    });

    // 2. Update Portfolio
    const assetIndex = state.assets.findIndex(a => a.symbol === symbol);
    
    if(type === 'buy') {
        if(assetIndex >= 0) {
            // Update avg price
            const a = state.assets[assetIndex];
            const totalInvested = (a.qty * a.avgPrice) + (qty * price);
            a.qty += qty;
            a.avgPrice = totalInvested / a.qty;
            a.currentPrice = price; // Update LTP
        } else {
            // New asset
            state.assets.push({
                id: Date.now() + Math.random(),
                symbol: symbol,
                assetClass: assetClass,
                sector: sector,
                qty: qty,
                avgPrice: price,
                currentPrice: price,
                fdRate: fdRate,
                fdMaturity: fdMaturity
            });
        }
    } else if (type === 'sell') {
        if(assetIndex >= 0) {
            const a = state.assets[assetIndex];
            if(a.qty < qty) {
                alert('Not enough quantity to sell!');
                return;
            }
            a.qty -= qty;
            if(a.qty === 0) {
                state.assets.splice(assetIndex, 1);
            }
        }
    }

    saveData(state);
    closeAddAssetModal();
    updateAllViews();
}

function sellAllAsset(id) {
    // Convert to string for safe comparison
    const asset = state.assets.find(a => String(a.id) === String(id));
    
    if(asset) {
        state.transactions.push({
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            symbol: asset.symbol,
            type: 'sell',
            qty: asset.qty,
            price: asset.currentPrice
        });
        
        state.assets = state.assets.filter(a => String(a.id) !== String(id));
        saveData(state);
        updateAllViews();
    } else {
        console.error("Asset not found for id:", id);
        alert("Error: Could not find asset to delete.");
    }
}

// ========================
// LIVE DATA FETCHING
// ========================
async function fetchLivePrices() {
    const btn = document.getElementById('btn-sync-prices');
    const originalHtml = btn.innerHTML;
    
    // Set loading state
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing...';
    btn.disabled = true;
    
    let updatedCount = 0;
    
    // 1. Fetch Indices (Nifty 50, Sensex, Bank Nifty)
    const indices = [
        { sym: '^NSEI', valId: 'idx-nifty50-val', changeId: 'idx-nifty50-change', tickId: 'tick-nifty50' },
        { sym: '^BSESN', valId: 'idx-sensex-val', changeId: 'idx-sensex-change', tickId: 'tick-sensex' },
        { sym: '^NSEBANK', valId: 'idx-banknifty-val', changeId: 'idx-banknifty-change', tickId: 'tick-banknifty' }
    ];

    for (let idx of indices) {
        try {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${idx.sym}?interval=1d&range=2d`;
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
            const res = await fetch(proxyUrl);
            const data = await res.json();
            if(data.contents) {
                const yfData = JSON.parse(data.contents);
                if (yfData.chart && yfData.chart.result && yfData.chart.result.length > 0) {
                    const meta = yfData.chart.result[0].meta;
                    const price = meta.regularMarketPrice;
                    const prevClose = meta.chartPreviousClose;
                    const change = price - prevClose;
                    const changePct = (change / prevClose) * 100;
                    
                    const valEl = document.getElementById(idx.valId);
                    if(valEl) valEl.textContent = price.toLocaleString('en-IN', {maximumFractionDigits: 0});
                    
                    const changeStr = `${change >= 0 ? '+' : ''}${changePct.toFixed(2)}%`;
                    
                    const changeEl = document.getElementById(idx.changeId);
                    if(changeEl) {
                        changeEl.textContent = changeStr;
                        changeEl.className = `idx-change ${change >= 0 ? 'profit' : 'loss'}`;
                    }
                    
                    const tickEl = document.getElementById(idx.tickId);
                    if(tickEl) {
                        tickEl.textContent = changeStr;
                        tickEl.className = change >= 0 ? 'profit' : 'loss';
                    }
                }
            }
        } catch(e) { console.error('Index fetch error', e); }
    }
    
    // Group unique assets by class and symbol to avoid redundant API calls
    const uniqueAssets = [];
    state.assets.forEach(a => {
        const aClass = a.assetClass || 'STOCK';
        if (!uniqueAssets.find(ua => ua.symbol === a.symbol && ua.assetClass === aClass)) {
            uniqueAssets.push({ symbol: a.symbol, assetClass: aClass });
        }
    });

    for (let item of uniqueAssets) {
        try {
            if (item.assetClass === 'FD') {
                continue; // Fixed Deposits don't have a live market price
            }
            else if (item.assetClass === 'MF') {
                let schemeCode = item.symbol;
                let officialName = item.symbol;
                
                // If the user typed a name instead of a scheme code, search for it
                if (isNaN(schemeCode)) {
                    const searchRes = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(item.symbol)}`);
                    const searchData = await searchRes.json();
                    if (searchData && searchData.length > 0) {
                        schemeCode = searchData[0].schemeCode;
                    }
                }
                
                // Fetch the actual NAV using the scheme code
                if (schemeCode && !isNaN(schemeCode)) {
                    const mfRes = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
                    const mfData = await mfRes.json();
                    if (mfData && mfData.data && mfData.data.length > 0) {
                        const latestNav = parseFloat(mfData.data[0].nav);
                        if (!isNaN(latestNav)) {
                            if(mfData.meta && mfData.meta.scheme_name) {
                                officialName = mfData.meta.scheme_name;
                            }
                            
                            // Update all matching MF assets in the state
                            state.assets.forEach(a => {
                                if (a.symbol === item.symbol && a.assetClass === 'MF') {
                                    a.currentPrice = latestNav;
                                    a.symbol = officialName; // Correct their input to the official scheme name
                                }
                            });
                            updatedCount++;
                        }
                    }
                }
            }
            else {
                // STOCK FETCH
                const yfSymbol = item.symbol + '.NS';
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yfSymbol}`;
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                
                const res = await fetch(proxyUrl);
                if (!res.ok) throw new Error('Network response was not ok');
                
                const data = await res.json();
                if(data.contents) {
                    const yfData = JSON.parse(data.contents);
                    if (yfData.chart && yfData.chart.result && yfData.chart.result.length > 0) {
                        const livePrice = yfData.chart.result[0].meta.regularMarketPrice;
                        if (livePrice) {
                            state.assets.forEach(a => {
                                if (a.symbol === item.symbol && (!a.assetClass || a.assetClass === 'STOCK')) {
                                    a.currentPrice = livePrice;
                                }
                            });
                            updatedCount++;
                        }
                    }
                }
            }
        } catch(e) {
            console.error(`Failed to fetch live price for ${item.symbol}:`, e);
        }
    }
    
    if (updatedCount > 0) {
        saveData(state);
        updateAllViews();
        
        // Show success briefly
        btn.innerHTML = '<i class="fa-solid fa-check" style="color:var(--profit);"></i> Synced!';
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }, 2000);
    } else {
        alert("Could not fetch live prices at this moment. The proxy might be rate-limited.");
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }
}

// ========================
// NOTIFICATIONS LOGIC
// ========================
function toggleNotifications() {
    const dropdown = document.getElementById('notif-dropdown');
    dropdown.classList.toggle('active');
}

function clearNotifications(e) {
    e.stopPropagation(); // Prevent closing the dropdown immediately or re-triggering parent click
    document.getElementById('notif-list').innerHTML = '<li style="text-align:center; padding: 10px 0;">All caught up!</li>';
    const badge = document.getElementById('notif-badge');
    if (badge) badge.style.display = 'none';
    
    // Close dropdown after 1.5 seconds
    setTimeout(() => {
        document.getElementById('notif-dropdown').classList.remove('active');
    }, 1500);
}

// Category Selection Logic
window.selectCategory = function(cat) {
    document.getElementById('asset-class').value = cat;
    
    // reset buttons
    document.querySelectorAll('.cat-btn').forEach(b => {
        b.classList.remove('active');
        b.style.borderColor = 'var(--border-color)';
        b.style.background = 'white';
        b.style.color = 'var(--text-secondary)';
    });
    
    // set active
    const activeBtn = document.getElementById('btn-cat-' + cat.toLowerCase());
    if(activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.style.borderColor = 'var(--profit)';
        activeBtn.style.background = 'var(--profit-bg)';
        activeBtn.style.color = 'var(--accent-primary)';
    }

    const qtyGroup = document.getElementById('qty-group');
    const lblPrice = document.getElementById('lbl-price');
    const lblSymbol = document.getElementById('lbl-symbol');
    const fdExtra = document.getElementById('fd-extra-fields');

    if (cat === 'FD') {
        document.getElementById('lbl-qty').textContent = 'Number of FDs';
        lblPrice.textContent = 'Principal (₹)';
        lblSymbol.textContent = 'FD Name';
        fdExtra.style.display = 'grid';
    } else {
        document.getElementById('lbl-qty').textContent = 'Quantity';
        lblPrice.textContent = 'Purchase Price (₹)';
        lblSymbol.textContent = 'Asset Name / Symbol';
        fdExtra.style.display = 'none';
    }
};

// Device View Mode Toggle
window.setViewMode = function(mode) {
    const container = document.querySelector('.main-content');
    const btns = document.querySelectorAll('.device-btn');
    btns.forEach(b => b.classList.remove('active'));
    document.querySelector(`.device-btn[data-mode="${mode}"]`).classList.add('active');

    if(mode === 'mobile') {
        container.style.maxWidth = '400px';
        container.style.margin = '0 auto';
        container.style.borderLeft = '1px solid var(--border-color)';
        container.style.borderRight = '1px solid var(--border-color)';
        container.style.boxShadow = 'var(--shadow-md)';
    } else if (mode === 'tablet') {
        container.style.maxWidth = '768px';
        container.style.margin = '0 auto';
        container.style.borderLeft = '1px solid var(--border-color)';
        container.style.borderRight = '1px solid var(--border-color)';
        container.style.boxShadow = 'var(--shadow-md)';
    } else {
        container.style.maxWidth = '100%';
        container.style.margin = '0';
        container.style.border = 'none';
        container.style.boxShadow = 'none';
    }
    
    // resize charts
    setTimeout(() => {
        Object.values(charts).forEach(c => c && c.resize());
    }, 300);
};

// ========================
// DATA & REPORTS LOGIC
// ========================

function exportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "kuber_backup_" + new Date().toISOString().split('T')[0] + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importJSON(event) {
    const file = event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedState = JSON.parse(e.target.result);
            if(importedState && importedState.assets && importedState.transactions) {
                state = importedState;
                saveData(state);
                updateAllViews();
                alert("Backup restored successfully!");
            } else {
                alert("Invalid backup file format.");
            }
        } catch(err) {
            alert("Error reading JSON file.");
        }
    };
    reader.readAsText(file);
}

function importCSV() {
    const fileInput = document.getElementById('csv-file');
    const file = fileInput.files[0];
    if(!file) {
        alert("Please select a CSV file first.");
        return;
    }

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            const data = results.data;
            let importedCount = 0;
            
            data.forEach(row => {
                // Expected columns: Date, Symbol, AssetType, Qty, Price, Type
                const date = row.Date || row.date;
                const symbol = (row.Symbol || row.symbol || '').toUpperCase();
                const assetClass = (row.AssetType || row.assetType || 'STOCK').toUpperCase();
                const qty = parseFloat(row.Qty || row.qty);
                const price = parseFloat(row.Price || row.price);
                const type = (row.Type || row.type || 'buy').toLowerCase();

                if(!date || !symbol || isNaN(qty) || isNaN(price)) return; // skip invalid rows

                // Add to transactions
                state.transactions.push({
                    id: Date.now() + Math.random(),
                    date: date,
                    symbol: symbol,
                    type: type,
                    qty: qty,
                    price: price,
                    assetClass: assetClass
                });

                // Reconstruct portfolio logic for bulk import
                let assetIndex = state.assets.findIndex(a => a.symbol === symbol);
                if(type === 'buy') {
                    if(assetIndex >= 0) {
                        const a = state.assets[assetIndex];
                        const totalInvested = (a.qty * a.avgPrice) + (qty * price);
                        a.qty += qty;
                        a.avgPrice = totalInvested / a.qty;
                        a.currentPrice = price;
                    } else {
                        let sector = guessSector(symbol);
                        if(assetClass === 'FD') sector = 'Fixed Income';
                        if(assetClass === 'MF') sector = 'Mutual Funds';
                        
                        state.assets.push({
                            id: Date.now() + Math.random(),
                            symbol: symbol,
                            assetClass: assetClass,
                            sector: sector,
                            qty: qty,
                            avgPrice: price,
                            currentPrice: price
                        });
                    }
                } else if(type === 'sell' && assetIndex >= 0) {
                    const a = state.assets[assetIndex];
                    if(a.qty >= qty) {
                        a.qty -= qty;
                        if(a.qty === 0) state.assets.splice(assetIndex, 1);
                    }
                }
                importedCount++;
            });

            if(importedCount > 0) {
                saveData(state);
                updateAllViews();
                alert(`Successfully imported ${importedCount} transactions!`);
                fileInput.value = ''; // Reset input
            } else {
                alert("No valid transactions found in CSV. Check column headers.");
            }
        }
    });
}

function exportPDF() {
    const originalView = document.querySelector('.view.active').id;
    if(originalView !== 'view-dashboard') switchView('dashboard');
    
    // Ensure charts have rendered
    setTimeout(() => {
        const element = document.getElementById('view-dashboard');
        
        const opt = {
            margin:       0.2,
            filename:     'Kuber_Portfolio_Report.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#f4f7f6' },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            // Revert to original view
            if(originalView !== 'view-dashboard') switchView(originalView.replace('view-', ''));
        });
    }, 500);
}
