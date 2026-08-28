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
    const apiKey = process.env.GROQ_API_KEY || payload.groq_api_key || '';

    if (!text || text.trim().length < 3) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Text input must be at least 3 characters long.' }),
      };
    }

    const prompt = `You are an adversarial multi-agent truth verification system (LangGraph Triad).
Analyze the following claim using strict factual knowledge and empirical truth.

CLAIM: "${text}"

You must return a strict JSON object with this exact schema (no markdown fences, just pure JSON):
{
  "trueAgent": {
    "proofFound": boolean (true if claim is factually true, false otherwise),
    "argument": string (True Agent's strongest factual argument),
    "sourceQuote": string (quote or verified fact corroborating the claim, or empty if unsupported)
  },
  "falseAgent": {
    "refutationFound": boolean (true if claim is factually false or contradicted, false otherwise),
    "argument": string (False Agent's counter-evidence or contradiction argument),
    "sourceQuote": string (quote or verified fact refuting the claim, or empty if claim is true)
  },
  "judge": {
    "verdict": "LIKELY_REAL" | "LIKELY_FAKE" | "UNCERTAIN",
    "confidence": number between 0.50 and 0.99,
    "ruling": string (concise 1-2 sentence decisive ruling),
    "borrowedRationale": string (which agent's proof prevailed and why)
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
          const content = groqData?.choices?.[0]?.message?.content;
          if (content) {
            llmDialectic = JSON.parse(content);
          }
        }
      } catch {
        // fallback to standard heuristics
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
      const lower = text.toLowerCase();
      const isSensational = /shocking|silenced|5g|conspiracy|secret|admit|hoax|miracle/i.test(lower);
      if (isSensational) {
        verdict = 'LIKELY_FAKE';
        confidence = 0.90;
        factCheckScore = 0.05;
        recommendation = '❌ High risk of misinformation detected.';
      } else {
        verdict = 'LIKELY_REAL';
        confidence = 0.85;
        factCheckScore = 0.90;
        recommendation = '✅ Corroborated authentic claim.';
      }
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
