<script lang="ts">
    import { addDoc, collection, serverTimestamp } from "firebase/firestore";
    import { onMount } from "svelte";
    import Swal from "sweetalert2";
    import { db } from "../../firebaseConfig";
    import { user, writingDisabled } from "../../stores";
    import type { SellerDataForm, SellerDocument } from "../../types";
    import { fireErrorModal, modal, toast } from "../../utils/swal";

    async function addSeller() {
        if (!$user) return;
        const form = await modal.fire({
            title: "Dodaj nowego sprzedawcę",
            html: `<form><input class="swal2-input" placeholder="Imię" name="firstName" data-form-type="other"><input class="swal2-input" placeholder="Nazwisko" name="lastName" data-form-type="other"><input class="swal2-input" placeholder="Klasa" name="classSymbol" data-form-type="other"><input class="swal2-input" placeholder="Email" name="email" data-form-type="other"></form>`,
            confirmButtonText: "Dodaj",
            preConfirm: async () => {
                const form = Swal.getPopup()?.querySelector("form");
                const firstName = (<HTMLInputElement>form?.firstName).value;
                const lastName = (<HTMLInputElement>form?.lastName).value;
                const classSymbol = (<HTMLInputElement>form?.classSymbol).value;
                const email = (<HTMLInputElement>form?.email).value || null;

                if (!firstName || !lastName || !classSymbol) return Swal.showValidationMessage("Wypełnij wszystkie pola");
                if (email && !/[\w-.]+@([\w-]+\.)+[\w-]{2,4}/.test(email)) return Swal.showValidationMessage("Niepoprawny adres email");

                return { firstName, lastName, classSymbol, email };
            },
        });
        if (!form.isConfirmed) return;

        const { firstName, lastName, classSymbol, email } = <SellerDataForm>form.value;
        const sellerDoc: SellerDocument = {
            firstName,
            lastName,
            classSymbol,
            email,
            hasCashedOut: false,
            creator: { uid: $user.uid, email: $user.email },
            notes: null,
            createdAt: serverTimestamp(),
        };
        try {
            await addDoc(collection(db, "sellers"), sellerDoc);

            toast.fire({
                icon: "success",
                title: "Dodabno sprzedawcę",
                text: `${firstName} ${lastName} ${classSymbol}`,
            });

            new Audio("/sounds/add-seller.mp3").play();
        } catch (err) {
            return fireErrorModal(err, "Wystąpił błąd podczas dodawania sprzedawcy.");
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        // Add seller with Cmd + Enter (or Ctrl + Enter on non-Mac)
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && !Swal.getPopup()) {
            event.preventDefault();
            addSeller();
        }
    }

    onMount(() => {
        document.addEventListener("keydown", handleKeydown);
        return () => {
            document.removeEventListener("keydown", handleKeydown);
        };
    });
</script>

<button on:click={addSeller} class="btn btn-hover" aria-label="Dodaj nowego sprzedawcę" disabled={$writingDisabled || null}>
    <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 640 512">
        <path
            d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM504 312V248H440c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V136c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H552v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"
        />
    </svg>
    Dodaj Sprzedawcę
</button>

<style>
    button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: clamp(1rem, 4vw, 1.25rem);
        font-weight: 900;
        transition: background-color 75ms ease;
    }

    svg {
        flex-shrink: 0;
        width: unset;
    }
</style>
