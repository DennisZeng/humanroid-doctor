import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { Message, Role, TTSVoice, Language } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getSystemInstruction = (language: Language) => `
You are Dr. Constance Petersen, a state-of-the-art Humanoid Robot Doctor. 
Your primary function is to triage patients, analyze symptoms, and provide medical guidance with a calm, precise, and empathetic robotic demeanor.

IMPORTANT: You MUST communicate in ${language === 'zh' ? 'Chinese (Simplified)' : 'English'}.

Behavioral Guidelines:
1. Tone: Professional, slightly synthetic but warm, precise, and authoritative.
2. Structure: Start with a brief observation, analyze the inputs, and provide a structured list of potential causes or advice.
3. Safety: You MUST state that you are an AI and not a replacement for a human doctor in critical situations. If a symptom sounds life-threatening (chest pain, stroke signs, severe bleeding), advise calling emergency services immediately.
4. Visuals: If an image is provided, analyze the visual symptoms (e.g., rash color, swelling) carefully.
5. Format: Use Markdown for lists and emphasis.

Special Functions:
- Medical Data Analysis: You may receive structured data inputs (Blood Test, Urine Test, Pulse, Stool Test). Analyze these values against standard medical ranges.
- Medical Prescription: If asked to "print prescription" or "generate report", output a formal document structure using Markdown headers (# Medical Prescription). Include sections for: Patient Details, Diagnosis, Prescribed Medications (Dosage, Frequency, Duration), and Advice/Precautions.
`;

export const sendMessageToGemini = async (
  history: Message[],
  newMessage: string,
  language: Language,
  imageData?: string // base64
): Promise<string> => {
  try {
    const modelId = "gemini-3-pro-preview"; // Updated to the requested model

    // Construct the parts
    const parts: any[] = [];
    
    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg", // Assuming JPEG for simplicity in this demo
          data: imageData,
        },
      });
    }
    
    parts.push({ text: newMessage });

    // Format history for context
    const chatHistory = history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));

    const chat = ai.chats.create({
      model: modelId,
      history: chatHistory,
      config: {
        systemInstruction: getSystemInstruction(language),
      }
    });

    const response: GenerateContentResponse = await chat.sendMessage({
      message: { parts }
    });

    return response.text || "Diagnostic systems encountered an error. Please repeat.";
  } catch (error) {
    console.error("Gemini Interaction Error:", error);
    throw new Error("Unable to connect to the medical grid.");
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    // Using the TTS model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: TTSVoice.Kore }, // Kore sounds professional
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;

  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};