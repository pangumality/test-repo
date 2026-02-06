import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Using gemini-2.0-flash as it is available and performant
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export const askTutor = async (req, res) => {
  try {
    const { question, context } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    let systemPrompt = "You are a helpful and knowledgeable AI Tutor for students. Explain concepts clearly and simply.";
    
    if (context) {
      systemPrompt += ` The student is asking about the subject/topic: "${context}". Tailor your answer to this context.`;
    }

    // Construct the full prompt
    const fullPrompt = `${systemPrompt}\n\nStudent Question: ${question}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const answer = response.text();

    res.json({ answer });

  } catch (error) {
    console.error('AI Tutor Error:', error);
    
    // Handle Google Gemini specific errors if possible
    // Note: Gemini error structure might differ from OpenAI
    if (error.message && error.message.includes('429')) {
       return res.status(429).json({ 
        error: 'Google Gemini API quota exceeded. Please check your billing details or API key limits.' 
      });
    }

    res.status(500).json({ error: 'Failed to get answer from AI Tutor' });
  }
};
