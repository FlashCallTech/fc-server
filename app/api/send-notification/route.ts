import admin from "firebase-admin";
import { Message } from "firebase-admin/messaging";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
	const serviceAccount = {
		project_id: process.env.FIREBASE_PROJECT_ID || "",
		private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "",
		private_key: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
		client_email: process.env.FIREBASE_CLIENT_EMAIL || "",
		client_id: process.env.FIREBASE_CLIENT_ID || "",
		client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL || "",
	} as admin.ServiceAccount;

	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
	});
}

export async function POST(request: NextRequest) {
	const { token, title, message, link } = await request.json();

	const payload: Message = {
		token,
		notification: {
			title: title,
			body: message,
		},
		webpush: link && {
			fcmOptions: {
				link,
			},
		},
	};

	try {
		await admin.messaging().send(payload);

		return NextResponse.json({ success: true, message: "Notification sent!" });
	} catch (error) {
		Sentry.captureException(error);
		return NextResponse.json({ success: false, error });
	}
}
