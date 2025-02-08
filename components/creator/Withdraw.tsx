"use client";

import React, { useState, useEffect, useRef } from "react";
import ContentLoading from "@/components/shared/ContentLoading";
import { Button } from "@/components/ui/button";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import SinglePostLoader from "../shared/SinglePostLoader";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import usePayout from "@/hooks/usePayout";
import Verify from "../shared/Verify";
import { useInView } from "react-intersection-observer";
import { useGetUserTransactionsByType } from "@/lib/react-query/queries";
import Image from "next/image";
import { useToast } from "../ui/use-toast";
import { backendBaseUrl, formatDateTime } from "@/lib/utils";
import axios from "axios";

interface Transaction {
	_id: string;
	amount: number;
	createdAt: string;
	type: "credit" | "debit";
	category: string;
	callCategory: string;
	callType?: string;
}

interface dateRange {
	startDate: string | null;
	endDate: string | null;
}

const Withdraw: React.FC = () => {
	const { creatorUser } = useCurrentUsersContext();
	const { walletBalance } = useWalletBalanceContext();
	const { initiateWithdraw, loadingTransfer } = usePayout();
	const [btn, setBtn] = useState<"all" | "credit" | "debit">("all");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [dateRange, setDateRange] = useState<dateRange>({
		startDate: "",
		endDate: "",
	});
	const [selectedOption, setSelectedOption] = useState("");
	const [withdrawAmount, setWithdrawAmount] = useState<string>("");
	const [isStickyVisible, setIsStickyVisible] = useState(true);
	const topRef = useRef(null);
	const openModal = () => setIsModalOpen(true);
	const closeModal = () => {
		setWithdrawAmount("");
		setError(null);
		setIsModalOpen(false);
	};
	const { toast } = useToast();
	const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		if (/^\d*$/.test(value)) {
			setWithdrawAmount(value);
			setError(null);
		} else {
			setError("Please enter a valid number.");
		}
	};

	const handleDateChange = (key: any, value: any) => {
		setDateRange((prev) => {
			const updated = { ...prev, [key]: value };

			// Validate date range
			if (
				updated.startDate &&
				updated.endDate &&
				updated.startDate > updated.endDate
			) {
				setError("End date cannot be earlier than start date.");
			} else {
				setError(""); // Clear error if dates are valid
			}

			return updated;
		});
	};

	// Map filter options to date ranges
	const getDateRange = (filter: any) => {
		const today = new Date();
		const start = new Date();
		let end = today.toISOString().split("T")[0];

		switch (filter) {
			case "Yesterday":
				start.setDate(today.getDate() - 1);
				break;
			case "Last 7 days":
				start.setDate(today.getDate() - 7);
				break;
			case "Last 30 Days":
				start.setDate(today.getDate() - 30);
				break;
			case "This Month":
				start.setDate(1); // First day of this month
				break;
			case "Last Month":
				start.setMonth(today.getMonth() - 1);
				start.setDate(1); // First day of last month
				end = new Date(today.getFullYear(), today.getMonth(), 0)
					.toISOString()
					.split("T")[0]; // Last day of last month
				break;
			case "Lifetime":
				const res = { startDate: null, endDate: null };
				setDateRange(res);
				return res; // No date filtering
			default:
				return null;
		}

		return {
			startDate: start.toISOString().split("T")[0],
			endDate: end,
		};
	};

	// Update dateRange whenever filter changes
	useEffect(() => {
		const range = getDateRange(selectedOption);
		if (range?.endDate || range?.startDate) {
			setDateRange(range);
		}
	}, [selectedOption]);

	const handleWithdraw = () => {
		if (!withdrawAmount) {
			setError("Amount is required.");
			return;
		}

		if (creatorUser?._id && creatorUser?.phone) {
			initiateWithdraw(
				creatorUser._id,
				creatorUser.phone,
				Number(withdrawAmount)
			);
			closeModal();
		}
	};

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				setIsStickyVisible(entry.isIntersecting);
			},
			{ threshold: 0 }
		);

		if (topRef.current) {
			observer.observe(topRef.current);
		}

		return () => {
			if (topRef.current) observer.unobserve(topRef.current);
		};
	}, []);

	const { ref, inView } = useInView({
		threshold: 0.1,
		triggerOnce: false,
	});

	const {
		data: userTransactions,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isError,
		isLoading,
	} = useGetUserTransactionsByType(creatorUser?._id as string, btn, dateRange);

	useEffect(() => {
		if (inView && hasNextPage && !isFetching) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetching]);

	console.log(
		userTransactions?.pages[0].totalEarnings,
		userTransactions?.pages[0].totalWithdrawals
	);

	const groupTransactionsByDate = (transactionsList: Transaction[]) => {
		return transactionsList.reduce((acc, transaction) => {
			const date = new Date(transaction.createdAt).toISOString().split("T")[0];
			if (!acc[date]) {
				acc[date] = [];
			}
			acc[date].push(transaction);
			return acc;
		}, {} as Record<string, Transaction[]>);
	};

	const groupedTransactions = userTransactions
		? groupTransactionsByDate(
				userTransactions.pages.flatMap((page) => page.transactions)
		  )
		: {};

	if (loadingTransfer) {
		return <Verify message={"Initiating Transfer"} />;
	}

	if (!creatorUser?._id)
		return (
			<section className="size-full flex flex-col gap-2 items-center justify-center">
				<SinglePostLoader />
			</section>
		);

	const copyToClipboard = (text: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				toast({
					variant: "destructive",
					title: "Transaction ID Copied",
					toastStatus: "positive",
				});
			})
			.catch((err) => {
				console.error("Failed to copy ID: ", err);
			});
	};

	return (
		<>
			<div ref={topRef} className="absolute top-0"></div>
			<div className="size-full">
				<section className="size-full grid grid-cols-1 grid-rows-[auto,auto,1fr] lg:hidden">
					<section className="grid grid-cols-1 items-center sticky top-0 lg:top-[76px] z-40 bg-white p-4 ">
						{/* Sticky Balance and Recharge Section */}
						<section className="flex flex-col gap-5 items-center justify-center lg:items-start">
							{/* Balance Section */}
							{isStickyVisible ? (
								<div className="w-full flex flex-col items-center justify-center">
									<p>
										Welcome,
										<br />
									</p>
									<p className="font-bold">
										{creatorUser?.firstName} {creatorUser?.lastName}
									</p>
								</div>
							) : null}

							{/* Recharge Section */}
							<div className="flex flex-col gap-5 w-full items-center justify-center md:items-start">
								{/* When isStickyVisible is FALSE */}
								{!isStickyVisible && (
									<div className="w-full flex flex-row justify-between items-center font-normal leading-5 border-[1px] rounded-lg p-3 bg-white shadow relative">
										<div className="flex flex-col items-start pl-1">
											<span className="text-[13px]">Wallet Balance</span>
											<p className="text-green-600 text-[20px] font-bold p-0">
												₹ {walletBalance.toFixed(2)}
											</p>
										</div>
										<Button
											onClick={openModal}
											className="right-0 w-auto px-4 py-3 shadow bg-green-600 text-white font-bold leading-4 text-sm rounded-[6px] hover:bg-green-700"
										>
											Withdraw
										</Button>
									</div>
								)}

								{/* When isStickyVisible is TRUE */}
								{isStickyVisible && (
									<>
										<div className="w-full flex flex-col items-center font-normal leading-5 border-[1px] rounded-lg p-3 bg-white shadow">
											<div className="flex flex-col items-center">
												<span className="text-[13px]">Wallet Balance</span>
												<p className="text-green-600 text-[25px] font-extrabold p-2">
													₹ {walletBalance.toFixed(2)}
												</p>
											</div>
										</div>
										<Button
											onClick={openModal}
											className="w-full px-4 bg-green-600 text-white font-bold leading-4 text-sm rounded-[6px] hover:bg-green-700"
										>
											Withdraw
										</Button>
									</>
								)}
							</div>
						</section>

						{/* Transaction History Section */}
						<section className={`w-full ${!isStickyVisible ? "py-4" : "p-2"}`}>
							<div className="flex flex-col items-start justify-start gap-2 w-full h-fit">
								{isStickyVisible && (
									<h2 className="text-gray-500 text-xl pt-5 font-normal leading-7">
										Transaction History
									</h2>
								)}
								<div className="flex space-x-2 text-xs font-bold leading-4 w-fit">
									{["all", "credit", "debit"].map((filter) => (
										<button
											key={filter}
											onClick={() => {
												setBtn(filter as "all" | "credit" | "debit");
											}}
											className={`capitalize px-5 py-1 border border-black rounded-full ${
												filter === btn
													? "bg-gray-800 text-white"
													: "bg-white text-black dark:bg-gray-700 dark:text-white hoverScaleDownEffect"
											}`}
										>
											{filter}
										</button>
									))}
								</div>
							</div>
						</section>
					</section>
					{/* Transaction History List */}
					<ul className="space-y-4 w-full px-4 pt-2 pb-7">
						{!isLoading || !creatorUser ? (
							isError ? (
								<div className="size-full h-full flex flex-col items-center justify-center text-2xl xl:text-2xl font-semibold text-center text-red-500">
									Failed to fetch Transactions
									<span className="text-lg">Please try again later.</span>
								</div>
							) : Object.keys(groupedTransactions).length === 0 ? (
								<section className="size-full h-full flex flex-col gap-4 items-center justify-center text-xl font-semibold text-center text-gray-500">
									<Image
										src={"/images/noTransaction.png"}
										alt="no transaction"
										width={1000}
										height={1000}
										className="size-[150px] object-contain"
									/>
									<span className="text-center w-full">No transaction yet</span>
								</section>
							) : (
								Object.entries(groupedTransactions).map(
									([date, transactions]) => {
										const groupedDate = formatDateTime(new Date(date));
										return (
											<div
												key={date}
												className="p-5 bg-white rounded-lg shadow border border-gray-100 w-full animate-enterFromBottom"
											>
												<h3 className="text-base items-start font-normal  text-gray-400 mb-2">
													{groupedDate?.dateOnly}
												</h3>
												{transactions.map((transaction) => (
													<li
														key={transaction?._id}
														className="animate-enterFromBottom  flex gap-2 justify-between items-center py-4  bg-white dark:bg-gray-800 border-t-2 border-gray-100"
													>
														<div className="flex flex-wrap flex-col items-start justify-center gap-2">
															<div className="flex items-center gap-2">
																<p className="flex items-center justify-start gap-2 font-normal text-sm leading-4">
																	ID{" "}
																	<span className="text-sm sm:block">
																		<span className="block xm:hidden">{`${transaction?._id.slice(
																			0,
																			11
																		)}...`}</span>
																		<span className="hidden xm:block">
																			{transaction?._id}
																		</span>
																	</span>
																</p>

																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	fill="none"
																	viewBox="0 0 24 24"
																	strokeWidth={1.5}
																	stroke="currentColor"
																	className="cursor-pointer mb-[1px] size-3 md:size-4 text-gray-400 hoverScaleDownEffect hover:text-green-1"
																	onClick={() =>
																		copyToClipboard(transaction?._id)
																	}
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
																	/>
																</svg>
															</div>
															<section className="flex flex-wrap items-center justify-start gap-2">
																{transaction?.category && (
																	<section className="font-normal text-xs sm:text-sm whitespace-nowrap">
																		{transaction?.callType ? (
																			transaction?.callType === "video" ? (
																				<svg
																					xmlns="http://www.w3.org/2000/svg"
																					fill="none"
																					viewBox="0 0 24 24"
																					strokeWidth={1.5}
																					stroke="currentColor"
																					className="size-3 sm:size-4"
																				>
																					<path
																						strokeLinecap="round"
																						strokeLinejoin="round"
																						d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
																					/>
																				</svg>
																			) : transaction?.callType === "audio" ? (
																				<svg
																					xmlns="http://www.w3.org/2000/svg"
																					fill="none"
																					viewBox="0 0 24 24"
																					strokeWidth={1.5}
																					stroke="currentColor"
																					className="size-3 sm:size-4"
																				>
																					<path
																						strokeLinecap="round"
																						strokeLinejoin="round"
																						d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
																					/>
																				</svg>
																			) : (
																				<svg
																					xmlns="http://www.w3.org/2000/svg"
																					fill="none"
																					viewBox="0 0 24 24"
																					strokeWidth={1.5}
																					stroke="currentColor"
																					className="size-3 sm:size-4"
																				>
																					<path
																						strokeLinecap="round"
																						strokeLinejoin="round"
																						d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
																					/>
																				</svg>
																			)
																		) : (
																			<p className="text-green-1">
																				{transaction?.category}
																			</p>
																		)}
																	</section>
																)}

																<span className="text-gray-400 text-xs sm:text-sm">
																	•
																</span>

																<p className=" text-gray-400 font-normal text-xs sm:text-sm leading-4">
																	{
																		formatDateTime(
																			new Date(transaction?.createdAt)
																		)?.dateTime
																	}
																</p>

																<span className="text-gray-400 text-xs sm:text-sm max-xm:hidden">
																	•
																</span>

																{transaction.category !==
																	"Call Transaction" && (
																	<p
																		className={`
																	 ${
																			transaction.category === "Refund" ||
																			transaction.category === "Tip"
																				? "bg-[#F0FDF4] text-[#16A34A]"
																				: "bg-[#DBEAFE] text-[#1E40AF]"
																		} text-[12px] px-2 py-1 rounded-full`}
																	>
																		{transaction.category}
																	</p>
																)}

																{transaction.callCategory &&
																	transaction.category ===
																		"Call Transaction" && (
																		<p
																			className={`
																	 ${
																			transaction.callCategory === "Scheduled"
																				? "bg-[#F0FDF4] text-[#16A34A]"
																				: "bg-[#DBEAFE] text-[#1E40AF]"
																		} text-[12px] px-2 py-1 rounded-full`}
																		>
																			{transaction.callCategory}
																		</p>
																	)}
															</section>
														</div>
														<section className="flex flex-col justify-between items-center">
															<span
																className={`size-full flex items-center font-bold text-sm leading-4 w-fit whitespace-nowrap ${
																	transaction?.type === "credit"
																		? "text-green-500"
																		: "text-red-500"
																} `}
															>
																{transaction?.type === "credit"
																	? `+ ₹${transaction?.amount?.toFixed(2)}`
																	: `- ₹${transaction?.amount?.toFixed(2)}`}
															</span>

															<span className="size-full opacity-0">.</span>
														</section>
													</li>
												))}
											</div>
										);
									}
								)
							)
						) : (
							<div className="size-full flex flex-col gap-2 items-center justify-center">
								<ContentLoading />
							</div>
						)}
					</ul>

					{hasNextPage && isFetching && (
						<Image
							src="/icons/loading-circle.svg"
							alt="Loading..."
							width={50}
							height={50}
							className="mx-auto invert my-5 mt-10 z-20"
						/>
					)}

					{!isError &&
						!hasNextPage &&
						!isFetching &&
						creatorUser &&
						userTransactions?.pages[0]?.totalTransactions > 4 && (
							<div className="text-center text-gray-500 py-4">
								You have reached the end of the list.
							</div>
						)}

					{hasNextPage && <div ref={ref} className="py-4 w-full" />}

					{isModalOpen && (
						<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
							<div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
								<div className="flex justify-between items-center mb-4">
									<h2 className="text-lg font-semibold">
										Enter Withdrawal Amount
									</h2>
									<button
										className="text-gray-500 text-xl hover:text-gray-700"
										onClick={closeModal}
									>
										&times;
									</button>
								</div>
								<input
									type="text"
									value={withdrawAmount}
									onChange={handleAmountChange}
									placeholder="Enter amount"
									className="p-2 border rounded w-full mb-4"
								/>
								<div className="flex justify-end gap-4 mt-6">
									<Button
										onClick={closeModal}
										className="bg-gray-300 text-black"
									>
										Cancel
									</Button>
									<Button
										onClick={handleWithdraw}
										className="bg-green-600 text-white font-bold"
									>
										Confirm
									</Button>
								</div>
							</div>
						</div>
					)}
				</section>

				{/* New Design */}

				<section className="hidden size-full lg:flex flex-col px-8 py-6">
					<section
						className={`grid grid-cols-1 items-center sticky ${
							isStickyVisible ? "0" : "pt-[24px] border-none"
						}  top-[76px] z-30 bg-white`}
					>
						{/* Sticky Balance and Recharge Section */}
						<section className="flex flex-col gap-5 items-center justify-center md:items-start">
							{/* Recharge Section */}
							<div className="flex flex-col gap-5 w-full justify-center items-start">
								{isStickyVisible && (
									<>
										<div
											style={{
												background:
													"linear-gradient(0deg, rgba(0, 0, 0, 0.001), rgba(0, 0, 0, 0.001)), rgba(22, 188, 136, 0.1)",
												boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.05)",
											}}
											className="w-full flex flex-row justify-between p-6 mb-6 items-center rounded-lg"
										>
											<div className="flex flex-col items-start pl-1">
												<span className="text-[#6B7280] text-sm">
													Wallet Balance
												</span>
												<p className="text-green-600 text-[30px] font-bold p-0">
													₹ {walletBalance.toFixed(2)}
												</p>
											</div>
											<Button
												onClick={openModal}
												className="right-0 w-auto px-4 py-3 shadow bg-black text-white font-bold leading-4 text-sm rounded-full hoverScaleDownEffect"
											>
												Withdraw
											</Button>
										</div>
									</>
								)}
							</div>
						</section>

						{/* Transaction History Section */}
						<section className={`w-full pb-6`}>
							<div className="flex justify-between w-full h-fit">
								<div className="flex items-center gap-3 text-xs font-bold text-[#4B5563]">
									<div className="relative">
										<select
											className="border-[1px] bg-white border-solid border-[#E5E7EB] px-6 py-3 rounded-full focus:outline-none hover:cursor-pointer hoverScaleDownEffect pr-10 appearance-none"
											value={selectedOption}
											onChange={(e) => setSelectedOption(e.target.value)}
										>
											<option value="Lifetime">Lifetime</option>
											<option value="Yesterday">Yesterday</option>
											<option value="Last 7 days">Last 7 Days</option>
											<option value="Last 30 Days">Last 30 Days</option>
											<option value="This Month">This Month</option>
											<option value="Last Month">Last Month</option>
											<option value="Custom">Custom</option>
										</select>
										<span className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
											<svg
												className="w-4 h-4 text-gray-500"
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fillRule="evenodd"
													d="M5.23 7.21a.75.75 0 011.06 0L10 10.94l3.71-3.73a.75.75 0 111.06 1.06l-4 4a.75.75 0 01-1.06 0l-4-4a.75.75 0 010-1.06z"
													clipRule="evenodd"
												/>
											</svg>
										</span>
									</div>
									{/* Show custom date inputs if 'Custom' is selected */}
									{selectedOption === "Custom" && (
										<div>
											<div className="flex items-center gap-3">
												<input
													type="date"
													className="border px-6 py-2 rounded-lg focus:outline-none hover:cursor-pointer"
													value={dateRange.startDate ?? ""}
													onChange={(e) =>
														handleDateChange("startDate", e.target.value)
													}
													max={
														dateRange.endDate ||
														new Date().toISOString().split("T")[0]
													} // Prevent start date being after end date
												/>
												<span className="text-gray-500">to</span>
												<input
													type="date"
													className="border px-6 py-2 rounded-lg focus:outline-none hover:cursor-pointer"
													value={dateRange?.endDate ?? ""}
													onChange={(e) =>
														handleDateChange("endDate", e?.target.value)
													}
													min={dateRange.startDate || undefined}
													max={new Date().toISOString().split("T")[0]}
												/>
											</div>
											{/* Display error message */}
											{error && (
												<p className="text-red-500 text-sm mt-2">{error}</p>
											)}
										</div>
									)}
								</div>
								<div className="flex space-x-2 text-xs font-bold leading-4 w-fit">
									{["all", "credit", "debit"].map((filter) => (
										<button
											key={filter}
											onClick={() => {
												setBtn(filter as "all" | "credit" | "debit");
											}}
											className={`capitalize px-4 py-2 border-[1px] border-solid border-[#E5E7EB] rounded-full ${
												filter === btn
													? "bg-black text-white"
													: "bg-white text-[#4B5563] hoverScaleDownEffect"
											}`}
										>
											{filter === "all"
												? filter
												: filter === "credit"
												? "Earnings"
												: "Withdrawal"}
										</button>
									))}
								</div>
							</div>
						</section>
					</section>
					<div className="flex justify-between gap-3 w-full pb-6 text-[#6B7280] text-sm">
						<section className="flex flex-col gap-3 border-[1px] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] bg-gradient-to-t from-[rgba(0,0,0,0.001)] to-[rgba(0,0,0,0.001)] rounded-lg p-6 w-full">
							<span>Total Earnings</span>
							<span
								className={`text-green-600 ${
									isFetching ? "text-sm" : "text-[30px]"
								} font-bold`}
							>{`${
								isFetching
									? "Fetching..."
									: `₹ ${userTransactions?.pages[0]?.totalEarnings?.toFixed(2)}`
							} `}</span>
						</section>
						<section className="flex flex-col gap-3 border-[1px] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] bg-gradient-to-t from-[rgba(0,0,0,0.001)] to-[rgba(0,0,0,0.001)] rounded-lg p-6 w-full">
							<span>Total Withdrawals</span>
							<span
								className={`text-[#EF4444] ${
									isFetching ? "text-sm" : "text-[30px]"
								} font-bold`}
							>{`${
								isFetching
									? "Fetching..."
									: `₹ ${userTransactions?.pages[0]?.totalWithdrawals?.toFixed(
											2
									  )}`
							}`}</span>
						</section>
					</div>
					<div className="flex flex-col gap-6 w-full border-[1px] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] bg-gradient-to-t from-[rgba(0,0,0,0.001)] to-[rgba(0,0,0,0.001)] rounded-lg p-6">
						<span className="font-semibold text-lg">Transaction History</span>
						{/* Transaction History List */}
						{!isLoading || !creatorUser ? (
							isError ? (
								<div className="size-full h-full flex flex-col items-center justify-center text-2xl xl:text-2xl font-semibold text-center text-red-500">
									Failed to fetch Transactions
									<span className="text-lg">Please try again later.</span>
								</div>
							) : Object.keys(groupedTransactions).length === 0 ? (
								<section className="size-full h-full flex flex-col gap-4 items-center justify-center text-xl font-semibold text-center text-gray-500">
									<Image
										src={"/images/noTransaction.png"}
										alt="no transaction"
										width={1000}
										height={1000}
										className="size-[70px] object-contain"
									/>
									<span className="text-center w-full">No transactions</span>
								</section>
							) : (
								<div className="w-full text-base overflow-x-auto">
									<table className="w-full text-left font-normal">
										<thead className="text-sm font-medium text-black">
											<tr>
												<th scope="col" className="px-6 py-3">
													Date and Time
												</th>
												<th scope="col" className="px-6 py-3">
													Transaction ID
												</th>
												<th scope="col" className="px-6 py-3">
													Type
												</th>
												<th scope="col" className="px-6 py-3">
													Amount
												</th>
											</tr>
										</thead>
										<tbody>
											{Object.entries(groupedTransactions).map(
												([date, transactions]) => {
													return transactions.map((transaction) => (
														<tr
															key={transaction?._id}
															className="bg-white border-b"
														>
															<td className="px-6 py-4 text-sm text-[#6B7280]">
																{
																	formatDateTime(
																		new Date(transaction?.createdAt)
																	).custom
																}
															</td>
															<td className="px-6 py-4 text-sm text-[#6B7280]">
																<div className="flex items-center gap-2">
																	<span className="block lg:hidden">{`${transaction?._id.slice(
																		0,
																		11
																	)}...`}</span>
																	<span className="hidden lg:block ">
																		{transaction?._id}
																	</span>
																	<Image
																		src={"/creator/copy.svg"}
																		width={20}
																		height={20}
																		alt="Copy"
																		className="size-4 hover:cursor-pointer hoverScaleDownEffect"
																		onClick={() =>
																			copyToClipboard(transaction?._id)
																		}
																	/>
																</div>
															</td>

															<td className={`px-6 py-4 text-xs`}>
																<span
																	className={`px-2 py-1 rounded-full ${
																		transaction?.type === "credit"
																			? "text-[#15803D] bg-[#DCFCE7]"
																			: "text-[#B91C1C] bg-[#FEE2E2]"
																	} `}
																>
																	{`${
																		transaction?.type === "credit"
																			? "Earning"
																			: "Withdrawal"
																	}`}
																</span>
															</td>
															<td
																className={`px-6 py-4 text-sm ${
																	transaction?.type === "credit"
																		? "text-[#15803D]"
																		: "text-[#B91C1C]"
																}`}
															>
																{transaction?.type === "credit"
																	? `+ ₹${transaction?.amount?.toFixed(2)}`
																	: `- ₹${transaction?.amount?.toFixed(2)}`}
															</td>
														</tr>
													));
												}
											)}
										</tbody>
									</table>
								</div>
							)
						) : (
							<div className="size-full flex flex-col gap-2 items-center justify-center">
								<ContentLoading />
							</div>
						)}
					</div>
					{hasNextPage && isFetching && (
						<Image
							src="/icons/loading-circle.svg"
							alt="Loading..."
							width={50}
							height={50}
							className="mx-auto invert my-5 mt-10 z-20"
						/>
					)}

					{!isError &&
						!hasNextPage &&
						!isFetching &&
						creatorUser &&
						userTransactions?.pages[0]?.totalTransactions > 4 && (
							<div className="text-center text-gray-500 py-4">
								You have reached the end of the list.
							</div>
						)}

					{hasNextPage && <div ref={ref} className="py-4 w-full" />}

					{isModalOpen && (
						<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
							<div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
								<div className="flex justify-between items-center mb-4">
									<h2 className="text-lg font-semibold">
										Enter Withdrawal Amount
									</h2>
									<button
										className="text-gray-500 text-xl hover:text-gray-700"
										onClick={closeModal}
									>
										&times;
									</button>
								</div>
								<input
									type="text"
									value={withdrawAmount}
									onChange={handleAmountChange}
									placeholder="Enter amount"
									className="p-2 border rounded w-full mb-4"
								/>
								<div className="flex justify-end gap-4 mt-6">
									<Button
										onClick={closeModal}
										className="text-gray-700 border border-gray-300 rounded-full hoverScaleDownEffect"
									>
										Cancel
									</Button>
									<Button
										onClick={handleWithdraw}
										className="text-white bg-black rounded-full hoverScaleDownEffect"
									>
										Confirm
									</Button>
								</div>
							</div>
						</div>
					)}
				</section>
			</div>
		</>
	);
};

export default Withdraw;
