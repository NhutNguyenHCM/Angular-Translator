import { Component, OnDestroy } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  HttpClientModule,
  HttpClient,
  provideHttpClient,
} from '@angular/common/http';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  switchMap,
} from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { importProvidersFrom } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, CommonModule, HttpClientModule],
  template: `
    <div class="container">
      <h1>Angular Translator</h1>
      <div class="card">
        <div class="input-section">
          <textarea
            [(ngModel)]="inputText"
            (ngModelChange)="onInputChange()"
            placeholder="Enter text to translate"
            rows="4"
          ></textarea>
          <div class="button-group">
            <button (click)="translateText()" class="primary">
              <i class="fas fa-language"></i> Translate
            </button>
            <button (click)="startSpeechRecognition()" class="secondary">
              <i class="fas fa-microphone"></i> Speech
            </button>
          </div>
        </div>
        <div class="output-section">
          <h2>Translation:</h2>
          <p class="translation-result" [class.placeholder]="!translatedText">
            {{ translatedText || 'Translation will appear here' }}
          </p>
          <p *ngIf="isTranslating" class="translating-message">
            <i class="fas fa-spinner fa-spin"></i> Translating...
          </p>
          <div *ngIf="error" class="error-message">
            <i class="fas fa-exclamation-circle"></i> {{ error }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: 'Roboto', sans-serif;
      color: #333;
      background-color: #f4f4f4;
      min-height: 100vh;
    }
    .container {
      max-width: 100%;
      padding: 20px;
      box-sizing: border-box;
    }
    h1 {
      color: #2c3e50;
      text-align: center;
      margin-bottom: 20px;
      font-size: 24px;
    }
    .card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 20px;
      margin-bottom: 20px;
    }
    textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
      resize: vertical;
      margin-bottom: 10px;
    }
    .button-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    button {
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
      transition: background-color 0.3s, transform 0.1s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    button:active {
      transform: scale(0.98);
    }
    button i {
      margin-right: 8px;
    }
    .primary {
      background-color: #3498db;
      color: white;
    }
    .primary:hover {
      background-color: #2980b9;
    }
    .secondary {
      background-color: #ecf0f1;
      color: #34495e;
    }
    .secondary:hover {
      background-color: #bdc3c7;
    }
    .output-section {
      margin-top: 20px;
    }
    h2 {
      color: #2c3e50;
      margin-bottom: 10px;
      font-size: 18px;
    }
    .translation-result {
      background-color: #ecf0f1;
      border: 1px solid #bdc3c7;
      border-radius: 4px;
      padding: 12px;
      font-size: 16px;
      min-height: 60px;
      display: flex;
      align-items: center;
    }
    .translation-result.placeholder {
      color: #95a5a6;
      font-style: italic;
    }
    .translating-message {
      color: #3498db;
      font-style: italic;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .error-message {
      color: #e74c3c;
      margin-top: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    @media (min-width: 768px) {
      .container {
        max-width: 700px;
        margin: 0 auto;
      }
      h1 {
        font-size: 32px;
      }
      .button-group {
        flex-direction: row;
      }
      button {
        width: auto;
        flex: 1;
      }
    }
  `],
})
export class App implements OnDestroy {
  inputText = '';
  translatedText = '';
  apiKey = 'AIzaSyDcaX3yqW6g2z1lDBJqDvt8n__82wSGKHA';
  isTranslating = false;
  error: string | null = null;

  private inputSubject = new Subject<string>();
  private inputSubscription: Subscription | undefined;

  constructor(private http: HttpClient) {
    this.inputSubscription = this.inputSubject
      .pipe(
        debounceTime(100),
        distinctUntilChanged(),
        switchMap((text) => {
          if (!text.trim()) {
            this.translatedText = '';
            return [];
          }
          this.isTranslating = true;
          this.error = null;
          return this.http.post(this.getApiUrl(), this.getBody(text)).pipe(
            catchError((error) => {
              this.isTranslating = false;
              this.error = 'Translation failed. Please try again.';
              console.error('Error:', error);
              return [];
            })
          );
        })
      )
      .subscribe((response: any) => {
        this.isTranslating = false;
        if (
          response &&
          response.data &&
          response.data.translations &&
          response.data.translations.length > 0
        ) {
          this.translatedText = response.data.translations[0].translatedText;
        } else if (response.length === 0) {
          this.translatedText = '';
        } else {
          this.translatedText = 'No translation available.';
        }
      });
  }

  ngOnDestroy() {
    if (this.inputSubscription) {
      this.inputSubscription.unsubscribe();
    }
  }

  translateText() {
    this.inputSubject.next(this.inputText);
  }

  startSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => {
        this.error = null;
        this.inputText = 'Listening...';
      };

      recognition.onresult = (event: any) => {
        if (event.results.length > 0) {
          this.inputText = event.results[0][0].transcript;
          this.translateText();
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        this.error = 'Speech recognition failed. Please try again.';
        this.inputText = '';
      };

      recognition.onend = () => {
        if (this.inputText === 'Listening...') {
          this.inputText = '';
          this.error = 'No speech detected. Please try again.';
        }
      };

      recognition.start();
    } else {
      this.error = 'Speech recognition is not supported in this browser.';
    }
  }

  onInputChange() {
    this.translateText();
  }

  private getApiUrl() {
    return `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`;
  }

  private getBody(text: string) {
    return {
      q: text,
      source: 'en',
      target: 'vi',
      format: 'text',
    };
  }
}

bootstrapApplication(App, {
  providers: [importProvidersFrom(HttpClientModule), provideHttpClient()],
}).catch((err) => console.error(err));