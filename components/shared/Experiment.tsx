"use client";

import React, { useEffect, useState } from "react";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { MessagePayload, onMessage } from "firebase/messaging";
import { getFirebaseToken, messaging, udpateFCMtoken } from "@/lib/firebase";
import Link from "next/link";

interface NotificationPayloadProps {
	data?: MessagePayload | undefined;
	open: boolean;
}

const Experiment = () => {
	const [open, setOpen] = useState(false);
	const { currentUser } = useCurrentUsersContext();

	// To store notification data from firebase
	const [notificationPayload, setNotificationPayload] = useState<
		(NotificationPayloadProps | undefined)[]
	>([]);

	// This is self invoking function that listen of the notification
	const onMessageListener = (async () => {
		const messagingResolve = await messaging;
		if (messagingResolve) {
			onMessage(messagingResolve, (payload: MessagePayload) => {
				setNotificationPayload([{ data: payload, open: true }]);
				setTimeout(() => setNotificationPayload([{ open: false }]), 6000);
			});
		}
	})();

	const handleGetFirebaseToken = () => {
		getFirebaseToken().then((firebaseToken: string | undefined) => {
			if (firebaseToken) {
				udpateFCMtoken(currentUser?.phone as string, firebaseToken);
				console.log(firebaseToken);
			}
		});
	};

	// Need this handle FCM token generation when a user manually blocks or allows notification
	useEffect(() => {
		if (window.Notification?.permission === "granted") {
			handleGetFirebaseToken();
		}
	}, []);

	return (
		<section className="flex flex-col gap-5 items-center justify-center size-full">
			{/* Used to notify user whether he has provided notification permissions or not */}
			{Notification.permission !== "granted" && (
				<div className="notification-banner">
					<span>The app needs permission to</span>
					<Link
						href="#"
						className="bg-green-1 text-white px-7 py-5 rounded-xl hoverScaleDownEffect"
						onClick={handleGetFirebaseToken}
					>
						enable push notifications.
					</Link>
				</div>
			)}

			<img
				className="w-44 h-44 rounded-full object-cover"
				src={`/icons/logo_icon_dark.png`}
				alt="logo"
			/>
			<div>
				<button
					className="bg-green-1 text-white px-7 py-5 rounded-xl hoverScaleDownEffect"
					onClick={() => {
						setOpen(true);
						// To hide notification after 6 Seconds
						setTimeout(() => setOpen(false), 6000);
					}}
				>
					Show Web Push Notification
				</button>
			</div>

			{/* Rendering  Notification from firebase */}
			{notificationPayload.map((notification, index) => {
				return (
					<React.Fragment key={index}>
						{notification?.open && (
							<div className="absolute top-0 right-4 p-4 max-w-[30rem] min-w-[20rem] bg-green-1 text-white rounded-xl flex flex-col gap-5 items-start justify-center">
								<div className="flex w-full items-center justify-between">
									<h1>{notification?.data?.notification?.title}</h1>
									<button
										className="text-sm hover:opacity-80 size-7 rounded-full"
										onClick={() => setNotificationPayload([{ open: false }])}
									>
										X
									</button>
								</div>
								<div>
									<h1 className="push-notification-text">
										{notification?.data?.notification?.body}
									</h1>
								</div>
							</div>
						)}
					</React.Fragment>
				);
			})}

			{open && (
				<div
					className="absolute top-0 right-4 p-4 max-w-[30rem] min-w-[20rem] bg-green-1 text-white rounded-xl flex flex-col gap-5 items-start justify-center"
					onClick={() => {
						setOpen(false);
					}}
				>
					<div className="flex w-full items-center justify-between">
						<h2>New Message</h2>
						<button
							className="text-sm hover:opacity-80 size-7 rounded-full"
							onClick={() => {
								setOpen(false);
							}}
						>
							X
						</button>
					</div>
					<div>
						<h1 className="push-notification-text">
							Hello Welcome, This is an experiment to try out the new message
							triggering.
						</h1>
					</div>
				</div>
			)}
		</section>
	);
};

export default Experiment;
