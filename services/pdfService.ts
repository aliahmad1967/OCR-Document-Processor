// Access the global pdfjsLib injected via script tag
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export const getPdfPageAsImage = async (file: File, pageNumber: number = 1, scale: number = 2.0): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    if (pageNumber > pdf.numPages) {
      throw new Error(`Page ${pageNumber} out of range (Total: ${pdf.numPages})`);
    }

    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) throw new Error('Canvas context not available');

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    return canvas.toDataURL('image/jpeg', 0.85); // Convert to base64 JPEG
  } catch (error) {
    console.error('PDF Render Error:', error);
    throw new Error('Failed to render PDF page');
  }
};

export const getPdfPageCount = async (file: File): Promise<number> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    return pdf.numPages;
  } catch (error) {
    console.error('PDF Info Error:', error);
    return 0;
  }
};