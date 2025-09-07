<script lang="ts">
    import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
    import { onMount } from "svelte";
    import { db } from "../../firebaseConfig";
    import type { SellerDocument, SellerDocumentFull } from "../../types";
    import { converter } from "../../utils/converter";
    import SellerItem from "./SellerItem.svelte";

    let sellers: SellerDocumentFull[] = [];

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
</script>

{#if sellers.length}
    <div class="list">
        {#each sellers as seller}
            {#key seller.id}
                <SellerItem {seller} />
            {/key}
        {/each}
    </div>
{/if}

<style>
    .list {
        width: 100%;
        display: flex;
        flex-direction: column;
        border: 2px solid var(--accent-primary);
        border-radius: 1rem;
        overflow: hidden;
    }
</style>
