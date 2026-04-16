import OpenAI from "openai";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface MiniMaxConfig {
  apiKey: string;
  groupId: string;
}

export class MiniMaxClient {
  private client: OpenAI;
  private groupId: string;

  constructor(config: MiniMaxConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: "https://api.minimax.io/v1",
    });
    this.groupId = config.groupId;
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: "MiniMax-M2.7",
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      temperature: 0.7,
      max_tokens: 8192,
    });

    return response.choices[0]?.message?.content || "";
  }
}

export const createMiniMaxClient = (config: MiniMaxConfig) =>
  new MiniMaxClient(config);
