import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/shared/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage, AvatarGroup, AvatarGroupCount } from '@/shared/components/ui/avatar'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/shared/components/ui/breadcrumb'
import { Separator } from '@/shared/components/ui/separator'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'

const USERS = [
  { name: 'Alice Müller', email: 'alice@example.com', role: 'Admin', status: 'active' },
  { name: 'Bob Schmidt', email: 'bob@example.com', role: 'Editor', status: 'active' },
  { name: 'Carol Weber', email: 'carol@example.com', role: 'Viewer', status: 'inactive' },
] as const

export function DataDisplaySection() {
  return (
    <section className="space-y-8">
      <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">Data Display</h2>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Cards</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Default Card</CardTitle><CardDescription>With header and content</CardDescription></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Card body content goes here.</p></CardContent>
            <CardFooter><Button size="sm">Action</Button></CardFooter>
          </Card>
          <Card size="sm">
            <CardHeader><CardTitle>Small Card</CardTitle><CardDescription>Compact size variant</CardDescription></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Smaller padding and spacing.</p></CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Table</p>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {USERS.map((u) => (
                <TableRow key={u.email}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>
                    <Badge variant={u.status === 'active' ? 'default' : 'secondary'}>{u.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Avatar</p>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Avatar size="sm"><AvatarFallback>SM</AvatarFallback></Avatar>
            <Avatar><AvatarImage src="https://github.com/shadcn.png" alt="User" /><AvatarFallback>CN</AvatarFallback></Avatar>
            <Avatar size="lg"><AvatarFallback>LG</AvatarFallback></Avatar>
          </div>
          <AvatarGroup>
            <Avatar><AvatarFallback>AB</AvatarFallback></Avatar>
            <Avatar><AvatarFallback>CD</AvatarFallback></Avatar>
            <Avatar><AvatarFallback>EF</AvatarFallback></Avatar>
            <AvatarGroupCount>+3</AvatarGroupCount>
          </AvatarGroup>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Breadcrumb</p>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="#">Home</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href="#">Settings</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Profile</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Separator</p>
        <div className="space-y-2">
          <Separator />
          <div className="flex h-5 items-center gap-4 text-sm">
            <span>Section A</span><Separator orientation="vertical" /><span>Section B</span><Separator orientation="vertical" /><span>Section C</span>
          </div>
        </div>
      </div>

    </section>
  )
}
