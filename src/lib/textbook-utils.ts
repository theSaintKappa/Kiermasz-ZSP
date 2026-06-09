export type EducationLevel = "basic" | "extended" | "basic_and_extended";

export interface TextbookMetadata {
    title: string;
    subtitle: string | null;
    authors: string[];
    publisher: string | null;
    publication_year: number | null;
    subject: string | null;
    education_level: EducationLevel | null;
}

export interface TextbookLookupResult extends TextbookMetadata {
    subject_id: string | null;
    subject_matched: boolean;
}
