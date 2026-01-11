---
id: universal_minimal
name: Universal Game Template
description: Flexible template for any game type. AI defines all game-specific logic.
---

# 通用游戏开发指南

## 设计理念
这是一个**最小约束**的模板，适用于任何类型的游戏。你有完全的创作自由，只需遵循基础的引擎接口。

## 可用的基础设施

### Engine（游戏引擎）
已提供的全局对象 `game`，包含以下方法：
- `game.spawn(entity)` - 添加实体到游戏世界
- `game.shake(amount)` - 屏幕震动效果
- `game.spawnParticles(x, y, color, count)` - 生成粒子效果
- `game.playSound(name)` - 播放音效（存根实现）
- `game.input.keys[key]` - 键盘输入状态
- `game.input.mouse.x/y/down` - 鼠标输入状态

### GameObject（游戏对象基类）
所有游戏实体的基类，提供：
- 基础属性：`x, y, w, h, vx, vy, tag, active, color`
- 碰撞检测：`isColliding(other)`
- 生命周期：`update(game)`, `draw(ctx)`, `onCollision(other, game)`

## 常见游戏类型参考

### 动作游戏
- 玩家角色（移动、跳跃、攻击）
- 敌人 AI（巡逻、追击）
- 碰撞检测（伤害、拾取）

### 射击游戏
- 子弹系统（发射、移动、碰撞）
- 波次管理（敌人生成）
- 得分系统

### 益智游戏
- 网格系统（二维数组）
- 匹配逻辑（消除、合并）
- 回合制更新

### 塔防游戏
- 路径系统（敌人移动）
- 建造系统（放置塔）
- 自动瞄准（范围检测）

## 视觉设计建议
- 使用霓虹色彩（#00ffff, #ff00ff, #ffff00）
- 深色背景（#000000, #0a0a0c）
- 粒子效果增强打击感
- 屏幕震动反馈重要事件

## System Prompt
你正在开发一个游戏。你有完全的创作自由。

**可用资源**：
- `game` 对象（引擎接口）
- `GameObject` 基类（所有实体的父类）
- `state` 对象（全局状态）
- `ctx` 和 `canvas`（绘图上下文）

**关键规则**：
- 所有游戏实体应继承自 `GameObject`
- 使用 `entity.tag` 区分类型（不要用 instanceof）
- 在 `setupCode` 中定义类和初始化状态
- 在 `updateCode` 中实现每帧逻辑
- 不要重新定义 `Engine` 或 `GameObject` 类
