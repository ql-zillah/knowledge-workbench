import { useState, useEffect, useRef, useCallback } from 'react';
import { chatStream, type ChatMessage } from '../lib/deepseek';

// ============================================================
// localStorage 持久化
// ============================================================
const STORAGE_KEY = 'knowledge_workbench_ai_chat';

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // localStorage 满了，忽略
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================
// Markdown 简单渲染（加粗、代码块、列表）
// ============================================================
function SimpleMarkdown({ text }: { text: string }) {
  // 分割为代码块和普通文本
  const parts = text.split(/(```[a-z]*\n[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, i) => {
        // 代码块
        const codeMatch = part.match(/^```(?:[a-z]*\n)?([\s\S]*?)```$/);
        if (codeMatch) {
          return (
            <pre
              key={i}
              className="my-2 overflow-x-auto rounded-lg bg-gray-800 p-3 text-sm text-green-300"
            >
              <code>{codeMatch[1].trim()}</code>
            </pre>
          );
        }

        // 普通文本：处理加粗、行内代码、链接、列表
        const processed = part
          // 加粗
          .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
          // 行内代码
          .replace(/`([^`]+)`/g, '<code class="bg-amber-50 px-1 rounded text-sm text-pink-600">$1</code>')
          // 链接
          .replace(
            /\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener" class="text-amber-600 underline hover:noopener">$1</a>',
          );

        // 处理列表（以 - 或数字. 开头）
        const lines = processed.split('\n');
        const result: string[] = [];
        let inList = false;

        for (let j = 0; j < lines.length; j++) {
          const line = lines[j];
          const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)/);
          if (listMatch) {
            if (!inList) {
              inList = true;
            }
            result.push(
              `<li class="ml-4 list-disc">${listMatch[3]}</li>`,
            );
          } else {
            if (inList) {
              inList = false;
            }
            if (line.trim() === '') {
              result.push('<br />');
            } else {
              result.push(`<span>${line}</span>`);
            }
          }
        }

        return (
          <span
            key={i}
            dangerouslySetInnerHTML={{ __html: result.join('') }}
          />
        );
      })}
    </>
  );
}

// ============================================================
// AI 聊天页面
// ============================================================
export default function AiChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // 保存到 localStorage
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  // 发送消息
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setStreamingContent('');

    // 构建发送给 DeepSeek 的消息列表（只传 role + content）
    const apiMessages = [...messages, userMsg]
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    await chatStream(
      apiMessages,
      // onChunk
      (chunk) => {
        setStreamingContent((prev) => prev + chunk);
      },
      // onDone
      () => {
        setStreamingContent((prev) => {
          if (prev) {
            const assistantMsg: ChatMessage = {
              id: generateId(),
              role: 'assistant',
              content: prev,
              timestamp: Date.now(),
            };
            setMessages((msgs) => [...msgs, assistantMsg]);
          }
          return '';
        });
        setLoading(false);
      },
      // onError
      (error) => {
        const errorMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: `❌ **出错了**：${error.message}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        setStreamingContent('');
        setLoading(false);
      },
    );
  }, [input, loading, messages]);

  // 键盘事件：Enter 发送，Shift+Enter 换行
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 清空对话
  const handleClear = () => {
    if (window.confirm('确定要清空所有对话记录吗？')) {
      setMessages([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
      {/* 顶部操作栏 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">💬 AI 问答</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            基于 DeepSeek · 直接对话
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            清空对话
          </button>
        )}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto rounded-xl bg-amber-50/50 p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              DeepSeek AI 助手
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              直接向 AI 提问，获得深度解答。不需要切换到其他平台。
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                '解释一个复杂概念',
                '帮我分析一段文字',
                '推荐几本相关书籍',
                '翻译一段英文',
              ].map((hint) => (
                <button
                  key={hint}
                  type="button"
                  onClick={() => {
                    setInput(hint);
                    inputRef.current?.focus();
                  }}
                  className="rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-colors"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-amber-500 text-white'
                    : 'bg-white border border-amber-200 text-gray-800 shadow-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <SimpleMarkdown text={msg.content} />
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>
            </div>
          ))}

          {/* 流式输出中的消息 */}
          {streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl bg-white border border-amber-200 px-4 py-3 text-sm leading-relaxed text-gray-800 shadow-sm">
                <SimpleMarkdown text={streamingContent} />
                <span className="inline-block w-1.5 h-4 bg-amber-1000 ml-0.5 animate-pulse align-text-bottom" />
              </div>
            </div>
          )}

          {/* 加载指示器（等待第一个 token） */}
          {loading && !streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl bg-white border border-amber-200 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce [animation-delay:0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区域 */}
      <div className="mt-4">
        <div className="flex items-end gap-3 rounded-xl border border-amber-200 bg-white p-3 shadow-sm focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-200 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的问题… (Enter 发送，Shift+Enter 换行)"
            rows={2}
            disabled={loading}
            className="flex-1 resize-none border-none bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 rounded-lg bg-amber-500 p-2 text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
