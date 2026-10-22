export type ChangelogKind = 'feature' | 'improvement' | 'fix' | 'security' | 'deprecation';

export const KIND_LABEL: Record<ChangelogKind, string> = {
  feature: 'New feature',
  improvement: 'Improvement',
  fix: 'Fix',
  security: 'Security',
  deprecation: 'Deprecation',
};

export interface ChangelogEntry {
  id: string;
  slug: string;
  title: string;
  kind: ChangelogKind;
  areas: string[];
  version: string | null;
  summary: string;
  body: string;
  imageUrl: string | null;
  status: 'draft' | 'published';
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  editedBy?: string | null;
}

export interface ChangelogMeta {
  areas: { id: string; label: string }[];
  kinds: ChangelogKind[];
}

export function kindVariant(kind: ChangelogKind): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (kind === 'feature') return 'default';
  if (kind === 'security' || kind === 'deprecation') return 'destructive';
  if (kind === 'fix') return 'outline';
  return 'secondary';
}
