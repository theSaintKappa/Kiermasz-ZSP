<script lang="ts">
    import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
    import { onMount } from "svelte";
    import Swal from "sweetalert2";
    import face1 from "/condition1.svg";
    import face2 from "/condition2.svg";
    import face3 from "/condition3.svg";
    import face4 from "/condition4.svg";
    import { db } from "../../firebaseConfig";
    import { textbookTitles, user, writingDisabled } from "../../stores";
    import type { SellerDocumentFull, TextbookCondition, TextbookDocument, TextbookDocumentFull } from "../../types";
    import { converter } from "../../utils/converter";
    import { fireErrorModal, modal, toast } from "../../utils/swal";
    import AddNoteButton from "./AddNotesButton.svelte";
    import SellerCashOutButton from "./SellerCashOutButton.svelte";
    import TextbookItem from "./TextbookItem.svelte";

    export let seller: SellerDocumentFull;

    let textbooks: TextbookDocumentFull[] = [];
    let soldTextbooks: TextbookDocumentFull[] = [];
    let soldTextbooksSum = 0;
    let notes: SellerDocumentFull["notes"] = null;

    $: if (textbooks) soldTextbooks = textbooks.filter((textbook) => textbook.sold);
    $: if (soldTextbooks) soldTextbooksSum = soldTextbooks.reduce((acc, curr) => acc + curr.price, 0);
    $: notes = seller.notes;

    onMount(() => {
        const q = query(collection(db, "sellers", seller.id, "textbooks"), orderBy("sold"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q.withConverter(converter<TextbookDocument>()), (snapshot) => {
            let textbookDocuments: TextbookDocumentFull[] = [];
            for (const doc of snapshot.docs) {
                textbookDocuments.push({ ...doc.data(), id: doc.id });
            }
            textbooks = textbookDocuments;
        });

        return () => unsubscribe();
    });

    let detailsElement: HTMLDetailsElement;

    let titleOptions: string;
    $: titleOptions = $textbookTitles.map((title) => `<option value="${title.name}">${title.name}</option>`).join("");

    async function addTextbook() {
        await modal.fire({
            title: `Dodaj podręcznik\n<code>${seller.firstName} ${seller.lastName} ${seller.classSymbol}</code>`,
            html: `<form><input list="titles" class="swal2-input" placeholder="Nazwa" name="textbookTitle" data-form-type="other"><datalist id="titles">${titleOptions}</datalist><input type="number" class="swal2-input" placeholder="Cena" name="price" data-form-type="other"><fieldset class="condition-wrapper"><legend>Stan fizyczny</legend><label><input type="radio" name="condition" value="1" /><img src=${face1} alt="1" /></label><label><input type="radio" name="condition" value="2" /><img src=${face2} alt="2" /></label><label><input type="radio" name="condition" value="3" checked /><img src=${face3} alt="3" /></label><label><input type="radio" name="condition" value="4" /><img src=${face4} alt="4" /></label></fieldset></form>`,
            confirmButtonText: "Dodaj",
            didRender,
            preConfirm,
        });
    }

    async function preConfirm() {
        if ($user === null) return;
        const form = Swal.getPopup()?.querySelector("form");
        const title = (<HTMLInputElement>form?.textbookTitle).value;
        const price = Number.parseFloat((<HTMLInputElement>form?.price).value);
        const condition = <TextbookCondition>Number.parseInt((<HTMLInputElement>form?.condition).value);

        if (!title || !price || !condition) return Swal.showValidationMessage("Wypełnij wszystkie pola");

        const subject = $textbookTitles.find((t) => t.name === title)?.subject;
        if (!subject) return Swal.showValidationMessage("Nie znaleziono przedmiotu dla wybranego tytułu");

        const textbookDocument: TextbookDocument = {
            title,
            price,
            condition,
            subject,
            sold: false,
            soldAt: null,
            isLost: false,
            email: seller.email,
            reservation: { status: false, holder: null, expiry: null },
            creator: { uid: $user.uid, email: $user.email },
            parentId: seller.id,
            createdAt: serverTimestamp(),
        };

        try {
            await addDoc(collection(db, "sellers", seller.id, "textbooks"), textbookDocument);

            new Audio("/sounds/add-textbook.mp3").play();

            toast.fire({
                icon: "success",
                title: "Dodabno podręcznik",
                text: `${title} - ${price}zł`,
            });
        } catch (err) {
            return fireErrorModal(err, "Wystąpił błąd podczas dodawania podręcznika.");
        }

        detailsElement?.setAttribute("open", "");
    }

    function didRender() {
        const radios = Swal.getPopup()?.querySelectorAll('input[type="radio"]');
        const fieldset = Swal.getPopup()?.querySelector("fieldset");
        const colors = ["#ff3313", "#ffcd19", "#82ff28", "#ac00b8"];
        if (fieldset) fieldset.style.borderColor = colors[Number.parseInt((<HTMLInputElement>Swal.getPopup()?.querySelector('input[type="radio"]:checked')).value) - 1];
        for (const radio of radios as NodeListOf<HTMLInputElement>)
            radio.onchange = (e) => {
                if (fieldset) fieldset.style.borderColor = colors[Number.parseInt((<HTMLInputElement>e.target).value) - 1];
            };
    }
</script>

<details bind:this={detailsElement}>
    <summary>
        <div class="summary">
            <div>
                {seller.firstName}
                {seller.lastName}
                {seller.classSymbol ? `| ${seller.classSymbol}` : ""}
                {#if seller.hasCashedOut}
                    <span title="Wypłacono {soldTextbooksSum}zł">💰</span>
                {/if}
                <button on:click={addTextbook} class="btn-inline" aria-label="Dodaj podręcznik" disabled={$writingDisabled || null}>+ Dodaj</button>
            </div>
            {#if seller.notes}
                <span class="notes">📝 {seller.notes}</span>
            {/if}
        </div>
    </summary>
    <div class="textbook-list">
        {#if textbooks.length > 0}
            {#each textbooks as textbook}
                {#key textbook.id}
                    <TextbookItem {textbook} />
                {/key}
            {/each}
            <div class="list-summary">
                <span>Sprzedane: <strong>{soldTextbooks.length}</strong>/<strong>{textbooks.length}</strong></span>
                {#if !seller.hasCashedOut}
                    <span>Kwota do wypłaty: <strong>{soldTextbooksSum}</strong>zł</span>
                    <SellerCashOutButton {seller} {soldTextbooksSum} />
                    <AddNoteButton {seller} {notes} />
                {:else}
                    <span>Wypłacono: {soldTextbooksSum}zł</span>
                {/if}
            </div>
        {:else}
            <span class="textbook-list-empty">Brak podręczników</span>
            <div class="list-summary">
                <AddNoteButton {seller} {notes} />
            </div>
        {/if}
        <div class="details">
            {#if seller.email}
                <span>{seller.email}</span>
            {/if}
            <a href={`https://console.firebase.google.com/u/0/project/kiermasz-zstio-v2/firestore/databases/-default-/data/~2Fsellers~2F${seller.id}`} target="_blank" rel="noopener noreferrer">{seller.id}</a>
        </div>
    </div>
</details>

<style>
    details {
        background-color: var(--bg-secondary);
    }

    details:nth-child(2n) {
        background-color: var(--bg-primary);
    }

    summary {
        padding: 0.75rem 0 0.75rem 1rem;
    }

    .summary {
        display: inline-flex;
        flex-direction: column;
        margin-left: 0.15rem;
        max-width: calc(100% - 2rem);
    }

    .summary div {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .summary > div:first-child {
        font-weight: 500;
        cursor: pointer;
    }

    details:not([open]) summary::marker {
        color: var(--font-light-opaque);
    }

    .textbook-list {
        margin: 0.25rem 2rem 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .list-summary {
        margin: 0.25rem 0 0.25rem;
        display: flex;
        gap: 0.5rem;
    }
    .list-summary > span {
        font-style: italic;
        padding: 0.1rem 0.4rem;
        border-radius: 0.25rem;
        background-color: var(--accent-secondary);
        text-wrap: nowrap;
    }

    .details {
        display: flex;
        gap: 1rem;
    }
    .details span,
    .details a {
        font-size: 0.75rem;
        color: var(--font-light-opaque);
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }

    .textbook-list-empty {
        font-style: italic;
    }

    .notes {
        font-weight: 400;
        color: var(--font-light-opaque);
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        display: block;
    }
</style>
