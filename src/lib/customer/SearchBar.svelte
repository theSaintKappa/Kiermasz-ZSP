<script lang="ts">
    import { searchQuery } from "../../stores";

    let inputField: HTMLInputElement;

    function clearInput() {
        $searchQuery = "";
        inputField.focus();
    }
</script>

<section>
    <div>
        <input type="text" bind:value={$searchQuery} bind:this={inputField} aria-label="Wyszukaj tytuł" placeholder="🔍 Wyszukaj tytuł podręcznika..." />
        <button on:click={clearInput} aria-label="Wyczyść pole wyszukiwania">❌</button>
    </div>
</section>

<style>
    section {
        top: 1rem;
        position: sticky;
        z-index: 1;
        width: 100%;
        display: flex;
        justify-content: center;
        padding: 0.5rem 0;
        transition: padding 100ms;
    }

    div {
        width: min(100%, 600px);
        position: relative;
        display: flex;
        align-items: center;
    }

    input {
        width: 100%;
        height: 3.25em;
        font-size: 1.2rem;
        background-color: var(--bg-primary);
        border: 2px solid var(--accent-secondary);
        outline: 0 solid var(--accent-primary);
        border-radius: 0.5rem;
        padding-left: 0.5rem;
        transition:
            border-color 100ms,
            outline-width 50ms,
            font-size 100ms;
    }
    input:focus-visible {
        border-color: var(--accent-primary);
        outline-width: 2px;
    }
    input::placeholder {
        padding-left: 0.25rem;
    }

    button {
        position: absolute;
        background-color: transparent;
        border: none;
        font-size: 1.15rem;
        /* right: -2rem; */
        right: 0.75rem;
        scale: 0;
        /* transition: right 100ms; */
        transition:
            scale 100ms,
            rotate 200ms ease-out;
    }
    input:focus-visible + button,
    button:focus {
        /* right: 0.5rem; */
        scale: 1;
        rotate: -90deg;
    }

    @media screen and (max-width: 700px) {
        section {
            padding: 0;
        }
        input {
            font-size: 1rem;
        }
    }
</style>
