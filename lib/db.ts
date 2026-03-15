// Mock Database Implementation
// In production, replace with MongoDB connection using mongoose or mongodb package
// This allows the app to work without external dependencies initially

import { User, Project, ChatMessage, Payment, RoadmapItem, SetupItem } from './types';
import { hashPassword } from './auth';

interface StorageData {
  users: User[];
  projects: Project[];
  messages: ChatMessage[];
  payments: Payment[];
  setupItems: SetupItem[];
}

// In-memory storage for development
const storage: StorageData = {
  users: [],
  projects: [],
  messages: [],
  payments: [],
  setupItems: []
};

// Initialize with sample data
function initializeSampleData() {
  if (storage.users.length > 0) return;

  // Sample users with properly hashed passwords
  // Demo passwords: "Test1234" for both accounts
  const demoPasswordHash = hashPassword('Test1234');

  const adminUser: User = {
    _id: 'admin-1',
    email: 'admin@example.com',
    password: demoPasswordHash,
    role: 'admin',
    name: 'Admin User',
    phone: '+1-555-0100',
    company: 'Agency Inc',
    createdAt: new Date()
  };

  const clientUser: User = {
    _id: 'client-1',
    email: 'client@example.com',
    password: demoPasswordHash,
    role: 'client',
    name: 'Client User',
    phone: '+1-555-0101',
    company: 'Client Corp',
    createdAt: new Date()
  };

  storage.users.push(adminUser, clientUser);

  // Sample project
  const project: Project = {
    _id: 'project-1',
    clientId: 'client-1',
    adminId: 'admin-1',
    name: 'Website Redesign',
    description: 'Complete redesign of the client website with modern UI/UX',
    status: 'active',
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    roadmap: generateSampleRoadmap('project-1'),
    dailyProgress: generateSampleProgress(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  };

  storage.projects.push(project);

  // Sample setup items
  const setupItems: SetupItem[] = [
    { _id: 'setup-1', projectId: 'project-1', itemNumber: 1, title: 'Brand Guidelines', completed: true, completedAt: new Date() },
    { _id: 'setup-2', projectId: 'project-1', itemNumber: 2, title: 'Logo Files', completed: true, completedAt: new Date() },
    { _id: 'setup-3', projectId: 'project-1', itemNumber: 3, title: 'Content Audit', completed: false },
    { _id: 'setup-4', projectId: 'project-1', itemNumber: 4, title: 'Competitor Analysis', completed: false },
    { _id: 'setup-5', projectId: 'project-1', itemNumber: 5, title: 'User Research', completed: false }
  ];

  storage.setupItems.push(...setupItems);

  // Sample payments
  const payment: Payment = {
    _id: 'payment-1',
    projectId: 'project-1',
    amount: 5000,
    currency: 'USD',
    status: 'paid',
    paymentMethod: 'credit_card',
    notes: 'Initial deposit',
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    paidDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
  };

  storage.payments.push(payment);
}

function generateSampleRoadmap(projectId: string): RoadmapItem[] {
  const roadmap: RoadmapItem[] = [];
  const startDate = new Date();
  
  for (let day = 1; day <= 14; day++) {
    roadmap.push({
      _id: `roadmap-${day}`,
      projectId,
      day,
      title: `Phase ${Math.ceil(day / 3.5)} - Day ${day}`,
      description: `Completing deliverables for day ${day} of the project`,
      videoUrl: `https://example.com/video-${day}.mp4`,
      completed: day <= 2,
      feedback: day <= 2 ? 'Great work!' : undefined,
      approvedAt: day <= 2 ? new Date() : undefined,
      createdAt: new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000)
    });
  }
  
  return roadmap;
}

function generateSampleProgress(): any[] {
  const progress = [];
  for (let i = 0; i < 3; i++) {
    progress.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      percentage: 10 + i * 5,
      notes: `Progress update - Day ${i + 1}`
    });
  }
  return progress;
}

// User operations
export async function getUserByEmail(email: string): Promise<User | null> {
  initializeSampleData();
  return storage.users.find(u => u.email === email) || null;
}

export async function getUserById(id: string): Promise<User | null> {
  initializeSampleData();
  return storage.users.find(u => u._id === id) || null;
}

export async function createUser(user: User): Promise<User> {
  initializeSampleData();
  user._id = `user-${Date.now()}`;
  user.createdAt = new Date();
  storage.users.push(user);
  return user;
}

// Project operations
export async function getProjectsByUserId(userId: string, role: string): Promise<Project[]> {
  initializeSampleData();
  if (role === 'admin') {
    return storage.projects.filter(p => p.adminId === userId);
  }
  return storage.projects.filter(p => p.clientId === userId);
}

export async function getProjectById(id: string): Promise<Project | null> {
  initializeSampleData();
  return storage.projects.find(p => p._id === id) || null;
}

export async function createProject(project: Project): Promise<Project> {
  initializeSampleData();
  project._id = `project-${Date.now()}`;
  project.createdAt = new Date();
  storage.projects.push(project);
  return project;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  initializeSampleData();
  const project = storage.projects.find(p => p._id === id);
  if (!project) return null;
  Object.assign(project, updates, { updatedAt: new Date() });
  return project;
}

// Chat operations
export async function getProjectMessages(projectId: string, limit: number = 50): Promise<ChatMessage[]> {
  initializeSampleData();
  return storage.messages
    .filter(m => m.projectId === projectId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export async function createMessage(message: ChatMessage): Promise<ChatMessage> {
  initializeSampleData();
  message._id = `msg-${Date.now()}`;
  storage.messages.push(message);
  return message;
}

// Payment operations
export async function getProjectPayments(projectId: string): Promise<Payment[]> {
  initializeSampleData();
  return storage.payments.filter(p => p.projectId === projectId);
}

export async function createPayment(payment: Payment): Promise<Payment> {
  initializeSampleData();
  payment._id = `payment-${Date.now()}`;
  payment.createdAt = new Date();
  storage.payments.push(payment);
  return payment;
}

export async function updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | null> {
  initializeSampleData();
  const payment = storage.payments.find(p => p._id === id);
  if (!payment) return null;
  Object.assign(payment, updates, { updatedAt: new Date() });
  return payment;
}

// Setup items operations
export async function getProjectSetupItems(projectId: string): Promise<SetupItem[]> {
  initializeSampleData();
  return storage.setupItems.filter(s => s.projectId === projectId).sort((a, b) => a.itemNumber - b.itemNumber);
}

export async function updateSetupItem(id: string, updates: Partial<SetupItem>): Promise<SetupItem | null> {
  initializeSampleData();
  const item = storage.setupItems.find(s => s._id === id);
  if (!item) return null;
  Object.assign(item, updates, { completedAt: updates.completed ? new Date() : undefined });
  return item;
}

// Roadmap operations
export async function getRoadmapItem(projectId: string, day: number): Promise<RoadmapItem | null> {
  initializeSampleData();
  const project = await getProjectById(projectId);
  if (!project) return null;
  return project.roadmap.find(r => r.day === day) || null;
}

export async function updateRoadmapItem(projectId: string, day: number, updates: Partial<RoadmapItem>): Promise<RoadmapItem | null> {
  initializeSampleData();
  const project = await getProjectById(projectId);
  if (!project) return null;
  
  const item = project.roadmap.find(r => r.day === day);
  if (!item) return null;
  
  Object.assign(item, updates);
  await updateProject(projectId, { roadmap: project.roadmap });
  return item;
}

// Admin operations
export async function getAllProjects(): Promise<Project[]> {
  initializeSampleData();
  return storage.projects;
}

export async function getAllUsers(): Promise<User[]> {
  initializeSampleData();
  return storage.users;
}
