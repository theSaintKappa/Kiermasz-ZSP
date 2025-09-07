<script lang="ts">
    import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
    import Swal from "sweetalert2";
    import { db, sendEmail } from "../../firebaseConfig";
    import { writingDisabled } from "../../stores";
    import { converter } from "../../utils/converter";
    import { fireErrorModal, modal, toast } from "../../utils/swal";

    export let textbook: TextbookDocumentFull;

    const textbookDoc = doc(db, "sellers", textbook.parentId, "textbooks", textbook.id);
    let expiryLocaleDateString: string | null = null;
    $: expiryLocaleDateString = textbook.reservation.expiry?.toDate().toLocaleDateString("pl", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) ?? null;

    let soldButton: HTMLButtonElement | null = null;

    async function getSellerData(): Promise<{ name: string; lastName: string } | null> {
        try {
            const sellerDoc = await getDoc(doc(db, "sellers", textbook.parentId).withConverter(converter<SellerDocument>()));
            if (sellerDoc.exists()) {
                const seller = sellerDoc.data();
                return { name: seller.firstName, lastName: seller.lastName };
            }
            return null;
        } catch (error) {
            console.error("Error fetching seller:", error);
            return null;
        }
    }

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
            await updateDoc(textbookDoc, { sold: true, soldAt: serverTimestamp(), "reservation.status": false });

            new Audio("/sounds/set-sold.mp3").play();

            toast.fire({ icon: "success", title: `Oznaczono podręcznik <strong>${textbook.title}</strong> jako sprzedany!`, timer: 2000 });
        } catch (err) {
            return fireErrorModal(err, "Wystąpił błąd podczas oznaczania podręcznika jako sprzedany.");
        }

        if (textbook.email) {
            const sellerData = await getSellerData();
            const allTextbooks = await getAllSellerTextbooks();

            if (sellerData && allTextbooks.length > 0) {
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
                            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
                            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
                            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                            .header h1 { margin: 0; font-size: 28px; font-weight: 900; }
                            .content { padding: 30px; }
                            .sold-notification { background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
                            .sold-notification h2 { color: #155724; margin: 0 0 10px 0; font-size: 20px; }
                            .sold-notification p { color: #155724; margin: 5px 0; }
                            .section { margin: 25px 0; }
                            .section h3 { color: #495057; border-bottom: 2px solid #e9ecef; padding-bottom: 10px; margin-bottom: 15px; }
                            .textbook-list { background: #f8f9fa; border-radius: 6px; padding: 15px; margin: 10px 0; }
                            .textbook-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #dee2e6; }
                            .textbook-item:last-child { border-bottom: none; }
                            .textbook-title { font-weight: 500; flex: 1; }
                            .textbook-price { font-weight: bold; color: #28a745; margin-left: 10px; }
                            .stats { display: flex; justify-content: space-between; background: #e9ecef; border-radius: 6px; padding: 15px; margin: 15px 0; }
                            .stat-item { text-align: center; }
                            .stat-number { font-size: 24px; font-weight: bold; color: #495057; }
                            .stat-label { font-size: 12px; color: #6c757d; text-transform: uppercase; }
                            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
                            .empty-list { text-align: center; color: #6c757d; font-style: italic; padding: 20px; }
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
                                    <h2>🎉 Gratulacje! Twój podręcznik został sprzedany!</h2>
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
                                    <div class="stat-item">
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
                                    <p style="margin-top: 15px; color: #6c757d; font-size: 14px;">
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
</script>

<span class:sold={textbook.sold} class:reserved={textbook.reservation.status && !textbook.sold} class="textbook">
    <span class:crossed-out={textbook.sold}>{textbook.title}</span>
    <div class="price">{textbook.price}zł</div>
    {#if !textbook.sold}
        <div class="buttons">
            <button on:dblclick={updateStatus} bind:this={soldButton} disabled={$writingDisabled || null} aria-label="Oznacz jako sprzedany">Sprzedane</button>
            {#if !textbook.reservation.status}
                <button on:click={createReservation} disabled={$writingDisabled || null} aria-label="Dodaj rezerwację">Rezerwacja</button>
            {/if}
        </div>
        {#if textbook.reservation.status}
            {#if textbook.reservation.expiry}
                <span class="info"><strong>{textbook.reservation.holder}</strong> do <code>{new Date(textbook.reservation.expiry.toMillis()).toLocaleDateString()}</code></span>
            {/if}
        {/if}
    {:else if textbook.soldAt}
        <span class="info">{new Date(textbook.soldAt.toMillis()).toLocaleString()}</span>
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
</style>
