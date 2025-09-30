
import { Injectable, signal } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private readonly apiKeyStorageKey = 'gemini-api-key';
  isConfigured = signal<boolean>(false);

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    let apiKey: string | null = null;
    if (typeof localStorage !== 'undefined') {
      apiKey = localStorage.getItem(this.apiKeyStorageKey);
    }

    if (!apiKey && typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      apiKey = process.env.API_KEY;
    }

    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
      this.isConfigured.set(true);
    } else {
      this.isConfigured.set(false);
    }
  }

  setApiKey(apiKey: string): void {
    if (!apiKey.trim()) return;

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.apiKeyStorageKey, apiKey);
    }
    this.ai = new GoogleGenAI({ apiKey });
    this.isConfigured.set(true);
  }

  clearApiKey(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.apiKeyStorageKey);
    }
    this.ai = null;
    // After clearing, re-initialize to check for a fallback process.env.API_KEY
    this.initialize();
  }

  async reviewCode(code: string, language: string): Promise<string> {
    if (!this.ai) {
      throw new Error('Gemini API key not configured. Please provide one in the application.');
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
      throw new Error('Failed to get review from Gemini API. Your API key might be invalid. Check the console for more details.');
    }
  }
}
