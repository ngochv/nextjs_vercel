/// <reference types="vite/client" />
import { Question } from './questions';
// const API_BASE_URL = 'http://localhost:3001/api'; // kept for generation if needed, or remove if unused for reading

export interface QuizFileHeader {
  id: string;
  timestamp: number;
  questionCount: number;
}

// Define interface for the JSON file structure
interface QuizFileContent {
    id: string;
    timestamp: number;
    questions: Question[];
}

// Import all JSON files from the storage-quiz directory eagerly
const quizFiles = import.meta.glob<QuizFileContent>('../storage-quiz/*.json', { eager: true });




// Save quiz to Node.js server via API (Manual save if needed) - Keeping API for writes if necessary, or strictly usage based
export const saveQuizToServer = async (questions: Question[]): Promise<string> => {
  // If we wanted to write to local storage via browser, we can't easily write to FS. 
  // We keep the API call for saving if the backend still supports it, otherwise this feature might be broken without backend.
  // Assuming request is only to CHANGE READING to local folder.
    try {
    const API_BASE_URL = 'http://localhost:3001/api';
    const response = await fetch(`${API_BASE_URL}/quizzes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ questions }),
    });

    if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
    }
     const result = await response.json();
    return result.id;
  } catch (e) {
      console.error("Failed to save to server", e);
      throw new Error("Failed to save to server storage.");
  }
};

// List files from local storage-quiz folder
export const listServerFiles = async (): Promise<QuizFileHeader[]> => {
  try {
     const headers: QuizFileHeader[] = Object.values(quizFiles).map((mod) => {
         // The module content is the JSON object itself when using eager: true with JSON
         // Depending on Vite version/setup, it usually exports the JSON as default or as the module itself.
         // With { eager: true }, 'mod' is the module namespace object.
         // For JSON imports, the default export is the JSON content.
         // However, standard JSON import might just be the object. 
         // Let's assume 'default' export if it exists, roughly handling both.
         const content = (mod as any).default || mod;
         return {
             id: content.id,
             timestamp: content.timestamp,
             questionCount: content.questions ? content.questions.length : 0
         };
     });
     
     // Sort by timestamp descending
     return headers.sort((a, b) => b.timestamp - a.timestamp);

  } catch (e) {
    console.error("Failed to list local files", e);
    return [];
  }
};

// Load specific quiz from local storage-quiz folder
export const loadQuizFromServer = async (id: string): Promise<Question[] | null> => {
  try {
     const fileEntry = Object.values(quizFiles).find(mod => {
         const content = (mod as any).default || mod;
         return content.id === id;
     });

     if (!fileEntry) return null;

     const content = (fileEntry as any).default || fileEntry;
     return content.questions || [];

  } catch (e) {
    console.error("Failed to load local file", e);
    return null;
  }
};
