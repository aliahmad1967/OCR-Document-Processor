export enum ProcessingStatus {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export interface ExtractedBlock {
  text: string;
  type: 'text' | 'table' | 'header' | 'list';
  confidence: number;
}

export interface ExtractedEntity {
  text: string;
  label: string;
}

export interface OcrResult {
  fullText: string;
  language: string;
  blocks: ExtractedBlock[];
  tables: string[]; // CSV strings
  entities: ExtractedEntity[];
  pageIndex?: number; // For PDFs
}

export interface DocumentFile {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'pdf';
  status: ProcessingStatus;
  results?: OcrResult[];
  currentPage?: number;
  totalPages?: number;
  error?: string;
  progress?: number; // 0-100
  currentProcessingPage?: number;
  pageRange?: { start: number; end: number };
}

export type OcrMode = 'standard' | 'fast' | 'table_focus';
export type SupportedLanguage = 'auto' | 'en' | 'ar' | 'es' | 'fr';