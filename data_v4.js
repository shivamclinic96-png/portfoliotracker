// Global State and Data Management
const StorageKey = 'kuber_portfolio_data';

const initialData = {
    assets: [
        { id: 1, symbol: 'RELIANCE', sector: 'Energy', qty: 50, avgPrice: 2400.50, currentPrice: 2850.25 },
        { id: 2, symbol: 'TCS', sector: 'IT', qty: 25, avgPrice: 3200.00, currentPrice: 3850.75 },
        { id: 3, symbol: 'HDFCBANK', sector: 'Finance', qty: 100, avgPrice: 1550.00, currentPrice: 1450.50 },
        { id: 4, symbol: 'INFY', sector: 'IT', qty: 40, avgPrice: 1400.00, currentPrice: 1620.00 },
        { id: 5, symbol: 'ICICIBANK', sector: 'Finance', qty: 80, avgPrice: 900.25, currentPrice: 1050.80 },
        { id: 6, symbol: 'ITC', sector: 'FMCG', qty: 200, avgPrice: 300.00, currentPrice: 420.15 },
        { id: 7, symbol: 'LT', sector: 'Infrastructure', qty: 15, avgPrice: 2100.00, currentPrice: 3350.00 }
    ],
    transactions: [
        { id: 1, date: '2023-01-15', symbol: 'RELIANCE', type: 'buy', qty: 50, price: 2400.50 },
        { id: 2, date: '2023-02-10', symbol: 'TCS', type: 'buy', qty: 25, price: 3200.00 },
        { id: 3, date: '2023-03-05', symbol: 'HDFCBANK', type: 'buy', qty: 100, price: 1550.00 },
        { id: 4, date: '2023-04-12', symbol: 'INFY', type: 'buy', qty: 40, price: 1400.00 },
        { id: 5, date: '2023-05-20', symbol: 'ICICIBANK', type: 'buy', qty: 80, price: 900.25 },
        { id: 6, date: '2023-06-15', symbol: 'ITC', type: 'buy', qty: 200, price: 300.00 },
        { id: 7, date: '2023-07-22', symbol: 'LT', type: 'buy', qty: 15, price: 2100.00 }
    ],
    targetAllocations: {
        'Finance': 30,
        'IT': 25,
        'Energy': 15,
        'FMCG': 15,
        'Infrastructure': 15
    }
};

// Helper function to save to localStorage
function saveData(data) {
    try {
        localStorage.setItem(StorageKey, JSON.stringify(data));
    } catch (e) {
        console.warn('localStorage is disabled or unavailable. Data will not persist.', e);
    }
}

// Helper function to load from localStorage
function loadData() {
    try {
        const saved = localStorage.getItem(StorageKey);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.warn('localStorage is disabled or unavailable. Using initial data.', e);
    }
    saveData(initialData);
    return initialData;
}

const state = loadData();

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(amount);
}

function formatPercentage(amount) {
    return amount.toFixed(2) + '%';
}

// Get the mock current price for an asset (simple random walk for demo)
function getMockCurrentPrice(symbol) {
    const asset = state.assets.find(a => a.symbol === symbol);
    if (asset) return asset.currentPrice;
    return Math.floor(Math.random() * 5000) + 100; // Random fallback
}

// Determine Sector fallback
function guessSector(symbol) {
    const s = symbol.toUpperCase();
    if (s.includes('BANK')) return 'Finance';
    if (['TCS', 'INFY', 'WIPRO', 'HCLTECH'].includes(s)) return 'IT';
    if (['RELIANCE', 'ONGC', 'NTPC'].includes(s)) return 'Energy';
    if (['ITC', 'HUL', 'BRITANNIA'].includes(s)) return 'FMCG';
    return 'Other';
}
