import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GameDefinition } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found in environment");
  return new GoogleGenAI({ apiKey });
};

const GAME_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A catchy title for the mini-game." },
    description: { type: Type.STRING, description: "Short instructions on how to play." },
    setupCode: { 
      type: Type.STRING, 
      description: "JavaScript code body for the 'setup' function. Run once. You have access to 'ctx' (CanvasRenderingContext2D), 'canvas' (HTMLCanvasElement), and a 'state' object (empty object) to store variables. Initialize your game state variables (player position, score, enemies array etc) here. Example: state.player = {x: 100, y: 100}; state.score = 0;" 
    },
    updateCode: { 
      type: Type.STRING, 
      description: "JavaScript code body for the 'update' function. Run every frame (60fps). You have access to 'ctx', 'canvas', 'state', and 'input'. 'input' has properties: x (mouse x), y (mouse y), isDown (boolean), and keys (object of booleans). Clear the canvas using ctx.clearRect first. Draw the game state. Update positions. Handle collisions. If game over, set state.gameOver = true." 
    }
  },
  required: ["title", "description", "setupCode", "updateCode"]
};

export const generateGameFromTopic = async (topic: string): Promise<GameDefinition> => {
  const ai = getClient();
  
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
    8. IMPORTANT: Ensure 'input' is checked safely.
    
    Topic: ${topic}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using Pro for better coding logic
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: GAME_SCHEMA,
        systemInstruction: "You are a creative game developer. Think about the metaphor of the news topic and translate it into game mechanics.",
        temperature: 0.5, 
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    const gameDef = JSON.parse(jsonText) as GameDefinition;
    return gameDef;

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export const fixGameCode = async (gameDef: GameDefinition, error: string): Promise<GameDefinition> => {
  const ai = getClient();
  
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
    4. Return the FULL JSON object with the fixed 'setupCode' and 'updateCode'.
    5. Keep the 'title' and 'description' the same (or slightly improve if needed).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: GAME_SCHEMA,
        systemInstruction: "You are a Senior Game Engineer specializing in debugging. You fix runtime errors in JavaScript Canvas games.",
        temperature: 0.2, // Lower temperature for precision fixes
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI during fix");

    return JSON.parse(jsonText) as GameDefinition;

  } catch (err) {
    console.error("Gemini Fix Error:", err);
    throw err;
  }
};