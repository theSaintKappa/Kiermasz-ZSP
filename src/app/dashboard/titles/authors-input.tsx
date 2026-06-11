"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ClipboardEvent, type KeyboardEvent, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AuthorsInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "defaultValue" | "ref"> {
    value: string[];
    onChange: (value: string[]) => void;
}

export function AuthorsInput({ value, onChange, disabled, className, "aria-invalid": ariaInvalid, id, onBlur, name, placeholder, ...rest }: AuthorsInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const commit = (raw: string) => {
        const trimmed = raw.trim();
        if (!trimmed || value.includes(trimmed)) return;
        onChange([...value, trimmed]);
    };

    const remove = (name: string) => {
        onChange(value.filter((n) => n !== name));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        const input = e.currentTarget;
        const raw = input.value;

        if (e.key === "Enter" || e.key === "," || e.key === ";") {
            e.preventDefault();
            commit(raw);
            input.value = "";
            return;
        }

        if (e.key === "Backspace" && !raw && value.length > 0) {
            remove(value[value.length - 1]);
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        const pasted = e.clipboardData.getData("text");
        if (!/[,;]/.test(pasted)) return;

        e.preventDefault();
        const names = pasted
            .split(/[,;]/)
            .map((n) => n.trim())
            .filter(Boolean);

        const unique = names.filter((n) => !value.includes(n));
        if (unique.length > 0) {
            onChange([...value, ...unique]);
        }
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div
            data-slot="input"
            aria-invalid={ariaInvalid}
            className={cn(
                "flex min-h-8 w-full flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:disabled:bg-input/80",
                className,
            )}
        >
            {value.map((name) => (
                <Badge key={name} variant="outline" className="group flex items-center gap-1" render={<button type="button" onClick={() => remove(name)} />}>
                    {name}
                    <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="text-muted-foreground transition-colors group-hover:text-destructive group-focus:text-destructive" />
                </Badge>
            ))}
            <input ref={inputRef} type="text" id={id} name={name} className="flex-1 bg-transparent outline-none" placeholder={value.length === 0 && placeholder ? placeholder : undefined} onKeyDown={handleKeyDown} onPaste={handlePaste} onBlur={onBlur} disabled={disabled} {...rest} />
        </div>
    );
}
