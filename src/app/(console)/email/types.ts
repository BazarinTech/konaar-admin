/** The admin API's email shapes, as the console reads them. */

export interface MyMailbox {
  id: string;
  address: string;
  displayName: string;
  status: 'active' | 'disabled';
  unread: number;
}

export interface ThreadSummary {
  id: string;
  subject: string;
  counterpart: string;
  counterpartName: string | null;
  status: 'open' | 'archived';
  unread: number;
  messageCount: number;
  snippet: string | null;
  lastMessageAt: string;
}

export interface MailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number | null;
}

export interface ThreadMessage {
  id: string;
  direction: 'in' | 'out';
  from: string;
  fromName: string | null;
  to: string[];
  cc: string[];
  subject: string;
  html: string | null;
  text: string | null;
  status: string;
  error: string | null;
  sentBy: string | null;
  attachments: MailAttachment[];
  createdAt: string;
}

export interface Thread {
  id: string;
  mailboxId: string;
  subject: string;
  counterpart: string;
  counterpartName: string | null;
  status: 'open' | 'archived';
  messages: ThreadMessage[];
}

export interface ManagedMailbox {
  id: string;
  address: string;
  displayName: string;
  signature: string | null;
  status: 'active' | 'disabled';
  createdAt: string;
  members: { id: string; name: string; email: string }[];
  threads: number;
}

export type AudienceStatus =
  | 'all'
  | 'active'
  | 'dormant'
  | 'unverified'
  | 'onboarding_incomplete'
  | 'banned';

export const AUDIENCE_LABEL: Record<AudienceStatus, string> = {
  all: 'All users',
  active: 'Active — signed in within 30 days',
  dormant: 'Dormant — not seen for 30 days',
  unverified: 'Email not confirmed',
  onboarding_incomplete: 'Onboarding not finished',
  banned: 'Suspended accounts',
};

export interface Audience {
  status: AudienceStatus;
  plan: string | null;
  includeOptedOut: boolean;
}

export interface Campaign {
  id: string;
  subject: string;
  audience: Audience;
  status: 'sending' | 'sent' | 'failed';
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  progress: number;
  from: string | null;
  createdBy: string | null;
  createdAt: string;
  finishedAt: string | null;
}

export interface Delivery {
  id: string;
  category: 'transactional' | 'campaign';
  template: string;
  to: string;
  subject: string;
  status: string;
  error: string | null;
  attempts: number;
  campaignId: string | null;
  hasAttachment: boolean;
  sentAt: string | null;
  createdAt: string;
}

export interface TemplateInfo {
  name: string;
  label: string;
  trigger: string;
}

/** Badge colour for a delivery or message status. */
export function statusVariant(
  status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (['bounced', 'complained', 'failed', 'suppressed'].includes(status)) return 'destructive';
  if (status === 'delivered') return 'default';
  if (status === 'queued' || status === 'delayed' || status === 'sending') return 'outline';
  return 'secondary';
}
