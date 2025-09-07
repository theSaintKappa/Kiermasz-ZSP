<script lang="ts">
    import { user } from "../../stores";
    import SellerPanel from "./SellerPanel.svelte";
    import TextbookPanel from "./TextbookPanel.svelte";
</script>

<svelte:head><title>Kiermasz ZSTiO - 👤{$user?.displayName}</title></svelte:head>
<div>
    <SellerPanel />
    <TextbookPanel />
</div>

<style>
    :root {
        --panel-margin: 1.75rem;
    }

    div {
        width: calc(100% - (2 * var(--panel-margin)));
        margin: var(--panel-margin) 0 calc(var(--panel-margin) * 6);
        display: grid;
        gap: 2rem;
        grid-template-columns: 60% 1fr;
    }

    @media screen and (max-width: 1000px) {
        :root {
            --panel-margin: 1rem;
        }
        div {
            grid-template-columns: 1fr;
        }
    }
</style>
