/**
 * AI Empire - 游戏核心引擎
 * 基于MMO98的盈利与玩家增长系统
 */

class AIEmpireGame {
    constructor() {
        // ========== 游戏状态 ==========
        this.money = 1000000; // 初始资金
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
        this.bugsLoadBase = 0.35; // 负载乘数基础值
        this.bugsLoadScaling = 0.75; // 负载乘数斜率
        this.bugsSoftCapBase = 50; // Bug软容量基础值
        this.bugsSoftCapScaling = 10; // Bug软容量对用户规模的对数缩放
        this.bugsHardCapModifier = 2.0; // Bug硬容量 = 软容量 * 该系数

        // 被动修复（让系统存在自然恢复能力）
        this.bugFixBaseRate = 0.25; // 基础每秒修复
        this.bugFixUserScaling = 0.08; // 用户规模带来的修复增量
        this.bugFixLowLoadBonus = 1.2; // 低负载时修复效率加成
        this.bugFixPressureBoost = 0.6; // Bug压力越高，修复越强

        // ========== 校准修复系统 ==========
        this.fixBugMin = 4;
        this.fixBugMax = 6;
        this.fixStreakBonus = 1;
        this.fixPressureScale = 0.8;
        this.skipBugPenaltyBase = 2;
        this.skipBugPenaltyPressureScale = 1.0;
        this.calibrationStreak = 0;
        this.currentChallenge = null;
        this.currentChallengeAnswer = null;
        this.currentChallengeMeta = null;
        this.lastCalibrationChallengeType = null;
        this.calibrationAutoNextTimer = null;
        this.lastCalibrationFix = 0;

        // ========== 建筑系统 ==========
        this.buildings = {
            cpu: { count: 0, baseCost: 5000, capacity: 500, costFactor: 1.15, name: 'CPU集群' },
            gpu: { count: 0, baseCost: 50000, capacity: 1500, costFactor: 1.15, name: 'GPU集群' },
            tpu: { count: 0, baseCost: 500000, capacity: 4500, costFactor: 1.15, name: 'TPU阵列', unlocked: false },
            quantum: { count: 0, baseCost: 5000000, capacity: 7000, costFactor: 1.15, name: '量子芯片', unlocked: false },
        };

        // ========== 产品系统 ==========
        this.products = {
            // 文本产品线
            textAPI: { 
                unlocked: true, developed: false, isDeveloping: false,
                devCost: 1000000, devTime: 3600, 
                effect: 1.0, name: '文本API基础版', emoji: '📄',
                prerequisites: [], devProgress: 0, devStartTime: 0
            },
            gptMedium: { 
                unlocked: false, developed: false, isDeveloping: false,
                devCost: 100000000, devTime: 43200,
                effect: 5.0, name: 'GPT-Medium', emoji: '🤖',
                prerequisites: ['textAPI'], devProgress: 0, devStartTime: 0
            },
            gptLarge: { 
                unlocked: false, developed: false, isDeveloping: false,
                devCost: 500000000, devTime: 172800,
                effect: 15.0, name: 'GPT-Large', emoji: '🧠',
                prerequisites: ['gptMedium'], devProgress: 0, devStartTime: 0
            },
            
            // 图像产品线
            imageAPI: { 
                unlocked: true, developed: false, isDeveloping: false,
                devCost: 5000000, devTime: 7200, 
                effect: 1.5, name: '图像API基础版', emoji: '🖼️',
                prerequisites: [], devProgress: 0, devStartTime: 0
            },
            dalleL: { 
                unlocked: false, developed: false, isDeveloping: false,
                devCost: 500000000, devTime: 86400,
                effect: 8.0, name: 'DALL-E Large', emoji: '🎨',
                prerequisites: ['imageAPI'], devProgress: 0, devStartTime: 0
            },
            
            // 语音产品线
            speechAPI: { 
                unlocked: true, developed: false, isDeveloping: false,
                devCost: 3000000, devTime: 5400, 
                effect: 1.2, name: '语音API基础版', emoji: '🎤',
                prerequisites: [], devProgress: 0, devStartTime: 0
            },
            
            // 综合产品
            multimodal: { 
                unlocked: false, developed: false, isDeveloping: false,
                devCost: 10000000000, devTime: 360000,
                effect: 50.0, name: '多模态引擎', emoji: '📱',
                prerequisites: ['textAPI', 'imageAPI', 'speechAPI'], devProgress: 0, devStartTime: 0
            },
        };
        
        // 当前正在研发的产品（串行研发）
        this.currentDevProduct = null;

        // ========== 研发技能树系统 ==========
        this.researchSkills = {
            // 增长分支
            coldStart: {
                id: 'coldStart',
                name: '冷启动投放',
                category: '增长',
                unlockCost: 50000,
                prerequisites: [],
                targetParam: 'playersGrowthRate',
                modifyType: 'percent',
                modifyValue: 0.08,
                unlocked: false,
                description: '通过精准投放获得初始用户增长',
                icon: '🚀',
            },
            viralMarketing: {
                id: 'viralMarketing',
                name: '病毒式营销',
                category: '增长',
                unlockCost: 120000,
                prerequisites: ['coldStart'],
                targetParam: 'playersGrowthRate',
                modifyType: 'percent',
                modifyValue: 0.12,
                unlocked: false,
                description: '激发用户自发传播，快速扩散',
                icon: '📢',
            },
            // 口碑分支
            brandAwareness: {
                id: 'brandAwareness',
                name: '品牌感知优化',
                category: '口碑',
                unlockCost: 80000,
                prerequisites: [],
                targetParam: 'hypeBase',
                modifyType: 'flat',
                modifyValue: 0.08,
                unlocked: false,
                description: '提升品牌认知度与口碑传播',
                icon: '✨',
            },
            publicRelations: {
                id: 'publicRelations',
                name: '公关策略',
                category: '口碑',
                unlockCost: 150000,
                prerequisites: ['brandAwareness'],
                targetParam: 'hypeBase',
                modifyType: 'flat',
                modifyValue: 0.12,
                unlocked: false,
                description: '专业公关团队维护品牌形象',
                icon: '🎯',
            },
            // 收入分支
            pricingExperiment: {
                id: 'pricingExperiment',
                name: '定价实验',
                category: '收入',
                unlockCost: 120000,
                prerequisites: [],
                targetParam: 'revenueMultiplier',
                modifyType: 'percent',
                modifyValue: 0.06,
                unlocked: false,
                description: '通过A/B测试优化定价策略',
                icon: '💰',
            },
            premiumTier: {
                id: 'premiumTier',
                name: '高级订阅',
                category: '收入',
                unlockCost: 200000,
                prerequisites: ['pricingExperiment'],
                targetParam: 'revenueMultiplier',
                modifyType: 'percent',
                modifyValue: 0.10,
                unlocked: false,
                description: '推出高级订阅服务提升ARPU',
                icon: '💎',
            },
            // 稳定分支
            testCoverage: {
                id: 'testCoverage',
                name: '测试覆盖优化',
                category: '稳定',
                unlockCost: 60000,
                prerequisites: [],
                targetParam: 'bugsGenerationRate',
                modifyType: 'percent',
                modifyValue: -0.12,
                unlocked: false,
                description: '提升测试覆盖率减少Bug产生',
                icon: '🧪',
            },
            codeQuality: {
                id: 'codeQuality',
                name: '代码质量体系',
                category: '稳定',
                unlockCost: 100000,
                prerequisites: ['testCoverage'],
                targetParam: 'bugsGenerationRate',
                modifyType: 'percent',
                modifyValue: -0.15,
                unlocked: false,
                description: '建立代码审查与质量保障体系',
                icon: '📝',
            },
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
            calibrationStreak: this.calibrationStreak,
            buildings: this.buildings,
            products: this.products,
            currentDevProduct: this.currentDevProduct,
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
            this.currentDevProduct = data.currentDevProduct || null;

            // 存档兼容：缺失时使用默认值
            this.calibrationStreak = data.calibrationStreak || 0;
        }
    }

    /**
     * 返回[min, max]的随机整数
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
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
        // 应用技能修正到Hype基础值
        const modifiedHypeBase = this.applySkillModifiers('hypeBase', this.hypeBase);
        
        const factors = {
            base: modifiedHypeBase,
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

        // 应用技能修正
        const baseRate = this.applySkillModifiers('bugsGenerationRate', this.bugsGenerationRate);
        const userScaling = Math.log10(Math.max(1, this.totalUsers)) * this.bugsUserScaling;
        const loadMultiplier = this.bugsLoadBase + loadRate * this.bugsLoadScaling;
        const softCapResistance = 1 / (1 + Math.pow(this.bugCount / this.bugSoftCapacity, 3));

        return (baseRate + userScaling) * loadMultiplier * softCapResistance;
    }

    /**
     * 计算每秒被动修复速率
     */
    calculateBugFixRate(loadRate) {
        const userScaling = Math.log10(Math.max(1, this.totalUsers)) * this.bugFixUserScaling;
        const lowLoadFactor = 1 + Math.max(0, 1 - loadRate) * this.bugFixLowLoadBonus;
        const pressureRatio = this.bugSoftCapacity > 0 ? this.bugCount / this.bugSoftCapacity : 0;
        const pressureFactor = 1 + Math.max(0, pressureRatio - 1) * this.bugFixPressureBoost;

        return (this.bugFixBaseRate + userScaling) * lowLoadFactor * pressureFactor;
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

        // 应用技能修正
        const modifiedGrowthRate = this.applySkillModifiers('playersGrowthRate', this.playersGrowthRate);

        let deltaUsers = modifiedGrowthRate * this.hypeValue * marketResistance * loadDecay;

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

        // 应用技能修正
        const modifiedPrice = this.applySkillModifiers('pricePerCopy', this.pricePerCopy);
        const modifiedRevMult = this.applySkillModifiers('revenueMultiplier', this.revenueMultiplier);

        const profit = deltaUsers * modifiedPrice * modifiedRevMult;

        this.cachedStats.profitPerSecond = profit;
        this.cachedStats.arpu = modifiedPrice * modifiedRevMult;

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
        const bugFixRate = this.calculateBugFixRate(loadRate);
        this.bugCount = Math.min(this.bugCount + bugGenerationRate * this.deltaTime, this.bugHardCapacity);
        this.bugCount = Math.max(0, this.bugCount - bugFixRate * this.deltaTime);

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

        // 更新产品研发进度
        this.updateProductDevelopment();

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

        // 产品解锁（基于金钱或前置产品完成）
        if (this.money >= 1000000) {
            this.products.textAPI.unlocked = true;
            this.products.imageAPI.unlocked = true;
            this.products.speechAPI.unlocked = true;
        }

        // 高级产品解锁（基于前置产品发布）
        if (this.products.textAPI.developed) {
            this.products.gptMedium.unlocked = true;
        }
        if (this.products.gptMedium.developed) {
            this.products.gptLarge.unlocked = true;
        }
        if (this.products.imageAPI.developed) {
            this.products.dalleL.unlocked = true;
        }
        if (this.products.textAPI.developed && this.products.imageAPI.developed && this.products.speechAPI.developed) {
            this.products.multimodal.unlocked = true;
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
     * 检查产品的前置依赖是否满足
     */
    checkProductDependencies(productKey) {
        const product = this.products[productKey];
        if (!product.prerequisites || product.prerequisites.length === 0) {
            return true;
        }

        for (const prereq of product.prerequisites) {
            if (!this.products[prereq].developed) {
                return false;
            }
        }
        return true;
    }

    /**
     * 获取前置依赖的名称列表（用于显示）
     */
    getProductDependenciesDisplay(productKey) {
        const product = this.products[productKey];
        if (!product.prerequisites || product.prerequisites.length === 0) {
            return null;
        }

        const names = product.prerequisites.map(key => this.products[key].name);
        return names.join('、');
    }

    /**
     * 开始研发产品
     */
    startDevelopment(productKey) {
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

        if (product.isDeveloping) {
            const message = `${product.name} 正在研发中`;
            this.addBottomEventLog(message, 'warning');
            return;
        }

        // 检查前置依赖
        if (!this.checkProductDependencies(productKey)) {
            const deps = this.getProductDependenciesDisplay(productKey);
            const message = `无法研发 ${product.name}，需要先完成：${deps}`;
            this.addBottomEventLog(message, 'warning');
            return;
        }

        // 检查资金
        if (this.money < product.devCost) {
            const shortage = product.devCost - this.money;
            const message = `资金不足，无法研发 ${product.name}，还差 $${this.formatNumber(shortage)}`;
            this.addBottomEventLog(message, 'warning');
            return;
        }

        // 如果有其他产品正在研发，中断之前的研发
        if (this.currentDevProduct) {
            const prevProduct = this.products[this.currentDevProduct];
            prevProduct.isDeveloping = false;
            prevProduct.devProgress = 0;
            prevProduct.devStartTime = 0;
        }

        // 扣除资金并开始研发
        this.money -= product.devCost;
        product.isDeveloping = true;
        product.devProgress = 0;
        product.devStartTime = this.gameTime;
        this.currentDevProduct = productKey;

        const message = `🔬 开始研发 ${product.name}，预计需要 ${this.formatProductTime(product.devTime)}`;
        this.addBottomEventLog(message, 'success');

        // 重新渲染产品卡片
        this.renderProducts();
    }

    /**
     * 更新产品研发进度
     */
    updateProductDevelopment() {
        if (!this.currentDevProduct) {
            return;
        }

        const product = this.products[this.currentDevProduct];
        if (!product.isDeveloping) {
            this.currentDevProduct = null;
            return;
        }

        // 计算研发进度
        const elapsedTime = this.gameTime - product.devStartTime;
        product.devProgress = Math.min(1.0, elapsedTime / product.devTime);

        // 研发完成
        if (product.devProgress >= 1.0) {
            product.developed = true;
            product.isDeveloping = false;
            product.devProgress = 0;
            product.devStartTime = 0;
            this.currentDevProduct = null;

            // 扩大市场容量
            this.marketCapacity += 50000;

            // 提升收入乘数
            this.revenueMultiplier *= product.effect;

            const message = `✅ 产品发布：${product.name}！市场容量 +50K，收入乘数 ×${product.effect}`;
            this.addBottomEventLog(message, 'success');

            // 重新渲染产品卡片
            this.renderProducts();
        }
    }

    /**
     * 更新研发进度条UI
     */
    updateDevelopmentProgress() {
        if (!this.currentDevProduct) {
            return;
        }

        const product = this.products[this.currentDevProduct];
        if (!product || !product.isDeveloping) {
            return;
        }

        // 计算进度
        const progressPercent = (product.devProgress * 100).toFixed(0);
        const consumedCost = product.devCost * product.devProgress;

        // 更新进度条宽度
        const progressBar = document.getElementById(`progress-bar-${this.currentDevProduct}`);
        if (progressBar) {
            progressBar.style.width = `${progressPercent}%`;
        }

        // 更新进度文字
        const progressText = document.getElementById(`progress-text-${this.currentDevProduct}`);
        if (progressText) {
            progressText.textContent = `${progressPercent}% - $${this.formatNumber(consumedCost)}/$${this.formatNumber(product.devCost)}`;
        }
    }

    /**
     * 格式化产品开发时间显示
     */
    formatProductTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hours}h${minutes}m${secs}s`;
    }

    // ========== 研发技能树系统 ==========

    /**
     * 解锁技能
     */
    unlockSkill(skillId) {
        const skill = this.researchSkills[skillId];
        
        if (!skill) {
            console.error(`技能 ${skillId} 不存在`);
            return;
        }

        if (skill.unlocked) {
            const message = `${skill.name} 已解锁`;
            this.addBottomEventLog(message, 'warning');
            return;
        }

        // 检查前置条件
        for (const prereqId of skill.prerequisites) {
            if (!this.researchSkills[prereqId].unlocked) {
                const message = `需要先解锁前置技能：${this.researchSkills[prereqId].name}`;
                this.addBottomEventLog(message, 'warning');
                return;
            }
        }

        // 检查资金
        if (this.money < skill.unlockCost) {
            const shortage = skill.unlockCost - this.money;
            const message = `资金不足，还差 $${this.formatNumber(shortage)}`;
            this.addBottomEventLog(message, 'warning');
            return;
        }

        // 扣除资金并解锁
        this.money -= skill.unlockCost;
        skill.unlocked = true;

        const message = `✓ 解锁技能：${skill.name} | 参数：${skill.targetParam} ${skill.modifyType === 'percent' ? (skill.modifyValue >= 0 ? '+' : '') + (skill.modifyValue * 100).toFixed(0) + '%' : (skill.modifyValue >= 0 ? '+' : '') + skill.modifyValue}`;
        this.addBottomEventLog(message, 'success');

        // 重新渲染研发面板
        this.renderResearch();
        const unlockedCard = document.querySelector(`.research-skill-card[data-skill-id="${skillId}"]`);
        if (unlockedCard) {
            unlockedCard.classList.add('skill-just-unlocked');
            setTimeout(() => unlockedCard.classList.remove('skill-just-unlocked'), 800);
        }
        // 立即刷新全局UI，保证购买后的数值立刻可见
        this.updateUI();
    }

    calculateResearchMetrics() {
        const totalSkills = Object.keys(this.researchSkills).length;
        const unlockedSkills = Object.values(this.researchSkills).filter((s) => s.unlocked).length;
        const totalInvestment = Object.values(this.researchSkills)
            .filter((s) => s.unlocked)
            .reduce((sum, s) => sum + s.unlockCost, 0);

        const modifiers = this.getSkillModifiers();
        const growthMultiplier = 1 + (modifiers.playersGrowthRate?.percent || 0);
        const priceMultiplier = 1 + (modifiers.pricePerCopy?.percent || 0);
        const revenueMultiplier = 1 + (modifiers.revenueMultiplier?.percent || 0);
        const incomeMultiplier = growthMultiplier * priceMultiplier * revenueMultiplier;

        return {
            totalSkills,
            unlockedSkills,
            totalInvestment,
            incomeMultiplier,
        };
    }

    /**
     * 获取技能实际应用的参数修正
     */
    getSkillModifiers() {
        const modifiers = {
            playersGrowthRate: { percent: 0, flat: 0 },
            hypeBase: { percent: 0, flat: 0 },
            revenueMultiplier: { percent: 0, flat: 0 },
            pricePerCopy: { percent: 0, flat: 0 },
            bugsGenerationRate: { percent: 0, flat: 0 },
        };

        for (const skillId in this.researchSkills) {
            const skill = this.researchSkills[skillId];
            if (skill.unlocked) {
                const param = skill.targetParam;
                if (modifiers[param]) {
                    if (skill.modifyType === 'percent') {
                        modifiers[param].percent += skill.modifyValue;
                    } else if (skill.modifyType === 'flat') {
                        modifiers[param].flat += skill.modifyValue;
                    }
                }
            }
        }

        return modifiers;
    }

    /**
     * 应用技能修正到参数
     */
    applySkillModifiers(param, baseValue) {
        const modifiers = this.getSkillModifiers();
        
        if (!modifiers[param]) {
            return baseValue;
        }

        let value = baseValue;
        
        // 先应用百分比修正
        value = value * (1 + modifiers[param].percent);
        
        // 再应用固定值修正
        value = value + modifiers[param].flat;

        return value;
    }

    /**
     * 计算收益提升倍率（用于UI展示）
     */
    calculateIncomeBoost(skillId) {
        const skill = this.researchSkills[skillId];
        if (!skill || skill.unlocked) {
            return 1.0;
        }

        // 模拟解锁后的收益
        const currentProfit = this.calculateProfitPerSecond();
        
        // 临时解锁技能
        skill.unlocked = true;
        const newProfit = this.calculateProfitPerSecond();
        skill.unlocked = false;

        const boost = currentProfit > 0 ? newProfit / currentProfit : 1.0;
        return boost;
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
        this.renderResearch();

        const calibrationInput = document.getElementById('challengeInput');
        if (calibrationInput) {
            calibrationInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.submitCalibrationAnswer();
                }
            });
        }
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

                if (btn.dataset.page === 'calibration') {
                    this.resumeCalibrationAutoFlow();
                } else {
                    this.pauseCalibrationAutoFlow();
                }
            });
        });

        // 默认显示overview
        document.querySelector('[data-page="overview"]').classList.add('active');
        document.getElementById('page-overview').classList.add('active');
    }

    isCalibrationPageActive() {
        const page = document.getElementById('page-calibration');
        return !!page && page.classList.contains('active');
    }

    clearCalibrationAutoTimer() {
        if (this.calibrationAutoNextTimer) {
            clearTimeout(this.calibrationAutoNextTimer);
            this.calibrationAutoNextTimer = null;
        }
    }

    resetCalibrationChallengeState() {
        const inputEl = document.getElementById('challengeInput');
        const submitBtn = document.getElementById('challengeSubmitBtn');
        const skipBtn = document.getElementById('challengeSkipBtn');
        const titleEl = document.getElementById('challengeTitle');
        const descEl = document.getElementById('challengeDescription');
        const hintEl = document.getElementById('challengeHint');

        this.currentChallenge = null;
        this.currentChallengeAnswer = null;
        this.currentChallengeMeta = null;

        if (inputEl) {
            inputEl.value = '';
        }
        if (submitBtn) {
            submitBtn.disabled = true;
        }
        if (skipBtn) {
            skipBtn.disabled = true;
        }
        if (titleEl) {
            titleEl.textContent = '系统将自动派发校准任务';
        }
        if (descEl) {
            descEl.textContent = '完成挑战后可修复 4-6 个Bug';
        }
        if (hintEl) {
            hintEl.textContent = '提示：连续答对可获得额外修复奖励';
        }
    }

    pauseCalibrationAutoFlow() {
        this.clearCalibrationAutoTimer();
        this.resetCalibrationChallengeState();
    }

    resumeCalibrationAutoFlow() {
        if (!this.isCalibrationPageActive()) return;
        this.clearCalibrationAutoTimer();
        this.startCalibrationChallenge();
    }

    scheduleNextCalibrationChallenge(delayMs) {
        this.clearCalibrationAutoTimer();
        this.calibrationAutoNextTimer = setTimeout(() => {
            this.calibrationAutoNextTimer = null;
            if (this.isCalibrationPageActive()) {
                this.startCalibrationChallenge();
            }
        }, delayMs);
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
        if (!container) return;
        container.innerHTML = '';

        // 已发布产品
        const publishedProducts = Object.entries(this.products).filter(([_, p]) => p.developed);
        if (publishedProducts.length > 0) {
            const publishedSection = document.createElement('div');
            publishedSection.className = 'products-section';
            publishedSection.innerHTML = '<h3 class="section-title">✅ 已发布产品</h3>';
            
            const publishedContainer = document.createElement('div');
            publishedContainer.className = 'products-list';
            
            publishedProducts.forEach(([key, product]) => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <div class="product-header">
                        <span class="product-emoji">${product.emoji}</span>
                        <div class="product-title">${product.name}</div>
                    </div>
                    <div class="product-stats">
                        <div>📊 质量倍率: ×${product.effect}</div>
                    </div>
                `;
                publishedContainer.appendChild(card);
            });
            
            publishedSection.appendChild(publishedContainer);
            container.appendChild(publishedSection);
        }

        // 研发中产品
        const developingProducts = Object.entries(this.products).filter(([_, p]) => p.isDeveloping);
        if (developingProducts.length > 0) {
            const developingSection = document.createElement('div');
            developingSection.className = 'products-section';
            
            const timeRemaining = developingProducts[0][1].devTime - (this.gameTime - developingProducts[0][1].devStartTime);
            developingSection.innerHTML = `<h3 class="section-title">⏳ 研发中 (剩余时间: ${this.formatProductTime(timeRemaining)})</h3>`;
            
            const developingContainer = document.createElement('div');
            developingContainer.className = 'products-list';
            
            developingProducts.forEach(([key, product]) => {
                const elapsedTime = this.gameTime - product.devStartTime;
                const progressPercent = (product.devProgress * 100).toFixed(0);
                const consumedCost = product.devCost * product.devProgress;

                const card = document.createElement('div');
                card.className = 'product-card developing';
                card.id = `developing-card-${key}`;
                card.innerHTML = `
                    <div class="product-header">
                        <span class="product-emoji">${product.emoji}</span>
                        <div class="product-title">${product.name}</div>
                    </div>
                    <div class="progress-container" id="progress-container-${key}">
                        <div class="progress-bar-container">
                            <div class="progress-bar-fill" id="progress-bar-${key}" style="width: ${progressPercent}%"></div>
                        </div>
                        <div class="progress-text" id="progress-text-${key}">${progressPercent}% - $${this.formatNumber(consumedCost)}/$${this.formatNumber(product.devCost)}</div>
                    </div>
                `;
                developingContainer.appendChild(card);
            });
            
            developingSection.appendChild(developingContainer);
            container.appendChild(developingSection);
        }

        // 可研发产品
        const availableProducts = Object.entries(this.products).filter(([_, p]) => 
            p.unlocked && !p.developed && !p.isDeveloping
        );
        if (availableProducts.length > 0) {
            const availableSection = document.createElement('div');
            availableSection.className = 'products-section';
            availableSection.innerHTML = '<h3 class="section-title">🔬 可研发产品</h3>';
            
            const availableContainer = document.createElement('div');
            availableContainer.className = 'products-list';
            
            availableProducts.forEach(([key, product]) => {
                const canStart = this.checkProductDependencies(key) && this.money >= product.devCost;
                const depsDisplay = this.getProductDependenciesDisplay(key);
                
                const card = document.createElement('div');
                card.className = `product-card${!canStart ? ' locked' : ''}`;
                card.innerHTML = `
                    <div class="product-header">
                        <span class="product-emoji">${product.emoji}</span>
                        <div class="product-title">${product.name}</div>
                    </div>
                    <div class="product-stats">
                        <div>💰 成本: $${this.formatNumber(product.devCost)}</div>
                        <div>⏱️ 时间: ${this.formatProductTime(product.devTime)}</div>
                        ${depsDisplay ? `<div class="product-deps">📋 前置: ${depsDisplay}</div>` : '<div class="product-deps">📋 前置: 无</div>'}
                    </div>
                    <button class="build-btn" onclick="game.startDevelopment('${key}')" 
                        ${!canStart ? 'disabled' : ''}>
                        ${!this.checkProductDependencies(key) ? '前置未完成' : this.money < product.devCost ? '资金不足' : '开始研发'}
                    </button>
                `;
                availableContainer.appendChild(card);
            });
            
            availableSection.appendChild(availableContainer);
            container.appendChild(availableSection);
        }

        // 未解锁产品提示
        const lockedProducts = Object.entries(this.products).filter(([_, p]) => !p.unlocked);
        if (lockedProducts.length > 0) {
            const lockedSection = document.createElement('div');
            lockedSection.className = 'products-section';
            lockedSection.innerHTML = '<h3 class="section-title">🔒 未解锁产品</h3>';
            
            const lockedContainer = document.createElement('div');
            lockedContainer.className = 'products-list';
            
            lockedProducts.forEach(([key, product]) => {
                const depsDisplay = this.getProductDependenciesDisplay(key);
                
                const card = document.createElement('div');
                card.className = 'product-card locked';
                card.innerHTML = `
                    <div class="product-header">
                        <span class="product-emoji">🔒</span>
                        <div class="product-title">${product.name}</div>
                    </div>
                    <div class="product-stats">
                        <div>💰 成本: $${this.formatNumber(product.devCost)}</div>
                        <div>⏱️ 时间: ${this.formatProductTime(product.devTime)}</div>
                        ${depsDisplay ? `<div class="product-deps">📋 前置: ${depsDisplay}</div>` : ''}
                    </div>
                `;
                lockedContainer.appendChild(card);
            });
            
            lockedSection.appendChild(lockedContainer);
            container.appendChild(lockedSection);
        }
    }

    renderResearch() {
        const container = document.getElementById('researchContainer');
        const summary = document.getElementById('researchSummary');
        
        if (!container || !summary) return;
        
        container.innerHTML = '';
        
        const metrics = this.calculateResearchMetrics();
        summary.textContent = `已解锁: ${metrics.unlockedSkills}/${metrics.totalSkills} | 总研发投入: $${this.formatNumber(metrics.totalInvestment)} | 累计收益倍率: ×${metrics.incomeMultiplier.toFixed(2)}`;
        
        // 按分支分组渲染
        const categories = ['增长', '口碑', '收入', '稳定'];
        
        categories.forEach(category => {
            const categorySkills = Object.values(this.researchSkills).filter(s => s.category === category);
            
            if (categorySkills.length === 0) return;
            
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'research-category';
            categoryDiv.innerHTML = `<h3 class="research-category-title">${category}分支</h3>`;
            
            const skillsGrid = document.createElement('div');
            skillsGrid.className = 'research-skills-grid';
            
            categorySkills.forEach(skill => {
                const prereqsMet = skill.prerequisites.every(prereqId => this.researchSkills[prereqId].unlocked);
                const canUnlock = !skill.unlocked && prereqsMet && this.money >= skill.unlockCost;
                const locked = !skill.unlocked && !prereqsMet;
                
                let statusText = '';
                let statusClass = '';
                if (skill.unlocked) {
                    statusText = '✓ 已解锁';
                    statusClass = 'skill-unlocked';
                } else if (locked) {
                    statusText = '🔒 前置未达';
                    statusClass = 'skill-locked';
                } else if (canUnlock) {
                    statusText = '可解锁';
                    statusClass = 'skill-available';
                } else {
                    statusText = '资金不足';
                    statusClass = 'skill-insufficient';
                }
                
                // 预计提升
                const boost = skill.unlocked ? 1.0 : this.calculateIncomeBoost(skill.id);
                const boostPct = ((boost - 1) * 100).toFixed(1);
                
                const card = document.createElement('div');
                card.className = `research-skill-card ${statusClass}`;
                card.dataset.skillId = skill.id;
                card.innerHTML = `
                    <div class="skill-icon">${skill.icon}</div>
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-cost">$${this.formatNumber(skill.unlockCost)}</div>
                    <div class="skill-effect">${skill.targetParam}: ${skill.modifyType === 'percent' ? (skill.modifyValue >= 0 ? '+' : '') + (skill.modifyValue * 100).toFixed(0) + '%' : (skill.modifyValue >= 0 ? '+' : '') + skill.modifyValue}</div>
                    <div class="skill-description">${skill.description}</div>
                    <div class="skill-boost">预计提升: +${boostPct}%</div>
                    <button class="build-btn skill-unlock-btn" data-skill-id="${skill.id}" onclick="game.unlockSkill('${skill.id}')" 
                        ${skill.unlocked || !prereqsMet || this.money < skill.unlockCost ? 'disabled' : ''}>
                        ${statusText}
                    </button>
                `;
                skillsGrid.appendChild(card);
            });
            
            categoryDiv.appendChild(skillsGrid);
            container.appendChild(categoryDiv);
        });
    }

    updateResearchButtonStates() {
        const container = document.getElementById('researchContainer');
        const summary = document.getElementById('researchSummary');
        if (!container || !summary) return;

        const metrics = this.calculateResearchMetrics();
        summary.textContent = `已解锁: ${metrics.unlockedSkills}/${metrics.totalSkills} | 总研发投入: $${this.formatNumber(metrics.totalInvestment)} | 累计收益倍率: ×${metrics.incomeMultiplier.toFixed(2)}`;

        const buttons = container.querySelectorAll('.skill-unlock-btn');
        buttons.forEach((btn) => {
            const skillId = btn.dataset.skillId;
            const skill = this.researchSkills[skillId];
            if (!skill) return;

            const prereqsMet = skill.prerequisites.every((prereqId) => this.researchSkills[prereqId].unlocked);
            const canUnlock = !skill.unlocked && prereqsMet && this.money >= skill.unlockCost;
            const locked = !skill.unlocked && !prereqsMet;

            let statusText = '';
            let statusClass = '';
            if (skill.unlocked) {
                statusText = '✓ 已解锁';
                statusClass = 'skill-unlocked';
            } else if (locked) {
                statusText = '🔒 前置未达';
                statusClass = 'skill-locked';
            } else if (canUnlock) {
                statusText = '可解锁';
                statusClass = 'skill-available';
            } else {
                statusText = '资金不足';
                statusClass = 'skill-insufficient';
            }

            btn.disabled = !canUnlock;
            btn.textContent = statusText;

            const card = btn.closest('.research-skill-card');
            if (card) {
                card.classList.remove('skill-unlocked', 'skill-locked', 'skill-available', 'skill-insufficient');
                card.classList.add(statusClass);
            }
        });
    }

    // ========== 校准修复系统 ==========

    startCalibrationChallenge(type) {
        if (!this.isCalibrationPageActive()) return;

        this.clearCalibrationAutoTimer();

        const inputEl = document.getElementById('challengeInput');
        const titleEl = document.getElementById('challengeTitle');
        const descEl = document.getElementById('challengeDescription');
        const hintEl = document.getElementById('challengeHint');
        const submitBtn = document.getElementById('challengeSubmitBtn');
        const skipBtn = document.getElementById('challengeSkipBtn');

        if (!inputEl || !titleEl || !descEl || !hintEl || !submitBtn || !skipBtn) return;

        const challengePool = ['math', 'captcha', 'twentyFour'];
        let challengeType = type;

        if (!challengeType) {
            const randomPool = this.lastCalibrationChallengeType
                ? challengePool.filter((item) => item !== this.lastCalibrationChallengeType)
                : challengePool;
            challengeType = randomPool[this.randomInt(0, randomPool.length - 1)];
        }

        this.lastCalibrationChallengeType = challengeType;

        if (challengeType === 'math') {
            const a = this.randomInt(2, 30);
            const b = this.randomInt(2, 20);
            const opPool = ['+', '-', '*'];
            const op = opPool[this.randomInt(0, opPool.length - 1)];
            const answer = op === '+' ? a + b : op === '-' ? a - b : a * b;

            this.currentChallenge = 'math';
            this.currentChallengeAnswer = String(answer);
            this.currentChallengeMeta = null;

            titleEl.textContent = '➕ 心算快答';
            descEl.textContent = `请计算：${a} ${op} ${b} = ?`;
            hintEl.textContent = '输入整数答案后提交';
            inputEl.placeholder = '例如：42';
        } else if (challengeType === 'captcha') {
            const beasts = ['龙', '凤', '虎', '龟', '麒'];
            const target = beasts[this.randomInt(0, beasts.length - 1)];
            const symbols = Array.from({ length: 10 }, () => beasts[this.randomInt(0, beasts.length - 1)]);
            const answer = symbols.filter((s) => s === target).length;

            this.currentChallenge = 'captcha';
            this.currentChallengeAnswer = String(answer);
            this.currentChallengeMeta = { target, symbols };

            titleEl.textContent = '🧩 神兽验证码';
            descEl.textContent = `验证码：${symbols.join(' ')} | 目标：统计“${target}”出现次数`;
            hintEl.textContent = '输入出现次数（整数）';
            inputEl.placeholder = '例如：3';
        } else if (challengeType === 'twentyFour') {
            const puzzlePool = [
                [3, 3, 8, 8],
                [2, 3, 4, 6],
                [1, 5, 5, 5],
                [4, 4, 10, 10],
                [2, 7, 7, 8],
            ];
            const nums = puzzlePool[this.randomInt(0, puzzlePool.length - 1)];

            this.currentChallenge = 'twentyFour';
            this.currentChallengeAnswer = '24';
            this.currentChallengeMeta = { nums };

            titleEl.textContent = '♠️ 快算24';
            descEl.textContent = `请用数字 ${nums.join(', ')} 各一次，输入等于24的表达式`;
            hintEl.textContent = '可用 + - * / ()，例如：(8/(3-8/3))';
            inputEl.placeholder = '输入表达式，例如：(8/(3-8/3))';
        } else {
            return;
        }

        inputEl.value = '';
        submitBtn.disabled = false;
        skipBtn.disabled = false;
        inputEl.focus();
    }

    isValidTwentyFourExpression(expr, nums) {
        if (!expr || !nums) return false;

        const sanitized = expr.replace(/\s+/g, '');
        if (!/^[0-9+\-*/()\.]+$/.test(sanitized)) return false;

        const tokens = sanitized.match(/\d+/g) || [];
        if (tokens.length !== nums.length) return false;

        const tokenNums = tokens.map((x) => Number(x)).sort((a, b) => a - b);
        const targetNums = [...nums].sort((a, b) => a - b);
        for (let i = 0; i < targetNums.length; i++) {
            if (tokenNums[i] !== targetNums[i]) {
                return false;
            }
        }

        try {
            const value = Function(`"use strict"; return (${sanitized});`)();
            return Number.isFinite(value) && Math.abs(value - 24) < 1e-6;
        } catch {
            return false;
        }
    }

    submitCalibrationAnswer() {
        const inputEl = document.getElementById('challengeInput');
        const submitBtn = document.getElementById('challengeSubmitBtn');
        const skipBtn = document.getElementById('challengeSkipBtn');

        if (!inputEl || !submitBtn || !skipBtn) return;
        if (!this.currentChallenge) {
            if (this.isCalibrationPageActive()) {
                this.startCalibrationChallenge();
            }
            return;
        }

        const userAnswer = inputEl.value.trim();
        if (!userAnswer) {
            return;
        }

        let correct = false;
        if (this.currentChallenge === 'twentyFour') {
            correct = this.isValidTwentyFourExpression(userAnswer, this.currentChallengeMeta?.nums);
        } else {
            correct = userAnswer === this.currentChallengeAnswer;
        }

        if (correct) {
            this.calibrationStreak += 1;

            const baseFix = this.randomInt(this.fixBugMin, this.fixBugMax);
            const streakBonus = this.calibrationStreak >= 3 ? this.fixStreakBonus : 0;
            const pressureRatio = this.bugSoftCapacity > 0 ? this.bugCount / this.bugSoftCapacity : 0;
            const pressureBonus = Math.floor(Math.max(0, pressureRatio - 1) * this.fixPressureScale * baseFix);
            const totalFix = baseFix + streakBonus + pressureBonus;

            const oldBug = this.bugCount;
            this.bugCount = Math.max(0, this.bugCount - totalFix);
            this.lastCalibrationFix = oldBug - this.bugCount;
            this.addBottomEventLog(`校准完成，修复 Bug -${this.lastCalibrationFix.toFixed(0)}`, 'success');
        } else {
            this.calibrationStreak = 0;
            this.lastCalibrationFix = 0;
            this.addBottomEventLog('校准失败，未修复 Bug', 'warning');
        }

        submitBtn.disabled = true;
        skipBtn.disabled = true;
        this.currentChallenge = null;
        this.currentChallengeAnswer = null;
        this.currentChallengeMeta = null;
        inputEl.value = '';

        if (this.isCalibrationPageActive()) {
            this.startCalibrationChallenge();
        }
    }

    skipCalibrationChallenge() {
        const submitBtn = document.getElementById('challengeSubmitBtn');
        const skipBtn = document.getElementById('challengeSkipBtn');
        const inputEl = document.getElementById('challengeInput');

        if (!submitBtn || !skipBtn || !inputEl) return;
        if (!this.currentChallenge) {
            if (this.isCalibrationPageActive()) {
                this.startCalibrationChallenge();
            }
            return;
        }

        const pressureRatio = this.bugSoftCapacity > 0 ? this.bugCount / this.bugSoftCapacity : 0;
        const penalty = Math.ceil(this.skipBugPenaltyBase + Math.max(0, pressureRatio - 1) * this.skipBugPenaltyPressureScale);

        const oldBug = this.bugCount;
        this.bugCount = Math.min(this.bugHardCapacity, this.bugCount + penalty);
        const actualPenalty = this.bugCount - oldBug;

        this.calibrationStreak = 0;
        this.lastCalibrationFix = 0;
        this.addBottomEventLog(`跳过校准，Bug +${actualPenalty.toFixed(0)}，连胜重置`, 'warning');

        submitBtn.disabled = true;
        skipBtn.disabled = true;
        this.currentChallenge = null;
        this.currentChallengeAnswer = null;
        this.currentChallengeMeta = null;
        inputEl.value = '';

        if (this.isCalibrationPageActive()) {
            this.startCalibrationChallenge();
        }
    }

    updateCalibrationUI() {
        const statusEl = document.getElementById('calibrationStatus');
        if (statusEl) {
            statusEl.textContent = `当前Bug: ${Math.floor(this.bugCount)} | SoftCap: ${Math.floor(this.bugSoftCapacity)} | HardCap: ${Math.floor(this.bugHardCapacity)} | 连胜: ${this.calibrationStreak}`;
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
        
        // 右侧ARPU与核心收益计算保持一致（包含研发修正）
        document.getElementById('rightArpu').textContent = `$${this.cachedStats.arpu.toFixed(2)}`;
        
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

        // 更新校准面板
        this.updateCalibrationUI();

        // 研发按钮状态依赖实时资金和前置条件，做增量刷新避免重建DOM打断点击
        this.updateResearchButtonStates();

        // 更新研发进度条（实时更新）
        this.updateDevelopmentProgress();
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
