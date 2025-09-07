<script lang="ts">
    import AccordionButton from "./AccordionButton.svelte";
    import AddSellerButton from "./AddSellerButton.svelte";
    import BackupButton from "./BackupButton.svelte";
    import SellerList from "./SellerList.svelte";
    import Stats from "./Stats.svelte";
</script>

<section>
    <div>
        <AddSellerButton />
        <AccordionButton />
        <BackupButton />
    </div>
    <SellerList />
    <Stats />
</section>

<style>
    section {
        display: flex;
        flex-direction: column;
        align-items: start;
        gap: 1rem;
    }

    div {
        display: flex;
        align-items: center;
        gap: 1rem;
        width: 100%;
    }

    @media screen and (max-width: 1000px) {
        div {
            justify-content: center;
        }
    }
</style>
