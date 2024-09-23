"use client";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import Image from "next/image";
import Link from "next/link";
import PriceEditModal from "./Price";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import axios from "axios";
import { useToast } from "../ui/use-toast";
import { calculateTotalEarnings, isValidUrl } from "@/lib/utils";
import ServicesCheckbox from "../shared/ServicesCheckbox";
import CopyToClipboard from "../shared/CopyToClipboard";
import { UpdateCreatorParams } from "@/types";
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import ContentLoading from "../shared/ContentLoading";
import CreatorLinks from "./CreatorLinks";
import * as Sentry from "@sentry/nextjs";
import { trackEvent } from "@/lib/mixpanel";
import usePlatform from "@/hooks/usePlatform";
import ProfileDialog from "./ProfileDialog";

const CreatorHome = () => {
	const { creatorUser, refreshCurrentUser } = useCurrentUsersContext();
	const { walletBalance, updateWalletBalance } = useWalletBalanceContext();
	const { getDevicePlatform } = usePlatform();
	const { toast } = useToast();
	// State for toggle switches
	const [services, setServices] = useState({
		myServices:
			creatorUser?.videoAllowed ||
			creatorUser?.audioAllowed ||
			creatorUser?.chatAllowed
				? true
				: false,
		videoCall: creatorUser?.videoAllowed || false,
		audioCall: creatorUser?.audioAllowed || false,
		chat: creatorUser?.chatAllowed || false,
	});

	const [transactionsLoading, setTransactionsLoading] = useState(false);
	const [loading, setLoading] = useState(true);
	const [creatorLink, setCreatorLink] = useState<string | null>(null);
	const [todaysEarning, setTodaysEarning] = useState(0);
	const [isPriceEditOpen, setIsPriceEditOpen] = useState(false);
	const [prices, setPrices] = useState({
		videoCall: creatorUser?.videoRate || "0",
		audioCall: creatorUser?.audioRate || "0",
		chat: creatorUser?.chatRate || "0",
	});

	const fetchCreatorLink = async () => {
		try {
			const response = await axios.get(
				`/api/v1/creator/creatorLink?userId=${creatorUser?._id}`
			);

			return response.data.creatorLink;
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error fetching creator link:", error);
			return null;
		}
	};

	useEffect(() => {
		if (creatorUser) {
			const fetchLink = async () => {
				const link = await fetchCreatorLink();

				setCreatorLink(link || `https://flashcall.me/${creatorUser.username}`);
			};
			fetchLink();
		}
	}, [creatorUser?._id]);

	useEffect(() => {
		setTimeout(() => {
			setLoading(false);
		}, 1000);
	}, []);

	useEffect(() => {
		if (creatorUser) {
			setPrices({
				videoCall: creatorUser?.videoRate,
				audioCall: creatorUser?.audioRate,
				chat: creatorUser?.chatRate,
			});
			setServices({
				myServices:
					creatorUser?.videoAllowed ||
					creatorUser?.audioAllowed ||
					creatorUser?.chatAllowed
						? true
						: false,
				videoCall: creatorUser?.videoAllowed,
				audioCall: creatorUser?.audioAllowed,
				chat: creatorUser?.chatAllowed,
			});
		}
	}, [creatorUser?._id]);

	const fetchTransactions = async () => {
		try {
			setTransactionsLoading(true);
			// Get today's date in local YYYY-MM-DD format
			const today = new Date();
			const localDate = today.toLocaleDateString("en-CA"); // 'en-CA' gives YYYY-MM-DD format
			console.log(localDate);
			const response = await axios.get(
				`/api/v1/transaction/getTodaysEarnings?userId=${creatorUser?._id}&date=${localDate}`
			);
			const fetchedTransactions = response.data.transactions;
			const totalEarnings = calculateTotalEarnings(fetchedTransactions);
			setTodaysEarning(totalEarnings.toFixed(2));
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error fetching transactions:", error);
		} finally {
			setTransactionsLoading(false);
		}
	};

	useEffect(() => {
		if (creatorUser) {
			try {
				const creatorRef = doc(db, "transactions", creatorUser?._id);
				const unsubscribe = onSnapshot(
					creatorRef,
					(doc) => {
						const data = doc.data();

						if (data) {
							updateWalletBalance();
							fetchTransactions();
						}
					},
					(error) => {
						console.error("Error fetching snapshot: ", error);
						// Optional: Retry or fallback logic when Firebase is down
						updateWalletBalance();
						fetchTransactions();
					}
				);

				return () => unsubscribe();
			} catch (error) {
				console.error("Error connecting to Firebase: ", error);
			}
		}
	}, [creatorUser?._id]);

	const theme = creatorUser?.themeSelected;

	const updateFirestoreCallServices = async (
		services: {
			myServices: boolean;
			videoCall: boolean;
			audioCall: boolean;
			chat: boolean;
		},
		prices: { videoCall: string; audioCall: string; chat: string }
	) => {
		if (creatorUser) {
			try {
				const callServicesDocRef = doc(db, "services", creatorUser._id);

				const callServicesDoc = await getDoc(callServicesDocRef);
				if (callServicesDoc.exists()) {
					await updateDoc(callServicesDocRef, {
						services,
						prices,
					});
				} else {
					await setDoc(callServicesDocRef, {
						services,
						prices,
					});
				}

				// Determine if any service is active
				const isOnline =
					services.videoCall || services.audioCall || services.chat;

				const creatorStatusDocRef = doc(db, "userStatus", creatorUser.phone);
				// Update or set the creator's status
				const creatorStatusDoc = await getDoc(creatorStatusDocRef);
				if (creatorStatusDoc.exists()) {
					await updateDoc(creatorStatusDocRef, {
						status: isOnline ? "Online" : "Offline",
					});
				} else {
					await setDoc(creatorStatusDocRef, {
						status: isOnline ? "Online" : "Offline",
					});
				}
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error updating Firestore call services: ", error);
			}
		}
	};

	const handleSavePrices = async (newPrices: {
		videoCall: string;
		audioCall: string;
		chat: string;
	}) => {
		console.log(newPrices);
		try {
			await axios.put("/api/v1/creator/updateUser", {
				userId: creatorUser?._id,
				user: {
					videoRate: newPrices.videoCall,
					audioRate: newPrices.audioCall,
					chatRate: newPrices.chat,
				},
			});
			if (newPrices.audioCall !== prices.audioCall) {
				trackEvent("Creator_Audio_Price_Updated", {
					Creator_ID: creatorUser?._id,
					Creator_First_Seen: creatorUser?.createdAt?.toString().split("T")[0],
					Platform: getDevicePlatform(),
					Price: newPrices.audioCall,
				});
			}
			if (newPrices.videoCall !== prices.videoCall) {
				trackEvent("Creator_Video_Price_Updated", {
					Creator_ID: creatorUser?._id,
					Creator_First_Seen: creatorUser?.createdAt?.toString().split("T")[0],
					Platform: getDevicePlatform(),
					Price: newPrices.videoCall,
				});
			}
			if (newPrices.chat !== prices.chat) {
				trackEvent("Creator_Chat_Price_Updated", {
					Creator_ID: creatorUser?._id,
					Creator_First_Seen: creatorUser?.createdAt?.toString().split("T")[0],
					Platform: getDevicePlatform(),
					Price: newPrices.chat,
				});
			}
			setPrices(newPrices);
			toast({
				variant: "destructive",
				title: "Rates Updated",
				description: "Values are updated...",
			});
			updateFirestoreCallServices(
				{
					myServices: services.myServices,
					videoCall: services.videoCall,
					audioCall: services.audioCall,
					chat: services.chat,
				},
				newPrices
			);
		} catch (error) {
			Sentry.captureException(error);
			console.log(error);
			toast({
				variant: "destructive",
				title: "Rates were Not Updated",
				description: "Something went wrong...",
			});
		}
	};

	const handleToggle = (
		service: "myServices" | "videoCall" | "audioCall" | "chat"
	) => {
		setServices((prevStates) => {
			if (service === "myServices") {
				// Toggle the master switch and update all services accordingly
				const newMyServicesState = !prevStates.myServices;
				const newServices = {
					myServices: newMyServicesState,
					videoCall: newMyServicesState,
					audioCall: newMyServicesState,
					chat: newMyServicesState,
				};

				updateFirestoreCallServices(newServices, prices);
				return newServices;
			} else {
				// Toggle an individual service
				const newServiceState = !prevStates[service];
				const newServices = {
					...prevStates,
					[service]: newServiceState,
				};

				// Check if any of the individual services are true
				const isAnyServiceOn =
					newServices.videoCall || newServices.audioCall || newServices.chat;

				// Update the master toggle (myServices) accordingly
				newServices.myServices = isAnyServiceOn;

				updateFirestoreCallServices(newServices, prices);
				return newServices;
			}
		});
	};

	useEffect(() => {
		const updateServices = async () => {
			try {
				await axios.put("/api/v1/creator/updateUser", {
					userId: creatorUser?._id,
					user: {
						videoAllowed: services.videoCall,
						audioAllowed: services.audioCall,
						chatAllowed: services.chat,
					},
				} as UpdateCreatorParams);

				refreshCurrentUser();
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error updating services:", error);
			}
		};

		if (creatorUser) {
			updateServices();
		}
	}, [services]);

	if (!creatorUser || loading || walletBalance < 0)
		return (
			<section className="w-full h-full -mt-10 flex flex-col items-center justify-center">
				<ContentLoading />

				{!creatorUser && !loading && (
					<span className="text-red-500 font-semibold text-lg">
						User Authentication Required
					</span>
				)}

				{creatorUser && loading && (
					<p className="text-green-1 font-semibold text-lg flex items-center gap-2">
						Fetching Creator&apos;s Details{" "}
						<Image
							src="/icons/loading-circle.svg"
							alt="Loading..."
							width={24}
							height={24}
							className="invert"
							priority
						/>
					</p>
				)}
			</section>
		);

	const imageSrc =
		creatorUser.photo && isValidUrl(creatorUser.photo)
			? creatorUser.photo
			: "/images/defaultProfileImage.png";

	return (
		<>
			<div
				className={`relative min-h-full w-full 2xl:w-[90%] mx-auto flex flex-col pt-4 rounded-t-xl`}
				style={{ backgroundColor: theme }}
			>
				<div className="flex justify-end p-2 absolute top-2 right-2">
					<Link
						href="/profile/editProfile"
						className="px-4 py-2 text-black text-sm h-auto w-auto bg-white rounded-full hover:bg-gray-300"
					>
						Edit Profile
					</Link>
				</div>
				<div className="flex flex-col items-center justify-center p-4">
					<ProfileDialog creator={creatorUser} imageSrc={imageSrc} />
					<section className="flex flex-col items-center p-2">
						<p className="text-white text-sm">
							{creatorUser?.firstName} {creatorUser?.lastName}
						</p>
						<p className="text-white text-sm">
							{creatorUser?.creatorId?.startsWith("@")
								? creatorUser.creatorId
								: `@${creatorUser?.username}`}
						</p>
					</section>
				</div>
				<div className="flex-grow flex flex-col gap-4 bg-gray-50 rounded-t-3xl p-4">
					<CopyToClipboard
						link={
							creatorLink ?? `https://flashcall.me/${creatorUser?.username}`
						}
						username={
							creatorUser.username ? creatorUser.username : creatorUser.phone
						}
						profession={creatorUser.profession ?? "Astrologer"}
						gender={creatorUser.gender ?? ""}
						firstName={creatorUser.firstName}
						lastName={creatorUser.lastName}
					/>

					<section className="flex flex-row justify-between border rounded-lg bg-white p-2 shadow-sm">
						<div className="flex flex-row pl-2 gap-3">
							<Image
								src={"/wallet-creator.svg"}
								width={0}
								height={0}
								alt="wallet"
								className="w-auto h-auto p-2 bg-green-200 rounded-md "
							/>
							<div className="flex flex-col">
								<p className="text-gray-400 text-[10px]">Todays Earning</p>
								<p className="text-[15px] font-bold">
									{transactionsLoading ? "Fetching..." : `Rs. ${todaysEarning}`}
								</p>
							</div>
						</div>
						<Link href={"/payment"} className="flex items-center">
							<Button className="bg-green-600 w-auto h-auto text-white rounded-lg hover:bg-green-700">
								View Wallet
							</Button>
						</Link>
					</section>
					<section className="flex flex-col justify-between border rounded-lg bg-white p-2 shadow-sm">
						<div className="flex flex-row justify-between items-center p-2 border-b">
							<span className="text-gray-400 font-semibold">My Services</span>
							<label className="relative inline-block w-14 h-6">
								<input
									type="checkbox"
									className="toggle-checkbox absolute w-0 h-0 opacity-0"
									checked={services.myServices}
									onChange={() => handleToggle("myServices")}
								/>
								<p
									className={`toggle-label block overflow-hidden h-6 rounded-full ${
										services.myServices ? "bg-green-600" : "bg-gray-500"
									}  servicesCheckbox cursor-pointer`}
									style={{
										justifyContent: services.myServices
											? "flex-end"
											: "flex-start",
									}}
								>
									<span
										className="servicesCheckboxContent"
										style={{
											transition: "transform 0.3s",
											transform: services.myServices
												? "translateX(2.1rem)"
												: "translateX(0)",
										}}
									/>
								</p>
							</label>
						</div>

						<ServicesCheckbox
							setIsPriceEditOpen={setIsPriceEditOpen}
							services={{
								videoCall: services.videoCall,
								audioCall: services.audioCall,
								chat: services.chat,
							}}
							handleToggle={handleToggle}
							prices={prices}
						/>
					</section>

					<CreatorLinks />

					<section className="flex items-center justify-center pt-4">
						<div className="text-center text-[13px] text-gray-400">
							If you are interested in learning how to create an account on{" "}
							<b>Flashcall</b> and how it works. <br />{" "}
							<Link href={"/home"} className="text-green-1">
								{" "}
								<b> please click here. </b>{" "}
							</Link>
						</div>
					</section>
				</div>
				{isPriceEditOpen && (
					<PriceEditModal
						onClose={() => setIsPriceEditOpen(false)}
						onSave={handleSavePrices}
						currentPrices={prices}
					/>
				)}
			</div>
		</>
	);
};

export default CreatorHome;
