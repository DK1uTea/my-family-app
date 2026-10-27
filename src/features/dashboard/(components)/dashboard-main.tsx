'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Sparkles, Code2, ShieldCheck, Terminal } from 'lucide-react';

export default function DashboardMain() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
            Starter Base
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Welcome to your new Next.js 16 + React 19 + Tailwind CSS v4 application.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Framework</CardTitle>
            <Sparkles className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Next.js 16</div>
            <p className="text-xs text-muted-foreground mt-1">App Router + React 19</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Styling</CardTitle>
            <Code2 className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Tailwind v4</div>
            <p className="text-xs text-muted-foreground mt-1">Radix Nova + Shadcn UI</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">AI Rules</CardTitle>
            <ShieldCheck className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AGENTS.md</div>
            <p className="text-xs text-muted-foreground mt-1">CLAUDE.md + Agent Skills</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Testing</CardTitle>
            <Terminal className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Vitest + E2E</div>
            <p className="text-xs text-muted-foreground mt-1">Playwright configured</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            You can start developing new modules under <code className="font-mono text-primary">src/features/&lt;module&gt;</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Follow the architectural playbook in <code className="font-mono">CLAUDE.md</code> and <code className="font-mono">AGENTS.md</code> to build scalable, accessible, and type-safe features.
          </p>
          <div className="flex gap-3">
            <Button size="sm">Create New Feature</Button>
            <Button size="sm" variant="outline">View Architecture Docs</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
