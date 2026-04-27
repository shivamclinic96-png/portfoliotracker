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
    const plPercent = (totalPL / totalInvested) * 100;
    const dailyChangePercent = (dailyChangeValue / totalCurrentValue) * 100;

    // Update DOM
    document.getElementById('dash-total-value').textContent = formatCurrency(totalCurrentValue);
    document.getElementById('dash-total-invested').textContent = formatCurrency(totalInvested);
    
    const plElement = document.getElementById('dash-total-pl');
    plElement.textContent = `${totalPL >= 0 ? '+' : ''}${formatCurrency(totalPL)} (${plPercent.toFixed(2)}%)`;
    plElement.className = `stat-value ${totalPL >= 0 ? 'profit' : 'loss'}`;
    plElement.parentElement.previousElementSibling.className = `stat-icon ${totalPL >= 0 ? 'profit' : 'loss'}`;

    const dailyElement = document.getElementById('dash-daily-change');
    dailyElement.textContent = `${dailyChangeValue >= 0 ? '+' : ''}${formatCurrency(dailyChangeValue)} (${dailyChangePercent.toFixed(2)}%)`;
    dailyElement.className = `stat-value ${dailyChangeValue >= 0 ? 'profit' : 'loss'}`;
    dailyElement.parentElement.previousElementSibling.className = `stat-icon ${dailyChangeValue >= 0 ? 'profit' : 'loss'}`;

    // Render Top Performers Table
    const topPerformersBody = document.querySelector('#top-performers-table tbody');
    topPerformersBody.innerHTML = '';
    
    const sortedAssets = [...state.assets].sort((a, b) => {
        const p1 = (a.currentPrice - a.avgPrice) / a.avgPrice;
        const p2 = (b.currentPrice - b.avgPrice) / b.avgPrice;
        return p2 - p1;
    }).slice(0, 4);

    sortedAssets.forEach(asset => {
        const value = asset.qty * asset.currentPrice;
        const pl = value - (asset.qty * asset.avgPrice);
        const plCls = pl >= 0 ? 'profit' : 'loss';
        const plIcon = pl >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
        
        topPerformersBody.innerHTML += `
            <tr>
                <td><strong>${asset.symbol}</strong></td>
                <td>${formatCurrency(asset.currentPrice)}</td>
                <td class="${plCls}"><i class="fa-solid ${plIcon}"></i> ${formatPercentage(((asset.currentPrice - asset.avgPrice)/asset.avgPrice)*100 || 0)}</td>
                <td>${formatCurrency(value)}</td>
                <td class="${plCls}">${pl >= 0 ? '+' : ''}${formatCurrency(pl)}</td>
            </tr>
        `;
    });

    renderDashboardCharts();
}

function renderDashboardCharts() {
    // 1. Asset Allocation Chart (Doughnut)
    const ctxAlloc = document.getElementById('allocationChart');
    if (charts.allocation) charts.allocation.destroy();

    const labels = state.assets.map(a => a.symbol);
    const data = state.assets.map(a => a.qty * a.currentPrice);
    const bgColors = [
        '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'
    ];

    Chart.defaults.color = '#6b7280';
    Chart.defaults.font.family = "'Outfit', sans-serif";

    charts.allocation = new Chart(ctxAlloc, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: bgColors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            },
            cutout: '70%'
        }
    });

    // 2. Performance Line Chart (Mock Data)
    const ctxPerf = document.getElementById('performanceChart');
    if (charts.performance) charts.performance.destroy();
    
    // Generate mock historical data
    let startVal = 100000;
    const histData = [];
    const histLabels = [];
    for(let i=30; i>=0; i--) {
        histLabels.push(new Date(Date.now() - i*24*60*60*1000).toLocaleDateString('en-IN', {day:'numeric', month:'short'}));
        histData.push(startVal);
        startVal = startVal * (1 + (Math.random() * 0.04 - 0.015)); // slight upward bias
    }

    charts.performance = new Chart(ctxPerf, {
        type: 'line',
        data: {
            labels: histLabels,
            datasets: [{
                label: 'Portfolio Value',
                data: histData,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            }
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

        tbody.innerHTML += `
            <tr>
                <td><strong>${asset.symbol}</strong> <span style="font-size: 10px; opacity: 0.8; border: 1px solid var(--border-color); color: var(--text-secondary); padding: 2px 4px; border-radius: 4px; margin-left: 6px;">${asset.assetClass || 'STOCK'}</span></td>
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
                id: Date.now(),
                symbol: symbol,
                assetClass: assetClass,
                sector: sector,
                qty: qty,
                avgPrice: price,
                currentPrice: price
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

// Add global toggle function for Fixed Deposits
window.toggleAssetFields = function() {
    const assetClass = document.getElementById('asset-class').value;
    const qtyGroup = document.getElementById('qty-group');
    const lblPrice = document.getElementById('lbl-price');
    const qtyInput = document.getElementById('asset-qty');
    const sectorInput = document.getElementById('asset-sector');

    if (assetClass === 'FD') {
        qtyGroup.style.display = 'none';
        qtyInput.value = '1';
        lblPrice.textContent = 'Deposit Amount (₹)';
        if (!sectorInput.value) sectorInput.value = 'Fixed Income';
    } else {
        qtyGroup.style.display = 'block';
        lblPrice.textContent = 'Price (₹)';
        if (qtyInput.value === '1') qtyInput.value = '';
        if (sectorInput.value === 'Fixed Income') sectorInput.value = '';
    }
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
