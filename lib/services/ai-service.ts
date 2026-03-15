/**
 * AI Service Adapter
 * Switch between mock implementation and real OpenAI/Anthropic
 */

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  success: boolean
  message?: string
  error?: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

// Mock implementation
class MockAIService {
  private conversationHistory: AIMessage[] = []

  async chat(message: string): Promise<AIResponse> {
    try {
      this.conversationHistory.push({
        role: 'user',
        content: message,
      })

      // Generate mock response based on keywords
      let response = 'I understand. How can I help you further?'

      if (message.toLowerCase().includes('project')) {
        response = 'Regarding your project: I can help you track milestones, manage tasks, and monitor progress. What specific aspect would you like assistance with?'
      } else if (message.toLowerCase().includes('payment')) {
        response = 'For payment inquiries: I can provide information about invoices, payment history, and billing details. What would you like to know?'
      } else if (message.toLowerCase().includes('roadmap')) {
        response = 'Your 14-day roadmap is structured in phases. Each phase includes specific deliverables. Would you like details about a particular phase?'
      } else if (message.toLowerCase().includes('setup')) {
        response = 'For setup items: We have a checklist of 5 essential items to get started. You can track completion status for each item.'
      } else if (message.toLowerCase().includes('help')) {
        response = 'I can assist with: project management, payment tracking, setup instructions, roadmap questions, and general platform usage. What do you need help with?'
      }

      this.conversationHistory.push({
        role: 'assistant',
        content: response,
      })

      console.log('[MOCK AI]', { userMessage: message, aiResponse: response })

      return {
        success: true,
        message: response,
        usage: {
          inputTokens: Math.ceil(message.length / 4),
          outputTokens: Math.ceil(response.length / 4),
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI service error',
      }
    }
  }

  getConversationHistory(): AIMessage[] {
    return [...this.conversationHistory]
  }

  clearConversation(): void {
    this.conversationHistory = []
  }
}

// OpenAI implementation (placeholder)
class OpenAIService {
  private apiKey: string
  private model: string = 'gpt-3.5-turbo'

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || 'placeholder-key'
  }

  async chat(message: string, conversationHistory?: AIMessage[]): Promise<AIResponse> {
    try {
      // TODO: Implement real OpenAI API call
      // const openai = new OpenAI({ apiKey: this.apiKey })
      // const messages = [
      //   ...(conversationHistory || []),
      //   { role: 'user', content: message },
      // ]
      //
      // const response = await openai.chat.completions.create({
      //   model: this.model,
      //   messages: messages as any,
      //   temperature: 0.7,
      //   max_tokens: 500,
      // })
      //
      // const content = response.choices[0].message.content || ''
      // return {
      //   success: true,
      //   message: content,
      //   usage: {
      //     inputTokens: response.usage?.prompt_tokens || 0,
      //     outputTokens: response.usage?.completion_tokens || 0,
      //   },
      // }

      return {
        success: true,
        message: 'Placeholder response from OpenAI',
        usage: { inputTokens: 0, outputTokens: 0 },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OpenAI API error',
      }
    }
  }
}

// Anthropic Claude implementation (placeholder)
class AnthropicService {
  private apiKey: string
  private model: string = 'claude-3-sonnet-20240229'

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || 'placeholder-key'
  }

  async chat(message: string, conversationHistory?: AIMessage[]): Promise<AIResponse> {
    try {
      // TODO: Implement real Anthropic API call
      // const client = new Anthropic({ apiKey: this.apiKey })
      // const messages = [
      //   ...(conversationHistory || []),
      //   { role: 'user', content: message },
      // ]
      //
      // const response = await client.messages.create({
      //   model: this.model,
      //   max_tokens: 1024,
      //   messages: messages as any,
      // })
      //
      // const content = response.content[0].type === 'text' ? response.content[0].text : ''
      // return {
      //   success: true,
      //   message: content,
      //   usage: {
      //     inputTokens: response.usage.input_tokens,
      //     outputTokens: response.usage.output_tokens,
      //   },
      // }

      return {
        success: true,
        message: 'Placeholder response from Anthropic',
        usage: { inputTokens: 0, outputTokens: 0 },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Anthropic API error',
      }
    }
  }
}

// Export factory function
export function getAIService(): MockAIService | OpenAIService | AnthropicService {
  const provider = process.env.NEXT_PUBLIC_AI_PROVIDER || 'mock'

  switch (provider) {
    case 'openai':
      return new OpenAIService()
    case 'anthropic':
      return new AnthropicService()
    case 'mock':
    default:
      return new MockAIService()
  }
}

// AI prompt templates
export const AIPrompts = {
  projectAssistant: (projectName: string) => `You are a helpful project management assistant for the project "${projectName}". Help users with questions about their project status, roadmap, deliverables, and timeline.`,

  supportAgent: () => 'You are a helpful customer support agent. Answer questions about the platform, features, and help users troubleshoot issues. Be professional and courteous.',

  contentAdvisor: () => 'You are a content and communication advisor. Help users improve their project descriptions, messaging, and communication with stakeholders.',
}
