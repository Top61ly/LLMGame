/**
 * AI Empire - 游戏核心引擎
 * 基于MMO98的盈利与玩家增长系统
 */

class AIEmpireGame {
    constructor() {
        // ========== 游戏状态 ==========
        this.money = 1000; // 初始资金
        this.totalUsers = 0; // 总用户数
        this.gameTime = 0; // 游戏时间（秒）
        this.deltaTime = 0; // 帧间隔
        this.lastFrameTime = Date.now();

        // ========== 核心参数 ==========
        this.playersGrowthRate = 0.02; // 用户增长率（初始2%）
        this.hypeValue = 1.0; // Hype 口碑值
        this.hypeTarget = 1.0; // Hype 目标值
        this.marketCapacity = 100000; // 市场容量

        this.pricePerCopy = 0.1; // 每用户单价
        this.revenueMultiplier = 1.0; // 收入乘数

        // ========== 系统容量 ==========
        this.systemCapacity = 100; // 系统容量（req/s）
        this.currentLoad = 0; // 当前负载
        this.loadSoftCap = 0.7; // 负载软容量阈值
        this.loadHardCap = 1.0; // 负载硬容量阈值

        // ========== Hype 系统参数 ==========
        this.hypeBase = 1.0;
        this.hypeMinimum = 0.1;
        this.hypeMaximum = 5.0;
        this.hypeChangeSpeed = 0.5; // 每秒
        
        this.hypeLowLoadBonus = 0.3; // 低负载奖励
        this.hypePingLowBonus = 0.2;
        this.hypePingMinorTolerance = 50; // ms
        this.hypePingMajorTolerance = 150; // ms
        this.hypePingMinorImpact = 0.3;
        this.hypePingMajorImpact = 100;
        
        this.hypeBugBonusThreshold = 0.8;
        this.hypeBugMaximumImpact = 1.0;

        // ========== 服务质量指标 ==========
        this.ping = 50; // 延迟（ms）
        this.bugCount = 0; // Bug数量
        this.bugSoftCapacity = 100; // Bug软容量

        // ========== 建筑系统 ==========
        this.buildings = {
            cpu: { count: 0, baseCost: 50, capacity: 10, costFactor: 1.15, name: 'CPU集群' },
            gpu: { count: 0, baseCost: 500, capacity: 100, costFactor: 1.15, name: 'GPU集群' },
            tpu: { count: 0, baseCost: 50000, capacity: 1000, costFactor: 1.15, name: 'TPU阵列', unlocked: false },
            quantum: { count: 0, baseCost: 10000000, capacity: 10000, costFactor: 1.15, name: '量子芯片', unlocked: false },
        };

        // ========== 研究系统 ==========
        this.researches = {
            marketCoverage: { level: 0, maxLevel: 50, baseCost: 10000, factor: 1.5, effect: 0.05, name: '市场覆盖' },
            brandBuilding: { level: 0, maxLevel: 40, baseCost: 15000, factor: 1.5, effect: 0.04, name: '品牌建设' },
            delayOptimization: { level: 0, maxLevel: 25, baseCost: 20000, factor: 1.5, effect: 0.05, name: '延迟优化' },
            capacityOptimization: { level: 0, maxLevel: 25, baseCost: 15000, factor: 1.5, effect: 0.08, name: '容量优化' },
            textQuality: { level: 0, maxLevel: 30, baseCost: 25000, factor: 1.5, effect: 0.1, name: '文本API质量' },
            bugFixing: { level: 0, maxLevel: 20, baseCost: 18000, factor: 1.5, effect: 0.1, name: 'Bug修复' },
        };

        // ========== 产品系统 ==========
        this.products = {
            textAPI: { unlocked: false, developed: false, devCost: 1000000, devTime: 3600, effect: 1.0, name: '文本API' },
            imageAPI: { unlocked: false, developed: false, devCost: 5000000, devTime: 7200, effect: 1.5, name: '图像API' },
            speechAPI: { unlocked: false, developed: false, devCost: 3000000, devTime: 5400, effect: 1.2, name: '语音API' },
        };

        // ========== 计算缓存 ==========
        this.cachedStats = {
            deltaUsersPerSecond: 0,
            profitPerSecond: 0,
            marketResistance: 1.0,
            loadDecay: 1.0,
            loadRate: 0,
            arpu: 0,
        };

        this.initGame();
    }

    initGame() {
        // 检查是否有存档
        const savedGame = localStorage.getItem('aiEmpireGameSave');
        
        const welcomePage = document.getElementById('welcomePage');
        const gamePage = document.getElementById('gamePage');
        const startBtn = document.getElementById('startBtn');
        const newGameBtn = document.getElementById('newGameBtn');

        if (savedGame) {
            // 存在存档，加载存档
            this.loadGame();
            welcomePage.classList.remove('active');
            gamePage.classList.add('active');
            this.initUI();
            this.startGameLoop();
        } else {
            // 没有存档，显示欢迎页面
            gamePage.classList.remove('active');
            welcomePage.classList.add('active');
            
            // 开始游戏按钮
            startBtn.addEventListener('click', () => {
                this.startNewGame();
            });
        }

        // 新游戏按钮
        newGameBtn.addEventListener('click', () => {
            this.resetGame();
        });
    }

    startNewGame() {
        // 保存到存档
        this.saveGame();
        
        // 页面切换
        document.getElementById('welcomePage').classList.remove('active');
        document.getElementById('gamePage').classList.add('active');
        
        // 初始化UI和游戏循环
        this.initUI();
        this.startGameLoop();
    }

    resetGame() {
        if (confirm('确定要开始新游戏吗？这将清除所有进度！')) {
            // 清除存档
            localStorage.removeItem('aiEmpireGameSave');
            
            // 重置游戏状态
            location.reload();
        }
    }

    saveGame() {
        const gameData = {
            money: this.money,
            totalUsers: this.totalUsers,
            gameTime: this.gameTime,
            playersGrowthRate: this.playersGrowthRate,
            hypeValue: this.hypeValue,
            marketCapacity: this.marketCapacity,
            pricePerCopy: this.pricePerCopy,
            revenueMultiplier: this.revenueMultiplier,
            systemCapacity: this.systemCapacity,
            buildings: this.buildings,
            researches: this.researches,
            products: this.products,
        };
        localStorage.setItem('aiEmpireGameSave', JSON.stringify(gameData));
    }

    loadGame() {
        const savedGame = localStorage.getItem('aiEmpireGameSave');
        if (savedGame) {
            const data = JSON.parse(savedGame);
            this.money = data.money;
            this.totalUsers = data.totalUsers;
            this.gameTime = data.gameTime;
            this.playersGrowthRate = data.playersGrowthRate;
            this.hypeValue = data.hypeValue;
            this.marketCapacity = data.marketCapacity;
            this.pricePerCopy = data.pricePerCopy;
            this.revenueMultiplier = data.revenueMultiplier;
            this.systemCapacity = data.systemCapacity;
            this.buildings = data.buildings;
            this.researches = data.researches;
            this.products = data.products;
        }
    }

    // ========== 核心公式 ==========

    /**
     * 计算市场饱和抵抗
     */
    calculateMarketResistance() {
        const ratio = this.totalUsers / this.marketCapacity;
        return 1 / (1 + ratio * ratio);
    }

    /**
     * 计算负载衰减系数（SmoothStep曲线）
     */
    calculateLoadDecay() {
        const loadRate = this.systemCapacity > 0 ? this.currentLoad / this.systemCapacity : 0;

        if (loadRate <= this.loadSoftCap) {
            return 1.0;
        } else if (loadRate < this.loadHardCap) {
            const t = (loadRate - this.loadSoftCap) / (this.loadHardCap - this.loadSoftCap);
            return 1 - t * t * (3 - 2 * t); // SmoothStep
        } else {
            return 0.0;
        }
    }

    /**
     * 计算Hype值的各个影响因子
     */
    calculateHypeFactors() {
        const factors = {
            base: this.hypeBase,
            lowLoadBonus: 0,
            pingImpact: 0,
            bugImpact: 0,
        };

        // 低负载奖励
        const loadRate = this.systemCapacity > 0 ? this.currentLoad / this.systemCapacity : 0;
        if (loadRate < 0.5) {
            factors.lowLoadBonus = this.hypeLowLoadBonus;
        }

        // Ping影响（三阶段）
        if (this.ping <= this.hypePingMinorTolerance) {
            factors.pingImpact = this.hypePingLowBonus * (1 - this.ping / this.hypePingMinorTolerance);
        } else if (this.ping <= this.hypePingMajorTolerance) {
            const t = (this.ping - this.hypePingMinorTolerance) / (this.hypePingMajorTolerance - this.hypePingMinorTolerance);
            factors.pingImpact = -this.hypePingMinorImpact * t;
        } else {
            factors.pingImpact = -this.hypePingMinorImpact - (this.ping - this.hypePingMajorTolerance) / this.hypePingMajorImpact;
        }

        // Bug影响
        const bugThreshold = this.bugSoftCapacity * this.hypeBugBonusThreshold;
        if (this.bugCount > bugThreshold) {
            const overRatio = (this.bugCount - bugThreshold) / this.bugSoftCapacity;
            factors.bugImpact = -Math.min(overRatio, this.hypeBugMaximumImpact);
        }

        return factors;
    }

    /**
     * 计算目标Hype和更新实际Hype
     */
    updateHype() {
        const factors = this.calculateHypeFactors();
        const targetHype = factors.base + factors.lowLoadBonus + factors.pingImpact + factors.bugImpact;

        // 平滑移动到目标值
        const diff = targetHype - this.hypeValue;
        const maxChange = this.hypeChangeSpeed * this.deltaTime;
        
        if (Math.abs(diff) > maxChange) {
            this.hypeValue += Math.sign(diff) * maxChange;
        } else {
            this.hypeValue = targetHype;
        }

        // 限制在范围内
        this.hypeValue = Math.max(this.hypeMinimum, Math.min(this.hypeMaximum, this.hypeValue));
    }

    /**
     * 计算每秒新增用户数
     */
    calculateDeltaUsersPerSecond() {
        const marketResistance = this.calculateMarketResistance();
        const loadDecay = this.calculateLoadDecay();

        // 应用研究升级
        let growthRate = this.playersGrowthRate * (1 + this.researches.marketCoverage.level * this.researches.marketCoverage.effect);

        const deltaUsers = growthRate * this.hypeValue * marketResistance * loadDecay;

        this.cachedStats.deltaUsersPerSecond = deltaUsers;
        this.cachedStats.marketResistance = marketResistance;
        this.cachedStats.loadDecay = loadDecay;
        
        return deltaUsers;
    }

    /**
     * 计算每秒盈利
     */
    calculateProfitPerSecond() {
        const deltaUsers = this.calculateDeltaUsersPerSecond();

        // 应用研究升级
        let revenueMultiplier = this.revenueMultiplier * (1 + this.researches.textQuality.level * this.researches.textQuality.effect);

        const profit = deltaUsers * this.pricePerCopy * revenueMultiplier;

        this.cachedStats.profitPerSecond = profit;
        this.cachedStats.arpu = this.pricePerCopy * revenueMultiplier;

        return profit;
    }

    /**
     * 更新系统状态
     */
    updateSystemState() {
        // 更新负载（基于用户数和活跃度）
        this.currentLoad = Math.max(0, this.calculateDeltaUsersPerSecond());

        // 动态更新Ping（基于负载）
        const loadRate = this.systemCapacity > 0 ? this.currentLoad / this.systemCapacity : 0;
        const basePing = 50;
        this.ping = basePing + loadRate * 200; // 负载越高，延迟越大

        // 动态生成Bug（基于负载）
        if (Math.random() < loadRate * 0.01) { // 负载越高，Bug产生概率越高
            this.bugCount++;
        }

        // 每秒有一定概率修复Bug
        if (Math.random() < 0.05 * (1 + this.researches.bugFixing.level * 0.1)) {
            this.bugCount = Math.max(0, this.bugCount - 1);
        }

        // 缓存负载信息
        this.cachedStats.loadRate = loadRate;
    }

    /**
     * 主更新循环
     */
    update() {
        const now = Date.now();
        this.deltaTime = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;

        // 更新系统状态
        this.updateSystemState();

        // 更新Hype
        this.updateHype();

        // 计算收入并更新资金
        const profit = this.calculateProfitPerSecond() * this.deltaTime;
        this.money += profit;

        // 更新用户数
        const deltaUsers = this.calculateDeltaUsersPerSecond() * this.deltaTime;
        this.totalUsers += deltaUsers;

        // 更新游戏时间
        this.gameTime += this.deltaTime;

        // 检查解锁条件
        this.checkUnlocks();

        // 更新UI
        this.updateUI();

        // 自动保存（每5秒）
        if (Math.floor(this.gameTime) % 5 === 0 && this.deltaTime < 0.1) {
            this.saveGame();
        }
    }

    /**
     * 检查解锁条件
     */
    checkUnlocks() {
        // 建筑解锁
        if (this.buildings.gpu.count >= 50) {
            this.buildings.tpu.unlocked = true;
        }
        if (this.buildings.tpu.count >= 50) {
            this.buildings.quantum.unlocked = true;
        }

        // 产品解锁
        if (this.money >= 1000000) {
            this.products.textAPI.unlocked = true;
            this.products.imageAPI.unlocked = true;
            this.products.speechAPI.unlocked = true;
        }
    }

    // ========== 建筑系统 ==========

    /**
     * 计算建筑成本
     */
    calculateBuildingCost(buildingType) {
        const building = this.buildings[buildingType];
        const cost = building.baseCost * Math.pow(building.costFactor, building.count);
        return cost;
    }

    /**
     * 购买建筑
     */
    buyBuilding(buildingType, count = 1) {
        for (let i = 0; i < count; i++) {
            const cost = this.calculateBuildingCost(buildingType);
            if (this.money >= cost) {
                this.money -= cost;
                this.buildings[buildingType].count++;
                this.updateSystemCapacity();
                this.addLog(`购买 ${this.buildings[buildingType].name} ×1，容量已更新`, 'success');
            } else {
                break;
            }
        }
    }

    /**
     * 更新系统容量
     */
    updateSystemCapacity() {
        let totalCapacity = 0;

        for (const key in this.buildings) {
            const building = this.buildings[key];
            totalCapacity += building.count * building.capacity;
        }

        // 应用容量优化研究
        const capacityBonus = 1 + this.researches.capacityOptimization.level * this.researches.capacityOptimization.effect;
        this.systemCapacity = totalCapacity * capacityBonus;
    }

    // ========== 研究系统 ==========

    /**
     * 计算研究成本
     */
    calculateResearchCost(researchKey) {
        const research = this.researches[researchKey];
        const cost = research.baseCost * Math.pow(research.factor, research.level);
        return cost;
    }

    /**
     * 升级研究
     */
    upgradeResearch(researchKey) {
        const research = this.researches[researchKey];
        if (research.level >= research.maxLevel) {
            this.addLog(`${research.name}已达最高等级`, 'warning');
            return;
        }

        const cost = this.calculateResearchCost(researchKey);
        if (this.money >= cost) {
            this.money -= cost;
            research.level++;

            // 应用研究效果
            if (researchKey === 'brandBuilding') {
                this.hypeBase *= (1 + research.effect);
            } else if (researchKey === 'delayOptimization') {
                // Ping改善通过参数调整
                this.hypePingMinorTolerance += 5;
                this.hypePingMajorTolerance += 10;
            }

            this.updateSystemCapacity();
            this.addLog(`升级 ${research.name} 到 Lv.${research.level}`, 'success');
        } else {
            this.addLog(`资金不足，无法升级 ${research.name}`, 'warning');
        }
    }

    // ========== 产品系统 ==========

    /**
     * 发布产品
     */
    publishProduct(productKey) {
        const product = this.products[productKey];
        if (!product.unlocked) {
            this.addLog(`${product.name} 未解锁`, 'warning');
            return;
        }

        if (product.developed) {
            this.addLog(`${product.name} 已发布`, 'warning');
            return;
        }

        if (this.money >= product.devCost) {
            this.money -= product.devCost;
            product.developed = true;

            // 扩大市场容量
            this.marketCapacity += 50000;

            // 提升收入乘数
            this.revenueMultiplier *= product.effect;

            this.addLog(`发布 ${product.name}！市场容量 +50K，收入乘数 ×${product.effect}`, 'success');
        } else {
            this.addLog(`资金不足，无法开发 ${product.name}`, 'warning');
        }
    }

    // ========== UI系统 ==========

    initUI() {
        this.setupNavigation();
        this.renderBuildings();
        this.renderResearch();
        this.renderProducts();
    }

    setupNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn');
        const pages = document.querySelectorAll('.page');

        navBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                const pageId = `page-${btn.dataset.page}`;

                navBtns.forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');

                pages.forEach((p) => p.classList.remove('active'));
                document.getElementById(pageId).classList.add('active');
            });
        });

        // 默认显示overview
        document.querySelector('[data-page="overview"]').classList.add('active');
        document.getElementById('page-overview').classList.add('active');
    }

    renderBuildings() {
        const container = document.getElementById('buildingsContainer');
        container.innerHTML = '';

        for (const key in this.buildings) {
            const building = this.buildings[key];
            if ((key === 'tpu' || key === 'quantum') && !building.unlocked) {
                continue;
            }

            const cost = this.calculateBuildingCost(key);
            const card = document.createElement('div');
            card.className = 'building-card';
            card.innerHTML = `
                <div class="building-name">${building.name}</div>
                <div class="building-stats">
                    <div data-label="已购买">已购买: ${building.count}</div>
                    <div data-label="容量">容量: ${building.capacity} req/s</div>
                    <div data-label="下一个成本">下一个成本: $${this.formatNumber(cost)}</div>
                    <div data-label="预期收益">预期收益: +$${this.formatNumber(cost / 250)}/s</div>
                </div>
                <button class="build-btn" onclick="game.buyBuilding('${key}')" ${this.money < cost ? 'disabled' : ''}>
                    购买
                </button>
            `;
            container.appendChild(card);
        }
    }

    renderResearch() {
        const container = document.getElementById('researchContainer');
        container.innerHTML = '';

        for (const key in this.researches) {
            const research = this.researches[key];
            const cost = this.calculateResearchCost(key);
            const canUpgrade = research.level < research.maxLevel && this.money >= cost;

            const item = document.createElement('div');
            item.className = 'research-item';
            item.innerHTML = `
                <div class="research-name">${research.name}</div>
                <div class="research-level">Lv.${research.level}/${research.maxLevel}</div>
                <div style="font-size: 11px; color: #888; margin-bottom: 8px;">
                    成本: $${this.formatNumber(cost)}
                </div>
                <button class="research-btn" onclick="game.upgradeResearch('${key}')" 
                    ${!canUpgrade ? 'disabled' : ''}>
                    升级
                </button>
            `;
            container.appendChild(item);
        }
    }

    renderProducts() {
        const container = document.getElementById('productsContainer');
        container.innerHTML = '';

        for (const key in this.products) {
            const product = this.products[key];
            if (!product.unlocked) continue;

            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="building-name">${product.name}</div>
                <div class="building-stats">
                    <div>${product.developed ? '✅ 已发布' : '❌ 未发布'}</div>
                    <div>开发成本: $${this.formatNumber(product.devCost)}</div>
                    <div>收入倍率: ×${product.effect}</div>
                </div>
                <button class="build-btn" onclick="game.publishProduct('${key}')" 
                    ${product.developed || this.money < product.devCost ? 'disabled' : ''}>
                    ${product.developed ? '已发布' : '发布'}
                </button>
            `;
            container.appendChild(card);
        }
    }

    updateUI() {
        // 更新顶部统计
        document.getElementById('money').textContent = `$${this.formatNumber(this.money)}`;
        document.getElementById('profitPerSecond').textContent = `$${this.formatNumber(this.cachedStats.profitPerSecond)}/s`;
        document.getElementById('totalUsers').textContent = this.formatNumber(this.totalUsers);
        document.getElementById('hypeValue').textContent = this.hypeValue.toFixed(2);

        // 更新左侧栏
        document.getElementById('sidebarMoney').textContent = `$${this.formatNumber(this.money)}`;
        document.getElementById('sidebarUsers').textContent = this.formatNumber(this.totalUsers);
        document.getElementById('sidebarProfit').textContent = `$${this.formatNumber(this.cachedStats.profitPerSecond)}/s`;

        // 更新总览页面
        document.getElementById('dashProfit').textContent = `$${this.formatNumber(this.cachedStats.profitPerSecond)}/s`;
        document.getElementById('dashDeltaUsers').textContent = `${this.formatNumber(this.cachedStats.deltaUsersPerSecond)}/s`;
        document.getElementById('dashHype').textContent = this.hypeValue.toFixed(2);

        const factors = this.calculateHypeFactors();
        document.getElementById('hypeBreakdown').textContent = `
            基础: ${factors.base.toFixed(2)} | 
            低负载: +${factors.lowLoadBonus.toFixed(2)} | 
            Ping: ${factors.pingImpact.toFixed(2)} | 
            Bug: ${factors.bugImpact.toFixed(2)}
        `;

        // 更新Hype进度条
        const hypePercent = ((this.hypeValue - this.hypeMinimum) / (this.hypeMaximum - this.hypeMinimum)) * 100;
        document.getElementById('hypeBar').style.width = `${Math.max(0, Math.min(100, hypePercent))}%`;

        document.getElementById('dashCapacity').textContent = `${this.formatNumber(this.systemCapacity)} req/s`;
        const loadRate = this.cachedStats.loadRate * 100;
        document.getElementById('loadBar').style.width = `${Math.min(loadRate, 100)}%`;
        document.getElementById('loadPercentage').textContent = `${loadRate.toFixed(1)}%`;
        document.getElementById('loadDecay').textContent = `${(this.cachedStats.loadDecay * 100).toFixed(0)}%`;

        document.getElementById('dashResistance').textContent = `${(this.cachedStats.marketResistance * 100).toFixed(1)}%`;
        const marketRatio = (this.totalUsers / this.marketCapacity * 100).toFixed(1);
        document.getElementById('marketRatio').textContent = `${marketRatio}%`;
        document.getElementById('saturationBar').style.width = `${Math.min(parseFloat(marketRatio), 100)}%`;

        document.getElementById('dashArpu').textContent = `$${this.cachedStats.arpu.toFixed(4)}`;

        // 更新右侧信息板
        const hours = Math.floor(this.gameTime / 3600);
        const minutes = Math.floor((this.gameTime % 3600) / 60);
        const seconds = Math.floor(this.gameTime % 60);
        document.getElementById('gameTime').textContent = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        document.getElementById('pingValue').textContent = `${this.ping.toFixed(0)}ms`;
        document.getElementById('bugValue').textContent = this.bugCount;
        document.getElementById('loadRateValue').textContent = `${(this.cachedStats.loadRate * 100).toFixed(1)}%`;

        // 更新目标进度
        const targetProfit = 1000;
        const progress = Math.min(this.cachedStats.profitPerSecond / targetProfit * 100, 100);
        document.getElementById('profitGoal').style.width = `${progress}%`;
        document.getElementById('profitGoalText').textContent = `$${this.formatNumber(this.cachedStats.profitPerSecond)}/s / $${this.formatNumber(targetProfit)}`;
    }

    addLog(message, type = 'info') {
        const logBox = document.getElementById('eventLog');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${this.formatTime(this.gameTime)}] ${message}`;
        logBox.appendChild(entry);
        logBox.scrollTop = logBox.scrollHeight;

        // 保持最近30条日志
        const entries = logBox.querySelectorAll('.log-entry');
        if (entries.length > 30) {
            entries[0].remove();
        }
    }

    formatNumber(num) {
        if (num >= 1e15) return (num / 1e15).toFixed(2) + 'Qa';
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return num.toFixed(2);
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${String(s).padStart(2, '0')}`;
    }

    startGameLoop() {
        setInterval(() => {
            this.update();
        }, 1000 / 60); // 60 FPS
    }
}

// 创建全局游戏实例
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new AIEmpireGame();
});
