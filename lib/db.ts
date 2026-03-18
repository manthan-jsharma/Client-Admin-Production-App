// Supabase Database Implementation
// All exported function signatures are identical to the previous mock implementation.

import { supabase } from './supabase';
import {
  User, Project, ChatMessage, Payment, RoadmapItem, SetupItem,
  Ticket, Service, Referral, Delivery,
  Testimonial, LeadGenRequest, MaintenanceFeedback,
} from './types';

// ─── Null → undefined helper ──────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function n<T>(v: T | null | undefined): T | undefined {
  return v === null || v === undefined ? undefined : v;
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapUser(row: Record<string, unknown>): User {
  return {
    _id: row.id as string,
    email: row.email as string,
    password: n(row.password as string | null),
    role: row.role as 'admin' | 'client' | 'dev',
    name: row.name as string,
    phone: n(row.phone as string | null),
    company: n(row.company as string | null),
    businessName: n(row.business_name as string | null),
    website: n(row.website as string | null),
    about: n(row.about as string | null),
    profilePicture: n(row.profile_picture as string | null),
    status: row.status as 'pending' | 'approved' | 'rejected',
    approvalFeedback: n(row.approval_feedback as string | null),
    approvedAt: row.approved_at ? new Date(row.approved_at as string) : undefined,
    addedByAdmin: Boolean(row.added_by_admin),
    telegramChatId: n(row.telegram_chat_id as string | null),
    telegramConnectToken: n(row.telegram_connect_token as string | null),
    createdAt: row.created_at ? new Date(row.created_at as string) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at as string) : undefined,
  };
}

function mapRoadmapItem(row: Record<string, unknown>): RoadmapItem {
  return {
    _id: row.id as string,
    projectId: row.project_id as string,
    day: row.day as number,
    title: row.title as string,
    description: row.description as string,
    videoUrl: n(row.video_url as string | null),
    completed: Boolean(row.completed),
    adminNotes: n(row.admin_notes as string | null),
    feedback: n(row.feedback as string | null),
    approvedAt: row.approved_at ? new Date(row.approved_at as string) : undefined,
    createdAt: row.created_at ? new Date(row.created_at as string) : undefined,
  };
}

function mapDelivery(row: Record<string, unknown>): Delivery {
  return {
    _id: row.id as string,
    projectId: row.project_id as string,
    deliveryNumber: row.delivery_number as number,
    title: row.title as string,
    description: row.description as string,
    status: row.status as Delivery['status'],
    proofS3Key: n(row.proof_s3_key as string | null),
    adminNotes: n(row.admin_notes as string | null),
    clientFeedback: n(row.client_feedback as string | null),
    signedOffAt: row.signed_off_at ? new Date(row.signed_off_at as string) : undefined,
    createdByRole: n(row.created_by_role as string | null) as Delivery['createdByRole'],
    createdById: n(row.created_by_id as string | null),
    createdAt: row.created_at ? new Date(row.created_at as string) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at as string) : undefined,
  };
}

function mapProject(row: Record<string, unknown>): Project {
  const roadmapRows = (row.roadmap_items as Record<string, unknown>[] | null) ?? [];
  const deliveryRows = (row.deliveries as Record<string, unknown>[] | null) ?? [];

  return {
    _id: row.id as string,
    clientId: row.client_id as string,
    adminId: row.admin_id as string,
    name: row.name as string,
    description: row.description as string,
    type: row.type as 'ai_saas' | 'content_distribution',
    contractPDF: n(row.contract_pdf as string | null),
    scopePDF: n(row.scope_pdf as string | null),
    status: row.status as Project['status'],
    totalPrice: n(row.total_price as number | null),
    startDate: row.start_date ? new Date(row.start_date as string) : new Date(),
    endDate: row.end_date ? new Date(row.end_date as string) : new Date(),
    roadmap: [...roadmapRows]
      .sort((a, b) => (a.day as number) - (b.day as number))
      .map(mapRoadmapItem),
    dailyProgress: (row.daily_progress as import('./types').DailyProgress[]) ?? [],
    deliveries: [...deliveryRows]
      .sort((a, b) => (a.delivery_number as number) - (b.delivery_number as number))
      .map(mapDelivery),
    uiDesignPreference: n(row.github_username as string | null),
    demoVideoS3Key: n(row.demo_video_s3_key as string | null),
    proofOfCodeS3Key: n(row.proof_of_code_s3_key as string | null),
    hdPhotoS3Key: n(row.hd_photo_s3_key as string | null),
    hdPhotoStatus: n(row.hd_photo_status as Project['hdPhotoStatus'] | null),
    hdPhotoAdminFeedback: n(row.hd_photo_admin_feedback as string | null),
    teamSelfieVideoS3Key: n(row.team_selfie_video_s3_key as string | null),
    teamSelfieVideoStatus: n(row.team_selfie_video_status as Project['teamSelfieVideoStatus'] | null),
    teamSelfieVideoAdminFeedback: n(row.team_selfie_video_admin_feedback as string | null),
    aiCloneSampleS3Key: n(row.ai_clone_sample_s3_key as string | null),
    aiCloneApprovalStatus: n(row.ai_clone_approval_status as Project['aiCloneApprovalStatus'] | null),
    aiCloneClientFeedback: n(row.ai_clone_client_feedback as string | null),
    domainName: n(row.domain_name as string | null),
    designPreferences: n(row.design_preferences as string | null),
    logoS3Key: n(row.logo_s3_key as string | null),
    assignedDevs: (row.assigned_devs as string[] | null) ?? [],
    createdAt: row.created_at ? new Date(row.created_at as string) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at as string) : undefined,
  };
}

function mapPayment(row: Record<string, unknown>): Payment {
  return {
    _id: row.id as string,
    projectId: row.project_id as string,
    clientId: n(row.client_id as string | null),
    clientName: n(row.client_name as string | null),
    amount: row.amount as number,
    currency: row.currency as string,
    status: row.status as Payment['status'],
    paymentMethod: n(row.payment_method as string | null),
    notes: n(row.notes as string | null),
    dueDate: row.due_date ? new Date(row.due_date as string) : new Date(),
    paidDate: row.paid_date ? new Date(row.paid_date as string) : undefined,
    createdAt: row.created_at ? new Date(row.created_at as string) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at as string) : undefined,
  };
}

function mapSetupItem(row: Record<string, unknown>): SetupItem {
  return {
    _id: row.id as string,
    projectId: row.project_id as string,
    itemNumber: row.item_number as number,
    title: row.title as string,
    value: n(row.value as string | null),
    completed: Boolean(row.completed),
    completedAt: row.completed_at ? new Date(row.completed_at as string) : undefined,
  };
}

function mapMessage(row: Record<string, unknown>): ChatMessage {
  return {
    _id: row.id as string,
    projectId: row.project_id as string,
    senderId: row.sender_id as string,
    senderName: row.sender_name as string,
    senderRole: row.sender_role as 'admin' | 'client' | 'ai' | 'dev',
    message: row.message as string,
    attachments: n(row.attachments as ChatMessage['attachments'] | null),
    type: row.type as ChatMessage['type'],
    isAI: Boolean(row.is_ai),
    readBy: (row.read_by as string[] | null) ?? [],
    ticket: n(row.ticket as ChatMessage['ticket'] | null),
    createdAt: new Date(row.created_at as string),
  };
}

function mapTicket(row: Record<string, unknown>): Ticket {
  return {
    _id: row.id as string,
    projectId: n(row.project_id as string | null),
    clientId: row.client_id as string,
    clientName: row.client_name as string,
    subject: row.subject as string,
    description: row.description as string,
    type: row.type as Ticket['type'],
    status: row.status as Ticket['status'],
    priority: row.priority as Ticket['priority'],
    adminResponse: n(row.admin_response as string | null),
    attachments: n(row.attachments as string[] | null),
    createdAt: row.created_at ? new Date(row.created_at as string) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at as string) : undefined,
    resolvedAt: row.resolved_at ? new Date(row.resolved_at as string) : undefined,
  };
}

function mapService(row: Record<string, unknown>): Service {
  return {
    _id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    price: row.price as number,
    currency: row.currency as string,
    category: row.category as string,
    isActive: Boolean(row.is_active),
    features: (row.features as string[]) ?? [],
    imageS3Key: n(row.image_s3_key as string | null),
    createdAt: row.created_at ? new Date(row.created_at as string) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at as string) : undefined,
  };
}

function mapReferral(row: Record<string, unknown>): import('./types').Referral {
  return {
    _id: row.id as string,
    referredByUserId: row.referred_by_user_id as string,
    referredByName: row.referred_by_name as string,
    refereeName: row.referee_name as string,
    refereeEmail: row.referee_email as string,
    refereePhone: n(row.referee_phone as string | null),
    refereeCompany: n(row.referee_company as string | null),
    notes: n(row.notes as string | null),
    status: row.status as import('./types').Referral['status'],
    createdAt: row.created_at ? new Date(row.created_at as string) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at as string) : undefined,
  };
}

function mapTestimonial(row: Record<string, unknown>): Testimonial {
  return {
    _id: row.id as string,
    projectId: row.project_id as string,
    clientId: row.client_id as string,
    clientName: n(row.client_name as string | null),
    testimonialText: row.testimonial_text as string,
    rating: row.rating as number,
    status: row.status as Testimonial['status'],
    adminFeedback: n(row.admin_feedback as string | null),
    createdAt: row.created_at ? new Date(row.created_at as string) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at as string) : undefined,
  };
}

function mapLeadGenRequest(row: Record<string, unknown>): LeadGenRequest {
  return {
    _id: row.id as string,
    projectId: row.project_id as string,
    clientId: row.client_id as string,
    clientName: n(row.client_name as string | null),
    details: row.details as string,
    budget: n(row.budget as string | null),
    timeline: n(row.timeline as string | null),
    status: row.status as LeadGenRequest['status'],
    adminFeedback: n(row.admin_feedback as string | null),
    createdAt: row.created_at ? new Date(row.created_at as string) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at as string) : undefined,
  };
}

function mapMaintenanceFeedback(row: Record<string, unknown>): MaintenanceFeedback {
  return {
    _id: row.id as string,
    clientId: row.client_id as string,
    clientName: n(row.client_name as string | null),
    message: row.message as string,
    status: row.status as MaintenanceFeedback['status'],
    adminResponse: n(row.admin_response as string | null),
    respondedAt: row.responded_at ? new Date(row.responded_at as string) : undefined,
    createdAt: row.created_at ? new Date(row.created_at as string) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at as string) : undefined,
  };
}

// ─── snake_case update row builders ──────────────────────────────────────────

function toUserUpdateRow(u: Partial<User>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (u.name !== undefined) row.name = u.name;
  if (u.phone !== undefined) row.phone = u.phone ?? null;
  if (u.company !== undefined) row.company = u.company ?? null;
  if (u.businessName !== undefined) row.business_name = u.businessName ?? null;
  if (u.website !== undefined) row.website = u.website ?? null;
  if (u.about !== undefined) row.about = u.about ?? null;
  if (u.profilePicture !== undefined) row.profile_picture = u.profilePicture ?? null;
  if (u.status !== undefined) row.status = u.status;
  if (u.approvalFeedback !== undefined) row.approval_feedback = u.approvalFeedback ?? null;
  if (u.approvedAt !== undefined) row.approved_at = u.approvedAt ? u.approvedAt.toISOString() : null;
  if (u.addedByAdmin !== undefined) row.added_by_admin = u.addedByAdmin;
  if (u.telegramChatId !== undefined) row.telegram_chat_id = u.telegramChatId ?? null;
  if (u.telegramConnectToken !== undefined) row.telegram_connect_token = u.telegramConnectToken ?? null;
  row.updated_at = new Date().toISOString();
  return row;
}

function toProjectUpdateRow(p: Partial<Project>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (p.name !== undefined) row.name = p.name;
  if (p.description !== undefined) row.description = p.description;
  if (p.type !== undefined) row.type = p.type;
  if (p.contractPDF !== undefined) row.contract_pdf = p.contractPDF ?? null;
  if (p.scopePDF !== undefined) row.scope_pdf = p.scopePDF ?? null;
  if (p.status !== undefined) row.status = p.status;
  if (p.totalPrice !== undefined) row.total_price = p.totalPrice ?? null;
  if (p.startDate !== undefined) row.start_date = p.startDate ? new Date(p.startDate).toISOString() : null;
  if (p.endDate !== undefined) row.end_date = p.endDate ? new Date(p.endDate).toISOString() : null;
  if (p.dailyProgress !== undefined) row.daily_progress = p.dailyProgress;
  if (p.uiDesignPreference !== undefined) row.github_username = p.uiDesignPreference ?? null;
  if (p.demoVideoS3Key !== undefined) row.demo_video_s3_key = p.demoVideoS3Key ?? null;
  if (p.proofOfCodeS3Key !== undefined) row.proof_of_code_s3_key = p.proofOfCodeS3Key ?? null;
  if (p.hdPhotoS3Key !== undefined) row.hd_photo_s3_key = p.hdPhotoS3Key ?? null;
  if (p.hdPhotoStatus !== undefined) row.hd_photo_status = p.hdPhotoStatus ?? null;
  if (p.hdPhotoAdminFeedback !== undefined) row.hd_photo_admin_feedback = p.hdPhotoAdminFeedback ?? null;
  if (p.teamSelfieVideoS3Key !== undefined) row.team_selfie_video_s3_key = p.teamSelfieVideoS3Key ?? null;
  if (p.teamSelfieVideoStatus !== undefined) row.team_selfie_video_status = p.teamSelfieVideoStatus ?? null;
  if (p.teamSelfieVideoAdminFeedback !== undefined) row.team_selfie_video_admin_feedback = p.teamSelfieVideoAdminFeedback ?? null;
  if (p.aiCloneSampleS3Key !== undefined) row.ai_clone_sample_s3_key = p.aiCloneSampleS3Key ?? null;
  if (p.aiCloneApprovalStatus !== undefined) row.ai_clone_approval_status = p.aiCloneApprovalStatus ?? null;
  if (p.aiCloneClientFeedback !== undefined) row.ai_clone_client_feedback = p.aiCloneClientFeedback ?? null;
  if (p.domainName !== undefined) row.domain_name = p.domainName ?? null;
  if (p.designPreferences !== undefined) row.design_preferences = p.designPreferences ?? null;
  if (p.logoS3Key !== undefined) row.logo_s3_key = p.logoS3Key ?? null;
  if (p.assignedDevs !== undefined) row.assigned_devs = p.assignedDevs ?? undefined;
  row.updated_at = new Date().toISOString();
  return row;
}

function toPaymentUpdateRow(p: Partial<Payment>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (p.amount !== undefined) row.amount = p.amount;
  if (p.currency !== undefined) row.currency = p.currency;
  if (p.status !== undefined) row.status = p.status;
  if (p.paymentMethod !== undefined) row.payment_method = p.paymentMethod ?? null;
  if (p.notes !== undefined) row.notes = p.notes ?? null;
  if (p.dueDate !== undefined) row.due_date = p.dueDate ? new Date(p.dueDate).toISOString() : null;
  if (p.paidDate !== undefined) row.paid_date = p.paidDate ? new Date(p.paidDate).toISOString() : null;
  if (p.clientName !== undefined) row.client_name = p.clientName ?? null;
  row.updated_at = new Date().toISOString();
  return row;
}

function toSetupItemUpdateRow(s: Partial<SetupItem>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (s.title !== undefined) row.title = s.title;
  if (s.value !== undefined) row.value = s.value ?? null;
  if (s.completed !== undefined) row.completed = s.completed;
  if (s.completedAt !== undefined) row.completed_at = s.completedAt ? new Date(s.completedAt).toISOString() : null;
  return row;
}

function toRoadmapUpdateRow(r: Partial<RoadmapItem>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (r.title !== undefined) row.title = r.title;
  if (r.description !== undefined) row.description = r.description;
  if (r.videoUrl !== undefined) row.video_url = r.videoUrl ?? null;
  if (r.completed !== undefined) row.completed = r.completed;
  if (r.adminNotes !== undefined) row.admin_notes = r.adminNotes ?? null;
  if (r.feedback !== undefined) row.feedback = r.feedback ?? null;
  if (r.approvedAt !== undefined) row.approved_at = r.approvedAt ? new Date(r.approvedAt).toISOString() : null;
  return row;
}

function toTicketUpdateRow(t: Partial<Ticket>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (t.subject !== undefined) row.subject = t.subject;
  if (t.description !== undefined) row.description = t.description;
  if (t.type !== undefined) row.type = t.type;
  if (t.status !== undefined) row.status = t.status;
  if (t.priority !== undefined) row.priority = t.priority;
  if (t.adminResponse !== undefined) row.admin_response = t.adminResponse ?? null;
  if (t.attachments !== undefined) row.attachments = t.attachments ?? [];
  if (t.resolvedAt !== undefined) row.resolved_at = t.resolvedAt ? new Date(t.resolvedAt).toISOString() : null;
  row.updated_at = new Date().toISOString();
  return row;
}

function toServiceUpdateRow(s: Partial<Service>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (s.name !== undefined) row.name = s.name;
  if (s.description !== undefined) row.description = s.description;
  if (s.price !== undefined) row.price = s.price;
  if (s.currency !== undefined) row.currency = s.currency;
  if (s.category !== undefined) row.category = s.category;
  if (s.isActive !== undefined) row.is_active = s.isActive;
  if (s.features !== undefined) row.features = s.features;
  if (s.imageS3Key !== undefined) row.image_s3_key = s.imageS3Key ?? null;
  row.updated_at = new Date().toISOString();
  return row;
}

function toReferralUpdateRow(r: Partial<import('./types').Referral>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (r.refereeName !== undefined) row.referee_name = r.refereeName;
  if (r.refereeEmail !== undefined) row.referee_email = r.refereeEmail;
  if (r.refereePhone !== undefined) row.referee_phone = r.refereePhone ?? null;
  if (r.refereeCompany !== undefined) row.referee_company = r.refereeCompany ?? null;
  if (r.notes !== undefined) row.notes = r.notes ?? null;
  if (r.status !== undefined) row.status = r.status;
  row.updated_at = new Date().toISOString();
  return row;
}

function toDeliveryUpdateRow(d: Partial<Delivery>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (d.title !== undefined) row.title = d.title;
  if (d.description !== undefined) row.description = d.description;
  if (d.status !== undefined) row.status = d.status;
  if (d.proofS3Key !== undefined) row.proof_s3_key = d.proofS3Key ?? null;
  if (d.adminNotes !== undefined) row.admin_notes = d.adminNotes ?? null;
  if (d.clientFeedback !== undefined) row.client_feedback = d.clientFeedback ?? null;
  if (d.signedOffAt !== undefined) row.signed_off_at = d.signedOffAt ? new Date(d.signedOffAt).toISOString() : null;
  row.updated_at = new Date().toISOString();
  return row;
}

function toTestimonialUpdateRow(t: Partial<Testimonial>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (t.testimonialText !== undefined) row.testimonial_text = t.testimonialText;
  if (t.rating !== undefined) row.rating = t.rating;
  if (t.status !== undefined) row.status = t.status;
  if (t.adminFeedback !== undefined) row.admin_feedback = t.adminFeedback ?? null;
  if (t.clientName !== undefined) row.client_name = t.clientName ?? null;
  row.updated_at = new Date().toISOString();
  return row;
}

function toLeadGenUpdateRow(r: Partial<LeadGenRequest>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (r.details !== undefined) row.details = r.details;
  if (r.budget !== undefined) row.budget = r.budget ?? null;
  if (r.timeline !== undefined) row.timeline = r.timeline ?? null;
  if (r.status !== undefined) row.status = r.status;
  if (r.adminFeedback !== undefined) row.admin_feedback = r.adminFeedback ?? null;
  if (r.clientName !== undefined) row.client_name = r.clientName ?? null;
  row.updated_at = new Date().toISOString();
  return row;
}

function toMaintenanceUpdateRow(f: Partial<MaintenanceFeedback>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (f.message !== undefined) row.message = f.message;
  if (f.status !== undefined) row.status = f.status;
  if (f.adminResponse !== undefined) row.admin_response = f.adminResponse ?? null;
  if (f.respondedAt !== undefined) row.responded_at = f.respondedAt ? new Date(f.respondedAt).toISOString() : null;
  if (f.clientName !== undefined) row.client_name = f.clientName ?? null;
  row.updated_at = new Date().toISOString();
  return row;
}

// ─── User Operations ──────────────────────────────────────────────────────────

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', email)
    .single();
  if (error || !data) return null;
  return mapUser(data as Record<string, unknown>);
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return mapUser(data as Record<string, unknown>);
}

export async function createUser(user: User): Promise<User> {
  const insertRow: Record<string, unknown> = {
    email: user.email,
    password: user.password ?? null,
    role: user.role,
    name: user.name,
    phone: user.phone ?? null,
    company: user.company ?? null,
    business_name: user.businessName ?? null,
    website: user.website ?? null,
    about: user.about ?? null,
    profile_picture: user.profilePicture ?? null,
    status: user.status ?? 'pending',
    approval_feedback: user.approvalFeedback ?? null,
    approved_at: user.approvedAt ? new Date(user.approvedAt).toISOString() : null,
    added_by_admin: user.addedByAdmin ?? false,
    telegram_chat_id: user.telegramChatId ?? null,
    telegram_connect_token: user.telegramConnectToken ?? null,
  };

  const { data, error } = await supabase
    .from('users')
    .insert(insertRow)
    .select('*')
    .single();

  if (error || !data) throw new Error(`createUser failed: ${error?.message}`);
  return mapUser(data as Record<string, unknown>);
}

export async function updateUserProfile(id: string, updates: Partial<User>): Promise<User | null> {
  // Strip fields that must not be changed via profile update
  const { _id: _a, email: _b, password: _c, role: _d, status: _e, ...safeUpdates } = updates;
  const row = toUserUpdateRow(safeUpdates);

  const { data, error } = await supabase
    .from('users')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) return null;
  return mapUser(data as Record<string, unknown>);
}

export async function adminUpdateClient(id: string, updates: Partial<User>): Promise<User | null> {
  // Verify user exists and is a client
  const { data: existing } = await supabase
    .from('users')
    .select('role')
    .eq('id', id)
    .single();
  if (!existing || (existing as Record<string, unknown>).role !== 'client') return null;

  // Strip fields admin cannot modify
  const { _id: _a, password: _b, role: _c, ...safeUpdates } = updates;
  const row = toUserUpdateRow(safeUpdates);
  if (safeUpdates.email !== undefined) row.email = safeUpdates.email;

  const { data, error } = await supabase
    .from('users')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) return null;
  return mapUser(data as Record<string, unknown>);
}

// ─── Client Approval Operations ──────────────────────────────────────────────

export async function approveClient(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approval_feedback: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .eq('role', 'client')
    .select('*')
    .single();

  if (error || !data) return null;
  return mapUser(data as Record<string, unknown>);
}

export async function rejectClient(userId: string, feedback: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .update({
      status: 'rejected',
      approval_feedback: feedback,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .eq('role', 'client')
    .select('*')
    .single();

  if (error || !data) return null;
  return mapUser(data as Record<string, unknown>);
}

export async function getPendingClients(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'client')
    .eq('status', 'pending');

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapUser);
}

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapUser);
}

export async function getUserByTelegramToken(token: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_connect_token', token)
    .single();

  if (error || !data) return null;
  return mapUser(data as Record<string, unknown>);
}

// ─── Project Operations ───────────────────────────────────────────────────────

const PROJECT_SELECT = '*, roadmap_items(*), deliveries(*)';

export async function getProjectsByUserId(userId: string, role: string): Promise<Project[]> {
  if (role === 'dev') {
    const { data, error } = await supabase
      .from('projects')
      .select(PROJECT_SELECT)
      .filter('assigned_devs', 'cs', `{${userId}}`)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map(mapProject);
  }

  const column = role === 'admin' ? 'admin_id' : 'client_id';
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .eq(column, userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapProject);
}

export async function getProjectById(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapProject(data as Record<string, unknown>);
}

export async function createProject(project: Project): Promise<Project> {
  const insertRow: Record<string, unknown> = {
    client_id: project.clientId,
    admin_id: project.adminId,
    name: project.name,
    description: project.description,
    type: project.type,
    contract_pdf: project.contractPDF ?? null,
    scope_pdf: project.scopePDF ?? null,
    status: project.status ?? 'planning',
    total_price: project.totalPrice ?? null,
    start_date: project.startDate ? new Date(project.startDate).toISOString() : null,
    end_date: project.endDate ? new Date(project.endDate).toISOString() : null,
    daily_progress: project.dailyProgress ?? [],
    github_username: project.uiDesignPreference ?? null,
    demo_video_s3_key: project.demoVideoS3Key ?? null,
    proof_of_code_s3_key: project.proofOfCodeS3Key ?? null,
    hd_photo_s3_key: project.hdPhotoS3Key ?? null,
    hd_photo_status: project.hdPhotoStatus ?? null,
    hd_photo_admin_feedback: project.hdPhotoAdminFeedback ?? null,
    team_selfie_video_s3_key: project.teamSelfieVideoS3Key ?? null,
    team_selfie_video_status: project.teamSelfieVideoStatus ?? null,
    team_selfie_video_admin_feedback: project.teamSelfieVideoAdminFeedback ?? null,
    ai_clone_sample_s3_key: project.aiCloneSampleS3Key ?? null,
    ai_clone_approval_status: project.aiCloneApprovalStatus ?? null,
    ai_clone_client_feedback: project.aiCloneClientFeedback ?? null,
    domain_name: project.domainName ?? null,
    design_preferences: project.designPreferences ?? null,
    logo_s3_key: project.logoS3Key ?? null,
  };

  const { data, error } = await supabase
    .from('projects')
    .insert(insertRow)
    .select(PROJECT_SELECT)
    .single();

  if (error || !data) throw new Error(`createProject failed: ${error?.message}`);
  const projectId = (data as Record<string, unknown>).id as string;

  // Bulk-insert roadmap items if provided
  if (project.roadmap && project.roadmap.length > 0) {
    const roadmapRows = project.roadmap.map(r => ({
      project_id: projectId,
      day: r.day,
      title: r.title,
      description: r.description,
      video_url: r.videoUrl ?? null,
      completed: r.completed ?? false,
      admin_notes: r.adminNotes ?? null,
    }));
    const { error: rmErr } = await supabase.from('roadmap_items').insert(roadmapRows);
    if (rmErr) console.error('[db] createProject: failed to insert roadmap items', rmErr.message);
  }

  // Insert default setup items (type-specific)
  const defaultSetupItems = buildDefaultSetupItems(projectId, project.type);
  const { error: siErr } = await supabase.from('setup_items').insert(defaultSetupItems);
  if (siErr) console.error('[db] createProject: failed to insert setup items', siErr.message);

  // Re-fetch with nested roadmap + deliveries
  const created = await getProjectById(projectId);
  if (!created) throw new Error('createProject: could not re-fetch project after insert');
  return created;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  // Roadmap and deliveries are managed by separate tables — strip them
  const { roadmap: _r, deliveries: _d, ...rest } = updates;
  const row = toProjectUpdateRow(rest);

  // Only update if there are actual fields to change beyond updated_at
  const fieldCount = Object.keys(row).length;
  if (fieldCount <= 1) {
    // Only updated_at was added — still fetch current data
    return getProjectById(id);
  }

  const { data, error } = await supabase
    .from('projects')
    .update(row)
    .eq('id', id)
    .select(PROJECT_SELECT)
    .single();

  if (error || !data) return null;
  return mapProject(data as Record<string, unknown>);
}

export async function getAllProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapProject);
}

// ─── Chat Operations ──────────────────────────────────────────────────────────

export async function getProjectMessages(
  projectId: string,
  limit: number = 50,
  before?: Date
): Promise<ChatMessage[]> {
  let query = supabase
    .from('chat_messages')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before.toISOString());
  }

  const { data, error } = await query;
  if (error || !data) return [];
  // Return oldest-first so UI renders top→bottom correctly
  return (data as Record<string, unknown>[]).map(mapMessage).reverse();
}

export async function getAllMessages(): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapMessage);
}

export async function createMessage(message: ChatMessage): Promise<ChatMessage> {
  // sender_id is a UUID FK — AI messages have no real user, so store null
  const isAiSender = message.isAI || message.senderRole === 'ai';
  const insertRow: Record<string, unknown> = {
    project_id: message.projectId,
    sender_id: isAiSender ? null : message.senderId,
    sender_name: message.senderName,
    sender_role: message.senderRole,
    message: message.message,
    attachments: message.attachments ?? [],
    type: message.type,
    is_ai: message.isAI ?? false,
    read_by: message.readBy ?? (isAiSender ? [] : [message.senderId]),
    ticket: message.ticket ?? null,
    created_at: message.createdAt ? new Date(message.createdAt).toISOString() : new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('chat_messages')
    .insert(insertRow)
    .select('*')
    .single();

  if (error || !data) throw new Error(`createMessage failed: ${error?.message}`);
  return mapMessage(data as Record<string, unknown>);
}

export async function markMessagesRead(projectId: string, userId: string): Promise<void> {
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id, read_by')
    .eq('project_id', projectId);

  if (!messages) return;

  for (const m of messages as Record<string, unknown>[]) {
    const readBy = (m.read_by as string[]) || [];
    if (!readBy.includes(userId)) {
      await supabase
        .from('chat_messages')
        .update({ read_by: [...readBy, userId] })
        .eq('id', m.id as string);
    }
  }
}

export async function getUnreadCount(projectId: string, userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, read_by')
    .eq('project_id', projectId);

  if (error || !data) return 0;
  return (data as Record<string, unknown>[]).filter((m) => {
    const readBy = (m.read_by as string[]) || [];
    return !readBy.includes(userId);
  }).length;
}

export async function getAdminNotificationCounts(adminId: string): Promise<{
  pendingClients: number;
  openTickets: number;
  unreadMessages: number;
}> {
  const [usersRes, ticketsRes, messagesRes] = await Promise.all([
    supabase.from('users').select('id').eq('status', 'pending').eq('role', 'client'),
    supabase.from('tickets').select('id').in('status', ['open', 'in_progress']),
    supabase.from('chat_messages').select('id, read_by'),
  ]);

  const pendingClients = usersRes.data?.length ?? 0;
  const openTickets = ticketsRes.data?.length ?? 0;
  const unreadMessages = ((messagesRes.data ?? []) as Record<string, unknown>[]).filter((m) => {
    const readBy = (m.read_by as string[]) || [];
    return !readBy.includes(adminId);
  }).length;

  return { pendingClients, openTickets, unreadMessages };
}

export async function getClientNotificationCounts(clientId: string): Promise<{
  unreadMessages: number;
}> {
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('client_id', clientId);

  if (!projects?.length) return { unreadMessages: 0 };

  const projectIds = (projects as Record<string, unknown>[]).map(p => p.id as string);
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id, read_by')
    .in('project_id', projectIds);

  const unreadMessages = ((messages ?? []) as Record<string, unknown>[]).filter((m) => {
    const readBy = (m.read_by as string[]) || [];
    return !readBy.includes(clientId);
  }).length;

  return { unreadMessages };
}

export async function getMessagesSince(projectId: string, since: Date): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('project_id', projectId)
    .gt('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapMessage);
}

// ─── Payment Operations ───────────────────────────────────────────────────────

export async function getProjectPayments(projectId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapPayment);
}

export async function getAllPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapPayment);
}

export async function createPayment(payment: Payment): Promise<Payment> {
  const insertRow: Record<string, unknown> = {
    project_id: payment.projectId,
    client_id: payment.clientId ?? null,
    client_name: payment.clientName ?? null,
    amount: payment.amount,
    currency: payment.currency ?? 'USD',
    status: payment.status ?? 'pending',
    payment_method: payment.paymentMethod ?? null,
    notes: payment.notes ?? null,
    due_date: payment.dueDate ? new Date(payment.dueDate).toISOString() : null,
    paid_date: payment.paidDate ? new Date(payment.paidDate).toISOString() : null,
  };

  const { data, error } = await supabase
    .from('payments')
    .insert(insertRow)
    .select('*')
    .single();

  if (error || !data) throw new Error(`createPayment failed: ${error?.message}`);
  return mapPayment(data as Record<string, unknown>);
}

export async function updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | null> {
  const row = toPaymentUpdateRow(updates);
  const { data, error } = await supabase
    .from('payments')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) return null;
  return mapPayment(data as Record<string, unknown>);
}

// ─── Setup Items Operations ───────────────────────────────────────────────────

export async function getProjectSetupItems(projectId: string): Promise<SetupItem[]> {
  const { data, error } = await supabase
    .from('setup_items')
    .select('*')
    .eq('project_id', projectId)
    .order('item_number', { ascending: true });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapSetupItem);
}

export async function updateSetupItem(id: string, updates: Partial<SetupItem>): Promise<SetupItem | null> {
  const row = toSetupItemUpdateRow(updates);
  if (updates.completed && !updates.completedAt) {
    row.completed_at = new Date().toISOString();
  } else if (updates.completed === false) {
    row.completed_at = null;
  }

  const { data, error } = await supabase
    .from('setup_items')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) return null;
  return mapSetupItem(data as Record<string, unknown>);
}

export async function createSetupItem(item: {
  projectId: string;
  itemNumber: number;
  title: string;
  value?: string;
}): Promise<SetupItem> {
  const { data, error } = await supabase
    .from('setup_items')
    .insert({
      project_id: item.projectId,
      item_number: item.itemNumber,
      title: item.title,
      value: item.value ?? null,
      completed: false,
    })
    .select('*')
    .single();

  if (error || !data) throw new Error(`createSetupItem failed: ${error?.message}`);
  return mapSetupItem(data as Record<string, unknown>);
}

// ─── Setup item templates ─────────────────────────────────────────────────────

const AI_SAAS_SETUP_ITEMS = [
  { title: 'GitHub Username / Repo Access', value: 'Share your GitHub username so we can add you as a collaborator and push code to your repo.' },
  { title: 'Hosting Preference', value: 'Tell us your preferred platform — Vercel, Railway, Render, or DigitalOcean — or let us know if you need us to choose.' },
  { title: 'Domain Name', value: 'Share your domain (e.g. yourdomain.com), or let us know if you need one purchased and we\'ll handle it.' },
  { title: 'Tech Stack Preferences', value: 'List any languages, frameworks, or databases you want us to use or avoid (e.g. Next.js, PostgreSQL, no PHP).' },
  { title: 'API Keys / Third-Party Integrations', value: 'List external services needed (OpenAI, Stripe, Twilio, etc.) and share credentials securely via the Uploads section.' },
];

const CONTENT_DISTRIBUTION_SETUP_ITEMS = [
  { title: 'Brand Guidelines', value: 'Go to the Uploads section and upload your brand style guide — including colours, fonts, and tone of voice.' },
  { title: 'Logo Files', value: 'Go to the Uploads section and upload your logo files in SVG or PNG format, both light and dark variants.' },
  { title: 'Content Audit', value: 'Share links to or upload any existing content (posts, articles, videos) so we can plan without duplication.' },
  { title: 'Competitor Analysis', value: 'Name 3–5 competitors whose content strategy you admire or want to outperform — include their website or social links.' },
  { title: 'User Research', value: 'Upload or paste any customer personas, survey results, or feedback that should shape the content strategy.' },
];

function buildDefaultSetupItems(projectId: string, type: string) {
  const templates = type === 'ai_saas' ? AI_SAAS_SETUP_ITEMS : CONTENT_DISTRIBUTION_SETUP_ITEMS;
  return templates.map((t, i) => ({
    project_id: projectId,
    item_number: i + 1,
    title: t.title,
    value: t.value,
    completed: false,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────

export async function seedDefaultSetupItems(projectId: string, projectType: string): Promise<SetupItem[]> {
  const defaults = buildDefaultSetupItems(projectId, projectType);
  const { data, error } = await supabase
    .from('setup_items')
    .insert(defaults)
    .select('*')
    .order('item_number', { ascending: true });

  if (error || !data) throw new Error(`seedDefaultSetupItems failed: ${error?.message}`);
  return (data as Record<string, unknown>[]).map(mapSetupItem);
}

export async function seedDefaultRoadmapItems(projectId: string): Promise<RoadmapItem[]> {
  const rows = Array.from({ length: 14 }, (_, i) => ({
    project_id: projectId,
    day: i + 1,
    title: `Day ${i + 1}`,
    description: `Deliverables for day ${i + 1}`,
    video_url: null,
    completed: false,
    admin_notes: null,
  }));
  const { data, error } = await supabase
    .from('roadmap_items')
    .insert(rows)
    .select('*')
    .order('day', { ascending: true });

  if (error || !data) throw new Error(`seedDefaultRoadmapItems failed: ${error?.message}`);
  return (data as Record<string, unknown>[]).map(mapRoadmapItem);
}

// ─── Roadmap Operations ───────────────────────────────────────────────────────

export async function getRoadmapItem(projectId: string, day: number): Promise<RoadmapItem | null> {
  const { data, error } = await supabase
    .from('roadmap_items')
    .select('*')
    .eq('project_id', projectId)
    .eq('day', day)
    .single();

  if (error || !data) return null;
  return mapRoadmapItem(data as Record<string, unknown>);
}

export async function updateRoadmapItem(
  projectId: string,
  day: number,
  updates: Partial<RoadmapItem>
): Promise<RoadmapItem | null> {
  const row = toRoadmapUpdateRow(updates);

  const { data, error } = await supabase
    .from('roadmap_items')
    .update(row)
    .eq('project_id', projectId)
    .eq('day', day)
    .select('*')
    .single();

  if (error || !data) return null;
  return mapRoadmapItem(data as Record<string, unknown>);
}

// ─── Ticket Operations ────────────────────────────────────────────────────────

export async function getAllTickets(): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapTicket);
}

export async function getTicketsByClientId(clientId: string): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapTicket);
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapTicket(data as Record<string, unknown>);
}

export async function createTicket(ticket: Ticket): Promise<Ticket> {
  const insertRow: Record<string, unknown> = {
    project_id: ticket.projectId ?? null,
    client_id: ticket.clientId,
    client_name: ticket.clientName,
    subject: ticket.subject,
    description: ticket.description,
    type: ticket.type ?? 'support',
    status: ticket.status ?? 'open',
    priority: ticket.priority ?? 'medium',
    admin_response: ticket.adminResponse ?? null,
    attachments: ticket.attachments ?? [],
  };

  const { data, error } = await supabase
    .from('tickets')
    .insert(insertRow)
    .select('*')
    .single();

  if (error || !data) throw new Error(`createTicket failed: ${error?.message}`);
  return mapTicket(data as Record<string, unknown>);
}

export async function updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket | null> {
  if (updates.status === 'resolved' && !updates.resolvedAt) {
    updates.resolvedAt = new Date();
  }
  const row = toTicketUpdateRow(updates);

  const { data, error } = await supabase
    .from('tickets')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) return null;
  return mapTicket(data as Record<string, unknown>);
}

// ─── Service Operations ───────────────────────────────────────────────────────

export async function getAllServices(activeOnly = false): Promise<Service[]> {
  let query = supabase.from('services').select('*');
  if (activeOnly) query = query.eq('is_active', true);
  const { data, error } = await query.order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapService);
}

export async function getServiceById(id: string): Promise<Service | null> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapService(data as Record<string, unknown>);
}

export async function createService(service: Service): Promise<Service> {
  const insertRow: Record<string, unknown> = {
    name: service.name,
    description: service.description,
    price: service.price,
    currency: service.currency ?? 'USD',
    category: service.category,
    is_active: service.isActive ?? true,
    features: service.features ?? [],
    image_s3_key: service.imageS3Key ?? null,
  };

  const { data, error } = await supabase
    .from('services')
    .insert(insertRow)
    .select('*')
    .single();

  if (error || !data) throw new Error(`createService failed: ${error?.message}`);
  return mapService(data as Record<string, unknown>);
}

export async function updateService(id: string, updates: Partial<Service>): Promise<Service | null> {
  const row = toServiceUpdateRow(updates);
  const { data, error } = await supabase
    .from('services')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) return null;
  return mapService(data as Record<string, unknown>);
}

export async function deleteService(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id);

  return !error;
}

// ─── Referral Operations ──────────────────────────────────────────────────────

export async function getAllReferrals(): Promise<import('./types').Referral[]> {
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapReferral);
}

export async function getReferralsByUserId(userId: string): Promise<import('./types').Referral[]> {
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referred_by_user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapReferral);
}

export async function createReferral(referral: import('./types').Referral): Promise<import('./types').Referral> {
  const insertRow: Record<string, unknown> = {
    referred_by_user_id: referral.referredByUserId,
    referred_by_name: referral.referredByName,
    referee_name: referral.refereeName,
    referee_email: referral.refereeEmail,
    referee_phone: referral.refereePhone ?? null,
    referee_company: referral.refereeCompany ?? null,
    notes: referral.notes ?? null,
    status: referral.status ?? 'pending',
  };

  const { data, error } = await supabase
    .from('referrals')
    .insert(insertRow)
    .select('*')
    .single();

  if (error || !data) throw new Error(`createReferral failed: ${error?.message}`);
  return mapReferral(data as Record<string, unknown>);
}

export async function updateReferral(id: string, updates: Partial<import('./types').Referral>): Promise<import('./types').Referral | null> {
  const row = toReferralUpdateRow(updates);
  const { data, error } = await supabase
    .from('referrals')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) return null;
  return mapReferral(data as Record<string, unknown>);
}

// ─── Delivery Operations ──────────────────────────────────────────────────────

export async function getProjectDeliveries(projectId: string): Promise<Delivery[]> {
  const { data, error } = await supabase
    .from('deliveries')
    .select('*')
    .eq('project_id', projectId)
    .order('delivery_number', { ascending: true });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapDelivery);
}

export async function getDeliveryById(id: string): Promise<Delivery | null> {
  const { data, error } = await supabase
    .from('deliveries')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapDelivery(data as Record<string, unknown>);
}

export async function createDelivery(delivery: Delivery): Promise<Delivery> {
  const insertRow: Record<string, unknown> = {
    project_id: delivery.projectId,
    delivery_number: delivery.deliveryNumber,
    title: delivery.title,
    description: delivery.description,
    status: delivery.status ?? 'pending',
    proof_s3_key: delivery.proofS3Key ?? null,
    admin_notes: delivery.adminNotes ?? null,
    client_feedback: delivery.clientFeedback ?? null,
    signed_off_at: delivery.signedOffAt ? new Date(delivery.signedOffAt).toISOString() : null,
    created_by_role: delivery.createdByRole ?? 'admin',
    created_by_id: delivery.createdById ?? null,
  };

  const { data, error } = await supabase
    .from('deliveries')
    .insert(insertRow)
    .select('*')
    .single();

  if (error || !data) throw new Error(`createDelivery failed: ${error?.message}`);
  return mapDelivery(data as Record<string, unknown>);
}

export async function updateDelivery(id: string, updates: Partial<Delivery>): Promise<Delivery | null> {
  const row = toDeliveryUpdateRow(updates);
  const { data, error } = await supabase
    .from('deliveries')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) return null;
  return mapDelivery(data as Record<string, unknown>);
}

export async function deleteDelivery(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('deliveries')
    .delete()
    .eq('id', id);

  return !error;
}

// ─── Testimonial Operations ───────────────────────────────────────────────────

export async function getAllTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapTestimonial);
}

export async function getTestimonialsByClientId(clientId: string): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapTestimonial);
}

export async function getTestimonialById(id: string): Promise<Testimonial | null> {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapTestimonial(data as Record<string, unknown>);
}

export async function createTestimonial(t: Testimonial): Promise<Testimonial> {
  const insertRow: Record<string, unknown> = {
    project_id: t.projectId,
    client_id: t.clientId,
    client_name: t.clientName ?? null,
    testimonial_text: t.testimonialText,
    rating: t.rating,
    status: t.status ?? 'pending',
    admin_feedback: t.adminFeedback ?? null,
  };

  const { data, error } = await supabase
    .from('testimonials')
    .insert(insertRow)
    .select('*')
    .single();

  if (error || !data) throw new Error(`createTestimonial failed: ${error?.message}`);
  return mapTestimonial(data as Record<string, unknown>);
}

export async function updateTestimonial(id: string, updates: Partial<Testimonial>): Promise<Testimonial | null> {
  const row = toTestimonialUpdateRow(updates);
  const { data, error } = await supabase
    .from('testimonials')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) return null;
  return mapTestimonial(data as Record<string, unknown>);
}

// ─── Lead Gen Operations ──────────────────────────────────────────────────────

export async function getAllLeadGenRequests(): Promise<LeadGenRequest[]> {
  const { data, error } = await supabase
    .from('lead_gen_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapLeadGenRequest);
}

export async function getLeadGenRequestsByClientId(clientId: string): Promise<LeadGenRequest[]> {
  const { data, error } = await supabase
    .from('lead_gen_requests')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapLeadGenRequest);
}

export async function getLeadGenRequestById(id: string): Promise<LeadGenRequest | null> {
  const { data, error } = await supabase
    .from('lead_gen_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapLeadGenRequest(data as Record<string, unknown>);
}

export async function createLeadGenRequest(r: LeadGenRequest): Promise<LeadGenRequest> {
  const insertRow: Record<string, unknown> = {
    project_id: r.projectId,
    client_id: r.clientId,
    client_name: r.clientName ?? null,
    details: r.details,
    budget: r.budget ?? null,
    timeline: r.timeline ?? null,
    status: r.status ?? 'pending',
    admin_feedback: r.adminFeedback ?? null,
  };

  const { data, error } = await supabase
    .from('lead_gen_requests')
    .insert(insertRow)
    .select('*')
    .single();

  if (error || !data) throw new Error(`createLeadGenRequest failed: ${error?.message}`);
  return mapLeadGenRequest(data as Record<string, unknown>);
}

export async function updateLeadGenRequest(id: string, updates: Partial<LeadGenRequest>): Promise<LeadGenRequest | null> {
  const row = toLeadGenUpdateRow(updates);
  const { data, error } = await supabase
    .from('lead_gen_requests')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) return null;
  return mapLeadGenRequest(data as Record<string, unknown>);
}

// ─── Maintenance Feedback ─────────────────────────────────────────────────────

export async function getAllMaintenanceFeedback(): Promise<MaintenanceFeedback[]> {
  const { data, error } = await supabase
    .from('maintenance_feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapMaintenanceFeedback);
}

export async function getMaintenanceFeedbackByClientId(clientId: string): Promise<MaintenanceFeedback[]> {
  const { data, error } = await supabase
    .from('maintenance_feedback')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapMaintenanceFeedback);
}

export async function getMaintenanceFeedbackById(id: string): Promise<MaintenanceFeedback | null> {
  const { data, error } = await supabase
    .from('maintenance_feedback')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapMaintenanceFeedback(data as Record<string, unknown>);
}

export async function createMaintenanceFeedback(
  input: Omit<MaintenanceFeedback, '_id' | 'createdAt' | 'updatedAt'>
): Promise<MaintenanceFeedback> {
  const insertRow: Record<string, unknown> = {
    client_id: input.clientId,
    client_name: input.clientName ?? null,
    message: input.message,
    status: input.status ?? 'new',
    admin_response: input.adminResponse ?? null,
    responded_at: input.respondedAt ? new Date(input.respondedAt).toISOString() : null,
  };

  const { data, error } = await supabase
    .from('maintenance_feedback')
    .insert(insertRow)
    .select('*')
    .single();

  if (error || !data) throw new Error(`createMaintenanceFeedback failed: ${error?.message}`);
  return mapMaintenanceFeedback(data as Record<string, unknown>);
}

export async function updateMaintenanceFeedback(
  id: string,
  updates: Partial<MaintenanceFeedback>
): Promise<MaintenanceFeedback | null> {
  const row = toMaintenanceUpdateRow(updates);
  const { data, error } = await supabase
    .from('maintenance_feedback')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) return null;
  return mapMaintenanceFeedback(data as Record<string, unknown>);
}

// ─── Dev Operations ───────────────────────────────────────────────────────────

export async function getAllDevs(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'dev')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapUser);
}

export async function assignDevToProject(projectId: string, devId: string): Promise<boolean> {
  const project = await getProjectById(projectId);
  if (!project) return false;

  const current = project.assignedDevs ?? [];
  if (current.includes(devId)) return true;

  const { error } = await supabase
    .from('projects')
    .update({ assigned_devs: [...current, devId], updated_at: new Date().toISOString() })
    .eq('id', projectId);

  return !error;
}

export async function removeDevFromProject(projectId: string, devId: string): Promise<boolean> {
  const project = await getProjectById(projectId);
  if (!project) return false;

  const current = project.assignedDevs ?? [];
  const updated = current.filter(id => id !== devId);

  const { error } = await supabase
    .from('projects')
    .update({ assigned_devs: updated, updated_at: new Date().toISOString() })
    .eq('id', projectId);

  return !error;
}
