export interface UserRow {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLoginAt: string | null;
  emailVerified: boolean;
  banned: { at: string; reason: string } | null;
  plan: { code: string; name: string; subscriptionStatus: string | null } | null;
  workspaces: number;
  builds: number;
  projects: number;
  paid: number;
  modelSpend: number;
  creditsSpent: number;
  creditBalance: number;
}

export interface UserList {
  data: UserRow[];
  pageInfo: { nextCursor: string | null; hasMore: boolean };
  /** Present on the first page only — counting on every scroll is the cost avoided. */
  total?: number;
}

/** The filters a page of users was fetched under. */
export interface UserQuery {
  query: string;
  status: string;
  sort: string;
}
