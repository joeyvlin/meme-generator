/**
 * AI Caption Generation Utility
 * Uses Groq API (free, fast alternative to OpenAI)
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function generateMemeCaptions(userInput) {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key not found. Please set VITE_GROQ_API_KEY in your environment variables.');
  }

  const prompt = `Generate 10 funny, creative meme captions based on this user input: "${userInput}". 
Make them humorous, relatable, and perfect for memes. Keep each caption concise (under 50 characters when possible). 
Return only the captions, one per line, without numbering or bullet points.`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a creative meme caption generator. Generate funny, relatable meme captions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate captions');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // Parse captions from response (split by newlines and filter empty)
    const captions = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^\d+[\.\)]/))
      .slice(0, 10);

    return captions.length > 0 ? captions : ['No captions generated'];
  } catch (error) {
    console.error('Error generating captions:', error);
    throw error;
  }
}
