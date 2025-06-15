"use client"

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

type Option = {
    label: string
    value: string
}

interface ComboboxMultiProps {
    value: string[]
    onChange: (value: string[]) => void
    options: Option[]
    placeholder?: string
    className?: string
}

export function ComboboxMulti({ value, onChange, options, placeholder = "Select...", className, }: ComboboxMultiProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                            "w-full justify-between",
                            !value.length && "text-muted-foreground",
                            className
                        )}>
                        {value.length > 0
                            ? options
                                .filter((opt) => value.includes(opt.value))
                                .map((opt) => opt.label)
                                .join(", ")
                            : placeholder}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                    </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                        <CommandEmpty>No roles found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const isSelected = value.includes(option.value)
                                return (
                                    <CommandItem
                                        key={option.value}
                                        value={option.label}
                                        onSelect={() => {
                                            onChange(
                                                isSelected
                                                    ? value.filter((v) => v !== option.value)
                                                    : [...value, option.value]
                                            )
                                        }}>
                                        {option.label}
                                        <Check
                                            className={cn(
                                                "ml-auto h-4 w-4",
                                                isSelected ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
