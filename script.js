// ==================== CONFIGURATION ====================

let soundEnabled = true;
let darkMode = false;
let calculatorHistory = [];
let favorites = [];
let memoryValue = 0;
let programmerBase = 'decimal';
let lastCalcMode = 'simple';
let decimalPrecision = 4;
let angleUnit = 'degrees'; // affects Scientific mode + Expression Parser only; Calculus/Graphing always use radians
let customAccentColor = null;
let userVariables = {};

// Load settings from localStorage
function loadSettings() {
    const savedDarkMode = localStorage.getItem('darkMode');
    const savedSound = localStorage.getItem('soundEnabled');
    const savedHistory = localStorage.getItem('calculatorHistory');
    const savedFavorites = localStorage.getItem('calculatorFavorites');
    const savedMemory = localStorage.getItem('memoryValue');
    const savedPrecision = localStorage.getItem('decimalPrecision');
    const savedAngleUnit = localStorage.getItem('angleUnit');
    const savedAccentColor = localStorage.getItem('customAccentColor');
    const savedVariables = localStorage.getItem('userVariables');

    if (savedDarkMode === 'true') toggleTheme();
    if (savedSound === 'false') soundEnabled = false;

    if (savedHistory) {
        calculatorHistory = JSON.parse(savedHistory);
    }

    if (savedFavorites) {
        favorites = JSON.parse(savedFavorites);
    }

    if (savedMemory) memoryValue = parseFloat(savedMemory);

    if (savedPrecision !== null) {
        decimalPrecision = parseInt(savedPrecision);
        const precisionInput = document.getElementById('settings-precision');
        if (precisionInput) precisionInput.value = decimalPrecision;
    }

    if (savedAngleUnit === 'radians' || savedAngleUnit === 'degrees') {
        angleUnit = savedAngleUnit;
        const radio = document.querySelector(`input[name="angle-unit"][value="${angleUnit}"]`);
        if (radio) radio.checked = true;
    }

    if (savedAccentColor) {
        customAccentColor = savedAccentColor;
        document.body.style.setProperty('--accent-color', customAccentColor);
        const picker = document.getElementById('accent-color-picker');
        if (picker) picker.value = customAccentColor;
    }

    if (savedVariables) {
        try { userVariables = JSON.parse(savedVariables); } catch (e) { userVariables = {}; }
    }

    updateHistoryDisplay();
    renderFavorites();
    updateMemoryDisplay('simple');
    updateMemoryDisplay('scientific');
    updateMemoryDisplay('programmer');
    updateAngleUnitBadges();
    renderVariablesList();
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('darkMode', darkMode);
    localStorage.setItem('soundEnabled', soundEnabled);
    localStorage.setItem('calculatorHistory', JSON.stringify(calculatorHistory));
    localStorage.setItem('calculatorFavorites', JSON.stringify(favorites));
    localStorage.setItem('memoryValue', memoryValue);
    localStorage.setItem('decimalPrecision', decimalPrecision);
    localStorage.setItem('angleUnit', angleUnit);
    localStorage.setItem('customAccentColor', customAccentColor || '');
    localStorage.setItem('userVariables', JSON.stringify(userVariables));
}

// ==================== THEME MANAGEMENT ====================

function toggleTheme() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode');
    const themeBtn = document.getElementById('theme-toggle');
    themeBtn.textContent = darkMode ? '☀️' : '🌙';
    saveSettings();
    playSound();
}

// ==================== SOUND EFFECTS ====================

function playSound() {
    if (!soundEnabled) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundBtn = document.getElementById('sound-toggle');
    soundBtn.classList.toggle('btn-muted', !soundEnabled);
    saveSettings();
}

// ==================== MEMORY MANAGEMENT ====================

function updateMemoryDisplay(mode = 'simple') {
    const displayMap = {
        'simple': 'simple-memory-display',
        'scientific': 'sci-memory-display',
        'programmer': 'prog-memory-display'
    };
    const displayId = displayMap[mode];
    if (document.getElementById(displayId)) {
        document.getElementById(displayId).textContent = `M: ${memoryValue}`;
    }
}

// Simple Calculator Memory
function simpleMemAdd() { memoryValue += parseFloat(simpleDisplay.value) || 0; updateMemoryDisplay('simple'); playSound(); saveSettings(); }
function simpleMemSub() { memoryValue -= parseFloat(simpleDisplay.value) || 0; updateMemoryDisplay('simple'); playSound(); saveSettings(); }
function simpleMemRecall() { simpleInput = memoryValue.toString(); updateSimpleDisplay(); playSound(); }
function simpleMemClear() { memoryValue = 0; updateMemoryDisplay('simple'); playSound(); saveSettings(); }

// Scientific Calculator Memory
function sciMemAdd() { memoryValue += parseFloat(sciDisplay.value) || 0; updateMemoryDisplay('scientific'); playSound(); saveSettings(); }
function sciMemSub() { memoryValue -= parseFloat(sciDisplay.value) || 0; updateMemoryDisplay('scientific'); playSound(); saveSettings(); }
function sciMemRecall() { sciInput = memoryValue.toString(); updateSciDisplay(); playSound(); }
function sciMemClear() { memoryValue = 0; updateMemoryDisplay('scientific'); playSound(); saveSettings(); }

// Programmer Mode Memory
function progMemAdd() { memoryValue += parseFloat(progDisplay.value) || 0; updateMemoryDisplay('programmer'); playSound(); saveSettings(); }
function progMemSub() { memoryValue -= parseFloat(progDisplay.value) || 0; updateMemoryDisplay('programmer'); playSound(); saveSettings(); }
function progMemRecall() { progInput = memoryValue.toString(); updateProgrammerDisplay(); playSound(); }
function progMemClear() { memoryValue = 0; updateMemoryDisplay('programmer'); playSound(); saveSettings(); }

// ==================== HISTORY MANAGEMENT ====================

function addToHistory(expression, result) {
    calculatorHistory.unshift({
        expression: expression,
        result: result,
        timestamp: new Date().toLocaleTimeString()
    });

    if (calculatorHistory.length > 50) calculatorHistory.pop();
    updateHistoryDisplay();
    saveSettings();
}

function updateHistoryDisplay() {
    const historyList = document.getElementById('history-list');
    if (calculatorHistory.length === 0) {
        historyList.innerHTML = '<p class="no-history">No calculations yet</p>';
        return;
    }
    historyList.innerHTML = calculatorHistory.map((item, index) => `
        <div class="history-item">
            <div class="history-item-row">
                <div class="history-item-body" onclick="loadFromHistory(${index})">
                    <div class="history-item-text">${item.expression}</div>
                    <div class="history-item-result">= ${item.result}</div>
                </div>
                <div class="history-item-actions">
                    <button class="btn-star" onclick="event.stopPropagation(); addFavoriteFromHistory(${index})" title="Add to favorites">☆</button>
                </div>
            </div>
        </div>
    `).join('');
}

function getActiveModeName() {
    const active = document.querySelector('.calculator-mode.active');
    return active ? active.id.replace('-mode', '') : 'simple';
}

function loadValueIntoMode(mode, value) {
    switch (mode) {
        case 'simple':
            simpleInput = value.toString();
            updateSimpleDisplay();
            break;
        case 'scientific':
            sciInput = value.toString();
            updateSciDisplay();
            break;
        case 'programmer':
            progInput = value.toString();
            updateProgrammerDisplay();
            break;
        case 'expression':
            document.getElementById('expr-input').value = value.toString();
            document.getElementById('expr-result').value = '';
            break;
        default:
            simpleInput = value.toString();
            updateSimpleDisplay();
    }
}

function loadFromHistory(index) {
    const item = calculatorHistory[index];
    if (!item) return;
    let mode = getActiveModeName();
    if (mode === 'history' || mode === 'favorites') {
        mode = lastCalcMode;
        switchMode(mode);
    } else {
        playSound();
    }
    loadValueIntoMode(mode, item.result);
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all history?')) {
        calculatorHistory = [];
        updateHistoryDisplay();
        saveSettings();
    }
}

// ==================== EXPORT HISTORY ====================

function exportHistory(format) {
    if (calculatorHistory.length === 0) {
        alert('No history to export.');
        return;
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    let content, mimeType, filename;

    if (format === 'json') {
        content = JSON.stringify(calculatorHistory, null, 2);
        mimeType = 'application/json';
        filename = `calculator-history-${dateStr}.json`;
    } else {
        const header = 'Expression,Result,Timestamp\n';
        const rows = calculatorHistory.map(item =>
            `"${String(item.expression).replace(/"/g, '""')}","${String(item.result).replace(/"/g, '""')}","${item.timestamp}"`
        ).join('\n');
        content = header + rows;
        mimeType = 'text/csv';
        filename = `calculator-history-${dateStr}.csv`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    playSound();
}

// ==================== FAVORITES / BOOKMARKS ====================

function addFavorite(expression, result) {
    const alreadySaved = favorites.some(f => f.expression === expression && f.result === result);
    if (alreadySaved) return;

    favorites.unshift({
        expression: expression,
        result: result,
        timestamp: new Date().toLocaleTimeString()
    });

    if (favorites.length > 50) favorites.pop();
    renderFavorites();
    saveSettings();
}

function addFavoriteFromHistory(index) {
    const item = calculatorHistory[index];
    if (!item) return;
    addFavorite(item.expression, item.result);
    playSound();
}

function removeFavorite(index) {
    favorites.splice(index, 1);
    renderFavorites();
    saveSettings();
    playSound();
}

function clearFavorites() {
    if (confirm('Are you sure you want to clear all favorites?')) {
        favorites = [];
        renderFavorites();
        saveSettings();
    }
}

function renderFavorites() {
    const list = document.getElementById('favorites-list');
    if (!list) return;
    if (favorites.length === 0) {
        list.innerHTML = '<p class="no-history">No favorites yet</p>';
        return;
    }
    list.innerHTML = favorites.map((item, index) => `
        <div class="history-item">
            <div class="history-item-row">
                <div class="history-item-body" onclick="loadFavoriteItem(${index})">
                    <div class="history-item-text">${item.expression}</div>
                    <div class="history-item-result">= ${item.result}</div>
                </div>
                <div class="history-item-actions">
                    <button class="btn-remove-fav" onclick="event.stopPropagation(); removeFavorite(${index})" title="Remove from favorites">✕</button>
                </div>
            </div>
        </div>
    `).join('');
}

function loadFavoriteItem(index) {
    const item = favorites[index];
    if (!item) return;
    let mode = getActiveModeName();
    if (mode === 'history' || mode === 'favorites') {
        mode = lastCalcMode;
        switchMode(mode);
    } else {
        playSound();
    }
    loadValueIntoMode(mode, item.result);
}

// ==================== EXPRESSION PARSER ====================

function parseExpression(expr) {
    try {
        expr = expr.replace(/x/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
        const result = Function('"use strict"; return (' + expr + ')')();
        return result;
    } catch (e) {
        return 'Error';
    }
}

// ==================== SIMPLE CALCULATOR ====================

let simpleDisplay = document.getElementById('simple-result');
let simpleExpressionDisplay = document.getElementById('simple-expression-display');
let simpleInput = '';
let simplePrevious = '';
let simpleOperator = null;
let simpleShouldReset = false;
let simpleExpression = '';

function appendSimpleNum(num) {
    if (simpleShouldReset) { simpleInput = num; simpleShouldReset = false; } 
    else { if (num === '.' && simpleInput.includes('.')) return; simpleInput += num; }
    updateSimpleDisplay();
    playSound();
}

function appendSimpleOp(op) {
    if (simpleInput === '') return;
    if (simplePrevious !== '') calculateSimple();
    simpleOperator = op;
    simplePrevious = simpleInput;
    simpleExpression = `${simplePrevious} ${op}`;
    simpleInput = '';
    simpleShouldReset = true;
    updateSimpleDisplay();
    playSound();
}

function calculateSimple() {
    if (simpleOperator === null || simpleInput === '' || simplePrevious === '') return;
    
    const prev = parseFloat(simplePrevious);
    const current = parseFloat(simpleInput);
    let result;
    
    switch (simpleOperator) {
        case '+': result = prev + current; break;
        case '-': result = prev - current; break;
        case '*': result = prev * current; break;
        case '/': result = current === 0 ? 'Error' : prev / current; break;
        case '%': result = prev % current; break;
        default: return;
    }
    
    const expression = `${prev} ${simpleOperator} ${current}`;
    const resultStr = result.toString();
    
    simpleInput = resultStr;
    simpleOperator = null;
    simplePrevious = '';
    simpleExpression = '';
    simpleShouldReset = true;
    
    addToHistory(expression, resultStr);
    updateSimpleDisplay();
    playSound();
}

function clearSimple() { simpleInput = ''; simplePrevious = ''; simpleOperator = null; simpleShouldReset = false; simpleExpression = ''; updateSimpleDisplay(); playSound(); }
function backspaceSimple() { simpleInput = simpleInput.toString().slice(0, -1); updateSimpleDisplay(); playSound(); }

function updateSimpleDisplay() {
    simpleDisplay.value = simpleInput || '0';
    simpleExpressionDisplay.textContent = simpleExpression;
}

// ==================== SCIENTIFIC CALCULATOR ====================

let sciDisplay = document.getElementById('sci-result');
let sciExpressionDisplay = document.getElementById('sci-expression-display');
let sciInput = '';
let sciPrevious = '';
let sciOperator = null;
let sciShouldReset = false;
let sciExpression = '';

function appendSciNum(num) {
    if (sciShouldReset) { sciInput = num; sciShouldReset = false; } 
    else { if (num === '.' && sciInput.includes('.')) return; sciInput += num; }
    updateSciDisplay();
    playSound();
}

function appendSciOp(op) {
    if (sciInput === '') return;
    if (sciPrevious !== '') calculateScientific();
    sciOperator = op;
    sciPrevious = sciInput;
    sciExpression = `${sciPrevious} ${op}`;
    sciInput = '';
    sciShouldReset = true;
    updateSciDisplay();
    playSound();
}

function calculateScientific() {
    if (sciOperator === null || sciInput === '' || sciPrevious === '') return;
    
    const prev = parseFloat(sciPrevious);
    const current = parseFloat(sciInput);
    let result;
    
    switch (sciOperator) {
        case '+': result = prev + current; break;
        case '-': result = prev - current; break;
        case '*': result = prev * current; break;
        case '/': result = current === 0 ? 'Error' : prev / current; break;
        case '%': result = prev % current; break;
        default: return;
    }
    
    const expression = `${prev} ${sciOperator} ${current}`;
    const resultStr = result.toString();
    
    sciInput = resultStr;
    sciOperator = null;
    sciPrevious = '';
    sciExpression = '';
    sciShouldReset = true;
    
    addToHistory(expression, resultStr);
    updateSciDisplay();
    playSound();
}

function sciFunction(func) {
    let value = parseFloat(sciInput);
    let result;
    let funcName = func;
    
    switch (func) {
        case 'sin': result = Math.sin(angleUnit === 'degrees' ? value * Math.PI / 180 : value); break;
        case 'cos': result = Math.cos(angleUnit === 'degrees' ? value * Math.PI / 180 : value); break;
        case 'tan': result = Math.tan(angleUnit === 'degrees' ? value * Math.PI / 180 : value); break;
        case 'sqrt': result = Math.sqrt(value); funcName = '√'; break;
        case 'cbrt': result = Math.cbrt(value); funcName = '∛'; break;
        case 'pow': result = value * value; funcName = 'x²'; break;
        case 'log': result = Math.log10(value); break;
        case 'ln': result = Math.log(value); break;
        case 'pi': sciInput = Math.PI.toString(); updateSciDisplay(); playSound(); return;
        case 'e': sciInput = Math.E.toString(); updateSciDisplay(); playSound(); return;
        case 'fact': result = factorial(Math.floor(value)); funcName = 'n!'; break;
        default: return;
    }
    
    const expression = `${funcName}(${value})`;
    const resultStr = result.toString();
    
    sciInput = resultStr;
    sciShouldReset = true;
    sciExpression = '';
    
    addToHistory(expression, resultStr);
    updateSciDisplay();
    playSound();
}

function factorial(n) {
    if (n < 0) return 'Error';
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}

function clearScientific() { sciInput = ''; sciPrevious = ''; sciOperator = null; sciShouldReset = false; sciExpression = ''; updateSciDisplay(); playSound(); }
function backspaceScientific() { sciInput = sciInput.toString().slice(0, -1); updateSciDisplay(); playSound(); }

function updateSciDisplay() {
    sciDisplay.value = sciInput || '0';
    sciExpressionDisplay.textContent = sciExpression;
}

// ==================== PROGRAMMER MODE ====================

let progDisplay = document.getElementById('prog-result');
let progInput = '';
let progPrevious = '';
let progOperator = null;
let progShouldReset = false;

function appendProgNum(num) {
    if (progShouldReset) { progInput = num; progShouldReset = false; }
    else { progInput += num; }
    updateProgrammerDisplay();
    playSound();
}

function appendProgOp(op) {
    if (progInput === '') return;
    if (progPrevious !== '') calculateProgrammer();
    progOperator = op;
    progPrevious = progInput;
    progInput = '';
    progShouldReset = true;
    playSound();
}

function calculateProgrammer() {
    if (progOperator === null || progInput === '' || progPrevious === '') return;
    
    const prev = parseInt(progPrevious);
    const current = parseInt(progInput);
    let result;
    
    switch (progOperator) {
        case '+': result = prev + current; break;
        case '-': result = prev - current; break;
        case '*': result = prev * current; break;
        case '/': result = current === 0 ? 'Error' : Math.floor(prev / current); break;
        case '%': result = prev % current; break;
        default: return;
    }
    
    const expression = `${prev} ${progOperator} ${current}`;
    const resultStr = result.toString();
    
    progInput = resultStr;
    progOperator = null;
    progPrevious = '';
    progShouldReset = true;
    
    addToHistory(expression, resultStr);
    updateProgrammerDisplay();
    playSound();
}

function progFunction(func) {
    let value = parseInt(progInput);
    let result;
    
    switch (func) {
        case 'and': 
            let andVal = parseInt(progPrevious) || 0;
            result = value & andVal;
            progInput = result.toString();
            progPrevious = '';
            break;
        case 'or': 
            let orVal = parseInt(progPrevious) || 0;
            result = value | orVal;
            progInput = result.toString();
            progPrevious = '';
            break;
        case 'xor': 
            let xorVal = parseInt(progPrevious) || 0;
            result = value ^ xorVal;
            progInput = result.toString();
            progPrevious = '';
            break;
        case 'not': 
            result = ~value;
            progInput = result.toString();
            break;
        case 'lshift': 
            result = value << 1;
            progInput = result.toString();
            break;
        case 'rshift': 
            result = value >> 1;
            progInput = result.toString();
            break;
        case 'mod': 
            let modVal = parseInt(progPrevious) || 0;
            result = value % modVal;
            progInput = result.toString();
            progPrevious = '';
            break;
        default: return;
    }
    
    progShouldReset = true;
    updateProgrammerDisplay();
    playSound();
}

function clearProgrammer() { progInput = ''; progPrevious = ''; progOperator = null; progShouldReset = false; updateProgrammerDisplay(); playSound(); }
function backspaceProgrammer() { progInput = progInput.toString().slice(0, -1); updateProgrammerDisplay(); playSound(); }

function updateProgrammerDisplay() {
    const value = parseInt(progInput) || 0;
    progDisplay.value = value;
    document.getElementById('prog-hex').value = '0x' + value.toString(16).toUpperCase();
    document.getElementById('prog-oct').value = '0o' + value.toString(8);
    document.getElementById('prog-bin').value = '0b' + value.toString(2);
}

function toggleBitDisplay() { playSound(); alert('Bit display: ' + (parseInt(progInput) || 0).toString(2)); }
function toggleProgBase() { playSound(); }

// ==================== BASE CONVERTER ====================

function convertFromDecimal() {
    const dec = document.getElementById('conv-decimal').value;
    if (dec === '') return;
    const value = parseInt(dec);
    if (isNaN(value)) return;
    
    document.getElementById('conv-binary').value = value.toString(2);
    document.getElementById('conv-octal').value = value.toString(8);
    document.getElementById('conv-hex').value = value.toString(16).toUpperCase();
}

function convertFromBinary() {
    const bin = document.getElementById('conv-binary').value;
    if (bin === '') return;
    const value = parseInt(bin, 2);
    if (isNaN(value)) return;
    
    document.getElementById('conv-decimal').value = value;
    document.getElementById('conv-octal').value = value.toString(8);
    document.getElementById('conv-hex').value = value.toString(16).toUpperCase();
}

function convertFromOctal() {
    const oct = document.getElementById('conv-octal').value;
    if (oct === '') return;
    const value = parseInt(oct, 8);
    if (isNaN(value)) return;
    
    document.getElementById('conv-decimal').value = value;
    document.getElementById('conv-binary').value = value.toString(2);
    document.getElementById('conv-hex').value = value.toString(16).toUpperCase();
}

function convertFromHex() {
    const hex = document.getElementById('conv-hex').value;
    if (hex === '') return;
    const value = parseInt(hex, 16);
    if (isNaN(value)) return;
    
    document.getElementById('conv-decimal').value = value;
    document.getElementById('conv-binary').value = value.toString(2);
    document.getElementById('conv-octal').value = value.toString(8);
}

function clearConverter() {
    document.getElementById('conv-decimal').value = '';
    document.getElementById('conv-binary').value = '';
    document.getElementById('conv-octal').value = '';
    document.getElementById('conv-hex').value = '';
    playSound();
}

// ==================== EXPRESSION PARSER MODE ====================

function evaluateMathExpression(exprRaw) {
    try {
        let expr = exprRaw.trim();
        if (expr === '') return null;

        // Normalize alternate operator symbols and power operator
        expr = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\^/g, '**');

        // Only allow safe characters: digits, operators, parens, dots, commas, letters (for function/const names), spaces
        if (!/^[0-9a-zA-Z+\-*/%.,()\s]*$/.test(expr)) return 'Error';

        const { names: varNames, values: varValues } = getUserVariableBindings(['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'cbrt', 'abs', 'pi', 'e']);

        const fn = new Function(
            'sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'cbrt', 'abs', 'pi', 'e', ...varNames,
            '"use strict"; return (' + expr + ');'
        );

        const toRad = (d) => angleUnit === 'degrees' ? d * Math.PI / 180 : d;
        const result = fn(
            (d) => Math.sin(toRad(d)),
            (d) => Math.cos(toRad(d)),
            (d) => Math.tan(toRad(d)),
            Math.log10,
            Math.log,
            Math.sqrt,
            Math.cbrt,
            Math.abs,
            Math.PI,
            Math.E,
            ...varValues
        );

        if (typeof result !== 'number' || !isFinite(result)) return 'Error';
        return result;
    } catch (err) {
        return 'Error';
    }
}

function evaluateExpressionInput() {
    const inputEl = document.getElementById('expr-input');
    const resultEl = document.getElementById('expr-result');
    const input = inputEl.value;
    if (!input.trim()) return;

    const result = evaluateMathExpression(input);
    resultEl.value = result === null ? '' : result;

    if (result !== 'Error' && result !== null) {
        addToHistory(input.trim(), result.toString());
    }
    playSound();
}

function clearExpression() {
    document.getElementById('expr-input').value = '';
    document.getElementById('expr-result').value = '';
    playSound();
}

function favoriteExpression() {
    const expr = document.getElementById('expr-input').value.trim();
    const result = document.getElementById('expr-result').value.trim();
    if (!expr || !result || result === 'Error') return;
    addFavorite(expr, result);
    playSound();
}

// ==================== UNIT CONVERTER ====================

const unitDefinitions = {
    length: {
        label: 'Length',
        base: 'm',
        units: {
            mm: { label: 'Millimeter (mm)', factor: 0.001 },
            cm: { label: 'Centimeter (cm)', factor: 0.01 },
            m: { label: 'Meter (m)', factor: 1 },
            km: { label: 'Kilometer (km)', factor: 1000 },
            in: { label: 'Inch (in)', factor: 0.0254 },
            ft: { label: 'Foot (ft)', factor: 0.3048 },
            yd: { label: 'Yard (yd)', factor: 0.9144 },
            mi: { label: 'Mile (mi)', factor: 1609.344 }
        }
    },
    weight: {
        label: 'Weight / Mass',
        units: {
            mg: { label: 'Milligram (mg)', factor: 0.000001 },
            g: { label: 'Gram (g)', factor: 0.001 },
            kg: { label: 'Kilogram (kg)', factor: 1 },
            oz: { label: 'Ounce (oz)', factor: 0.0283495 },
            lb: { label: 'Pound (lb)', factor: 0.453592 },
            t: { label: 'Metric Ton (t)', factor: 1000 }
        }
    },
    volume: {
        label: 'Volume',
        units: {
            ml: { label: 'Milliliter (mL)', factor: 0.001 },
            l: { label: 'Liter (L)', factor: 1 },
            gal: { label: 'Gallon (US gal)', factor: 3.78541 },
            qt: { label: 'Quart (US qt)', factor: 0.946353 },
            cup: { label: 'Cup (US cup)', factor: 0.24 },
            floz: { label: 'Fluid Ounce (US fl oz)', factor: 0.0295735 }
        }
    },
    area: {
        label: 'Area',
        units: {
            sqm: { label: 'Square Meter (m²)', factor: 1 },
            sqkm: { label: 'Square Kilometer (km²)', factor: 1000000 },
            sqft: { label: 'Square Foot (ft²)', factor: 0.092903 },
            sqmi: { label: 'Square Mile (mi²)', factor: 2589988.11 },
            acre: { label: 'Acre', factor: 4046.8564 },
            hectare: { label: 'Hectare', factor: 10000 }
        }
    },
    speed: {
        label: 'Speed',
        units: {
            mps: { label: 'Meters/second (m/s)', factor: 1 },
            kph: { label: 'Kilometers/hour (km/h)', factor: 0.277778 },
            mph: { label: 'Miles/hour (mph)', factor: 0.44704 },
            knot: { label: 'Knot (kn)', factor: 0.514444 }
        }
    },
    temperature: {
        label: 'Temperature',
        units: {
            c: { label: 'Celsius (°C)' },
            f: { label: 'Fahrenheit (°F)' },
            k: { label: 'Kelvin (K)' }
        }
    }
};

function populateUnitSelects() {
    const category = document.getElementById('unit-category').value;
    const fromSelect = document.getElementById('unit-from-select');
    const toSelect = document.getElementById('unit-to-select');
    const units = unitDefinitions[category].units;
    const optionsHtml = Object.keys(units).map(key => `<option value="${key}">${units[key].label}</option>`).join('');

    fromSelect.innerHTML = optionsHtml;
    toSelect.innerHTML = optionsHtml;

    const keys = Object.keys(units);
    fromSelect.value = keys[0];
    toSelect.value = keys.length > 1 ? keys[1] : keys[0];
}

function onUnitCategoryChange() {
    populateUnitSelects();
    document.getElementById('unit-from-value').value = '';
    document.getElementById('unit-to-value').value = '';
    playSound();
}

function celsiusToUnit(celsius, unit) {
    if (unit === 'c') return celsius;
    if (unit === 'f') return celsius * 9 / 5 + 32;
    if (unit === 'k') return celsius + 273.15;
}

function toCelsius(value, unit) {
    if (unit === 'c') return value;
    if (unit === 'f') return (value - 32) * 5 / 9;
    if (unit === 'k') return value - 273.15;
}

function convertUnit(changedSide) {
    const category = document.getElementById('unit-category').value;
    const fromUnit = document.getElementById('unit-from-select').value;
    const toUnit = document.getElementById('unit-to-select').value;
    const fromInput = document.getElementById('unit-from-value');
    const toInput = document.getElementById('unit-to-value');

    // Determine which side changed to know which one drives the calculation
    const source = changedSide === 'to' ? toInput : fromInput;
    const target = changedSide === 'to' ? fromInput : toInput;
    const sourceUnit = changedSide === 'to' ? toUnit : fromUnit;
    const targetUnit = changedSide === 'to' ? fromUnit : toUnit;

    const rawValue = source.value;
    if (rawValue === '') { target.value = ''; return; }
    const value = parseFloat(rawValue);
    if (isNaN(value)) { target.value = ''; return; }

    let result;
    if (category === 'temperature') {
        result = celsiusToUnit(toCelsius(value, sourceUnit), targetUnit);
    } else {
        const factors = unitDefinitions[category].units;
        const valueInBase = value * factors[sourceUnit].factor;
        result = valueInBase / factors[targetUnit].factor;
    }

    target.value = Number.isFinite(result) ? parseFloat(result.toFixed(6)).toString() : '';
}

function swapUnits() {
    const fromSelect = document.getElementById('unit-from-select');
    const toSelect = document.getElementById('unit-to-select');
    const fromInput = document.getElementById('unit-from-value');
    const toInput = document.getElementById('unit-to-value');

    const tmpUnit = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = tmpUnit;

    const tmpVal = fromInput.value;
    fromInput.value = toInput.value;
    toInput.value = tmpVal;

    convertUnit('from');
    playSound();
}

function clearUnitConverter() {
    document.getElementById('unit-from-value').value = '';
    document.getElementById('unit-to-value').value = '';
    playSound();
}

// ==================== CURRENCY CONVERTER ====================

const supportedCurrencies = {
    USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', JPY: 'Japanese Yen',
    AUD: 'Australian Dollar', CAD: 'Canadian Dollar', CHF: 'Swiss Franc',
    CNY: 'Chinese Yuan', SEK: 'Swedish Krona', NZD: 'New Zealand Dollar',
    MXN: 'Mexican Peso', SGD: 'Singapore Dollar', HKD: 'Hong Kong Dollar',
    NOK: 'Norwegian Krone', KRW: 'South Korean Won', INR: 'Indian Rupee',
    BRL: 'Brazilian Real', ZAR: 'South African Rand', DKK: 'Danish Krone',
    PLN: 'Polish Zloty', TRY: 'Turkish Lira', CZK: 'Czech Koruna',
    ILS: 'Israeli Shekel', HUF: 'Hungarian Forint', RON: 'Romanian Leu',
    MYR: 'Malaysian Ringgit', THB: 'Thai Baht', IDR: 'Indonesian Rupiah',
    PHP: 'Philippine Peso', BGN: 'Bulgarian Lev', ISK: 'Icelandic Krona'
};

let currencyRatesCache = {};

function populateCurrencySelects() {
    const fromSelect = document.getElementById('curr-from');
    const toSelect = document.getElementById('curr-to');
    const optionsHtml = Object.keys(supportedCurrencies).map(code =>
        `<option value="${code}">${code} — ${supportedCurrencies[code]}</option>`
    ).join('');

    fromSelect.innerHTML = optionsHtml;
    toSelect.innerHTML = optionsHtml;
    fromSelect.value = 'USD';
    toSelect.value = 'EUR';
}

async function fetchRatesFromApi(base) {
    const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(base)}`);
    if (!response.ok) throw new Error('Network error: ' + response.status);
    const json = await response.json();
    return { rates: json.rates, date: json.date, fetchedAt: Date.now() };
}

async function ensureRates(base) {
    const cached = currencyRatesCache[base];
    const oneHour = 60 * 60 * 1000;
    if (cached && (Date.now() - cached.fetchedAt) < oneHour) return cached;
    const data = await fetchRatesFromApi(base);
    currencyRatesCache[base] = data;
    return data;
}

async function convertCurrency() {
    const amountRaw = document.getElementById('curr-amount').value;
    const from = document.getElementById('curr-from').value;
    const to = document.getElementById('curr-to').value;
    const resultEl = document.getElementById('curr-result');
    const statusEl = document.getElementById('curr-status');

    if (amountRaw === '') { resultEl.value = ''; return; }
    const amount = parseFloat(amountRaw);
    if (isNaN(amount)) { resultEl.value = ''; return; }

    if (from === to) {
        resultEl.value = amount.toString();
        statusEl.textContent = 'Same currency';
        return;
    }

    statusEl.textContent = 'Fetching latest rates…';
    try {
        const data = await ensureRates(from);
        const rate = data.rates[to];
        if (rate === undefined) {
            resultEl.value = '';
            statusEl.textContent = `No rate available for ${to}`;
            return;
        }
        const result = amount * rate;
        resultEl.value = parseFloat(result.toFixed(4)).toString();
        statusEl.textContent = `1 ${from} = ${rate.toFixed(6)} ${to} · ECB rates as of ${data.date}`;
    } catch (err) {
        resultEl.value = '';
        statusEl.textContent = 'Could not fetch live rates. Check your connection and try again.';
    }
}

function swapCurrency() {
    const fromSel = document.getElementById('curr-from');
    const toSel = document.getElementById('curr-to');
    const tmp = fromSel.value;
    fromSel.value = toSel.value;
    toSel.value = tmp;
    convertCurrency();
    playSound();
}

function refreshCurrencyRates() {
    const from = document.getElementById('curr-from').value;
    delete currencyRatesCache[from];
    convertCurrency();
    playSound();
}

// ==================== STATISTICS MODE ====================

function parseStatsInput(str) {
    return str
        .split(/[\s,]+/)
        .map(s => s.trim())
        .filter(s => s !== '')
        .map(Number)
        .filter(n => !isNaN(n));
}

function formatStatNum(n) {
    if (!isFinite(n)) return 'N/A';
    return parseFloat(n.toFixed(decimalPrecision)).toString();
}

let lastStatsResult = null;

function calculateStatistics() {
    const raw = document.getElementById('stats-input').value;
    const resultsEl = document.getElementById('stats-results');
    const nums = parseStatsInput(raw);

    if (nums.length === 0) {
        resultsEl.innerHTML = '<p class="no-history">Enter numbers to see statistics</p>';
        lastStatsResult = null;
        return;
    }

    const count = nums.length;
    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = sum / count;
    const sorted = [...nums].sort((a, b) => a - b);
    const median = count % 2 === 0
        ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
        : sorted[(count - 1) / 2];

    const freq = {};
    nums.forEach(n => { freq[n] = (freq[n] || 0) + 1; });
    let maxFreq = 0;
    Object.values(freq).forEach(f => { if (f > maxFreq) maxFreq = f; });
    const modeStr = maxFreq <= 1 ? 'None' : Object.keys(freq).filter(k => freq[k] === maxFreq).join(', ');

    const min = sorted[0];
    const max = sorted[count - 1];
    const range = max - min;
    const variance = nums.reduce((acc, n) => acc + Math.pow(n - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);
    const sampleVariance = count > 1
        ? nums.reduce((acc, n) => acc + Math.pow(n - mean, 2), 0) / (count - 1)
        : 0;
    const sampleStdDev = Math.sqrt(sampleVariance);

    lastStatsResult = { count, sum, mean, median, modeStr, min, max, range, stdDev, sampleStdDev, variance, sampleVariance };

    resultsEl.innerHTML = `
        <div class="stats-item"><span>Count</span><strong>${count}</strong></div>
        <div class="stats-item"><span>Sum</span><strong>${formatStatNum(sum)}</strong></div>
        <div class="stats-item"><span>Mean</span><strong>${formatStatNum(mean)}</strong></div>
        <div class="stats-item"><span>Median</span><strong>${formatStatNum(median)}</strong></div>
        <div class="stats-item"><span>Mode</span><strong>${modeStr}</strong></div>
        <div class="stats-item"><span>Min</span><strong>${formatStatNum(min)}</strong></div>
        <div class="stats-item"><span>Max</span><strong>${formatStatNum(max)}</strong></div>
        <div class="stats-item"><span>Range</span><strong>${formatStatNum(range)}</strong></div>
        <div class="stats-item"><span>Std Dev (pop)</span><strong>${formatStatNum(stdDev)}</strong></div>
        <div class="stats-item"><span>Std Dev (sample)</span><strong>${formatStatNum(sampleStdDev)}</strong></div>
        <div class="stats-item"><span>Variance (pop)</span><strong>${formatStatNum(variance)}</strong></div>
        <div class="stats-item"><span>Variance (sample)</span><strong>${formatStatNum(sampleVariance)}</strong></div>
    `;
}

function addStatsToHistory() {
    if (!lastStatsResult) return;
    const r = lastStatsResult;
    addToHistory(
        `Stats(n=${r.count})`,
        `mean=${formatStatNum(r.mean)}, median=${formatStatNum(r.median)}, sd=${formatStatNum(r.stdDev)}`
    );
    playSound();
}

function clearStatistics() {
    document.getElementById('stats-input').value = '';
    document.getElementById('stats-results').innerHTML = '<p class="no-history">Enter numbers to see statistics</p>';
    lastStatsResult = null;
    playSound();
}

// ==================== PERMUTATIONS & COMBINATIONS ====================

function factorialBig(n) {
    let result = 1n;
    for (let i = 2n; i <= BigInt(n); i++) result *= i;
    return result;
}

function nPrBig(n, r) {
    let result = 1n;
    for (let i = 0; i < r; i++) result *= BigInt(n - i);
    return result;
}

function nCrBig(n, r) {
    const rMin = Math.min(r, n - r);
    let numerator = 1n;
    let denominator = 1n;
    for (let i = 0; i < rMin; i++) {
        numerator *= BigInt(n - i);
        denominator *= BigInt(i + 1);
    }
    return numerator / denominator;
}

let lastCombinatoricsResult = null;

function calculateCombinatorics() {
    const resultsEl = document.getElementById('combo-results');
    const nRaw = document.getElementById('combo-n').value;
    const rRaw = document.getElementById('combo-r').value;

    if (nRaw === '' || rRaw === '') {
        resultsEl.innerHTML = '<p class="no-history">Enter n and r to see results</p>';
        lastCombinatoricsResult = null;
        return;
    }

    const n = parseInt(nRaw);
    const r = parseInt(rRaw);

    if (isNaN(n) || isNaN(r) || n < 0 || r < 0 || !Number.isInteger(n) || !Number.isInteger(r)) {
        resultsEl.innerHTML = '<p class="no-history">n and r must be non-negative integers</p>';
        lastCombinatoricsResult = null;
        return;
    }
    if (r > n) {
        resultsEl.innerHTML = '<p class="no-history">r cannot be greater than n</p>';
        lastCombinatoricsResult = null;
        return;
    }
    if (n > 1000) {
        resultsEl.innerHTML = '<p class="no-history">n is too large to compute exactly (max 1000)</p>';
        lastCombinatoricsResult = null;
        return;
    }

    const factN = factorialBig(n);
    const perm = nPrBig(n, r);
    const comb = nCrBig(n, r);

    lastCombinatoricsResult = { n, r, factN, perm, comb };

    resultsEl.innerHTML = `
        <div class="stats-item"><span>n!</span><strong>${factN.toString()}</strong></div>
        <div class="stats-item"><span>P(n, r)</span><strong>${perm.toString()}</strong></div>
        <div class="stats-item"><span>C(n, r)</span><strong>${comb.toString()}</strong></div>
    `;
}

function addCombinatoricsToHistory() {
    if (!lastCombinatoricsResult) return;
    const { n, r, perm, comb } = lastCombinatoricsResult;
    addToHistory(`P/C(n=${n}, r=${r})`, `P=${perm}, C=${comb}`);
    playSound();
}

function clearCombinatorics() {
    document.getElementById('combo-n').value = '';
    document.getElementById('combo-r').value = '';
    document.getElementById('combo-results').innerHTML = '<p class="no-history">Enter n and r to see results</p>';
    lastCombinatoricsResult = null;
    playSound();
}

// ==================== RANDOM NUMBER GENERATOR ====================

let lastRngResults = [];

function generateRandomNumbers() {
    const resultsEl = document.getElementById('rng-results');
    const min = parseFloat(document.getElementById('rng-min').value);
    const max = parseFloat(document.getElementById('rng-max').value);
    const count = parseInt(document.getElementById('rng-count').value) || 1;
    const isInteger = document.getElementById('rng-integer').checked;
    const noDuplicates = document.getElementById('rng-no-duplicates').checked;

    if (isNaN(min) || isNaN(max) || min > max) {
        resultsEl.innerHTML = '<p class="no-history">Enter a valid range (min ≤ max)</p>';
        lastRngResults = [];
        return;
    }
    if (count < 1 || count > 100) {
        resultsEl.innerHTML = '<p class="no-history">Count must be between 1 and 100</p>';
        lastRngResults = [];
        return;
    }

    let values = [];

    if (isInteger) {
        const lo = Math.ceil(min);
        const hi = Math.floor(max);
        if (noDuplicates) {
            const rangeSize = hi - lo + 1;
            if (count > rangeSize) {
                resultsEl.innerHTML = `<p class="no-history">Range only has ${rangeSize} whole numbers — can't generate ${count} without duplicates</p>`;
                lastRngResults = [];
                return;
            }
            const pool = [];
            for (let i = lo; i <= hi; i++) pool.push(i);
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }
            values = pool.slice(0, count);
        } else {
            for (let i = 0; i < count; i++) {
                values.push(Math.floor(Math.random() * (hi - lo + 1)) + lo);
            }
        }
    } else {
        for (let i = 0; i < count; i++) {
            values.push(Math.random() * (max - min) + min);
        }
    }

    const displayValues = values.map(v => isInteger ? v.toString() : v.toFixed(4));
    lastRngResults = displayValues;

    resultsEl.innerHTML = displayValues.map(v => `<span class="rng-number">${v}</span>`).join('');
    playSound();
}

function saveRngToHistory() {
    if (!lastRngResults || lastRngResults.length === 0) return;
    const min = document.getElementById('rng-min').value;
    const max = document.getElementById('rng-max').value;
    addToHistory(`Random(${min}–${max}, n=${lastRngResults.length})`, lastRngResults.join(', '));
    playSound();
}

function clearRng() {
    document.getElementById('rng-results').innerHTML = '<p class="no-history">Click Generate to create random numbers</p>';
    lastRngResults = [];
    playSound();
}

// ==================== MATRIX CALCULATOR ====================

function renderMatrixGrid(which) {
    const rows = parseInt(document.getElementById(`matrix-${which}-rows`).value);
    const cols = parseInt(document.getElementById(`matrix-${which}-cols`).value);
    const grid = document.getElementById(`matrix-${which}-grid`);
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    let html = '';
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            html += `<input type="number" class="matrix-cell" id="matrix-${which}-${r}-${c}" value="0">`;
        }
    }
    grid.innerHTML = html;
}

function readMatrix(which) {
    const rows = parseInt(document.getElementById(`matrix-${which}-rows`).value);
    const cols = parseInt(document.getElementById(`matrix-${which}-cols`).value);
    const m = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            const val = parseFloat(document.getElementById(`matrix-${which}-${r}-${c}`).value);
            row.push(isNaN(val) ? 0 : val);
        }
        m.push(row);
    }
    return m;
}

function matAdd(a, b) { return a.map((row, i) => row.map((v, j) => v + b[i][j])); }
function matSub(a, b) { return a.map((row, i) => row.map((v, j) => v - b[i][j])); }

function matMul(a, b) {
    const result = [];
    for (let i = 0; i < a.length; i++) {
        const row = [];
        for (let j = 0; j < b[0].length; j++) {
            let sum = 0;
            for (let k = 0; k < b.length; k++) sum += a[i][k] * b[k][j];
            row.push(sum);
        }
        result.push(row);
    }
    return result;
}

function matScalar(a, k) { return a.map(row => row.map(v => v * k)); }
function matTranspose(a) { return a[0].map((_, c) => a.map(row => row[c])); }

function matDeterminant(m) {
    const n = m.length;
    if (n === 1) return m[0][0];
    if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
    let det = 0;
    for (let col = 0; col < n; col++) {
        const minor = m.slice(1).map(row => row.filter((_, c) => c !== col));
        det += ((col % 2 === 0) ? 1 : -1) * m[0][col] * matDeterminant(minor);
    }
    return det;
}

function matInverse(m) {
    const n = m.length;
    const det = matDeterminant(m);
    if (Math.abs(det) < 1e-10) return null;
    if (n === 1) return [[1 / m[0][0]]];
    const cof = [];
    for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j < n; j++) {
            const minor = m.filter((_, r) => r !== i).map(r => r.filter((_, c) => c !== j));
            row.push(((i + j) % 2 === 0 ? 1 : -1) * matDeterminant(minor));
        }
        cof.push(row);
    }
    const adj = matTranspose(cof);
    return adj.map(row => row.map(v => v / det));
}

function renderMatrixResultHtml(matrix) {
    const cols = matrix[0].length;
    let html = `<div class="matrix-result-grid" style="grid-template-columns: repeat(${cols}, 1fr);">`;
    matrix.forEach(row => {
        row.forEach(v => {
            html += `<div class="matrix-result-cell">${formatStatNum(v)}</div>`;
        });
    });
    html += '</div>';
    return html;
}

function onMatrixOperationChange() {
    const op = document.getElementById('matrix-operation').value;
    document.getElementById('matrix-scalar-row').style.display = op === 'scalar' ? 'flex' : 'none';
}

let lastMatrixResult = null;

function calculateMatrixOperation() {
    const op = document.getElementById('matrix-operation').value;
    const resultEl = document.getElementById('matrix-result');
    const A = readMatrix('a');
    const B = readMatrix('b');
    let resultMatrix = null;
    let scalarResult = null;
    let errorMsg = null;

    try {
        switch (op) {
            case 'add':
                if (A.length !== B.length || A[0].length !== B[0].length) { errorMsg = 'Matrices must be the same size to add.'; break; }
                resultMatrix = matAdd(A, B);
                break;
            case 'sub':
                if (A.length !== B.length || A[0].length !== B[0].length) { errorMsg = 'Matrices must be the same size to subtract.'; break; }
                resultMatrix = matSub(A, B);
                break;
            case 'mul':
                if (A[0].length !== B.length) { errorMsg = `Can't multiply: A's columns (${A[0].length}) must match B's rows (${B.length}).`; break; }
                resultMatrix = matMul(A, B);
                break;
            case 'scalar': {
                const k = parseFloat(document.getElementById('matrix-scalar').value);
                if (isNaN(k)) { errorMsg = 'Enter a valid scalar.'; break; }
                resultMatrix = matScalar(A, k);
                break;
            }
            case 'transposeA':
                resultMatrix = matTranspose(A);
                break;
            case 'transposeB':
                resultMatrix = matTranspose(B);
                break;
            case 'detA':
                if (A.length !== A[0].length) { errorMsg = 'Matrix A must be square to compute a determinant.'; break; }
                scalarResult = matDeterminant(A);
                break;
            case 'detB':
                if (B.length !== B[0].length) { errorMsg = 'Matrix B must be square to compute a determinant.'; break; }
                scalarResult = matDeterminant(B);
                break;
            case 'invA':
                if (A.length !== A[0].length) { errorMsg = 'Matrix A must be square to invert.'; break; }
                resultMatrix = matInverse(A);
                if (!resultMatrix) errorMsg = 'Matrix A is singular (determinant = 0) — no inverse exists.';
                break;
            case 'invB':
                if (B.length !== B[0].length) { errorMsg = 'Matrix B must be square to invert.'; break; }
                resultMatrix = matInverse(B);
                if (!resultMatrix) errorMsg = 'Matrix B is singular (determinant = 0) — no inverse exists.';
                break;
        }
    } catch (err) {
        errorMsg = 'Error computing result.';
    }

    if (errorMsg) {
        resultEl.innerHTML = `<p class="no-history">${errorMsg}</p>`;
        lastMatrixResult = null;
        return;
    }

    if (scalarResult !== null) {
        resultEl.innerHTML = `<div class="stats-item"><span>Result</span><strong>${formatStatNum(scalarResult)}</strong></div>`;
        lastMatrixResult = { type: 'scalar', value: scalarResult, op };
    } else if (resultMatrix) {
        resultEl.innerHTML = renderMatrixResultHtml(resultMatrix);
        lastMatrixResult = { type: 'matrix', value: resultMatrix, op };
    }
}

function addMatrixResultToHistory() {
    if (!lastMatrixResult) return;
    const opLabels = {
        add: 'A+B', sub: 'A-B', mul: 'A×B', scalar: 'A×k',
        transposeA: 'Aᵀ', transposeB: 'Bᵀ', detA: 'det(A)', detB: 'det(B)', invA: 'A⁻¹', invB: 'B⁻¹'
    };
    const label = opLabels[lastMatrixResult.op] || lastMatrixResult.op;
    let resultStr;
    if (lastMatrixResult.type === 'scalar') {
        resultStr = formatStatNum(lastMatrixResult.value);
    } else {
        resultStr = lastMatrixResult.value.map(row => '[' + row.map(formatStatNum).join(', ') + ']').join(' ');
    }
    addToHistory(label, resultStr);
    playSound();
}

function clearMatrices() {
    ['a', 'b'].forEach(which => {
        document.getElementById(`matrix-${which}-rows`).value = '2';
        document.getElementById(`matrix-${which}-cols`).value = '2';
        renderMatrixGrid(which);
    });
    document.getElementById('matrix-result').innerHTML = '<p class="no-history">Choose matrices and an operation, then Calculate</p>';
    lastMatrixResult = null;
    playSound();
}

// ==================== EQUATION SOLVER ====================

function onEquationTypeChange() {
    const type = document.getElementById('eq-type').value;
    ['linear', 'quadratic', 'system2', 'system3'].forEach(t => {
        document.getElementById(`eq-${t}-inputs`).style.display = (t === type) ? 'block' : 'none';
    });
    document.getElementById('eq-result').innerHTML = '<p class="no-history">Enter coefficients, then Solve</p>';
    lastEquationResult = null;
}

let lastEquationResult = null;

function solveEquation() {
    const type = document.getElementById('eq-type').value;
    const resultEl = document.getElementById('eq-result');

    if (type === 'linear') {
        const a = parseFloat(document.getElementById('eq-lin-a').value);
        const b = parseFloat(document.getElementById('eq-lin-b').value);
        if (isNaN(a) || isNaN(b)) { resultEl.innerHTML = '<p class="no-history">Enter valid coefficients.</p>'; lastEquationResult = null; return; }
        if (a === 0) {
            const msg = b === 0 ? 'Infinitely many solutions (0 = 0)' : 'No solution (contradiction)';
            resultEl.innerHTML = `<p class="no-history">${msg}</p>`;
            lastEquationResult = { type, summary: msg };
            return;
        }
        const x = -b / a;
        resultEl.innerHTML = `<div class="stats-item"><span>x</span><strong>${formatStatNum(x)}</strong></div>`;
        lastEquationResult = { type, summary: `x = ${formatStatNum(x)}` };

    } else if (type === 'quadratic') {
        const a = parseFloat(document.getElementById('eq-quad-a').value);
        const b = parseFloat(document.getElementById('eq-quad-b').value);
        const c = parseFloat(document.getElementById('eq-quad-c').value);
        if (isNaN(a) || isNaN(b) || isNaN(c)) { resultEl.innerHTML = '<p class="no-history">Enter valid coefficients.</p>'; lastEquationResult = null; return; }
        if (a === 0) {
            if (b === 0) {
                const msg = c === 0 ? 'Infinitely many solutions (0 = 0)' : 'No solution (contradiction)';
                resultEl.innerHTML = `<p class="no-history">${msg}</p>`;
                lastEquationResult = { type, summary: msg };
                return;
            }
            const x = -c / b;
            resultEl.innerHTML = `<p class="no-history">Not quadratic (a=0) — reduces to linear.</p><div class="stats-item"><span>x</span><strong>${formatStatNum(x)}</strong></div>`;
            lastEquationResult = { type, summary: `x = ${formatStatNum(x)} (linear, a=0)` };
            return;
        }
        const D = b * b - 4 * a * c;
        if (D > 0) {
            const sqrtD = Math.sqrt(D);
            const x1 = (-b + sqrtD) / (2 * a);
            const x2 = (-b - sqrtD) / (2 * a);
            resultEl.innerHTML = `
                <div class="stats-item"><span>x₁</span><strong>${formatStatNum(x1)}</strong></div>
                <div class="stats-item"><span>x₂</span><strong>${formatStatNum(x2)}</strong></div>
            `;
            lastEquationResult = { type, summary: `x₁=${formatStatNum(x1)}, x₂=${formatStatNum(x2)}` };
        } else if (D === 0) {
            const x = -b / (2 * a);
            resultEl.innerHTML = `<div class="stats-item"><span>x (double root)</span><strong>${formatStatNum(x)}</strong></div>`;
            lastEquationResult = { type, summary: `x = ${formatStatNum(x)} (double root)` };
        } else {
            const real = -b / (2 * a);
            const imag = Math.sqrt(-D) / (2 * a);
            const summary = `x = ${formatStatNum(real)} ± ${formatStatNum(Math.abs(imag))}i`;
            resultEl.innerHTML = `<div class="stats-item"><span>Complex roots</span><strong>${summary}</strong></div>`;
            lastEquationResult = { type, summary };
        }

    } else if (type === 'system2') {
        const a1 = parseFloat(document.getElementById('sys2-a1').value);
        const b1 = parseFloat(document.getElementById('sys2-b1').value);
        const c1 = parseFloat(document.getElementById('sys2-c1').value);
        const a2 = parseFloat(document.getElementById('sys2-a2').value);
        const b2 = parseFloat(document.getElementById('sys2-b2').value);
        const c2 = parseFloat(document.getElementById('sys2-c2').value);
        if ([a1, b1, c1, a2, b2, c2].some(isNaN)) { resultEl.innerHTML = '<p class="no-history">Enter valid coefficients.</p>'; lastEquationResult = null; return; }
        const D = matDeterminant([[a1, b1], [a2, b2]]);
        if (Math.abs(D) < 1e-10) {
            resultEl.innerHTML = '<p class="no-history">No unique solution (determinant = 0)</p>';
            lastEquationResult = { type, summary: 'No unique solution' };
            return;
        }
        const Dx = matDeterminant([[c1, b1], [c2, b2]]);
        const Dy = matDeterminant([[a1, c1], [a2, c2]]);
        const x = Dx / D, y = Dy / D;
        resultEl.innerHTML = `
            <div class="stats-item"><span>x</span><strong>${formatStatNum(x)}</strong></div>
            <div class="stats-item"><span>y</span><strong>${formatStatNum(y)}</strong></div>
        `;
        lastEquationResult = { type, summary: `x=${formatStatNum(x)}, y=${formatStatNum(y)}` };

    } else if (type === 'system3') {
        const vals = ['a1', 'b1', 'c1', 'd1', 'a2', 'b2', 'c2', 'd2', 'a3', 'b3', 'c3', 'd3']
            .map(id => parseFloat(document.getElementById(`sys3-${id}`).value));
        if (vals.some(isNaN)) { resultEl.innerHTML = '<p class="no-history">Enter valid coefficients.</p>'; lastEquationResult = null; return; }
        const [a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3] = vals;
        const coeff = [[a1, b1, c1], [a2, b2, c2], [a3, b3, c3]];
        const D = matDeterminant(coeff);
        if (Math.abs(D) < 1e-10) {
            resultEl.innerHTML = '<p class="no-history">No unique solution (determinant = 0)</p>';
            lastEquationResult = { type, summary: 'No unique solution' };
            return;
        }
        const Dx = matDeterminant([[d1, b1, c1], [d2, b2, c2], [d3, b3, c3]]);
        const Dy = matDeterminant([[a1, d1, c1], [a2, d2, c2], [a3, d3, c3]]);
        const Dz = matDeterminant([[a1, b1, d1], [a2, b2, d2], [a3, b3, d3]]);
        const x = Dx / D, y = Dy / D, z = Dz / D;
        resultEl.innerHTML = `
            <div class="stats-item"><span>x</span><strong>${formatStatNum(x)}</strong></div>
            <div class="stats-item"><span>y</span><strong>${formatStatNum(y)}</strong></div>
            <div class="stats-item"><span>z</span><strong>${formatStatNum(z)}</strong></div>
        `;
        lastEquationResult = { type, summary: `x=${formatStatNum(x)}, y=${formatStatNum(y)}, z=${formatStatNum(z)}` };
    }
}

function addEquationResultToHistory() {
    if (!lastEquationResult) return;
    const typeLabels = { linear: 'Linear eqn', quadratic: 'Quadratic eqn', system2: '2-var system', system3: '3-var system' };
    addToHistory(typeLabels[lastEquationResult.type] || 'Equation', lastEquationResult.summary);
    playSound();
}

function clearEquationSolver() {
    const type = document.getElementById('eq-type').value;
    if (type === 'linear') {
        document.getElementById('eq-lin-a').value = '1';
        document.getElementById('eq-lin-b').value = '0';
    } else if (type === 'quadratic') {
        document.getElementById('eq-quad-a').value = '1';
        document.getElementById('eq-quad-b').value = '0';
        document.getElementById('eq-quad-c').value = '0';
    }
    document.getElementById('eq-result').innerHTML = '<p class="no-history">Enter coefficients, then Solve</p>';
    lastEquationResult = null;
    playSound();
}

// ==================== DERIVATIVE & INTEGRAL ====================

function evalCalcFunction(exprRaw, xValue) {
    let expr = exprRaw.trim();
    expr = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\^/g, '**');
    if (!/^[0-9a-zA-Z+\-*/%.,()\s]*$/.test(expr)) throw new Error('Invalid characters');
    const { names: varNames, values: varValues } = getUserVariableBindings(['x', 'sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'cbrt', 'abs', 'pi', 'e']);
    const fn = new Function(
        'x', 'sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'cbrt', 'abs', 'pi', 'e', ...varNames,
        '"use strict"; return (' + expr + ');'
    );
    // Trig here is always radians — required for calculus (derivatives/integrals) to be mathematically correct
    return fn(xValue, Math.sin, Math.cos, Math.tan, Math.log10, Math.log, Math.sqrt, Math.cbrt, Math.abs, Math.PI, Math.E, ...varValues);
}

let lastDerivativeResult = null;
let lastIntegralResult = null;

function calculateDerivative() {
    const exprRaw = document.getElementById('calc-function').value;
    const x0 = parseFloat(document.getElementById('calc-point').value);
    const resultEl = document.getElementById('calc-derivative-result');
    const saveBtn = document.getElementById('calc-derivative-save');

    if (!exprRaw.trim() || isNaN(x0)) {
        resultEl.textContent = 'Enter a function and a point.';
        saveBtn.style.display = 'none';
        lastDerivativeResult = null;
        return;
    }
    try {
        const h = 1e-5;
        const fPlus = evalCalcFunction(exprRaw, x0 + h);
        const fMinus = evalCalcFunction(exprRaw, x0 - h);
        const derivative = (fPlus - fMinus) / (2 * h);
        if (!isFinite(derivative)) throw new Error('Not finite');
        resultEl.textContent = `f'(${x0}) ≈ ${formatStatNum(derivative)}`;
        lastDerivativeResult = { expr: exprRaw, x0, value: derivative };
        saveBtn.style.display = 'inline-block';
    } catch (err) {
        resultEl.textContent = 'Could not evaluate — check the function syntax.';
        saveBtn.style.display = 'none';
        lastDerivativeResult = null;
    }
    playSound();
}

function calculateIntegral() {
    const exprRaw = document.getElementById('calc-function').value;
    const a = parseFloat(document.getElementById('calc-a').value);
    const b = parseFloat(document.getElementById('calc-b').value);
    const resultEl = document.getElementById('calc-integral-result');
    const saveBtn = document.getElementById('calc-integral-save');

    if (!exprRaw.trim() || isNaN(a) || isNaN(b)) {
        resultEl.textContent = 'Enter a function and bounds a, b.';
        saveBtn.style.display = 'none';
        lastIntegralResult = null;
        return;
    }
    try {
        if (a === b) {
            resultEl.textContent = `∫ from ${a} to ${b} = 0`;
            lastIntegralResult = { expr: exprRaw, a, b, value: 0 };
            saveBtn.style.display = 'inline-block';
            playSound();
            return;
        }
        const lo = Math.min(a, b), hi = Math.max(a, b);
        const n = 1000; // even, for Simpson's rule
        const h = (hi - lo) / n;
        let sum = evalCalcFunction(exprRaw, lo) + evalCalcFunction(exprRaw, hi);
        for (let i = 1; i < n; i++) {
            const xi = lo + i * h;
            const coeff = (i % 2 === 0) ? 2 : 4;
            sum += coeff * evalCalcFunction(exprRaw, xi);
        }
        let integral = (h / 3) * sum;
        if (a > b) integral = -integral;
        if (!isFinite(integral)) throw new Error('Not finite');
        resultEl.textContent = `∫ from ${a} to ${b} ≈ ${formatStatNum(integral)}`;
        lastIntegralResult = { expr: exprRaw, a, b, value: integral };
        saveBtn.style.display = 'inline-block';
    } catch (err) {
        resultEl.textContent = 'Could not evaluate — check the function syntax.';
        saveBtn.style.display = 'none';
        lastIntegralResult = null;
    }
    playSound();
}

function addDerivativeToHistory() {
    if (!lastDerivativeResult) return;
    const r = lastDerivativeResult;
    addToHistory(`d/dx[${r.expr}] at x=${r.x0}`, formatStatNum(r.value));
    playSound();
}

function addIntegralToHistory() {
    if (!lastIntegralResult) return;
    const r = lastIntegralResult;
    addToHistory(`∫[${r.expr}] from ${r.a} to ${r.b}`, formatStatNum(r.value));
    playSound();
}

function clearCalculus() {
    document.getElementById('calc-function').value = '';
    document.getElementById('calc-point').value = '0';
    document.getElementById('calc-a').value = '0';
    document.getElementById('calc-b').value = '1';
    document.getElementById('calc-derivative-result').textContent = '';
    document.getElementById('calc-integral-result').textContent = '';
    document.getElementById('calc-derivative-save').style.display = 'none';
    document.getElementById('calc-integral-save').style.display = 'none';
    lastDerivativeResult = null;
    lastIntegralResult = null;
    playSound();
}

// ==================== GRAPHING ====================

let lastGraphResult = null;

function plotGraph() {
    const exprRaw = document.getElementById('graph-function').value;
    const xMin = parseFloat(document.getElementById('graph-xmin').value);
    const xMax = parseFloat(document.getElementById('graph-xmax').value);
    const canvas = document.getElementById('graph-canvas');
    const ctx = canvas.getContext('2d');
    const infoEl = document.getElementById('graph-info');
    const width = canvas.width, height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (!exprRaw.trim() || isNaN(xMin) || isNaN(xMax) || xMin >= xMax) {
        infoEl.textContent = 'Enter a function and a valid x range (min < max).';
        lastGraphResult = null;
        return;
    }

    const samples = 400;
    const xs = [];
    const ys = [];
    let yMin = Infinity, yMax = -Infinity;
    for (let i = 0; i <= samples; i++) {
        const x = xMin + (xMax - xMin) * i / samples;
        let y;
        try { y = evalCalcFunction(exprRaw, x); } catch (e) { y = NaN; }
        xs.push(x);
        ys.push(y);
        if (isFinite(y)) {
            if (y < yMin) yMin = y;
            if (y > yMax) yMax = y;
        }
    }

    if (!isFinite(yMin) || !isFinite(yMax)) {
        infoEl.textContent = 'Could not evaluate this function over the given range.';
        lastGraphResult = null;
        return;
    }
    if (yMin === yMax) { yMin -= 1; yMax += 1; }
    const pad = (yMax - yMin) * 0.1;
    yMin -= pad;
    yMax += pad;

    function toPx(x, y) {
        const px = (x - xMin) / (xMax - xMin) * width;
        const py = height - (y - yMin) / (yMax - yMin) * height;
        return [px, py];
    }

    const styles = getComputedStyle(document.body);
    const gridColor = styles.getPropertyValue('--border-color').trim();
    const axisColor = styles.getPropertyValue('--text-primary').trim();
    const curveColor = styles.getPropertyValue('--accent-color').trim();
    const tangentColor = styles.getPropertyValue('--warning-color').trim();
    const fillColor = styles.getPropertyValue('--success-color').trim();

    // grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    const gridDivs = 10;
    for (let i = 0; i <= gridDivs; i++) {
        const gx = i / gridDivs * width;
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, height); ctx.stroke();
        const gy = i / gridDivs * height;
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(width, gy); ctx.stroke();
    }

    // axes
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1.5;
    if (xMin <= 0 && xMax >= 0) {
        const [zx] = toPx(0, 0);
        ctx.beginPath(); ctx.moveTo(zx, 0); ctx.lineTo(zx, height); ctx.stroke();
    }
    if (yMin <= 0 && yMax >= 0) {
        const [, zy] = toPx(0, 0);
        ctx.beginPath(); ctx.moveTo(0, zy); ctx.lineTo(width, zy); ctx.stroke();
    }

    // shaded integral region
    const showIntegral = document.getElementById('graph-show-integral').checked;
    if (showIntegral) {
        const a = parseFloat(document.getElementById('graph-a').value);
        const b = parseFloat(document.getElementById('graph-b').value);
        if (!isNaN(a) && !isNaN(b) && a !== b) {
            const lo = Math.min(a, b), hi = Math.max(a, b);
            ctx.beginPath();
            const [xStart, yBase] = toPx(lo, 0);
            ctx.moveTo(xStart, yBase);
            const steps = 150;
            for (let i = 0; i <= steps; i++) {
                const x = lo + (hi - lo) * i / steps;
                let y;
                try { y = evalCalcFunction(exprRaw, x); } catch (e) { y = 0; }
                const [px, py] = toPx(x, y);
                ctx.lineTo(px, py);
            }
            const [xEnd] = toPx(hi, 0);
            ctx.lineTo(xEnd, yBase);
            ctx.closePath();
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = fillColor;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    // curve with glow
    ctx.strokeStyle = curveColor;
    ctx.lineWidth = 2.5;
    ctx.save();
    ctx.shadowColor = curveColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < xs.length; i++) {
        if (!isFinite(ys[i])) { started = false; continue; }
        const [px, py] = toPx(xs[i], ys[i]);
        if (!started) { ctx.moveTo(px, py); started = true; } else { ctx.lineTo(px, py); }
    }
    ctx.stroke();
    ctx.restore();

    // tangent line
    const showTangent = document.getElementById('graph-show-tangent').checked;
    let tangentInfo = '';
    if (showTangent) {
        const x0 = parseFloat(document.getElementById('graph-tangent-x').value);
        if (!isNaN(x0)) {
            try {
                const h = 1e-5;
                const y0 = evalCalcFunction(exprRaw, x0);
                const slope = (evalCalcFunction(exprRaw, x0 + h) - evalCalcFunction(exprRaw, x0 - h)) / (2 * h);
                ctx.strokeStyle = tangentColor;
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 4]);
                ctx.beginPath();
                const [px1, py1] = toPx(xMin, y0 + slope * (xMin - x0));
                const [px2, py2] = toPx(xMax, y0 + slope * (xMax - x0));
                ctx.moveTo(px1, py1);
                ctx.lineTo(px2, py2);
                ctx.stroke();
                ctx.setLineDash([]);
                tangentInfo = ` · tangent slope at x=${x0}: ${formatStatNum(slope)}`;
            } catch (e) { /* skip tangent if it fails to evaluate */ }
        }
    }

    infoEl.textContent = `Plotted over [${xMin}, ${xMax}], y ∈ [${formatStatNum(yMin)}, ${formatStatNum(yMax)}]${tangentInfo}`;
    lastGraphResult = { expr: exprRaw, xMin, xMax };
    playSound();
}

function clearGraph() {
    document.getElementById('graph-function').value = '';
    document.getElementById('graph-xmin').value = '-10';
    document.getElementById('graph-xmax').value = '10';
    document.getElementById('graph-show-tangent').checked = false;
    document.getElementById('graph-show-integral').checked = false;
    const canvas = document.getElementById('graph-canvas');
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('graph-info').textContent = '';
    lastGraphResult = null;
    playSound();
}

// ==================== COMPLEX NUMBERS ====================

function complexAdd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
function complexSub(a, b) { return { re: a.re - b.re, im: a.im - b.im }; }
function complexMul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }

function complexDiv(a, b) {
    const denom = b.re * b.re + b.im * b.im;
    if (denom === 0) return null;
    return { re: (a.re * b.re + a.im * b.im) / denom, im: (a.im * b.re - a.re * b.im) / denom };
}

function complexModulus(a) { return Math.sqrt(a.re * a.re + a.im * a.im); }
function complexArgDeg(a) { return Math.atan2(a.im, a.re) * 180 / Math.PI; }

function formatComplex(c) {
    const reStr = formatStatNum(c.re);
    const imAbs = formatStatNum(Math.abs(c.im));
    return `${reStr} ${c.im >= 0 ? '+' : '−'} ${imAbs}i`;
}

let lastComplexResult = null;

function calculateComplex() {
    const resultEl = document.getElementById('complex-result');
    const op = document.getElementById('complex-operation').value;
    const a = {
        re: parseFloat(document.getElementById('complex-a-re').value),
        im: parseFloat(document.getElementById('complex-a-im').value)
    };
    const b = {
        re: parseFloat(document.getElementById('complex-b-re').value),
        im: parseFloat(document.getElementById('complex-b-im').value)
    };

    if (isNaN(a.re) || isNaN(a.im) || (['add', 'sub', 'mul', 'div', 'conjB', 'polarB'].includes(op) && (isNaN(b.re) || isNaN(b.im)))) {
        resultEl.innerHTML = '<p class="no-history">Enter valid real and imaginary parts.</p>';
        lastComplexResult = null;
        return;
    }

    let resultText = '';
    let summary = '';

    switch (op) {
        case 'add': {
            const r = complexAdd(a, b);
            resultText = `<div class="stats-item"><span>A + B</span><strong>${formatComplex(r)}</strong></div>`;
            summary = `(${formatComplex(a)}) + (${formatComplex(b)}) = ${formatComplex(r)}`;
            break;
        }
        case 'sub': {
            const r = complexSub(a, b);
            resultText = `<div class="stats-item"><span>A − B</span><strong>${formatComplex(r)}</strong></div>`;
            summary = `(${formatComplex(a)}) − (${formatComplex(b)}) = ${formatComplex(r)}`;
            break;
        }
        case 'mul': {
            const r = complexMul(a, b);
            resultText = `<div class="stats-item"><span>A × B</span><strong>${formatComplex(r)}</strong></div>`;
            summary = `(${formatComplex(a)}) × (${formatComplex(b)}) = ${formatComplex(r)}`;
            break;
        }
        case 'div': {
            const r = complexDiv(a, b);
            if (!r) {
                resultEl.innerHTML = '<p class="no-history">Cannot divide by zero (B = 0).</p>';
                lastComplexResult = null;
                return;
            }
            resultText = `<div class="stats-item"><span>A ÷ B</span><strong>${formatComplex(r)}</strong></div>`;
            summary = `(${formatComplex(a)}) ÷ (${formatComplex(b)}) = ${formatComplex(r)}`;
            break;
        }
        case 'conjA': {
            const r = { re: a.re, im: -a.im };
            resultText = `<div class="stats-item"><span>Conjugate of A</span><strong>${formatComplex(r)}</strong></div>`;
            summary = `conj(${formatComplex(a)}) = ${formatComplex(r)}`;
            break;
        }
        case 'conjB': {
            const r = { re: b.re, im: -b.im };
            resultText = `<div class="stats-item"><span>Conjugate of B</span><strong>${formatComplex(r)}</strong></div>`;
            summary = `conj(${formatComplex(b)}) = ${formatComplex(r)}`;
            break;
        }
        case 'polarA': {
            const r = complexModulus(a);
            const theta = complexArgDeg(a);
            resultText = `
                <div class="stats-item"><span>Modulus (r)</span><strong>${formatStatNum(r)}</strong></div>
                <div class="stats-item"><span>Argument (θ)</span><strong>${formatStatNum(theta)}°</strong></div>
            `;
            summary = `${formatComplex(a)} = ${formatStatNum(r)} ∠ ${formatStatNum(theta)}°`;
            break;
        }
        case 'polarB': {
            const r = complexModulus(b);
            const theta = complexArgDeg(b);
            resultText = `
                <div class="stats-item"><span>Modulus (r)</span><strong>${formatStatNum(r)}</strong></div>
                <div class="stats-item"><span>Argument (θ)</span><strong>${formatStatNum(theta)}°</strong></div>
            `;
            summary = `${formatComplex(b)} = ${formatStatNum(r)} ∠ ${formatStatNum(theta)}°`;
            break;
        }
    }

    resultEl.innerHTML = resultText;
    lastComplexResult = { op, summary };
}

function addComplexResultToHistory() {
    if (!lastComplexResult) return;
    addToHistory('Complex', lastComplexResult.summary);
    playSound();
}

function clearComplex() {
    document.getElementById('complex-a-re').value = '1';
    document.getElementById('complex-a-im').value = '0';
    document.getElementById('complex-b-re').value = '0';
    document.getElementById('complex-b-im').value = '1';
    document.getElementById('complex-result').innerHTML = '<p class="no-history">Enter values and an operation, then Calculate</p>';
    lastComplexResult = null;
    playSound();
}

// ==================== NUMBER THEORY ====================

function onNumTheoryTypeChange() {
    const type = document.getElementById('nt-type').value;
    ['gcdlcm', 'primecheck', 'factorize', 'modular'].forEach(t => {
        document.getElementById(`nt-${t}-inputs`).style.display = (t === type) ? 'block' : 'none';
    });
    document.getElementById('nt-result').innerHTML = '<p class="no-history">Choose a tool and enter values, then Calculate</p>';
    lastNumTheoryResult = null;
}

let lastNumTheoryResult = null;
const NT_MAX = 1e14; // cap for perf on trial-division based operations

function gcdTwo(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { [a, b] = [b, a % b]; }
    return a;
}

function lcmTwo(a, b) {
    if (a === 0 || b === 0) return 0;
    return Math.abs(a * b) / gcdTwo(a, b);
}

function isPrimeNum(n) {
    if (!Number.isInteger(n) || n < 2) return false;
    if (n === 2 || n === 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6) {
        if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
}

function primeFactorizeNum(n) {
    let num = Math.abs(n);
    const factors = [];
    for (let p = 2; p * p <= num; p++) {
        let count = 0;
        while (num % p === 0) { num /= p; count++; }
        if (count > 0) factors.push([p, count]);
    }
    if (num > 1) factors.push([num, 1]);
    return factors;
}

function modPowBig(base, exp, mod) {
    base = BigInt(base); exp = BigInt(exp); mod = BigInt(mod);
    if (mod === 1n) return 0n;
    let result = 1n;
    base = ((base % mod) + mod) % mod;
    while (exp > 0n) {
        if (exp & 1n) result = (result * base) % mod;
        exp >>= 1n;
        base = (base * base) % mod;
    }
    return result;
}

function calculateNumTheory() {
    const type = document.getElementById('nt-type').value;
    const resultEl = document.getElementById('nt-result');

    if (type === 'gcdlcm') {
        const raw = document.getElementById('nt-gcdlcm-input').value;
        const nums = raw.split(/[\s,]+/).map(s => s.trim()).filter(s => s !== '').map(Number);
        if (nums.length < 2 || nums.some(n => !Number.isFinite(n) || !Number.isInteger(n))) {
            resultEl.innerHTML = '<p class="no-history">Enter 2 or more integers, separated by commas.</p>';
            lastNumTheoryResult = null;
            return;
        }
        let g = Math.abs(nums[0]), l = Math.abs(nums[0]);
        for (let i = 1; i < nums.length; i++) { g = gcdTwo(g, nums[i]); l = lcmTwo(l, nums[i]); }
        resultEl.innerHTML = `
            <div class="stats-item"><span>GCD</span><strong>${g}</strong></div>
            <div class="stats-item"><span>LCM</span><strong>${l}</strong></div>
        `;
        lastNumTheoryResult = { label: 'GCD/LCM', summary: `GCD/LCM(${nums.join(', ')}) = ${g} / ${l}` };

    } else if (type === 'primecheck') {
        const n = parseInt(document.getElementById('nt-prime-n').value);
        if (isNaN(n)) { resultEl.innerHTML = '<p class="no-history">Enter an integer.</p>'; lastNumTheoryResult = null; return; }
        if (Math.abs(n) > NT_MAX) { resultEl.innerHTML = '<p class="no-history">n is too large to check exactly (max 1e14).</p>'; lastNumTheoryResult = null; return; }
        const prime = isPrimeNum(n);
        resultEl.innerHTML = `<div class="stats-item"><span>${n}</span><strong>${prime ? 'Prime' : 'Not Prime'}</strong></div>`;
        lastNumTheoryResult = { label: 'Prime Check', summary: `${n} is ${prime ? 'prime' : 'not prime'}` };

    } else if (type === 'factorize') {
        const n = parseInt(document.getElementById('nt-factor-n').value);
        if (isNaN(n) || n === 0) { resultEl.innerHTML = '<p class="no-history">Enter a non-zero integer.</p>'; lastNumTheoryResult = null; return; }
        if (Math.abs(n) > NT_MAX) { resultEl.innerHTML = '<p class="no-history">n is too large to factor exactly (max 1e14).</p>'; lastNumTheoryResult = null; return; }
        if (Math.abs(n) === 1) {
            resultEl.innerHTML = '<p class="no-history">±1 has no prime factors.</p>';
            lastNumTheoryResult = { label: 'Prime Factorization', summary: `${n} has no prime factors` };
            return;
        }
        const factors = primeFactorizeNum(n);
        const factorStr = factors.map(([p, c]) => c > 1 ? `${p}^${c}` : `${p}`).join(' × ');
        resultEl.innerHTML = `<div class="stats-item"><span>${n} =</span><strong>${factorStr}</strong></div>`;
        lastNumTheoryResult = { label: 'Prime Factorization', summary: `${n} = ${factorStr}` };

    } else if (type === 'modular') {
        const a = parseInt(document.getElementById('nt-mod-a').value);
        const n = parseInt(document.getElementById('nt-mod-n').value);
        const bRaw = document.getElementById('nt-mod-b').value;
        if (isNaN(a) || isNaN(n) || n === 0) { resultEl.innerHTML = '<p class="no-history">Enter valid a and non-zero n.</p>'; lastNumTheoryResult = null; return; }
        const amodn = ((a % n) + n) % n;
        let html = `<div class="stats-item"><span>a mod n</span><strong>${amodn}</strong></div>`;
        let summary = `${a} mod ${n} = ${amodn}`;
        if (bRaw.trim() !== '') {
            const b = parseInt(bRaw);
            if (!isNaN(b) && b >= 0) {
                const modexp = modPowBig(a, b, n);
                html += `<div class="stats-item"><span>a^b mod n</span><strong>${modexp.toString()}</strong></div>`;
                summary += `, ${a}^${b} mod ${n} = ${modexp}`;
            }
        }
        resultEl.innerHTML = html;
        lastNumTheoryResult = { label: 'Modular Arithmetic', summary };
    }
    playSound();
}

function addNumTheoryToHistory() {
    if (!lastNumTheoryResult) return;
    addToHistory(lastNumTheoryResult.label, lastNumTheoryResult.summary);
    playSound();
}

function clearNumTheory() {
    document.getElementById('nt-gcdlcm-input').value = '';
    document.getElementById('nt-prime-n').value = '';
    document.getElementById('nt-factor-n').value = '';
    document.getElementById('nt-mod-a').value = '7';
    document.getElementById('nt-mod-n').value = '5';
    document.getElementById('nt-mod-b').value = '';
    document.getElementById('nt-result').innerHTML = '<p class="no-history">Choose a tool and enter values, then Calculate</p>';
    lastNumTheoryResult = null;
    playSound();
}

// ==================== FINANCIAL CALCULATORS ====================

function onFinancialTypeChange() {
    const type = document.getElementById('fin-type').value;
    document.getElementById('fin-loan-inputs').style.display = type === 'loan' ? 'block' : 'none';
    document.getElementById('fin-compound-inputs').style.display = type === 'compound' ? 'block' : 'none';
    document.getElementById('fin-result').innerHTML = '<p class="no-history">Enter values, then Calculate</p>';
    document.getElementById('fin-amort-table-wrap').style.display = 'none';
    lastFinancialResult = null;
}

let lastFinancialResult = null;

function calculateLoanPayment(principal, annualRatePct, years, freq) {
    const n = years * freq;
    const r = (annualRatePct / 100) / freq;
    let payment;
    if (r === 0) {
        payment = principal / n;
    } else {
        payment = principal * r / (1 - Math.pow(1 + r, -n));
    }
    const totalPaid = payment * n;
    const totalInterest = totalPaid - principal;
    return { payment, totalPaid, totalInterest, n, r };
}

function buildAmortizationSchedule(principal, r, payment, rows) {
    let balance = principal;
    const schedule = [];
    for (let i = 1; i <= rows && balance > 0.005; i++) {
        const interestPortion = balance * r;
        let principalPortion = payment - interestPortion;
        if (principalPortion > balance) principalPortion = balance;
        balance -= principalPortion;
        schedule.push({
            period: i,
            payment: interestPortion + principalPortion,
            principal: principalPortion,
            interest: interestPortion,
            balance: Math.max(balance, 0)
        });
    }
    return schedule;
}

function calculateFinancial() {
    const type = document.getElementById('fin-type').value;
    const resultEl = document.getElementById('fin-result');
    const amortWrap = document.getElementById('fin-amort-table-wrap');
    amortWrap.style.display = 'none';

    if (type === 'loan') {
        const principal = parseFloat(document.getElementById('fin-loan-principal').value);
        const rate = parseFloat(document.getElementById('fin-loan-rate').value);
        const years = parseFloat(document.getElementById('fin-loan-years').value);
        const freq = parseInt(document.getElementById('fin-loan-freq').value);
        if ([principal, rate, years, freq].some(v => isNaN(v)) || principal <= 0 || years <= 0 || freq <= 0) {
            resultEl.innerHTML = '<p class="no-history">Enter valid positive values.</p>';
            lastFinancialResult = null;
            return;
        }
        const { payment, totalPaid, totalInterest, n, r } = calculateLoanPayment(principal, rate, years, freq);
        resultEl.innerHTML = `
            <div class="stats-item"><span>Payment / period</span><strong>${formatStatNum(payment)}</strong></div>
            <div class="stats-item"><span>Total paid</span><strong>${formatStatNum(totalPaid)}</strong></div>
            <div class="stats-item"><span>Total interest</span><strong>${formatStatNum(totalInterest)}</strong></div>
            <div class="stats-item"><span># of payments</span><strong>${n}</strong></div>
        `;
        lastFinancialResult = {
            type: 'loan',
            summary: `Loan ${formatStatNum(principal)} @ ${rate}% / ${years}y → payment=${formatStatNum(payment)}, total interest=${formatStatNum(totalInterest)}`
        };

        const showAmort = document.getElementById('fin-show-amort').checked;
        if (showAmort) {
            const schedule = buildAmortizationSchedule(principal, r, payment, Math.min(12, n));
            let tableHtml = '<table><thead><tr><th>#</th><th>Payment</th><th>Principal</th><th>Interest</th><th>Balance</th></tr></thead><tbody>';
            schedule.forEach(row => {
                tableHtml += `<tr><td>${row.period}</td><td>${formatStatNum(row.payment)}</td><td>${formatStatNum(row.principal)}</td><td>${formatStatNum(row.interest)}</td><td>${formatStatNum(row.balance)}</td></tr>`;
            });
            tableHtml += '</tbody></table>';
            document.getElementById('fin-amort-table').innerHTML = tableHtml;
            amortWrap.style.display = 'block';
        }

    } else if (type === 'compound') {
        const principal = parseFloat(document.getElementById('fin-comp-principal').value);
        const rate = parseFloat(document.getElementById('fin-comp-rate').value);
        const freq = parseInt(document.getElementById('fin-comp-freq').value);
        const years = parseFloat(document.getElementById('fin-comp-years').value);
        if ([principal, rate, freq, years].some(v => isNaN(v)) || principal <= 0 || freq <= 0 || years <= 0) {
            resultEl.innerHTML = '<p class="no-history">Enter valid positive values.</p>';
            lastFinancialResult = null;
            return;
        }
        const r = rate / 100;
        const finalAmount = principal * Math.pow(1 + r / freq, freq * years);
        const interestEarned = finalAmount - principal;
        resultEl.innerHTML = `
            <div class="stats-item"><span>Final amount</span><strong>${formatStatNum(finalAmount)}</strong></div>
            <div class="stats-item"><span>Interest earned</span><strong>${formatStatNum(interestEarned)}</strong></div>
        `;
        lastFinancialResult = {
            type: 'compound',
            summary: `Compound ${formatStatNum(principal)} @ ${rate}% / ${years}y → final=${formatStatNum(finalAmount)}, interest=${formatStatNum(interestEarned)}`
        };
    }
    playSound();
}

function addFinancialToHistory() {
    if (!lastFinancialResult) return;
    addToHistory(lastFinancialResult.type === 'loan' ? 'Loan calc' : 'Compound interest', lastFinancialResult.summary);
    playSound();
}

function clearFinancial() {
    document.getElementById('fin-loan-principal').value = '300000';
    document.getElementById('fin-loan-rate').value = '5';
    document.getElementById('fin-loan-years').value = '30';
    document.getElementById('fin-loan-freq').value = '12';
    document.getElementById('fin-show-amort').checked = false;
    document.getElementById('fin-comp-principal').value = '10000';
    document.getElementById('fin-comp-rate').value = '5';
    document.getElementById('fin-comp-freq').value = '12';
    document.getElementById('fin-comp-years').value = '10';
    document.getElementById('fin-result').innerHTML = '<p class="no-history">Enter values, then Calculate</p>';
    document.getElementById('fin-amort-table-wrap').style.display = 'none';
    lastFinancialResult = null;
    playSound();
}

// ==================== SETTINGS: VARIABLES ====================

const RESERVED_NAMES = ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'cbrt', 'abs', 'pi', 'e', 'x'];

function getUserVariableBindings(excludeNames) {
    const names = [];
    const values = [];
    for (const name of Object.keys(userVariables)) {
        if (excludeNames.includes(name)) continue;
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) continue;
        names.push(name);
        values.push(userVariables[name]);
    }
    return { names, values };
}

function setVariable() {
    const nameInput = document.getElementById('var-name');
    const valueInput = document.getElementById('var-value');
    const name = nameInput.value.trim();
    const value = parseFloat(valueInput.value);
    const msgEl = document.getElementById('var-message');

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        msgEl.textContent = 'Name must start with a letter and contain only letters, numbers, underscores.';
        return;
    }
    if (RESERVED_NAMES.includes(name)) {
        msgEl.textContent = `"${name}" is reserved (built-in function/constant) — choose another name.`;
        return;
    }
    if (isNaN(value)) {
        msgEl.textContent = 'Enter a valid number for the value.';
        return;
    }

    msgEl.textContent = '';
    userVariables[name] = value;
    renderVariablesList();
    saveSettings();
    nameInput.value = '';
    valueInput.value = '';
    playSound();
}

function deleteVariable(name) {
    delete userVariables[name];
    renderVariablesList();
    saveSettings();
    playSound();
}

function renderVariablesList() {
    const container = document.getElementById('variables-list');
    if (!container) return;
    const names = Object.keys(userVariables);
    if (names.length === 0) {
        container.innerHTML = '<p class="no-history">No variables defined</p>';
        return;
    }
    container.innerHTML = names.map(name => `
        <div class="stats-item">
            <span>${name}</span>
            <strong>${formatStatNum(userVariables[name])} <button class="btn-remove-fav" onclick="deleteVariable('${name}')" title="Delete">✕</button></strong>
        </div>
    `).join('');
}

// ==================== SETTINGS: DISPLAY & ANGLE UNIT ====================

function setDecimalPrecision(val) {
    const p = parseInt(val);
    if (isNaN(p) || p < 0 || p > 10) return;
    decimalPrecision = p;
    saveSettings();
}

function setAngleUnit(unit) {
    angleUnit = unit;
    saveSettings();
    updateAngleUnitBadges();
}

function updateAngleUnitBadges() {
    const label = angleUnit === 'degrees' ? 'DEG' : 'RAD';
    const sciBadge = document.getElementById('sci-angle-badge');
    const exprBadge = document.getElementById('expr-angle-badge');
    if (sciBadge) sciBadge.textContent = label;
    if (exprBadge) exprBadge.textContent = label;
}

// ==================== SETTINGS: ACCENT COLOR ====================

function setAccentColor(color) {
    document.body.style.setProperty('--accent-color', color);
    customAccentColor = color;
    const picker = document.getElementById('accent-color-picker');
    if (picker) picker.value = color;
    saveSettings();
    if (lastGraphResult) plotGraph();
    playSound();
}

function resetAccentColor() {
    document.body.style.removeProperty('--accent-color');
    customAccentColor = null;
    saveSettings();
    if (lastGraphResult) plotGraph();
    playSound();
}

// ==================== MODE SWITCHING ====================

function switchMode(mode) {
    document.querySelectorAll('.calculator-mode').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    
    const modes = { 'simple': 0, 'scientific': 1, 'programmer': 2, 'converter': 3, 'units': 4, 'currency': 5, 'expression': 6, 'statistics': 7, 'combinatorics': 8, 'random': 9, 'matrix': 10, 'equations': 11, 'calculus': 12, 'graphing': 13, 'complex': 14, 'numtheory': 15, 'financial': 16, 'settings': 17, 'favorites': 18, 'history': 19 };
    document.getElementById(mode + '-mode').classList.add('active');
    document.querySelectorAll('.mode-btn')[modes[mode]].classList.add('active');

    if (mode === 'simple' || mode === 'scientific' || mode === 'programmer' || mode === 'expression') {
        lastCalcMode = mode;
    }
    
    updateMemoryDisplay(mode === 'programmer' ? 'programmer' : mode === 'scientific' ? 'scientific' : 'simple');
    playSound();
}

// ==================== KEYBOARD SUPPORT ====================

document.addEventListener('keydown', (e) => {
    // Don't hijack typing inside real text fields (converter/expression inputs)
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    const activeMode = document.querySelector('.calculator-mode.active').id.split('-')[0];
    if (activeMode !== 'simple' && activeMode !== 'scientific' && activeMode !== 'programmer') return;

    if (e.key >= '0' && e.key <= '9') {
        activeMode === 'simple' ? appendSimpleNum(e.key) : activeMode === 'scientific' ? appendSciNum(e.key) : appendProgNum(e.key);
    }
    if (e.key === '.') (activeMode === 'simple' ? appendSimpleNum('.') : activeMode === 'scientific' ? appendSciNum('.') : null);
    if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/' || e.key === '%') {
        e.preventDefault();
        activeMode === 'simple' ? appendSimpleOp(e.key) : activeMode === 'scientific' ? appendSciOp(e.key) : appendProgOp(e.key);
    }
    if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        activeMode === 'simple' ? calculateSimple() : activeMode === 'scientific' ? calculateScientific() : calculateProgrammer();
    }
    if (e.key === 'Backspace') {
        e.preventDefault();
        activeMode === 'simple' ? backspaceSimple() : activeMode === 'scientific' ? backspaceScientific() : backspaceProgrammer();
    }
    if (e.key === 'Escape') {
        activeMode === 'simple' ? clearSimple() : activeMode === 'scientific' ? clearScientific() : clearProgrammer();
    }
});

// ==================== PWA: SERVICE WORKER & INSTALLABILITY ====================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((err) => {
            // Expected to fail on file:// or non-HTTPS origins — offline support just won't be
            // available there; the app still works fully online.
            console.log('Service worker not registered (offline support unavailable here):', err.message);
        });
    });
}

let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const btn = document.getElementById('install-app-btn');
    if (btn) btn.style.display = 'block';
});

function installApp() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.finally(() => {
        deferredInstallPrompt = null;
        const btn = document.getElementById('install-app-btn');
        if (btn) btn.style.display = 'none';
    });
}

window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    const btn = document.getElementById('install-app-btn');
    if (btn) btn.style.display = 'none';
});

function updateConnectionStatus() {
    const el = document.getElementById('connection-status');
    if (!el) return;
    if (navigator.onLine) {
        el.textContent = '● Online — everything works, including live currency rates';
        el.style.color = 'var(--success-color)';
    } else {
        el.textContent = '● Offline — everything works except the Currency tab (needs a connection for rates)';
        el.style.color = 'var(--warning-color)';
    }
}

window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

// ==================== INITIALIZATION ====================

document.getElementById('expr-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        evaluateExpressionInput();
    } else if (e.key === 'Escape') {
        clearExpression();
    }
});

window.addEventListener('load', () => {
    loadSettings();
    updateProgrammerDisplay();
    populateUnitSelects();
    populateCurrencySelects();
    convertCurrency();
    renderMatrixGrid('a');
    renderMatrixGrid('b');
    updateConnectionStatus();
});
