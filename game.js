// 游戏状态
const game = {
    money: 100,
    compute: 0,
    users: 0,
    data: 0,
    
    moneyRate: 0,
    computeRate: 0,
    dataRate: 0,
    userGrowth: 0,
    
    level: 1,
    exp: 0,
    expToNextLevel: 100,
    
    totalClicks: 0,
    clickPower: 1,
    clickMultiplier: 1,
    
    prestigeCount: 0,
    startTime: Date.now(),
    
    buildings: {
        cpu: {
            count: 0,
            baseCost: 50,
            baseProduction: 1,
            costMultiplier: 1.15,
            productionType: 'compute'
        },
        gpu: {
            count: 0,
            baseCost: 500,
            baseProduction: 10,
            costMultiplier: 1.15,
            productionType: 'compute'
        },
        tpu: {
            count: 0,
            baseCost: 50000,
            baseProduction: 500,
            costMultiplier: 1.15,
            productionType: 'compute',
            unlockRequirement: { building: 'gpu', count: 50 }
        },
        engineer: {
            count: 0,
            baseCost: 5000,
            baseProduction: 50,
            costMultiplier: 1.2,
            productionType: 'money'
        }
    },
    
    upgrades: {},
    achievements: []
};

// 初始化游戏
function init() {
    loadGame();
    updateUI();
    startGameLoop();
    
    // 键盘事件
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            manualTrain();
        }
    });
}

// 主游戏循环
function startGameLoop() {
    setInterval(() => {
        // 生产资源
        produceResources();
        
        // 更新UI
        updateUI();
        
        // 自动保存（每30秒）
        if (Math.floor(Date.now() / 1000) % 30 === 0) {
            saveGame();
        }
    }, 1000);
    
    // 更快的UI更新（数字动画）
    setInterval(() => {
        updateRates();
    }, 100);
}

// 手动训练
function manualTrain() {
    const value = game.clickPower * game.clickMultiplier;
    game.compute += value;
    game.totalClicks++;
    
    // 增加经验
    addExp(Math.floor(value / 10));
    
    // 显示浮动数字
    showFloatingNumber(value, event);
    
    // 按钮动画
    const clickZone = document.getElementById('clickZone');
    clickZone.style.transform = 'scale(0.95)';
    setTimeout(() => {
        clickZone.style.transform = 'scale(1)';
    }, 100);
    
    updateUI();
}

// 购买建筑
function buyBuilding(type, amount) {
    const building = game.buildings[type];
    let totalCost = 0;
    let canBuy = 0;
    
    // 计算总成本
    for (let i = 0; i < amount; i++) {
        const cost = calculateBuildingCost(type, building.count + canBuy);
        if (game.money >= totalCost + cost) {
            totalCost += cost;
            canBuy++;
        } else {
            break;
        }
    }
    
    if (canBuy > 0) {
        game.money -= totalCost;
        building.count += canBuy;
        
        // 日志
        addEvent(`购买了 ${canBuy} 个${getBuildingName(type)}`, 'success');
        
        // 检查解锁
        checkUnlocks();
        
        updateUI();
    }
}

// 购买最大数量
function buyBuildingMax(type) {
    const building = game.buildings[type];
    let totalCost = 0;
    let canBuy = 0;
    
    // 计算能买多少
    while (canBuy < 1000) { // 限制最大1000个
        const cost = calculateBuildingCost(type, building.count + canBuy);
        if (game.money >= totalCost + cost) {
            totalCost += cost;
            canBuy++;
        } else {
            break;
        }
    }
    
    if (canBuy > 0) {
        game.money -= totalCost;
        building.count += canBuy;
        
        addEvent(`一次性购买了 ${canBuy} 个${getBuildingName(type)}！`, 'success');
        checkUnlocks();
        updateUI();
    }
}

// 计算建筑成本
function calculateBuildingCost(type, count) {
    const building = game.buildings[type];
    return Math.floor(building.baseCost * Math.pow(building.costMultiplier, count));
}

// 计算建筑产出
function calculateBuildingProduction(type) {
    const building = game.buildings[type];
    if (building.count === 0) return 0;
    
    let production = building.baseProduction * building.count;
    
    // 里程碑加成（每25个×2）
    const milestones = Math.floor(building.count / 25);
    production *= Math.pow(2, milestones);
    
    // 工程师加成（如果是算力建筑）
    if (building.productionType === 'compute' && game.buildings.engineer) {
        const engineerBonus = 1 + (game.buildings.engineer.count * 0.005);
        production *= engineerBonus;
    }
    
    return production;
}

// 生产资源
function produceResources() {
    // 算力转金钱（简单版：1算力=0.1美元/s）
    game.money += game.computeRate * 0.1;
    
    // 金钱生产
    game.money += game.moneyRate;
    
    // 算力生产
    game.compute += game.computeRate;
    
    // 数据生产（基于算力）
    game.data += game.computeRate * 0.0001;
    
    // 用户增长（基于金钱投入）
    if (game.moneyRate > 0) {
        game.users += game.users * (game.userGrowth / 100 / 3600);
    }
}

// 更新生产速率
function updateRates() {
    game.computeRate = 0;
    game.moneyRate = 0;
    
    // 计算所有建筑产出
    for (const [type, building] of Object.entries(game.buildings)) {
        const production = calculateBuildingProduction(type);
        
        if (building.productionType === 'compute') {
            game.computeRate += production;
        } else if (building.productionType === 'money') {
            game.moneyRate += production;
        }
    }
    
    // 用户增长率
    game.userGrowth = Math.min(100, game.moneyRate / 1000);
}

// 增加经验
function addExp(amount) {
    game.exp += amount;
    
    while (game.exp >= game.expToNextLevel) {
        game.exp -= game.expToNextLevel;
        game.level++;
        game.expToNextLevel = Math.floor(100 * Math.pow(1.5, game.level - 1));
        game.clickMultiplier = 1 + (game.level - 1) * 0.5;
        
        addEvent(`🎉 升级到 Lv.${game.level}！点击倍率提升！`, 'success');
    }
}

// 检查解锁
function checkUnlocks() {
    // 解锁TPU
    if (game.buildings.gpu.count >= 50) {
        const tpuCard = document.getElementById('building-tpu');
        if (tpuCard.classList.contains('locked')) {
            tpuCard.classList.remove('locked');
            tpuCard.innerHTML = createBuildingCard('tpu');
            addEvent('🎉 解锁了TPU阵列！', 'success');
        }
    }
}

// 更新UI
function updateUI() {
    // 顶部资源
    document.getElementById('money').textContent = formatNumber(game.money);
    document.getElementById('moneyRate').textContent = formatNumber(game.moneyRate);
    document.getElementById('compute').textContent = formatNumber(game.compute);
    document.getElementById('computeRate').textContent = formatNumber(game.computeRate);
    document.getElementById('users').textContent = formatNumber(game.users);
    document.getElementById('userGrowth').textContent = game.userGrowth.toFixed(1);
    document.getElementById('data').textContent = game.data.toFixed(1);
    document.getElementById('dataRate').textContent = formatNumber(game.dataRate);
    
    // 等级和经验
    document.getElementById('level').textContent = game.level;
    document.getElementById('expFill').style.width = (game.exp / game.expToNextLevel * 100) + '%';
    document.getElementById('expText').textContent = Math.floor(game.exp / game.expToNextLevel * 100) + '%';
    
    // 点击价值
    document.getElementById('clickValue').textContent = '+' + formatNumber(game.clickPower * game.clickMultiplier);
    document.getElementById('clickMultiplier').textContent = formatNumber(game.clickMultiplier);
    
    // 统计面板
    document.getElementById('statCompute').textContent = formatNumber(game.computeRate) + ' ⚡';
    document.getElementById('statMoney').textContent = '$' + formatNumber(game.moneyRate);
    document.getElementById('totalClicks').textContent = formatNumber(game.totalClicks);
    document.getElementById('prestigeCount').textContent = game.prestigeCount;
    
    // 游戏时长
    const playTimeMinutes = Math.floor((Date.now() - game.startTime) / 60000);
    document.getElementById('playTime').textContent = playTimeMinutes + 'm';
    
    // 更新建筑卡片
    updateBuildingUI('cpu');
    updateBuildingUI('gpu');
    updateBuildingUI('engineer');
    
    // 任务进度
    document.getElementById('moneyObjective').textContent = '$' + formatNumber(game.money) + ' / $10,000';
    
    // 成就进度
    updateAchievementProgress('ach1', game.money, 100000);
    updateAchievementProgress('ach2', game.computeRate, 1000);
}

// 更新建筑UI
function updateBuildingUI(type) {
    const building = game.buildings[type];
    
    // 数量和产出
    const countEl = document.getElementById(`${type}-count`);
    const productionEl = document.getElementById(`${type}-production`);
    
    if (countEl) countEl.textContent = formatNumber(building.count);
    if (productionEl) {
        const production = calculateBuildingProduction(type);
        productionEl.textContent = formatNumber(production);
    }
    
    // 成本
    const costEl = document.getElementById(`${type}-cost`);
    if (costEl) {
        const cost = calculateBuildingCost(type, building.count);
        costEl.textContent = formatNumber(cost);
    }
    
    // ROI
    const roiEl = document.getElementById(`${type}-roi`);
    if (roiEl) {
        const cost = calculateBuildingCost(type, building.count);
        const production = building.baseProduction * 0.1; // 假设算力转金钱
        const roi = cost / production;
        roiEl.textContent = roi > 1000 ? '∞' : roi.toFixed(1) + 's';
    }
    
    // 里程碑进度
    const milestoneFill = document.getElementById(`${type}-milestone-fill`);
    const milestoneText = document.getElementById(`${type}-milestone-text`);
    
    if (milestoneFill && milestoneText) {
        const progress = building.count % 25;
        const nextMilestone = Math.floor(building.count / 25) * 25 + 25;
        milestoneFill.style.width = (progress / 25 * 100) + '%';
        milestoneText.textContent = `${building.count}/${nextMilestone}`;
    }
    
    // 按钮状态
    updateBuildingButtons(type);
}

// 更新建筑按钮状态
function updateBuildingButtons(type) {
    const building = game.buildings[type];
    const cost = calculateBuildingCost(type, building.count);
    const canAfford = game.money >= cost;
    
    // 这里可以添加禁用逻辑
}

// 创建建筑卡片HTML（用于动态解锁）
function createBuildingCard(type) {
    const building = game.buildings[type];
    const name = getBuildingName(type);
    const icon = getBuildingIcon(type);
    
    return `
        <div class="building-header">
            <div class="building-name">
                <span class="building-icon">${icon}</span>
                <span>${name}</span>
            </div>
            <div class="building-stats">
                <span class="building-count">👁️ <span id="${type}-count">0</span></span>
                <span class="building-production">📈 <span id="${type}-production">0</span>/s</span>
            </div>
        </div>
        <div class="building-info">
            <div>成本: $<span id="${type}-cost">${building.baseCost}</span></div>
            <div>回本: <span id="${type}-roi">∞</span></div>
        </div>
        <div class="building-actions">
            <button class="btn-buy" onclick="buyBuilding('${type}', 1)">买 1</button>
            <button class="btn-buy" onclick="buyBuilding('${type}', 10)">买 10</button>
            <button class="btn-buy-max" onclick="buyBuildingMax('${type}')">买到MAX</button>
        </div>
        <div class="building-milestone">
            <div class="milestone-bar">
                <div class="milestone-fill" id="${type}-milestone-fill"></div>
            </div>
            <div class="milestone-text">
                <span id="${type}-milestone-text">0/25</span>
                <span>→ 产出 ×2</span>
            </div>
        </div>
    `;
}

// 获取建筑名称
function getBuildingName(type) {
    const names = {
        cpu: 'CPU集群',
        gpu: 'GPU服务器',
        tpu: 'TPU阵列',
        engineer: '初级工程师'
    };
    return names[type] || type;
}

// 获取建筑图标
function getBuildingIcon(type) {
    const icons = {
        cpu: '🖥️',
        gpu: '🎮',
        tpu: '⚙️',
        engineer: '👨‍💻'
    };
    return icons[type] || '📦';
}

// 更新成就进度
function updateAchievementProgress(id, current, target) {
    const fillEl = document.getElementById(`${id}-fill`);
    const textEl = document.getElementById(`${id}-text`);
    
    if (fillEl && textEl) {
        const progress = Math.min(100, current / target * 100);
        fillEl.style.width = progress + '%';
        textEl.textContent = formatNumber(current) + ' / ' + formatNumber(target);
    }
}

// 切换标签页
function switchTab(tabName) {
    // 更新导航按钮
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // 更新内容面板
    document.querySelectorAll('.content-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
}

// 添加事件日志
function addEvent(text, type = 'info') {
    const eventLog = document.getElementById('eventLog');
    const eventItem = document.createElement('div');
    eventItem.className = `event-item ${type}`;
    
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + 
                 now.getMinutes().toString().padStart(2, '0');
    
    eventItem.innerHTML = `
        <div class="event-time">${time}</div>
        <div class="event-text">${text}</div>
    `;
    
    eventLog.insertBefore(eventItem, eventLog.firstChild);
    
    // 限制日志数量
    while (eventLog.children.length > 10) {
        eventLog.removeChild(eventLog.lastChild);
    }
}

// 显示浮动数字
function showFloatingNumber(value, event) {
    const container = document.getElementById('floatingNumbers');
    const floatingNum = document.createElement('div');
    floatingNum.className = 'floating-number';
    floatingNum.textContent = '+' + formatNumber(value);
    
    // 使用事件坐标
    const x = event ? event.clientX : window.innerWidth / 2;
    const y = event ? event.clientY : window.innerHeight / 2;
    
    floatingNum.style.left = x + 'px';
    floatingNum.style.top = y + 'px';
    
    container.appendChild(floatingNum);
    
    // 1秒后移除
    setTimeout(() => {
        container.removeChild(floatingNum);
    }, 1000);
}

// 格式化数字
function formatNumber(num) {
    if (num < 1000) return Math.floor(num).toString();
    if (num < 1000000) return (num / 1000).toFixed(2) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(2) + 'M';
    if (num < 1000000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num < 1e15) return (num / 1e12).toFixed(2) + 'T';
    if (num < 1e18) return (num / 1e15).toFixed(2) + 'Qa';
    if (num < 1e21) return (num / 1e18).toFixed(2) + 'Qi';
    return num.toExponential(2);
}

// 保存游戏
function saveGame() {
    localStorage.setItem('llmGameSave', JSON.stringify(game));
    addEvent('游戏已自动保存', 'info');
}

// 加载游戏
function loadGame() {
    const saved = localStorage.getItem('llmGameSave');
    if (saved) {
        const savedGame = JSON.parse(saved);
        Object.assign(game, savedGame);
        addEvent('读取存档成功！', 'success');
    }
}

// 重置游戏
function resetGame() {
    if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
        localStorage.removeItem('llmGameSave');
        location.reload();
    }
}

// 页面加载完成后初始化
window.addEventListener('load', init);
