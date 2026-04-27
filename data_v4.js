// Global State and Data Management
const StorageKey = 'kuber_portfolio_data';

const initialData = {
    assets: [
        { id: 1, symbol: 'RELIANCE', assetClass: 'STOCK', sector: 'Energy', qty: 50, avgPrice: 2400.50, currentPrice: 2850.25, purchaseDate: '2023-01-15' },
        { id: 2, symbol: 'TCS', assetClass: 'STOCK', sector: 'IT', qty: 25, avgPrice: 3200.00, currentPrice: 3850.75, purchaseDate: '2023-02-10' },
        { id: 3, symbol: 'HDFCBANK', assetClass: 'STOCK', sector: 'Finance', qty: 100, avgPrice: 1550.00, currentPrice: 1450.50, purchaseDate: '2023-03-05' },
        { id: 4, symbol: 'INFY', assetClass: 'STOCK', sector: 'IT', qty: 40, avgPrice: 1400.00, currentPrice: 1620.00, purchaseDate: '2023-04-12' },
        { id: 5, symbol: 'ICICIBANK', assetClass: 'STOCK', sector: 'Finance', qty: 80, avgPrice: 900.25, currentPrice: 1050.80, purchaseDate: '2023-05-20' },
        { id: 6, symbol: 'ITC', assetClass: 'STOCK', sector: 'FMCG', qty: 200, avgPrice: 300.00, currentPrice: 420.15, purchaseDate: '2023-06-15' },
        { id: 7, symbol: 'SBI FD', assetClass: 'FD', sector: 'Fixed Income', qty: 1, avgPrice: 500000, currentPrice: 500000, purchaseDate: '2023-07-01', fdRate: 7.10, fdMaturity: '2026-07-01' },
        { id: 8, symbol: 'LT', assetClass: 'STOCK', sector: 'Infrastructure', qty: 15, avgPrice: 2100.00, currentPrice: 3350.00, purchaseDate: '2023-07-22' }
    ],
    transactions: [
        { id: 1, date: '2023-01-15', symbol: 'RELIANCE', assetClass: 'STOCK', type: 'buy', qty: 50, price: 2400.50 },
        { id: 2, date: '2023-02-10', symbol: 'TCS', assetClass: 'STOCK', type: 'buy', qty: 25, price: 3200.00 },
        { id: 3, date: '2023-03-05', symbol: 'HDFCBANK', assetClass: 'STOCK', type: 'buy', qty: 100, price: 1550.00 },
        { id: 4, date: '2023-04-12', symbol: 'INFY', assetClass: 'STOCK', type: 'buy', qty: 40, price: 1400.00 },
        { id: 5, date: '2023-05-20', symbol: 'ICICIBANK', assetClass: 'STOCK', type: 'buy', qty: 80, price: 900.25 },
        { id: 6, date: '2023-06-15', symbol: 'ITC', assetClass: 'STOCK', type: 'buy', qty: 200, price: 300.00 },
        { id: 7, date: '2023-07-01', symbol: 'SBI FD', assetClass: 'FD', type: 'buy', qty: 1, price: 500000 },
        { id: 8, date: '2023-07-22', symbol: 'LT', assetClass: 'STOCK', type: 'buy', qty: 15, price: 2100.00 }
    ],
    targetAllocations: {
        'Finance': 25,
        'IT': 20,
        'Energy': 15,
        'FMCG': 10,
        'Infrastructure': 10,
        'Fixed Income': 20
    }
};

function saveData(data) {
    try { localStorage.setItem(StorageKey, JSON.stringify(data)); }
    catch (e) { console.warn('localStorage unavailable', e); }
}

function loadData() {
    try {
        const saved = localStorage.getItem(StorageKey);
        if (saved) return JSON.parse(saved);
    } catch (e) { console.warn('localStorage unavailable', e); }
    saveData(initialData);
    return JSON.parse(JSON.stringify(initialData));
}

let state = loadData();

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
}

function formatPercentage(amount) { return amount.toFixed(2) + '%'; }

function guessSector(symbol) {
    const s = symbol.toUpperCase();
    if (s.includes('BANK')) return 'Finance';
    if (['TCS', 'INFY', 'WIPRO', 'HCLTECH'].includes(s)) return 'IT';
    if (['RELIANCE', 'ONGC', 'NTPC'].includes(s)) return 'Energy';
    if (['ITC', 'HUL', 'BRITANNIA'].includes(s)) return 'FMCG';
    return 'Other';
}

// Compute FD current value using simple interest accrued till today
function getFDCurrentValue(asset) {
    if (asset.assetClass !== 'FD') return asset.qty * asset.currentPrice;
    const principal = asset.qty * asset.avgPrice;
    const rate = asset.fdRate || 0;
    const start = new Date(asset.purchaseDate || '2023-01-01');
    const now = new Date();
    const years = Math.max(0, (now - start) / (1000 * 60 * 60 * 24 * 365.25));
    return principal + (principal * rate / 100 * years);
}
