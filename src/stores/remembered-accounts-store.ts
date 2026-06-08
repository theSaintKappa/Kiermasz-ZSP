import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RememberedAccount {
    id: string;
    email: string;
    name: string;
}

interface RememberedAccountsState {
    accounts: RememberedAccount[];
    addOrUpdateAccount: (id: string, email: string, name: string) => void;
    removeAccount: (id: string) => void;
}

export const useRememberedAccountsStore = create<RememberedAccountsState>()(
    persist(
        (set, get) => ({
            accounts: [],

            addOrUpdateAccount: (id, email, name) => {
                const accounts = [...get().accounts];
                const existingIdx = accounts.findIndex((a) => a.id === id);
                const account: RememberedAccount = { id, email, name };

                if (existingIdx >= 0) {
                    accounts[existingIdx] = account;
                } else {
                    accounts.push(account);
                }

                set({ accounts });
            },

            removeAccount: (id) => {
                set({ accounts: get().accounts.filter((a) => a.id !== id) });
            },
        }),
        {
            name: "remembered-accounts",
        },
    ),
);
