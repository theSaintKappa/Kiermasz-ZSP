<script lang="ts">
    import { collection, collectionGroup, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
    import { onMount } from "svelte";
    import { db } from "../../firebaseConfig";
    import type { BackupDocument, SellerDocument, TextbookDocument } from "../../types";
    import { converter } from "../../utils/converter";

    let totalSellers = 0;
    let totalTextbooks = 0;
    let soldTextbooks = 0;
    let totalValue = 0;
    let avgValue = 0;
    let soldValue = 0;
    let activeReservations = 0;
    let lastBackup: BackupDocument | null = null;

    onMount(() => {
        const sellersQuery = query(collection(db, "sellers"));
        const unsubscribeSellers = onSnapshot(sellersQuery.withConverter(converter<SellerDocument>()), (snapshot) => {
            totalSellers = snapshot.docs.length;
        });

        const textbooksQuery = query(collectionGroup(db, "textbooks"));
        const unsubscribeTextbooks = onSnapshot(textbooksQuery.withConverter(converter<TextbookDocument>()), (snapshot) => {
            totalTextbooks = snapshot.docs.length;

            let totalValueSum = 0;
            let soldValueSum = 0;
            let soldCount = 0;
            let reservationCount = 0;

            for (const doc of snapshot.docs) {
                const textbook = doc.data();
                totalValueSum += textbook.price;

                if (textbook.sold) {
                    soldValueSum += textbook.price;
                    soldCount++;
                }
                if (textbook.reservation.status && !textbook.sold) reservationCount++;
            }

            totalValue = totalValueSum;
            avgValue = totalTextbooks > 0 ? Math.round((totalValueSum / totalTextbooks) * 100) / 100 : 0;
            soldTextbooks = soldCount;
            soldValue = soldValueSum;
            activeReservations = reservationCount;
        });

        // Subscribe to backup information
        const backupQuery = query(collection(db, "backups"), orderBy("createdAt", "desc"), where("status", "==", "complete"), limit(1));
        const unsubscribeBackup = onSnapshot(backupQuery.withConverter(converter<BackupDocument>()), (snapshot) => {
            if (!snapshot.empty) {
                lastBackup = snapshot.docs[0].data();
            } else {
                lastBackup = null;
            }
        });

        return () => {
            unsubscribeSellers();
            unsubscribeTextbooks();
            unsubscribeBackup();
        };
    });
</script>

<div class="stats">
    <span>Liczba sprzedawców: <strong>{totalSellers}</strong></span>
    <span>Liczba podręczników: <strong>{totalTextbooks}</strong></span>
    <span>Liczba sprzedanych podręczników: <strong>{soldTextbooks}</strong></span>
    <span>Wartość sprzedanych podręczników: <strong>{soldValue.toLocaleString("pl-PL")}zł</strong></span>
    <span>Średnia wartość: <strong>{avgValue}zł</strong></span>
    <span>Łączna wartość: <strong>{totalValue.toLocaleString("pl-PL")}zł</strong></span>
    <span>Aktywne rezerwacje: <strong>{activeReservations}</strong></span>
    {#if lastBackup}
        <span>Ostatnia kopia zapasowa: <strong>{lastBackup.createdAt.toDate().toLocaleString("pl-PL")}</strong> ({lastBackup.type ?? "unknown"})</span>
    {:else}
        <span>Brak kopii zapasowych</span>
    {/if}
</div>

<style>
    .stats {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        font-size: 0.9rem;
    }

    .stats span {
        background-color: var(--accent-secondary);
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        white-space: nowrap;
    }

    .stats strong {
        color: var(--font-primary);
        font-weight: 600;
    }

    @media screen and (max-width: 1000px) {
        .stats {
            justify-content: center;
        }
    }
</style>
