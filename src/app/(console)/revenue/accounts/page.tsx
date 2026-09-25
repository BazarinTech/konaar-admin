import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { money } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
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
import type { TopAccount } from '../types';

export const metadata = { title: 'Accounts — Konar Console' };

export default async function AccountsPage() {
  const accounts = await apiPage<{ data: TopAccount[] }>(
    '/admin/revenue/accounts?limit=50',
  );

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/revenue">
          <ArrowLeftIcon />
          Revenue
        </Link>
      </Button>
      <PageHeader
        title="Accounts"
        description="Who is paying, and what each of them costs to serve. Contribution is the difference."
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workspace</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Contribution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.data.map((account) => (
                <TableRow key={account.workspaceId}>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {account.ownerEmail}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={account.plan === 'free' ? 'outline' : 'default'}
                    >
                      {account.plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {money(account.paid)}
                  </TableCell>
                  <TableCell className="tabular text-muted-foreground text-right">
                    {money(account.cost)}
                  </TableCell>
                  <TableCell
                    className={
                      account.contribution >= 0
                        ? 'tabular text-success text-right'
                        : 'tabular text-destructive text-right'
                    }
                  >
                    {money(account.contribution)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
