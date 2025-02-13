"use client";
import React, { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

import {
	backendBaseUrl,
	fetchExchangeRate,
	formatDisplay,
	frontendBaseUrl,
	getDisplayName,
	getImageSource,
	updatePastFirestoreSessions,
} from "@/lib/utils";
import { AvailabilityService, creatorUser, Service } from "@/types";
import Image from "next/image";
import { Button } from "../ui/button";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import * as Sentry from "@sentry/nextjs";
import { useToast } from "../ui/use-toast";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import axios from "axios";
import useScheduledPayment from "@/hooks/useScheduledPayment";
import { useSelectedServiceContext } from "@/lib/context/SelectedServiceContext";
import { collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Timestamp } from "firebase/firestore"; // Import Timestamp
import { useRouter } from "next/navigation";
import { Input } from "../ui/input";

interface params {
	service: AvailabilityService;
	creator: creatorUser;
	selectedDay: string;
	selectedTimeSlot: string;
	setShowConsentForm: any;
	themeColor: string;
	toggleSchedulingSheet: (isOpen: boolean) => void;
}

const AvailabilityFinalConsentForm = ({
	service,
	creator,
	selectedDay,
	selectedTimeSlot,
	setShowConsentForm,
	themeColor,
	toggleSchedulingSheet,
}: params) => {
	const [isDiscountUtilized, setIsDiscountUtilized] = useState(false);
	const [payUsingWallet, setPayUsingWallet] = useState(true);
	const [isSuccess, setIsSuccess] = useState(false);
	const [isPaymentHandlerSuccess, setIsPaymentHandlerSuccess] = useState(false);
	const [payoutTransactionId, setPayoutTransactionId] = useState();
	const { clientUser, refreshCurrentUser } = useCurrentUsersContext();
	const [email, setEmail] = useState(clientUser?.email || "");
	const [emailChanged, setEmailChanged] = useState(false);
	const [emailError, setEmailError] = useState("");

	const {
		getFinalServices,
		selectedService,
		resetServices,
		getSpecificServiceOffer,
	} = useSelectedServiceContext();
	const { walletBalance, updateWalletBalance } = useWalletBalanceContext();
	const [totalAmount, setTotalAmount] = useState<{
		total: string;
		currency: string;
	}>({
		total: service.basePrice.toFixed(2),
		currency: service.currency,
	});
	const applicableDiscounts = getFinalServices();
	const { pgHandler } = useScheduledPayment();

	const [preparingTransaction, setPreparingTransaction] = useState(false);
	const { toast } = useToast();
	const client = useStreamVideoClient();
	const imageSrc = getImageSource(creator);
	const fullName = getDisplayName(creator);
	const router = useRouter();

	let formattedData = formatDisplay(
		selectedDay,
		selectedTimeSlot,
		service.timeDuration
	);

	let customDateValue = formattedData.day.split(", ")[1].split(" ") ?? "";

	const chatRef = collection(db, "chats");
	const scheduledChatsRef = collection(db, "scheduledChats");
	const DEFAULT_IMAGE_URL: string =
		"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2Flogo_icon_dark.png?alt=media&token=8ee353a0-595c-4e62-9278-042c4869f3b7";

	useEffect(() => {
		service.discountRules &&
			service.discountRules.conditions.length > 0 &&
			!service.utilizedBy.some(
				(clientId) => clientId.toString() === clientUser?._id.toString()
			) &&
			!(
				service.discountRules.discountType === "flat" &&
				service.discountRules.discountAmount > service.basePrice
			) &&
			setIsDiscountUtilized(true);

		const updateTotal = async () => {
			const { total, currency } = await calculateTotal();
			setTotalAmount({ total, currency });
		};

		updateTotal();
	}, [service._id]);

	function maskPhoneNumber(phoneNumber: string) {
		if (phoneNumber) {
			let cleanedNumber = phoneNumber.replace("+91", "");

			let maskedNumber =
				cleanedNumber.substring(0, 2) + "*****" + cleanedNumber.substring(7);

			return maskedNumber;
		}
	}

	const createEvent = async (callDetails: {
		email: string | undefined;
		location: string;
		title: string;
		description: string;
		startTime: string;
		endTime: string;
		attendees: string[];
	}) => {
		try {
			if (!callDetails.email) return;

			await axios.post(
				`${backendBaseUrl}/calendar/add-event`,
				{
					email: callDetails.email,
					title: callDetails.title,
					description: callDetails.description,
					location,
					startTime: callDetails.startTime,
					endTime: callDetails.endTime,
					attendees: callDetails.attendees,
				},
				{
					withCredentials: true,
					headers: {
						"Content-Type": "application/json",
					},
				}
			);
		} catch (error: any) {
			console.error(
				"Error creating event:",
				error.response?.data || error.message
			);
		}
	};

	const handlePayPal = async (amountToPay: number): Promise<boolean> => {
		return new Promise((resolve) => {
			const paypal = (window as any).paypal;
			if (paypal) {
				paypal
					.Buttons({
						async createOrder(data: any, actions: any) {
							try {
								return await actions.order.create({
									purchase_units: [
										{
											amount: {
												currency_code: "USD",
												value: amountToPay,
											},
										},
									],
									application_context: {
										shipping_preference: "NO_SHIPPING",
									},
								});
							} catch (error) {
								console.error("PayPal order creation error:", error);
								resolve(false);
							}
						},
						async onApprove(data: any, actions: any) {
							try {
								const details = await actions.order.capture();
								if (details.status === "COMPLETED") {
									console.log("PayPal payment successful:", details);
									resolve(true);
								} else {
									resolve(false);
								}
							} catch (error) {
								console.error("PayPal capture error:", error);
								resolve(false);
							}
						},
						onCancel(data: any) {
							console.warn("PayPal payment canceled:", data);
							resolve(false);
						},
						onError(err: any) {
							console.error("PayPal payment error:", err);
							resolve(false);
						},
					})
					.render("#paypal-button-container");
			} else {
				console.error("PayPal SDK not loaded");
				resolve(false);
			}
		});
	};

	const calculateTotal = async () => {
		let { basePrice, discountRules, currency } = service;
		let total = basePrice;

		// Apply Discount
		if (discountRules && isDiscountUtilized) {
			const { discountAmount, discountType } = discountRules;

			if (discountType === "percentage") {
				total -= (basePrice * discountAmount) / 100;
			} else if (discountType === "flat" && total >= discountAmount) {
				total -= discountAmount;
			} else {
				setIsDiscountUtilized(false);
			}
		}

		// applicable global discounts
		if (applicableDiscounts && applicableDiscounts.length > 0) {
			applicableDiscounts.forEach((discount) => {
				discount.discountRules.forEach(({ discountAmount, discountType }) => {
					if (discountType === "percentage") {
						total -= (basePrice * discountAmount) / 100;
					} else if (discountType === "flat" && total >= discountAmount) {
						total -= discountAmount;
					}
				});
			});

			setIsDiscountUtilized(true);
		}

		// Platform Fee
		const platformFee = 0;
		total += platformFee;

		// Currency Conversion
		if (currency === "USD") {
			const exchangeRate = await fetchExchangeRate();
			total = total * exchangeRate;
			currency = "INR";
		}

		return { total: total.toFixed(2), currency };
	};

	const createMeeting = async () => {
		if (!client || !clientUser) throw new Error("Invalid data provided.");
		try {
			const id = crypto.randomUUID();
			const call =
				service.type === "video"
					? client.call("default", id)
					: service.type === "audio" && client.call("audio_room", id);

			if (!call) throw new Error("Failed to create meeting.");

			const members = [
				{
					user_id: creator?._id,
					custom: {
						name: fullName,
						type: "expert",
						image: creator.photo || DEFAULT_IMAGE_URL,
						phone: creator.phone,
						email: creator.email || "",
					},
					role: "admin",
				},
				{
					user_id: clientUser?._id,
					custom: {
						name: clientUser.username || "Flashcall Client",
						type: "client",
						image: clientUser.photo || DEFAULT_IMAGE_URL,
						phone: clientUser.phone,
						email:
							email ||
							clientUser?.email ||
							(localStorage.getItem("google_email") as string),
					},
					role: "admin",
				},
			];

			const dateTimeString = `${selectedDay} ${selectedTimeSlot}`;

			const parsedDate = new Date(dateTimeString);

			if (isNaN(parsedDate.getTime())) {
				throw new Error("Invalid date or time format");
			}

			const startsAt = parsedDate.toISOString();
			const startsAtDate = new Date(parsedDate.toISOString());
			const endsAt = new Date(
				startsAtDate.getTime() + service.timeDuration * 60000
			).toISOString();

			const description = `${
				service.type === "video"
					? `Scheduled Video Call With Expert ${creator.username}`
					: `Scheduled Audio Call With Expert ${creator.username}`
			}`;

			await call.getOrCreate({
				members_limit: 2,
				data: {
					starts_at: startsAt,
					members: members,
					custom: {
						description,
						global: clientUser?.global ?? false,
						duration: service.timeDuration * 60,
						type: "scheduled",
						serviceId: service._id,
						startsAt: startsAt,
					},
					settings_override: {
						limits: {
							max_participants: 2,
							max_duration_seconds: service.timeDuration * 60,
						},
					},
				},
			});

			return {
				callId: call.id,
				startsAt: startsAt,
				endsAt: endsAt,
				duration: service.timeDuration,
				meetingOwner: clientUser?._id,
				description: description,
				members: members,
				chatId: null,
			};
		} catch (error) {
			Sentry.captureException(error);
			console.error(error);
			toast({
				variant: "destructive",
				title: "Failed to create Meeting.",
				toastStatus: "negative",
			});
		}
	};

	const createUpcomingChat = async () => {
		if (!client || !clientUser)
			throw new Error("Client or client user is missing.");

		try {
			const callId = crypto.randomUUID();

			// Create chat members
			const members = [
				{
					user_id: creator?._id,
					custom: {
						name: creator?.fullName || "Expert",
						type: "expert",
						image: creator?.photo || DEFAULT_IMAGE_URL,
						phone: creator?.phone,
						email: creator?.email,
					},
					role: "admin",
				},
				{
					user_id: clientUser?._id,
					custom: {
						name: clientUser?.username || "Flashcall Client",
						type: "client",
						image: clientUser?.photo || DEFAULT_IMAGE_URL,
						phone: clientUser?.phone,
						email:
							email ||
							clientUser?.email ||
							(localStorage.getItem("google_email") as string),
					},
					role: "admin",
				},
			];

			// Parse start time
			const dateTimeString = `${selectedDay} ${selectedTimeSlot}`;
			const startsAt = new Date(dateTimeString).toISOString();
			const startsAtDate = new Date(startsAt);
			const endsAt = new Date(
				startsAtDate.getTime() + service.timeDuration * 60000
			).toISOString();

			if (!startsAt || isNaN(new Date(startsAt).getTime())) {
				throw new Error("Invalid date or time format.");
			}

			const description = `Scheduled Chat With Expert ${
				creator?.username || "Unknown"
			}`;

			// Firestore document references
			const userChatsDocRef = doc(db, "userchats", clientUser?._id);
			const creatorChatsDocRef = doc(db, "userchats", creator?._id);

			// Fetch Firestore documents
			const [userChatsDocSnapshot, creatorChatsDocSnapshot] = await Promise.all(
				[getDoc(userChatsDocRef), getDoc(creatorChatsDocRef)]
			);

			let chatId;

			// Check if a chat already exists
			if (userChatsDocSnapshot.exists() && creatorChatsDocSnapshot.exists()) {
				const userChatsData = userChatsDocSnapshot.data();
				const creatorChatsData = creatorChatsDocSnapshot.data();

				const existingChat =
					userChatsData?.chats.find(
						(chat: any) => chat.receiverId === creator?._id
					) &&
					creatorChatsData?.chats.find(
						(chat: any) => chat.receiverId === clientUser?._id
					);

				chatId = existingChat?.chatId || doc(chatRef).id;
			} else {
				// Initialize Firestore documents if they don't exist
				await Promise.all([
					setDoc(userChatsDocRef, { isTyping: false }, { merge: true }),
					setDoc(creatorChatsDocRef, { isTyping: false }, { merge: true }),
				]);
				chatId = doc(chatRef).id;
			}

			// Prepare discounts
			const discounts = getSpecificServiceOffer("chat");

			// Create the scheduled chat
			await setDoc(doc(db, "scheduledChats", callId), {
				callId,
				chatId,
				creatorId: creator?._id,
				creatorName:
					creator?.fullName || maskPhoneNumber(creator?.phone as string),
				creatorPhone: creator?.phone,
				creatorImg: creator?.photo,
				clientId: clientUser?._id,
				clientPhone: clientUser?.phone || "",
				clientName:
					clientUser?.fullName || maskPhoneNumber(clientUser?.phone as string),
				clientImg: clientUser?.photo,
				client_balance: clientUser?.walletBalance,
				global: clientUser?.global || false,
				totalAmount: service.basePrice,
				paidAmount: Number(totalAmount.total),
				paid: false,
				maxDuration: service.timeDuration,
				clientJoined: false,
				creatorJoined: false,
				startTime: Timestamp.fromDate(new Date(startsAt)), // Use Timestamp here
				status: "upcoming",
				discounts: (discounts as Service) ?? null,
			});

			return {
				callId,
				startsAt,
				endsAt,
				duration: service.timeDuration,
				meetingOwner: clientUser?._id,
				description,
				members,
				chatId,
			};
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error creating scheduled chat: ", error);

			toast({
				variant: "destructive",
				title: "Failed to create chat",
				toastStatus: "negative",
			});
		}
	};

	const handlePaySchedule = async () => {
		setPreparingTransaction(true);
		try {
			if (emailChanged) {
				await axios.put(
					`${backendBaseUrl}/client/updateUser/${clientUser?._id}`,
					{
						email: email,
					}
				);
			}

			let amountToPay = parseFloat(totalAmount.total);
			let walletPaymentAmount = 0;

			// Wallet Payment Logic
			if (payUsingWallet) {
				if (walletBalance < amountToPay) {
					walletPaymentAmount = walletBalance;
					amountToPay -= walletPaymentAmount;
				} else {
					walletPaymentAmount = amountToPay;
					amountToPay = 0;
				}

				if (walletPaymentAmount > 0) {
					const walletUpdatePayload = {
						userId: clientUser?._id,
						userType: "Client",
						amount: walletPaymentAmount,
						transactionType: "credit",
					};

					let walletUpdateResponse = await axios.post(
						`${backendBaseUrl}/wallet/temporary/update`,
						walletUpdatePayload
					);

					if (walletUpdateResponse.status !== 200) {
						throw new Error("Failed to update wallet balance");
					}
				}
			}

			if (amountToPay > 0) {
				let paymentSuccess = false;

				if (clientUser?.global) {
					paymentSuccess = await handlePayPal(amountToPay);
				} else {
					await pgHandler(
						clientUser?._id as string,
						amountToPay,
						clientUser?.phone,
						setIsPaymentHandlerSuccess
					);

					await new Promise((resolve) => setTimeout(resolve, 500));
					paymentSuccess = isPaymentHandlerSuccess;
				}

				if (!paymentSuccess) {
					if (walletPaymentAmount > 0) {
						await axios.post(`${backendBaseUrl}/wallet/temporary/update`, {
							userId: clientUser?._id,
							userType: "Client",
							amount: walletPaymentAmount,
							transactionType: "debit",
						});
					}

					toast({
						variant: "destructive",
						title: "Payment Failed",
						description: "Your payment could not be processed.",
						toastStatus: "negative",
					});
					return;
				}
			}

			// Step 1: Attempt to create a meeting
			let callDetails;
			if (service.type === "audio" || service.type === "video") {
				callDetails = await createMeeting();
			} else {
				callDetails = await createUpcomingChat();
			}

			if (!callDetails) {
				throw new Error("Failed to create meeting");
			}

			// Step 2: Register the scheduled call
			const registerUpcomingCallAPI = "/calls/scheduled/createCall";
			const registerUpcomingCallPayload = {
				callId: callDetails.callId,
				chatId: callDetails.chatId,
				serviceTitle: service.title,
				type: service.type,
				status: "upcoming",
				meetingOwner: callDetails.meetingOwner,
				expert: creator?._id,
				description: callDetails.description,
				selectedDay: selectedDay,
				selectedSlot: selectedTimeSlot,
				startsAt: callDetails.startsAt,
				duration: callDetails.duration,
				amount: totalAmount.total,
				currency: totalAmount.currency,
				discounts: applicableDiscounts,
			};

			let registerCallResponse = await axios.post(
				`${backendBaseUrl}${registerUpcomingCallAPI}`,
				registerUpcomingCallPayload
			);

			if (
				registerCallResponse.status === 200 ||
				registerCallResponse.status === 201
			) {
				const response = await axios.post(`${backendBaseUrl}/wallet/payout`, {
					userId: clientUser?._id as string,
					user2Id: creator._id,
					userType: "Client",
					amount: totalAmount.total,
					callCategory: "Scheduled",
					callType: service.type,
				});

				if (service.type === "chat") {
					await updateDoc(doc(db, "scheduledChats", callDetails.callId), {
						payoutTransactionId: response.data.result._id,
					});
				}

				await fetch(`${backendBaseUrl}/calls/registerCall`, {
					method: "POST",
					body: JSON.stringify({
						callId: callDetails.callId as string,
						serviceTitle: service.title,
						type: service.type as string,
						category: "Scheduled",
						status: "Scheduled",
						creator: String(clientUser?._id),
						members: callDetails.members,
						payoutTransactionId,
					}),
					headers: { "Content-Type": "application/json" },
				});

				if (service.type !== "chat") {
					await updatePastFirestoreSessions(callDetails.callId as string, {
						callId: callDetails.callId,
						status: "initiated",
						startsAt: callDetails.startsAt,
						endsAt: callDetails.endsAt,
						callType: "scheduled",
						clientId: clientUser?._id as string,
						expertId: creator._id,
						isVideoCall: service.type,
						creatorPhone: creator.phone,
						clientPhone: clientUser?.global
							? clientUser?.email
							: clientUser?.phone,
						global: clientUser?.global ?? false,
					});
				}

				isDiscountUtilized &&
					(await axios.put(`${backendBaseUrl}/availability/${service._id}`, {
						clientId: callDetails.meetingOwner || clientUser?._id,
					}));

				if (selectedService && (callDetails.meetingOwner || clientUser?._id)) {
					await axios.put(`${backendBaseUrl}/services/${selectedService._id}`, {
						clientId: callDetails.meetingOwner || clientUser?._id,
					});

					resetServices();
				}

				updateWalletBalance();

				setIsSuccess(true);

				localStorage.removeItem("hasVisitedFeedbackPage");

				const attendees = callDetails?.members
					?.map((member) => member.custom.email)
					.filter((email): email is string => Boolean(email))
					.filter((value, index, self) => self.indexOf(value) === index);

				createEvent({
					email: creator?.email,
					location: `${frontendBaseUrl}/meeting/${callDetails.callId}`,
					title: service.title,
					description: callDetails.description,
					startTime: callDetails.startsAt,
					endTime: callDetails.endsAt,
					attendees,
				});

				setTimeout(() => {
					emailChanged && refreshCurrentUser();
					toast({
						variant: "destructive",
						title: `Meeting scheduled on ${formattedData.day} from ${formattedData.timeRange}`,
						toastStatus: "positive",
					});

					router.push("/upcoming");
				}, 2000);
			} else {
				throw new Error("Failed to register the call");
			}
		} catch (error: any) {
			console.error(error);
			if (error.message.includes("Failed to register the call")) {
				try {
					await axios.post(`${backendBaseUrl}/wallet/temporary/update`, {
						userId: clientUser?._id,
						userType: "Client",
						amount: parseFloat(totalAmount.total),
						transactionType: "debit",
					});
					toast({
						variant: "destructive",
						title: "Transaction rolled back due to an error",
						toastStatus: "negative",
					});
				} catch (rollbackError) {
					console.error(
						"Failed to rollback wallet transaction:",
						rollbackError
					);
				}
			}

			toast({
				variant: "destructive",
				title: "Failed to schedule the call",
				toastStatus: "negative",
			});
		} finally {
			setPreparingTransaction(false);
		}
	};

	const getServiceIcon = (service: string) => {
		switch (service) {
			case "video":
				return (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="size-4"
					>
						<path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
					</svg>
				);
			case "audio":
				return (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="size-4"
					>
						<path
							fillRule="evenodd"
							d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
							clipRule="evenodd"
						/>
					</svg>
				);
			case "chat":
				return (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="size-4"
					>
						<path
							fillRule="evenodd"
							d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97ZM6.75 8.25a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H7.5Z"
							clipRule="evenodd"
						/>
					</svg>
				);
		}
	};

	const validateEmail = (email: string) => {
		// Regular expression for simple email validation
		const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (!email) {
			setEmailError("Email is required.");
			return false;
		}

		if (!emailPattern.test(email)) {
			setEmailError("Please enter a valid email address.");
			return false;
		}

		setEmailError("");
		setEmailChanged(true);
		return true;
	};

	const handleEmailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const newEmail = e.target.value;
		setEmail(newEmail);
		validateEmail(newEmail);
	};

	useEffect(() => {
		const savedEmail = clientUser?.email;
		if (savedEmail) {
			setEmail(savedEmail);
		}
	}, []);

	return (
		<>
			{!isSuccess ? (
				<div
					className={`relative size-full flex flex-col items-start overflow-y-scroll no-scrollbar scroll-smooth`}
				>
					<section className="w-full flex items-center gap-4 px-4 pt-2">
						<button
							onClick={() => setShowConsentForm(false)}
							className="text-xl font-bold hoverScaleDownEffect"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={2}
								stroke="currentColor"
								className="size-5 cursor-pointer hoverScaleDownEffect"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
								/>
							</svg>
						</button>
						<section className="flex items-center justify-start gap-2.5">
							<Image
								src={imageSrc}
								alt={creator?.firstName || creator?.username}
								width={300}
								height={300}
								quality={75}
								className="w-12 h-12 object-cover rounded-full p-1"
								placeholder="blur"
								blurDataURL="/icons/blurryPlaceholder.png"
								priority
							/>

							<span className="font-bold">{fullName}</span>
						</section>
					</section>

					<hr className="col-span-full w-full border-t-2 border-[#E5E7EB] my-2" />
					<div className="w-full flex flex-col px-4 items-start justify-start gap-2.5  mt-2">
						<span className="font-bold text-2xl">{service.title}</span>
						<span className="flex items-center gap-2 text-sm capitalize">
							{getServiceIcon(service.type)}
							{service.type} {service.type === "chat" ? "Service" : "Call"} |{" "}
							{service.timeDuration}mins
						</span>
					</div>

					<div className="size-full flex flex-1 flex-col px-4 items-start justify-start gap-2.5 mt-2">
						<div className="w-full flex items-center justify-center p-4 border-2 border-[#E5E7EB] rounded-xl mt-4">
							<section className="w-full flex flex-wrap items-center justify-between">
								<div className="flex items-center justify-center gap-2.5">
									<section className="bg-black/10 size-16 flex flex-col items-center justify-center border border-[#E5E7EB] rounded-lg">
										<p className="w-full text-center px-2.5 font-bold text-sm uppercase">
											{customDateValue[0]}
										</p>
										<span className="font-bold text-lg">
											{customDateValue[1]}
										</span>
									</section>

									<section className="flex flex-col items-start justify-start">
										<span className="font-bold">{formattedData.day}</span>
										<div className="flex flex-col items-start justify-start">
											<span className="text-sm">{formattedData.timeRange}</span>
											<span className="text-xs">{formattedData.timezone}</span>
										</div>
									</section>
								</div>
								<Button
									className={`font-medium rounded-full px-2 w-fit min-w-[80px] min-h-[36px] text-[15px] border border-black text-black flex items-center justify-center hoverScaleDownEffect`}
									onClick={() => setShowConsentForm(false)}
									disabled={preparingTransaction}
								>
									<span className="py-2.5 text-sm font-semibold">Change</span>
								</Button>
							</section>
						</div>

						{/* Order Summary Section */}
						<div className="mt-4 w-full">
							<h4 className="text-xl font-bold text-gray-800 mb-2.5">
								Order Summary
							</h4>
							<div className="border-2 border-[#E5E7EB] rounded-lg p-4 pt-5  w-full flex flex-col items-start justify-start gap-2.5">
								<section className="w-full pb-2.5 flex justify-between text-sm text-gray-800">
									<p>1 x {service.title}</p>
									<p className="font-bold">
										{service.currency === "INR" ? "₹" : "$"} {service.basePrice}
									</p>
								</section>

								{isDiscountUtilized && service.discountRules && (
									<section
										className={`${
											service.discountRules.discountType === "flat" &&
											service.basePrice <
												service.discountRules.discountAmount &&
											"hidden"
										} w-full pb-2.5 flex items-center justify-between text-sm text-gray-800`}
									>
										<>
											<div className="flex items-center gap-1 bg-[#F0FDF4] text-[#16A34A] px-2.5 py-1 rounded-full">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
													className="size-4"
												>
													<path
														fillRule="evenodd"
														d="M5.25 2.25a3 3 0 0 0-3 3v4.318a3 3 0 0 0 .879 2.121l9.58 9.581c.92.92 2.39 1.186 3.548.428a18.849 18.849 0 0 0 5.441-5.44c.758-1.16.492-2.629-.428-3.548l-9.58-9.581a3 3 0 0 0-2.122-.879H5.25ZM6.375 7.5a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z"
														clipRule="evenodd"
													/>
												</svg>
												<p className="ml-1 text-xs">Additional</p>
												<p className="text-xs whitespace-nowrap">
													<span className="text-sm">
														{service.discountRules.discountType === "percentage"
															? `${service.discountRules.discountAmount}%`
															: `${service.currency === "INR" ? "₹" : "$"} ${
																	service.discountRules.discountAmount
															  }`}{" "}
														OFF Applied
													</span>
												</p>
											</div>
											<p className="text-green-1 font-bold">
												- {service.currency === "INR" ? "₹" : "$"}{" "}
												{service.discountRules.discountType === "percentage"
													? (
															(service.basePrice *
																service.discountRules.discountAmount) /
															100
													  ).toFixed(2)
													: service.discountRules.discountAmount.toFixed(2)}
											</p>
										</>
									</section>
								)}

								{applicableDiscounts &&
									applicableDiscounts.length > 0 &&
									applicableDiscounts.map((discount) =>
										discount.discountRules.map(
											({ discountAmount, discountType }) => {
												const isFlatDiscountInvalid =
													discountType === "flat" &&
													service.basePrice < discountAmount;

												if (isFlatDiscountInvalid) {
													return null;
												}

												return (
													<section
														key={`${discountType}-${discountAmount}`}
														className="w-full pb-2.5 flex items-center justify-between text-sm text-gray-800"
													>
														<div className="flex items-center gap-1 bg-[#F0FDF4] text-[#16A34A] px-2.5 py-1 rounded-full">
															<svg
																xmlns="http://www.w3.org/2000/svg"
																viewBox="0 0 24 24"
																fill="currentColor"
																className="size-4"
															>
																<path
																	fillRule="evenodd"
																	d="M5.25 2.25a3 3 0 0 0-3 3v4.318a3 3 0 0 0 .879 2.121l9.58 9.581c.92.92 2.39 1.186 3.548.428a18.849 18.849 0 0 0 5.441-5.44c.758-1.16.492-2.629-.428-3.548l-9.58-9.581a3 3 0 0 0-2.122-.879H5.25ZM6.375 7.5a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z"
																	clipRule="evenodd"
																/>
															</svg>
															<p className="text-xs whitespace-nowrap">
																<span className="text-sm ml-1">
																	{discountType === "percentage"
																		? `${discountAmount}%`
																		: `${
																				service.currency === "INR" ? "₹" : "$"
																		  } ${discountAmount}`}{" "}
																	OFF Applied
																</span>
															</p>
														</div>
														<p className="text-green-1 font-bold">
															- {service.currency === "INR" ? "₹" : "$"}{" "}
															{discountType === "percentage"
																? (
																		(service.basePrice * discountAmount) /
																		100
																  ).toFixed(2)
																: discountAmount.toFixed(2)}
														</p>
													</section>
												);
											}
										)
									)}

								<div className="border-t border-[#E5E7EB] w-full" />

								<section className="w-full flex items-center justify-between font-bold text-gray-800 pt-2">
									<p>Service Total</p>
									<span className="text-lg">
										{totalAmount.currency === "INR" ? "₹" : "$"}{" "}
										{totalAmount.total}
									</span>
								</section>
							</div>
						</div>

						{/* wallet balance section */}
						<div className="mt-4 w-full">
							<h4 className="text-xl font-bold text-gray-800 mb-2.5">
								Wallet Balance
							</h4>
							<div className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl">
								<div className="flex flex-row-reverse items-center flex-wrap justify-between gap-4">
									<div className="flex flex-col items-start justify-start">
										<p className="text-gray-900 text-xl font-bold">
											{!clientUser?.global ? "₹" : "$"}{" "}
											{walletBalance.toFixed(2)}
										</p>
									</div>

									<div className="flex items-center space-x-2">
										<Checkbox
											id="wallet"
											checked={payUsingWallet}
											onCheckedChange={() => setPayUsingWallet(!payUsingWallet)}
											className={`${
												payUsingWallet && "bg-green-500 text-white"
											} border border-gray-400 size-[20px] p-0.5 rounded-[6px]`}
										/>
										<label
											htmlFor="terms"
											className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
										>
											Use wallet balance
										</label>
									</div>
								</div>
							</div>
						</div>

						{/*user email*/}
						<div className="mt-4 w-full">
							<div className="mb-2">
								<h4 className="text-xl font-bold text-gray-800 mb-2.5">
									Email Address <span className="text-red-500">*</span>
								</h4>
								<p className="text-sm text-gray-500">
									We need your email so that creator can invite you for the
									scheduled session.
								</p>
							</div>
							<Input
								type="email"
								placeholder="Enter your email"
								value={email}
								onChange={handleEmailChange}
								className="w-full border border-gray-300 !min-h-[54px]"
							/>

							{/* Email Validation Feedback */}
							{emailError && (
								<p className="text-sm text-red-500 mt-2">{emailError}</p>
							)}
						</div>
					</div>

					{/* Payment Confirmation */}
					<div className="flex items-center justify-center bg-white mt-4 size-full h-fit sticky bottom-0 border-t border-[#E5E7EB] py-2.5">
						<div className="w-full px-4 flex flex-col items-center justify-center gap-2">
							{payUsingWallet &&
								parseFloat(totalAmount.total) > walletBalance && (
									<div className="w-full flex items-center justify-between">
										<span className="text-sm text-[#4B5563]">
											Amount to Pay
										</span>
										<span className="text-gray-900 text-lg font-bold">
											{`₹ ${(
												parseFloat(totalAmount.total) -
												(payUsingWallet ? walletBalance : 0)
											).toFixed(2)}`}
										</span>
									</div>
								)}
							<Button
								className="text-base bg-black hoverScaleDownEffect w-full mx-auto text-white rounded-full self-center"
								type="submit"
								onClick={handlePaySchedule}
								disabled={!!emailError || preparingTransaction}
							>
								{preparingTransaction ? (
									<Image
										src="/icons/loading-circle.svg"
										alt="Loading..."
										width={1000}
										height={1000}
										className="size-6"
										priority
									/>
								) : (
									<span className="text-sm">
										{`Pay ₹ ${
											parseFloat(totalAmount.total) > walletBalance
												? (
														parseFloat(totalAmount.total) -
														(payUsingWallet ? walletBalance : 0)
												  ).toFixed(2)
												: parseFloat(totalAmount.total).toFixed(2)
										}`}
									</span>
								)}
							</Button>
						</div>
					</div>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center min-w-full h-full gap-4 py-5 px-4">
					<Image
						src="/images/success.png"
						alt="success"
						height={150}
						width={150}
						className="size-[150px]"
					/>
					<span className="font-semibold text-lg">
						Meeting scheduled for {formattedData.day}
					</span>
				</div>
			)}
		</>
	);
};

export default AvailabilityFinalConsentForm;
