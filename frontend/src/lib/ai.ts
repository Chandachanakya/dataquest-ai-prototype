
import { getGroqChatCompletion } from './groq';
import { Message } from './types';

export async function getAIResponse(messages: Message[]): Promise<string> {
  return await getGroqChatCompletion(messages);
}
