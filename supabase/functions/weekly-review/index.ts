// ============================================================
// Edge Function: weekly-review
// ============================================================
// 职责：接收用户请求，查询本周笔记数据，调用 DeepSeek 生成 AI 周报
//       以 SSE 流式输出返回给前端
//
// 对应 PRD：REQ-REV-05~06
// 安全：API Key 从用户设置中读取，不暴露在前端
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // 从请求中获取 Supabase 认证信息
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 创建带有用户权限的客户端（用于查询用户自己的数据）
    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // 获取当前用户
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "未登录" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 从请求体获取周范围
    const { weekStart, weekEnd } = await req.json();

    // 查询本周数据
    const [notesRes, fleetingRes, outputsRes, settingsRes] = await Promise.all([
      userClient
        .from("notes")
        .select("title, core_viewpoint, my_understanding, type, tags")
        .gte("created_at", weekStart)
        .lte("created_at", weekEnd + "T23:59:59"),
      userClient
        .from("fleeting_notes")
        .select("trigger_text, my_view")
        .gte("created_at", weekStart)
        .lte("created_at", weekEnd + "T23:59:59"),
      userClient
        .from("outputs")
        .select("title, type, description, reflection")
        .gte("created_at", weekStart)
        .lte("created_at", weekEnd + "T23:59:59"),
      userClient
        .from("user_settings")
        .select("deepseek_api_key, nickname")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const deepseekKey = settingsRes.data?.deepseek_api_key;
    if (!deepseekKey) {
      return new Response(JSON.stringify({ error: "请先在设置中配置 DeepSeek API Key" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 检查是否有数据
    const notes = notesRes.data || [];
    const fleeting = fleetingRes.data || [];
    const outputs = outputsRes.data || [];

    if (notes.length === 0 && fleeting.length === 0 && outputs.length === 0) {
      return new Response(JSON.stringify({ error: "本周暂无笔记数据，无法生成周报" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 拼接 Prompt
    const weekData = {
      闪念笔记: fleeting.map((f: any) => ({
        内容: f.trigger_text,
        观点: f.my_view || "无",
      })),
      文献和永久笔记: notes.map((n: any) => ({
        标题: n.title,
        核心观点: n.core_viewpoint,
        我的理解: n.my_understanding || "无",
        类型: n.type,
        标签: n.tags?.join(", ") || "无",
      })),
      产出记录: outputs.map((o: any) => ({
        标题: o.title,
        类型: o.type,
        描述: o.description || "无",
        反思: o.reflection || "无",
      })),
    };

    const prompt = `你是用户的第二大脑助手，请基于用户本周的知识管理数据生成一份深度周报。

## 用户本周数据
${JSON.stringify(weekData, null, 2)}

## 周报要求
请按以下结构生成周报：

### 📊 本周知识主题聚类
将本周笔记按主题归类，识别核心学习方向。

### 💡 核心观点回顾
提炼本周最重要的 3-5 个观点。

### 🔗 知识关联发现
分析笔记之间可能存在但用户未注意到的关联。

### 📤 输出情况总结
评估本周的知识输出情况，输出是否充分。

### 🎯 下周建议方向
基于本周内容，给出 2-3 条下周行动建议。

请用简洁有洞察力的语言，避免空洞的套话。用 Markdown 格式输出。`;

    // 调用 DeepSeek API（流式）
    const aiResponse = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${deepseekKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "你是一个知识管理助手，擅长从碎片化的笔记中发现模式、提炼洞察、给出可执行的建议。" },
          { role: "user", content: prompt },
        ],
        stream: true,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      return new Response(JSON.stringify({ error: `AI 生成失败: ${aiResponse.status}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 将 DeepSeek 的 SSE 流式响应转换为纯文本流转发给前端
    const reader = aiResponse.body!.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            // 解析 SSE 格式，提取 content
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(new TextEncoder().encode(content));
                  }
                } catch {
                  // 忽略不完整的 JSON
                }
              }
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "服务器错误" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
