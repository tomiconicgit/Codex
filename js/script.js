// --- Game State ---
let cash = 10000;
let btcPrice = 100000; // Default
let editor;
let stocks = [
    {symbol: 'NVDA', price: 120, owned: 0},
    {symbol: 'TSLA', price: 350, owned: 0},
    {symbol: 'AAPL', price: 220, owned: 0},
    {symbol: 'MSFT', price: 420, owned: 0},
    {symbol: 'GOOGL', price: 150, owned: 0},
    {symbol: 'AMZN', price: 180, owned: 0},
    {symbol: 'META', price: 500, owned: 0},
    {symbol: 'NFLX', price: 650, owned: 0}
];
let gameIntervals = []; // To store intervals for stopping/starting

// --- DOM Elements ---
const dom = {
    startButton: document.getElementById('start-button'),
    startButtonContainer: document.getElementById('start-button-container'),
    promptArea: document.getElementById('prompt-area'),
    headerTitle: document.getElementById('header-title'),
    
    // Modals
    walletModal: document.getElementById('wallet-modal'),
    
    // Dashboard Cards
    assetCard: document.getElementById('asset-card'),
    marketCardList: document.getElementById('market-card-list'),
    
    // Asset Card (Dashboard)
    netWorthTotal: document.getElementById('net-worth-total'),
    netWorthCash: document.getElementById('net-worth-cash'),
    netWorthStocks: document.getElementById('net-worth-stocks'),
    netWorthBtc: document.getElementById('net-worth-btc'),

    // Wallet Modal (Details)
    walletModalTotal: document.getElementById('wallet-modal-total'),
    walletModalCash: document.getElementById('wallet-modal-cash'),
    walletModalStocks: document.getElementById('wallet-modal-stocks'),
    walletModalBtc: document.getElementById('wallet-modal-btc'),
    
    // Nav
    navButtons: document.querySelectorAll('.nav-button'),
    
    // Settings
    resetButton: document.getElementById('reset-game-btn'),
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', init);

async function init() {
    setupEventListeners();
    initCodeMirror();
    
    if (!loadState()) {
        dom.startButtonContainer.style.display = 'block';
    } else {
        startGame();
    }
    
    await fetchBtcPrice();
    updateAllUI();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js');
    }
}

function initCodeMirror() {
    const textarea = document.getElementById('myTextarea');
    editor = CodeMirror.fromTextArea(textarea, {
        mode: 'javascript',
        theme: 'monokai',
        lineNumbers: true,
        readOnly: 'nocursor'
    });
}

function setupEventListeners() {
    dom.startButton.addEventListener('click', () => {
        dom.startButtonContainer.style.display = 'none';
        startGame();
    });

    dom.navButtons.forEach(button => {
        button.addEventListener('click', () => navigate(button.dataset.page));
    });

    // Asset card opens the detailed wallet modal
    dom.assetCard.addEventListener('click', openWalletModal);
    
    document.querySelectorAll('.modal-close').forEach(button => {
        button.addEventListener('click', () => closeModal(button.dataset.modal));
    });
    
    dom.resetButton.addEventListener('click', resetGame);
}

// --- Game Loop ---
function startGame() {
    gameIntervals.forEach(clearInterval);
    gameIntervals = [];

    // Passive reward
    gameIntervals.push(setInterval(() => {
        cash += 13.75;
        updateAllUI();
        saveState();
    }, 1000));

    // Stock price simulation
    gameIntervals.push(setInterval(() => {
        stocks.forEach(stock => {
            stock.price *= (1 + (Math.random() - 0.5) * 0.02);
            stock.price = Math.max(1, stock.price);
        });
        updateAllUI();
    }, 30000));

    simulateCoding();
}

async function fetchBtcPrice() {
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        const data = await res.json();
        btcPrice = data.bitcoin.usd;
    } catch (e) { console.log('Using default BTC price'); }
}

// --- Navigation & Modals ---
function navigate(pageName) {
    const pageTitles = { 'main': 'Dashboard', 'network': 'Network', 'mail': 'Mail', 'settings': 'Settings' };
    dom.headerTitle.innerText = pageTitles[pageName] || 'Dashboard';

    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.toggle('active', page.id === `page-${pageName}`);
    });

    dom.navButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.page === pageName);
    });
}

function openWalletModal() {
    updateWalletModal(); // Refresh modal content on open
    dom.walletModal.classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('active');
}

// --- UI Update Functions ---
function updateAllUI() {
    const stockValue = stocks.reduce((acc, s) => acc + (s.owned * s.price), 0);
    const totalValue = cash + stockValue;
    
    // Update Asset Card (Main Dashboard)
    updateAssetCard(totalValue, stockValue);
    
    // Update Market Card (Main Dashboard)
    updateMarketCard();
    
    // Update Wallet Modal (if open)
    if (dom.walletModal.classList.contains('active')) {
        updateWalletModal(totalValue, stockValue);
    }
}

function updateAssetCard(totalValue, stockValue) {
    const btcEquiv = (totalValue / btcPrice).toFixed(6);
    dom.netWorthTotal.innerText = `$${totalValue.toFixed(2)}`;
    dom.netWorthCash.innerText = `$${cash.toFixed(2)}`;
    dom.netWorthStocks.innerText = `$${stockValue.toFixed(2)}`;
    dom.netWorthBtc.innerText = `${btcEquiv} BTC`;
}

function updateMarketCard() {
    dom.marketCardList.innerHTML = '';
    stocks.forEach(stock => {
        const item = document.createElement('div');
        item.className = 'stock-item';
        item.innerHTML = `
            <div class="stock-details">
                <span class="stock-symbol">${stock.symbol}</span>
                <span class="stock-price">$${stock.price.toFixed(2)}</span>
                <span class="stock-meta">Owned: ${stock.owned} | Value: $${(stock.owned * stock.price).toFixed(2)}</span>
            </div>
            <div class="stock-buttons">
                <button onclick="buyStock('${stock.symbol}')">Buy</button>
                <button class="sell" onclick="sellStock('${stock.symbol}')">Sell</button>
            </div>
        `;
        dom.marketCardList.appendChild(item);
    });
}

function updateWalletModal(totalValue, stockValue) {
    // Re-calculate if not passed
    if (totalValue === undefined) {
        stockValue = stocks.reduce((acc, s) => acc + (s.owned * s.price), 0);
        totalValue = cash + stockValue;
    }
    const btcEquiv = (totalValue / btcPrice).toFixed(6);

    dom.walletModalTotal.innerText = `$${totalValue.toFixed(2)}`;
    dom.walletModalCash.innerText = `$${cash.toFixed(2)}`;
    dom.walletModalStocks.innerText = `$${stockValue.toFixed(2)}`;
    dom.walletModalBtc.innerText = `${btcEquiv} BTC`;
}


// --- Stock Functions ---
window.buyStock = function(symbol) {
    const stock = stocks.find(s => s.symbol === symbol);
    if (cash >= stock.price) {
        cash -= stock.price;
        stock.owned++;
        updateAllUI();
        saveState();
    }
}

window.sellStock = function(symbol) {
    const stock = stocks.find(s => s.symbol === symbol);
    if (stock.owned > 0) {
        cash += stock.price;
        stock.owned--;
        updateAllUI();
        saveState();
    }
}

// --- Coding Simulation ---
const codeLines = [
    'const greeting = "Hello, World!";', 'function add(a, b) {', '  return a + b;', '}', 'let sum = add(5, 10);', 'console.log(sum);',
    'if (sum > 10) {', '  console.log("Large");', '} else {', '  console.log("Small");', '}', 'for (let i = 0; i < 5; i++) {', '  console.log(i);', '}',
    'class ApiClient {', '  constructor(baseUrl) {', '    this.baseUrl = baseUrl;', '  }', '  async fetch(endpoint) {', '    const res = await fetch(this.baseUrl + endpoint);',
    '    return res.json();', '  }', '}'
];

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function typeChar(char) {
    const pos = editor.getCursor();
    editor.replaceRange(char, pos);
    editor.setCursor({line: pos.line, ch: pos.ch + 1});
    await delay(Math.random() * 100 + 30);
}

async function backspace(num = 1) {
    for (let i = 0; i < num; i++) {
        const pos = editor.getCursor();
        if (pos.ch > 0) {
            editor.replaceRange('', {line: pos.line, ch: pos.ch - 1}, pos);
            editor.setCursor({line: pos.line, ch: pos.ch - 1});
        }
        await delay(Math.random() * 100 + 40);
    }
}

async function typeLine(line) {
    for (let char of line) {
        await typeChar(char);
        if (Math.random() < 0.04) { await backspace(Math.floor(Math.random() * 3) + 1); }
    }
    await typeChar('\n');
    editor.execCommand("goDocEnd");
}

function getRandomLine() { return codeLines[Math.floor(Math.random() * codeLines.length)]; }

const choiceOptions = [
    {text: 'refactor: optimize-loop', reward: 150}, {text: 'feat: add-caching-layer', reward: 300}, {text: 'fix: handle-edge-case', reward: 200},
    {text: 'chore: update-dependencies', reward: 100}, {text: 'test: implement-unit-tests', reward: 250}
];

async function promptChoice() {
    return new Promise(resolve => {
        dom.promptArea.classList.add('active'); // Slide up

        const opts = [...choiceOptions].sort(() => Math.random() - 0.5);
        
        const btn1 = document.getElementById('option1');
        const btn2 = document.getElementById('option2');
        const btn3 = document.getElementById('option3');

        btn1.innerText = `${opts[0].text} (+$${opts[0].reward})`;
        btn1.onclick = () => choose(opts[0]);

        btn2.innerText = `${opts[1].text} (+$${opts[1].reward})`;
        btn2.onclick = () => choose(opts[1]);

        btn3.innerText = `${opts[2].text} (+$${opts[2].reward})`;
        btn3.onclick = () => choose(opts[2]);

        function choose(opt) {
            typeLine(`// User selected: ${opt.text}`);
            cash += opt.reward;
            updateAllUI();
            saveState();
            dom.promptArea.classList.remove('active'); // Slide down
            resolve();
        }
    });
}

async function simulateCoding() {
    while (true) {
        const line = getRandomLine();
        await typeLine(line);
        if (Math.random() < 0.15) {
            await promptChoice();
        }
        if (editor.lineCount() > 50) {
            await delay(1000);
            editor.setValue('// Clearing buffer...\n');
            await delay(1000);
            editor.setValue('');
        }
    }
}

// --- State Management ---
function saveState() {
    const state = { cash, stocks };
    localStorage.setItem('codex-save-v3', JSON.stringify(state));
}

function loadState() {
    const savedState = localStorage.getItem('codex-save-v3');
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            cash = state.cash;
            stocks = state.stocks;
            return true;
        } catch (e) {
            console.error('Failed to load state', e);
            localStorage.removeItem('codex-save-v3');
            return false;
        }
    }
    return false;
}

function resetGame() {
    if (confirm('Are you sure you want to purge all local data and reset the game?')) {
        localStorage.removeItem('codex-save-v3');
        window.location.reload();
    }
}
