export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const text = payload.text || '';
    const sourceUrl = payload.source_url || '';
    const context = payload.context || '';
    const apiKey = process.env.GROQ_API_KEY || payload.groq_api_key || '';

    if (!text || text.trim().length < 2) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Text input must be provided.' }),
      };
    }

    const prompt = `You are an elite, adversarial multi-agent truth verification system (LangGraph Triad).
Analyze the following claim based on verified real-world facts, scientific laws, and encyclopedic knowledge.

CLAIM: "${text}"

${context ? `FACTUAL CONTEXT RETRIEVED FROM WEB/ENCYCLOPEDIA:\n${context}\n` : ''}

Evaluate this with rigorous objectivity.
- If the claim is a question asserting a false premise (e.g. "why all birds are blue"), identify the false premise clearly.
- True Agent must formulate the affirmative case. If false or unsupported, admit that 0 proof exists.
- False Agent must formulate the adversarial case with exact counter-proof (e.g., biological facts, real parentage, cast lists).
- The Judge Agent must render a decisive TRUE or FALSE (or UNCERTAIN if genuinely in dispute).

You MUST return a strict JSON object with this exact schema (no markdown formatting, no code blocks):
{
  "trueAgent": {
    "proofFound": boolean,
    "argument": "clear, rigorous explanation of affirmative case or admission of 0 proof",
    "sourceQuote": "exact quote or corroborating fact if found"
  },
  "falseAgent": {
    "refutationFound": boolean,
    "argument": "clear, rigorous counter-proof explaining why claim is false, or admission of no contradiction if true",
    "sourceQuote": "exact counter-proof citation or scientific fact"
  },
  "judge": {
    "verdict": "LIKELY_REAL" | "LIKELY_FAKE" | "UNCERTAIN",
    "confidence": number between 0.60 and 0.99,
    "ruling": "concise, powerful 1-2 sentence final ruling explaining why it is True or False",
    "borrowedRationale": "key winning argument from the prevailing agent"
  }
}`;

    let llmDialectic: any = null;

    if (apiKey) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            response_format: { type: 'json_object' },
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const raw = groqData?.choices?.[0]?.message?.content || '';
          const cleaned = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
          llmDialectic = JSON.parse(cleaned);
        }
      } catch (err: any) {
        console.error('Groq serverless execution error:', err);
      }
    }

    let verdict = 'UNCERTAIN';
    let confidence = 0.85;
    let recommendation = '';
    let factCheckScore = 0.50;

    if (llmDialectic?.judge) {
      verdict = llmDialectic.judge.verdict;
      confidence = llmDialectic.judge.confidence;
      factCheckScore = verdict === 'LIKELY_REAL' ? 0.95 : 0.05;
      recommendation = llmDialectic.judge.ruling;
    } else {
      verdict = 'UNCERTAIN';
      confidence = 0.50;
      recommendation = 'Unable to complete LLM verification.';
    }

    const response = {
      verdict,
      confidence,
      uncertainty: Number((1.0 - confidence).toFixed(2)),
      text_score: Number((1.0 - factCheckScore).toFixed(2)),
      llm_dialectic: llmDialectic,
      text_analysis: {
        claims: [text],
        fact_check_score: factCheckScore,
        sentiment: verdict === 'LIKELY_FAKE' ? 'negative' : 'neutral',
        source_credibility: sourceUrl ? 0.90 : 0.60,
        evidence: [
          {
            type: verdict === 'LIKELY_FAKE' ? 'false_agent_refutation' : 'true_agent_corroboration',
            description: llmDialectic?.judge?.borrowedRationale || recommendation,
            confidence,
            severity: verdict === 'LIKELY_FAKE' ? 'high' : 'low',
            source_url: sourceUrl || undefined,
            proof_quote: llmDialectic?.falseAgent?.sourceQuote || llmDialectic?.trueAgent?.sourceQuote || text,
          },
        ],
        ifai_style: verdict === 'LIKELY_FAKE' ? 'Contradicts verified facts.' : 'Corroborated by factual records.',
        ifai_content: recommendation,
        ifai_consistency: verdict === 'LIKELY_FAKE' ? 'Factual contradictions detected.' : 'Internally consistent.',
      },
      evidence: [
        {
          type: verdict === 'LIKELY_FAKE' ? 'prosecutor_flag' : 'defender_corroboration',
          description: recommendation,
          confidence,
          severity: verdict === 'LIKELY_FAKE' ? 'high' : 'low',
          source_url: sourceUrl || undefined,
        },
      ],
      human_review_needed: verdict === 'UNCERTAIN',
      recommendation,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message || 'Internal serverless error' }),
    };
  }
};
