"use client";

import ContentLoading from "@/components/shared/ContentLoading";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useGetUserTransactionsByType } from "@/lib/react-query/queries";
import { formatDateTime } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
interface Transaction {
	_id: string;
	amount: number;
	createdAt: string;
	type: "credit" | "debit";
	category: string;
}

const Transactions = () => {
	const [btn, setBtn] = useState<"all" | "credit" | "debit">("all");
	const { currentUser } = useCurrentUsersContext();

	const { ref, inView } = useInView({
		threshold: 0.1,
		triggerOnce: false,
	});
	const {
		data: transactions,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isError,
		isLoading,
	} = useGetUserTransactionsByType(currentUser?._id as string, btn);

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

	const groupedTransactions = transactions
		? groupTransactionsByDate(
				transactions.pages.flatMap((page) => page.transactions)
		  )
		: {};

	const creatorURL = localStorage.getItem("creatorURL");

	return (
		<>
			{/* Transaction History Section */}
			<section
				className={`sticky top-0 md:top-[76px] bg-white z-30 p-4 flex flex-col items-start justify-start gap-4 w-full h-fit`}
			>
				<section className="flex items-center gap-4">
					<Link
						href={`${creatorURL ? creatorURL : "/home"}`}
						className="text-xl font-bold"
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
					</Link>
					<h1 className="text-3xl font-bold">Transaction History</h1>
				</section>

				<section className="flex space-x-2 text-xs font-bold leading-4 w-fit">
					{["all", "credit", "debit"].map((filter) => (
						<button
							key={filter}
							onClick={() => setBtn(filter as "all" | "credit" | "debit")}
							className={`capitalize text-sm font-medium px-[20px] py-[7px] rounded-3xl border border-gray-300 hoverScaleDownEffect hover:text-white hover:bg-green-1 ${
								filter === btn && "bg-green-1 text-white"
							}`}
						>
							{filter}
						</button>
					))}
				</section>
			</section>

			{/* Transaction History List */}
			<ul className="space-y-4 w-full h-[60vh] px-4 pt-2 pb-7">
				{!isLoading ? (
					isError || !currentUser ? (
						<div className="size-full flex flex-col items-center justify-center text-2xl xl:text-2xl font-semibold text-center text-red-500">
							Failed to fetch Transactions
							<span className="text-lg">Please try again later.</span>
						</div>
					) : Object.keys(groupedTransactions).length === 0 ? (
						<section className="size-full flex flex-col gap-4 items-center justify-center text-xl font-semibold text-center text-gray-500">
							<Image
								src={"/images/noTransaction.png"}
								alt="no transaction"
								width={1000}
								height={1000}
								className="size-[200px] object-contain"
							/>
							<span>No transaction yet</span>
						</section>
					) : (
						Object.entries(groupedTransactions).map(([date, transactions]) => {
							const groupedDate = formatDateTime(new Date(date));
							return (
								<div
									key={date}
									className="p-5 bg-white rounded-lg shadow border border-gray-100 w-full animate-enterFromBottom"
								>
									<h3 className="text-base items-start font-normal  text-gray-400 mb-2">
										{groupedDate.dateOnly}
									</h3>
									{transactions.map((transaction) => (
										<li
											key={transaction?._id}
											className="animate-enterFromBottom  flex gap-2 justify-between items-center py-4  bg-white dark:bg-gray-800 border-t-2 border-gray-100"
										>
											<div className="flex flex-wrap flex-col items-start justify-center gap-2">
												<p className="font-normal text-sm leading-4">
													ID <span className="text-sm">{transaction._id}</span>
												</p>
												<p className=" text-gray-400 font-normal text-xs leading-4">
													{
														formatDateTime(new Date(transaction.createdAt))
															.dateTime
													}
												</p>
											</div>
											<div className="flex flex-col items-end justify-start gap-2">
												{transaction?.category && (
													<p className="font-normal text-xs text-green-1 whitespace-nowrap">
														{transaction?.category}
													</p>
												)}

												<p
													className={`font-bold text-xs xm:text-sm leading-4 w-fit whitespace-nowrap ${
														transaction?.type === "credit"
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
							);
						})
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
				currentUser &&
				transactions?.pages[0]?.totalTransactions !== 0 && (
					<div className="text-center text-gray-500 py-4">
						You have reached the end of the list.
					</div>
				)}

			{hasNextPage && <div ref={ref} className=" pt-10 w-full" />}
		</>
	);
};

export default Transactions;
