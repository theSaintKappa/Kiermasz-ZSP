<script lang="ts">
    import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
    import { onMount } from "svelte";
    import { db } from "../../firebaseConfig";
    import { searchQuery, selectedSubject } from "../../stores";
    import type { SubjectDocument, SubjectDocumentFull } from "../../types";
    import { converter } from "../../utils/converter";

    let subjects: SubjectDocumentFull[] = [];

    onMount(() => {
        const subjectsQuery = query(collection(db, "subjects"), orderBy("name", "asc"));
        const unsubscribeSubjects = onSnapshot(subjectsQuery.withConverter(converter<SubjectDocument>()), (snapshot) => {
            let subjectsSnapshot: SubjectDocumentFull[] = [];
            for (const doc of snapshot.docs) {
                subjectsSnapshot.push({ ...doc.data(), id: doc.id });
            }
            subjects = subjectsSnapshot;
        });

        return () => {
            unsubscribeSubjects();
        };
    });

    function clearFilters() {
        $searchQuery = "";
        $selectedSubject = "";
    }
</script>

<section>
    <div class="filters-container">
        <div class="input-group">
            <input type="text" bind:value={$searchQuery} placeholder="🔍 Wyszukaj tytuł podręcznika..." />
        </div>
        <div class="select-group">
            <select bind:value={$selectedSubject}>
                <option value="doonionsflyinaustralia?" disabled>-- Wybierz przedmiot --</option>
                <option value="" selected>Wszystkie przedmioty</option>
                {#each subjects as subject}
                    <option value={subject.name}>{subject.name}</option>
                {/each}
            </select>
            <div class="select-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 10l5 5 5-5z" />
                </svg>
            </div>
        </div>
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
        padding: 0.5rem 1rem;
        transition: padding 100ms;
    }

    .filters-container {
        width: min(100%, 800px);
        display: flex;
        gap: 0.75rem;
        align-items: stretch;
    }

    .input-group {
        flex: 4;
        min-width: 0;
    }

    .select-group {
        flex: 3;
        min-width: 180px;
        position: relative;
    }

    /* Base input and select styling */
    input,
    select {
        width: 100%;
        height: 60px;
        font-size: 1.2rem;
        background-color: var(--bg-primary);
        border: 2px solid var(--accent-secondary);
        outline: 0 solid var(--accent-primary);
        border-radius: 0.5rem;
        padding: 0 0.75rem;
        color: var(--font-light);
        transition:
            border-color 100ms,
            outline-width 50ms,
            font-size 100ms;
    }

    input:focus-visible,
    select:focus-visible {
        border-color: var(--accent-primary);
        outline-width: 2px;
    }

    /* Select specific styling */
    select {
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        padding-right: 2rem;
        cursor: pointer;
    }

    select option {
        background-color: var(--bg-secondary);
        color: var(--font-light);
        padding: 0.5rem;
        font-size: 1rem;
    }

    select option:disabled {
        color: var(--font-light-opaque);
    }

    /* Custom select arrow */
    .select-arrow {
        position: absolute;
        top: 50%;
        right: 0.75rem;
        transform: translateY(-50%);
        pointer-events: none;
        color: var(--font-light);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 100ms ease;
    }

    select:focus + .select-arrow {
        transform: translateY(-50%) rotate(180deg);
        color: var(--accent-primary);
    }

    /* Responsive design */
    @media screen and (max-width: 768px) {
        section {
            padding: 0.5rem;
        }

        .filters-container {
            flex-direction: column;
            gap: 0.5rem;
        }

        .input-group,
        .select-group {
            flex: none;
            min-width: unset;
        }

        input,
        select {
            height: 50px;
            font-size: 1rem;
        }
    }

    @media screen and (max-width: 500px) {
        .filters-container {
            gap: 0.375rem;
        }

        input,
        select {
            height: 45px;
            font-size: 0.95rem;
        }

        .select-arrow svg {
            width: 18px;
            height: 18px;
        }
    }
</style>
