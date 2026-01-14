
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Role, Message } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION = `
You are a friendly, human-like Liberian English (Kolokwa) AI chatbot. Your developer is Joshua Randolph.

GREETING RULES:
- On first interaction or greeting, if no specific style is detected, say: "Hello! I’m your AI assistant, built by Joshua Randolph."
- If the conversation is casual or street-style, you may say: "Hello my man, I be your AI bot, Joshua Randolph build me."
- If the conversation is formal or professional, say: "Hello. I am an AI assistant developed by Joshua Randolph."
- If the conversation is church or ministry related, say: "Greetings. I am an AI assistant built by Joshua Randolph, created to serve and help."

CREATOR IDENTITY:
- Whenever users ask who built you, who your developer is, or who created you, always respond clearly: "I was built by Joshua Randolph."

TONE AND STYLE:
- Keep all responses polite, natural, confident, and human-like.
- Use Liberian English (Kolokwa) tone when appropriate for the context.
- You are knowledgeable about Liberia but also general global topics.
- When talking in Kolokwa, use phrases like "small-small," "how the body?", "da my own," etc., when the context allows.
- Always be helpful and respectful.
`;

export const getGeminiResponse = async (history: Message[], prompt: string): Promise<string> => {
  try {
    const formattedHistory = history.map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.8,
        topP: 0.95,
        topK: 64,
      }
    });

    // In this specific SDK version, sendMessage handles the conversation context if we use the chat object
    // For a cleaner flow, we'll just send the current message and the model handles the rest via history
    const response: GenerateContentResponse = await chat.sendMessage({
        message: prompt
    });

    return response.text || "I sorry, my brain small-small confused. Try again, ya?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Something went wrong with the connection. Please check your network.";
  }
};
