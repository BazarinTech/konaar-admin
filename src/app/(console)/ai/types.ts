/** Shapes returned by `/admin/ai/*`. Kept beside the pages that render them. */

export type EngineKind = 'model' | 'role' | 'effort' | 'int' | 'bool';
export type EngineGroup = 'models' | 'routing' | 'limits' | 'quality';

export interface EngineSetting {
  key: string;
  label: string;
  help: string;
  group: EngineGroup;
  kind: EngineKind;
  role?: 'editor' | 'architect' | 'premium';
  operation?: string;
  min?: number;
  max?: number;
  appliesTo: string;
  value: string | number | boolean;
  default: string | number | boolean;
  overridden: boolean;
  updatedAt: string | null;
  updatedBy: { name: string; email: string | null } | null;
}

export interface EngineModel {
  id: string;
  label: string;
  tier: string;
  maxOutputTokens: number;
  contextTokens: number;
  supportsStructuredOutput: boolean;
  supportsEffort: boolean;
  inputPerMTok: number;
  outputPerMTok: number;
}

export interface EngineOverview {
  settings: EngineSetting[];
  models: EngineModel[];
  operations: string[];
  roles: string[];
  efforts: string[];
  budgets: { runCredits: number; projectCredits30d: number };
}

export interface Skill {
  id: string;
  slug: string;
  name: string;
  description: string;
  instructions: string;
  operations: string[];
  siteTypes: string[];
  triggers: string[];
  enabled: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface SkillsOverview {
  skills: Skill[];
  operations: string[];
  siteTypes: string[];
  budget: { chars: number; count: number };
}

export interface SkillPreview {
  applied: { id: string; slug: string; name: string; priority: number }[];
  dropped: { id: string; slug: string; name: string; priority: number }[];
  text: string;
  chars: number;
  budget: { chars: number; count: number };
}

/** What a skill form sends. Mirrors the API's schema. */
export interface SkillDraft {
  slug: string;
  name: string;
  description: string;
  instructions: string;
  operations: string[];
  siteTypes: string[];
  triggers: string[];
  enabled: boolean;
  priority: number;
}

/** Plain-English names for the work a model does. */
export const OPERATION_LABELS: Record<string, string> = {
  spec: 'Specification',
  select: 'Template selection',
  implement: 'Building',
  edit: 'Change requests',
  repair: 'Repairs',
  review: 'Review',
  name: 'Naming',
  classify: 'Classifying',
  summarize: 'Summarizing',
};

export const SITE_TYPE_LABELS: Record<string, string> = {
  landing: 'Landing',
  marketing: 'Marketing',
  'saas-app': 'SaaS app',
  dashboard: 'Dashboard',
  ecommerce: 'Ecommerce',
  portfolio: 'Portfolio',
  blog: 'Blog',
  booking: 'Booking',
};
