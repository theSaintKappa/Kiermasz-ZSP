<script lang="ts">
    import AccordionButton from "./AccordionButton.svelte";
    import AddSellerButton from "./AddSellerButton.svelte";
    import BackupButton from "./BackupButton.svelte";
    import SellerList from "./SellerList.svelte";
    import SellerSearchBar from "./SellerSearchBar.svelte";
    import Stats from "./Stats.svelte";
</script>

<section>
    <div class="buttons-container">
        <div>
            <AddSellerButton />
            <AccordionButton />
            <BackupButton />
        </div>
        <SellerSearchBar />
    </div>
    <SellerList />
    <Stats />
</section>

<style>
    section {
        display: flex;
        flex-direction: column;
        align-items: start;
    }

    .buttons-container {
        position: sticky;
        top: 0;
        z-index: 10;
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        width: 100%;
    }
    .buttons-container div {
        display: flex;
        gap: 0.5rem;
    }

    @media screen and (max-width: 1000px) {
        .buttons-container {
            flex-direction: column;
            align-items: center;
        }
    }
</style>
