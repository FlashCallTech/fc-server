"use client";

import React, { useState, useEffect } from "react";
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

interface Transaction {
	_id: string;
	amount: number;
	createdAt: string;
	type: "credit" | "debit";
	category: string;
}

const Withdraw: React.FC = () => {
	const { creatorUser } = useCurrentUsersContext();
	const { walletBalance } = useWalletBalanceContext();
	const { initiateWithdraw, loadingTransfer } = usePayout();
	const [btn, setBtn] = useState<"all" | "credit" | "debit">("all");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [withdrawAmount, setWithdrawAmount] = useState<string>("");
	const [isStickyVisible, setIsStickyVisible] = useState(false);

	const openModal = () => setIsModalOpen(true);
	const closeModal = () => {
		setWithdrawAmount("");
		setError(null);
		setIsModalOpen(false);
	};

	const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		// Check if input is a valid number
		if (/^\d*$/.test(value)) {
			setWithdrawAmount(value);
			setError(null); // Clear error if the input is valid
		} else {
			setError("Please enter a valid number.");
		}
	};

	const handleWithdraw = () => {
		if (!withdrawAmount) {
			setError("Amount is required.");
			return;
		}

		if (creatorUser?._id && creatorUser?.phone) {
			initiateWithdraw(creatorUser._id, creatorUser.phone, Number(withdrawAmount));
			closeModal();
		}
	};

	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 0) {
				setIsStickyVisible(false);
			} else {
				setIsStickyVisible(true);
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
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
	} = useGetUserTransactionsByType(creatorUser?._id as string, btn);

	useEffect(() => {
		if (inView && hasNextPage && !isFetching) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetching]);

	// Group transactions by date
	const groupTransactionsByDate = (transactionsList: Transaction[]) => {
		return transactionsList.reduce((acc, transaction) => {
			const date = new Date(transaction.createdAt).toLocaleDateString();
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

	return (
		<>
			<section className="flex flex-col pt-3  text-gray-800 w-full h-full rounded-xl ">
				<section className="grid grid-cols-1 items-center sticky top-0 md:top-[76px] z-50 bg-white p-4 ">
					{/* Sticky Balance and Recharge Section */}
					<section
						className={`flex flex-col gap-5 items-center justify-center md:items-start`}
					>
						{/* Balance Section */}
						{isStickyVisible && (
							<div className="w-full flex flex-col items-center justify-center">
								<p>
									Welcome,
									<br />
								</p>
								<p className="font-bold">
									{creatorUser?.firstName} {creatorUser?.lastName}
								</p>
							</div>
						)}

						{/* Recharge Section */}
						<div className="flex flex-col gap-5 w-full items-center justify-center md:items-start">
							<div
								className={`w-[100%] flex justify-between items-center font-normal leading-5 border-[1px] rounded-lg p-3 bg-white shadow ${!isStickyVisible ? "flex-row" : "flex-col"
									} relative`}
							>
								<div
									className={
										!isStickyVisible
											? "flex flex-col items-start pl-1"
											: "flex flex-col items-center"
									}
								>
									<span className={`text-[13px] `}>Wallet Balance</span>
									<p
										className={`text-green-600 ${!isStickyVisible
											? "text-[20px] font-bold"
											: "text-[25px] font-extrabold"
											} ${!isStickyVisible ? "p-0" : "p-2"} `}
									>
										₹ {walletBalance.toFixed(2)}
									</p>
								</div>
								{!isStickyVisible && (
									<Button
										onClick={() =>
											openModal()
										}
										className="right-0 w-auto px-4 py-3 shadow bg-green-600 text-white font-bold leading-4 text-sm rounded-[6px] hover:bg-green-700"
									>
										Withdraw
									</Button>
								)}

							</div>
							{isStickyVisible && (
								<Button
									onClick={() =>
										openModal()
									}
									className="w-full px-4 bg-green-600 text-white font-bold leading-4 text-sm rounded-[6px] hover:bg-green-700"
								>
									Withdraw
								</Button>
							)}
						</div>
					</section>

					{/* Transaction History Section */}
					<section
						className={`w-full ${!isStickyVisible ? "py-4" : "py-2.5 px-4"}`}
					>
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
										className={`capitalize px-5 py-1 border-2 border-black rounded-full ${filter === btn
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
				<ul className="flex flex-col items-center justify-start space-y-4 w-full h-full px-4 py-5 ">
					{!isLoading ? (
						isError || !creatorUser ? (
							<div className="size-full flex flex-col items-center justify-center text-2xl xl:text-2xl font-semibold text-center text-red-500">
								Failed to fetch Transactions
								<span className="text-lg">Please try again later.</span>
							</div>
						) : Object.keys(groupedTransactions).length === 0 ? (
							<p className="size-full flex items-center justify-center text-xl font-semibold text-center text-gray-500">
								{`No transactions Found`}
							</p>
						) : (
							Object.entries(groupedTransactions).map(
								([date, transactions]) => (
									<div
										key={date}
										className="p-4 bg-white rounded-lg shadow w-full animate-enterFromBottom"
									>
										<h3 className="text-base items-start font-normal  text-gray-400">
											{date}
										</h3>
										{transactions.map((transaction) => (
											<li
												key={transaction?._id}
												className="animate-enterFromBottom  flex gap-2 justify-between items-center py-4  bg-white dark:bg-gray-800 border-b-2"
											>
												<div className="flex flex-wrap flex-col items-start justify-center gap-2">
													<p className="font-normal text-xs leading-4">
														Transaction ID{" "}
														<span className="text-sm font-semibold">
															{transaction._id}
														</span>
													</p>
													<p className=" text-gray-400 font-normal text-xs leading-4">
														{new Date(
															transaction.createdAt
														).toLocaleTimeString()}
													</p>
												</div>
												<div className="flex flex-col items-end justify-start gap-2">
													{transaction?.category && (
														<p className="font-normal text-xs text-green-1 whitespace-nowrap">
															{transaction?.category}
														</p>
													)}

													<p
														className={`font-bold text-xs xm:text-sm leading-4 w-fit whitespace-nowrap ${transaction?.type === "credit"
															? "text-green-500"
															: "text-red-500"
															} `}
													>
														{transaction?.type === "credit"
															? `+ ₹${transaction?.amount?.toFixed(2)}`
															: `- ₹${transaction?.amount?.toFixed(2)}`}
													</p>
												</div>
											</li>
										))}
									</div>
								)
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
					userTransactions?.pages[0]?.totalTransactions !== 0 && (
						<div className="text-center text-gray-500 py-4">
							You have reached the end of the list.
						</div>
					)}

				{hasNextPage && <div ref={ref} className=" pt-10 w-full" />}

				{isModalOpen && (
					<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
						<div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
							<h2 className="text-lg font-semibold mb-4">Enter Withdrawal Amount</h2>
							<input
								type="text"
								value={withdrawAmount}
								onChange={handleAmountChange}
								placeholder="Enter amount"
								className="p-2 border rounded w-full mb-4"
							/>
							<div className="flex justify-end gap-4">
								<Button onClick={closeModal} className="bg-gray-300 text-black">Cancel</Button>
								<Button onClick={handleWithdraw} className="bg-green-600 text-white font-bold">
									Confirm
								</Button>
							</div>
						</div>
					</div>
				)}
			</section>
		</>
	);
};

export default Withdraw;
