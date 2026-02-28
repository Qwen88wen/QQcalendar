# 计算新增逻辑审查（工资/价格/分组）

## 现状结论

当前“新增后的计算链路”已经形成闭环：
- 新增/编辑记录时会先解析工作类型与单位，再回填 `customer_price` / `worker_price`；
- 报表按 `salary_group` 与日期筛选后进入工资计算；
- 普通工种按人数平分，`POISON` 按每人独立计价；
- 可导出 CSV 汇总与明细。

整体可用，但仍有几类关键漏洞会导致“错算、漏算、归档偏差”。

## 运行机制（从录入到报表）

1. **录入阶段（InputBar）**
   - 新增记录时通过 `resolveDiaryPrices` 自动解析价格，并把价格快照写入 `diaries`（`customer_price` / `worker_price`）。
   - `salary_group` 默认取客户主档；若客户没配置，回落 `TongHuat`。
   - 录入时允许选择状态 `complete` / `incomplete`，并写入 `created_at`。

2. **编辑阶段（DiaryModal）**
   - 编辑保存时会再次调用 `resolveDiaryPrices` 重算价格并覆盖记录中的价格字段。

3. **报表阶段（SalaryReport + calculateSalary）**
   - 先按 `salary_group` 过滤。
   - 再按日期范围（`created_at`）和可选工人过滤。
   - 统计所有状态记录（`complete` + `incomplete`）。
   - 普通工种：数量和小计按“分”为单位做整数拆分，减少浮点误差。
   - `POISON`：每个工人按整笔数量独立计算；若无数量，则按单价记 1 笔。


## 各类工作类型 / 单位备注的计算方式检查

当前代码里，**真正影响“是否平分”** 的规则已经被显式抽到 `getSalaryCalcMode(workType, unit)`：

- `POISON`（DAY / HALF DAY）=> `PER_WORKER`（每位工人独立算）
- 其他工种（HARVEST / PRUNNING / FERTILIZE / SEEDLING / SAND/ STONE / WELDING / BUILDING HOUSE）=> `SHARED_BY_WORKERS`（按人数平分）

也就是说：
- 目前“不同薪资计算方式”**存在**，但只有一类特殊分支（POISON）。
- 单位备注（remark）目前主要用于价格匹配（`tag + unit`），还没有对平分策略做单位级差异化（例如 JOB 是否按单计，不平分）。

### 检查结论（按工作类型）

| 工作类型 | 单位 | 当前计算方式 | 备注 |
|---|---|---|---|
| HARVEST | TON | SHARED_BY_WORKERS | 多人时数量/金额平分 |
| PRUNNING | EKAR / POKOK / JOB | SHARED_BY_WORKERS | JOB 目前仍平分 |
| FERTILIZE | BAG / EKAR / JOB | SHARED_BY_WORKERS | JOB 目前仍平分 |
| POISON | DAY / HALF DAY | PER_WORKER | 每位工人按整笔数量计算；缺数量按单价1笔 |
| SEEDLING | POKOK | SHARED_BY_WORKERS | 平分 |
| SAND/ STONE | TON / JOB | SHARED_BY_WORKERS | JOB 目前仍平分 |
| WELDING | JOB | SHARED_BY_WORKERS | JOB 目前仍平分 |
| BUILDING HOUSE | JOB | SHARED_BY_WORKERS | JOB 目前仍平分 |

### 发现的潜在业务偏差

如果你们业务里存在以下规则，当前实现会偏差：
- 某些 `JOB` 要按“每人固定一笔”而不是平分；
- 某些单位需要“按人头计件”而非按总数量拆分；
- 某些类型在缺数量时不应计薪。

建议把 `getSalaryCalcMode` 扩展成“工种 + 单位”的可配置映射（甚至落库），而不是只判断 `POISON`。

## 漏洞与风险清单

### 1) 时区边界判定存在偏差风险（高）

- 已将薪资日期过滤与明细日期展示统一为马来西亚时区（UTC+8 / `Asia/Kuala_Lumpur`）日界。
- 可避免月末/月初跨天归档偏差，提升对账一致性。

### 2) 编辑会覆盖历史价格快照（中）

- 编辑默认会按规则重算价格，但现在支持在新增与编辑手动输入工资单价，减少特殊工种漏算。
- 仍建议后续补齐“价格冻结/显式重算”策略，增强审计一致性。

**建议**
- 价格字段改为“**写入后默认冻结**”：
  - 新增时写快照；
  - 编辑时若用户未显式修改价格，不自动重算覆盖；
  - 提供“按最新主档重算”按钮，显式触发并写入操作日志。

### 3) 工人字符串匹配脆弱，可能漏算（中）

- 工人以字符串 `"a, b"` 存储，计算时按分隔符切分并直接 `includes` 匹配。
- 受空格、别名、大小写、重名影响，筛选与汇总容易漏算或串人。

**建议**
- 结构化存储为 `worker_ids: string[]`（或子表 `diary_workers`）。
- 计算与筛选全部基于 ID，展示再映射名称。

### 4) 普通工种“无数量直接跳过”，存在静默漏算（中）

- 非 `POISON` 且数量无效时 `continue`，报表不会出现，也没有告警。
- 实务上这类通常是录入缺失，应可追踪。

**建议**
- 在报表侧提供“异常记录”面板（如：缺数量/缺单价/无工人）。
- 或返回 `warnings[]` 给 UI，显式提示“有 N 条记录未纳入计算”。

### 5) 分组默认回落 TongHuat，存在误分组风险（中）

- 新增时客户无默认分组会直接落到 `TongHuat`。
- 若用户忘记维护客户主档，会把本应归 AhSeng 的工单算到 TongHuat。

**建议**
- 客户未配置分组时禁止提交，或弹窗强制选择。
- 后端加约束：`salary_group` 非空，且仅允许枚举值。

### 6) 单位依赖 remark 文本，易被自由输入污染（中）

- 价格解析依赖 `remark` -> `normalizeUnit`，若 remark 被写成非标准值就无法命中价格。

**建议**
- 单位拆成独立字段 `unit`（枚举），`remark` 仅作备注。
- 价格匹配使用 `tag + unit`，不再依赖自由文本。

### 7) POISON 的“无数量按 1 笔单价”规则需业务确认（低~中）

- 当前逻辑：`POISON` 无数量仍计一笔 `unitPrice`。
- 若业务并非“按次计价”，会产生系统性高估/低估。

**建议**
- 把该规则显式配置化（例如 `poison_missing_qty_policy = PER_JOB | REQUIRE_QTY`）。
- UI 文案明确提示该规则，避免操作员误解。

## 完整性判断

- **功能完整性**：基础闭环已完整（录入 → 价格解析 → 分组过滤 → 工资计算 → 导出）。
- **财务完整性**：尚不完整，关键缺口在“时区边界、价格快照冻结、异常可视化、结构化主数据引用”。

## 优化优先级（建议落地顺序）

1. **P0**：冻结历史价格快照 + 提供显式重算入口。
2. **P0**：改用 `work_date` 进行业务日核算，消除时区边界误差。
3. **P1**：工人/车辆改为 ID 结构化存储，去除字符串拆分依赖。
4. **P1**：异常记录可视化（漏算透明化）。
5. **P2**：单位独立枚举字段化，`remark` 去语义化。
6. **P2**：分组配置校验前置（录入强校验 + 后端约束）。

---

如果你要，我下一步可以直接给你一版“最小改动实施方案”（不改库 or 小改库两套），并附迁移脚本草案与回滚策略。
