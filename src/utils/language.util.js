const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDii9pxgG3cLjWfRiZMqJphbnbRbTlJ94U";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Detects the language of input text using Gemini API
 * @param {string} text - Text to detect language from
 * @returns {Promise<string>} - Detected language code
 */
async function detectLanguageWithGemini(text) {
  try {
    if (!text || !text.trim()) {
      return "english"; // Default fallback
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Detect the language of the following text and respond with ONLY the language code.
Supported languages: english, french, hindi, marathi

Text to analyze: "${text.trim()}"

Response format: Respond with ONLY the language code (e.g., "english", "hindi", "french", "marathi"), nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let detectedLanguage = response.text().toLowerCase().trim();
    
    // Clean up the response in case it contains extra characters
    detectedLanguage = detectedLanguage.split('\n')[0].trim();
    
    // Validate if detected language is supported
    const supportedLanguages = [
      "english", "french", "hindi", "marathi"
    ];

    if (supportedLanguages.includes(detectedLanguage)) {
      return detectedLanguage;
    }

    // If not recognized, return english as fallback
    console.warn(`Detected language "${detectedLanguage}" not supported, defaulting to english`);
    return "english";
  } catch (error) {
    console.error("[Language Detection Error]", error);
    // Return english as fallback if API fails
    return "english";
  }
}

/**
 * Validates if a text is consistent with detected language using Gemini
 * @param {string} text - Text to validate
 * @param {string} language - Expected language
 * @returns {Promise<boolean>} - Whether text matches the language
 */
async function validateLanguageConsistency(text, language) {
  try {
    if (!text || !text.trim()) {
      return true;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Is the following text primarily written in ${language}? Respond with ONLY "yes" or "no".

Text: "${text.trim()}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text().toLowerCase().trim();
    
    return answer.includes("yes");
  } catch (error) {
    console.error("[Language Validation Error]", error);
    // Return true as fallback if API fails
    return true;
  }
}

/**
 * Translates text to English using Gemini API (for universal support)
 * @param {string} text - Text to translate
 * @param {string} fromLanguage - Source language
 * @returns {Promise<string>} - Translated text in English
 */
async function translateToEnglish(text, fromLanguage) {
  try {
    if (!text || !text.trim()) {
      return text;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Translate the following ${fromLanguage} text to English. Respond with ONLY the English translation, nothing else.

Text: "${text.trim()}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("[Translation Error]", error);
    // Return original text as fallback
    return text;
  }
}

/**
 * Get language name from code
 * @param {string} code - Language code
 * @returns {string} - Language name
 */
function getLanguageName(code) {
  const languageNames = {
    english: "English",
    french: "French",
    hindi: "Hindi",
    marathi: "Marathi"
  };

  return languageNames[code.toLowerCase()] || "Unknown";
}

module.exports = {
  detectLanguageWithGemini,
  validateLanguageConsistency,
  translateToEnglish,
  getLanguageName
};
