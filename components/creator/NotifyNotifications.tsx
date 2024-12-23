import {
	backendBaseUrl,
	getDisplayName,
	removeNotificationFromFirebase,
} from "@/lib/utils";
import { clientUser, creatorUser } from "@/types";
import axios from "axios";
import Image from "next/image";
import React, { useState } from "react";
import NotifyUserAlert from "../alerts/NotifyUserAlert";
import { useToast } from "../ui/use-toast";
import useServices from "@/hooks/useServices";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

const NotifyNotifications = ({
	removeNotification,
	creator,
	client,
}: {
	removeNotification: () => void;
	creator: creatorUser;
	client: clientUser;
}) => {
	const fullName = getDisplayName(client);
	const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
	const [actionType, setActionType] = useState<"notify" | "remove">("notify");
	const [loading, setLoading] = useState(false);
	const { services } = useServices();
	const {
		setPendingNotifications,
		setPreviousPendingNotifications,
		refreshCurrentUser,
	} = useCurrentUsersContext();
	const { toast } = useToast();

	const handleNotificationAction = (type: "notify" | "remove") => {
		if (type === "notify") {
			if (services.myServices && !services.isRestricted) {
				setActionType(type);
				setShowConfirmationDialog(true);
			} else {
				toast({
					title: "It seems you're offline at the moment.",
					description: "Enable a service to proceed.",
					toastStatus: "negative",
				});
			}
		} else {
			setActionType(type);
			setShowConfirmationDialog(true);
		}
	};

	const confirmNotificationAction = async () => {
		setLoading(true);
		try {
			const phoneNumber = client?.phone;
			const templateId = "flashutility";
			const fullNameCreator = getDisplayName(creator);
			const profileLink = `https://flashcall.me/${creator?.username}`;

			if (actionType === "notify") {
				try {
					await axios.post(`${backendBaseUrl}/user/notifyUser`, {
						recipientNumber: phoneNumber,
						recipientName: fullName,
						templateId,
						creatorImage:
							"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2Flogo_icon_dark.png?alt=media&token=8ee353a0-595c-4e62-9278-042c4869f3b7",
						creatorName: fullNameCreator,
						creatorProfile: profileLink,
					});

					axios.post(`${backendBaseUrl}/wallet/payout`, {
						userId: creator._id,
						userType: "Creator",
						amount: 1,
						category: "Notification",
					});
					refreshCurrentUser();
					removeNotification();
					removeNotificationFromFirebase(creator._id, client._id);

					setPendingNotifications((prev: number) => prev - 1);
					setPreviousPendingNotifications((prev: number) => prev - 1);

					await axios.delete(`${backendBaseUrl}/user/notification/remove`, {
						params: {
							creatorId: creator?._id,
							clientId: client?._id,
						},
					});

					toast({
						title: `Notification sent to ${fullName}`,
						toastStatus: "positive",
					});
				} catch (error) {
					console.error("Error notifying creator:", error);
					toast({
						title: `Unable to send notification to ${fullName}`,
						toastStatus: "negative",
					});
				}
			} else if (actionType === "remove") {
				try {
					removeNotification();
					removeNotificationFromFirebase(creator._id, client._id);

					setPendingNotifications((prev: number) => prev - 1);
					setPreviousPendingNotifications((prev: number) => prev - 1);

					await axios.delete(`${backendBaseUrl}/user/notification/remove`, {
						params: {
							creatorId: creator?._id,
							clientId: client?._id,
						},
					});
				} catch (error) {
					toast({
						title: `Unable to remove notification to ${fullName}`,
						toastStatus: "negative",
					});
					console.log("Error notifying creator:", error);
				}
			}
		} catch (error) {
			toast({
				title: `Unable to send notification to ${fullName}`,
				toastStatus: "negative",
			});
			console.error("Error while processing the notifying action:", error);
		} finally {
			setLoading(false);
			setShowConfirmationDialog(false);
		}
	};

	return (
		<>
			<div
				className="relative flex flex-col items-center justify-center rounded-xl w-full h-[202px] sm:h-64 md:h-80 cursor-pointer"
				onClick={() => handleNotificationAction("notify")}
			>
				<section className="aspect-square size-full absolute top-0 left-0 bg-slate-300 rounded-xl overflow-clip">
					<Image
						src={client?.photo}
						alt={fullName}
						width={1000}
						height={1000}
						className="size-full object-cover object-center rounded-xl"
						placeholder="blur"
						blurDataURL="/icons/blurryPlaceholder.png"
						priority
					/>
				</section>

				<button
					className="absolute top-0 right-0 rounded-tr-xl rounded-bl-xl bg-black/30 p-2 cursor-pointer hoverScaleDownEffect"
					onClick={(e) => {
						e.stopPropagation();
						handleNotificationAction("remove");
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="white"
						className="size-5"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M6 18 18 6M6 6l12 12"
						/>
					</svg>
				</button>

				<section className="size-full h-fit text-white flex flex-col items-start justify-start creatorsGirdHighlight">
					<p className="font-semibold text-base sm:text-2xl max-w-[90%] text-ellipsis whitespace-nowrap overflow-hidden">
						{fullName}
					</p>

					<section className="size-full flex items-center justify-between">
						<span className="text-sm sm:text-lg">Asked to get notified</span>
						<span className="text-white self-center h-full">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="size-5"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0M3.124 7.5A8.969 8.969 0 0 1 5.292 3m13.416 0a8.969 8.969 0 0 1 2.168 4.5"
								/>
							</svg>
						</span>
					</section>
				</section>
			</div>
			<NotifyUserAlert
				showDialog={showConfirmationDialog}
				setShowDialog={setShowConfirmationDialog}
				handleConfirmNotify={confirmNotificationAction}
				loading={loading}
				username={fullName}
				actionType={actionType}
			/>
		</>
	);
};

export default NotifyNotifications;
