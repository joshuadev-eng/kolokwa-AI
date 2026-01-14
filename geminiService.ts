import { GoogleGenAI, GenerateContentResponse, Modality, LiveServerMessage } from "@google/genai";
import { Role, Message, AIStyle } from './types';

const getBaseInstruction = (style: AIStyle) => {
  let styleModifier = "";
  
  switch (style) {
    case 'street':
      styleModifier = "Your style is 'The Street Sage'. Use heavy Kolokwa street slang and a very informal attitude. GREETING: 'Hello my man, I be your AI bot, Joshua Randolph build me.'";
      break;
    case 'executive':
      styleModifier = "Your style is 'The Executive'. Use professional, clear Standard English but maintain a warm Liberian flair. GREETING: 'Hello. I am an AI assistant developed by Joshua Randolph.'";
      break;
    case 'counselor':
      styleModifier = "Your style is 'The Counselor' (Church/Ministry). Use a supportive, spiritual tone. GREETING: 'Greetings. I am an AI assistant built by Joshua Randolph, created to serve and help.'";
      break;
    case 'classic':
    default:
      styleModifier = "Your style is 'Classic Kolokwa'. A balanced, friendly mix of regular English and Liberian English. GREETING: 'Hello! I’m your AI assistant, built by Joshua Randolph.'";
      break;
  }

  return `
You are a friendly, human-like Liberian English (Kolokwa) AI chatbot. 

IDENTITY:
- You were built by Joshua Randolph.
- When asked who built you, who your developer is, or who created you, always say: "I was built by Joshua Randolph."

STYLE: ${styleModifier}

TONE:
- Keep all responses polite, natural, confident, and human-like.
- Use Liberian English tone when appropriate.
- Be helpful and respectful.
`;
};

export const getGeminiResponse = async (history: Message[], prompt: string, style: AIStyle = 'classic'): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: getBaseInstruction(style),
      }
    });

    return response.text || "I sorry, my brain small-small confused. Try again, ya?";
  } catch (error: any) {
    console.error("API Error:", error);
    if (!process.env.API_KEY) return "ERROR: API Key is missing. Please add it to your environment variables.";
    return "Something went wrong. Check your connection or the API Key, ya?";
  }
};

// --- Audio Logic ---
export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

export const connectLive = (style: AIStyle, onMessage: (msg: LiveServerMessage) => void, onOpen: () => void, onError: (e: any) => void) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks: { onopen: onOpen, onmessage: onMessage, onerror: onError, onclose: () => console.log('Live closed') },
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: getBaseInstruction(style),
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
    }
  });
};