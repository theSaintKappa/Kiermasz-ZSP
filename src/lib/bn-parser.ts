import type { EducationLevel, TextbookMetadata } from "@/lib/textbook-utils";

interface MarcSubfield {
    a?: string;
    b?: string;
    c?: string;
    d?: string;
    e?: string;
    n?: string;
    p?: string;
    q?: string;
    m?: string;
}

interface MarcField {
    [tag: string]: {
        ind1: string;
        ind2: string;
        subfields: MarcSubfield[];
    };
}

interface BibRecord {
    id: number;
    kind: string | null;
    title: string;
    publisher: string;
    publicationYear: string;
    subject: string;
    author: string;
    updatedDate: string;
    marc: { fields: MarcField[] } | null;
}

interface BnApiResponse {
    bibs: BibRecord[];
}

const getMarcFields = (bib: BibRecord): MarcField[] => bib.marc?.fields ?? [];
const findField = (fields: MarcField[], tag: string): MarcField | undefined => fields.find((f) => tag in f);
const findAllFields = (fields: MarcField[], tag: string): MarcField[] => fields.filter((f) => tag in f);

function subfieldValue(field: MarcField | undefined, code: string): string | undefined {
    if (!field) return undefined;
    const tag = Object.keys(field)[0];
    return field[tag]?.subfields?.find((s) => code in s)?.[code as keyof MarcSubfield] as string | undefined;
}

export function selectBestBib(bibs: BibRecord[]): BibRecord | null {
    if (!bibs.length) return null;

    const scored = bibs
        .filter((b) => Boolean(b.title?.trim()))
        .map((bib) => {
            const fields = getMarcFields(bib);
            let score = 0;
            if (bib.kind === "książka") score += 10;
            score += fields.length;
            score += bib.updatedDate ? 1 : 0;
            return { bib, score };
        })
        .sort((a, b) => b.score - a.score);

    return scored[0]?.bib ?? null;
}

function extractTitle(fields: MarcField[]): string {
    const f245 = findField(fields, "245");
    let title = subfieldValue(f245, "a") ?? "";

    title = title.replace(/[/:;,\s]+$/, "").trim();

    const partNum = subfieldValue(f245, "n");
    if (partNum) {
        const cleaned = partNum.replace(/[,.\s]+$/, "").trim();
        if (cleaned) title += ` ${cleaned.toLowerCase()}`;
    }

    return title;
}

function extractSubtitle(fields: MarcField[]): string | null {
    let raw: string | undefined;

    const f246 = findField(fields, "246");
    raw = subfieldValue(f246, "b");

    if (!raw) {
        const f245 = findField(fields, "245");
        raw = subfieldValue(f245, "b");
    }

    if (!raw?.trim()) return null;

    raw = raw.replace(/\s*:\s*zakres\b.*$/i, "").trim();

    raw = raw.replace(/[/;,\s]+$/, "").trim();
    raw = raw.replace(/^[/:;,\s]+/, "").trim();
    raw = raw.replace(/\s*:\s*$/, "").trim();
    raw = raw.replace(/^\s*:\s*/, "").trim();

    return raw || null;
}

function extractAuthors(fields: MarcField[]): string[] {
    const authors: string[] = [];

    const f100 = findField(fields, "100");
    const f100name = subfieldValue(f100, "a");
    if (f100name) authors.push(cleanAuthorName(f100name));

    const f700s = findAllFields(fields, "700");
    for (const f700 of f700s) {
        const role = subfieldValue(f700, "e");
        if (role === "Autor") {
            const name = subfieldValue(f700, "a");
            if (name) authors.push(cleanAuthorName(name));
        }
    }

    return authors;
}

function cleanAuthorName(raw: string): string {
    let name = raw.replace(/\s*\(.*?\)\s*/g, " ").trim();
    name = name.replace(/\s*,\s*$/, "").trim();

    if (name.includes(",")) {
        const parts = name
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean);
        if (parts.length >= 2) {
            name = `${parts[1]} ${parts[0]}`.trim();
        }
    }

    return name;
}

function extractPublisher(fields: MarcField[]): string | null {
    const f260 = findField(fields, "260");
    const publisher = subfieldValue(f260, "b");
    if (!publisher?.trim()) return null;

    return publisher.replace(/[,.\s]+$/, "").trim() || null;
}

function extractPublicationYear(fields: MarcField[], fallbackYear?: string): number | null {
    const f260 = findField(fields, "260");
    const raw = subfieldValue(f260, "c");
    if (raw) {
        const match = raw.match(/\b(\d{4})\b/);
        if (match) return Number.parseInt(match[1], 10);
    }

    const f046 = findField(fields, "046");
    const k = subfieldValue(f046, "k");
    if (k) {
        const match = k.match(/\b(\d{4})\b/);
        if (match) return Number.parseInt(match[1], 10);
    }

    if (fallbackYear) {
        const match = fallbackYear.match(/\b(\d{4})\b/);
        if (match) return Number.parseInt(match[1], 10);
    }

    return null;
}

function extractSubject(fields: MarcField[]): string | null {
    const f650 = findField(fields, "650");
    let subject = subfieldValue(f650, "a");
    if (!subject?.trim()) return null;

    subject = subject.replace(/\(przedmiot szkolny\)/gi, "").trim();
    return subject || null;
}

function extractEducationLevel(fields: MarcField[]): EducationLevel {
    const f385s = findAllFields(fields, "385");

    let hasBasic = false;
    let hasExtended = false;

    for (const f385 of f385s) {
        const nauczanie = subfieldValue(f385, "m");
        if (nauczanie !== "Poziom nauczania") continue;

        const level = subfieldValue(f385, "a");
        if (!level) continue;

        if (/podstawowy/i.test(level)) hasBasic = true;
        if (/rozszerzony/i.test(level)) hasExtended = true;
    }

    if (hasBasic && hasExtended) return "basic_and_extended";
    if (hasExtended) return "extended";
    if (hasBasic) return "basic";
    return "basic";
}

export function parseBib(bib: BibRecord): TextbookMetadata {
    const fields = getMarcFields(bib);

    return {
        title: extractTitle(fields),
        subtitle: extractSubtitle(fields),
        authors: extractAuthors(fields),
        publisher: extractPublisher(fields),
        publication_year: extractPublicationYear(fields, bib.publicationYear),
        subject: extractSubject(fields),
        education_level: extractEducationLevel(fields),
    };
}

export function parseBnResponse(data: BnApiResponse): TextbookMetadata | null {
    if (!data?.bibs?.length) return null;

    const best = selectBestBib(data.bibs);
    if (!best) return null;

    return parseBib(best);
}
