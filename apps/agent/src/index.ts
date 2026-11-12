export const PAYMESH_API_URL =
  process.env.PAYMESH_API_URL ?? 'http://localhost:3001';

const catalog = {
  pen: {
    amount: '0.50',
    merchant: 'PayMesh Sandbox Store',
    purpose: 'Demo pen',
  },
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
  cable: {
    amount: '1.50',
    merchant: 'PayMesh Sandbox Store',
    purpose: 'Demo charging cable',
  },
  lamp: {
    amount: '3.00',
    merchant: 'PayMesh Sandbox Store',
    purpose: 'Demo desk lamp',
  },
} as const;

export const shouldFallback = (status: number) =>
  status === 429 || status >= 500;

export async function choose(
  task: string,
  geminiKey: string,
  budgetCents = 200,
) {
  const options = Object.entries(catalog)
    .map(([id, item]) => `${id}: ${item.purpose}, $${item.amount}`)
    .join('; ');
  const prompt = `You are a shopping agent. Compare the available items with the user's goal and budget. Catalog: ${options}. Budget: $${(budgetCents / 100).toFixed(2)}. User goal: ${task}. Choose the best matching item within budget, or "none" if nothing matches or fits. Return JSON with item (catalog ID or "none") and reason (one specific sentence explaining the choice or decline). Never invent an item or price.`;
  let content: string | undefined;
  let provider = 'Gemini';
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
    provider = 'DeepSeek';
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
            content: `${prompt} Example JSON: {"item":"notebook","reason":"It matches the goal and costs less than the budget"}`,
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
  const result = JSON.parse(content ?? '{}') as {
    item?: string;
    reason?: string;
  };
  if (
    typeof result.reason !== 'string' ||
    !result.reason.trim() ||
    result.reason.length > 400 ||
    (result.item !== 'none' && !(result.item && result.item in catalog))
  )
    throw new Error('AI did not return a valid catalog decision');
  if (
    result.item !== 'none' &&
    Number(
      catalog[result.item as keyof typeof catalog].amount.replace('.', ''),
    ) > budgetCents
  )
    throw new Error('AI chose an item above the stated budget');
  return {
    item: result.item as keyof typeof catalog | 'none',
    reason: result.reason.trim(),
    provider,
  };
}

async function main() {
  const args = process.argv.slice(process.argv[2] === '--' ? 3 : 2);
  const budget = args[0] === '--budget' ? args[1] : '2.00';
  const task = args
    .slice(args[0] === '--budget' ? 2 : 0)
    .join(' ')
    .trim();
  if (
    !budget ||
    !/^(?:0|[1-9]\d*)\.\d{2}$/.test(budget) ||
    Number(budget) <= 0 ||
    budget.length > 10
  )
    throw new Error('Use a positive USD budget such as --budget 2.00');
  const budgetCents = Number(budget.replace('.', ''));
  const geminiKey = process.env.GEMINI_API_KEY;
  const agentKey = process.env.PAYMESH_AGENT_API_KEY;
  if (!task || !geminiKey || !agentKey)
    throw new Error(
      'Set GEMINI_API_KEY and PAYMESH_AGENT_API_KEY, then run: pnpm --filter @paymesh/agent demo -- "Buy a notebook"',
    );
  const choice = await choose(task, geminiKey, budgetCents);
  console.log(`${choice.provider} decision: ${choice.reason}`);
  if (choice.item === 'none') {
    console.log('No purchase submitted.');
    return;
  }
  const item = catalog[choice.item];
  console.log(
    `Selected ${choice.item} for $${item.amount} (budget $${budget}).`,
  );
  const response = await fetch(`${PAYMESH_API_URL}/agent/payment-requests`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${agentKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...item,
      task,
      aiReason: choice.reason,
      aiProvider: choice.provider,
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
