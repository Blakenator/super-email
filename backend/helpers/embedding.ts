import { logger } from './logger.js';

let pipeline: any = null;
let extractor: any = null;
let loadingPromise: Promise<void> | null = null;
let loadFailed = false;

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
const MAX_TOKENS = 256;

async function loadModel(): Promise<void> {
  if (extractor || loadFailed) return;
  if (loadingPromise) {
    await loadingPromise;
    return;
  }

  loadingPromise = (async () => {
    try {
      logger.info('Embedding', `Loading model ${MODEL_NAME}...`);
      const transformers = await import('@huggingface/transformers');
      pipeline = transformers.pipeline;
      extractor = await pipeline('feature-extraction', MODEL_NAME, {
        dtype: 'fp32',
      });
      logger.info('Embedding', 'Model loaded successfully');
    } catch (err) {
      loadFailed = true;
      logger.error('Embedding', 'Failed to load embedding model; semantic search will be unavailable', {
        error: err instanceof Error ? err.message : err,
      });
    }
  })();

  await loadingPromise;
}

function truncateText(text: string): string {
  const words = text.split(/\s+/);
  if (words.length <= MAX_TOKENS) return text;
  return words.slice(0, MAX_TOKENS).join(' ');
}

/**
 * Generate a 384-dimension embedding for a single text string.
 * Returns null if the model failed to load (graceful degradation).
 */
export async function generateEmbedding(
  text: string,
): Promise<number[] | null> {
  await loadModel();
  if (!extractor) return null;

  try {
    const truncated = truncateText(text);
    const output = await extractor(truncated, {
      pooling: 'mean',
      normalize: true,
    });
    return Array.from(output.data as Float32Array);
  } catch (err) {
    logger.error('Embedding', 'Failed to generate embedding', {
      error: err instanceof Error ? err.message : err,
    });
    return null;
  }
}

/**
 * Generate embeddings for a batch of texts.
 * Returns an array of 384-dimension vectors (or null for failures).
 */
export async function generateEmbeddingBatch(
  texts: string[],
): Promise<(number[] | null)[]> {
  await loadModel();
  if (!extractor) return texts.map(() => null);

  const results: (number[] | null)[] = [];
  for (const text of texts) {
    results.push(await generateEmbedding(text));
  }
  return results;
}

/**
 * Pre-warm the embedding model on server startup.
 * Fires and forgets -- logs success/failure but doesn't block the caller.
 */
export function preWarmEmbeddingModel(): void {
  loadModel().catch(() => {
    // Already logged inside loadModel
  });
}

/**
 * Build the text to embed from email fields.
 * Combines subject and text body for richer semantic representation.
 */
export function buildEmbeddingText(
  subject: string,
  textBody: string | null,
): string {
  const parts = [subject];
  if (textBody) parts.push(textBody);
  return parts.join(' ');
}
