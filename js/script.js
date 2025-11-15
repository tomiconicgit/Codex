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

async function init() {
    // Fetch BTC price
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        const data = await res.json();
        btcPrice = data.bitcoin.usd;
    } catch (e) {
        console.log('Using default BTC price');
    }

    // Setup CodeMirror
    const textarea = document.getElementById('myTextarea');
    editor = CodeMirror.fromTextArea(textarea, {
        mode: 'javascript',
        theme: 'monokai',
        lineNumbers: true,
        readOnly: 'nocursor'
    });

    // Update UI
    updateWallet();
    updateStocks();

    // Passive reward every second (Approx $13.75/s to reach $1M in 20h)
    setInterval(() => {
        cash += 13.75; 
        updateWallet();
    }, 1000);

    // Simulate stock prices every 30s
    setInterval(() => {
        stocks.forEach(stock => {
            stock.price *= (1 + (Math.random() - 0.5) * 0.02);
            stock.price = Math.max(1, stock.price); // Keep price as number
        });
        updateStocks();
    }, 30000);

    // Start simulation
    simulateCoding();

    // PWA service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js');
    }
}

function updateWallet() {
    const btcEquiv = (cash / btcPrice).toFixed(6);
    // Target the specific span to avoid overwriting the caret
    document.getElementById('wallet-text').innerText = `Asset Wallet: $${cash.toFixed(0)} (BTC: ${btcEquiv})`;
}

function toggleStocks() {
    const stocksList = document.getElementById('stocks-list');
    const wallet = document.getElementById('wallet');
    const caret = document.getElementById('wallet-caret');
    
    // Check display style OR empty string (for first click)
    if (stocksList.style.display === 'none' || stocksList.style.display === '') {
        stocksList.style.display = 'block';
        wallet.classList.add('active');
        caret.innerHTML = '▲';
    } else {
        stocksList.style.display = 'none';
        wallet.classList.remove('active');
        caret.innerHTML = '▼';
    }
}

function updateStocks() {
    const container = document.getElementById('stocks-list');
    container.innerHTML = '';
    stocks.forEach(stock => {
        const item = document.createElement('div');
        item.className = 'stock-item';
        
        // New HTML structure for the redesigned stock item
        item.innerHTML = `
            <div class="stock-details">
                <span class="stock-symbol">${stock.symbol}</span>
                <span class="stock-price">$${Number(stock.price).toFixed(2)}</span>
                <span class="stock-meta">Owned: ${stock.owned} | Value: $${(stock.owned * stock.price).toFixed(2)}</span>
            </div>
            <div class="stock-buttons">
                <button onclick="buyStock('${stock.symbol}')">Buy</button>
                <button class="sell" onclick="sellStock('${stock.symbol}')">Sell</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function buyStock(symbol) {
    const stock = stocks.find(s => s.symbol === symbol);
    if (cash >= stock.price) {
        cash -= stock.price;
        stock.owned++;
        updateWallet();
        updateStocks();
    }
}

function sellStock(symbol) {
    const stock = stocks.find(s => s.symbol === symbol);
    if (stock.owned > 0) {
        cash += stock.price;
        stock.owned--;
        updateWallet();
        updateStocks();
    }
}

// --- Simulation Logic (Unchanged, but modified prompt function) ---

const codeLines = [
    'const greeting = "Hello, World!";',
    'function add(a, b) {',
    '  return a + b;',
    '}',
    'let sum = add(5, 10);',
    'console.log(sum);',
    'if (sum > 10) {',
    '  console.log("Large");',
    '} else {',
    '  console.log("Small");',
    '}',
    'for (let i = 0; i < 5; i++) {',
    '  console.log(i);',
    '}',
    'class ApiClient {',
    '  constructor(baseUrl) {',
    '    this.baseUrl = baseUrl;',
    '  }',
    '  async fetch(endpoint) {',
    '    const res = await fetch(this.baseUrl + endpoint);',
    '    return res.json();',
    '  }',
    '}'
];

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function typeChar(char) {
    const pos = editor.getCursor();
    editor.replaceRange(char, pos);
    editor.setCursor({line: pos.line, ch: pos.ch + 1});
    await delay(Math.random() * 100 + 30); // 30-130ms (Slightly faster)
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
        if (Math.random() < 0.04) { // 4% chance to backspace
            await backspace(Math.floor(Math.random() * 3) + 1);
        }
    }
    await typeChar('\n');
    editor.execCommand("goDocEnd"); // Scroll to bottom
}

function getRandomLine() {
    return codeLines[Math.floor(Math.random() * codeLines.length)];
}

const choiceOptions = [
    {text: 'refactor: optimize-loop', reward: 150},
    {text: 'feat: add-caching-layer', reward: 300},
    {text: 'fix: handle-edge-case', reward: 200},
    {text: 'chore: update-dependencies', reward: 100},
    {text: 'test: implement-unit-tests', reward: 250}
];

async function promptChoice() {
    return new Promise(resolve => {
        const prompts = document.getElementById('prompts');
        prompts.classList.add('show'); // Use class to trigger animation

        const opts = [...choiceOptions].sort(() => Math.random() - 0.5); // Shuffle

        document.getElementById('option1').innerText = `${opts[0].text} (+$${opts[0].reward})`;
        document.getElementById('option1').onclick = () => choose(opts[0]);

        document.getElementById('option2').innerText = `${opts[1].text} (+$${opts[1].reward})`;
        document.getElementById('option2').onclick = () => choose(opts[1]);

        document.getElementById('option3').innerText = `${opts[2].text} (+$${opts[2].reward})`;
        document.getElementById('option3').onclick = () => choose(opts[2]);

        function choose(opt) {
            typeLine(`// User selected: ${opt.text}`);
            cash += opt.reward;
            updateWallet();
            prompts.classList.remove('show'); // Use class to hide
            resolve();
        }
    });
}

async function simulateCoding() {
    while (true) {
        const line = getRandomLine();
        await typeLine(line);
        if (Math.random() < 0.15) { // 15% chance for prompt after line
            await promptChoice();
        }
        if (editor.lineCount() > 50) { // Clear if too long
            await delay(1000);
            editor.setValue('// Clearing buffer...\n');
            await delay(1000);
            editor.setValue('');
        }
    }
}

// Start the application
init();
