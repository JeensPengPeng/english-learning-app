import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  words: string[];
}

let workerPromise: Promise<Tesseract.Worker> | null = null;

async function getWorker(): Promise<Tesseract.Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await Tesseract.createWorker('eng', 1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (worker as any).setParameters({
        tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,;.!?\t ',
        preserve_interword_spaces: '1',
      });
      return worker;
    })();
  }
  return workerPromise;
}

interface OCRPageData {
  text: string;
  confidence: number;
  lines: { text: string; confidence: number }[];
  words: { text: string; confidence: number }[];
}

export async function recognizeImage(
  image: HTMLImageElement | string | File | Blob,
  onProgress?: (p: number) => void
): Promise<OCRResult> {
  const worker = await getWorker();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await worker.recognize(image) as any;
  const pageData = data as OCRPageData;

  const text = pageData.text.trim();
  const words = text
    .split(/[\s,;.!?]+/)
    .filter(w => w.length > 0)
    .filter(w => /^[a-zA-Z]/.test(w));

  return {
    text,
    confidence: pageData.confidence,
    words,
  };
}

export interface OCRLine {
  text: string;
  confidence: number;
}

export async function recognizeLines(
  image: HTMLImageElement | string | File | Blob,
  onProgress?: (p: number) => void
): Promise<OCRLine[]> {
  const worker = await getWorker();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await worker.recognize(image) as any;
  const pageData = data as OCRPageData;

  const lines = pageData.lines
    .map(l => ({ text: l.text.trim(), confidence: l.confidence }))
    .filter(l => l.text.length > 0);

  return lines;
}

export async function terminateWorker(): Promise<void> {
  if (workerPromise) {
    const worker = await workerPromise;
    await worker.terminate();
    workerPromise = null;
  }
}
