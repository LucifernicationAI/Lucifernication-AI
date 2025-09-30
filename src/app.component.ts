
import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { GeminiService } from './services/gemini.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private geminiService = inject(GeminiService);

  code = signal<string>(`function factorial(n) {\n  if (n === 0) {\n    return 1;\n  } else {\n    return n * factorial(n - 1);\n  }\n}`);
  language = signal<string>('javascript');
  reviewResult = signal<string>('');
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

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

  async reviewCode() {
    if (!this.code().trim()) {
      this.error.set("Please enter some code to review.");
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.reviewResult.set('');

    try {
      const result = await this.geminiService.reviewCode(this.code(), this.language());
      this.reviewResult.set(result);
    } catch (e: any) {
      this.error.set(e.message || 'An unknown error occurred.');
    } finally {
      this.isLoading.set(false);
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
}
