"use client";
import React, { useEffect, useState } from "react";
import {
	backendBaseUrl,
	fetchExchangeRate,
	formatDisplay,
	getDisplayName,
	getImageSource,
} from "@/lib/utils";
import { AvailabilityService, creatorUser } from "@/types";
import Image from "next/image";
import ClientSideDiscountCard from "./ClientSideDiscountCard";
import { Button } from "../ui/button";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import * as Sentry from "@sentry/nextjs";
import { useToast } from "../ui/use-toast";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import axios from "axios";
import { success } from "@/constants/icons";

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
	const [isDiscountSelected, setIsDiscountSelected] = useState(false);
	const [showDiscountCards, setShowDiscountCards] = useState(false);
	const [showInfo, setShowInfo] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const { clientUser } = useCurrentUsersContext();
	const { walletBalance, updateWalletBalance } = useWalletBalanceContext();
	const [totalAmount, setTotalAmount] = useState<{
		total: string;
		currency: string;
	}>({
		total: service.basePrice.toFixed(2),
		currency: service.currency,
	});
	const [preparingTransaction, setPreparingTransaction] = useState(false);
	const { toast } = useToast();
	const client = useStreamVideoClient();
	const imageSrc = getImageSource(creator);
	const fullName = getDisplayName(creator);

	let formattedData = formatDisplay(
		selectedDay,
		selectedTimeSlot,
		service.timeDuration
	);

	let customDateValue = formattedData.day.split(", ")[1].split(" ") ?? "";

	useEffect(() => {
		const updateTotal = async () => {
			const { total, currency } = await calculateTotal();
			setTotalAmount({ total, currency });
		};
		updateTotal();
	}, [isDiscountSelected]);

	const calculateTotal = async () => {
		let { basePrice, discountRules, currency } = service;
		let total = basePrice;

		// Apply Discount
		if (isDiscountSelected && discountRules) {
			const { discountAmount, discountType } = discountRules;

			if (discountType === "percentage") {
				total -= (basePrice * discountAmount) / 100;
			} else if (discountType === "flat") {
				total -= discountAmount;
			}
		}

		// Add Platform Fee
		const platformFee = 10;
		total += platformFee;

		// Currency Conversion if required
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
						image:
							creator.photo ||
							"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2Flogo_icon_dark.png?alt=media&token=8ee353a0-595c-4e62-9278-042c4869f3b7",
						phone: creator.phone,
					},
					role: "admin",
				},
				{
					user_id: clientUser?._id,
					custom: {
						name: clientUser.username || "Flashcall Client",
						type: "client",
						image:
							clientUser.photo ||
							"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2Flogo_icon_dark.png?alt=media&token=8ee353a0-595c-4e62-9278-042c4869f3b7",
						phone: clientUser.phone,
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
						duration: service.timeDuration,
						type: "scheduled",
					},
					settings_override: {
						limits: {
							max_participants: 2,
						},
					},
				},
			});

			toast({
				variant: "destructive",
				title: `Meeting scheduled on ${customDateValue} from ${formattedData.timeRange}`,
				toastStatus: "positive",
			});

			return {
				callId: call.id,
				startsAt: startsAt,
				duration: service.timeDuration,
				meetingOwner: clientUser?._id,
				description: description,
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

	const handlePaySchedule = async () => {
		setPreparingTransaction(true);
		try {
			// Step 1: Check if wallet balance is sufficient
			if (walletBalance < parseFloat(totalAmount.total)) {
				toast({
					variant: "destructive",
					title: "Insufficient Wallet Balance",
					toastStatus: "negative",
				});
				return;
			}

			// Step 2: Attempt to create a meeting
			let callDetails = await createMeeting();
			if (!callDetails) {
				throw new Error("Failed to create meeting");
			}

			// Step 3: Deduct wallet balance if the meeting was created
			const walletUpdateAPI = "/wallet/temporary/update";
			const walletUpdatePayload = {
				userId: clientUser?._id,
				userType: "client",
				amount: parseFloat(totalAmount.total),
				transactionType: "credit",
			};

			let walletUpdateResponse = await axios.post(
				`${backendBaseUrl}${walletUpdateAPI}`,
				walletUpdatePayload
			);

			if (walletUpdateResponse.status !== 200) {
				throw new Error("Failed to update wallet balance");
			}

			// Step 4: Register the scheduled call
			const registerUpcomingCallAPI = "/calls/scheduled/createCall";
			const registerUpcomingCallPayload = {
				callId: callDetails.callId,
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
				discounts: isDiscountSelected ? service.discountRules._id : [],
			};

			let registerCallResponse = await axios.post(
				`${backendBaseUrl}${registerUpcomingCallAPI}`,
				registerUpcomingCallPayload
			);

			if (
				registerCallResponse.status === 200 ||
				registerCallResponse.status === 201
			) {
				await axios.post(`${backendBaseUrl}/wallet/payout`, {
					userId: clientUser?._id as string,
					userType: "Client",
					amount: totalAmount.total,
					callType: service.type,
				});

				updateWalletBalance();

				setIsSuccess(true);

				setTimeout(() => {
					toggleSchedulingSheet(false);
					toast({
						variant: "destructive",
						title: `Meeting scheduled on ${formattedData.day} from ${formattedData.timeRange}`,
						toastStatus: "positive",
					});
				}, 2000);
			} else {
				throw new Error("Failed to register the call");
			}

			// Step 5: Success flow completed
			console.log("Call scheduled successfully:", registerCallResponse.data);
		} catch (error: any) {
			console.error(error);
			// Rollback wallet balance deduction if the call scheduling fails
			if (error.message.includes("Failed to register the call")) {
				try {
					await axios.post(`${backendBaseUrl}/wallet/temporary/update`, {
						userId: clientUser?._id,
						userType: "client",
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

			// Notify the user of the error
			toast({
				variant: "destructive",
				title: "Failed to schedule the call",
				toastStatus: "negative",
			});
		} finally {
			setPreparingTransaction(false);
		}
	};

	return (
		<>
			{!isSuccess ? (
				<div className="relative w-full grid grid-cols-1 items-center overflow-y-scroll no-scrollbar scroll-smooth">
					<section className="flex items-center gap-4">
						<button
							onClick={() => setShowConsentForm(false)}
							className="text-xl font-bold hoverScaleDownEffect"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="size-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M15.75 19.5 8.25 12l7.5-7.5"
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

					<hr className="col-span-full border-t-2 border-gray-100 my-2.5" />
					<span className="font-bold text-2xl mt-2.5">{service.title}</span>
					<span className="text-gray-500 text-sm capitalize">
						{service.type} {service.type === "chat" ? "Service" : "Call"} |{" "}
						{service.timeDuration}mins
					</span>

					<div className="w-full flex items-center justify-center mt-4 px-2.5 py-4 border-2 border-gray-300 rounded-xl">
						<section className="pl-2 w-full flex flex-wrap items-center justify-between">
							<div className="flex items-center justify-center gap-2.5">
								<section className="w-fit flex flex-col items-center justify-center border border-gray-300 rounded-lg">
									<p className="bg-gray-100 w-full px-2.5 font-bold text-sm">
										{customDateValue[0]}
									</p>
									<span className="font-bold text-base">
										{customDateValue[1]}
									</span>
								</section>

								<section className="flex flex-col items-start justify-start">
									<span className="font-bold">{formattedData.day}</span>
									<div className="flex items-center justify-start gap-2">
										<span className="text-sm">{formattedData.timeRange}</span>
										<span className="text-xs">{formattedData.timezone}</span>
									</div>
								</section>
							</div>
							<Button
								className={`font-medium tracking-widest rounded-full px-2 w-fit min-w-[80px] min-h-[36px] text-[15px] text-black flex items-center justify-center hoverScaleDownEffect`}
								style={{ background: themeColor }}
								onClick={() => setShowConsentForm(false)}
								disabled={preparingTransaction}
							>
								<span className="py-2.5 text-white text-sm">Change</span>
							</Button>
						</section>
					</div>

					{service.discountRules && (
						<div className="w-full grid grid-cols-1 gap-4 mt-5">
							{showDiscountCards && (
								<ClientSideDiscountCard
									service={service}
									clientUserId={clientUser?._id as string}
									isDiscountSelected={isDiscountSelected}
									setIsDiscountSelected={setIsDiscountSelected}
								/>
							)}

							<button
								onClick={() => setShowDiscountCards((prev) => !prev)}
								className={`w-fit ml-auto px-4 py-2 bg-black text-white text-sm rounded-lg font-medium hoverScaleDownEffect`}
							>
								{showDiscountCards ? "Hide Discount Cards" : "View Discounts"}
							</button>
						</div>
					)}

					{/* Order Summary Section */}
					<div className="mt-4 w-full">
						<h4 className="text-xl font-bold text-gray-800 mb-2.5">
							Order Summary
						</h4>
						<div className="border-2 border-gray-300 rounded-lg p-4 pt-5 shadow-inner  w-full flex flex-col items-start justify-start gap-2.5">
							<section className="w-full pb-2.5 border-b-2 border-dashed border-gray-300 flex justify-between text-sm text-gray-800">
								<p>1 x {service.title}</p>
								<p className="font-bold">
									{service.currency === "INR" ? "₹" : "$"} {service.basePrice}
								</p>
							</section>

							<section className="relative w-full pb-2.5 flex justify-between text-sm text-gray-800 border-b-2 border-dashed border-gray-300">
								<p className="flex items-center gap-2 ">
									Platform Fee{" "}
									<span
										className="text-gray-500 cursor-pointer"
										onClick={() => setShowInfo((prev) => !prev)}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth={1.5}
											stroke="currentColor"
											className="size-4"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
											/>
										</svg>
									</span>
									{showInfo && (
										<p
											onMouseLeave={() => setShowInfo(false)}
											className="absolute bg-black text-white rounded-lg w-3/4 p-4 -right-1 top-0 whitespace-pre-wrap"
										>
											This fee helps us operate and improve our platform,
											delivering a seamless experience
										</p>
									)}
								</p>
								<p className="font-bold">
									{service.currency === "INR" ? "₹" : "$"} 10
								</p>
							</section>
							{isDiscountSelected && service.discountRules && (
								<section className="w-full pb-2.5 border-b-2 border-dashed border-gray-300 flex justify-between text-sm text-gray-800">
									<p className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-xs whitespace-nowrap">
										Discount
										<span className="text-sm ml-1">
											{service.discountRules.discountType === "percentage"
												? `${service.discountRules.discountAmount}%`
												: `${service.currency === "INR" ? "₹" : "$"} ${
														service.discountRules.discountAmount
												  }`}{" "}
											off
										</span>
									</p>
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
								</section>
							)}
							<section className="w-full flex justify-between font-bold text-gray-800 mt-4 pt-2">
								<p>Service Total</p>
								{totalAmount.currency === "INR" ? "₹" : "$"} {totalAmount.total}
							</section>
						</div>
					</div>

					{/* Payment Confirmation */}
					<div className="bg-white shadow-md mt-4 w-full flex item-center justify-center gap-4 py-2.5 sticky bottom-0">
						<section className="bg-white flex items-center gap-2 border-2 border-gray-300 rounded-full py-2 px-4 whitespace-nowrap">
							<span className="text-sm font-bold">
								{totalAmount.currency === "INR" ? "₹" : "$"} {totalAmount.total}
							</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="size-4"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="m8.25 4.5 7.5 7.5-7.5 7.5"
								/>
							</svg>
						</section>
						<Button
							className="text-base bg-blue-500 hoverScaleDownEffect w-full mx-auto text-white"
							type="submit"
							onClick={handlePaySchedule}
							disabled={preparingTransaction}
						>
							{preparingTransaction ? (
								<Image
									src="/icons/loading-circle.svg"
									alt="Loading..."
									width={1000}
									height={1000}
									className={`size-6`}
									priority
								/>
							) : (
								"Confirm & Pay"
							)}
						</Button>
					</div>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center min-w-full h-fit gap-4 py-5">
					{success}
					<span className="font-semibold text-lg">
						Meeting scheduled for {customDateValue}
					</span>
				</div>
			)}
		</>
	);
};

export default AvailabilityFinalConsentForm;
