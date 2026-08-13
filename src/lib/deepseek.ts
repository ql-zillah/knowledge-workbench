// ============================================================
// DeepSeek API 客户端 — 纯问答，不依赖知识库
// ============================================================

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY as string;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1/chat/completions';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

/**
 * 非流式聊天（简单可靠）
 */
export async function chat(
  messages: Array<{ role: string; content: string }>,
): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API Key 未配置。请在 .env.local 中设置 VITE_DEEPSEEK_API_KEY。');
  }

  const response = await fetch(DEEPSEEK_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content:
            '你是一个知识渊博的AI助手，帮助用户解答各种问题。请用简洁清晰的语言回答，避免空洞的套话。如果问题涉及专业领域，请提供有深度的见解。用 Markdown 格式输出回答。',
        },
        ...messages,
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => 'Unknown error');
    if (response.status === 401) {
      throw new Error('DeepSeek API Key 无效，请检查 .env.local 中的 VITE_DEEPSEEK_API_KEY');
    }
    throw new Error(`DeepSeek API 错误 (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * 流式聊天（打字机效果）
 * @param onChunk 每收到一段文本时回调
 * @param onDone 完成时回调
 * @param onError 出错时回调
 */
export async function chatStream(
  messages: Array<{ role: string; content: string }>,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: Error) => void,
): Promise<void> {
  if (!DEEPSEEK_API_KEY) {
    onError(new Error('DeepSeek API Key 未配置。请在 .env.local 中设置 VITE_DEEPSEEK_API_KEY。'));
    return;
  }

  try {
    const response = await fetch(DEEPSEEK_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              '你是一个知识渊博的AI助手，帮助用户解答各种问题。请用简洁清晰的语言回答，避免空洞的套话。如果问题涉及专业领域，请提供有深度的见解。用 Markdown 格式输出回答。',
          },
          ...messages,
        ],
        max_tokens: 2000,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error');
      if (response.status === 401) {
        throw new Error(
          'DeepSeek API Key 无效，请检查 .env.local 中的 VITE_DEEPSEEK_API_KEY',
        );
      }
      throw new Error(`DeepSeek API 错误 (${response.status}): ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            onChunk(content);
          }
        } catch {
          // 跳过无法解析的行
        }
      }
    }

    onDone();
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}
