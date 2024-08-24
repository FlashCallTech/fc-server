import admin from "firebase-admin";
import { Message } from "firebase-admin/messaging";
import { NextRequest, NextResponse } from "next/server";

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
	const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || "";
	let serviceAccount;

	try {
		// Decode the base64-encoded string to get the JSON string
		const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
		// Parse the JSON string to an object
		serviceAccount = JSON.parse(serviceAccountJson);
	} catch (error) {
		console.error('Error decoding or parsing the service account:', error);
	}

	try {
		if (serviceAccount) {
			admin.initializeApp({
				credential: admin.credential.cert(serviceAccount),
			});
		} else {
			throw new Error('Service account is not valid.');
		}
	} catch (error) {
		console.error('Error initializing Firebase Admin SDK:', error);
	}
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
		return NextResponse.json({ success: false, error });
	}
}
