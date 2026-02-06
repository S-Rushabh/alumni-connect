
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini API client exactly as per the required standard.
// The API key is obtained exclusively from the pre-configured environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generate a high-impact daily briefing for the alumni dashboard.
 */
export const generateDailyBriefing = async (userData: { name: string; industry: string; interest: string }) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a 3-paragraph "Morning Brief" for an alum named ${userData.name}. 
      Context: They have 3 new job matches in ${userData.industry}, their senior just posted a mentorship slot, 
      and there is an upcoming ${userData.interest} webinar. Make it feel elite, encouraging, and personal. 
      Use a tone that is professional yet visionary.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Briefing Error:", error);
    return "The network is currently optimizing. Your personalized briefing will return shortly.";
  }
};

/**
 * Enhance professional bios using advanced reasoning.
 */
export const enhanceBio = async (rawBio: string) => {
  if (!rawBio) return rawBio;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Rewrite the following professional bio to be higher impact, professional, and elite: "${rawBio}"`,
    });
    return response.text;
  } catch (error) {
    return rawBio;
  }
};

/**
 * Parse natural language search queries into structured parameters.
 */
export const parseSemanticSearch = async (query: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract search parameters from this natural language query: "${query}". 
      Return JSON with keys: location, industry, role, gradYearRange.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            location: { type: Type.STRING },
            industry: { type: Type.STRING },
            role: { type: Type.STRING },
            gradYearRange: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    return null;
  }
};

/**
 * Generate context-aware icebreakers for networking.
 */
export const generateIcebreakers = async (alumName: string, alumBio: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest 3 personalized, high-value icebreakers to message ${alumName} based on their professional narrative: "${alumBio}".`,
    });
    return response.text?.split('\n').filter(line => line.length > 5).slice(0, 3);
  } catch (error) {
    return ["Inquire about their recent achievements.", "Discuss shared industry trends.", "Ask for advice on scaling in their sector."];
  }
};

/**
 * Analyze audio input for sentiment and mentorship matching.
 */
export const analyzeAudioMentorship = async (base64Audio: string, mimeType: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: mimeType,
            },
          },
          {
            text: "Transcribe this mentorship request and analyze the 'vibe'. Identify 3 technical keywords and 2 personality traits. Return JSON with keys: transcript (string), keywords (array of strings), personalityTraits (array of strings), matchingScoreHint (number 1-100).",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: { type: Type.STRING },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            personalityTraits: { type: Type.ARRAY, items: { type: Type.STRING } },
            matchingScoreHint: { type: Type.NUMBER }
          },
          required: ["transcript", "keywords", "personalityTraits", "matchingScoreHint"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Audio Analysis Error:", error);
    throw error;
  }
};
