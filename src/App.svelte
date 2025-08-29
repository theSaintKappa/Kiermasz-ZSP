<script lang="ts">
    import DashboardPanels from "./lib/admin/DashboardPanels.svelte";
    import Landing from "./lib/customer/Landing.svelte";
    import Footer from "./lib/Footer.svelte";
    import Header from "./lib/Header.svelte";
    import { user, writingDisabled } from "./stores";
</script>

<Header />
<main>
    {#if $user}
        <DashboardPanels />
    {:else}
        <Landing />
    {/if}
</main>
<Footer />
{#if $writingDisabled && $user}
    <div>Wprowadzanie zmian zostało wyłączone</div>
{/if}

<style>
    main {
        width: 100%;
        display: flex;
        justify-content: center;
    }

    div {
        position: fixed;
        bottom: 0.5rem;
        font-size: clamp(1rem, 4vw, 2.25rem);
        font-weight: 700;
        opacity: 0.45;
        color: var(--warning-color);
        pointer-events: none;
    }
</style>
