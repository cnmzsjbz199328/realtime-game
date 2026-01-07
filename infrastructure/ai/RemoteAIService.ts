import { GameDefinition, IGameGenerator, ICodeFixer } from '../../core/domain/types';

interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface AIResponse {
    success: boolean;
    content?: string;
    model?: string;
    provider?: string;
    timestamp?: string;
    message?: string;
    errors?: Array<{ provider: string; error: string }>;
}

const EXTRACT_JSON_PROMPT = `
IMPORTANT: You must output ONLY valid JSON. 
Do not include markdown formatting like \`\`\`json or \`\`\`. 
Just return the raw JSON object.
`;

export class RemoteAIService implements IGameGenerator, ICodeFixer {
    private async queryLargeModel(messages: AIMessage[]): Promise<string> {
        const response = await fetch(
            '/api/ai',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages })
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const data: AIResponse = await response.json();

        if (!data.success) {
            throw new Error(`AI Error: ${data.message || 'Unknown error'}`);
        }

        return data.content!;
    }

    async generate(topic: string): Promise<GameDefinition> {
        const systemPrompt = `
      You are an autonomous Game Engine Engineer Agent. 
      Your goal is to create a playable, bug-free HTML5 Canvas mini-game based on a news topic or concept provided by the Director.
      
      Constraints:
      1. The game must be simple but fun.
      2. Use standard HTML5 Canvas API (ctx.fillStyle, ctx.fillRect, ctx.beginPath, etc.).
      3. Do NOT use external libraries or images. Use 'ctx' to draw geometric shapes (rectangles, circles) to represent game objects.
      4. The 'state' object is your memory. Persist all game data there.
      5. The 'input' object gives you mouse/touch coordinates and key states.
      6. Make the game resilient. Don't write infinite loops.
      7. Visuals: Use neon colors (cyan, magenta, lime) on dark backgrounds to fit the aesthetic.
      8. IMPORTANT: 'canvas' and 'ctx' are passed as arguments. DO NOT redeclare them (e.g. 'const canvas = ...' will crash). USE THE PROVIDED ARGUMENTS.
      9. UX REQUIREMENT: You MUST implement a 'Start Screen' and a 'Game Over Screen' with a clickable Start/Restart button region.
      10. GAMEPLAY REQUIREMENT: Default to a multi-level structure (unless user implies otherwise). Increase difficulty/speed as levels progress.

      Topic: ${topic}

      RESPONSE FORMAT:
      You must respond with a JSON object strictly matching this schema:
      {
        "title": "string",
        "description": "string",
        "setupCode": "string (JavaScript code body for setup function)",
        "updateCode": "string (JavaScript code body for update function)"
      }

      setupCode description:
      JavaScript code body for the 'setup' function. Run once. You have access to 'ctx' (CanvasRenderingContext2D), 'canvas' (HTMLCanvasElement), and a 'state' object (empty object) to store variables. Initialize your game state variables (player position, score, level, gameState='MENU', enemies array etc) here. Example: state.player = {x: 100, y: 100}; state.score = 0; state.level = 1; state.gameState = 'MENU';

      updateCode description:
      JavaScript code body for the 'update' function. Run every frame (60fps). You have access to 'ctx', 'canvas', 'state', and 'input'. 'input' has properties: x (mouse x), y (mouse y), isDown (boolean), and keys (object of booleans). 
      Structure your loop to handle state.gameState === 'MENU' (draw start button), 'PLAYING' (game logic), and 'GAMEOVER' (draw restart button).
      Clear the canvas using ctx.clearRect first. Draw the game state. Update positions. Handle collisions. If game over, set state.gameState = 'GAMEOVER'.
      
      ${EXTRACT_JSON_PROMPT}
    `;

        try {
            const content = await this.queryLargeModel([
                { role: 'user', content: systemPrompt }
            ]);
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanContent) as GameDefinition;
        } catch (error) {
            console.error("AI Generation Error:", error);
            throw error;
        }
    }

    async fix(gameDef: GameDefinition, error: string): Promise<GameDefinition> {
        const prompt = `
      The following HTML5 Canvas game code failed the QA Automated Test.
      
      Runtime Error: "${error}"
      
      Current Setup Code:
      ${gameDef.setupCode}
      
      Current Update Code:
      ${gameDef.updateCode}
      
      Task: Fix the bug in the code. 
      1. Analyze the error message.
      2. Ensure variables are initialized in 'setupCode' before usage in 'updateCode'.
      3. Ensure no logic errors (like division by zero or infinite loops).
      4. Keep the 'title' and 'description' the same (or slightly improve if needed).

      RESPONSE FORMAT:
      Return the FULL JSON object with the fixed 'setupCode' and 'updateCode':
      {
        "title": "string",
        "description": "string",
        "setupCode": "string",
        "updateCode": "string"
      }

      ${EXTRACT_JSON_PROMPT}
    `;

        try {
            const content = await this.queryLargeModel([
                { role: 'system', content: "You are a Senior Game Engineer specializing in debugging. You fix runtime errors in JavaScript Canvas games." },
                { role: 'user', content: prompt }
            ]);
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanContent) as GameDefinition;
        } catch (err) {
            console.error("AI Fix Error:", err);
            throw err;
        }
    }
}
