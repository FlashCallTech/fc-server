import React, { useEffect, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReportDialog from "../../components/shared/ReportDialog";
import axios from "axios";
import { backendBaseUrl } from "@/lib/utils";
import { clientUser, creatorUser } from "@/types";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import TransactionInvoice from "../creator/transactionInvoice";
import FeedbackCheck from "../feedbacks/FeedbackCheck";
import CallInvoiceModal from "../client/CallInvoiceModal";

const OptionsList = ({
	callId,
	creatorId,
	clientId,
	currentCreator,
	userCall,
}: {
	callId: string;
	currentCreator: clientUser | creatorUser | null;
	creatorId: string;
	clientId: string;
	userCall?: any;
}) => {
	const { userType } = useCurrentUsersContext();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

	const [reportSubmitted, setReportSubmitted] = useState(false);
	const [showInvoice, setShowInvoice] = useState(false);
	const [showTransactionInvoice, setShowTransactionInvoice] = useState(false);
	const [selected, setSelected] = useState<any>(null); // Added

	const handleDropdownOpenChange = (open: boolean) => {
		setIsDropdownOpen(open);
	};

	const handleReportClick = () => {
		setIsDropdownOpen(false);
		setIsReportDialogOpen(true);
	};

	const handleOpenInvoice = (call: any) => {
		setSelected(call); // Set the selected transaction
		setShowInvoice(true);
	};

	const handleCloseInvoice = () => {
		setSelected(null); // Reset transaction data when closing
		setShowInvoice(false);
	};

	const handleOpenTransactionInvoice = (call: any) => {
		setSelected(call); // Set the selected transaction
		setShowTransactionInvoice(true);
	};

	const handleCloseTransactionInvoice = () => {
		setSelected(null); // Reset transaction data when closing
		setShowTransactionInvoice(false);
	};

	useEffect(() => {
		const fetchReportStatus = async () => {
			try {
				const response = await axios.get(
					`${backendBaseUrl}/reports/call/${callId}`
				);
				const reports = response.data;
				if (reports.length > 0) {
					const isReportSubmitted = reports.some(
						(report: any) => report.submittedBy.userId === creatorId
					);
					setReportSubmitted(isReportSubmitted);
				}
			} catch (error) {
				console.error("Error fetching report status:", error);
			}
		};

		fetchReportStatus();
	}, [callId, isReportDialogOpen]);

	return (
		<>
			{/* DropdownMenu with controlled open/close state */}
			<DropdownMenu
				open={isDropdownOpen}
				onOpenChange={handleDropdownOpenChange}
			>
				<DropdownMenuTrigger className="!outline-0 focus:outline-none">
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
							d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
						/>
					</svg>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuLabel className="!sr-only">
						Options List
					</DropdownMenuLabel>
					{userCall.status === "Ended" && <DropdownMenuItem>
						<button
							onClick={() => handleOpenInvoice(userCall)}
							className={`w-full flex items-center justify-start gap-2 ${userType === "creator" ? "text-sm tracking-[0.6px]" : ""}`}
							title="Download Invoice"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 16 16"
								fill="currentColor"
								className="size-4"
							>
								<path
									fillRule="evenodd"
									d="M5.25 2A2.25 2.25 0 0 0 3 4.25v9a.75.75 0 0 0 1.183.613l1.692-1.195 1.692 1.195a.75.75 0 0 0 .866 0l1.692-1.195 1.693 1.195A.75.75 0 0 0 13 13.25v-9A2.25 2.25 0 0 0 10.75 2h-5.5Zm3.03 3.28a.75.75 0 0 0-1.06-1.06L4.97 6.47a.75.75 0 0 0 0 1.06l2.25 2.25a.75.75 0 0 0 1.06-1.06l-.97-.97h1.315c.76 0 1.375.616 1.375 1.375a.75.75 0 0 0 1.5 0A2.875 2.875 0 0 0 8.625 6.25H7.311l.97-.97Z"
									clipRule="evenodd"
								/>
							</svg>
							<span>View Call Invoice</span>
						</button>
					</DropdownMenuItem>
					}
					{userCall.status === "Ended" && <DropdownMenuSeparator />}
					{userType === "creator" && (
						<DropdownMenuItem>
							<button
								onClick={() => handleOpenTransactionInvoice(userCall)}
								className={`w-full flex items-center justify-start gap-2 ${userType === "creator" ? "text-sm tracking-[0.6px]" : ""}`}
								title="Download Invoice"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 16 16"
									fill="currentColor"
									className="size-4"
								>
									<path
										fillRule="evenodd"
										d="M5.25 2A2.25 2.25 0 0 0 3 4.25v9a.75.75 0 0 0 1.183.613l1.692-1.195 1.692 1.195a.75.75 0 0 0 .866 0l1.692-1.195 1.693 1.195A.75.75 0 0 0 13 13.25v-9A2.25 2.25 0 0 0 10.75 2h-5.5Zm3.03 3.28a.75.75 0 0 0-1.06-1.06L4.97 6.47a.75.75 0 0 0 0 1.06l2.25 2.25a.75.75 0 0 0 1.06-1.06l-.97-.97h1.315c.76 0 1.375.616 1.375 1.375a.75.75 0 0 0 1.5 0A2.875 2.875 0 0 0 8.625 6.25H7.311l.97-.97Z"
										clipRule="evenodd"
									/>
								</svg>
								<span>View Transaction Invoice</span>
							</button>
						</DropdownMenuItem>
					)}

					{userType === "creator" && <DropdownMenuSeparator />}
					<DropdownMenuItem
						onClick={handleReportClick}
						disabled={reportSubmitted}
						className={`${reportSubmitted && "cursor-not-allowed"}`}
					>
						<section className={`w-full flex items-center justify-start gap-2 ${userType === "creator" ? "text-sm tracking-[0.6px]" : ""}`}>
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
							{reportSubmitted ? "Reported" : "Report"}
						</section>
					</DropdownMenuItem>

					{userType === "client" && userCall.status === "Ended" && (
						<section className="grid gap-1 pb-1">
							<DropdownMenuSeparator />
							<FeedbackCheck callId={userCall?.callId} />
						</section>
					)}
				</DropdownMenuContent>
			</DropdownMenu>

			{/* ReportDialog with independent state */}
			<ReportDialog
				callId={callId}
				clientId={clientId}
				creatorId={creatorId}
				isOpen={isReportDialogOpen}
				setIsOpen={setIsReportDialogOpen}
				usertype={userType as string}
			/>

			{showInvoice && selected && (
				<CallInvoiceModal
					isOpen={showInvoice}
					onClose={handleCloseInvoice}
					call={selected} // Pass selected transaction
				/>
			)}

			{showTransactionInvoice && selected && (
				<TransactionInvoice
					isOpen={showTransactionInvoice}
					onClose={handleCloseTransactionInvoice}
					call={selected} // Pass selected transaction
				/>
			)}
		</>
	);
};

export default OptionsList;
