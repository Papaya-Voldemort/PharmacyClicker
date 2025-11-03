// ==================== GAME STATE ====================
const gameState = {
    // Currency
    dayMoney: 0,
    nightMoney: 0,
    totalEarned: 0,
    
    // Time system (24 hours = 1 real hour, so each game hour = 150 seconds)
    gameTime: 6 * 60, // Start at 6 AM (in minutes)
    dayCount: 1,
    isNightMode: false,
    
    // Click mechanics
    clickValue: 1,
    perSecond: 0,
    
    // Upgrades
    dayUpgrades: [],
    nightUpgrades: [],
    
    // Inventory (for night mode)
    inventory: {},
    
    // Market prices (regenerated each night)
    marketPrices: {},
    
    // Statistics
    totalClicks: 0,
    lastSaveTime: Date.now()
};

// ==================== GAME DATA ====================

// Day Mode Upgrades
const DAY_UPGRADES = [
    {
        id: 'assistant',
        name: '💼 Pharmacy Assistant',
        baseCost: 100,
        description: 'Helps serve customers automatically',
        baseProduction: 1,
        owned: 0
    },
    {
        id: 'equipment',
        name: '⚗️ Better Equipment',
        baseCost: 500,
        description: 'Doubles your click value',
        multiplier: 2,
        owned: 0
    },
    {
        id: 'loyalty',
        name: '💳 Loyalty Card System',
        baseCost: 1000,
        description: 'Regular customers provide steady income',
        baseProduction: 5,
        owned: 0
    },
    {
        id: 'insurance',
        name: '🏥 Premium Insurance',
        baseCost: 5000,
        description: 'Triples passive income',
        multiplier: 3,
        owned: 0
    },
    {
        id: 'advertising',
        name: '📺 TV Advertising',
        baseCost: 15000,
        description: 'Attracts more customers',
        baseProduction: 25,
        owned: 0
    },
    {
        id: 'chain',
        name: '🏢 Chain Expansion',
        baseCost: 50000,
        description: 'Open multiple locations',
        baseProduction: 100,
        owned: 0
    }
];

// Night Mode Upgrades
const NIGHT_UPGRADES = [
    {
        id: 'contacts',
        name: '📱 Secret Contacts',
        baseCost: 500,
        description: 'Unlock market intel and better prices',
        owned: 0
    },
    {
        id: 'encryption',
        name: '🔐 Encryption Software',
        baseCost: 2000,
        description: 'Unlock 2 more products',
        owned: 0
    },
    {
        id: 'distribution',
        name: '🚚 Distribution Network',
        baseCost: 10000,
        description: 'Sell in bulk for 50% bonus',
        multiplier: 1.5,
        owned: 0
    },
    {
        id: 'lab',
        name: '🧪 Underground Lab',
        baseCost: 25000,
        description: 'Produce your own inventory',
        baseProduction: 10,
        owned: 0
    }
];

// Black Market Products (Educational Satire - All Fictional)
const MARKET_PRODUCTS = [
    { id: 'giggle', name: '😂 Giggle Dust', icon: '✨', basePrice: 10 },
    { id: 'zoom', name: '⚡ Zoom Zoom Pills', icon: '💊', basePrice: 15 },
    { id: 'chill', name: '😌 Chill-axative', icon: '🍃', basePrice: 12 },
    { id: 'brain', name: '🧠 Brain Sprinkles', icon: '🌟', basePrice: 20 },
    { id: 'rainbow', name: '🌈 Rainbow Puffs', icon: '☁️', basePrice: 18 },
    { id: 'snooze', name: '😴 Snooze Snacks', icon: '🌙', basePrice: 8 },
    { id: 'focus', name: '🎯 Focus Fizz', icon: '💫', basePrice: 25 } // Unlocked later
];

// ==================== INITIALIZATION ====================

// Initialize upgrades with owned count
DAY_UPGRADES.forEach(upgrade => gameState.dayUpgrades.push({...upgrade}));
NIGHT_UPGRADES.forEach(upgrade => gameState.nightUpgrades.push({...upgrade}));
MARKET_PRODUCTS.forEach(product => gameState.inventory[product.id] = 0);

// ==================== DOM ELEMENTS ====================
const elements = {
    gameTitle: document.getElementById('game-title'),
    gameTime: document.getElementById('game-time'),
    dayCounter: document.getElementById('day-counter'),
    timeProgress: document.getElementById('time-progress'),
    
    dayMoney: document.getElementById('day-money'),
    nightMoney: document.getElementById('night-money'),
    totalMoney: document.getElementById('total-money'),
    
    clickValue: document.getElementById('click-value'),
    perSecond: document.getElementById('per-second'),
    totalEarned: document.getElementById('total-earned'),
    
    clickButton: document.getElementById('click-button'),
    clickText: document.getElementById('click-text'),
    clickIcon: document.getElementById('click-icon'),
    clickFeedback: document.getElementById('click-feedback'),
    
    dayUpgradeList: document.getElementById('day-upgrade-list'),
    nightUpgradeList: document.getElementById('night-upgrade-list'),
    dayUpgradesGroup: document.getElementById('day-upgrades'),
    nightUpgradesGroup: document.getElementById('night-upgrades'),
    
    marketPanel: document.getElementById('market-panel'),
    marketList: document.getElementById('market-list'),
    
    inventoryPanel: document.getElementById('inventory-panel'),
    inventoryList: document.getElementById('inventory-list'),
    
    saveButton: document.getElementById('save-button'),
    resetButton: document.getElementById('reset-button'),
    saveIndicator: document.getElementById('save-indicator')
};

// ==================== UTILITY FUNCTIONS ====================

function formatMoney(amount) {
    if (amount >= 1000000) {
        return '$' + (amount / 1000000).toFixed(2) + 'M';
    } else if (amount >= 1000) {
        return '$' + (amount / 1000).toFixed(1) + 'K';
    }
    return '$' + Math.floor(amount);
}

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = Math.floor(minutes % 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${mins.toString().padStart(2, '0')} ${period}`;
}

function calculateUpgradeCost(upgrade) {
    return Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.owned));
}

function getTotalMoney() {
    return gameState.dayMoney + gameState.nightMoney;
}

function canAfford(cost, useNightMoney = false) {
    if (useNightMoney) {
        return gameState.nightMoney >= cost;
    }
    return gameState.dayMoney >= cost;
}

function spendMoney(cost, useNightMoney = false) {
    if (useNightMoney) {
        gameState.nightMoney -= cost;
    } else {
        gameState.dayMoney -= cost;
    }
    updateDisplay();
}

// ==================== CLICK MECHANICS ====================

function handleClick(event) {
    const earned = gameState.clickValue;
    
    if (gameState.isNightMode) {
        // In night mode, clicking produces inventory items randomly
        const availableProducts = getAvailableProducts();
        const randomProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
        gameState.inventory[randomProduct.id] += 1;
        showClickFeedback(randomProduct.icon, event);
        updateInventoryDisplay();
    } else {
        // In day mode, clicking earns money
        gameState.dayMoney += earned;
        gameState.totalEarned += earned;
        showClickFeedback('+' + formatMoney(earned), event);
    }
    
    gameState.totalClicks++;
    updateDisplay();
    
    // Particle effect
    createParticle(event.clientX, event.clientY);
}

function showClickFeedback(text, event) {
    const popup = document.createElement('div');
    popup.className = 'click-popup';
    popup.textContent = text;
    
    const rect = elements.clickButton.getBoundingClientRect();
    popup.style.left = (event.clientX - rect.left) + 'px';
    popup.style.top = (event.clientY - rect.top) + 'px';
    
    elements.clickFeedback.appendChild(popup);
    
    setTimeout(() => popup.remove(), 1000);
}

function createParticle(x, y) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.textContent = gameState.isNightMode ? '💸' : '💊';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.fontSize = (Math.random() * 20 + 20) + 'px';
    
    document.getElementById('particles-container').appendChild(particle);
    
    setTimeout(() => particle.remove(), 2000);
}

// ==================== PASSIVE INCOME ====================

function calculatePerSecond() {
    let total = 0;
    
    gameState.dayUpgrades.forEach(upgrade => {
        if (upgrade.baseProduction && upgrade.owned > 0) {
            total += upgrade.baseProduction * upgrade.owned;
        }
    });
    
    // Apply multipliers
    gameState.dayUpgrades.forEach(upgrade => {
        if (upgrade.multiplier && upgrade.owned > 0) {
            total *= upgrade.multiplier;
        }
    });
    
    return total;
}

function applyPassiveIncome() {
    if (!gameState.isNightMode) {
        const income = gameState.perSecond;
        gameState.dayMoney += income;
        gameState.totalEarned += income;
        updateDisplay();
    } else {
        // In night mode, lab produces inventory
        const labUpgrade = gameState.nightUpgrades.find(u => u.id === 'lab');
        if (labUpgrade && labUpgrade.owned > 0) {
            const availableProducts = getAvailableProducts();
            const randomProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
            gameState.inventory[randomProduct.id] += labUpgrade.baseProduction * labUpgrade.owned;
            updateInventoryDisplay();
        }
    }
}

// ==================== UPGRADES ====================

function buyUpgrade(upgradeId, isNightUpgrade = false) {
    const upgradeList = isNightUpgrade ? gameState.nightUpgrades : gameState.dayUpgrades;
    const upgrade = upgradeList.find(u => u.id === upgradeId);
    
    if (!upgrade) return;
    
    const cost = calculateUpgradeCost(upgrade);
    const useNightMoney = isNightUpgrade;
    
    if (canAfford(cost, useNightMoney)) {
        spendMoney(cost, useNightMoney);
        upgrade.owned++;
        
        // Recalculate stats
        gameState.clickValue = calculateClickValue();
        gameState.perSecond = calculatePerSecond();
        
        updateDisplay();
        renderUpgrades();
    }
}

function calculateClickValue() {
    let value = 1;
    
    // Apply click multipliers from upgrades
    gameState.dayUpgrades.forEach(upgrade => {
        if (upgrade.id === 'equipment' && upgrade.owned > 0) {
            value *= Math.pow(upgrade.multiplier, upgrade.owned);
        }
    });
    
    return value;
}

function renderUpgrades() {
    // Render day upgrades
    elements.dayUpgradeList.innerHTML = '';
    gameState.dayUpgrades.forEach(upgrade => {
        const cost = calculateUpgradeCost(upgrade);
        const canBuy = canAfford(cost, false);
        
        const div = document.createElement('div');
        div.className = 'upgrade-item' + (canBuy ? '' : ' locked');
        div.innerHTML = `
            <div class="upgrade-header">
                <span class="upgrade-name">${upgrade.name}</span>
                <span class="upgrade-cost">${formatMoney(cost)}</span>
            </div>
            <div class="upgrade-description">${upgrade.description}</div>
            <div class="upgrade-owned">Owned: ${upgrade.owned}</div>
        `;
        
        if (canBuy) {
            div.onclick = () => buyUpgrade(upgrade.id, false);
        }
        
        elements.dayUpgradeList.appendChild(div);
    });
    
    // Render night upgrades
    elements.nightUpgradeList.innerHTML = '';
    gameState.nightUpgrades.forEach(upgrade => {
        const cost = calculateUpgradeCost(upgrade);
        const canBuy = canAfford(cost, true);
        
        const div = document.createElement('div');
        div.className = 'upgrade-item' + (canBuy ? '' : ' locked');
        div.innerHTML = `
            <div class="upgrade-header">
                <span class="upgrade-name">${upgrade.name}</span>
                <span class="upgrade-cost">${formatMoney(cost)}</span>
            </div>
            <div class="upgrade-description">${upgrade.description}</div>
            <div class="upgrade-owned">Owned: ${upgrade.owned}</div>
        `;
        
        if (canBuy) {
            div.onclick = () => buyUpgrade(upgrade.id, true);
        }
        
        elements.nightUpgradeList.appendChild(div);
    });
}

// ==================== TIME SYSTEM ====================

function updateTime() {
    // Increment game time (1 real hour = 24 game hours = 1440 game minutes)
    // So 1 second = 1440/3600 = 0.4 game minutes
    gameState.gameTime += 0.4;
    
    // Check for new day
    if (gameState.gameTime >= 24 * 60) {
        gameState.gameTime = 0;
        gameState.dayCount++;
    }
    
    // Check for day/night transition
    const currentHour = Math.floor(gameState.gameTime / 60);
    const shouldBeNight = currentHour >= 20 || currentHour < 6;
    
    if (shouldBeNight !== gameState.isNightMode) {
        transitionMode(shouldBeNight);
    }
    
    // Update time display
    elements.gameTime.textContent = formatTime(gameState.gameTime);
    elements.dayCounter.textContent = `Day ${gameState.dayCount}`;
    
    // Update progress bar
    const progress = (gameState.gameTime / (24 * 60)) * 100;
    elements.timeProgress.style.width = progress + '%';
}

function transitionMode(toNightMode) {
    gameState.isNightMode = toNightMode;
    
    // Add transition animation
    document.getElementById('game-container').classList.add('mode-transition');
    setTimeout(() => {
        document.getElementById('game-container').classList.remove('mode-transition');
    }, 1000);
    
    // Update body class
    if (toNightMode) {
        document.body.classList.remove('day-mode');
        document.body.classList.add('night-mode');
        
        // Update UI elements for night mode
        elements.gameTitle.textContent = '🌙 The Underground';
        document.querySelector('.subtitle').textContent = 'Shh... business after dark';
        elements.clickText.textContent = 'Craft Product';
        elements.clickIcon.textContent = '💊';
        
        // Show night-specific panels
        elements.marketPanel.style.display = 'block';
        elements.inventoryPanel.style.display = 'block';
        elements.nightUpgradesGroup.style.display = 'block';
        elements.dayUpgradesGroup.style.display = 'none';
        
        // Generate new market prices
        generateMarketPrices();
        updateMarketDisplay();
        updateInventoryDisplay();
    } else {
        document.body.classList.remove('night-mode');
        document.body.classList.add('day-mode');
        
        // Update UI elements for day mode
        elements.gameTitle.textContent = '☀️ Sunny Side Pharmacy';
        document.querySelector('.subtitle').textContent = 'Your friendly neighborhood pharmacy!';
        elements.clickText.textContent = 'Fill Prescription';
        elements.clickIcon.textContent = '💊';
        
        // Hide night-specific panels
        elements.marketPanel.style.display = 'none';
        elements.inventoryPanel.style.display = 'none';
        elements.nightUpgradesGroup.style.display = 'none';
        elements.dayUpgradesGroup.style.display = 'block';
    }
    
    renderUpgrades();
}

// ==================== MARKET SYSTEM ====================

function getAvailableProducts() {
    const encryptionUpgrade = gameState.nightUpgrades.find(u => u.id === 'encryption');
    const unlocked = encryptionUpgrade ? encryptionUpgrade.owned : 0;
    
    // Start with 5 products, unlock 2 more with encryption
    const maxProducts = Math.min(5 + (unlocked * 2), MARKET_PRODUCTS.length);
    return MARKET_PRODUCTS.slice(0, maxProducts);
}

function generateMarketPrices() {
    const availableProducts = getAvailableProducts();
    
    availableProducts.forEach(product => {
        // Random demand: high (2x), normal (1x), or low (0.5x)
        const demandRoll = Math.random();
        let demandMultiplier;
        let demandLevel;
        
        if (demandRoll < 0.2) {
            demandMultiplier = 2;
            demandLevel = 'high';
        } else if (demandRoll < 0.8) {
            demandMultiplier = 1;
            demandLevel = 'normal';
        } else {
            demandMultiplier = 0.5;
            demandLevel = 'low';
        }
        
        // Add some randomness to price
        const randomFactor = 0.8 + Math.random() * 0.4;
        
        gameState.marketPrices[product.id] = {
            price: Math.floor(product.basePrice * demandMultiplier * randomFactor),
            demand: demandLevel,
            demandMultiplier
        };
    });
}

function updateMarketDisplay() {
    if (!gameState.isNightMode) return;
    
    const availableProducts = getAvailableProducts();
    elements.marketList.innerHTML = '';
    
    availableProducts.forEach(product => {
        const market = gameState.marketPrices[product.id];
        if (!market) return;
        
        const div = document.createElement('div');
        div.className = 'market-item';
        
        let demandClass = 'demand-normal';
        let demandText = '→ Normal';
        if (market.demand === 'high') {
            demandClass = 'demand-high';
            demandText = '↑ High';
        } else if (market.demand === 'low') {
            demandClass = 'demand-low';
            demandText = '↓ Low';
        }
        
        div.innerHTML = `
            <div class="market-header">
                <span class="market-drug-name">${product.icon} ${product.name}</span>
                <span class="market-demand ${demandClass}">${demandText}</span>
            </div>
            <div class="market-price">Selling at: ${formatMoney(market.price)} each</div>
        `;
        
        elements.marketList.appendChild(div);
    });
}

function updateInventoryDisplay() {
    if (!gameState.isNightMode) return;
    
    const availableProducts = getAvailableProducts();
    elements.inventoryList.innerHTML = '';
    
    availableProducts.forEach(product => {
        const quantity = gameState.inventory[product.id] || 0;
        
        const div = document.createElement('div');
        div.className = 'inventory-item';
        div.innerHTML = `
            <span>${product.icon} ${product.name}: ${quantity}</span>
            <div class="inventory-actions">
                <button class="inventory-btn" onclick="sellProduct('${product.id}', 1)" ${quantity < 1 ? 'disabled' : ''}>Sell 1</button>
                <button class="inventory-btn" onclick="sellProduct('${product.id}', 10)" ${quantity < 10 ? 'disabled' : ''}>Sell 10</button>
                <button class="inventory-btn" onclick="sellProduct('${product.id}', 'all')" ${quantity < 1 ? 'disabled' : ''}>Sell All</button>
            </div>
        `;
        
        elements.inventoryList.appendChild(div);
    });
}

function sellProduct(productId, amount) {
    const quantity = gameState.inventory[productId] || 0;
    const market = gameState.marketPrices[productId];
    
    if (!market || quantity < 1) return;
    
    let sellAmount;
    if (amount === 'all') {
        sellAmount = quantity;
    } else {
        sellAmount = Math.min(amount, quantity);
    }
    
    // Calculate earnings with potential bulk bonus
    let totalEarnings = market.price * sellAmount;
    
    const distributionUpgrade = gameState.nightUpgrades.find(u => u.id === 'distribution');
    if (distributionUpgrade && distributionUpgrade.owned > 0 && sellAmount >= 10) {
        totalEarnings *= distributionUpgrade.multiplier;
    }
    
    gameState.inventory[productId] -= sellAmount;
    gameState.nightMoney += totalEarnings;
    gameState.totalEarned += totalEarnings;
    
    updateDisplay();
    updateInventoryDisplay();
}

// Make sellProduct global so it can be called from HTML
window.sellProduct = sellProduct;

// ==================== DISPLAY UPDATES ====================

function updateDisplay() {
    elements.dayMoney.textContent = formatMoney(gameState.dayMoney);
    elements.nightMoney.textContent = formatMoney(gameState.nightMoney);
    elements.totalMoney.textContent = formatMoney(getTotalMoney());
    
    elements.clickValue.textContent = formatMoney(gameState.clickValue);
    elements.perSecond.textContent = formatMoney(gameState.perSecond) + '/s';
    elements.totalEarned.textContent = formatMoney(gameState.totalEarned);
}

// ==================== SAVE/LOAD ====================

function saveGame() {
    const saveData = {
        ...gameState,
        saveTime: Date.now()
    };
    
    localStorage.setItem('pharmacyClickerSave', JSON.stringify(saveData));
    
    elements.saveIndicator.textContent = '✓ Game saved!';
    setTimeout(() => {
        elements.saveIndicator.textContent = '';
    }, 2000);
}

function loadGame() {
    const saveData = localStorage.getItem('pharmacyClickerSave');
    
    if (saveData) {
        const loaded = JSON.parse(saveData);
        
        // Restore state
        Object.assign(gameState, loaded);
        
        // Calculate offline progress
        const timePassed = (Date.now() - loaded.saveTime) / 1000; // in seconds
        const offlineEarnings = gameState.perSecond * Math.min(timePassed, 3600); // Max 1 hour
        
        if (offlineEarnings > 0) {
            gameState.dayMoney += offlineEarnings;
            gameState.totalEarned += offlineEarnings;
            alert(`Welcome back! You earned ${formatMoney(offlineEarnings)} while away!`);
        }
        
        // Set mode based on loaded time
        const currentHour = Math.floor(gameState.gameTime / 60);
        const shouldBeNight = currentHour >= 20 || currentHour < 6;
        
        if (shouldBeNight) {
            document.body.classList.add('night-mode');
            gameState.isNightMode = true;
        } else {
            document.body.classList.add('day-mode');
            gameState.isNightMode = false;
        }
        
        updateDisplay();
        renderUpgrades();
        
        if (gameState.isNightMode) {
            generateMarketPrices();
            updateMarketDisplay();
            updateInventoryDisplay();
            elements.marketPanel.style.display = 'block';
            elements.inventoryPanel.style.display = 'block';
        }
    } else {
        // New game
        document.body.classList.add('day-mode');
    }
}

function resetGame() {
    if (confirm('Are you sure you want to reset? All progress will be lost!')) {
        localStorage.removeItem('pharmacyClickerSave');
        location.reload();
    }
}

// ==================== EVENT LISTENERS ====================

elements.clickButton.addEventListener('click', handleClick);
elements.saveButton.addEventListener('click', saveGame);
elements.resetButton.addEventListener('click', resetGame);

// ==================== GAME LOOP ====================

function gameLoop() {
    updateTime();
    applyPassiveIncome();
    renderUpgrades();
}

// Auto-save every 30 seconds
setInterval(saveGame, 30000);

// Main game loop - runs every second
setInterval(gameLoop, 1000);

// ==================== START GAME ====================

loadGame();
updateDisplay();
renderUpgrades();
