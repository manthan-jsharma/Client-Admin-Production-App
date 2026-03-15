// User Types
export interface User {
  _id?: string;
  email: string;
  password?: string;
  role: 'admin' | 'client';
  name: string;
  phone?: string;
  avatar?: string;
  company?: string;
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
  contractPDF?: string;
  scopePDF?: string;
  status: 'active' | 'completed' | 'on-hold' | 'planning';
  startDate: Date;
  endDate: Date;
  roadmap: RoadmapItem[];
  dailyProgress: DailyProgress[];
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
  feedback?: string;
  approvedAt?: Date;
  createdAt?: Date;
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

// Chat Types
export interface ChatMessage {
  _id?: string;
  projectId: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'client';
  message: string;
  attachments?: string[];
  type: 'text' | 'voice' | 'video' | 'file';
  createdAt: Date;
}

// Testimonial Types
export interface Testimonial {
  _id?: string;
  projectId: string;
  clientId: string;
  clientName?: string;
  testimonialText: string;
  rating: number;
  status: 'pending' | 'approved';
  createdAt?: Date;
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
  createdAt?: Date;
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
