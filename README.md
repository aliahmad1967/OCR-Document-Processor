# Lumina OCR Pro

## User Guide

### 1. Uploading Documents
- **Drag & Drop**: Simply drag images (PNG, JPG, WEBP) or PDF files into the upload area.
- **File Selection**: Click the upload area to browse your file system.
- **Max Size**: Files up to 40MB are supported.

### 2. Processing Large PDFs
- **Split Function**: For PDFs larger than 5 pages, a "Scissors" icon will appear in the sidebar next to the file name. Click this to automatically split the document into manageable 5-page chunks for faster processing.
- **Retry**: If a document fails (e.g., due to rate limits), use the "Retry" button in the error view to attempt processing again without re-uploading.

### 3. Viewing Results
- **Raw Text**: View the plain extracted text.
- **Analysis & Data**: Switch to this view to see structured data:
  - **Structure Analysis**: Confidence scores for specific blocks.
  - **Entities**: Detected names, dates, and money.
  - **Tables**: Extracted CSV data for spreadsheet usage.

### 4. Exporting
- Use the toolbar in the Editor to export results as `.txt`, `.csv` (for tables), or `.docx`.

## API & Developers

Lumina OCR Pro includes a built-in **Developer Hub**.
1. Navigate to the **API & Developers** tab in the sidebar.
2. Access code snippets for Python, Node.js, and cURL.
3. View JSON response schemas and authentication details.

Powered by **Google Gemini 2.5 Flash**, the engine provides state-of-the-art multimodal understanding.

## Settings Configuration

Access the **Settings** tab to configure global defaults:

- **Default Language**: Set the preferred language for OCR (English, Arabic, French, Spanish, or Auto-Detect).
- **OCR Mode**:
  - *Standard*: Balanced speed and accuracy (Gemini 2.5 Flash).
  - *Enhanced Tables*: Uses `gemini-3-pro-preview` for complex layout analysis.
- **Data Management**: Clear your current session history to reset the application state.
