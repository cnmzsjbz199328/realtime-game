---
id: tower_defense
name: Tower Defense
description: Path-based tower defense with wave management and strategic tower placement.
---

# 游戏设计指南：塔防游戏

## 核心玩法循环
1. 敌人沿预定路径向目标移动
2. 玩家在路径旁放置防御塔
3. 防御塔自动攻击范围内的敌人
4. 击杀敌人获得金币，用于建造更多塔
5. 波次结束后，难度递增

## 典型游戏元素

### 敌人系统
- **多样性**: 快速型（低血高速）、坦克型（高血低速）、BOSS（超高血量）
- **属性**: 血量、移动速度、奖励金币
- **行为**: 沿路径移动，到达终点扣除生命值
- **视觉**: 不同类型用不同颜色/形状区分

### 防御塔系统
- **类型**: 
  - 基础炮塔（平衡型）
  - 激光塔（高攻速低伤害）
  - 导弹塔（低攻速高伤害）
  - 减速塔（辅助型）
- **属性**: 射程、伤害、攻击速度、建造成本
- **升级**: 可选功能，提升属性

### 经济系统
- 初始金币：150-400
- 击杀奖励：10-50（根据敌人类型）
- 波次奖励：100+（清完一波）
- 建造成本：50-300（根据塔类型）

### 波次管理
- 初始波次：5-10 个敌人
- 难度递增：每波敌人数量 +2-3，或引入新类型
- 间歇期：给玩家时间规划布局

## 技术实现建议

### 路径移动
使用提供的 `moveAlongPath(entity, path, speed)` 辅助函数：
```javascript
// 在敌人的 update 方法中
moveAlongPath(this, this.path, this.speed);
```

### 类设计
```javascript
// 敌人基类（继承自 GameObject）
class Enemy extends GameObject {
  constructor(path, health) {
    super(path[0].x, path[0].y, 30, 30, 'enemy');
    this.path = path;
    this.pathIndex = 0;
    this.progress = 0;
    this.health = health;
    this.speed = 1;
  }
}

// 具体敌人类型（继承自 Enemy）
class FastEnemy extends Enemy {
  constructor(path) {
    super(path, 50);
    this.speed = 3;
    this.color = '#00ff00';
  }
}
```

### 自动瞄准逻辑
```javascript
// 在塔的 update 方法中
let target = game.entities.find(e => 
  e.tag === 'enemy' && 
  e.active && 
  Math.hypot(e.x - this.x, e.y - this.y) < this.range
);
if (target) {
  game.spawn(new Bullet(this.x, this.y, target.x, target.y, this.damage));
}
```

### 用户交互
- **键盘选择**: 数字键 1/2/3 切换塔类型
- **鼠标放置**: 点击空地建造
- **路径检测**: 防止在路径上建塔

## 视觉风格建议
- **背景**: 深色（#080808）突出霓虹效果
- **路径**: 灰色轨道（#1a1a2e），宽度 40px
- **敌人**: 鲜艳颜色（#ff00ff, #00ffff, #ffff00）
- **塔**: 对比色（#ff0055, #00ff00）
- **子弹**: 白色或与塔同色，带拖尾效果
- **粒子**: 击杀时爆炸粒子（12-30 个）

## System Prompt
你正在开发一个塔防游戏。参考上述设计指南，自由实现游戏逻辑。

**关键要求**：
**关键要求**：
- **寻路与移动算法**: 必须定义路径点数组 (Waypoints)。敌人必须沿路径点移动 (Vector Math: target - current)，到达一个点后切换下一个。禁止简单的直线移动。
- **索敌算法**: 塔必须遍历敌人列表，计算欧几里得距离 (Math.hypot)，选择最近或最前的敌人攻击。
- 定义敌人、塔、子弹类（继承自 GameObject）
- 实现波次管理和经济系统
- 确保路径畅通（不在路径上建塔）
