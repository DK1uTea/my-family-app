'use client'

import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/shared/components/ui/dropdown-menu'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/shared/components/ui/tooltip'
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/shared/components/ui/sheet'
import { ChevronDownIcon, EditIcon, TrashIcon, CopyIcon, InfoIcon } from 'lucide-react'

export function OverlaysSection() {
  return (
    <section className="space-y-8">
      <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">Overlays & Menus</h2>

      <div className="flex flex-wrap gap-4">

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Dialog</p>
          <Dialog>
            <DialogTrigger asChild><Button variant="outline">Open Dialog</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm action</DialogTitle>
                <DialogDescription>This action cannot be undone. Are you sure you want to proceed?</DialogDescription>
              </DialogHeader>
              <DialogFooter showCloseButton>
                <Button variant="destructive">Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Sheet</p>
          <Sheet>
            <SheetTrigger asChild><Button variant="outline">Open Sheet</Button></SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Edit profile</SheetTitle>
                <SheetDescription>Make changes to your profile here. Click save when done.</SheetDescription>
              </SheetHeader>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Sheet content goes here.</p>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Dropdown Menu</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Options<ChevronDownIcon data-icon="inline-end" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem><EditIcon />Edit</DropdownMenuItem>
              <DropdownMenuItem><CopyIcon />Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive"><TrashIcon />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Tooltip</p>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild><Button variant="outline" size="icon"><InfoIcon /></Button></TooltipTrigger>
              <TooltipContent>Helpful information</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button size="sm">Hover me</Button></TooltipTrigger>
              <TooltipContent>This is a tooltip</TooltipContent>
            </Tooltip>
          </div>
        </div>

      </div>
    </section>
  )
}
