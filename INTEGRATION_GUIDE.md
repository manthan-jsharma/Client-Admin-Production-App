# Integration Guide: Connecting Real Services

This guide shows you how to replace mock implementations with real external services. All service adapters are located in `/lib/services/`.

## Architecture Overview

The codebase uses an **adapter pattern** for external services, making it easy to swap between mock and real implementations. Each service has:

- Mock implementation (for development/testing)
- Real implementation (placeholder with TODO comments)
- Factory function to select implementation
- Service configuration via environment variables

## Services Overview

### 1. Email Service (`lib/services/email-service.ts`)

**Current:** Mock implementation (logs to console)

**Supported Providers:**
- Resend (recommended)
- AWS SES
- SendGrid (can be added)

#### Switching to Resend

1. **Install Resend SDK**
   ```bash
   npm install resend
   ```

2. **Get API Key**
   - Sign up at https://resend.com
   - Get your API key from settings

3. **Update `.env.local`**
   ```env
   NEXT_PUBLIC_EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

4. **Uncomment Resend Implementation**
   - Open `lib/services/email-service.ts`
   - Find the `ResendEmailService` class
   - Uncomment the API call code in the `send()` method
   - Replace placeholder implementations

#### Switching to AWS SES

1. **Setup AWS**
   - Create AWS account and configure credentials
   - Verify email addresses in SES console

2. **Install AWS SDK**
   ```bash
   npm install @aws-sdk/client-ses
   ```

3. **Update `.env.local`**
   ```env
   NEXT_PUBLIC_EMAIL_PROVIDER=ses
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=xxx
   AWS_SECRET_ACCESS_KEY=xxx
   ```

4. **Implement SES Service**
   - Uncomment `AWSSESEmailService` in email-service.ts
   - Replace TODO sections with actual SES SDK calls

### 2. Storage Service (`lib/services/storage-service.ts`)

**Current:** Mock implementation (memory storage)

**Supported Providers:**
- AWS S3
- Vercel Blob
- MinIO (can be added)

#### Switching to AWS S3

1. **Setup AWS S3**
   - Create S3 bucket
   - Configure CORS for uploads
   - Create IAM user with S3 permissions

2. **Install AWS SDK**
   ```bash
   npm install @aws-sdk/client-s3
   ```

3. **Update `.env.local`**
   ```env
   NEXT_PUBLIC_STORAGE_PROVIDER=s3
   AWS_S3_BUCKET=your-bucket-name
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=xxx
   AWS_SECRET_ACCESS_KEY=xxx
   ```

4. **Implement S3 Service**
   - Uncomment `S3StorageService` in storage-service.ts
   - Replace TODO sections with actual S3 SDK calls

#### Switching to Vercel Blob

1. **Setup Vercel Blob**
   - Vercel Blob is built into Vercel projects
   - Get token from Vercel dashboard

2. **Update `.env.local`**
   ```env
   NEXT_PUBLIC_STORAGE_PROVIDER=vercel-blob
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx
   ```

3. **Implement Vercel Blob Service**
   - Uncomment `VercelBlobStorageService`
   - Replace TODO with actual Vercel Blob SDK calls

### 3. Payment Service (`lib/services/payment-service.ts`)

**Current:** Mock implementation (simulated)

**Supported Providers:**
- Stripe (recommended)
- PayPal

#### Switching to Stripe

1. **Setup Stripe**
   - Create account at https://stripe.com
   - Get API keys from dashboard

2. **Install Stripe SDK**
   ```bash
   npm install stripe
   ```

3. **Update `.env.local`**
   ```env
   NEXT_PUBLIC_PAYMENT_PROVIDER=stripe
   STRIPE_PUBLIC_KEY=pk_xxx
   STRIPE_SECRET_KEY=sk_xxx
   ```

4. **Implement Stripe Service**
   - Uncomment `StripePaymentService`
   - Replace TODO with actual Stripe API calls
   - Use client-side Stripe.js for payment elements

5. **Create Payment API Route**
   ```typescript
   // app/api/payments/create-intent/route.ts
   import Stripe from 'stripe'
   
   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
   
   export async function POST(request: Request) {
     const { amount } = await request.json()
     
     const intent = await stripe.paymentIntents.create({
       amount: Math.round(amount * 100),
       currency: 'usd',
     })
     
     return Response.json({ clientSecret: intent.client_secret })
   }
   ```

#### Switching to PayPal

1. **Setup PayPal**
   - Create business account at https://www.paypal.com/signin
   - Get Client ID and Secret from dashboard

2. **Update `.env.local`**
   ```env
   NEXT_PUBLIC_PAYMENT_PROVIDER=paypal
   PAYPAL_CLIENT_ID=xxx
   PAYPAL_SECRET=xxx
   ```

3. **Implement PayPal Service**
   - Uncomment `PayPalPaymentService`
   - Replace TODO with actual PayPal API calls

### 4. AI Service (`lib/services/ai-service.ts`)

**Current:** Mock implementation (keyword-based responses)

**Supported Providers:**
- OpenAI (recommended)
- Anthropic Claude
- Groq (can be added)

#### Switching to OpenAI

1. **Setup OpenAI**
   - Create account at https://openai.com
   - Generate API key from dashboard

2. **Install OpenAI SDK**
   ```bash
   npm install openai
   ```

3. **Update `.env.local`**
   ```env
   NEXT_PUBLIC_AI_PROVIDER=openai
   OPENAI_API_KEY=sk_xxx
   ```

4. **Implement OpenAI Service**
   - Uncomment `OpenAIService`
   - Replace TODO with actual OpenAI API calls
   - Set model to `gpt-4` for better results (gpt-3.5-turbo is cheaper)

5. **Create AI Chat API Route**
   ```typescript
   // app/api/ai/chat/route.ts
   import { OpenAI } from 'openai'
   
   const openai = new OpenAI()
   
   export async function POST(request: Request) {
     const { message, conversationHistory } = await request.json()
     
     const response = await openai.chat.completions.create({
       model: 'gpt-3.5-turbo',
       messages: [
         ...conversationHistory,
         { role: 'user', content: message },
       ],
     })
     
     return Response.json({ 
       message: response.choices[0].message.content 
     })
   }
   ```

#### Switching to Anthropic Claude

1. **Setup Anthropic**
   - Create account at https://console.anthropic.com
   - Generate API key

2. **Install Anthropic SDK**
   ```bash
   npm install @anthropic-ai/sdk
   ```

3. **Update `.env.local`**
   ```env
   NEXT_PUBLIC_AI_PROVIDER=anthropic
   ANTHROPIC_API_KEY=sk-ant-xxx
   ```

4. **Implement Anthropic Service**
   - Uncomment `AnthropicService`
   - Replace TODO with actual Anthropic API calls

## Error Handling & Logging

### Using the Error Handler

```typescript
import { AppError, ErrorCodes, logError } from '@/lib/error-handler'

// In your API routes
try {
  // Your code
} catch (error) {
  logError(error, {
    service: 'payment-service',
    endpoint: '/api/payments',
    userId: userId,
  })
  
  return NextResponse.json(
    { error: 'Payment processing failed' },
    { status: 500 }
  )
}
```

### Validation

```typescript
import { Validators } from '@/lib/error-handler'

// Validate email
if (!Validators.email(email)) {
  throw new AppError(
    ErrorCodes.INVALID_INPUT,
    'Invalid email format',
    400
  )
}

// Validate password
const { valid, errors } = Validators.password(password)
if (!valid) {
  throw new AppError(
    ErrorCodes.VALIDATION_FAILED,
    errors.join(', '),
    400
  )
}
```

### Retry Logic

```typescript
import { retryWithExponentialBackoff } from '@/lib/error-handler'

const result = await retryWithExponentialBackoff(
  () => externalAPICall(),
  { maxRetries: 3, initialDelayMs: 1000 }
)
```

## Database Integration

Currently using mock in-memory database. To switch to real database:

### MongoDB

1. **Setup MongoDB**
   ```bash
   npm install mongodb
   ```

2. **Update `lib/db.ts`**
   - Replace mock implementation with MongoDB client
   - Use connection string from MongoDB Atlas

3. **Update `.env.local`**
   ```env
   DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/dbname
   ```

### PostgreSQL / Supabase

1. **Setup Supabase/PostgreSQL**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Update `lib/db.ts`**
   - Replace mock implementation with Supabase client
   - Setup tables with migrations

3. **Update `.env.local`**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJxxx
   ```

## Checklist for Going to Production

- [ ] Replace mock implementations with real services
- [ ] Update all `.env.local` variables to production values
- [ ] Test each service in staging environment
- [ ] Setup error tracking (Sentry, LogRocket, etc.)
- [ ] Configure CORS for APIs
- [ ] Setup backup/disaster recovery
- [ ] Configure rate limiting
- [ ] Enable HTTPS everywhere
- [ ] Setup monitoring and alerts
- [ ] Review security settings for each service
- [ ] Load test with production data
- [ ] Create runbook for common issues

## Common Issues & Solutions

### Email Not Sending
- Check API key is correct
- Verify sender email is authorized
- Check email address format
- Review service logs for errors

### File Upload Failed
- Verify bucket/container permissions
- Check file size limits
- Verify CORS configuration
- Check API credentials

### Payment Processing Errors
- Verify API keys
- Check PCI compliance
- Review transaction logs
- Check currency settings

### AI Service Not Responding
- Check API key validity
- Monitor token usage
- Check rate limits
- Review conversation history size

## Support & Resources

- Email Service: https://resend.com/docs
- Storage: https://docs.aws.amazon.com/s3/
- Payments: https://stripe.com/docs/api
- AI: https://platform.openai.com/docs/api-reference
- Error Tracking: https://sentry.io/for/nextjs/
