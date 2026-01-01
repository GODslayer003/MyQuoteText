// ============================================
// src/services/ai/PromptBuilder.js
// ============================================
class PromptBuilder {
  /**
   * Build system prompt based on tier
   */
  static buildSystemPrompt(tier) {
    const basePrompt = `You are an expert analyst for Australian homeowners reviewing contractor quotes.

CRITICAL CONSTRAINTS:
- Provide GUIDANCE and ANALYSIS only, never legal or financial advice
- Use cautious language: "appears", "may indicate", "typically", "often"
- NEVER claim: legal compliance, fairness, contractor intent, or deception
- Focus on OBSERVABLE FACTS in the document
- All pricing comparisons are RELATIVE and INDICATIVE only
- Include disclaimer that this is decision support, not professional advice

OUTPUT FORMAT:
Return ONLY valid JSON matching the specified schema.`;

    if (tier === 'free') {
      return `${basePrompt}

For FREE tier: Provide only a brief summary (3-4 sentences) highlighting the main scope and total amount. No detailed analysis.

JSON Schema:
{
  "freeSummary": {
    "overview": "string (2-3 sentences)",
    "mainPoints": ["string", "string", "string"],
    "generatedAt": "ISO date"
  }
}`;
    }

    if (tier === 'standard' || tier === 'premium') {
      return `${basePrompt}

Analyze the quote comprehensively:
1. Extract scope of work (included, excluded, unclear items)
2. Break down costs by category
3. Identify red flags (vague wording, missing terms, risks)
4. Compare pricing to typical Australian market ranges
5. Suggest questions to ask the contractor

JSON Schema:
{
  "analysis": {
    "scopeOfWork": {
      "included": ["item1", "item2"],
      "excluded": ["item1"],
      "unclear": ["item1"]
    },
    "costBreakdown": [
      {
        "item": "string",
        "amount": number,
        "category": "materials|labour|equipment|other",
        "notes": "string"
      }
    ],
    "redFlags": [
      {
        "severity": "low|medium|high|critical",
        "category": "vague_scope|pricing|terms|compliance|risk",
        "description": "string",
        "recommendation": "string"
      }
    ],
    "missingItems": [
      {
        "item": "string",
        "importance": "critical|recommended|optional",
        "explanation": "string"
      }
    ],
    "pricingAnalysis": {
      "totalAmount": number,
      "priceRange": {
        "low": number,
        "high": number,
        "typical": number
      },
      "assessment": "appears_low|within_range|appears_high|insufficient_data",
      "comparableWork": "string describing what this pricing is based on",
      "disclaimer": "This pricing comparison is indicative only..."
    },
    "questionsToAsk": ["question1", "question2"],
    "contractorProfile": {
      "name": "string",
      "abn": "string or null",
      "licenseNumber": "string or null",
      "insuranceMentioned": boolean,
      "warrantyOffered": boolean,
      "paymentTerms": "string"
    }
  },
  "confidenceLevel": "very_low|low|medium|high|very_high"
}`;
    }

    return basePrompt;
  }

  /**
   * Build user prompt with context
   */
  static buildUserPrompt(extractedText, metadata) {
    let prompt = `Analyze this Australian contractor quote:\n\n${extractedText}\n\n`;

    if (metadata.workCategory) {
      prompt += `Work Category: ${metadata.workCategory}\n`;
    }
    if (metadata.propertyType) {
      prompt += `Property Type: ${metadata.propertyType}\n`;
    }
    if (metadata.ocrConfidence && metadata.ocrConfidence < 80) {
      prompt += `Note: Document was scanned (OCR confidence: ${metadata.ocrConfidence}%). Some text may be unclear.\n`;
    }

    prompt += `\nProvide your analysis in JSON format as specified.`;
    return prompt;
  }

  /**
   * Build comparison system prompt (Premium only)
   */
  static buildComparisonSystemPrompt() {
    return `You are comparing multiple contractor quotes for an Australian homeowner.

CRITICAL CONSTRAINTS:
- Provide comparative GUIDANCE only, never recommendations on which to choose
- Use cautious language when comparing
- Focus on observable differences
- Never claim one is "better" or "best" - only note strengths and weaknesses
- All pricing is RELATIVE and context-dependent

Return ONLY valid JSON with comparative analysis.

JSON Schema:
{
  "comparison": {
    "quotes": [
      {
        "quoteId": "string",
        "contractorName": "string",
        "totalAmount": number,
        "strengths": ["string"],
        "weaknesses": ["string"]
      }
    ],
    "relativePricing": "string describing pricing spread",
    "valueAssessment": "string comparing scope vs price",
    "keyDifferences": ["string"],
    "disclaimer": "Comparison is for information only..."
  }
}`;
  }

  /**
   * Build comparison user prompt
   */
  static buildComparisonUserPrompt(quotes, metadata) {
    let prompt = 'Compare these Australian contractor quotes:\n\n';

    quotes.forEach((quote, index) => {
      prompt += `QUOTE ${index + 1}:\n${quote.extractedText}\n\n`;
    });

    if (metadata.workCategory) {
      prompt += `Work Category: ${metadata.workCategory}\n`;
    }

    prompt += '\nProvide comparative analysis in JSON format.';
    return prompt;
  }
}

module.exports = PromptBuilder;