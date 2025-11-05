// ===========================
// Game State
// ===========================
const gameState = {
    money: 0,
    moneyPerSecond: 0,
    totalProduced: 0,
    currentPillType: 'aspirin',
    pillsPerClick: 1,
    startTime: Date.now(),
    gameMinutes: 0,
    inventory: {},
    orders: [],
    nextOrderId: 1,
    customerTier: 'bronze',
    upgrades: {},
    autoProducers: {},
    autoEmployee: false,
    autoEmployeeEnabled: true,
    orderSpawnInterval: 8000, // ms between order spawns (can be reduced by upgrades)
};

// ===========================
// Pill Type Definitions
// ===========================
const pillTypes = {
    aspirin: { name: 'Aspirin', icon: '💊', color: '#667eea', baseValue: 1 },
    ibuprofen: { name: 'Ibuprofen', icon: '🔴', color: '#ef4444', baseValue: 2 },
    vitamins: { name: 'Vitamins', icon: '🟡', color: '#f59e0b', baseValue: 3 },
    antibiotics: { name: 'Antibiotics', icon: '🟢', color: '#10b981', baseValue: 5 },
    supplements: { name: 'Supplements', icon: '🟣', color: '#8b5cf6', baseValue: 4 },
    painRelief: { name: 'Pain Relief', icon: '🔵', color: '#3b82f6', baseValue: 3 }
};

// Initialize inventory
Object.keys(pillTypes).forEach(type => {
    gameState.inventory[type] = 0;
});

// ===========================
// Upgrade Definitions (Rebalanced)
// ===========================
const upgradeDefinitions = [
    {
        id: 'clickPower1',
        name: '💪 Better Production',
        description: 'Produce +1 pill per click',
        baseCost: 50,
        costMultiplier: 1.15,
        benefit: '+1 per click',
        effect: () => gameState.pillsPerClick += 1,
        type: 'click'
    },
    {
        id: 'clickPower2',
        name: '⚡ Advanced Production',
        description: 'Produce +2 pills per click',
        baseCost: 250,
        costMultiplier: 1.18,
        benefit: '+2 per click',
        effect: () => gameState.pillsPerClick += 2,
        type: 'click'
    },
    {
        id: 'clickPower3',
        name: '🏭 Industrial Production',
        description: 'Produce +5 pills per click',
        baseCost: 1000,
        costMultiplier: 1.2,
        benefit: '+5 per click',
        effect: () => gameState.pillsPerClick += 5,
        type: 'click'
    },
    {
        id: 'intern',
        name: '👤 Pharmacy Intern',
        description: 'Produces 1 pill every 2 seconds',
        baseCost: 100,
        costMultiplier: 1.12,
        benefit: '0.5 pills/sec',
        effect: () => {
            if (!gameState.autoProducers.intern) gameState.autoProducers.intern = 0;
            gameState.autoProducers.intern += 1;
        },
        type: 'auto'
    },
    {
        id: 'assistant',
        name: '👨‍⚕️ Pharmacy Assistant',
        description: 'Produces 1 pill per second',
        baseCost: 500,
        costMultiplier: 1.14,
        benefit: '1 pill/sec',
        effect: () => {
            if (!gameState.autoProducers.assistant) gameState.autoProducers.assistant = 0;
            gameState.autoProducers.assistant += 1;
        },
        type: 'auto'
    },
    {
        id: 'pharmacist',
        name: '� Licensed Pharmacist',
        description: 'Produces 3 pills per second',
        baseCost: 2500,
        costMultiplier: 1.15,
        benefit: '3 pills/sec',
        effect: () => {
            if (!gameState.autoProducers.pharmacist) gameState.autoProducers.pharmacist = 0;
            gameState.autoProducers.pharmacist += 1;
        },
        type: 'auto'
    },
    {
        id: 'seniorPharmacist',
        name: '👔 Senior Pharmacist',
        description: 'Produces 8 pills per second',
        baseCost: 10000,
        costMultiplier: 1.16,
        benefit: '8 pills/sec',
        effect: () => {
            if (!gameState.autoProducers.seniorPharmacist) gameState.autoProducers.seniorPharmacist = 0;
            gameState.autoProducers.seniorPharmacist += 1;
        },
        type: 'auto'
    },
    {
        id: 'manager',
        name: '🎓 Pharmacy Manager',
        description: 'Produces 20 pills per second',
        baseCost: 50000,
        costMultiplier: 1.17,
        benefit: '20 pills/sec',
        effect: () => {
            if (!gameState.autoProducers.manager) gameState.autoProducers.manager = 0;
            gameState.autoProducers.manager += 1;
        },
        type: 'auto'
    },
    {
        id: 'automation1',
        name: '🤖 Pill Counter Machine',
        description: 'Produces 50 pills per second',
        baseCost: 250000,
        costMultiplier: 1.18,
        benefit: '50 pills/sec',
        effect: () => {
            if (!gameState.autoProducers.automation1) gameState.autoProducers.automation1 = 0;
            gameState.autoProducers.automation1 += 1;
        },
        type: 'auto'
    },
    {
        id: 'automation2',
        name: '🏭 Automated Assembly Line',
        description: 'Produces 150 pills per second',
        baseCost: 1000000,
        costMultiplier: 1.19,
        benefit: '150 pills/sec',
        effect: () => {
            if (!gameState.autoProducers.automation2) gameState.autoProducers.automation2 = 0;
            gameState.autoProducers.automation2 += 1;
        },
        type: 'auto'
    },
    {
        id: 'autoEmployee',
        name: '🤖 Auto-Fulfillment Employee',
        description: 'Automatically fulfills orders you have resources for',
        baseCost: 500,
        costMultiplier: 1.25,
        benefit: 'Auto-fulfill orders',
        effect: () => { gameState.autoEmployee = true; gameState.autoEmployeeEnabled = true; },
        type: 'automation',
        oneTime: true
    },
    {
        id: 'customerFlow1',
        name: '📣 Local Promotions',
        description: 'Increase customer arrival rate (reduce spawn interval)',
        baseCost: 2000,
        costMultiplier: 1.5,
        benefit: 'Faster customers',
        effect: () => { gameState.orderSpawnInterval = Math.max(2000, Math.floor(gameState.orderSpawnInterval * 0.8)); },
        type: 'reputation'
    },
    {
        id: 'customerFlow2',
        name: '📢 Regional Promotions',
        description: 'Further increase customer arrival rate',
        baseCost: 25000,
        costMultiplier: 1.6,
        benefit: 'Even faster customers',
        effect: () => { gameState.orderSpawnInterval = Math.max(1000, Math.floor(gameState.orderSpawnInterval * 0.7)); },
        type: 'reputation'
    },
    {
        id: 'reputation1',
        name: '⭐ Local Advertising',
        description: 'Attract Silver tier customers',
        baseCost: 1000,
        costMultiplier: 3,
        benefit: 'Better customers',
        effect: () => {
            if (gameState.customerTier === 'bronze') gameState.customerTier = 'silver';
        },
        type: 'reputation',
        oneTime: true
    },
    {
        id: 'reputation2',
        name: '⭐⭐ Regional Campaign',
        description: 'Attract Gold tier customers',
        baseCost: 50000,
        costMultiplier: 3,
        benefit: 'Premium customers',
        effect: () => {
            if (gameState.customerTier === 'silver') gameState.customerTier = 'gold';
        },
        type: 'reputation',
        oneTime: true
    },
    {
        id: 'reputation3',
        name: '⭐⭐⭐ National Marketing',
        description: 'Attract Platinum tier customers',
        baseCost: 500000,
        costMultiplier: 3,
        benefit: 'Elite customers',
        effect: () => {
            if (gameState.customerTier === 'gold') gameState.customerTier = 'platinum';
        },
        type: 'reputation',
        oneTime: true
    }
];

// Initialize upgrades
upgradeDefinitions.forEach(def => {
    gameState.upgrades[def.id] = {
        level: 0,
        cost: def.baseCost
    };
});

// ===========================
// Customer Tier System
// ===========================
const customerTiers = {
    // itemMultiplier increases how many items the customer requests
    // it also increases how much they pay per item (used in payment calculation)
    bronze: { name: 'Bronze', payMultiplier: 1, itemMultiplier: 1, color: '#cd7f32' },
    silver: { name: 'Silver', payMultiplier: 3, itemMultiplier: 1.5, color: '#c0c0c0' },
    gold: { name: 'Gold', payMultiplier: 5, itemMultiplier: 2, color: '#ffd700' },
    platinum: { name: 'Platinum', payMultiplier: 10, itemMultiplier: 3, color: '#e5e4e2' }
};

// ===========================
// Order System
// ===========================
const customerNames = [
    'John Smith', 'Emma Johnson', 'Michael Brown', 'Sarah Davis',
    'James Wilson', 'Emily Taylor', 'Robert Anderson', 'Jessica Martinez',
    'David Thomas', 'Ashley Garcia', 'Christopher Lee', 'Amanda White',
    'Daniel Harris', 'Melissa Clark', 'Matthew Lewis', 'Jennifer Walker',
    'William Moore', 'Olivia Martin', 'Joseph Jackson', 'Sophia Thompson'
];

function generateOrder() {
    const tier = customerTiers[gameState.customerTier];
    const numItems = Math.min(1 + Math.floor(Math.random() * 3), 3); // 1-3 items
    const items = [];
    
    // Select random pill types for this order
    const availablePillTypes = Object.keys(pillTypes);
    for (let i = 0; i < numItems; i++) {
        const pillType = availablePillTypes[Math.floor(Math.random() * availablePillTypes.length)];
        // base quantity 1-10, then scale by tier.itemMultiplier so higher tiers ask for more
        const baseQty = Math.ceil(1 + Math.random() * 9); // 1-10 pills
        const quantity = Math.max(1, Math.ceil(baseQty * (tier.itemMultiplier || 1)));
        items.push({ type: pillType, quantity });
    }

    // Calculate total payment based on items and tier.
    // We scale payment per item by tier.itemMultiplier as well so higher tiers pay more per pill.
    const basePayment = items.reduce((sum, item) => {
        return sum + (pillTypes[item.type].baseValue * item.quantity);
    }, 0);

    const payment = Math.floor(basePayment * (tier.payMultiplier || 1) * (tier.itemMultiplier || 1) * (0.8 + Math.random() * 0.4));
    
    const order = {
        id: gameState.nextOrderId++,
        customer: customerNames[Math.floor(Math.random() * customerNames.length)],
        items: items,
    payment: payment,
    tier: gameState.customerTier,
    countdown: 30, // seconds until customer leaves (live countdown)
    createdAt: Date.now()
    };
    
    gameState.orders.push(order);
    renderOrders();
}

function canFulfillOrder(order) {
    return order.items.every(item => gameState.inventory[item.type] >= item.quantity);
}

function fulfillOrder(orderId) {
    const order = gameState.orders.find(o => o.id === orderId);
    if (!order || !canFulfillOrder(order)) return;
    
    // Deduct pills from inventory
    order.items.forEach(item => {
        gameState.inventory[item.type] -= item.quantity;
    });
    
    // Add money
    gameState.money += order.payment;
    
    // Remove order
    gameState.orders = gameState.orders.filter(o => o.id !== orderId);
    
    // Show success notification
    showNotification(`+$${order.payment}`, '#10b981');
    
    renderPillButtons();
    updateDisplay();
    renderOrders();
}

    function autoFulfillOrders() {
        if (!gameState.autoEmployee || !gameState.autoEmployeeEnabled) return;
        gameState.orders.forEach(order => {
            if (canFulfillOrder(order)) {
                fulfillOrder(order.id);
            }
        });
    }

    function updateOrderCountdowns(deltaTime) {
        gameState.orders.forEach(order => {
            order.countdown -= deltaTime / 1000;
        });
        // Update countdown bars/text live without full re-render
        gameState.orders.forEach(order => {
            const prog = document.getElementById(`order-progress-${order.id}`);
            if (prog) {
                const pct = Math.max(0, order.countdown) / 30 * 100;
                prog.style.width = pct + '%';
            }
            const txt = document.getElementById(`order-countdown-text-${order.id}`);
            if (txt) {
                txt.textContent = `${Math.ceil(Math.max(0, order.countdown))}s left`;
            }
        });
        // Remove orders where countdown <= 0
        const leavingOrders = gameState.orders.filter(order => order.countdown <= 0);
        if (leavingOrders.length > 0) {
            leavingOrders.forEach(order => {
                showNotification(`${order.customer} left!`, '#ef4444');
            });
            gameState.orders = gameState.orders.filter(order => order.countdown > 0);
            renderOrders();
        }
    }

// ===========================
// Click System
// ===========================
function handleClick(event) {
    const button = document.getElementById('clickerButton');
    
    // Add pills to inventory
    gameState.inventory[gameState.currentPillType] += gameState.pillsPerClick;
    gameState.totalProduced += gameState.pillsPerClick;
    
    // Visual feedback
    button.classList.add('clicking');
    setTimeout(() => button.classList.remove('clicking'), 200);
    
    // Show floating number at cursor position
    showClickEffect(event, gameState.pillsPerClick);
    
    updateDisplay();
    renderPillButtons();
}

function showClickEffect(event, value) {
    const effect = document.createElement('div');
    effect.className = 'click-effect';
    const pill = pillTypes[gameState.currentPillType];
    effect.textContent = `+${value} ${pill.icon}`;
    effect.style.color = pill.color;
    
    // Position at exact cursor location
    effect.style.left = event.clientX + 'px';
    effect.style.top = event.clientY + 'px';
    
    document.getElementById('clickEffects').appendChild(effect);
    
    setTimeout(() => effect.remove(), 1200);
}

function showNotification(message, color = '#667eea') {
    const effect = document.createElement('div');
    effect.className = 'click-effect';
    effect.textContent = message;
    effect.style.left = '50%';
    effect.style.top = '20%';
    effect.style.fontSize = '2.5rem';
    effect.style.color = color;
    effect.style.transform = 'translateX(-50%)';
    
    document.getElementById('clickEffects').appendChild(effect);
    setTimeout(() => effect.remove(), 1500);
}

function selectPillType(type) {
    if (gameState.currentPillType === type) return; // Already selected
    
    gameState.currentPillType = type;
    document.getElementById('currentPillName').textContent = pillTypes[type].name;
    document.getElementById('clickerIcon').textContent = pillTypes[type].icon;
    
    // Update button states using data attributes (no full re-render)
    document.querySelectorAll('.pill-select-button').forEach(button => {
        const btnType = button.getAttribute('data-pill-type');
        if (btnType === type) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

function renderPillButtons() {
    const container = document.getElementById('pillButtons');
    
    container.innerHTML = Object.entries(pillTypes).map(([type, pill]) => `
        <button class="pill-select-button ${gameState.currentPillType === type ? 'active' : ''}" 
                data-pill-type="${type}">
            <div class="pill-button-icon">${pill.icon}</div>
            <div class="pill-button-name">${pill.name}</div>
            <div class="pill-button-count">${Math.floor(gameState.inventory[type])}</div>
        </button>
    `).join('');

    // Attach click listeners to make switching immediate
    container.querySelectorAll('.pill-select-button').forEach(btn => {
        btn.removeEventListener && btn.removeEventListener('click', () => {});
        btn.addEventListener('click', () => {
            const t = btn.getAttribute('data-pill-type');
            if (t) selectPillType(t);
        });
    });
}

// ===========================
// Upgrade System
// ===========================
function purchaseUpgrade(upgradeId) {
    const upgrade = gameState.upgrades[upgradeId];
    const def = upgradeDefinitions.find(u => u.id === upgradeId);
    
    if (!upgrade || !def || gameState.money < upgrade.cost) return;
    
    // Check if one-time upgrade already purchased
    if (def.oneTime && upgrade.level > 0) return;
    
    gameState.money -= upgrade.cost;
    upgrade.level++;
    
    if (!def.oneTime) {
        upgrade.cost = Math.floor(def.baseCost * Math.pow(def.costMultiplier, upgrade.level));
    }
    
    // Apply effect
    def.effect();
    
    updateDisplay();
    renderUpgrades();
    // Re-render orders so any new UI (like auto-fulfillment toggle) appears immediately
    renderOrders();
}

// ===========================
// Auto Production System
// ===========================
function calculateAutoProduction() {
    let pillsPerSecond = 0;
    
    if (gameState.autoProducers.intern) pillsPerSecond += gameState.autoProducers.intern * 0.5;
    if (gameState.autoProducers.assistant) pillsPerSecond += gameState.autoProducers.assistant * 1;
    if (gameState.autoProducers.pharmacist) pillsPerSecond += gameState.autoProducers.pharmacist * 3;
    if (gameState.autoProducers.seniorPharmacist) pillsPerSecond += gameState.autoProducers.seniorPharmacist * 8;
    if (gameState.autoProducers.manager) pillsPerSecond += gameState.autoProducers.manager * 20;
    if (gameState.autoProducers.automation1) pillsPerSecond += gameState.autoProducers.automation1 * 50;
    if (gameState.autoProducers.automation2) pillsPerSecond += gameState.autoProducers.automation2 * 150;
    
    return pillsPerSecond;
}

function autoProducePills(deltaTime) {
    const pillsPerSecond = calculateAutoProduction();
    if (pillsPerSecond === 0) return;
    
    const pillsToAdd = (pillsPerSecond * deltaTime) / 1000;
    // Add produced pills to the currently selected pill type (more intuitive)
    const selected = gameState.currentPillType || Object.keys(pillTypes)[0];
    gameState.inventory[selected] += pillsToAdd;
    
    gameState.totalProduced += pillsToAdd;
}

// ===========================
// Time System
// ===========================
function updateGameTime() {
    // 1 real minute = 60 game minutes (1 hour)
    const realSecondsElapsed = (Date.now() - gameState.startTime) / 1000;
    gameState.gameMinutes = Math.floor(realSecondsElapsed);
    
    const totalGameMinutes = gameState.gameMinutes;
    const hours = (Math.floor(totalGameMinutes / 60) % 24) + 8; // Start at 8 AM
    const minutes = totalGameMinutes % 60;
    const days = Math.floor((totalGameMinutes + 480) / (60 * 24)) + 1; // Offset for 8 AM start
    
    // Format time
    const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    const period = hours >= 12 ? 'PM' : 'AM';
    const timeString = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    
    document.getElementById('gameTime').textContent = timeString;
    document.getElementById('gameDay').textContent = days;
}

// ===========================
// Render Functions
// ===========================
function renderPillButtons() {
    const container = document.getElementById('pillButtons');
    
    container.innerHTML = Object.entries(pillTypes).map(([type, pill]) => `
        <button class="pill-select-button ${gameState.currentPillType === type ? 'active' : ''}" 
                data-pill-type="${type}">
            <div class="pill-button-icon">${pill.icon}</div>
            <div class="pill-button-name">${pill.name}</div>
            <div class="pill-button-count">${Math.floor(gameState.inventory[type])}</div>
        </button>
    `).join('');

    // Attach fast click handlers to buttons to ensure immediate responsiveness
    container.querySelectorAll('.pill-select-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const t = btn.getAttribute('data-pill-type');
            if (t) selectPillType(t);
        });
    });
}

function renderOrders() {
    const container = document.getElementById('ordersContainer');
    if (!container) {
        console.error('Orders container not found!');
        return;
    }
    let autoToggleHtml = '';
    if (gameState.autoEmployee) {
        const btnClass = gameState.autoEmployeeEnabled ? 'auto-toggle-button enabled' : 'auto-toggle-button';
        const btnLabel = gameState.autoEmployeeEnabled ? 'Disable Auto-Fulfillment' : 'Enable Auto-Fulfillment';
        autoToggleHtml = `<button id="autoEmployeeToggle" class="${btnClass}">${btnLabel}</button>`;
    }
    try {
        if (gameState.orders.length === 0) {
            container.innerHTML = autoToggleHtml + '<p style="text-align: center; color: #666; padding: 2rem;">No orders yet. Keep producing pills!</p>';
            return;
        }
        container.innerHTML = autoToggleHtml + gameState.orders.map(order => {
            const canFulfill = canFulfillOrder(order);
            const countdownPercent = Math.max(0, order.countdown) / 30 * 100;
            return `
                <div class="order-card ${!canFulfill ? 'disabled' : ''}" 
                     onclick="${canFulfill ? `fulfillOrder(${order.id})` : ''}" data-order-id="${order.id}">
                    <div class="order-header">
                        <span class="order-customer">👤 ${order.customer}</span>
                        <span class="order-tier ${order.tier}">${customerTiers[order.tier].name}</span>
                    </div>
                    <div class="order-items">
                        ${order.items.map(item => {
                            const pill = pillTypes[item.type];
                            const hasEnough = gameState.inventory[item.type] >= item.quantity;
                            return `
                                <div class="order-item">
                                    <span class="order-item-name">${pill.icon} ${pill.name}</span>
                                    <span class="order-item-quantity" style="color: ${hasEnough ? '#10b981' : '#ef4444'}">
                                        ${Math.floor(gameState.inventory[item.type])}/${item.quantity}
                                    </span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="order-footer">
                        <span class="order-reward">💰 $${order.payment}</span>
                        ${canFulfill ? '<span class="order-button">Fulfill</span>' : '<span style="color: #ef4444; font-weight: 600;">Need more pills</span>'}
                        <div class="order-countdown-bar" style="height:6px;background:#eee;margin-top:6px;position:relative;width:100%;border-radius:3px;">
                            <div id="order-progress-${order.id}" style="height:100%;background:#3b82f6;width:${countdownPercent}%;transition:width 0.2s;border-radius:3px;"></div>
                        </div>
                        <span id="order-countdown-text-${order.id}" style="font-size:12px;color:#666;">${Math.ceil(order.countdown)}s left</span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Error rendering orders:', e);
        container.innerHTML = '<p style="color: red; padding: 1rem;">Error loading orders</p>';
    }
    // Event handler hookup is done once during initialization via event delegation
}

function renderUpgrades() {
    const container = document.getElementById('upgradesContainer');
    if (!container) {
        console.error('Upgrades container not found!');
        return;
    }
    
    try {
        container.innerHTML = upgradeDefinitions.map(def => {
            const upgrade = gameState.upgrades[def.id];
            if (!upgrade) return '';
            const canAfford = gameState.money >= upgrade.cost;
            const isPurchased = def.oneTime && upgrade.level > 0;
            return `
                <div class="upgrade-card ${!canAfford || isPurchased ? 'disabled' : ''}" 
                     onclick="${!isPurchased ? `purchaseUpgrade('${def.id}')` : ''}">
                    <div class="upgrade-header">
                        <span class="upgrade-name">${def.name}</span>
                        <span class="upgrade-level">${isPurchased ? '✓' : `Lv ${upgrade.level}`}</span>
                    </div>
                    <div class="upgrade-description">${def.description}</div>
                    <div class="upgrade-footer">
                        <span class="upgrade-cost">${isPurchased ? 'PURCHASED' : `$${upgrade.cost.toLocaleString()}`}</span>
                        <span class="upgrade-benefit">${def.benefit}</span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Error rendering upgrades:', e);
        container.innerHTML = '<p style="color: red; padding: 1rem;">Error loading upgrades</p>';
    }
}

function formatMoney(amount) {
    if (amount >= 1000000) {
        return '$' + (amount / 1000000).toFixed(2) + 'M';
    } else if (amount >= 1000) {
        return '$' + (amount / 1000).toFixed(2) + 'K';
    }
    return '$' + Math.floor(amount).toLocaleString();
}

function updateDisplay() {
    document.getElementById('money').textContent = formatMoney(gameState.money);
    
    const pillsPerSecond = calculateAutoProduction();
    const moneyPerSecond = pillsPerSecond * 0.5; // Rough estimate
    document.getElementById('moneyPerSecond').textContent = moneyPerSecond >= 1 ? formatMoney(moneyPerSecond) : '$0.00';
    
    document.getElementById('perClick').textContent = gameState.pillsPerClick;
    document.getElementById('totalClicks').textContent = Math.floor(gameState.totalProduced);
    
    // Update pill inventory in header
    Object.entries(pillTypes).forEach(([type, pill]) => {
        const element = document.getElementById(`pillInventory-${type}`);
        if (element) {
            element.textContent = `${pill.icon} ${Math.floor(gameState.inventory[type])}`;
        }
    });
    
    // Update pill buttons (less frequently)
    renderPillButtons();
}

// ===========================
// Auto-save System
// ===========================
function saveGame() {
    const saveData = {
        ...gameState,
        saveTime: Date.now()
    };
    localStorage.setItem('pharmacyClickerSave', JSON.stringify(saveData));
}

function loadGame() {
    const saved = localStorage.getItem('pharmacyClickerSave');
    if (saved) {
        try {
            const loadedState = JSON.parse(saved);
            
            // Preserve startTime for time calculation - don't reload it
            const originalStartTime = gameState.startTime;
            
            // Calculate offline progress
            const offlineTime = Date.now() - (loadedState.saveTime || Date.now());
            
            // Only load compatible data
            Object.assign(gameState, loadedState);
            
            // ALWAYS keep the original game session start time
            gameState.startTime = originalStartTime;
            
            // Ensure upgrades are properly initialized
            upgradeDefinitions.forEach(def => {
                if (!gameState.upgrades[def.id]) {
                    gameState.upgrades[def.id] = {
                        level: 0,
                        cost: def.baseCost
                    };
                }
            });
            
            // Calculate offline production and earnings (capped at 1 hour)
            if (offlineTime > 0 && offlineTime < 3600000) {
                const cappedOfflineTime = Math.min(offlineTime, 3600000);
                
                // Pills produced while offline (normal calculation)
                autoProducePills(cappedOfflineTime);
                
                // Earnings while offline (100x less than if you were clicking)
                // Estimate: only auto-clickers generate revenue, at 1/100th efficiency
                const pillsPerSecond = calculateAutoProduction();
                const offlineSeconds = cappedOfflineTime / 1000;
                const offlineMoneyPerSecond = (pillsPerSecond * 0.5) / 100; // 100x less
                const offlineEarnings = offlineMoneyPerSecond * offlineSeconds;
                gameState.money += offlineEarnings;
                
                console.log(`Offline for ${(offlineTime / 60000).toFixed(1)} minutes. Earned: $${offlineEarnings.toFixed(2)}`);
            }
            
            console.log('Game loaded from save');
        } catch (e) {
            console.error('Error loading game:', e);
            // Clear corrupted save
            localStorage.removeItem('pharmacyClickerSave');
            // Reset to default state
            gameState.pillsPerClick = 1;
        }
    } else {
        console.log('Starting fresh game');
    }
}

// ===========================
// Game Loop
// ===========================
let lastUpdate = Date.now();
let renderCounter = 0;
let lastOrderCount = 0;
let lastUpgradeState = {};
let orderGenerationTimer = null;

function scheduleOrderGeneration() {
    if (orderGenerationTimer) clearTimeout(orderGenerationTimer);
    orderGenerationTimer = setTimeout(() => {
        if (gameState.orders.length < 6) {
            generateOrder();
            renderOrders();
        }
        // schedule next using current interval (allows upgrades to change it)
        scheduleOrderGeneration();
    }, gameState.orderSpawnInterval);
}

function gameLoop() {
    const now = Date.now();
    const deltaTime = now - lastUpdate;
    lastUpdate = now;
    
    // Auto-produce pills
    autoProducePills(deltaTime);
    // Auto-fulfill orders and update countdowns frequently
    autoFulfillOrders();
    updateOrderCountdowns(deltaTime);
    
    updateDisplay();
    updateGameTime();
    
    // Only re-render orders and upgrades when state changes (every second at most)
    renderCounter++;
    if (renderCounter >= 10) {
        renderCounter = 0;
        
        // Only re-render if order count changed
        if (gameState.orders.length !== lastOrderCount) {
            lastOrderCount = gameState.orders.length;
            renderOrders();
        }
        
        // Only re-render upgrades if money changed significantly
        const moneyKey = Math.floor(gameState.money / 10);
        if (!lastUpgradeState.money || lastUpgradeState.money !== moneyKey) {
            lastUpgradeState.money = moneyKey;
            renderUpgrades();
        }
    }
}

// ===========================
// Initialization
// ===========================

// Allow resetting the game from console
window.resetGame = function() {
    localStorage.removeItem('pharmacyClickerSave');
    location.reload();
};

function init() {
    console.log('Starting initialization...');
    loadGame();
    console.log('Game loaded. Current state:', gameState);
    
    // Event listeners
    document.getElementById('clickerButton').addEventListener('click', handleClick);
    // Delegate auto-fulfillment toggle clicks so the button works immediately without relying on a re-render hookup
    const ordersContainer = document.getElementById('ordersContainer');
    if (ordersContainer) {
        ordersContainer.addEventListener('click', (e) => {
            const btn = e.target.closest && e.target.closest('#autoEmployeeToggle');
            if (btn) {
                gameState.autoEmployeeEnabled = !gameState.autoEmployeeEnabled;
                btn.textContent = gameState.autoEmployeeEnabled ? 'Disable Auto-Fulfillment' : 'Enable Auto-Fulfillment';
                if (gameState.autoEmployeeEnabled) btn.classList.add('enabled'); else btn.classList.remove('enabled');
                renderOrders();
            }
        });
    }
    
    // Initial render
    console.log('Rendering pill buttons...');
    selectPillType('aspirin');
    renderPillButtons();
    console.log('Updating display...');
    updateDisplay();
    console.log('Rendering orders and upgrades...');
    renderOrders();
    renderUpgrades();
    
    // Generate initial orders
    console.log('Generating initial orders...');
    for (let i = 0; i < 3; i++) {
        generateOrder();
    }
    
    // Initial render after orders are generated
    renderOrders();
    console.log('Final state:', gameState);
    
    // Game loop - 10 times per second for smooth updates
    setInterval(gameLoop, 100);
    
    // Generate new orders periodically (uses schedule so upgrades can change interval)
    scheduleOrderGeneration();
    
    // Auto-save every 15 seconds
    setInterval(saveGame, 15000);
    
    console.log('🏥 Pharmacy Clicker v2.0 initialized!');
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}