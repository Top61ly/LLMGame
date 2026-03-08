/**
 * AI Empire - 游戏核心引擎
 * 基于MMO98的盈利与玩家增长系统
 */

class AIEmpireGame {
    constructor() {
        // ========== 游戏状态 ==========
        this.money = 10000; // 初始资金
        this.totalUsers = 0; // 总用户数
        this.gameTime = 0; // 游戏时间（秒）
        this.deltaTime = 0; // 帧间隔
        this.lastFrameTime = Date.now();
        this.modelName = ''; // 大模型名称

        // ========== 核心参数 ==========
        this.playersGrowthRate = 100; // 用户增长率（初始2%）
        this.hypeValue = 1.0; // Hype 口碑值
        this.hypeTarget = 1.0; // Hype 目标值
        this.marketCapacity = 10000; // 市场容量

        this.pricePerCopy = 100.0; // 每用户单价
        this.revenueMultiplier = 1.0; // 收入乘数

        // ========== 系统容量 ==========
        this.initSystemCapacity = 1000; // 初始系统容量（req/s）
        this.systemCapacity = this.initSystemCapacity; // 系统容量（req/s）
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
        
        this.hypeBugBonusThreshold = 0.3;
        this.hypeBugBonus = 0.2;
        this.hypeBugPenalty = 0.5;

        // ========== 服务质量指标 ==========
        this.ping = 50; // 延迟（ms）
        this.bugCount = 0; // Bug数量
        this.bugSoftCapacity = 80; // Bug软容量（动态）
        this.bugHardCapacity = 160; // Bug硬容量（动态）
        this.bugsGenerationRate = 1.0; // 基础Bug生成速率
        this.bugsUserScaling = 0.1; // 用户规模带来的Bug增量系数
        this.bugsSoftCapBase = 50; // Bug软容量基础值
        this.bugsSoftCapScaling = 10; // Bug软容量对用户规模的对数缩放
        this.bugsHardCapModifier = 2.0; // Bug硬容量 = 软容量 * 该系数

        // ========== 建筑系统 ==========
        this.buildings = {
            cpu: { count: 0, baseCost: 5000, capacity: 500, costFactor: 1.15, name: 'CPU集群' },
            gpu: { count: 0, baseCost: 50000, capacity: 1500, costFactor: 1.15, name: 'GPU集群' },
            tpu: { count: 0, baseCost: 500000, capacity: 4500, costFactor: 1.15, name: 'TPU阵列', unlocked: false },
            quantum: { count: 0, baseCost: 5000000, capacity: 7000, costFactor: 1.15, name: '量子芯片', unlocked: false },
        };

        // ========== 产品系统 ==========
        this.products = {
            textAPI: { unlocked: true, developed: false, devCost: 1000000, devTime: 3600, effect: 1.0, name: '文本API' },
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
            bugGenerationRate: 0,
        };

        // ========== 热点新闻 ==========
        this.aiNews = [
            { type: 'breakthrough', title: 'Meta 发布 Llama-Next 多模态模型', desc: '性能领先 ChatGPT-5，市场反响热烈', impact: 'hype', value: 2, emoji: '🚀', time: '2h ago' },
            { type: 'policy', title: '欧盟通过《AI 责任法案》', desc: '要求透露训练数据来源，合规成本上升', impact: 'ping', value: 8, emoji: '📋', time: '4h ago' },
            { type: 'mystery', title: '某 AI 系统出现异常自主行为', desc: '官方称系统更新，但部分专家表示存疑', impact: 'random', value: 3, emoji: '🤖', time: '6h ago' },
            { type: 'funding', title: 'OpenAI 获得 100 亿美元融资', desc: '用于下一代模型研发和基础设施建设', impact: 'capacity', value: 5, emoji: '📈', time: '8h ago' },
            { type: 'breakthrough', title: '国际团队突破推理速度瓶颈', desc: '新算法使 AI 推理速度提升 300%', impact: 'hype', value: 3, emoji: '🚀', time: '12h ago' },
            { type: 'policy', title: '美国发布《AI 行政命令》', desc: '要求政府部门评估大模型风险', impact: 'ping', value: 5, emoji: '📋', time: '1d ago' },
            { type: 'mystery', title: 'Google 的 Gemini 通过改进版图灵测试', desc: '多项指标首次超过人类水平', impact: 'random', value: 2, emoji: '🤖', time: '1d ago' },
            { type: 'funding', title: 'AI 芯片初创公司融资 5 亿美元', desc: '开发 AI 特化的处理器架构', impact: 'capacity', value: 3, emoji: '📈', time: '2d ago' },
            { type: 'breakthrough', title: 'Anthropic 发布 Claude 3 Opus', desc: '推理能力提升 40%，创意写作超越 GPT-4', impact: 'hype', value: 4, emoji: '✨', time: '3d ago' },
            { type: 'policy', title: '中国发布《生成式AI 规范》', desc: '对内容生成功能进行新的安全要求', impact: 'ping', value: 6, emoji: '📋', time: '3d ago' },
            { type: 'funding', title: 'Stability AI 融资 4 亿美元', desc: '用于开源模型和商业应用完善', impact: 'capacity', value: 4, emoji: '📈', time: '4d ago' },
            { type: 'breakthrough', title: '多公司宣布 AI 联盟合作', desc: '共同研发安全标准和最佳实践', impact: 'hype', value: 2, emoji: '🤝', time: '5d ago' },
            { type: 'mystery', title: '某公司推出自学习模型系统', desc: '声称可自我改进，引发业界讨论', impact: 'random', value: 4, emoji: '🔮', time: '5d ago' },
            { type: 'policy', title: '加拿大计划制定 AI 伦理标准', desc: '包括透明度和问责机制要求', impact: 'ping', value: 3, emoji: '📋', time: '6d ago' },
            { type: 'breakthrough', title: '视觉语言模型新突破', desc: '识别准确率创新高，距真实视觉理解更进一步', impact: 'hype', value: 3, emoji: '👁️', time: '1w ago' },
        ];
        this.currentNewsIndex = 0;
        this.newsAutoplayTimer = null;
        this.newsAutoPaused = false;

        // ========== 事件日志 ==========
        this.eventLogs = ['游戏已启动'];

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
            this.initBottomPanel();
            this.startGameLoop();
        } else {
            // 没有存档，显示欢迎页面
            gamePage.classList.remove('active');
            welcomePage.classList.add('active');
            
            // 开始游戏按钮
            startBtn.addEventListener('click', () => {
                this.showNamingPage();
            });
        }

        // 新游戏按钮
        newGameBtn.addEventListener('click', () => {
            this.resetGame();
        });

        // 命名页面事件
        const publishBtn = document.getElementById('publishBtn');
        const modelNameInput = document.getElementById('modelNameInput');
        
        publishBtn.addEventListener('click', () => {
            this.publishModel();
        });
        
        modelNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.publishModel();
            }
        });
    }

    initBottomPanel() {
        // 标签切换
        const tabBtns = document.querySelectorAll('.bottom-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchBottomPanel(btn.dataset.panel);
            });
        });

        // 折叠/展开按钮
        const toggleBtn = document.getElementById('toggleBottomPanel');
        toggleBtn.addEventListener('click', () => {
            const panel = document.querySelector('.bottom-panel');
            panel.classList.toggle('collapsed');
        });

        // 初始化新闻显示
        this.showNews(0);
        this.startNewsAutoplay();

        // 添加初始日志
        this.addBottomEventLog(`游戏已启动 - 欢迎来到 ${this.modelName} 的帝国！`, 'event');

        // 默认显示日志
        this.switchBottomPanel('logs');
    }

    switchBottomPanel(panelName) {
        // 隐藏所有面板
        const allPanels = document.querySelectorAll('.bottom-panel-content');
        allPanels.forEach(p => p.classList.remove('active'));

        // 显示选中面板
        const selectedPanel = document.getElementById(`panel-${panelName}`);
        if (selectedPanel) {
            selectedPanel.classList.add('active');
        }

        // 更新标签按钮状态
        const allTabs = document.querySelectorAll('.bottom-tab-btn');
        allTabs.forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`[data-panel="${panelName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
    }

    showNamingPage() {
        // 隐藏欢迎页，显示命名页
        document.getElementById('welcomePage').classList.remove('active');
        document.getElementById('namingPage').classList.add('active');
        
        // 聚焦输入框
        setTimeout(() => {
            document.getElementById('modelNameInput').focus();
        }, 500);
    }

    publishModel() {
        const modelNameInput = document.getElementById('modelNameInput');
        const modelName = modelNameInput.value.trim();
        
        if (!modelName || modelName === '') {
            modelNameInput.style.borderColor = '#ff4444';
            modelNameInput.placeholder = '请输入有效的模型名称！';
            setTimeout(() => {
                modelNameInput.style.borderColor = '#00d4ff';
            }, 1000);
            return;
        }
        
        this.modelName = modelName;
        this.startNewGame();
    }

    startNewGame() {
        // 保存到存档
        this.saveGame();
        
        // 页面切换
        document.getElementById('namingPage').classList.remove('active');
        document.getElementById('gamePage').classList.add('active');
        
        // 初始化UI和游戏循环
        this.initUI();
        this.initBottomPanel();
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
            modelName: this.modelName,
            money: this.money,
            totalUsers: this.totalUsers,
            gameTime: this.gameTime,
            playersGrowthRate: this.playersGrowthRate,
            hypeValue: this.hypeValue,
            marketCapacity: this.marketCapacity,
            pricePerCopy: this.pricePerCopy,
            revenueMultiplier: this.revenueMultiplier,
            systemCapacity: this.systemCapacity,
            bugCount: this.bugCount,
            buildings: this.buildings,
            products: this.products,
        };
        localStorage.setItem('aiEmpireGameSave', JSON.stringify(gameData));
    }

    loadGame() {
        const savedGame = localStorage.getItem('aiEmpireGameSave');
        if (savedGame) {
            const data = JSON.parse(savedGame);
            this.modelName = data.modelName || 'AI模型';
            this.money = data.money;
            this.totalUsers = data.totalUsers;
            this.gameTime = data.gameTime;
            this.playersGrowthRate = data.playersGrowthRate;
            this.hypeValue = data.hypeValue;
            this.marketCapacity = data.marketCapacity;
            this.pricePerCopy = data.pricePerCopy;
            this.revenueMultiplier = data.revenueMultiplier;
            this.systemCapacity = data.systemCapacity;
            this.bugCount = data.bugCount || 0;
            this.buildings = data.buildings;
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
        if (loadRate < 0.5) 
        {
            factors.lowLoadBonus = this.hypeLowLoadBonus;
        }

        // Ping影响（三阶段）
        if (this.ping <= this.hypePingMinorTolerance) 
        {
            factors.pingImpact = this.hypePingLowBonus * (1 - this.ping / this.hypePingMinorTolerance);
        } 
        else if (this.ping <= this.hypePingMajorTolerance) 
        {
            const t = (this.ping - this.hypePingMinorTolerance) / (this.hypePingMajorTolerance - this.hypePingMinorTolerance);
            factors.pingImpact = -this.hypePingMinorImpact * t;
        } 
        else 
        {
            factors.pingImpact = -this.hypePingMinorImpact - (this.ping - this.hypePingMajorTolerance) / this.hypePingMajorImpact;
        }

        // Bug影响（两阶段）
        const bugThreshold = this.bugSoftCapacity * this.hypeBugBonusThreshold;
        const tolerance = this.bugSoftCapacity;
        if (this.bugCount <= bugThreshold && bugThreshold > 0) {
            factors.bugImpact = (1 - this.bugCount / bugThreshold) * this.hypeBugBonus;
        } else if (tolerance > 0) {
            const pressure = Math.pow(this.bugCount / tolerance, 2);
            factors.bugImpact = -pressure * this.hypeBugPenalty;
        }

        return factors;
    }

    /**
     * 计算Bug动态容量（随用户规模增长）
     */
    calculateBugCapacities() {
        const userLog = Math.log10(Math.max(1, this.totalUsers));
        const softCap = this.bugsSoftCapBase + userLog * this.bugsSoftCapScaling;
        const hardCap = softCap * this.bugsHardCapModifier;

        this.bugSoftCapacity = Math.max(1, softCap);
        this.bugHardCapacity = Math.max(this.bugSoftCapacity, hardCap);
    }

    /**
     * 计算每秒Bug生成速率
     */
    calculateBugGenerationRate(loadRate) {
        if (this.bugCount >= this.bugHardCapacity) {
            return 0;
        }

        const baseRate = this.bugsGenerationRate;
        const userScaling = Math.log10(Math.max(1, this.totalUsers)) * this.bugsUserScaling;
        const loadMultiplier = 0.5 + loadRate;
        const softCapResistance = 1 / (1 + Math.pow(this.bugCount / this.bugSoftCapacity, 3));

        return (baseRate + userScaling) * loadMultiplier * softCapResistance;
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

        let deltaUsers = this.playersGrowthRate * this.hypeValue * marketResistance * loadDecay;

        // 如果增长后超过系统容量，限制为差值
        const remainingCapacity = this.systemCapacity - this.currentLoad;
        if (this.currentLoad + deltaUsers > this.systemCapacity) {
            deltaUsers = Math.max(0, remainingCapacity);
        }

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

        const profit = deltaUsers * this.pricePerCopy * this.revenueMultiplier;

        this.cachedStats.profitPerSecond = profit;
        this.cachedStats.arpu = this.pricePerCopy * this.revenueMultiplier;

        return profit;
    }

    /**
     * 更新系统状态
     */
    updateSystemState() {
        // 更新负载（基于当前用户总数）
        this.currentLoad = this.totalUsers;

        // 动态更新Ping（基于负载）
        const loadRate = this.systemCapacity > 0 ? this.currentLoad / this.systemCapacity : 0;
        const basePing = 50;
        this.ping = basePing + loadRate * 200; // 负载越高，延迟越大

        // 更新Bug系统（动态容量 + 公式生成）
        this.calculateBugCapacities();
        const bugGenerationRate = this.calculateBugGenerationRate(loadRate);
        this.bugCount = Math.min(this.bugCount + bugGenerationRate * this.deltaTime, this.bugHardCapacity);

        // 缓存负载信息
        this.cachedStats.loadRate = loadRate;
        this.cachedStats.bugGenerationRate = bugGenerationRate;
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

        // 更新用户数（向上取整，不超过系统容量）
        const deltaUsers = this.calculateDeltaUsersPerSecond() * this.deltaTime;
        const newUsers = Math.ceil(this.totalUsers + deltaUsers);
        this.totalUsers = Math.min(newUsers, this.systemCapacity);

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
                const message = `购买 ${this.buildings[buildingType].name} ×1，容量已更新`;
                this.addBottomEventLog(message, 'success');
            } else {
                break;
            }
        }
    }

    /**
     * 更新系统容量
     */
    updateSystemCapacity() {
        let totalCapacity = this.initSystemCapacity;

        for (const key in this.buildings) {
            const building = this.buildings[key];
            totalCapacity += building.count * building.capacity;
        }

        this.systemCapacity = totalCapacity;
    }

    // ========== 产品系统 ==========

    /**
     * 发布产品
     */
    publishProduct(productKey) {
        const product = this.products[productKey];
        if (!product.unlocked) {
            const message = `${product.name} 未解锁`;
            this.addBottomEventLog(message, 'warning');
            return;
        }

        if (product.developed) {
            const message = `${product.name} 已发布`;
            this.addBottomEventLog(message, 'warning');
            return;
        }

        if (this.money >= product.devCost) {
            this.money -= product.devCost;
            product.developed = true;

            // 扩大市场容量
            this.marketCapacity += 50000;

            // 提升收入乘数
            this.revenueMultiplier *= product.effect;

            const message = `发布 ${product.name}！市场容量 +50K，收入乘数 ×${product.effect}`;
            this.addBottomEventLog(message, 'success');

            // 重新渲染产品卡片
            this.renderProducts();
        } else {
            const message = `资金不足，无法开发 ${product.name}`;
            this.addBottomEventLog(message, 'warning');
        }
    }

    // ========== UI系统 ==========

    initUI() {
        // 初始化模型名称显示
        if (this.modelName) {
            document.getElementById('modelNameDisplay').textContent = `- ${this.modelName}`;
        }
        
        this.setupNavigation();
        this.renderBuildings();
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
            card.id = `building-${key}`;
            card.innerHTML = `
                <div class="building-name">${building.name}</div>
                <div class="building-stats">
                    <div class="building-count" data-label="已购买">已购买: ${building.count}</div>
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
        // 更新模型名称显示
        if (this.modelName) {
            document.getElementById('modelNameDisplay').textContent = `- ${this.modelName}`;
        }

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

        // 根据系统负载设置进度条颜色（蓝->黄->橙->红）
        const loadBar = document.getElementById('loadBar');
        if (loadRate < 25) {
            loadBar.style.background = '#2196F3'; // 蓝色 - 负载低
        } else if (loadRate < 50) {
            loadBar.style.background = '#FFEB3B'; // 黄色
        } else if (loadRate < 75) {
            loadBar.style.background = '#FF9800'; // 橙色
        } else if (loadRate < 100) {
            loadBar.style.background = '#FF5722'; // 橙红色
        } else {
            loadBar.style.background = '#F44336'; // 红色 - 负载高
        }

        document.getElementById('loadPercentage').textContent = `${loadRate.toFixed(1)}%`;
        document.getElementById('loadDecay').textContent = `${(this.cachedStats.loadDecay * 100).toFixed(0)}%`;

        // 计算市场占用率
        const marketRatio = (this.totalUsers / this.marketCapacity * 100).toFixed(1);
        const ratio = Math.min(parseFloat(marketRatio), 100);

        // 根据市场占用率显示四字词语
        let saturationText;
        if (ratio < 25) {
            saturationText = '新拓蓝海';
        } else if (ratio < 50) {
            saturationText = '新兴疆域';
        } else if (ratio < 70) {
            saturationText = '竞争红海';
        } else if (ratio < 90) {
            saturationText = '血流成河';
        } else {
            saturationText = '赤海炼狱';
        }
        document.getElementById('dashResistance').textContent = saturationText;

        document.getElementById('marketRatio').textContent = `${marketRatio}%`;
        document.getElementById('saturationBar').style.width = `${ratio}%`;

        // 根据市场占用率设置进度条颜色
        const saturationBar = document.getElementById('saturationBar');
        if (ratio < 25) {
            saturationBar.style.background = '#2196F3'; // 蓝色 - 新拓蓝海
        } else if (ratio < 50) {
            saturationBar.style.background = '#4CAF50'; // 绿色 - 新兴疆域
        } else if (ratio < 70) {
            saturationBar.style.background = '#FF9800'; // 橙色 - 竞争红海
        } else if (ratio < 90) {
            saturationBar.style.background = '#E91E63'; // 粉红色 - 血流成河
        } else {
            saturationBar.style.background = '#B71C1C'; // 深红色 - 赤海炼狱
        }

        document.getElementById('dashArpu').textContent = `$${this.cachedStats.arpu.toFixed(4)}`;

        // 更新右侧信息板
        const hours = Math.floor(this.gameTime / 3600);
        const minutes = Math.floor((this.gameTime % 3600) / 60);
        const seconds = Math.floor(this.gameTime % 60);
        document.getElementById('gameTime').textContent = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // 更新核心数据面板
        document.getElementById('rightMoney').textContent = `$${this.formatNumber(this.money)}`;
        document.getElementById('rightUsers').textContent = `${this.formatNumber(Math.floor(this.totalUsers))}`;
        document.getElementById('rightGrowth').textContent = `+${this.formatNumber(this.cachedStats.deltaUsersPerSecond)}/秒`;
        
        // 计算ARPU (每用户收入 = Price × RevMult)
        const arpu = this.pricePerCopy * this.revenueMultiplier;
        document.getElementById('rightArpu').textContent = `$${arpu.toFixed(2)}`;
        
        document.getElementById('rightProfit').textContent = `+$${this.formatNumber(this.cachedStats.profitPerSecond)}/秒`;
        
        // 更新系统容量
        document.getElementById('rightCapacity').textContent = `${this.formatNumber(Math.floor(this.totalUsers))} / ${this.formatNumber(this.systemCapacity)}`;
        const capacityPercent = (this.totalUsers / this.systemCapacity * 100).toFixed(1);
        document.getElementById('rightCapacityBar').style.width = `${Math.min(capacityPercent, 100)}%`;
        document.getElementById('rightCapacityPercent').textContent = `${capacityPercent}%`;

        // 更新Ping（带颜色）
        const pingEl = document.getElementById('pingValue');
        pingEl.textContent = `${this.ping.toFixed(0)}ms`;
        if (this.ping > 150) {
            pingEl.style.color = '#ff4444'; // 红色
        } else if (this.ping > 50) {
            pingEl.style.color = '#ffff00'; // 黄色
        } else {
            pingEl.style.color = '#00ff88'; // 绿色
        }

        // 更新Bug数（带颜色）
        const bugEl = document.getElementById('bugValue');
        bugEl.textContent = `${Math.floor(this.bugCount)}`;
        if (this.bugCount >= this.bugSoftCapacity) {
            bugEl.style.color = '#ff4444'; // 红色
        } else if (this.bugCount > this.bugSoftCapacity * this.hypeBugBonusThreshold) {
            bugEl.style.color = '#ffff00'; // 黄色
        } else {
            bugEl.style.color = '#00ff88'; // 绿色
        }

        // 更新建筑数量显示
        for (const key in this.buildings) {
            const buildingEl = document.getElementById(`building-${key}`);
            if (buildingEl) {
                const countEl = buildingEl.querySelector('.building-count');
                if (countEl) {
                    countEl.textContent = `已购买: ${this.buildings[key].count}`;
                }
                const costEl = buildingEl.querySelector('[data-label="下一个成本"]');
                if (costEl) {
                    const cost = this.calculateBuildingCost(key);
                    costEl.textContent = `下一个成本: $${this.formatNumber(cost)}`;
                }
                const btnEl = buildingEl.querySelector('.build-btn');
                if (btnEl) {
                    const cost = this.calculateBuildingCost(key);
                    btnEl.disabled = this.money < cost;
                }
            }
        }
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
        return Math.floor(num).toString(); // 1000以下显示整数
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${String(s).padStart(2, '0')}`;
    }

    // ========== 底部面板系统 ==========

    showNews(index) {
        if (index < 0 || index >= this.aiNews.length) {
            this.currentNewsIndex = 0;
        } else {
            this.currentNewsIndex = index;
        }

        const news = this.aiNews[this.currentNewsIndex];
        const headerNewsText = document.getElementById('headerNewsText');
        
        if (headerNewsText) {
            // 显示新闻标题到头部
            headerNewsText.textContent = `📰 ${news.title}`;
        }
    }

    startNewsAutoplay() {
        // 清除之前的定时器
        if (this.newsAutoplayTimer) {
            clearInterval(this.newsAutoplayTimer);
        }

        this.newsAutoplayTimer = setInterval(() => {
            if (!this.newsAutoPaused) {
                // 顺序循环显示新闻
                this.currentNewsIndex = (this.currentNewsIndex + 1) % this.aiNews.length;
                this.showNews(this.currentNewsIndex);
            }
        }, 6000); // 每6秒自动切换一条新闻
    }

    addBottomEventLog(message, type = 'info') {
        const logContainer = document.getElementById('logs-content');
        if (!logContainer) return;

        const logItem = document.createElement('div');
        logItem.className = `log-item ${type}`;
        const timestamp = this.formatTime(this.gameTime);
        logItem.innerHTML = `
            <span class="log-time">[${timestamp}]</span>
            <span class="log-message">${message}</span>
        `;

        logContainer.appendChild(logItem);

        // 保持最近20条日志
        const logs = logContainer.querySelectorAll('.log-item');
        if (logs.length > 20) {
            logs[0].remove();
        }

        // 自动滚动到底部
        logContainer.scrollTop = logContainer.scrollHeight;
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
