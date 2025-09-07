<script lang="ts">
    import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
    import { onMount } from "svelte";
    import { db } from "../../firebaseConfig";
    import { textbookTitles, user, writingDisabled } from "../../stores";
    import type { SubjectDocument, SubjectDocumentFull, TitleDocument, TitleDocumentFull } from "../../types";
    import { converter } from "../../utils/converter";
    import { toast } from "../../utils/swal";

    let titles: TitleDocumentFull[] = [];
    let subjects: SubjectDocumentFull[] = [];
    let groupedTitles: { [subject: string]: TitleDocumentFull[] } = {};

    onMount(() => {
        const titlesQuery = query(collection(db, "titles"), orderBy("name", "asc"));
        const unsubscribeTitles = onSnapshot(titlesQuery.withConverter(converter<TitleDocument>()), (snapshot) => {
            let titlesSnapshot: TitleDocumentFull[] = [];
            let titleNames: typeof $textbookTitles = [];
            let grouped: { [subject: string]: TitleDocumentFull[] } = {};

            for (const doc of snapshot.docs) {
                const titleData = { ...doc.data(), id: doc.id };
                titlesSnapshot.push(titleData);
                titleNames.push({ name: doc.data().name, subject: doc.data().subject });

                // Group by subject
                if (!grouped[titleData.subject]) {
                    grouped[titleData.subject] = [];
                }
                grouped[titleData.subject].push(titleData);
            }

            titles = titlesSnapshot;
            groupedTitles = grouped;
            $textbookTitles = titleNames;
        });

        const subjectsQuery = query(collection(db, "subjects"), orderBy("name", "asc"));
        const unsubscribeSubjects = onSnapshot(subjectsQuery.withConverter(converter<SubjectDocument>()), (snapshot) => {
            let subjectsSnapshot: SubjectDocumentFull[] = [];
            for (const doc of snapshot.docs) {
                subjectsSnapshot.push({ ...doc.data(), id: doc.id });
            }
            subjects = subjectsSnapshot;
        });

        return () => {
            unsubscribeTitles();
            unsubscribeSubjects();
        };
    });

    let titleInput: HTMLInputElement;
    let subjectInput: HTMLInputElement;

    async function addTitle() {
        if ($user === null) return;
        if (titleInput.value.trim() === "") return toast.fire({ icon: "error", title: "Wprowadź tytuł podręcznika", timer: 2000 });
        if (subjectInput.value === "") return toast.fire({ icon: "error", title: "Wybierz przedmiot", timer: 2000 });
        const titleDocument: TitleDocument = {
            name: titleInput.value,
            subject: subjectInput.value,
            createdAt: serverTimestamp(),
            creator: {
                uid: $user.uid,
                email: $user.email,
            },
        };
        addDoc(collection(db, "titles"), titleDocument)
            .then(() => {
                toast.fire({ icon: "success", title: "Dodano podręcznik", timer: 1500 });
            })
            .catch((error) => {
                console.error("Error adding document: ", error);
                toast.fire({ icon: "error", title: "Błąd podczas dodawania podręcznika", timer: 2000 });
            });
        titleInput.value = "";
        subjectInput.value = "";
    }

    async function removeTitle(id: string) {
        await deleteDoc(doc(db, "titles", id));
    }
</script>

<aside>
    <h2>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" height="1em">
            <path
                d="M480 576L192 576C139 576 96 533 96 480L96 160C96 107 139 64 192 64L496 64C522.5 64 544 85.5 544 112L544 400C544 420.9 530.6 438.7 512 445.3L512 512C529.7 512 544 526.3 544 544C544 561.7 529.7 576 512 576L480 576zM192 448C174.3 448 160 462.3 160 480C160 497.7 174.3 512 192 512L448 512L448 448L192 448zM224 216C224 229.3 234.7 240 248 240L424 240C437.3 240 448 229.3 448 216C448 202.7 437.3 192 424 192L248 192C234.7 192 224 202.7 224 216zM248 288C234.7 288 224 298.7 224 312C224 325.3 234.7 336 248 336L424 336C437.3 336 448 325.3 448 312C448 298.7 437.3 288 424 288L248 288z"
            />
        </svg>Dodaj nowy podręcznik
    </h2>
    <form on:submit|preventDefault={addTitle}>
        <input type="text" bind:this={titleInput} placeholder="Tytuł..." />
        <input type="text" list="subjects" bind:this={subjectInput} placeholder="Przedmiot..." />
        <datalist id="subjects">
            {#each subjects as subject}
                <option value={subject.name}>{subject.name}</option>
            {/each}
        </datalist>
        <button class="btn btn-hover" disabled={$writingDisabled || null}>
            <svg xmlns="http://www.w3.org/2000/svg" height="1.25em" viewBox="0 0 448 512">
                <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
            </svg>
            Dodaj
        </button>
    </form>
    <section>
        {#each Object.keys(groupedTitles).sort() as subject}
            <div class="subject-group">
                <h3 class="subject-title">{subject}</h3>
                <div class="subject-textbooks">
                    {#each groupedTitles[subject] as title}
                        <div class="title-item">
                            <button on:click={() => removeTitle(title.id)} disabled={$writingDisabled || null} aria-label="Usuń tytuł">🗑️</button>
                            <span>{title.name}</span>
                        </div>
                    {/each}
                </div>
            </div>
        {/each}
    </section>
</aside>

<style>
    aside {
        display: flex;
        flex-direction: column;
        /* gap: 1rem; */
    }

    h2 {
        margin: 1rem 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    form {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
        margin-bottom: 1rem;
    }

    input {
        border: 2px solid var(--accent-primary);
        background-color: var(--bg-secondary);
        border-radius: 0.5rem;
        padding: 0.5rem 1rem;
    }

    form > button {
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
    }

    @media screen and (max-width: 1000px) {
        aside {
            align-items: center;
        }
        aside::before {
            content: "";
            width: 100%;
            height: 2px;
            border-radius: 2px;
            background-color: var(--accent-primary);
        }
        form {
            justify-content: center;
        }
        section {
            align-items: center !important;
        }
    }

    section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .subject-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
    }

    .subject-title {
        font-weight: 600;
        font-size: 1.1em;
        margin: 0;
        padding-bottom: 0.25rem;
        border-bottom: 1px solid var(--accent-primary);
    }

    .subject-textbooks {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin-left: 1rem;
    }

    .title-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .title-item button:hover ~ span {
        text-decoration: line-through;
    }
    .title-item button {
        background-color: transparent;
        border: none;
    }
</style>
