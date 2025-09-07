import { v1 } from "@google-cloud/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { setGlobalOptions } from "firebase-functions";
import * as logger from "firebase-functions/logger";
import { defineInt, defineString, projectID } from "firebase-functions/params";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { createTransport } from "nodemailer";

interface TextbookDocument {
    sold: boolean;
    soldAt: Timestamp;
    reservation: {
        status: boolean;
        holder: string;
        expiry: Timestamp;
    };
}
interface Backup {
    createdAt: Timestamp;
    status: "pending" | "complete" | "failed";
    type: "scheduled" | "manual";
}

const region = "europe-central2";
const timeZone = "Europe/Warsaw";

setGlobalOptions({ maxInstances: 10 });

initializeApp();
const db = getFirestore();

const client = new v1.FirestoreAdminClient();

const smtpHost = defineString("SMTP_HOST");
const smtpPort = defineInt("SMTP_PORT");
const smtpUser = defineString("SMTP_USER");
const smtpPassword = defineString("SMTP_PASSWORD");
const bucketName = defineString("BUCKET_NAME");

export const sendEmail = onCall({ region }, async (request) => {
    if (!request.auth) throw new HttpsError("failed-precondition", "The function must be called while authenticated.");
    if (!request.data.to || !request.data.subject || !request.data.html) throw new HttpsError("invalid-argument", "Missing required parameters.");

    const transporter = createTransport({ host: smtpHost.value(), port: smtpPort.value(), secure: true, auth: { user: smtpUser.value(), pass: smtpPassword.value() } });

    const { to, subject, html } = request.data;
    await transporter.sendMail({ from: '"Kiermasz ZSTiO 📚" <kiermasz@mechaniktg.pl>', to, subject, html });
});

export const cancelReservation = onDocumentUpdated({ document: "sellers/{sellerId}/textbooks/{textbookId}", region }, async (event) => {
    const before = <TextbookDocument>event.data?.before.data();
    const after = <TextbookDocument>event.data?.after.data();

    if (before.reservation.status && !after.reservation.status) return event.data?.after.ref.set({ reservation: { holder: null, expiry: null } }, { merge: true });

    return null;
});

export const updateSoldAt = onDocumentUpdated({ document: "sellers/{sellerId}/textbooks/{textbookId}", region }, async (event) => {
    const before = <TextbookDocument>event.data?.before.data();
    const after = <TextbookDocument>event.data?.after.data();

    if (before.sold && !after.sold) return event.data?.after.ref.set({ soldAt: null }, { merge: true });

    if (!before.sold && after.sold && !after.soldAt) return event.data?.after.ref.set({ soldAt: Timestamp.now(), reservation: { status: false } }, { merge: true });

    return null;
});

export const reservationCleanup = onSchedule({ schedule: "0 0 * * *", timeZone, region }, async () => {
    const snapshot = await db.collectionGroup("textbooks").where("reservation.expiry", "<=", Timestamp.now()).get();

    for (const doc of snapshot.docs) {
        await doc.ref.set({ reservation: { status: false } }, { merge: true });
        logger.log(`Reservation for ${(<TextbookDocument>doc.data()).reservation.holder} has been cancelled.`);
    }
});

// At minute 0 past every hour from 8 through 16 and 0 on every day-of-week from Monday through Friday.
export const scheduleBackup = onSchedule({ schedule: "0 8-16,0 * * 1-5", timeZone, region }, async () => {
    await db.collection("backups").add({ createdAt: Timestamp.now(), status: "pending", type: "scheduled" });
});

export const performBackup = onDocumentCreated({ document: "backups/{backupId}", region }, async (event) => {
    const document = <Backup>event.data?.data();
    if (!document.createdAt) event.data?.ref.set({ createdAt: Timestamp.now() }, { merge: true });
    if (document.status !== "pending") await event.data?.ref.set({ status: "pending" }, { merge: true });

    const projectId = projectID.value();
    const name = client.databasePath(projectId ?? "", "(default)");
    const outputUriPrefix = `${bucketName.value()}/${Timestamp.now().toDate().toISOString()}`;

    try {
        const responses = await client.exportDocuments({ name, outputUriPrefix, collectionIds: ["sellers", "textbooks"] });
        event.data?.ref.set({ status: "complete" }, { merge: true });
        logger.info("Export operation triggered: ", responses[0]?.name);
    } catch (err) {
        event.data?.ref.set({ status: "failed" }, { merge: true });
        logger.error("Export operation failed: ", err);
    }
});
