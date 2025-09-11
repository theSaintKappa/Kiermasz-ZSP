<script lang="ts">
    import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
    import Swal from "sweetalert2";
    import { db, sendEmail } from "../../firebaseConfig";
    import { writingDisabled } from "../../stores";
    import type { SellerDocument, TextbookDocument, TextbookDocumentFull } from "../../types";
    import { converter } from "../../utils/converter";
    import { fireErrorModal, modal, toast } from "../../utils/swal";

    export let textbook: TextbookDocumentFull;

    const textbookDoc = doc(db, "sellers", textbook.parentId, "textbooks", textbook.id);
    let expiryLocaleDateString: string | null = null;
    $: expiryLocaleDateString = textbook.reservation.expiry?.toDate().toLocaleDateString("pl", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) ?? null;

    let soldButton: HTMLButtonElement | null = null;

    async function getAllSellerTextbooks(): Promise<TextbookDocumentFull[]> {
        try {
            const textbooksQuery = query(collection(db, "sellers", textbook.parentId, "textbooks"), orderBy("title"));
            const snapshot = await getDocs(textbooksQuery.withConverter(converter<TextbookDocument>()));
            return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        } catch (error) {
            console.error("Error fetching seller textbooks:", error);
            return [];
        }
    }

    function formatCurrency(amount: number): string {
        return `${amount}zł`;
    }

    async function updateStatus() {
        if (soldButton?.disabled) return;

        if (textbook.reservation.status) {
            const result = await modal.fire({
                icon: "warning",
                title: "Czy jesteś pewien?",
                html: `Podręcznik "<code>${textbook.title}</code>" jest zarezerwowany do:<br><code>${expiryLocaleDateString}</code> przez <strong>${textbook.reservation.holder}</strong>.<br><br><hr><br><i>Czy chcesz usunąć rezerwację i oznaczyć podręcznik jako sprzedany?</i>`,
                confirmButtonText: "Tak, usuń rezerwację",
                focusCancel: true,
            });
            if (!result.isConfirmed) return;
        }

        try {
            await updateDoc(textbookDoc, { sold: true, soldAt: serverTimestamp(), "reservation.status": false, isLost: false });

            new Audio("/sounds/set-sold.mp3").play();

            toast.fire({ icon: "success", title: `Oznaczono podręcznik <strong>${textbook.title}</strong> jako sprzedany!`, timer: 2000 });
        } catch (err) {
            return fireErrorModal(err, "Wystąpił błąd podczas oznaczania podręcznika jako sprzedany.");
        }

        if (textbook.email) {
            const allTextbooks = await getAllSellerTextbooks();

            if (allTextbooks.length > 0) {
                const soldTextbooks = allTextbooks.filter((t) => t.sold);
                const unsoldTextbooks = allTextbooks.filter((t) => !t.sold);
                const totalSoldValue = soldTextbooks.reduce((sum, t) => sum + t.price, 0);
                const totalUnsoldValue = unsoldTextbooks.reduce((sum, t) => sum + t.price, 0);

                const currentDate = new Date().toLocaleDateString("pl", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });

                const emailHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 10px; background-color: #f5f5f5; }
                            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
                            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
                            .header h1 { margin: 0 0 5px 0; font-size: 28px; font-weight: 900; }
                            .header p { margin: 0; }
                            .content { padding: 20px; }
                            .sold-notification { background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
                            .sold-notification h2 { color: #155724; margin: 0 0 8px 0; font-size: 20px; }
                            .sold-notification p { color: #155724; margin: 4px 0; }
                            .section { margin: 18px 0; }
                            .section h3 { color: #495057; border-bottom: 2px solid #e9ecef; padding-bottom: 8px; margin-bottom: 12px; }
                            .textbook-list { background: #f8f9fa; border-radius: 6px; padding: 12px; margin: 8px 0; }
                            .textbook-item { display: table; width: 100%; padding: 8px 0; border-bottom: 1px solid #dee2e6; }
                            .textbook-item:last-child { border-bottom: none; }
                            .textbook-title { display: table-cell; font-weight: 500; vertical-align: middle; }
                            .textbook-price { display: table-cell; font-weight: bold; color: #28a745; text-align: right; width: 80px; vertical-align: middle; }
                            .stats { background: #e9ecef; border-radius: 6px; padding: 12px; margin: 12px 0; text-align: center; }
                            .stat-item { display: inline-block; width: 30%; margin: 0 1.5%; vertical-align: top; }
                            .stat-item-single { display: inline-block; width: 40%; vertical-align: top; }
                            .stat-number { font-size: 24px; font-weight: bold; color: #495057; display: block; }
                            .stat-label { font-size: 12px; color: #6c757d; text-transform: uppercase; display: block; }
                            .footer { background: #f8f9fa; padding: 15px; text-align: center; color: #6c757d; font-size: 14px; }
                            .empty-list { text-align: center; color: #6c757d; font-style: italic; padding: 15px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>📚 Kiermasz ZSTiO</h1>
                                <p>Powiadomienie o sprzedaży</p>
                            </div>
                            
                            <div class="content">
                                <div class="sold-notification">
                                    <h2>🎉 Twój podręcznik został sprzedany!</h2>
                                    <p><strong>"${textbook.title}"</strong> został kupiony za <strong>${formatCurrency(textbook.price)}</strong></p>
                                    <p><small>Data sprzedaży: ${currentDate}</small></p>
                                </div>

                                <div class="stats">
                                    <div class="stat-item">
                                        <div class="stat-number">${soldTextbooks.length}</div>
                                        <div class="stat-label">Sprzedane</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-number">${unsoldTextbooks.length}</div>
                                        <div class="stat-label">Do sprzedania</div>
                                    </div>
                                </div>
                                
                                <div class="stats" style="margin-top: 8px;">
                                    <div class="stat-item-single">
                                        <div class="stat-number">${formatCurrency(totalSoldValue)}</div>
                                        <div class="stat-label">Zarobiłeś</div>
                                    </div>
                                </div>

                                ${
                                    soldTextbooks.length > 0
                                        ? `
                                <div class="section">
                                    <h3>✅ Sprzedane podręczniki (${soldTextbooks.length})</h3>
                                    <div class="textbook-list">
                                        ${soldTextbooks
                                            .map(
                                                (t) => `
                                            <div class="textbook-item">
                                                <span class="textbook-title">${t.title}</span>
                                                <span class="textbook-price">${formatCurrency(t.price)}</span>
                                            </div>
                                        `
                                            )
                                            .join("")}
                                    </div>
                                </div>
                                `
                                        : ""
                                }

                                ${
                                    unsoldTextbooks.length > 0
                                        ? `
                                <div class="section">
                                    <h3>⏳ Pozostałe podręczniki (${unsoldTextbooks.length})</h3>
                                    <div class="textbook-list">
                                        ${unsoldTextbooks
                                            .map(
                                                (t) => `
                                            <div class="textbook-item">
                                                <span class="textbook-title">${t.title}</span>
                                                <span class="textbook-price">${formatCurrency(t.price)}</span>
                                            </div>
                                        `
                                            )
                                            .join("")}
                                    </div>
                                    <p style="margin-top: 12px; color: #6c757d; font-size: 14px;">
                                        Potencjalny zysk z pozostałych podręczników: <strong>${formatCurrency(totalUnsoldValue)}</strong>
                                    </p>
                                </div>
                                `
                                        : '<div class="empty-list">🎉 Wszystkie Twoje podręczniki zostały sprzedane!</div>'
                                }
                            </div>
                            
                            <div class="footer">
                                <p><strong>Biblioteka ZSTiO</strong></p>
                                <p>Dziękujemy za uczestnictwo w kiermaszu!</p>
                                <p>W razie pytań skontaktuj się z nami: <a href="mailto:kiermasz@mechaniktg.pl">kiermasz@mechaniktg.pl</a></p>
                            </div>
                        </div>
                    </body>
                    </html>
                `;

                sendEmail({
                    to: textbook.email,
                    subject: `🎉 Podręcznik "${textbook.title}" został sprzedany!`,
                    html: emailHtml,
                });
            }
        }
    }

    async function markAsUnsold() {
        const result = await modal.fire({
            icon: "warning",
            title: "Czy jesteś pewien?",
            html: `Czy chcesz oznaczyć podręcznik "<code>${textbook.title}</code>" jako niesprzedany?<br><br><i>Ta akcja cofnie sprzedaż podręcznika.</i>`,
            confirmButtonText: "Tak, oznacz jako niesprzedany",
            cancelButtonText: "Anuluj",
            showCancelButton: true,
            focusCancel: true,
        });

        if (!result.isConfirmed) return;

        try {
            await updateDoc(textbookDoc, { sold: false, soldAt: null });

            toast.fire({
                icon: "success",
                title: `Oznaczono podręcznik <strong>${textbook.title}</strong> jako niesprzedany!`,
                timer: 2000,
            });
        } catch (err) {
            return fireErrorModal(err, "Wystąpił błąd podczas oznaczania podręcznika jako niesprzedany.");
        }
    }

    async function createReservation() {
        const form = await modal.fire({
            title: `Zarezerwuj <strong>${textbook.title}</strong>\n(do końca dnia)`,
            html: `<form><input class="swal2-input" placeholder="Rezerwacja dla" name="holder" data-form-type="other"><input type="date" class="swal2-input" placeholder="Rezerwacja do" name="expiry" data-form-type="other"></form>`,
            confirmButtonText: "Zarezerwuj",
            preConfirm: async () => {
                const form = Swal.getPopup()?.querySelector("form");
                const holder = (<HTMLInputElement>form?.holder).value;
                const expiry = (<HTMLInputElement>form?.expiry).value;

                if (!holder || !expiry) return Swal.showValidationMessage("Wypełnij wszystkie pola.");

                const expiryDate = new Date(expiry);
                expiryDate.setHours(23, 59, 59);
                if (expiryDate.getTime() <= Date.now()) return Swal.showValidationMessage("Wybierz datę w przyszłości.");

                return { holder, expiry: expiryDate };
            },
        });

        if (!form.isConfirmed) return;

        const { holder, expiry } = <{ holder: string; expiry: Date }>form.value;

        try {
            await updateDoc(textbookDoc, { reservation: { status: true, holder, expiry } });

            toast.fire({ icon: "success", title: `Zarezerwowano <strong>${textbook.title}</strong> do <code>${expiryLocaleDateString}</code> dla <strong>${textbook.reservation.holder}</strong>` });
        } catch (err) {
            fireErrorModal(err, "Wystąpił błąd podczas tworzenia rezerwacji.");
        }
    }

    async function markAsLost() {
        const result = await modal.fire({
            icon: "warning",
            title: "Czy jesteś pewien?",
            html: `Czy chcesz oznaczyć podręcznik "<code>${textbook.title}</code>" jako zgubiony?`,
            confirmButtonText: "Tak, oznacz jako zgubiony",
            cancelButtonText: "Anuluj",
            showCancelButton: true,
            focusCancel: true,
        });

        if (!result.isConfirmed) return;

        try {
            await updateDoc(textbookDoc, { isLost: true });

            toast.fire({
                icon: "success",
                title: `Oznaczono podręcznik <strong>${textbook.title}</strong> jako zgubiony.`,
                timer: 2000,
            });
        } catch (err) {
            return fireErrorModal(err, "Wystąpił błąd podczas oznaczania podręcznika jako zgubiony.");
        }
    }
</script>

<span class:sold={textbook.sold} class:reserved={textbook.reservation.status && !textbook.sold} class="textbook">
    {#if textbook.isLost}
        <strong class:lost={textbook.isLost}>Brak na stanie❗</strong>
    {/if}
    <div class:crossed-out={textbook.sold || textbook.isLost} class:lost={textbook.isLost}>
        {textbook.title}
    </div>
    <div class="price">{textbook.price}zł</div>
    {#if !textbook.sold}
        <div class="buttons">
            <button on:dblclick={updateStatus} bind:this={soldButton} disabled={$writingDisabled || null} aria-label="Oznacz jako sprzedany" class="sold-btn">Sprzedane</button>
            {#if !textbook.reservation.status}
                <button on:click={createReservation} disabled={$writingDisabled || null} aria-label="Dodaj rezerwację" class="reservation-btn">Rezerwacja</button>
            {/if}
            {#if !textbook.sold && !textbook.isLost}
                <button on:click={markAsLost} disabled={$writingDisabled || null} aria-label="Oznacz jako zgubiony" class="lost-btn">Zgubiony</button>
            {/if}
        </div>
        {#if textbook.reservation.status}
            {#if textbook.reservation.expiry}
                <span class="info"><strong>{textbook.reservation.holder}</strong> do <code>{new Date(textbook.reservation.expiry.toMillis()).toLocaleDateString()}</code></span>
            {/if}
        {/if}
    {:else if textbook.soldAt}
        <span class="info">{new Date(textbook.soldAt.toMillis()).toLocaleString()}</span>
        <div class="buttons">
            <button on:click={markAsUnsold} disabled={$writingDisabled || null} aria-label="Oznacz jako niesprzedany" class="error-button">Błąd?</button>
        </div>
    {/if}
</span>

<style>
    .sold {
        font-style: italic;
        color: var(--font-light-opaque);
    }
    .crossed-out {
        text-decoration: line-through;
        opacity: 0.75;
    }
    .reserved {
        color: var(--warning-color);
    }
    .reserved::before {
        content: "🔒";
        margin-right: 0.25rem;
    }
    .lost {
        color: var(--lost-color);
    }
    .sold-btn::before,
    .sold-btn:hover::before {
        background-color: var(--success-color);
    }
    .reservation-btn::before,
    .reservation-btn:hover::before {
        background-color: var(--warning-color);
    }
    .lost-btn::before,
    .lost-btn:hover::before {
        background-color: var(--lost-color);
    }
    .info {
        margin-left: 0.5rem;
        font-size: 0.8rem;
        font-weight: 600;
    }

    .textbook {
        display: flex;
        align-items: center;
        position: relative;
    }
    .textbook::after {
        content: "";
        position: absolute;
        width: 2px;
        top: 0;
        height: 100%;
        background-color: white;
    }
    .textbook:last-of-type::after {
        height: 50%;
    }
    .textbook.reserved::after {
        background-color: var(--warning-color);
    }
    .textbook.sold::after {
        background-color: var(--font-light-opaque);
    }
    .textbook::before {
        content: "";
        height: 2px;
        width: 25px;
        margin-right: 0.25rem;
        background-color: white;
    }
    .textbook.reserved::before {
        background-color: var(--warning-color);
    }
    .textbook.sold::before {
        background-color: var(--font-light-opaque);
    }

    .price {
        background-color: var(--price-color);
        font-weight: 800;
        border-radius: 0.25rem;
        padding: 0 0.3rem;
        margin-left: 0.5rem;
    }

    .buttons {
        display: flex;
        gap: 1rem;
        margin-inline: 1rem;
    }

    button {
        font-weight: 600;
        background-color: transparent;
        border: none;
        position: relative;
        z-index: 0;
    }

    button::before {
        content: "";
        position: absolute;
        width: 105%;
        height: 15%;
        bottom: 1px;
        left: 50%;
        transform: translateX(-50%);
        z-index: -1;

        background-color: var(--accent-primary);
        transition: 100ms;
    }

    button:hover::before {
        background-color: var(--accent-secondary);
        height: 30%;
    }

    .error-button::before,
    .error-button:hover::before {
        background-color: var(--error-color);
    }
</style>
