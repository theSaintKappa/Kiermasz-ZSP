import type { FieldValue, Timestamp } from "firebase/firestore";

export interface Creator {
    creator: {
        uid: string;
        email: string | null;
    };
}

export interface SellerDataForm {
    firstName: string;
    lastName: string;
    classSymbol: string;
    email: string;
}

export interface SellerDocument extends SellerDataForm, Creator {
    createdAt: FieldValue;
    hasCashedOut: boolean;
    notes: string | null;
}

export interface SellerDocumentFull extends SellerDocument {
    id: string;
}

export interface TextbookDataForm {
    title: string;
    price: number;
    condition: TextbookCondition;
    subject: string;
}

export interface TextbookDocument extends TextbookDataForm, Creator {
    createdAt: FieldValue;
    sold: boolean;
    soldAt: Timestamp | null;
    isLost: boolean;
    email: string;
    reservation: {
        status: boolean;
        holder: string | null;
        expiry: Timestamp | null;
    };
    parentId: string;
}

export interface TextbookDocumentFull extends TextbookDocument {
    id: string;
}

export type TextbookCondition = 1 | 2 | 3 | 4;

export interface BackupDocument {
    createdAt: Timestamp;
    status: "pending" | "complete" | "failed";
    type: "scheduled" | "manual";
}

export interface TitleDocument extends Creator {
    name: string;
    subject: string;
    createdAt: FieldValue;
}

export interface TitleDocumentFull extends TitleDocument {
    id: string;
}

export interface SubjectDocument {
    name: string;
}

export interface SubjectDocumentFull extends SubjectDocument {
    id: string;
}
