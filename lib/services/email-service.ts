/**
 * Email Service Adapter
 * Switch between mock implementation and real Resend/SendGrid/AWS SES
 */

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
}

export interface EmailResponse {
  success: boolean
  messageId?: string
  error?: string
}

// Mock implementation
class MockEmailService {
  async send(options: EmailOptions): Promise<EmailResponse> {
    console.log('[MOCK EMAIL]', {
      to: options.to,
      subject: options.subject,
      timestamp: new Date().toISOString(),
    })
    
    return {
      success: true,
      messageId: `mock_${Date.now()}`,
    }
  }

  async sendBatch(emails: EmailOptions[]): Promise<EmailResponse[]> {
    return Promise.all(emails.map(email => this.send(email)))
  }
}

// Real Resend implementation (placeholder - uncomment when ready)
class ResendEmailService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || 'placeholder-key'
  }

  async send(options: EmailOptions): Promise<EmailResponse> {
    try {
      // TODO: Implement real Resend API call
      // const response = await fetch('https://api.resend.com/emails', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     from: options.from || 'noreply@example.com',
      //     to: options.to,
      //     subject: options.subject,
      //     html: options.html,
      //     reply_to: options.replyTo,
      //   }),
      // })

      // if (!response.ok) {
      //   throw new Error(`Resend API error: ${response.statusText}`)
      // }

      // const data = await response.json()
      // return {
      //   success: true,
      //   messageId: data.id,
      // }

      // Placeholder return
      return { success: true, messageId: 'placeholder-id' }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async sendBatch(emails: EmailOptions[]): Promise<EmailResponse[]> {
    return Promise.all(emails.map(email => this.send(email)))
  }
}

// AWS SES implementation (placeholder)
class AWSSESEmailService {
  async send(options: EmailOptions): Promise<EmailResponse> {
    try {
      // TODO: Implement real AWS SES API call using @aws-sdk/client-ses
      // const client = new SESClient({ region: 'us-east-1' })
      // const params = {
      //   Source: options.from || 'noreply@example.com',
      //   Destination: { ToAddresses: [options.to] },
      //   Message: {
      //     Subject: { Data: options.subject },
      //     Body: { Html: { Data: options.html } },
      //   },
      // }
      // const result = await client.send(new SendEmailCommand(params))
      // return { success: true, messageId: result.MessageId }

      return { success: true, messageId: 'placeholder-id' }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async sendBatch(emails: EmailOptions[]): Promise<EmailResponse[]> {
    return Promise.all(emails.map(email => this.send(email)))
  }
}

// Export factory function
export function getEmailService(): MockEmailService | ResendEmailService | AWSSESEmailService {
  const provider = process.env.NEXT_PUBLIC_EMAIL_PROVIDER || 'mock'

  switch (provider) {
    case 'resend':
      return new ResendEmailService()
    case 'ses':
      return new AWSSESEmailService()
    case 'mock':
    default:
      return new MockEmailService()
  }
}

// Email templates
export const EmailTemplates = {
  welcome: (name: string, email: string) => ({
    subject: 'Welcome to Our Platform',
    html: `
      <h1>Welcome, ${name}!</h1>
      <p>Your account has been created successfully.</p>
      <p>Email: ${email}</p>
    `,
  }),

  projectCreated: (projectName: string, clientName: string) => ({
    subject: `New Project: ${projectName}`,
    html: `
      <h1>Project Created</h1>
      <p>New project "${projectName}" has been created for ${clientName}.</p>
    `,
  }),

  paymentReceived: (amount: number, projectName: string) => ({
    subject: `Payment Received - ${projectName}`,
    html: `
      <h1>Payment Received</h1>
      <p>We received a payment of $${amount} for project "${projectName}".</p>
    `,
  }),

  setupCompleted: (itemName: string) => ({
    subject: `Setup Item Completed: ${itemName}`,
    html: `
      <h1>Setup Item Completed</h1>
      <p>The setup item "${itemName}" has been marked as completed.</p>
    `,
  }),

  newChatMessage: (senderName: string) => ({
    subject: `New Message from ${senderName}`,
    html: `
      <h1>New Chat Message</h1>
      <p>You have a new message from ${senderName}.</p>
    `,
  }),
}
