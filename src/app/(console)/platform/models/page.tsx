import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { count, money } from '@/lib/format';
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
import type { PlatformOverview } from '../types';

export const metadata = { title: 'Models — Konaar Console' };

export default async function ModelsPage() {
  const overview = await apiPage<PlatformOverview>('/admin/platform');
  const roles = overview.engine.models;

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/platform">
          <ArrowLeftIcon />
          Platform
        </Link>
      </Button>
      <PageHeader
        title="Models"
        description="What each model costs the platform per million tokens, and what a customer is charged for it at today's margin."
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Cost in</TableHead>
                <TableHead className="text-right">Cost out</TableHead>
                <TableHead className="text-right">Charged in</TableHead>
                <TableHead className="text-right">Charged out</TableHead>
                <TableHead className="text-right">Context</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.models.map((model) => {
                const role =
                  model.id === roles.architect
                    ? 'architect'
                    : model.id === roles.editor
                      ? 'editor'
                      : model.id === roles.premium
                        ? 'premium'
                        : null;
                return (
                  <TableRow key={model.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{model.label}</span>
                        <code className="text-muted-foreground font-mono text-xs">
                          {model.id}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell>
                      {role ? <Badge>{role}</Badge> : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {model.tier}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {money(model.providerInputPerMTok)}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {money(model.providerOutputPerMTok)}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {money(model.chargedInputPerMTok)}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {money(model.chargedOutputPerMTok)}
                    </TableCell>
                    <TableCell className="tabular text-muted-foreground text-right text-xs">
                      {count(model.contextTokens / 1000)}k
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-muted-foreground mt-4 text-xs">
        Which model plays which role comes from the API&apos;s environment. Prices
        are the provider&apos;s published rates, held in the model registry.
      </p>
    </>
  );
}
