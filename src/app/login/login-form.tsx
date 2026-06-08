"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const loginFormSchema = z.object({
    email: z.string().trim().min(1, "Podaj adres email").pipe(z.email("Podaj poprawny adres email")),
    password: z.string().min(1, "Podaj hasło").min(8, "Hasło musi mieć co najmniej 8 znaków"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const loginErrorMessages = {
    invalid_credentials: "Nieprawidłowe dane logowania",
} as const;

const getLoginErrorMessage = (error: { code?: string; message: string }) => (error.code && error.code in loginErrorMessages ? loginErrorMessages[error.code as keyof typeof loginErrorMessages] : error.message);

export function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextPath = searchParams.get("next");
    const defaultEmail = searchParams.get("email") || "";
    const supabase = createClient();
    const [authError, setAuthError] = useState<string | null>(null);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: { email: defaultEmail },
    });

    const onSubmit = async ({ email, password }: LoginFormValues) => {
        setAuthError(null);

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setAuthError(getLoginErrorMessage(error));
            return;
        }

        const target = nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";
        router.push(target);
        router.refresh();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
                <div className="flex flex-col items-center gap-5 text-center">
                    <Link href="/">
                        <Logo className="h-20 sm:h-22" />
                    </Link>
                    <h1 className="font-bold text-2xl sm:text-3xl">Panel Administracyjny</h1>
                </div>
                <Field data-invalid={Boolean(errors.email)}>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" type="email" placeholder="kowalski@example.com" autoComplete="email" autoFocus={!defaultEmail} aria-invalid={Boolean(errors.email)} {...register("email")} />
                    <FieldError errors={[errors.email]} />
                </Field>
                <Field data-invalid={Boolean(errors.password)}>
                    <FieldLabel htmlFor="password">Hasło</FieldLabel>
                    <Input id="password" type="password" placeholder="••••••••••" autoComplete="current-password" autoFocus={Boolean(defaultEmail)} aria-invalid={Boolean(errors.password)} {...register("password")} />
                    <FieldError errors={[errors.password]} />
                </Field>
                <FieldError>{authError}</FieldError>
                <Field>
                    <Button size="lg" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Logowanie..." : "Zaloguj się"}
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    );
}
