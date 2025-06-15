"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { FormDialogProps } from "@/types"

export function FormDialog({ title, triggerText, isLoading = false, isOpen, onOpenChange, onSubmit, children, }: FormDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {triggerText && (
                <DialogTrigger asChild>
                    <Button variant="default">{triggerText}</Button>
                </DialogTrigger>
            )}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 mt-4">
                    {children}
                    <div className="flex justify-end space-x-2">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
