"use client";

import React, { useState, useEffect, useRef } from "react";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import axios from "axios";
import * as Sentry from "@sentry/nextjs";
import ContentLoading from "@/components/shared/ContentLoading";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { enterAmountSchema } from "@/lib/validator";
import { logEvent } from "firebase/analytics";
import { analytics } from "@/lib/firebase";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { creatorUser } from "@/types";
import { trackEvent } from "@/lib/mixpanel";
import Link from "next/link";

interface Transaction {
	_id: string;
	amount: number;
	createdAt: string;
	type: "credit" | "debit";
}

interface PaymentProps {
	callType?: string; // Define callType as an optional string
}

const Payment: React.FC<PaymentProps> = ({ callType }) => {
	const [btn, setBtn] = useState<"All" | "Credit" | "Debit">("All");
	const [creator, setCreator] = useState<creatorUser>();
	const { walletBalance } = useWalletBalanceContext();
	const { currentUser } = useCurrentUsersContext();
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const router = useRouter();
	const { clientUser } = useCurrentUsersContext();
	const [isSticky, setIsSticky] = useState(false);
	const stickyRef = useRef<HTMLDivElement>(null);

	const handleScroll = () => {
		if (stickyRef.current) {
			setIsSticky(window.scrollY > stickyRef.current.offsetTop);
		}
	};

	useEffect(() => {
		window.addEventListener("scroll", handleScroll);
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	useEffect(() => {
		const storedCreator = localStorage.getItem("currentCreator");
		if (storedCreator) {
			const parsedCreator: creatorUser = JSON.parse(storedCreator);
			if (parsedCreator) {
				setCreator(parsedCreator);
			}
		}
	}, []);

	useEffect(() => {
		trackEvent("Recharge_Page_Impression", {
			Client_ID: clientUser?._id,
			User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
			Creator_ID: creator?._id,
			Walletbalace_Available: clientUser?.walletBalance,
		});
	}, []);

	const getRateForCallType = () => {
		let rate: number | undefined;
		switch (callType) {
			case "video":
				rate = creator?.videoRate ? parseFloat(creator.videoRate) : undefined;
				break;
			case "audio":
				rate = creator?.audioRate ? parseFloat(creator.audioRate) : undefined;
				break;
			case "chat":
				rate = creator?.chatRate ? parseFloat(creator.chatRate) : undefined;
				break;
			default:
				rate = 0;
				break;
		}
		return rate;
	};

	const amountToBeDisplayed = () => {
		const ratePerMinute = getRateForCallType();
		const costForFiveMinutes = ratePerMinute ? ratePerMinute * 5 : undefined;
		const amountDue = costForFiveMinutes
			? Math.max(0, costForFiveMinutes - walletBalance)
			: undefined;
		return amountDue;
	};
	const generateAmounts = () => {
		const rate = getRateForCallType();
		return rate
			? [5, 10, 15, 30, 40, 60].map((multiplier) =>
					(rate * multiplier).toFixed(2)
			  )
			: ["99", "199", "499", "999", "1999", "2999"];
	};

	const tileClicked = (index: any) => {
		trackEvent("Recharge_Page_TileClicked", {
			Client_ID: clientUser?._id,
			User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
			Creator_ID: creator?._id,
			Tile_Number: index,
			Walletbalace_Available: clientUser?.walletBalance,
		});
	};

	// 1. Define your form.
	const form = useForm<z.infer<typeof enterAmountSchema>>({
		resolver: zodResolver(enterAmountSchema),
		defaultValues: {
			rechargeAmount: "",
		},
	});

	// 2. Watch the form values.
	const rechargeAmount = form.watch("rechargeAmount");

	// 3. Define a submit handler.
	function onSubmit(values: z.infer<typeof enterAmountSchema>) {
		const rechargeAmount = values.rechargeAmount;

		logEvent(analytics, "payment_initiated", {
			userId: currentUser?._id,
			amount: rechargeAmount,
		});

		trackEvent("Recharge_Page_RechargeClicked", {
			Client_ID: clientUser?._id,
			User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
			Creator_ID: creator?._id,
			Recharge_value: rechargeAmount,
			Walletbalace_Available: clientUser?.walletBalance,
		});

		router.push(`/recharge?amount=${rechargeAmount}`);
	}

	const fetchTransactions = async () => {
		try {
			setLoading(true);
			const response = await axios.get(
				`/api/v1/transaction/getUserTransactionsPaginated?userId=${
					currentUser?._id
				}&filter=${btn.toLowerCase()}`
			);
			setTransactions(response.data.transactions);
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error fetching transactions:", error);
			setErrorMessage("Unable to fetch transactions");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (currentUser) {
			fetchTransactions();
		}
	}, [btn]);

	useEffect(() => {
		const amountPattern = /^\d*$/;
		if (!amountPattern.test(rechargeAmount)) {
			form.setError("rechargeAmount", {
				type: "manual",
				message: "Amount must be a numeric value",
			});
		} else {
			form.clearErrors("rechargeAmount");
		}
	}, [rechargeAmount, form]);

	const creatorURL = localStorage.getItem("creatorURL");

	return (
		<div className="flex flex-col pt-4 bg-white text-gray-800 w-full h-full">
			{/* Balance Section */}
			<div className="flex items-center pb-5 px-4 gap-4">
				<Link
					href={`${creatorURL ? creatorURL : "/home"}`}
					className="text-xl font-bold"
				>
					&larr;
				</Link>
				<section className="w-full flex flex-col">
					<span className="w-fit text-2xl leading-7 font-bold">
						Rs. {walletBalance.toFixed(2)}
					</span>
					<h2 className="w-fit text-gray-500 font-normal leading-5">
						Total Balance
					</h2>
				</section>
			</div>

			{/* Recharge Section */}
			<section className="flex flex-col gap-5 items-center justify-center md:items-start pb-7 px-4 ">
				<div className="w-[100%] flex justify-center items-center font-normal leading-5 border-[1px] rounded-lg p-3">
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="w-full flex items-center"
						>
							<FormField
								control={form.control}
								name="rechargeAmount"
								render={({ field }) => (
									<FormItem className="flex-grow mr-2">
										<FormControl>
											<Input
												placeholder="Enter amount in INR"
												{...field}
												className="w-full outline-none border-none focus-visible:ring-offset-0 focus-visible:!ring-transparent placeholder:text-grey-500"
												pattern="\d*"
												title="Amount must be a numeric value"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button
								type="submit"
								className="w-fit px-4 py-3 bg-gray-800 text-white font-bold leading-4 text-sm rounded-[6px] hover:bg-black/60"
							>
								Recharge
							</Button>
						</form>
					</Form>
				</div>
				<div>
					{/* Display the amount due message if there's an amount due */}
					{amountToBeDisplayed() !== undefined && (
						<p className="text-red-500">
							₹{amountToBeDisplayed()?.toFixed(2)} more required for 5 minutes
							of {callType}
						</p>
					)}
				</div>
				<div className="grid grid-cols-3 md:grid-cols-6 gap-6 md:gap-8 text-sm font-semibold leading-4 w-full px-5">
					{generateAmounts().map((amount, index) => (
						<button
							key={amount}
							className="px-4 py-3 border-2 border-black rounded shadow hover:bg-gray-200 dark:hover:bg-gray-800"
							style={{ boxShadow: "3px 3px black" }}
							onClick={() => {
								form.setValue("rechargeAmount", amount);
								tileClicked(index);
							}}
						>
							₹{amount}
						</button>
					))}
				</div>
			</section>

			{/* Transaction History Section */}
			<section
				ref={stickyRef}
				className={`sticky top-16 bg-white z-30 w-full px-4 ${
					isSticky ? "pb-7" : "pb-4"
				} pt-4`}
			>
				<div className="flex flex-col items-start justify-start gap-4 w-full h-fit">
					<h2 className=" text-gray-500 text-xl pt-4 font-normal leading-7">
						Transaction History
					</h2>
					<div className="flex space-x-2  text-xs font-bold leading-4 w-fit">
						{["All", "Credit", "Debit"].map((filter) => (
							<button
								key={filter}
								onClick={() => {
									setBtn(filter as "All" | "Credit" | "Debit");
								}}
								className={`px-5 py-1 border-2 border-black rounded-full ${
									filter === btn
										? "bg-gray-800 text-white"
										: "bg-white text-black dark:bg-gray-700 dark:text-white"
								}`}
							>
								{filter}
							</button>
						))}
					</div>
				</div>
			</section>

			{/* Transaction History List */}
			<ul className="space-y-4 w-full h-full px-4 pt-2 pb-7">
				{!loading ? (
					transactions.length === 0 ? (
						<p className="flex flex-col items-center justify-center size-full text-xl text-center flex-1 min-h-44 text-red-500 font-semibold">
							{errorMessage
								? errorMessage
								: `No transactions under ${btn} filter`}
						</p>
					) : (
						transactions.map((transaction) => (
							<li
								key={transaction?._id}
								className="animate-enterFromBottom flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b-2"
							>
								<div className="flex flex-col items-start justify-center gap-2">
									<p className="font-normal text-sm leading-4">
										Transaction ID <strong>{transaction?._id}</strong>
									</p>
									<p className="text-gray-500 font-normal text-xs leading-4">
										{new Date(transaction?.createdAt).toLocaleString()}
									</p>
								</div>
								<p
									className={`font-bold text-sm leading-4 w-fit whitespace-nowrap ${
										transaction?.type === "credit"
											? "text-green-500"
											: "text-red-500"
									} `}
								>
									{transaction?.type === "credit"
										? `+ ₹${transaction?.amount.toFixed(2)}`
										: `- ₹${transaction?.amount.toFixed(2)}`}
								</p>
							</li>
						))
					)
				) : (
					<div className="size-full flex flex-col gap-2 items-center justify-center">
						<ContentLoading />
					</div>
				)}
			</ul>
		</div>
	);
};

export default Payment;
