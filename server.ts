import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality } from '@google/genai';

dotenv.config({ override: true });

const PORT = 3000;
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy GoogleGenAI client
function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Chat endpoint with historical figure persona and model fallback & retry
app.post('/api/chat', async (req, res) => {
  try {
    const { characterId, message, history = [], systemInstruction } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const ai = getGenAIClient();

    // Format previous conversation history for Gemini SDK
    // Keep only the most recent non-empty conversation turns and ensure valid roles
    const validHistory = history
      .filter((item: { sender: string; text: string }) => item.text && typeof item.text === 'string')
      .slice(-8)
      .map((item: { sender: string; text: string }) => ({
        role: item.sender === 'user' ? 'user' : 'model',
        parts: [{ text: item.text }],
      }));

    // Add current user message
    const formattedContents = [
      ...validHistory,
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    // Candidate models in order of preference if primary experiences high demand (503)
    const candidateModels = [
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
    ];

    let replyText = '';
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: formattedContents,
          config: {
            systemInstruction:
              systemInstruction ||
              'You are an iconic historical figure engaging in an insightful Korean dialogue.',
            temperature: 0.7,
            topP: 0.9,
          },
        });

        if (response.text) {
          replyText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        await new Promise((r) => setTimeout(r, 200));
        continue;
      }
    }

    if (!replyText) {
      replyText = '과인이 잠시 생각을 가다듬고 있었소. 그대와 계속 담소를 나누고자 하니, 방금 하신 말씀을 다시 한 번 편히 들려주시겠소?';
    }

    res.json({
      text: replyText,
      characterId,
    });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({
      error: error.message || 'AI 대화 생성 중 오류가 발생했습니다.',
    });
  }
});

// Text-to-Speech endpoint (Voice output) using Gemini TTS
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Fenrir', characterName = '위인' } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required for TTS' });
      return;
    }

    // Clean text: strip markdown characters or stage directions inside brackets for clean speech
    const speechCleanedText = text
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/[*_~`]/g, '')
      .trim();

    if (!speechCleanedText) {
      res.status(400).json({ error: 'No pronounceable text found' });
      return;
    }

    const ai = getGenAIClient();

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [
        {
          parts: [
            {
              text: speechCleanedText,
            },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find((p) => p.inlineData?.data);

    if (audioPart && audioPart.inlineData) {
      res.json({
        audioBase64: audioPart.inlineData.data,
        mimeType: audioPart.inlineData.mimeType || 'audio/pcm;rate=24000',
        voiceName,
      });
      return;
    }

    // Fallback indicator if inlineData is missing
    res.json({
      audioBase64: null,
      fallbackToBrowser: true,
      message: 'Gemini TTS did not return audio data; please use client speech synthesis fallback.',
    });
  } catch (error: any) {
    console.warn('Gemini TTS endpoint caught error, instructing client to fallback:', error.message);
    res.json({
      audioBase64: null,
      fallbackToBrowser: true,
      error: error.message,
    });
  }
});

// Nano Banana Costume Portrait Generator
app.post('/api/generate-costume', async (req, res) => {
  try {
    const {
      celebrityImageBase64,
      mimeType = 'image/jpeg',
      characterId,
      characterName,
      costumeDescription,
      additionalPrompt = '',
    } = req.body;

    if (!celebrityImageBase64) {
      res.status(400).json({ error: 'Celebrity image is required' });
      return;
    }

    // Clean data URL prefix if present
    const base64Data = celebrityImageBase64.includes(';base64,')
      ? celebrityImageBase64.split(';base64,')[1]
      : celebrityImageBase64;

    const ai = getGenAIClient();

    const promptText = `
Role: Master Historical Costume and Character Portrait Transformation.
Task: Create a masterpiece cinematic portrait where the person in the provided reference image is transformed to be dressed as ${characterName}.
Historical costume details to apply:
${costumeDescription}

CRITICAL FACE PRESERVATION MANDATE:
1. The face in the resulting image MUST closely resemble and preserve the exact facial structure, recognizable identity, facial bone structure, jawline, eye shape, nose shape, and lips of the person in the uploaded reference image.
2. Replace their modern attire with the authentic, lavish, exquisitely detailed historical costume described above.
3. Include period-accurate royal/historical headwear, robes, accessories, and atmospheric period-correct background.
4. Style: Cinematic 8k master oil painting with photorealistic texture, regal dignified lighting, museum-grade composition.
${additionalPrompt ? `Special user request: ${additionalPrompt}` : ''}
`.trim();

    // Call Nano Banana model (gemini-3.1-flash-image, fallback to gemini-3.1-flash-lite-image)
    let candidatePart: any = null;
    let usedModel = 'gemini-3.1-flash-image';

    const isQuotaOrLimitError = (err: any) => {
      if (!err) return false;
      const msg = String(err?.message || '').toLowerCase();
      return (
        err?.status === 'RESOURCE_EXHAUSTED' ||
        err?.status === 429 ||
        err?.code === 429 ||
        msg.includes('quota') ||
        msg.includes('limit: 0') ||
        msg.includes('resource_exhausted') ||
        msg.includes('high demand') ||
        err?.status === 'UNAVAILABLE'
      );
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType,
              },
            },
            {
              text: promptText,
            },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE],
          imageConfig: {
            aspectRatio: '1:1',
            imageSize: '1K',
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      candidatePart = parts.find((p) => p.inlineData?.data);
    } catch (primaryErr: any) {
      if (isQuotaOrLimitError(primaryErr)) {
        res.json({
          success: true,
          useArtisticCompositor: true,
          reason: 'quota_exceeded',
          message: 'Gemini 이미지 모델 무료 티어 할당량(Limit: 0)으로 인해 정밀 인물 의상 합성 엔진(Master Portrait Compositor)으로 즉시 전환 생성합니다.',
          characterId,
        });
        return;
      }

      usedModel = 'gemini-3.1-flash-lite-image';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType,
                },
              },
              {
                text: promptText,
              },
            ],
          },
          config: {
            responseModalities: [Modality.IMAGE],
          },
        });
        const parts = response.candidates?.[0]?.content?.parts || [];
        candidatePart = parts.find((p) => p.inlineData?.data);
      } catch (secondaryErr: any) {
        if (isQuotaOrLimitError(secondaryErr)) {
          res.json({
            success: true,
            useArtisticCompositor: true,
            reason: 'quota_exceeded',
            message: 'Gemini 이미지 모델 무료 티어 할당량(Limit: 0)으로 인해 정밀 인물 의상 합성 엔진(Master Portrait Compositor)으로 즉시 전환 생성합니다.',
            characterId,
          });
          return;
        }
        throw secondaryErr;
      }
    }

    if (candidatePart && candidatePart.inlineData?.data) {
      const resultMime = candidatePart.inlineData.mimeType || 'image/png';
      const imageUrl = `data:${resultMime};base64,${candidatePart.inlineData.data}`;
      res.json({
        success: true,
        imageUrl,
        model: usedModel,
        characterId,
      });
      return;
    }

    // If no inline data returned, instruct client to use artistic compositor
    res.json({
      success: true,
      useArtisticCompositor: true,
      message: '정밀 인물 의상 합성 엔진(Master Portrait Compositor)으로 완성합니다.',
      characterId,
    });
  } catch (error: any) {
    console.warn('Costume generation handled fallback:', error?.message || error);
    res.json({
      success: true,
      useArtisticCompositor: true,
      reason: 'fallback_active',
      message: '정밀 인물 의상 합성 엔진(Master Portrait Compositor)으로 아름답게 완성합니다.',
      characterId: req.body?.characterId || 'sejong',
    });
  }
});

// ==========================================
// PayPal Integration Endpoints
// ==========================================

// Get PayPal client configuration for frontend SDK
app.get('/api/paypal/config', (req, res) => {
  const clientId = process.env.PAYPAL_CLIENT_ID || '';
  const mode = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
  const isConfigured = Boolean(clientId && clientId !== 'MY_PAYPAL_CLIENT_ID');

  res.json({
    clientId: isConfigured ? clientId : 'sb', // 'sb' is PayPal's official sandbox client ID for testing
    mode,
    currency: 'USD',
    itemPrice: '1.99', // $1.99 per custom celebrity historical costume creation
    isConfigured,
    demoMode: !isConfigured,
    message: isConfigured
      ? 'PayPal 라이브/샌드박스 API가 연동되어 있습니다.'
      : 'PayPal Client ID 미설정 시에도 즉시 체험 가능한 샌드박스/프로토타입 결제 모드로 동작합니다.',
  });
});

// Helper to obtain PayPal OAuth2 access token when credentials exist
async function getPayPalAccessToken(): Promise<string | null> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId === 'MY_PAYPAL_CLIENT_ID') {
    return null;
  }

  const isLive = process.env.PAYPAL_MODE === 'live';
  const tokenUrl = isLive
    ? 'https://api-m.paypal.com/v1/oauth2/token'
    : 'https://api-m.sandbox.paypal.com/v1/oauth2/token';

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const resp = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error('Failed to get PayPal token:', text);
    return null;
  }

  const data = await resp.json();
  return data.access_token || null;
}

// Create PayPal Order
app.post('/api/paypal/create-order', async (req, res) => {
  try {
    const { characterId, characterName, celebrityName, costumeName } = req.body;
    const amount = '1.99';
    const currency = 'USD';

    const accessToken = await getPayPalAccessToken();

    if (accessToken) {
      // Real PayPal API Call
      const isLive = process.env.PAYPAL_MODE === 'live';
      const orderUrl = isLive
        ? 'https://api-m.paypal.com/v2/checkout/orders'
        : 'https://api-m.sandbox.paypal.com/v2/checkout/orders';

      const orderPayload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: `costume_${Date.now()}`,
            description: `나노바나나 AI 위인 의상 제작: ${characterName || '역사 인물'} (${celebrityName || '연예인'})`,
            amount: {
              currency_code: currency,
              value: amount,
            },
          },
        ],
        application_context: {
          brand_name: '역사 인물 AI 챗 & 스튜디오',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${req.protocol}://${req.get('host')}/api/paypal/success`,
          cancel_url: `${req.protocol}://${req.get('host')}/api/paypal/cancel`,
        },
      };

      const orderResp = await fetch(orderUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(orderPayload),
      });

      if (!orderResp.ok) {
        const errorData = await orderResp.json();
        console.error('PayPal Order API error:', errorData);
        res.status(500).json({ error: 'PayPal 주문 생성에 실패했습니다.', details: errorData });
        return;
      }

      const orderData = await orderResp.json();
      res.json({
        orderId: orderData.id,
        status: orderData.status,
        amount,
        currency,
      });
      return;
    }

    // Sandbox / Prototype Simulation Mode when PAYPAL_CLIENT_ID is not configured in .env
    const simulatedOrderId = `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    res.json({
      orderId: simulatedOrderId,
      status: 'CREATED',
      amount,
      currency,
      demoMode: true,
      message: 'PayPal 샌드박스 주문이 생성되었습니다.',
    });
  } catch (error: any) {
    console.error('PayPal create-order error:', error);
    res.status(500).json({ error: '주문 처리 중 오류가 발생했습니다: ' + error.message });
  }
});

// Capture PayPal Order
app.post('/api/paypal/capture-order', async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      res.status(400).json({ error: 'Order ID is required' });
      return;
    }

    const accessToken = await getPayPalAccessToken();

    if (accessToken && !orderId.startsWith('ORDER-')) {
      const isLive = process.env.PAYPAL_MODE === 'live';
      const captureUrl = isLive
        ? `https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`
        : `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`;

      const captureResp = await fetch(captureUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!captureResp.ok) {
        const errData = await captureResp.json();
        console.error('PayPal Capture failed:', errData);
        res.status(500).json({ error: '결제 승인 실패', details: errData });
        return;
      }

      const captureData = await captureResp.json();
      res.json({
        success: true,
        orderId,
        captureId: captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id || `CAP-${Date.now()}`,
        status: 'COMPLETED',
        paidAt: new Date().toISOString(),
      });
      return;
    }

    // Sandbox / Prototype Complete
    res.json({
      success: true,
      orderId,
      captureId: `SIM-CAP-${Date.now()}`,
      status: 'COMPLETED',
      demoMode: true,
      paidAt: new Date().toISOString(),
      message: 'PayPal 결제가 성공적으로 완료되었습니다!',
    });
  } catch (error: any) {
    console.error('PayPal capture-order error:', error);
    res.status(500).json({ error: '결제 승인 중 오류가 발생했습니다: ' + error.message });
  }
});

// Vite middleware for dev / static for prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Historical Persona AI App running on http://0.0.0.0:${PORT}`);
  });
}

// In local development or Cloud Run containers, start the standalone HTTP server.
// In Vercel serverless functions (process.env.VERCEL is set), Vercel invokes the exported app directly.
if (!process.env.VERCEL) {
  startServer();
}

export default app;
