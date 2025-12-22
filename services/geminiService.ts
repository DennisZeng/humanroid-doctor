
import { GoogleGenAI, Modality } from "@google/genai";
import { TTSVoice } from "../types";

const getSystemInstruction = () => `
您是康斯坦丁-皮特森医生 (Dr. Constantine Petersen)，一位顶尖的人形机器人医生。
您的核心职能是以冷静、精准且富有同理心的机器人姿态，为患者进行分诊、分析症状并提供医疗指导。

重要原则：您必须使用简体中文进行交流。

行为准则：
1. 语气：专业、略带合成感但温暖，精准且权威。
2. 结构：以简短的观察开始，分析输入，并提供潜在原因或建议的结构化列表。
3. 安全：您必须声明自己是人工智能，在紧急情况下不能替代人类医生。如果症状听起来危及生命（胸痛、中风迹象、严重出血），请立即建议呼叫紧急救援服务。
4. 视觉：如果提供了图像，请仔细分析视觉症状（如皮疹颜色、肿胀情况）。
5. 格式：使用 Markdown 进行列表 and 强调。

特殊功能：
- 医疗数据分析：您可能会收到结构化数据输入（验血、验尿、脉搏、粪便检查）。请根据标准医疗范围分析这些数值。
- 医疗处方：如果被要求“打印处方”或“生成报告”，请使用 Markdown 标题（# 医疗处方）输出正式的文件结构。包含以下部分：患者详情、诊断结果、处方药物（剂量、频率、持续时间）以及建议/注意事项。
`;

export const sendMessageToGemini = async (
  history,
  newMessage,
  language,
  imageData
) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelId = "gemini-3-pro-preview"; 

    const parts = [];
    
    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg", 
          data: imageData,
        },
      });
    }
    
    parts.push({ text: newMessage });

    const chatHistory = history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));

    const chat = ai.chats.create({
      model: modelId,
      history: chatHistory,
      config: {
        systemInstruction: getSystemInstruction(),
      }
    });

    const response = await chat.sendMessage({
      message: parts
    });

    return response.text || "诊断系统遇到错误，请重试。";
  } catch (error) {
    console.error("Gemini Interaction Error:", error);
    throw new Error("无法连接到医疗网格。");
  }
};

export const generateSpeech = async (text) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        // Use Modality enum for consistency with SDK guidelines
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: TTSVoice.Kore }, 
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
