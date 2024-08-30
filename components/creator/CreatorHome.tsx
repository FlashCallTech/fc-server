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

const CreatorHome = () => {
	const { creatorUser, refreshCurrentUser } = useCurrentUsersContext();
	const { walletBalance, updateWalletBalance } = useWalletBalanceContext();
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
	const [todaysEarning, setTodaysEarning] = useState(0);
	const [isPriceEditOpen, setIsPriceEditOpen] = useState(false);
	const [prices, setPrices] = useState({
		videoCall: creatorUser?.videoRate || "0",
		audioCall: creatorUser?.audioRate || "0",
		chat: creatorUser?.chatRate || "0",
	});

	useEffect(() => {
		setTimeout(() => {
			setLoading(false);
		}, 300);
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
			// Get today's date in YYYY-MM-DD format
			const today = new Date().toISOString().split("T")[0];
			const response = await axios.get(
				`/api/v1/transaction/getTodaysEarnings?userId=${creatorUser?._id}&date=${today}`
			);
			const fetchedTransactions = response.data.transactions;
			const totalEarnings = calculateTotalEarnings(fetchedTransactions);
			setTodaysEarning(totalEarnings.toFixed(2));
		} catch (error) {
			console.error("Error fetching transactions:", error);
		} finally {
			setTransactionsLoading(false);
		}
	};

	useEffect(() => {
		if (creatorUser) {
			const creatorRef = doc(db, "transactions", creatorUser?._id);
			const unsubscribe = onSnapshot(creatorRef, (doc) => {
				const data = doc.data();

				if (data) {
					updateWalletBalance();
					fetchTransactions();
				}
			});

			return () => unsubscribe();
		}
	}, [creatorUser?._id]);

	const creatorLink = `https://app.flashcall.me/${creatorUser?.username}`;

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
			} catch (error) {
				console.error("Error updating Firestore call services: ", error);
			}
		}
	};

	const handleSavePrices = async (newPrices: {
		videoCall: string;
		audioCall: string;
		chat: string;
	}) => {
		try {
			await axios.put("/api/v1/creator/updateUser", {
				userId: creatorUser?._id,
				user: {
					videoRate: newPrices.videoCall,
					audioRate: newPrices.audioCall,
					chatRate: newPrices.chat,
				},
			});
			setPrices(newPrices);
			toast({
				title: "Rates Updated",
				description: "Values are updated...",
			});
			updateFirestoreCallServices(
				{
					myServices: services.myServices,
					videoCall: services.videoCall || false,
					audioCall: services.audioCall || false,
					chat: services.chat || false,
				},
				newPrices
			);
		} catch (error) {
			console.log(error);
			toast({
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
				const newServices = {
					...prevStates,
					[service]: !prevStates[service],
				};
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
					<Image
						src={imageSrc}
						width={1000}
						height={1000}
						alt="avatar"
						className="w-32 h-32 bg-white rounded-full p-2 object-cover"
					/>
					<section className="flex flex-col items-center p-2">
						<p className="text-white text-sm">
							{creatorUser?.firstName} {creatorUser?.lastName}
						</p>
						<p className="text-white text-sm">{creatorUser?.creatorId}</p>
					</section>
				</div>
				<div className="flex-grow flex flex-col gap-4 bg-gray-50 rounded-t-3xl p-4">
					<CopyToClipboard
						link={creatorLink}
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
						<Link href={"/payment"}>
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
							<Link href={"/"} className="text-green-1">
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
