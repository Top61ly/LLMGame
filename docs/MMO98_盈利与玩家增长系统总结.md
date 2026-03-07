# MMO98 盈利与玩家增长系统

## 一、玩家增长 (Player Growth)

**入口**: `GrowthSimulation.cs:25`

```
总增长 = 粉丝增长 + 玩家增长
```

### 1. 粉丝增长 (CalculateFansGain)

```
粉丝增长 = 粉丝总数 / 发售宣传期(LaunchDuration)
```

- 发售初期才有，宣传活动结束后归零

### 2. 玩家增长 (CalculatePlayersGain)

**核心公式**:
```
玩家增长 = 玩家增长率 × Hype × 市场饱和抵抗 × 负载系数
```

#### 各因子详解

| 因子 | 计算方式 |
|------|----------|
| **玩家增长率** | `ModifierType.PlayersGrowthRate` |
| **Hype** | 基础值 + 低负载奖励 - Ping影响 - Bug影响 |
| **市场饱和抵抗** | `1 / (1 + (玩家数/市场容量)²)` |

**市场容量计算** （Database.cs:112-115）:
```
市场容量 = 基础容量 × (发售数 × 续作修正因子) + 数据中心数 × 数据中心容量
```

**各参数详解**:
| 参数 | 来源 | 说明 |
|------|------|------|
| 基础容量 | `MarketCapacity` | 基础市场容量 modifier |
| 发售数 | `Database.Studio.Releases` | 已发售的游戏数量 |
| 续作修正因子 | `MarketCapacitySequelModifier` | 每款续作对市场的增量影响 |
| 数据中心数 | `Database.Datacenters.Details.Count` | 建造的数据中心数量 |
| 数据中心容量 | `MarketCapacityDatacenter` | 每个数据中心增加的容量 |

**逻辑**:
- 发售游戏越多，市场越大（游戏影响力扩散）
- 数据中心提供额外容量（基础设施投资）

**负载衰减机制** （GrowthSimulation.cs:54-58）:
- **负载 ≤ 软容量**: 无衰减，返回基础增长
- **软容量 < 负载 < 硬容量**: 使用 **SmoothStep曲线** 平滑衰减 (非线性)
- **负载 ≥ 硬容量**: 增长为0

---

## 二、Hype 系统详解

**文件**: `HypeSimulation.cs`

```
目标Hype = 基础Hype + 低负载奖励 - Ping影响 - Bug影响
实际Hype = MoveTowards(实际Hype, 目标Hype, 变化速度 × 时间)
```

### Hype各个修正项

#### 1. 低负载奖励 (CalculateLowLoadBonus)
```
负载 < 0.5 时: +HypeLowLoadBonus
负载 ≥ 0.5 时: +0
```

#### 2. Ping影响 (CalculatePingImpact) ⚠️ 最复杂
三阶段计算：
```
区间 1: Ping ≤ MinorTolerance
  → 从 +HypePingLowBonus 线性递减到 0
  
区间 2: MinorTolerance < Ping ≤ MajorTolerance  
  → 从 0 线性递增到 -HypePingMinorImpact
  
区间 3: Ping > MajorTolerance
  → -HypePingMinorImpact - (Ping - MajorTolerance) / HypePingMajorImpact
  (快速恶化，可能出现严重负值)
```

#### 3. Bug影响系统 (CalculateBugImpact)

**文件**: `BugSimulation.cs`, `HypeSimulation.cs`

##### 3.1 Bug产生机制 (BugSimulation.cs:27-47)

**Bug生成公式**:
```
BugGenerationRate = [BaseRate + PlayerScaling] × LoadMultiplier × Resistance

其中:
BaseRate = ModifierType.BugsGenerationRate (基础Bug生成速率)
PlayerScaling = log10(玩家数) × BugsPlayerScaling (玩家规模影响)
LoadMultiplier = 0.5 + Load (服务器负载影响, Load为0~1)
Resistance = 1 / (1 + (Bugs/SoftCap)³) (软上限抵抗机制)

每秒Bug增量:
Database.Resources.Bugs += BugGenerationRate × deltaTime
```

**关键特性**:
- 玩家数量越多，Bug产生越快（对数增长）
- 服务器负载越高，Bug产生越多（负载0时为50%基础速率）
- Bug接近软上限时，生成速率显著下降（三次方阻力）

##### 3.2 Bug容量限制 (Database.cs:130-140)

```
BugSoftCapacity = BugsSoftCapBase + log10(max(1, 玩家数)) × BugsSoftCapScaling
BugHardCapacity = BugSoftCapacity × BugsHardCapModifier

行为:
- Bugs > BugHardCapacity: 完全停止Bug生成
- Bugs接近SoftCap: 生成速率按Resistance衰减
```

**动态容量**: Bug容量随玩家规模自动增长，大型游戏允许更多Bug存在

##### 3.3 Bug减少方式

**方式1: Debugger修复** (DebuggerDatabase.cs:112)
```
修复量 = StagedHexes数量 × DebuggerHexBugWorth
Database.Resources.Bugs -= 修复量
```

**方式2: Hotfix临时加速** (BugSimulation.cs:37-40)
```
Hotfix后触发BonusDecayTimer:
- 持续时间: DebuggerHotfixBonusDuration
- 衰减速率: DebuggerHotfixBonusDecayRate
- 效果: BugRate = max(0, BugRate - BonusDecayRate)
```

##### 3.4 Bug对Hype的两阶段影响 (HypeSimulation.cs:56-64)

**核心公式**:
```csharp
float threshold = BugSoftCapacity × HypeBugBonusThreshold;

if (Bugs <= threshold) {
    // 阶段1: 奖励区 - Bug少增加Hype
    impact = (1 - Bugs/threshold) × HypeBugBonus;
} else {
    // 阶段2: 惩罚区 - Bug多降低Hype (二次方惩罚)
    pressure = (Bugs / HypeBugTolerance)²;
    impact = -pressure × HypeBugPenalty;
}
```

**阶段1: Bug奖励区** (Bugs ≤ Threshold)
```
Threshold = BugSoftCapacity × HypeBugBonusThreshold

Bugs = 0              → impact = +HypeBugBonus (100%奖励)
Bugs = 0.5×Threshold  → impact = +0.5×HypeBugBonus (50%奖励)
Bugs = Threshold      → impact = 0 (临界点)

设计理念: 适度低Bug体现游戏质量稳定，增加玩家信心
```

**阶段2: Bug惩罚区** (Bugs > Threshold)
```
压力函数 Pressure(value, softCap) = (value / softCap)²

Bugs = HypeBugTolerance   → pressure = 1.00 → impact = -HypeBugPenalty
Bugs = 2×HypeBugTolerance → pressure = 4.00 → impact = -4×HypeBugPenalty
Bugs = 3×HypeBugTolerance → pressure = 9.00 → impact = -9×HypeBugPenalty

警告: Bug超过容忍度后，Hype惩罚呈指数级恶化！
```

**影响图示**:
```
Hype Impact
    ↑
 +Bonus|     ●●●●●●
        |   ●        ●
        | ●            ●
      0 |_______________●_______________ Bugs
        |                ●
        |                  ●●
        |                    ●●●
 -Penalty|                      ●●●●●●●
        |                            (急剧下降)
        └─────┬─────────┬─────────────→
          奖励区    临界点    惩罚区
```

**HypeSimulation最终计算** (HypeSimulation.cs:19-24):
```
TargetHype = ModifierType.Hype 
           + CalculateLowLoadBonus()    // 低负载奖励
           - CalculatePingImpact()      // Ping影响
           - CalculateBugImpact()       // Bug影响 (可为负=奖励)

TargetHype = Clamp(TargetHype, HypeMinimum, HypeMaximum)
Hype = MoveTowards(Hype, TargetHype, HypeChangeSpeed × deltaTime)
```



## 三、盈利计算 (Revenue)

**入口**: `GrowthSimulation.cs:30-34`

```
每秒收入 = 每秒玩家增长 × 单价 × 收入乘数 × 双倍概率

```csharp
int num = (Random.value <= SellDoubleChance) ? 2 : 1;
收入 = 玩家增长 × PricePerCopy × RevenueMultiplier × num
```

| 参数 | 说明 |
|------|------|
| `PricePerCopy` | 每份游戏单价 |
| `RevenueMultiplier` | 收入乘数修正 |
| `SellDoubleChance` | 双倍出售概率 |

---

## 四、完整系统流程图

```
用户升级与研究
     ↓
Modifier参数更新
     ↓
┌──────────────────────────────────────────────────────────────┐
│                  Hype值计算 (每帧更新)                        │
│  TargetHype = 基础 + 低负载奖励 - Ping影响 - Bug影响         │
│  Hype = MoveTowards(Hype, TargetHype, ...)                    │
└──────────────────────────────────────────────────────────────┘
     ↓
┌──────────────────────────────────────────────────────────────┐
│                玩家增长计算 (GrowthSimulation)               │
│  基础增长 = PlayersGrowthRate × Hype × Resistance           │
│                                                              │
│  ┌─ 市场饱和抵抗 (Resistance) ──────────────────────────┐   │
│  │ 公式: Resistance = 1 / (1 + (玩家数/市场容量)²)      │   │
│  │                                                      │   │
│  │ 玩家数=0        → Resistance = 1.0 (最大)           │   │
│  │ 玩家数=市场容量  → Resistance = 0.5                  │   │
│  │ 玩家数=2×容量    → Resistance = 0.2                 │   │
│  │ 玩家数=10×容量   → Resistance ≈ 0.01                │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─ 检查负载 ─────────────────────────────────────────┐    │
│  │ Load ≤ SoftCap      → 返回基础增长 (无衰减)        │    │
│  │ SoftCap < Load < HC → SmoothStep平滑衰减           │    │
│  │ Load ≥ HardCap      → 返回 0 (无增长)              │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  结果: PlayersPerSecond                                      │
│  累计: Players += PlayersPerSecond × deltaTime              │
└──────────────────────────────────────────────────────────────┘
     ↓
┌──────────────────────────────────────────────────────────────┐
│                  收入计算 (同步执行)                          │
│  MoneyPerSecond = PlayersPerSecond × PricePerCopy           │
│                   × RevenueMultiplier × DoubleChance        │
│  Money += MoneyPerSecond × deltaTime                        │
│  MoneyLifetime += 增量                                      │
└──────────────────────────────────────────────────────────────┘
```

---

## 五、关键Modifier参数汇总

| 类型 | 参数 | 作用 |
|------|------|------|
| **玩家** | `PlayersGrowthRate` | 玩家增长率 |
| **市场** | `MarketCapacity` | 基础市场容量 |
| **市场** | `MarketCapacitySequelModifier` | 续作对市场的影响 |
| **市场** | `MarketCapacityDatacenter` | 每个数据中心增加的容量 |
| **收入** | `PricePerCopy` | 游戏单价 |
| **收入** | `RevenueMultiplier` | 收入乘数 |
| **收入** | `SellDoubleChance` | 双倍出售概率 |
| **Hype 基础** | `Hype` | 基础Hype值 |
| **Hype** | `HypeMinimum` | Hype最小值 (下限) |
| **Hype** | `HypeMaximum` | Hype最大值 (上限) |
| **Hype** | `HypeChangeSpeed` | Hype变化速度 |
| **Hype-低负载** | `HypeLowLoadBonus` | 负载 < 0.5 的奖励 |
| **Hype-Ping** | `HypePingMinorTolerance` | Ping容忍度 (低) |
| **Hype-Ping** | `HypePingMajorTolerance` | Ping容忍度 (高) |
| **Hype-Ping** | `HypePingLowBonus` | 低Ping奖励值 |
| **Hype-Ping** | `HypePingMinorImpact` | 中等Ping惩罚 |
| **Hype-Ping** | `HypePingMajorImpact` | 高Ping惩罚 (增速) |
| **Hype-Bug** | `HypeBugBonusThreshold` | Bug奖励区阈值比例 (相对SoftCap) |
| **Hype-Bug** | `HypeBugBonus` | Bug低时的Hype奖励值 |
| **Hype-Bug** | `HypeBugTolerance` | Bug容忍度 (压力函数的软上限) |
| **Hype-Bug** | `HypeBugPenalty` | Bug惩罚系数 (乘以pressure) |
| **Bug生成** | `BugsGenerationRate` | Bug基础生成速率 |
| **Bug生成** | `BugsPlayerScaling` | 玩家数对Bug生成的影响系数 |
| **Bug容量** | `BugsSoftCapBase` | Bug软上限基础值 |
| **Bug容量** | `BugsSoftCapScaling` | Bug软上限玩家数缩放系数 |
| **Bug容量** | `BugsHardCapModifier` | Bug硬上限倍数 (相对SoftCap) |
| **Debugger** | `DebuggerHexBugWorth` | 每个Hex修复的Bug数量 |
| **Debugger** | `DebuggerHotfixBonusDuration` | Hotfix奖励持续时间 |
| **Debugger** | `DebuggerHotfixBonusDecayRate` | Hotfix奖励衰减速率 |
| **负载** | `LoadSoftCapacity` | 负载软容量 |
| **负载** | `LoadHardCapacity` | 负载硬容量 |
| **服务器** | `NodeCapacity` | 每个节点的玩家容量 |

---

## 五、Modifier参数来源

Modifier值由以下途径提供:

1. **升级 (Upgrades)** - 购买科技树升级
2. **研究 (Research)** - 研究项目
3. **运营活动 (Operations)** - 运营活动效果
4. **默认值** - `ModifierDefaults.asset` 资源文件

---

## 六、影响因素总结

### 增加收入的方法

1. 提升 `PricePerCopy` - 涨价
2. 提升 `RevenueMultiplier` - 购买升级/研究
3. 增加 `SellDoubleChance` - 提升双倍概率
4. 增加 `PlayersGrowthRate` - 提升增长率
5. 提升 `Hype` - 降低Bug、减少Ping延迟
   - **保持Bug低于奖励阈值** (< BugSoftCapacity × HypeBugBonusThreshold) 获得Hype加成
   - **及时使用Debugger修复Bug** 防止Hype惩罚指数级恶化
   - **使用Hotfix临时减缓Bug生成** 应急管理Bug累积
6. 增加 `MarketCapacity` - 扩充数据中心
7. 增加发售游戏数量
8. 避免服务器超载

---

## 七、核心代码位置

| 功能 | 文件 | 行号 |
|------|------|------|
| 玩家增长主循环 | GrowthSimulation.cs | 19-35 |
| 粉丝增长计算 | GrowthSimulation.cs | 38-46 |
| 玩家增长计算 | GrowthSimulation.cs | 49-61 |
| 负载衰减 (SmoothStep) | GrowthSimulation.cs | 54-58 |
| 收入计算 | GrowthSimulation.cs | 64-68 |
| Hype计算 (主) | HypeSimulation.cs | 19-24 |
| 低负载奖励 | HypeSimulation.cs | 26-32 |
| Ping影响 (3段) | HypeSimulation.cs | 34-54 |
| Bug影响 (两阶段) | HypeSimulation.cs | 56-64 |
| Bug生成主循环 | BugSimulation.cs | 19-25 |
| Bug累积计算 | BugSimulation.cs | 27-47 |
| Bug生成率计算 | BugSimulation.cs | 49-61 |
| Bug修复 (Debugger) | DebuggerDatabase.cs | 104-120 |
| Bug软上限容量 | Database.cs | 130-134 |
| Bug硬上限容量 | Database.cs | 137-140 |
| 市场容量 | Database.cs | 112-115 |
| 阻力函数 | MathUtility.cs | 48-57 |
```
