export const PAYMESH_API_URL =
  process.env.PAYMESH_API_URL ?? 'http://localhost:3001';

const catalog = {
  notebook: {
    amount: '1.00',
    merchant: 'PayMesh Sandbox Store',
    purpose: 'Demo notebook',
  },
  headphones: {
    amount: '2.00',
    merchant: 'PayMesh Sandbox Store',
    purpose: 'Demo headphones',
  },
} as const;

export const shouldFallback = (status: number) =>
  status === 429 || status >= 500;

export async function choose(task: string, geminiKey: string) {
  const prompt = `Choose exactly one item for the user task from notebook or headphones. Return JSON with only item (notebook or headphones) and reason (brief). Never invent prices or items. User task: ${task}`;
  let content: string | undefined;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite')}:generateContent`,
      {
        method: 'POST',
        signal: AbortSignal.timeout(30000),
        headers: {
          'x-goog-api-key': geminiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      },
    );
    if (!response.ok) {
      if (!shouldFallback(response.status))
        throw new Error(
          `Gemini request failed (${response.status}). Check GEMINI_API_KEY and GEMINI_MODEL.`,
        );
      throw new Error(`Gemini temporarily unavailable (${response.status})`);
    }
    const result = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    content = result.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (error) {
    if (
      !(error instanceof TypeError) &&
      !(error instanceof DOMException && error.name === 'TimeoutError') &&
      !(
        error instanceof Error &&
        error.message.startsWith('Gemini temporarily unavailable')
      )
    )
      throw error;
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    if (!deepseekKey)
      throw new Error('Gemini is unavailable and DEEPSEEK_API_KEY is missing');
    console.log('Gemini unavailable; using DeepSeek fallback.');
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(30000),
      headers: {
        Authorization: `Bearer ${deepseekKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-flash',
        response_format: { type: 'json_object' },
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: `${prompt} Example JSON: {"item":"notebook","reason":"User requested it"}`,
          },
        ],
      }),
    });
    if (!response.ok)
      throw new Error(`DeepSeek fallback failed (${response.status})`);
    const result = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    content = result.choices?.[0]?.message?.content ?? undefined;
  }
  return JSON.parse(content ?? '{}') as { item?: string; reason?: string };
}

async function main() {
  const task = process.argv
    .slice(process.argv[2] === '--' ? 3 : 2)
    .join(' ')
    .trim();
  const geminiKey = process.env.GEMINI_API_KEY;
  const agentKey = process.env.PAYMESH_AGENT_API_KEY;
  if (!task || !geminiKey || !agentKey)
    throw new Error(
      'Set GEMINI_API_KEY and PAYMESH_AGENT_API_KEY, then run: pnpm --filter @paymesh/agent demo -- "Buy a notebook"',
    );
  const choice = await choose(task, geminiKey);
  if (
    (choice.item !== 'notebook' && choice.item !== 'headphones') ||
    typeof choice.reason !== 'string'
  )
    throw new Error('AI did not choose a catalog item');
  const item = catalog[choice.item];
  console.log(`AI chose ${choice.item}: ${choice.reason}`);
  const response = await fetch(`${PAYMESH_API_URL}/agent/payment-requests`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${agentKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...item,
      purpose: `${item.purpose}: ${choice.reason}`.slice(0, 500),
    }),
  });
  if (!response.ok)
    throw new Error(
      `PayMesh rejected request (${response.status}): ${await response.text()}`,
    );
  const request = (await response.json()) as { id: string; status: string };
  console.log(`PayMesh request ${request.id}: ${request.status}`);
  console.log('Continue in the Approvals page of the owner dashboard.');
}

if (require.main === module)
  void main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
