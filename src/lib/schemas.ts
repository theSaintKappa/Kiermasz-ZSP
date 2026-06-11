import z from "zod";

const textbookTitleSchema = z.object({
    isbn: z
        .string()
        .min(1, "Podaj ISBN")
        .trim()
        .regex(/^\d{10}$|^\d{13}$/, "Nieprawidłowy format ISBN"),
    title: z.string().trim().min(1, "Podaj tytuł"),
    subtitle: z.string().trim().nullable().optional(),
    authors: z.array(z.string().trim()).nullable(),
    publisher: z.string().trim().nullable().optional(),
    publishing_year: z.number({ error: "Podaj rok wydania" }).int(),
    subject_id: z.uuid().optional().nullable(),
    subject_name: z.string().trim().optional().nullable(),
    level: z.enum(["basic", "extended", "basic_and_extended"], { message: "Wybierz poziom nauczania" }),
});

export const textbookTitleFormSchema = textbookTitleSchema.refine((data) => data.subject_id || data.subject_name, {
    message: "Wybierz przedmiot",
    path: ["subject_id"],
});
export const textbookTitleServerSchema = textbookTitleSchema.omit({ subject_name: true });

const textbookTitleUpdatePayloadSchema = textbookTitleSchema.omit({ subject_name: true, isbn: true });

export const textbookTitleUpdateSchema = z.object({
    id: z.string().uuid(),
    data: textbookTitleUpdatePayloadSchema,
});
