<script lang="ts">
    import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
    import { onDestroy, onMount } from "svelte";
    import { db } from "../../firebaseConfig";
    import { sellerSearchQuery } from "../../stores";
    import type { SellerDocument, SellerDocumentFull } from "../../types";
    import { converter } from "../../utils/converter";
    import SellerItem from "./SellerItem.svelte";

    let sellers: SellerDocumentFull[] = [];
    let filteredSellers: SellerDocumentFull[] = [];
    let searchTimeout: ReturnType<typeof setTimeout>;

    // Debounced filter function
    function filterSellers(searchQuery: string) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (searchQuery.trim() === "") {
                filteredSellers = sellers;
            } else {
                const query = searchQuery.toLowerCase().trim();
                filteredSellers = sellers.filter((seller) => {
                    const firstName = seller.firstName.toLowerCase();
                    const lastName = seller.lastName.toLowerCase();
                    const classSymbol = seller.classSymbol.toLowerCase();
                    const fullName = `${firstName} ${lastName}`;

                    return firstName.includes(query) || lastName.includes(query) || classSymbol.includes(query) || fullName.includes(query);
                });
            }
        }, 150); // 150ms debounce
    }

    // React to search query changes
    $: filterSellers($sellerSearchQuery);

    // Update filtered sellers when sellers data changes
    $: if (sellers) {
        filterSellers($sellerSearchQuery);
    }

    onMount(() => {
        const q = query(collection(db, "sellers"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q.withConverter(converter<SellerDocument>()), (snapshot) => {
            let sellerDocuments: SellerDocumentFull[] = [];
            for (const doc of snapshot.docs) {
                sellerDocuments.push({ ...doc.data(), id: doc.id });
            }
            sellers = sellerDocuments;
        });

        return () => unsubscribe();
    });

    onDestroy(() => {
        clearTimeout(searchTimeout);
    });
</script>

{#if filteredSellers.length}
    {#if $sellerSearchQuery.trim() !== ""}
        <div class="search-results-info">
            <p>Znaleziono <strong>{filteredSellers.length}</strong> z <strong>{sellers.length}</strong> sprzedawców</p>
        </div>
    {/if}
    <div class="list">
        {#each filteredSellers as seller}
            {#key seller.id}
                <SellerItem {seller} />
            {/key}
        {/each}
    </div>
{:else if sellers.length > 0 && $sellerSearchQuery.trim() !== ""}
    <div class="no-results">
        <p>Nie znaleziono sprzedawców pasujących do wyszukiwania: <strong>"{$sellerSearchQuery}"</strong></p>
    </div>
{/if}

<style>
    .search-results-info {
        width: 100%;
        padding: 0.5rem 1rem;
        background-color: var(--accent-secondary);
        border-radius: 0.5rem;
        margin-bottom: 1rem;
    }

    .search-results-info p {
        margin: 0;
        font-size: 0.9rem;
        color: var(--font-primary);
    }

    .list {
        width: 100%;
        display: flex;
        flex-direction: column;
        border: 2px solid var(--accent-primary);
        border-radius: 1rem;
        overflow: hidden;
        margin-bottom: 1rem;
    }

    .no-results {
        width: 100%;
        padding: 2rem;
        text-align: center;
        color: var(--font-light-opaque);
        border: 2px solid var(--accent-primary);
        border-radius: 1rem;
    }

    .no-results p {
        margin: 0;
        font-style: italic;
    }

    .no-results strong {
        color: var(--font-primary);
    }
</style>
