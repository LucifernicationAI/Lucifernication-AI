
import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    // The API key must be provided as an environment variable `process.env.API_KEY`.
    if (process.env.API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
  }

  async reviewCode(code: string, language: string): Promise<string> {
    if (!this.ai) {
      throw new Error('Gemini API key not configured. Please set the API_KEY environment variable.');
    }
    if (!code.trim()) {
        return "Please provide some code to review.";
    }

    const model = 'gemini-2.5-flash';
    const prompt = `
      You are an expert code reviewer with years of experience reviewing ${language} code.
      Please provide a thorough review of the following code snippet.
      Focus on:
      - **Bugs and Errors:** Identify any potential bugs or logical errors.
      - **Best Practices:** Check if the code follows established best practices and conventions for ${language}.
      - **Performance:** Suggest any potential performance optimizations.
      - **Readability and Style:** Comment on the code's clarity, naming conventions, and overall style.
      - **Security:** Point out any potential security vulnerabilities.

      Provide your feedback in a clear, constructive, and actionable format. Use Markdown for formatting, including code blocks for examples. Start with a brief summary of the code's quality.

      Here is the code to review:
      \`\`\`${language}
      ${code}
      \`\`\`
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: model,
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error('Failed to get review from Gemini API. Check the console for more details.');
    }
  }
}
