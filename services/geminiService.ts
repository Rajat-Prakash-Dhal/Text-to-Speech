import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName, Emotion } from "../types";

const API_KEY = process.env.API_KEY || '';

if (!API_KEY) {
  console.warn("API_KEY is not defined in process.env");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateSpeech = async (
  text: string,
  voice: VoiceName,
  emotion: Emotion
): Promise<string> => {
  if (!text) throw new Error("Text is required");

  // Construct a prompt that guides the model towards the specific emotion/tone
  let promptText = text;
  if (emotion !== Emotion.Neutral) {
    promptText = `Say with a ${emotion} tone: ${text}`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(part => part.inlineData);

    if (audioPart && audioPart.inlineData && audioPart.inlineData.data) {
      return audioPart.inlineData.data;
    }

    throw new Error("No audio data found in response");
  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};
