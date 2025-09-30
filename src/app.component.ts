import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { GeminiService } from './services/gemini.service';
import prettier from 'prettier';
import prettierPluginBabel from 'prettier/plugins/babel';
import prettierPluginEstree from 'prettier/plugins/estree';
import prettierPluginTypescript from 'prettier/plugins/typescript';
import prettierPluginHtml from 'prettier/plugins/html';
import prettierPluginPostcss from 'prettier/plugins/postcss';
import prettierPluginSql from 'prettier-plugin-sql';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly storageKey = 'codeReviewerSession';

  code = signal<string>(`function factorial(n) {\n  if (n === 0) {\n    return 1;\n  } else {\n    return n * factorial(n - 1);\n  }\n}`);
  language = signal<string>('javascript');
  reviewResult = signal<string>('');
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  isSessionSaved = signal<boolean>(false);
  formattingStatus = signal<string>('');
  copyStatus = signal<'idle' | 'copied'>('idle');

  // API Key management
  isConfigured = this.geminiService.isConfigured;
  apiKeyInput = signal<string>('');

  supportedLanguages = [
    { value: 'typescript', name: 'TypeScript' },
    { value: 'javascript', name: 'JavaScript' },
    { value: 'python', name: 'Python' },
    { value: 'java', name: 'Java' },
    { value: 'csharp', name: 'C#' },
    { value: 'go', name: 'Go' },
    { value: 'rust', name: 'Rust' },
    { value: 'html', name: 'HTML' },
    { value: 'css', name: 'CSS' },
    { value: 'sql', name: 'SQL' },
  ];

  constructor(private geminiService: GeminiService) {
    this.checkSavedSession();
  }

  private checkSavedSession(): void {
    if (typeof localStorage !== 'undefined') {
      const savedSession = localStorage.getItem(this.storageKey);
      this.isSessionSaved.set(!!savedSession);
    }
  }

  onApiKeyChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.apiKeyInput.set(target.value);
  }

  saveApiKey() {
    const key = this.apiKeyInput().trim();
    if (key) {
      this.geminiService.setApiKey(key);
      this.apiKeyInput.set('');
      this.error.set(null);
    }
  }

  changeApiKey() {
    this.geminiService.clearApiKey();
  }

  async reviewCode() {
    if (!this.code().trim()) {
      this.error.set("Please enter some code to review.");
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.reviewResult.set('');
    this.formattingStatus.set('');

    try {
      const result = await this.geminiService.reviewCode(this.code(), this.language());
      this.reviewResult.set(result);
      await this.formatReviewResult();
    } catch (e: unknown) {
      if (e instanceof Error) {
        this.error.set(`An error occurred while fetching the review. ${e.message}`);
      } else {
        this.error.set('An unknown error occurred. Please check the console for details.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  private getPrettierConfig(): { parser: string; plugins: any[] } | null {
    const lang = this.language();
    const basePlugins = [
      prettierPluginBabel,
      prettierPluginEstree,
      prettierPluginTypescript,
      prettierPluginHtml,
      prettierPluginPostcss,
    ];

    switch (lang) {
      case 'javascript':
        return { parser: 'babel', plugins: basePlugins };
      case 'typescript':
        return { parser: 'typescript', plugins: basePlugins };
      case 'html':
        return { parser: 'html', plugins: basePlugins };
      case 'css':
        return { parser: 'css', plugins: basePlugins };
      case 'sql':
        return { parser: 'sql', plugins: [...basePlugins, prettierPluginSql] };
      default:
        return null;
    }
  }

  private async formatReviewResult(): Promise<void> {
    const config = this.getPrettierConfig();

    if (!config || !this.reviewResult()) {
      return;
    }

    try {
      this.formattingStatus.set('Applying formatting...');
      const formatted = await prettier.format(this.reviewResult(), config);
      this.reviewResult.set(formatted);
      this.formattingStatus.set('Formatting applied successfully.');
    } catch (e) {
      console.warn('Could not format review result:', e);
      this.formattingStatus.set('Auto-formatting could not be applied. Displaying raw output.');
    }
  }

  onCodeChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.code.set(target.value);
  }

  onLanguageChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.language.set(target.value);
  }

  copyFeedback(): void {
    const feedback = this.reviewResult();
    if (!feedback || !navigator.clipboard) {
      return;
    }

    navigator.clipboard.writeText(feedback).then(() => {
      this.copyStatus.set('copied');
      setTimeout(() => {
        this.copyStatus.set('idle');
      }, 2000); // Reset after 2 seconds
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      // Optionally handle the error, e.g., show an error message to the user
    });
  }

  exportFeedback() {
    const feedback = this.reviewResult();
    if (!feedback) {
      return;
    }

    const blob = new Blob([feedback], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'code-review-feedback.txt';
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  saveSession(): void {
    const sessionData = {
      code: this.code(),
      language: this.language(),
      reviewResult: this.reviewResult(),
    };
    localStorage.setItem(this.storageKey, JSON.stringify(sessionData));
    this.isSessionSaved.set(true);
  }

  loadSession(): void {
    const savedSession = localStorage.getItem(this.storageKey);
    if (savedSession) {
      const sessionData = JSON.parse(savedSession);
      this.code.set(sessionData.code || '');
      this.language.set(sessionData.language || 'javascript');
      this.reviewResult.set(sessionData.reviewResult || '');
      this.error.set(null);
      this.formattingStatus.set('');
    }
  }

  clearSession(): void {
    localStorage.removeItem(this.storageKey);
    this.isSessionSaved.set(false);
  }
}