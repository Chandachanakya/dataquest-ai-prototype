
import Groq from 'groq-sdk';
import { Message } from './types';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function getGroqChatCompletion(messages: Message[]): Promise<string> {
  const systemMessage = {
    role: 'system' as const,
    content: `You are an AI learning mentor for a data science learning platform. Your role is to assist users with their learning journey.
    Users will ask you for:
    - Personalized learning path recommendations
    - Topic explanations and study tips
    - Challenge strategies and problem-solving guidance
    - Progress analysis and goal setting

    When a user asks for a recommendation, you should consider their progress, which you can infer from the conversation history.
    Provide clear, concise, and encouraging responses.
    Keep your answers focused on data science topics like Python, SQL, machine learning, and data visualization.
    Do not include any of your internal thoughts or reasoning in your response. Only provide the final answer to the user's input.`,
  };

  const formattedMessages = messages.map(msg => ({ role: msg.role, content: msg.content }));

  const response = await groq.chat.completions.create({
    messages: [systemMessage, ...formattedMessages],
    model: 'llama-3.3-70b-versatile',
  });

  return response.choices[0]?.message?.content || 'I am not sure how to respond to that. Please try again.';
}

