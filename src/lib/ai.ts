import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function callAI(prompt: string, maxTokens = 512): Promise<{ text: string }> {
  const response = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: maxTokens,
    messages:   [{ role: 'user', content: prompt }],
  })

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as any).text)
    .join('')

  return { text }
}
