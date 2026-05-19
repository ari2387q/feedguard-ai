import Groq from 'groq-sdk';

/** The Groq model used for all AI inference */
const MODEL = 'llama3-8b-8192';

/** Lazy-initialized Groq client */
let client: Groq | null = null;

/**
 * Returns a singleton Groq SDK client, initializing it on first call.
 * @throws Error if GROQ_API_KEY is not configured
 * @returns Groq SDK client
 */
function getClient(): Groq {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set in environment variables.');
    }
    client = new Groq({ apiKey });
  }
  return client;
}

/**
 * Generates a concise 2-sentence summary of a video based on its title and description.
 * @param title - The video title
 * @param description - Optional video description / metadata
 * @returns A 2-sentence summary string
 */
export async function generateSummary(title: string, description: string): Promise<string> {
  const groq = getClient();

  const prompt = `You are a helpful content assistant. Given the following YouTube video title and description, write a concise 2-sentence summary of what this video is likely about. Be factual and neutral.

Title: ${title}
Description: ${description || '(no description)'}

Summary:`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You summarize YouTube videos in exactly 2 concise sentences. No markdown, no bullet points.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: MODEL,
    temperature: 0.3,
    max_tokens: 150,
  });

  const content = chatCompletion.choices[0]?.message?.content;
  return content?.trim() || 'Summary unavailable.';
}

/** Shape of the AI content analysis response */
export interface AnalysisResult {
  toxic: boolean;
  ragebait: boolean;
  clickbait: boolean;
  reason: string;
}

/**
 * Analyzes a piece of text (tweet, post) for toxicity, rage-bait, and clickbait.
 * Returns structured JSON with boolean flags and a human-readable reason.
 * @param text - The text content to analyze
 * @returns AnalysisResult with classification flags
 */
export async function analyzeContent(text: string): Promise<AnalysisResult> {
  const groq = getClient();

  const prompt = `Analyze the following social media post and classify it. Respond ONLY with a valid JSON object (no markdown, no code fences). Use this exact schema:
{
  "toxic": boolean,
  "ragebait": boolean,
  "clickbait": boolean,
  "reason": "short explanation"
}

Rules:
- "toxic": true if the text contains insults, hate speech, harassment, or dehumanizing language.
- "ragebait": true if the text is intentionally provocative or designed to trigger outrage.
- "clickbait": true if the text uses exaggeration, vague teasers, or sensationalism to bait engagement.
- "reason": a brief 1-sentence explanation of why the flags are set.

Text to analyze:
"""
${text}
"""`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a content moderation classifier. Respond ONLY with valid JSON. No markdown formatting.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: MODEL,
    temperature: 0.1,
    max_tokens: 200,
  });

  const raw = chatCompletion.choices[0]?.message?.content?.trim() || '';

  try {
    const parsed = JSON.parse(raw) as AnalysisResult;
    return {
      toxic: Boolean(parsed.toxic),
      ragebait: Boolean(parsed.ragebait),
      clickbait: Boolean(parsed.clickbait),
      reason: typeof parsed.reason === 'string' ? parsed.reason : '',
    };
  } catch {
    console.error('[Groq] Failed to parse analysis JSON:', raw);
    return {
      toxic: false,
      ragebait: false,
      clickbait: false,
      reason: 'Analysis parsing failed.',
    };
  }
}
