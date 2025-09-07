<script lang="ts">
    import { onMount } from "svelte";
    import { sellerSearchQuery } from "../../stores";

    let searchInput: HTMLInputElement;

    function handleKeydown(event: KeyboardEvent) {
        // Focus search bar with Cmd + / (or Ctrl + / on non-Mac)
        if ((event.metaKey || event.ctrlKey) && event.key === "/") {
            event.preventDefault();
            searchInput?.focus();
        }
    }

    onMount(() => {
        document.addEventListener("keydown", handleKeydown);
        return () => {
            document.removeEventListener("keydown", handleKeydown);
        };
    });

    function clearSearch() {
        $sellerSearchQuery = "";
        searchInput?.focus();
    }
</script>

<div class="search-container">
    <input bind:this={searchInput} bind:value={$sellerSearchQuery} type="text" placeholder="Szukaj sprzedawcy... ( ⌘ + / )" class="search-input" />
    {#if $sellerSearchQuery}
        <button on:click={clearSearch} class="clear-button" aria-label="Wyczyść wyszukiwanie">❌</button>
    {/if}
</div>

<style>
    .search-container {
        position: relative;
        display: flex;
        align-items: center;
        flex: 1;
        max-width: 300px;
    }

    .search-input {
        width: 100%;
        padding: 0.5rem 0.75rem;
        border: 2px solid var(--accent-primary);
        border-radius: 0.5rem;
        background-color: var(--bg-primary);
        color: var(--font-primary);
        font-size: 0.9rem;
        transition: border-color 0.2s ease;
    }

    .search-input:focus {
        outline: none;
        border-color: var(--accent-secondary);
    }

    .search-input::placeholder {
        color: var(--font-light-opaque);
    }

    .clear-button {
        position: absolute;
        right: 0.5rem;
        background: none;
        border: none;
        color: var(--font-light-opaque);
        cursor: pointer;
        padding: 0.25rem;
        transition: color 0.2s ease;
    }

    .clear-button:hover {
        color: var(--font-primary);
    }

    @media screen and (max-width: 1000px) {
        .search-container {
            max-width: 200px;
        }

        .search-input {
            font-size: 0.8rem;
        }

        .search-input::placeholder {
            font-size: 0.8rem;
        }
    }
</style>
