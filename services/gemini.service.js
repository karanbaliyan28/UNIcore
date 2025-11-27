// gemini.service.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getModel = (modelName = "gemini-2.0-flash-exp") => {
  return genAI.getGenerativeModel({ model: modelName });
};

export { genAI };
