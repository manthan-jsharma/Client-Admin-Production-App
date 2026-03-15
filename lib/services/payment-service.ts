/**
 * Payment Service Adapter
 * Switch between mock implementation and real Stripe/PayPal
 */

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed'
  clientSecret?: string
}

export interface PaymentCreateOptions {
  amount: number
  currency?: string
  description?: string
  metadata?: Record<string, string>
}

export interface PaymentResponse {
  success: boolean
  paymentIntent?: PaymentIntent
  error?: string
}

// Mock implementation
class MockPaymentService {
  async createPaymentIntent(options: PaymentCreateOptions): Promise<PaymentResponse> {
    try {
      const paymentIntent: PaymentIntent = {
        id: `mock_${Date.now()}`,
        amount: options.amount,
        currency: options.currency || 'usd',
        status: 'pending',
        clientSecret: `mock_secret_${Date.now()}`,
      }

      console.log('[MOCK PAYMENT]', {
        amount: options.amount,
        currency: options.currency || 'usd',
        description: options.description,
      })

      return {
        success: true,
        paymentIntent,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      }
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<PaymentResponse> {
    return {
      success: true,
      paymentIntent: {
        id: paymentIntentId,
        amount: 0,
        currency: 'usd',
        status: 'succeeded',
      },
    }
  }

  async refund(paymentIntentId: string, amount?: number): Promise<PaymentResponse> {
    return {
      success: true,
      paymentIntent: {
        id: paymentIntentId,
        amount: amount || 0,
        currency: 'usd',
        status: 'succeeded',
      },
    }
  }
}

// Stripe implementation (placeholder)
class StripePaymentService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.STRIPE_SECRET_KEY || 'placeholder-key'
  }

  async createPaymentIntent(options: PaymentCreateOptions): Promise<PaymentResponse> {
    try {
      // TODO: Implement real Stripe API call
      // const stripe = new Stripe(this.apiKey)
      // const intent = await stripe.paymentIntents.create({
      //   amount: Math.round(options.amount * 100), // Convert to cents
      //   currency: options.currency || 'usd',
      //   description: options.description,
      //   metadata: options.metadata,
      // })
      //
      // return {
      //   success: true,
      //   paymentIntent: {
      //     id: intent.id,
      //     amount: options.amount,
      //     currency: intent.currency,
      //     status: intent.status as any,
      //     clientSecret: intent.client_secret || undefined,
      //   },
      // }

      return {
        success: true,
        paymentIntent: {
          id: 'placeholder-intent-id',
          amount: options.amount,
          currency: options.currency || 'usd',
          status: 'pending',
          clientSecret: 'placeholder-secret',
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      }
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<PaymentResponse> {
    try {
      // TODO: Implement real Stripe confirmation
      return {
        success: true,
        paymentIntent: {
          id: paymentIntentId,
          amount: 0,
          currency: 'usd',
          status: 'succeeded',
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Confirmation failed',
      }
    }
  }

  async refund(paymentIntentId: string, amount?: number): Promise<PaymentResponse> {
    try {
      // TODO: Implement real Stripe refund
      return {
        success: true,
        paymentIntent: {
          id: paymentIntentId,
          amount: amount || 0,
          currency: 'usd',
          status: 'succeeded',
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund failed',
      }
    }
  }
}

// PayPal implementation (placeholder)
class PayPalPaymentService {
  private clientId: string
  private secret: string

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID || 'placeholder-id'
    this.secret = process.env.PAYPAL_SECRET || 'placeholder-secret'
  }

  async createPaymentIntent(options: PaymentCreateOptions): Promise<PaymentResponse> {
    try {
      // TODO: Implement real PayPal API call
      return {
        success: true,
        paymentIntent: {
          id: 'placeholder-intent-id',
          amount: options.amount,
          currency: options.currency || 'usd',
          status: 'pending',
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      }
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<PaymentResponse> {
    return { success: true, paymentIntent: { id: paymentIntentId, amount: 0, currency: 'usd', status: 'succeeded' } }
  }

  async refund(paymentIntentId: string, amount?: number): Promise<PaymentResponse> {
    return { success: true, paymentIntent: { id: paymentIntentId, amount: amount || 0, currency: 'usd', status: 'succeeded' } }
  }
}

// Export factory function
export function getPaymentService(): MockPaymentService | StripePaymentService | PayPalPaymentService {
  const provider = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || 'mock'

  switch (provider) {
    case 'stripe':
      return new StripePaymentService()
    case 'paypal':
      return new PayPalPaymentService()
    case 'mock':
    default:
      return new MockPaymentService()
  }
}

export const CurrencyUtils = {
  formatAmount(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  },

  parseAmount(formattedAmount: string): number {
    const cleaned = formattedAmount.replace(/[^\d.-]/g, '')
    return parseFloat(cleaned) || 0
  },

  supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'],
}
