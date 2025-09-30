/**
 * NOTE: This is a basic unit test setup for demonstration.
 * A real-world Angular application would use the Angular CLI and Karma/Jasmine or Jest
 * for a more robust testing environment with automatic test discovery and execution.
 */
import { AppComponent } from './app.component';
import { GeminiService } from './services/gemini.service';

// --- MOCKS ---

class MockGeminiService extends GeminiService {
  private response: string = 'Mocked review';
  private shouldThrowError: boolean = false;
  public lastCalledWith: { code: string; language: string } | null = null;

  constructor() {
    // Pass a dummy API key to the parent constructor
    super(); 
  }

  override reviewCode(code: string, language: string): Promise<string> {
    this.lastCalledWith = { code, language };
    if (this.shouldThrowError) {
      return Promise.reject(new Error('API Failure'));
    }
    return Promise.resolve(this.response);
  }

  // --- Test Helpers ---
  setResponse(response: string): void {
    this.response = response;
    this.shouldThrowError = false;
  }

  setError(): void {
    this.shouldThrowError = true;
  }
}


// --- TEST SUITE ---

console.group('AppComponent Tests');

// Test `reviewCode` method
async function testReviewCode() {
  console.log('Running: testReviewCode...');
  const mockService = new MockGeminiService();
  const component = new AppComponent(mockService);

  // Test success case
  mockService.setResponse('This is a great piece of code!');
  component.code.set('const x = 1;');
  await component.reviewCode();
  console.assert(component.reviewResult().includes('This is a great piece of code!'), 'Success case failed: reviewResult not set.');
  console.assert(component.error() === null, 'Success case failed: error should be null.');
  console.assert(mockService.lastCalledWith?.code === 'const x = 1;', 'Success case failed: service called with wrong code.');

  // Test failure case
  mockService.setError();
  component.code.set('const y = 2;');
  await component.reviewCode();
  console.assert(component.reviewResult() === '', 'Failure case failed: reviewResult should be empty.');
  console.assert(component.error()?.includes('API Failure'), 'Failure case failed: error not set correctly.');
  
  // Test empty code case
  component.code.set('   '); // whitespace only
  await component.reviewCode();
  console.assert(component.error() === "Please enter some code to review.", 'Empty code case failed.');
}


// Test session management methods
function testSessionManagement() {
    console.log('Running: testSessionManagement...');
    const mockService = new MockGeminiService();
    const component = new AppComponent(mockService);
    const storageKey = 'codeReviewerSession';

    // Clear any previous state
    localStorage.removeItem(storageKey);

    // 1. Test saveSession
    component.code.set('let a = 1;');
    component.language.set('typescript');
    component.reviewResult.set('Looks good.');
    component.saveSession();
    
    const savedData = localStorage.getItem(storageKey);
    console.assert(savedData !== null, 'saveSession failed: data not found in localStorage.');
    const parsedData = JSON.parse(savedData!);
    console.assert(parsedData.code === 'let a = 1;', 'saveSession failed: code was not saved correctly.');
    console.assert(parsedData.language === 'typescript', 'saveSession failed: language was not saved correctly.');
    console.assert(component.isSessionSaved() === true, 'saveSession failed: isSessionSaved signal not updated.');

    // 2. Test loadSession
    // Reset component state first
    component.code.set('');
    component.language.set('javascript');
    component.reviewResult.set('');
    
    component.loadSession();
    console.assert(component.code() === 'let a = 1;', 'loadSession failed: code was not loaded.');
    console.assert(component.language() === 'typescript', 'loadSession failed: language was not loaded.');
    console.assert(component.reviewResult() === 'Looks good.', 'loadSession failed: reviewResult was not loaded.');

    // 3. Test clearSession
    component.clearSession();
    console.assert(localStorage.getItem(storageKey) === null, 'clearSession failed: data not removed from localStorage.');
    console.assert(component.isSessionSaved() === false, 'clearSession failed: isSessionSaved signal not updated.');
}


// --- RUN TESTS ---
/*
  NOTE: This test runner is commented out because unit tests should not execute
  during application startup in a production environment. Running them can
  interfere with the application's state and lifecycle, causing errors.
  These tests should be run in a dedicated test environment (e.g., using Jest or Karma).

(async () => {
  try {
    await testReviewCode();
    testSessionManagement();
    console.log('All tests passed!');
  } catch (e) {
    console.error('A test failed:', e);
  } finally {
    console.groupEnd();
  }
})();
*/