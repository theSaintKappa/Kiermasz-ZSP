import { writable } from "svelte/store";

export const user = writable<User | null>(null);

export const searchQuery = writable<string>("");
export const selectedSubject = writable<string>("");

export const textbookTitles = writable<{ name: string; subject: string }[]>([]);

export const lastBackup = writable<BackupDocument | null>(null);

export const writingDisabled = writable<boolean>(false);
