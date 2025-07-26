"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { FormDialogProps } from "@/types"
import { Loader2 } from "lucide-react"

export function FormDialog({ title, triggerText, isLoading = false, isOpen, onOpenChange, onSubmit, children, }: FormDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {triggerText && (
                <DialogTrigger asChild>
                    <Button variant="default">{triggerText}</Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[75vh] overflow-y-auto pr-6">
                    <form id="dialog-form" onSubmit={onSubmit} className="space-y-6">
                        {children}
                    </form>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" form="dialog-form" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? "Saving..." : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
