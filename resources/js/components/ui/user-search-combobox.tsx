"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { User } from "@/types"
import axios from "axios"
import { useEffect, useState } from "react"

interface UserSearchComboboxProps {
    value: string;
    onSelect: (userUuid: string) => void;
}

export function UserSearchCombobox({ value, onSelect }: UserSearchComboboxProps) {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [results, setResults] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!open) {
            return;
        }

        setIsLoading(true);
        const handler = setTimeout(() => {
            axios.get(route('admin.users.search', { query: searchQuery }))
                .then(response => {
                    setResults(response.data);
                })
                .catch(error => {
                    console.error("API Error:", error.response || error);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery, open]);

    const selectedUser = results.find(user => user.uuid === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {selectedUser ? selectedUser.name : "Select a user..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput
                        placeholder="Search for user by name or email..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList>
                        {isLoading && <CommandEmpty>Searching...</CommandEmpty>}
                        {!isLoading && results.length === 0 && <CommandEmpty>No users found.</CommandEmpty>}
                        <CommandGroup>
                            {results.map((user) => (
                                <CommandItem
                                    key={user.uuid}
                                    value={user.name}
                                    onSelect={() => {
                                        onSelect(user.uuid === value ? "" : user.uuid);
                                        setOpen(false);
                                    }}
                                >
                                    {user.name} <span className="text-xs text-muted-foreground ml-2">{user.email}</span>
                                    <Check
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            value === user.uuid ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
