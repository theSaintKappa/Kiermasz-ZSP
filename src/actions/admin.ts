"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

interface CreateAdminInput {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: "admin" | "super_admin";
}

interface CreateAdminResult {
    success: true;
    email: string;
    password: string;
}

export async function createAdmin(input: CreateAdminInput): Promise<CreateAdminResult> {
    const { firstName, lastName, email, password, role } = input;

    const supabase = await createClient();

    const {
        data: { user: caller },
    } = await supabase.auth.getUser();

    if (!caller) {
        throw new Error("Nie jesteś zalogowany.");
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", caller.id).maybeSingle();

    if (profile?.role !== "super_admin") {
        throw new Error("Tylko super administrator może dodawać nowych administratorów.");
    }

    const serviceClient = createServiceClient();

    const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            first_name: firstName,
            last_name: lastName,
        },
    });

    if (createError) {
        throw new Error(createError.message);
    }

    if (!newUser.user) {
        throw new Error("Nie udało się utworzyć użytkownika.");
    }

    const { error: profileError } = await serviceClient.from("profiles").upsert({
        id: newUser.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
    });

    if (profileError) {
        await serviceClient.auth.admin.deleteUser(newUser.user.id);
        throw new Error(profileError.message);
    }

    revalidatePath("/dashboard/admins");

    return {
        success: true,
        email,
        password,
    };
}

interface UpdateAdminInput {
    id: string;
    firstName: string;
    lastName: string;
    role: "admin" | "super_admin";
}

export async function updateAdmin(input: UpdateAdminInput): Promise<void> {
    const { id, firstName, lastName, role } = input;

    const supabase = await createClient();

    const {
        data: { user: caller },
    } = await supabase.auth.getUser();

    if (!caller) {
        throw new Error("Nie jesteś zalogowany.");
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", caller.id).maybeSingle();

    if (profile?.role !== "super_admin") {
        throw new Error("Tylko super administrator może edytować administratorów.");
    }

    const serviceClient = createServiceClient();

    const { error } = await serviceClient
        .from("profiles")
        .update({
            first_name: firstName,
            last_name: lastName,
            role,
        })
        .eq("id", id);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/dashboard/admins");
}

export async function deleteAdmin(id: string): Promise<void> {
    const supabase = await createClient();

    const {
        data: { user: caller },
    } = await supabase.auth.getUser();

    if (!caller) {
        throw new Error("Nie jesteś zalogowany.");
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", caller.id).maybeSingle();

    if (profile?.role !== "super_admin") {
        throw new Error("Tylko super administrator może usuwać administratorów.");
    }

    if (caller.id === id) {
        throw new Error("Nie możesz usunąć swojego własnego konta.");
    }

    const serviceClient = createServiceClient();

    const { error: profileError } = await serviceClient.from("profiles").delete().eq("id", id);

    if (profileError) {
        throw new Error(profileError.message);
    }

    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(id);

    if (deleteError) {
        throw new Error(deleteError.message);
    }

    revalidatePath("/dashboard/admins");
}
