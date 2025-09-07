<script lang="ts">
    import { addDoc, collection, Timestamp } from "firebase/firestore";
    import { db } from "../../firebaseConfig";
    import { lastBackup, writingDisabled } from "../../stores";
    import type { BackupDocument } from "../../types";
    import { fireErrorModal, modal, toast } from "../../utils/swal";

    async function backup() {
        const result = await modal.fire({
            title: "Czy chcesz wykonać kopię zapasową?",
            html: $lastBackup ? `Ostatnia kopia zapasowa została wykonana:<br><code>${$lastBackup?.createdAt.toDate().toLocaleString()} (${$lastBackup?.type ?? "unknown"})</code>` : "Nie wykonano jeszcze żadnej kopii zapasowej",
            confirmButtonText: "Wykonaj",
            icon: "question",
        });
        if (!result.isConfirmed) return;

        const backupDoc: BackupDocument = {
            createdAt: Timestamp.now(),
            status: "pending",
            type: "manual",
        };

        try {
            await addDoc(collection(db, "backups"), backupDoc);

            toast.fire({ title: "Zaplanowano kopię zapasową", icon: "success", timer: 2000 });
        } catch (err) {
            fireErrorModal(err, "Wystąpił błąd podczas planowania kopii zapasowej.");
        }
    }
</script>

<button on:click={backup} class="btn btn-hover" disabled={$writingDisabled || null} aria-label="Wykonaj kopię zapasową">
    <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 640 512">
        <path
            d="M144 480C64.5 480 0 415.5 0 336c0-62.8 40.2-116.2 96.2-135.9c-.1-2.7-.2-5.4-.2-8.1c0-88.4 71.6-160 160-160c59.3 0 111 32.2 138.7 80.2C409.9 102 428.3 96 448 96c53 0 96 43 96 96c0 12.2-2.3 23.8-6.4 34.6C596 238.4 640 290.1 640 352c0 70.7-57.3 128-128 128H144zm79-217c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l39-39V392c0 13.3 10.7 24 24 24s24-10.7 24-24V257.9l39 39c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-80-80c-9.4-9.4-24.6-9.4-33.9 0l-80 80z"
        />
    </svg>
</button>

<style>
    button {
        height: 100%;
        aspect-ratio: 1.25/1;
    }

    svg {
        height: 65%;
    }
</style>
