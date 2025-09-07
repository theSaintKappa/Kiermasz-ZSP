<script lang="ts">
    import { collectionGroup, onSnapshot, orderBy, query, where } from "firebase/firestore";
    import { onMount } from "svelte";
    import { blur } from "svelte/transition";
    import { db } from "../../firebaseConfig";
    import { searchQuery, selectedSubject } from "../../stores";
    import type { TextbookDocument } from "../../types";
    import { converter } from "../../utils/converter";

    interface GroupedTextbook {
        title: string;
        count: number;
        minPrice: number;
        maxPrice: number;
        subject: string;
    }

    let textbooks: GroupedTextbook[] = [];
    let filteredTextbooks: GroupedTextbook[] = [];

    onMount(() => {
        const q = query(collectionGroup(db, "textbooks"), where("sold", "==", false), where("reservation.status", "==", false), orderBy("title", "asc"));
        const unsubscribe = onSnapshot(q.withConverter(converter<TextbookDocument>()), (snapshot) => {
            const groups = new Map<string, { count: number; minPrice: number; maxPrice: number; subject: string }>();
            for (const doc of snapshot.docs) {
                const data = doc.data();
                const title = data.title;
                const price = data.price;
                const subject = data.subject;
                if (groups.has(title)) {
                    const g = groups.get(title);
                    if (g) {
                        g.count++;
                        g.minPrice = Math.min(g.minPrice, price);
                        g.maxPrice = Math.max(g.maxPrice, price);
                    }
                } else {
                    groups.set(title, { count: 1, minPrice: price, maxPrice: price, subject });
                }
            }
            textbooks = Array.from(groups.entries()).map(([title, g]) => ({ title, ...g }));
            filteredTextbooks = textbooks;
        });

        return () => unsubscribe();
    });

    function clearFilters() {
        $searchQuery = "";
        $selectedSubject = "";
    }

    $: {
        let filtered = textbooks;
        if ($searchQuery !== "") filtered = filtered.filter((group) => group.title.toLowerCase().includes($searchQuery.toLowerCase()));
        if ($selectedSubject !== "") filtered = filtered.filter((group) => group.subject === $selectedSubject);
        filteredTextbooks = filtered;
    }
</script>

<section>
    {#each filteredTextbooks as group, i (group.title)}
        <div class="card" in:blur={{ delay: i * 7.5, duration: 400 }}>
            <span class="title" title={group.title}>{group.title}</span>
            <div class="info">
                <span class="count">{group.count} szt.</span>
                <span class="price">{group.minPrice === group.maxPrice ? group.minPrice : `od ${group.minPrice} do ${group.maxPrice}`}zł</span>
            </div>
        </div>
    {/each}
</section>
{#if !filteredTextbooks.length && !textbooks.length}
    <h3>Wczytywanie podręczników...</h3>
{/if}
{#if !filteredTextbooks.length && textbooks.length}
    <h3>Brak podręczników pasujących do wybranych filtrów</h3>
    <button on:click={clearFilters} class="btn">Wyczyść filtry</button>
{/if}

<style>
    :root {
        --gap: 1rem;
    }

    section {
        display: grid;
        place-items: center;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        width: min(100% - 2 * var(--gap), 1800px);
        gap: var(--gap);
    }

    h3 {
        text-align: center;
    }

    @media screen and (max-width: 700px) {
        section {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        }
    }

    .card {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        height: 6.875em;
        background-color: var(--bg-secondary);
        padding-inline: 1.2rem;
        border-radius: 0.5rem;
        position: relative;
        overflow: hidden;
    }
    .card::before {
        content: "";
        position: absolute;
        left: 0;
        height: 100%;
        width: 8px;
        background-color: var(--accent-secondary);
    }

    .title {
        font-weight: 500;
        text-align: center;
        text-shadow: 0.125em 0.125em 2px rgba(0, 0, 0, 0.75);
        display: -webkit-box;
        line-clamp: 2;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-wrap: balance;
    }

    .info {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .info span {
        font-weight: bold;
        padding: 0.1rem 0.4rem;
        border-radius: 0.25rem;
        text-shadow: 0.125em 0.125em 1.5px rgba(0, 0, 0, 0.5);
    }

    .price {
        background-color: var(--price-color);
    }

    .count {
        background-color: var(--accent-primary);
    }
</style>
