import { IEngineer, GameDefinition, SkeletonContext } from '../../../core/domain/types.js';
import { callAI } from './ai-client.js';

export class EngineerService implements IEngineer {
    async generate(
        skeletonContext: SkeletonContext,
        expandedDesign: string
    ): Promise<GameDefinition> {
        console.log('[ENGINEER] ========== Code Generation Started ==========');
        console.log('[ENGINEER] Skeleton:', skeletonContext.name, `(${skeletonContext.id})`);
        console.log('[ENGINEER] Design length:', expandedDesign.length, 'chars');

        const gameDesignContext = `
Game Type: ${skeletonContext.name}
${skeletonContext.systemPromptAddon ? `\n=== specific Skeleton Guidelines ===\n${skeletonContext.systemPromptAddon}\n` : ''}

=== Detailed Design ===
${expandedDesign}
`;

        const prompt = `
你是专业游戏工程师。根据以下游戏设计，生成完整、可玩、无BUG的 HTML5 Canvas 游戏代码。

=== 游戏设计 ===
${gameDesignContext}

=== 代码结构规范 ===

⚠️ CRITICAL RULE: width 和 height 参数的作用域
- init(state, width, height)  ✅ 可用 width/height
- update(state, input, deltaTime)  ❌ 上下文中没有 width/height，必须使用 state.width/state.height
- draw(state, ctx, width, height)  ✅ 可用 width/height

必须返回以下接口对象：

=== 必须遵守的代码结构 ===
1. **init(state, width, height)**:
   - 必须保存 width 和 height 到 state (state.width = width) 供 update 使用。
   - 初始化场景 (MENU)、分数、游戏对象等。
2. **update(state, input, deltaTime)**:
   - 处理输入 (input.isDown) 和业务逻辑。
   - 严禁使用全局 width/height，必须使用 state.width。
3. **draw(state, ctx, width, height)**:
   - 使用 ctx 绘制每一帧。
   - 必须处理 MENU, PLAYING, GAMEOVER 三种状态的渲染。

=== 核心状态管理 (State) ===
state 对象建议包含:
- width, height: 画布尺寸 (必须)
- scene: 当前场景 ('MENU', 'PLAYING', 'GAMEOVER')
- game: 游戏主逻辑实例 (建议使用 class Game 封装)
- score: 分数
- wasDown: 用于检测点击

=== 代码质量要求 ===

✅ 必须实现：
1. 三个游戏场景：开始菜单(MENU)、游戏进行(PLAYING)、游戏结束(GAMEOVER)
2. 清晰的操作提示（必须显示在屏幕上，如"按WASD移动"）
3. 点击事件检测（通过 isDown 状态变化判断）
4. Canvas 尺寸保存到 state（供 update 使用）

❌ 必须避免的错误：
1. **作用域错误**：在 update 方法中直接使用 width/height（必须用 state.width/state.height）
2. **数组越界**：访问 array[y][x] 前必须检查 y < array.length && x < array[y].length
3. **除零错误**：计算 v/length 前检查 length > 0 或 length !== 0
4. **无限循环**：使用 while/for 循环必须有明确的退出条件或计数器限制
5. **未初始化变量**：所有 state 属性必须在 init 中初始化
6. **输入处理错误**：不要假设 input.clicked 存在，必须自己检测 isDown 变化
7. **DOM访问**：严禁在代码中使用 document, window, canvas, context 等全局对象。绘图必须使用 draw 方法的 ctx 参数。
8. **外部资源**: 严禁加载本地或网络图片/音频 (如 new Image, new Audio)。所有视觉效果必须使用 Context2D API (rect, arc, lineTo) 纯代码绘制。
9. **私自循环**: 严禁使用 requestAnimationFrame, setInterval, setTimeout 来驱动游戏循环。必须依赖传入的 update 方法。

=== 视觉规范 ===

强制配色方案（霓虹赛博朋克风格）：
- 墙壁/障碍物：青色 #00ffff
- 危险/陷阱/敌人：黄色 #ffff00 或 品红 #ff00ff
- 目标/奖励/出口：品红 #ff00ff 或 青色 #00ffff
- 玩家：白色 #ffffff
- 背景：深色 #0a0a0a 或 #000033

绘制技巧：
- 使用 ctx.shadowBlur 和 ctx.shadowColor 制造发光效果
- 使用渐变色 createLinearGradient/createRadialGradient 增强视觉
- 使用透明度 rgba() 制造深度感

=== 边界检查规范 ===
- **数组访问**: 访问 array[y][x] 前，必须检查 y 和 x 是否在合法范围内。
- **数学计算**: 做除法前检查除数是否为0。计算向量长度归一化时要处理零向量情况。
- **坐标限制**: 确保实体坐标限制在 Canvas 范围内 (clamp)。

=== 输出格式 ===

请严格按照以下格式输出（不要用 Markdown 包裹整个回复）：

TITLE: 游戏标题（中文，5-12字）
DESCRIPTION: 简短描述游戏玩法和操作方式（中文，一句话，30字以内）
CODE:
\`\`\`javascript
"use strict";

// 1. 定义游戏常量 (颜色, 速度, 配置等)
// 建议使用 const CONSTANTS = { ... }

// 2. 定义游戏逻辑类 (Game, Player, Enemy 等)
// 建议使用 class 结构组织代码

// 3. 返回核心接口对象
return {
  init: (state, width, height) => {
    // 保存宽高: state.width = width;
    // 初始化状态: state.scene, state.score, state.game
  },
  
  update: (state, input, deltaTime) => {
    // 场景切换逻辑 (MENU -> PLAYING -> GAMEOVER)
    // 游戏循环更新
  },
  
  draw: (state, ctx, width, height) => {
    // 绘制背景
    // 根据场景绘制不同内容
  }
};
\`\`\`

=== 自检清单（生成代码前自查）===

在输出代码前，请确认：
- [ ] init 方法中保存了 state.width 和 state.height
- [ ] update 方法中使用 state.width 而非直接用 width
- [ ] 实现了 MENU、PLAYING、GAMEOVER 三个场景
- [ ] 屏幕上显示了操作提示文字
- [ ] 所有数组访问前都检查了边界
- [ ] 所有除法前都检查了除数不为零
- [ ] 没有使用 eval、document、window、Image、Audio
- [ ] 没有使用 setTimeout、setInterval、requestAnimationFrame
- [ ] 使用了霓虹配色方案（青色/品红/黄色）
- [ ] 代码使用 "use strict" 模式`;

        console.log('[ENGINEER] Calling AI for code generation...');
        const startTime = Date.now();

        try {
            const contentRaw = await callAI([
                {
                    role: 'system',
                    content: 'You are an expert game engineer. You create complete, playable HTML5 Canvas games. return a single code block.'
                },
                { role: 'user', content: prompt }
            ]);

            const elapsed = Date.now() - startTime;
            console.log('[ENGINEER] AI response received in', elapsed, 'ms');

            // Clean content
            let content = contentRaw.trim();
            // Remove wrapping markdown if present (whole block)
            if (content.startsWith('```')) {
                content = content.replace(/^```[a-z]*\n/, '').replace(/```$/, '');
            }

            console.log('[ENGINEER] Parsing game definition (Text Format)...');

            // Parse using Regex
            const titleMatch = content.match(/TITLE:\s*(.+)/);
            const descMatch = content.match(/DESCRIPTION:\s*(.+)/);
            // Match code block: Look for CODE: followed by optional whitespace and markdown code block
            const codeMatch = content.match(/CODE:[\s\S]*?```(?:javascript|js)?\s*([\s\S]*?)```/);

            if (!titleMatch || !descMatch || !codeMatch) {
                console.error('[ENGINEER] Parse Failed. Content:', content.substring(0, 200) + '...');
                throw new Error('Failed to parse AI response. Expected format: TITLE, DESCRIPTION, CODE block.');
            }

            const gameDef: GameDefinition = {
                title: titleMatch[1].trim(),
                description: descMatch[1].trim(),
                code: codeMatch[1].trim()
            };

            // Validate result
            if (!gameDef.title || !gameDef.description || !gameDef.code) {
                throw new Error('Invalid game definition: missing required fields');
            }

            console.log('[ENGINEER] Game title:', gameDef.title);
            console.log('[ENGINEER] code length:', gameDef.code.length, 'chars');

            // Basic validation
            if (gameDef.code.length < 100) {
                console.warn('[ENGINEER] Warning: code is very short');
            }
            if (!gameDef.code.includes('return {')) {
                console.warn('[ENGINEER] Warning: code might be missing return statement');
            }

            console.log('[ENGINEER] ========== Code Generation Complete ==========');

            return gameDef;

        } catch (error: any) {
            console.error('[ENGINEER] ========== Code Generation Failed ==========');
            console.error('[ENGINEER] Error:', error.message);
            throw error;
        }
    }
}
