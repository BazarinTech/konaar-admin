export type CaseStatus = 'open' | 'pending' | 'resolved' | 'closed';

export const STATUS_LABEL: Record<CaseStatus, string> = {
  open: 'Waiting on us',
  pending: 'Waiting on customer',
  resolved: 'Resolved',
  closed: 'Closed',
};

export interface CaseRow {
  id: string;
  number: string;
  subject: string;
  area: string;
  severity: number;
  status: CaseStatus;
  customer: string;
  email: string;
  assignee: string | null;
  assignedTo: string | null;
  createdAt: string;
  lastActivityAt: string;
}

export interface CaseList {
  counts: Partial<Record<CaseStatus, number>>;
  urgent: number;
  items: CaseRow[];
}

export interface CaseMessage {
  id: string;
  author: 'customer' | 'admin' | 'system';
  authorName: string | null;
  body: string;
  internal: boolean;
  via: 'web' | 'email';
  createdAt: string;
}

export interface TranscriptMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  suggestCase: boolean;
  createdAt: string;
}

export interface CaseDetail {
  id: string;
  number: string;
  subject: string;
  area: string;
  problemArea: string;
  severity: number;
  status: CaseStatus;
  description: string;
  deploymentUrl: string | null;
  project: { id: string; name: string } | null;
  assignedTo: string | null;
  chatId: string | null;
  createdAt: string;
  lastActivityAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    verified: boolean;
    since: string;
    workspace: string | null;
    plan: string | null;
  };
  messages: CaseMessage[];
  transcript: TranscriptMessage[];
}

export interface Agent {
  id: string;
  name: string;
  email: string;
}

export interface ChatRow {
  id: string;
  title: string | null;
  status: 'active' | 'escalated' | 'closed';
  messageCount: number;
  customer: string;
  email: string;
  case: { id: string; number: string } | null;
  lastMessage: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface ChatDetail {
  id: string;
  title: string | null;
  status: ChatRow['status'];
  customer: { name: string; email: string };
  case: { id: string; number: string } | null;
  tokens: { input: number; output: number };
  messages: TranscriptMessage[];
}

export function severityVariant(s: number): 'destructive' | 'default' | 'secondary' | 'outline' {
  if (s === 1) return 'destructive';
  if (s === 2) return 'default';
  if (s === 3) return 'secondary';
  return 'outline';
}
