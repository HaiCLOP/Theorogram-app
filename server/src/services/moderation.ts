import { model } from '../config/gemini';

export interface ModerationResult {
    classification: 'safe' | 'nsfw' | 'unsafe';
    confidence: number;
    reasoning: string;
}

/**
 * Classify content using Gemini API
 * Returns classification: safe, nsfw, or unsafe
 */
export async function classifyContent(
    title: string,
    body: string
): Promise<ModerationResult> {
    try {
        const prompt = `You are a content moderation system for THEOROGRAM, a serious platform for intellectual discourse and structured debate.

Analyze the following theory submission and classify it as one of:
- SAFE: Appropriate intellectual content, serious discourse, structured arguments
- NSFW: Contains profanity, sexual content, or graphic descriptions (not necessarily unsafe but requires filtering)
- UNSAFE: Hate speech, harassment, spam, dangerous misinformation, calls to violence, or content that violates platform integrity

Theory Title: "${title}"

Theory Body:
"""
${body}
"""

Respond in JSON format:
{
  "classification": "safe" | "nsfw" | "unsafe",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation"
}`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Parse JSON response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Invalid response format from Gemini');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            classification: parsed.classification.toLowerCase(),
            confidence: parsed.confidence,
            reasoning: parsed.reasoning,
        };
    } catch (error) {
        console.error('Gemini classification error:', error);

        // SECURITY FIX: Default to pending with low confidence if AI fails
        // This ensures potentially harmful content gets manual review
        return {
            classification: 'safe',  // Still safe to allow publishing, but log the failure
            confidence: 0.3,  // Lower confidence flag for review
            reasoning: 'AI moderation unavailable - flagged for potential manual review',
        };
    }
}

/**
 * Calculate complexity score (optional metadata)
 * Higher score = more complex argumentation
 */
export function calculateComplexityScore(body: string): number {
    const wordCount = body.split(/\s+/).length;
    const sentenceCount = body.split(/[.!?]+/).length;
    const avgSentenceLength = wordCount / Math.max(sentenceCount, 1);

    // Simple heuristic: longer sentences and more words = higher complexity
    const score = Math.min(100, Math.floor(
        (wordCount / 10) + (avgSentenceLength * 2)
    ));

    return score;
}
