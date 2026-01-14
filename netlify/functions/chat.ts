
import { Handler } from '@netlify/functions';
import OpenAI from 'openai';

export const handler: Handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'OPENAI_API_KEY is not configured in Netlify environment variables.' }),
    };
  }

  try {
    const { messages, styleInstruction } = JSON.parse(event.body || '{}');
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Using high-quality model for best Kolokwa results
      messages: [
        { role: 'system', content: styleInstruction },
        ...messages
      ],
      temperature: 0.8,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ text: response.choices[0].message.content }),
    };
  } catch (error: any) {
    console.error('OpenAI Error:', error);
    return {
      statusCode: error.status || 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};
