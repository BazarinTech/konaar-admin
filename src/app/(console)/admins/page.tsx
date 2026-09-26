import { apiPage } from '@/lib/api';
import { currentAdmin } from '@/lib/session';
import { ago, count, date } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { NewAdmin } from './new-admin';
import { AdminRow } from './admin-row';

export interface AdminRecord {
  id: string;
  email: string;
  name: string;
  roles: string[];
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  createdBy: string | null;
  actions: number;
}

interface AdminList {
  roles: string[];
  data: AdminRecord[];
}

const AREAS: Record<string, string> = {
  admins: 'Administrators',
  users: 'Users',
  platform: 'Platform',
  resources: 'Resources',
  revenue: 'Revenue',
};

export const metadata = { title: 'Administrators — Konar Console' };

export default async function AdminsPage() {
  const [list, me] = await Promise.all([
    apiPage<AdminList>('/admin/admins'),
    currentAdmin(),
  ]);

  return (
    <>
      <PageHeader
        title="Administrators"
        description="Who can open this console, and which areas they see. An area they do not hold answers 404, not 403."
      >
        <NewAdmin roles={list.roles} areas={AREAS} />
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Administrator</TableHead>
                <TableHead>Areas</TableHead>
                <TableHead className="hidden sm:table-cell">Last signed in</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Changes made</TableHead>
                <TableHead className="hidden lg:table-cell">Added</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.data.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="flex items-center gap-2 font-medium">
                        {admin.name}
                        {admin.id === me.id ? (
                          <Badge variant="outline">you</Badge>
                        ) : null}
                        {admin.status !== 'active' ? (
                          <Badge variant="destructive">{admin.status}</Badge>
                        ) : null}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {admin.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {admin.roles.length ? (
                        admin.roles.map((role) => (
                          <Badge key={role} variant="secondary">
                            {AREAS[role] ?? role}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          dashboard only
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-xs sm:table-cell">
                    {ago(admin.lastLoginAt)}
                  </TableCell>
                  <TableCell className="tabular hidden text-right lg:table-cell">
                    {count(admin.actions)}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-xs lg:table-cell">
                    {date(admin.createdAt)}
                    {admin.createdBy ? ` by ${admin.createdBy}` : ''}
                  </TableCell>
                  <TableCell className="text-right">
                    <AdminRow
                      admin={admin}
                      allRoles={list.roles}
                      areas={AREAS}
                      isSelf={admin.id === me.id}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-muted-foreground mt-4 text-xs">
        The last active administrator holding Administrators cannot be removed,
        suspended or demoted — including by themselves. Otherwise one edit locks
        everyone out of the console for good.
      </p>
    </>
  );
}
