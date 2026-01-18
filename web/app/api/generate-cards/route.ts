/**
 * 知识卡片生成 API
 * 服务端代理，避免在前端暴露 API Key
 */

import { NextRequest, NextResponse } from 'next/server';

interface KnowledgeCard {
  id: string;
  title: string;
  description: string;
  tags: string[];
  icon?: string;
  highlighted?: boolean;
}

interface ConversationTurn {
  userMessage: string;
  aiResponse: string;
}

interface GenerateCardsRequest {
  conversations: ConversationTurn[];
  subject?: string;
  persona?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateCardsRequest = await request.json();
    const { conversations, subject = '知识', persona = '助手' } = body;

    // 验证输入
    if (!conversations || conversations.length === 0) {
      return NextResponse.json(
        { error: '缺少对话内容' },
        { status: 400 }
      );
    }

    // 从环境变量获取 API Key
    const apiKey = process.env.STEPFUN_API_KEY;

    if (!apiKey) {
      console.error('STEPFUN_API_KEY not configured in environment');
      return NextResponse.json(
        { error: '服务配置错误，请联系管理员' },
        { status: 500 }
      );
    }

    // 构建对话摘要
    const summary = conversations
      .map((c, i) => `【第${i + 1}轮】\n用户：${c.userMessage}\n助手：${c.aiResponse}`)
      .join('\n\n');

    // 调用 StepFun API
    const systemPrompt = `你是${subject}${persona}。请基于以下对话内容，生成3-5张知识卡片。

要求：
1. 每张卡片包含：标题（简短）、描述（精炼要点）、标签（2-4个关键词）
2. 卡片应该涵盖对话中的核心知识点
3. 标题要简洁明了（5-10字）
4. 描述要精炼准确（50-80字）
5. 标签要涵盖关键概念

请以JSON格式返回，格式如下：
[
  {
    "title": "知识标题",
    "description": "知识描述",
    "tags": ["标签1", "标签2", "标签3"]
  }
]`;

    const response = await fetch('https://api.stepfun.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'step-1v-8k',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `请基于以下对话生成知识卡片：\n\n${summary}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('StepFun API error:', response.status, errorText);
      return NextResponse.json(
        { error: '生成知识卡片失败，请稍后重试' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      return NextResponse.json(
        { error: 'AI 未返回任何内容' },
        { status: 500 }
      );
    }

    const content = data.choices[0].message.content;

    // 尝试解析 JSON
    let cards: KnowledgeCard[];
    try {
      // 尝试直接解析
      cards = JSON.parse(content);

      // 如果不是数组，尝试提取 JSON 部分
      if (!Array.isArray(cards)) {
        // 查找 JSON 数组部分
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          cards = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('无法解析 JSON');
        }
      }
    } catch (parseError) {
      console.error('Failed to parse knowledge cards JSON:', content);
      return NextResponse.json(
        { error: '知识卡片格式错误，请重试' },
        { status: 500 }
      );
    }

    // 验证并标准化卡片格式
    const validatedCards: KnowledgeCard[] = cards
      .filter((card: any) => card.title && card.description)
      .map((card: any, index: number) => ({
        id: `card-${Date.now()}-${index}`,
        title: card.title || '知识卡片',
        description: card.description || '',
        tags: Array.isArray(card.tags) ? card.tags : [],
        icon: card.icon || '📝',
        highlighted: index === 0, // 第一张卡片高亮
      }));

    // 限制卡片数量
    const limitedCards = validatedCards.slice(0, 5);

    return NextResponse.json({
      cards: limitedCards,
      total: limitedCards.length,
    });

  } catch (error) {
    console.error('Generate cards API error:', error);
    return NextResponse.json(
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}

// 支持 OPTIONS 请求（CORS）
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
