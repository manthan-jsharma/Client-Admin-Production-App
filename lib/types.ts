// User Types
export interface User {
  _id?: string;
  email: string;
  password?: string;
  role: 'admin' | 'client' | 'dev';
  name: string;
  phone?: string;
  company?: string;
  // New fields for auth & profile system
  businessName?: string;
  website?: string;
  about?: string;
  profilePicture?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvalFeedback?: string;
  approvedAt?: Date;
  addedByAdmin?: boolean; // true when admin manually created the account
  // Telegram integration
  telegramChatId?: string;      // set after user completes bot handshake
  telegramConnectToken?: string; // temporary token used in /start deep link
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  error?: string;
}

// Project Types
export interface Project {
  _id?: string;
  clientId: string;
  adminId: string;
  name: string;
  description: string;
  type: 'ai_saas' | 'content_distribution';
  contractPDF?: string; // S3 key
  scopePDF?: string;    // S3 key
  status: 'active' | 'completed' | 'on-hold' | 'planning';
  totalPrice?: number;
  startDate: Date;
  endDate: Date;
  roadmap: RoadmapItem[];
  dailyProgress: DailyProgress[];
  deliveries: Delivery[];
  assignedDevs?: string[];

  // Division A — AI SaaS
  uiDesignPreference?: string;   // submitted by client
  demoVideoS3Key?: string;       // uploaded by client (S3)
  proofOfCodeS3Key?: string;     // uploaded by admin (S3)

  // Division B — Content Distribution
  hdPhotoS3Key?: string;         // uploaded by client
  hdPhotoStatus?: 'pending_review' | 'approved' | 'revision_requested';
  hdPhotoAdminFeedback?: string;
  teamSelfieVideoS3Key?: string; // uploaded by client
  teamSelfieVideoStatus?: 'pending_review' | 'approved' | 'revision_requested';
  teamSelfieVideoAdminFeedback?: string;
  aiCloneSampleS3Key?: string;   // uploaded by admin
  aiCloneApprovalStatus?: 'pending_review' | 'approved' | 'rejected';
  aiCloneClientFeedback?: string;
  domainName?: string;
  designPreferences?: string;
  logoS3Key?: string;            // uploaded by client

  createdAt?: Date;
  updatedAt?: Date;
}

export interface RoadmapItem {
  _id?: string;
  projectId: string;
  day: number;
  title: string;
  description: string;
  videoUrl?: string;
  completed: boolean;
  adminNotes?: string;
  feedback?: string;
  approvedAt?: Date;
  createdAt?: Date;
}

export interface Delivery {
  _id?: string;
  projectId: string;
  deliveryNumber: number;   // D1, D2, D3…
  title: string;
  description: string;
  status: 'pending' | 'submitted' | 'client_reviewing' | 'approved' | 'revision_requested';
  proofS3Key?: string;      // admin uploads proof (S3)
  adminNotes?: string;
  clientFeedback?: string;
  signedOffAt?: Date;
  createdByRole?: 'admin' | 'dev';
  createdById?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DailyProgress {
  date: string;
  percentage: number;
  notes?: string;
}

// Setup Items
export interface SetupItem {
  _id?: string;
  projectId: string;
  itemNumber: number;
  title: string;
  value?: string;
  completed: boolean;
  completedAt?: Date;
}

// Payment Types
export interface Payment {
  _id?: string;
  projectId: string;
  clientId?: string; // denormalized for admin queries
  clientName?: string; // denormalized for admin queries
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'overdue';
  paymentMethod?: string;
  notes?: string;
  dueDate: Date;
  paidDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Dev Payment Types (admin → dev)
export interface DevPayment {
  _id?: string;
  projectId: string;
  devId: string;
  devName?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid';
  paymentMethod?: string;
  notes?: string;
  paidDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Chat Types
export interface ChatAttachment {
  s3Key: string;        // S3 object key (connect AWS later)
  filename: string;
  mimeType: string;
  size: number;         // bytes
  type: 'voice' | 'video' | 'file' | 'image';
  duration?: number;    // seconds, for voice/video
}

export interface EmbeddedTicket {
  ticketId: string;
  type: 'bug' | 'feature_request';
  title: string;
  status: 'open' | 'in_progress' | 'resolved';
}

export interface ChatMessage {
  _id?: string;
  projectId: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'client' | 'ai' | 'dev';
  message: string;
  attachments?: ChatAttachment[];
  type: 'text' | 'voice' | 'video' | 'file' | 'ticket';
  isAI?: boolean;
  readBy?: string[];       // array of userIds who have read this message
  ticket?: EmbeddedTicket; // set when type === 'ticket'
  createdAt: Date;
}

// Support Ticket Types
export interface Ticket {
  _id?: string;
  projectId?: string;
  clientId: string;
  clientName: string;
  subject: string;
  description: string;
  type: 'support' | 'feature_request' | 'bug' | 'billing' | 'general';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  adminResponse?: string;
  attachments?: string[]; // S3 keys
  createdAt?: Date;
  updatedAt?: Date;
  resolvedAt?: Date;
}

// Additional Services Catalog
export interface Service {
  _id?: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  isActive: boolean;
  features: string[];
  imageS3Key?: string; // S3 key for service image
  createdAt?: Date;
  updatedAt?: Date;
}

// Referral Submissions
export interface Referral {
  _id?: string;
  referredByUserId: string;
  referredByName: string;
  refereeName: string;
  refereeEmail: string;
  refereePhone?: string;
  refereeCompany?: string;
  notes?: string;
  status: 'pending' | 'contacted' | 'converted' | 'rejected';
  createdAt?: Date;
  updatedAt?: Date;
}

// Testimonial Types
export interface Testimonial {
  _id?: string;
  projectId: string;
  clientId: string;
  clientName?: string;
  testimonialText: string;
  rating: number;
  videoUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminFeedback?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Lead Gen Request Types
export interface LeadGenRequest {
  _id?: string;
  projectId: string;
  clientId: string;
  clientName?: string;
  details: string;
  budget?: string;
  timeline?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminFeedback?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Admin Tracking Types
export interface AdminTracking {
  _id?: string;
  projectId: string;
  clientId: string;
  dailyNote: string;
  progressPercentage: number;
  lastUpdated: Date;
  createdAt?: Date;
}

// Monthly Maintenance Types
export interface MaintenanceFeedback {
  _id?: string;
  clientId: string;
  clientName?: string;
  message: string;
  status: 'new' | 'open' | 'resolved';
  adminResponse?: string;
  respondedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string>;
}

// Pagination Types
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}
