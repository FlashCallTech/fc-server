// InvoiceModal.tsx

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { backendBaseUrl } from "@/lib/utils";
import { clientUser } from "@/types";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

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
	const { creatorUser } = useCurrentUsersContext();
	const modalRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const fetchClient = async () => {
			const response = await fetch(
				`${backendBaseUrl}/client/getUser/${call.creator}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			const result = await response.json();
			setClient(result);
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

	if (!isOpen || !call) return null;

	return (
		<div className="fixed inset-0 top-0 w-full bg-gray-800 bg-opacity-50 flex items-center justify-center z-50 ">
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
						<div>Invoice Number: INV-001</div>
						<div>Date: {new Date().toLocaleDateString()}</div>
					</div>

					<div className="border-t pt-4">
						<div className="text-sm font-medium">Bill To:</div>
						{creatorUser?.firstName && (
							<div className="text-sm">
								Customer Name:{" "}
								{creatorUser?.firstName + " " + creatorUser.lastName}
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
									INR {call.amount}
								</td>
							</tr>
							<tr>
								<td className="p-2 border border-gray-300">{`Platform Commission (20%)`}</td>
								<td className="p-2 border border-gray-300">
									INR {(call.amount * 0.2).toFixed(2)}
								</td>
							</tr>
							{/* <tr>
								<td className="p-2 border border-gray-300">{`GST on Commission (18%)`}</td>
								<td className="p-2 border border-gray-300">
									INR {(call.amount * 0.2 * 0.18).toFixed(2)}
								</td>
							</tr> */}
							<tr>
								<td className="p-2 border border-gray-300">
									Total Commission Amount
								</td>
								<td className="p-2 border border-gray-300">
									INR{" "}
									{(call.amount * 0.2).toFixed(2)}
								</td>
							</tr>
						</tbody>
					</table>

					<div className="flex text-sm font-medium pt-4">
						<div>
							<div>{`Subtotal (Commission): INR ${(call.amount * 0.2).toFixed(
								2
							)}`}</div>
							{/* <div>{`GST (18%): INR ${(call.amount * 0.2 * 0.18).toFixed(
								2
							)}`}</div> */}
							<div>
								Total Amount Due: INR{" "}
								{(call.amount * 0.2).toFixed(2)}
							</div>
						</div>
					</div>

					<div className="border-t pt-4 text-sm font-medium">
						<div>Payment Method: Wallet Recharge</div>
						<div>Transaction ID: {call._id}</div>
					</div>

					<div className="text-xs text-gray-600 border-t pt-4 text-center">
						Terms: No taxes are applicable on this transaction.
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
		</div>
	);
};

export default TransactionInvoice;
