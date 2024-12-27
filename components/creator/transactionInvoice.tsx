// InvoiceModal.tsx

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { backendBaseUrl } from "@/lib/utils";
import { clientUser } from "@/types";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import axios from "axios";

interface callDetails {
	payoutTransactionId: string,
	payinTransactionId: string
	gstAmt: number;
	commissionAmt: number;
	commissionRate: number;
	amountAdded: number;
	activePg: string;
	pgChargesRate: number;
	pgChargesAmt: number;
}

const TransactionInvoice = ({
	isOpen,
	onClose,
	call,
}: {
	isOpen: any;
	onClose: any;
	call: any;
}) => {
	const [client, setClient] = useState<clientUser>();
	const [callTransaction, setCallTransaction] = useState<callDetails>();
	const [loading, setLoading] = useState<boolean>(true);

	const { creatorUser } = useCurrentUsersContext();
	const modalRef = useRef<HTMLDivElement>(null);

	const commissionAmt = Number((callTransaction?.commissionAmt)?.toFixed(2)) ||
		Number(call?.global ? (call?.amountINR - call?.amountINR * (1 - (call?.commission / 100))).toFixed(2) :
			(call?.amount - call?.amount * (1 - (call?.commission / 100)))) ||
		Number(call?.global ? (call?.amountINR - call?.amountINR * 0.8).toFixed(2) :
			(call?.amount - call?.amount * 0.8));
	const gstCommissionAmt = callTransaction?.gstAmt ?? 0;
	const totalCommissionAmt = Number((commissionAmt + gstCommissionAmt).toFixed(2));
	const amtDue = Number((callTransaction?.amountAdded)?.toFixed(2)) || Number(call?.global ? (call?.amountINR - totalCommissionAmt).toFixed(2) : (call?.amount - totalCommissionAmt).toFixed(2))

	useEffect(() => {
		const fetchClient = async () => {
			try {
				const response = await fetch(
					`${call?.global ? `${backendBaseUrl}/client/getGlobalUserById/${call.creator}` : `${backendBaseUrl}/client/getUser/${call.creator}`}`,
					{
						method: "GET",
						headers: {
							"Content-Type": "application/json",
						},
					}
				);

				const result = await response.json();
				setClient(result);

				const transactionResponse = await axios.get(`${backendBaseUrl}/calls/transaction/getTransaction/${call.callId}`)
				setCallTransaction(transactionResponse.data.callDetails[0]);
			} catch (error) {
				console.log(error);
			} finally {
				setLoading(false);
			}
		};

		fetchClient();
	}, []);

	const handleDownload = async () => {
		try {
			const response = await fetch(
				`${backendBaseUrl}/invoice/creatorInvoiceDownload/${call._id}`
			);

			if (!response.ok) {
				throw new Error("Network response was not ok");
			}

			const blob = await response.blob(); // Get the response as a Blob
			const url = window.URL.createObjectURL(blob); // Create a URL for the Blob
			const a = document.createElement("a"); // Create an anchor element
			a.href = url; // Set the href to the Blob URL
			a.download = `Invoice-${call._id}.pdf`; // Set the filename
			document.body.appendChild(a); // Append to body (required for Firefox)
			a.click(); // Programmatically click the anchor to trigger the download
			a.remove(); // Remove the anchor from the document
			window.URL.revokeObjectURL(url); // Clean up the URL object
		} catch (error) {
			console.error("Error downloading the PDF:", error);
		}
	};

	useEffect(() => {
		// Hide inactive transaction buttons when modal is open
		if (isOpen) {
			document.body.classList.add("hide-inactive-buttons");
		} else {
			document.body.classList.remove("hide-inactive-buttons");
		}

		// Handle clicks outside of the modal
		const handleOutsideClick = (event: MouseEvent) => {
			if (
				modalRef.current &&
				!modalRef.current.contains(event.target as Node)
			) {
				onClose();
			}
		};

		// Add the event listener when modal is open
		if (isOpen) {
			document.addEventListener("mousedown", handleOutsideClick);
		}

		// Clean up the event listener when the modal is closed or unmounted
		return () => {
			document.removeEventListener("mousedown", handleOutsideClick);
		};
	}, [isOpen, onClose]);

	console.log(callTransaction);

	if (!isOpen || !call) return null;

	return (
		<div className="fixed inset-0 top-0 w-full bg-gray-800 bg-opacity-50 flex items-center justify-center z-50 ">
			{loading ? (
				<div className="fixed top-0 left-0 flex justify-center items-center h-screen w-full z-40">
					<Image
						src="/icons/loading-circle.svg"
						alt="Loading..."
						width={50}
						height={50}
						className="mx-auto invert my-5 mt-10 z-20"
					/>
				</div>
			) : (
				<div
					ref={modalRef}
					className="relative bg-white text-sm p-6 shadow-lg w-full max-w-lg max-h-full overflow-y-auto scrollbar-hide"
				>
					<div id="invoice-content" className="space-y-4">
						<div className="text-center border-b pb-4">
							<Image
								src="/icons/logo_new_light.png"
								width={1000}
								height={1000}
								alt="logo"
								className="w-28 h-11 mx-auto mb-2"
							/>
							<div className="text-xl font-bold">FLASHCALL</div>
							<div className="text-md font-semibold">Invoice</div>
						</div>

						<div className="flex justify-between text-sm font-medium text-gray-700">
							<div>Invoice Number: {callTransaction?.payinTransactionId}</div>
							<div>Date: {new Date().toLocaleDateString()}</div>
						</div>

						<div className="border-t pt-4">
							<div className="text-sm font-medium">Bill To:</div>
							{creatorUser?.fullName && (
								<div className="text-sm">
									Customer Name: {creatorUser?.fullName}
								</div>
							)}
							<div className="text-sm">
								Customer Phone Number: {creatorUser?.phone}
							</div>
						</div>

						<table className="w-full border border-gray-300 text-xs text-center mt-4">
							<thead>
								<tr className="bg-gray-100">
									<th className="p-2 border border-gray-300">Description</th>
									<th className="p-2 border border-gray-300">Amount</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td className="p-2 border border-gray-300">
										Total Amount Received
									</td>
									<td className="p-2 border border-gray-300">
										{`${call?.global ? `INR ${call.amountINR.toFixed(2)}` : `INR ${call.amount}`}`}
									</td>
								</tr>
								<tr>
									<td className="p-2 border border-gray-300">{`Payment Gateway Charges (${callTransaction?.pgChargesRate ?? 2.5}%)`}</td>
									<td className="p-2 border border-gray-300">
										{`INR ${callTransaction?.pgChargesAmt}`}
									</td>
								</tr>
								<tr>
									<td className="p-2 border border-gray-300">{`Platform Commission (${callTransaction?.commissionRate ?? 20}%)`}</td>
									<td className="p-2 border border-gray-300">
										{`INR ${commissionAmt}`}
									</td>
								</tr>
								<tr>
									<td className="p-2 border border-gray-300">{`GST (18%) on Commission Amount`}</td>
									<td className="p-2 border border-gray-300">
										{`INR ${gstCommissionAmt}`}
									</td>
								</tr>
								<tr>
									<td className="p-2 border border-gray-300">
										Total Receivable Amount
									</td>
									<td className="p-2 border border-gray-300">
										{`INR ${amtDue}`}
									</td>
								</tr>
							</tbody>
						</table>

						<div className="pt-4 text-sm font-medium">
							<div>Payment Method: Wallet Recharge</div>
							<div>Transaction ID: {callTransaction?.payinTransactionId}</div>
						</div>
						
						<div className="text-xs text-center text-gray-600 pt-2 pb-2">
							Thank you for using our platform!
							<br />
							For assistance, contact us at <a href="mailto:support@flashcall.me">support@flashcall.me</a>
						</div>
					</div>

					<div className="sticky bottom-0 flex justify-end space-x-4 mt-4">
						<button
							onClick={handleDownload}
							className="bg-blue-500 text-white px-4 py-2 rounded shadow hoverScaleDownEffect"
						>
							Download PDF
						</button>
						<button
							onClick={onClose}
							className="bg-gray-400 text-white px-4 py-2 rounded shadow hoverScaleDownEffect"
						>
							Close
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default TransactionInvoice;
