// InvoiceModal.tsx

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { backendBaseUrl, getImageSource } from "@/lib/utils";
import { clientUser, creatorUser } from "@/types";
import Loader from "../shared/Loader";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

const CallInvoiceModal = ({
	isOpen,
	onClose,
	call,
}: {
	isOpen: any;
	onClose: any;
	call: any;
}) => {
	const [client, setClient] = useState<clientUser>();
	const [creator, setCreator] = useState<creatorUser>();
	const [loading, setLoading] = useState<boolean>(true);
	const {userType} = useCurrentUsersContext();
	const modalRef = useRef<HTMLDivElement>(null);

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
				const response2 = await fetch(
					`${backendBaseUrl}/creator/getUser/${call.members[0].user_id}`,
					{
						method: "GET",
						headers: {
							"Content-Type": "application/json",
						},
					}
				);
				const result2 = await response2.json();
				setCreator(result2);
			} catch (error) {
				console.log(error);
			} finally {
				setLoading(false);
			}
		};

		fetchClient();
	}, [call]);

	const handleDownload = async () => {
		try {
			setLoading(true);
			const response = userType === "client" ? await fetch(
				`${backendBaseUrl}/invoice/callInvoiceDownload/${call._id}/client`
			) : await fetch(
				`${backendBaseUrl}/invoice/callInvoiceDownload/${call._id}/creator`
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
		} finally {
			setLoading(false);
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

	const imageSrc = getImageSource(creator as creatorUser);

	return (
		<div className="fixed inset-0 top-0 w-full bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
			{loading || !creator || !client ? (
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
					className="relative bg-white p-6 shadow-lg w-full max-w-lg max-h-full overflow-y-auto scrollbar-hide"
				>
					<div id="invoice-content" className="space-y-4">
						<div className="text-center border-b pb-4">
							<Image
								src={imageSrc}
								width={1000}
								height={1000}
								alt="logo"
								className="size-10 mx-auto mb-2"
							/>
							<div className="text-xl font-bold">
								{call.members[0].custom.name}
							</div>
							<div className="text-md font-semibold">Invoice</div>
						</div>

						<div className="flex justify-between text-sm font-medium text-gray-700">
							<div>{`Invoice Number: ${call._id}`}</div>
							<div>Date: {new Date().toLocaleDateString()}</div>
						</div>

						<div className="border-t pt-4">
							<div className="text-sm font-medium">Bill To:</div>
							{client?.fullName && (
								<div className="text-sm">
									Customer Name: {client?.fullName}
								</div>
							)}
							{client?.email && <div className="text-sm">
								Customer Email: {client?.email}
							</div>}
							{client?.phone && <div className="text-sm">
								Customer Phone Number: {client?.phone}
							</div>}
						</div>

						<table className="w-full border border-gray-300 text-xs text-center mt-4">
							<thead>
								<tr className="bg-gray-100">
									<th className="p-2 border border-gray-300">
										Item Description
									</th>
									<th className="p-2 border border-gray-300">Quantity</th>
									<th className="p-2 border border-gray-300">Unit Price</th>
									<th className="p-2 border border-gray-300">Total</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td className="p-2 border border-gray-300">
										Consultation Session
									</td>
									<td className="p-2 border border-gray-300">1</td>
									<td className="p-2 border border-gray-300">
										{` ${userType === "client" ? call.amount : call.amountINR.toFixed(2)}`}
									</td>
									<td className="p-2 border border-gray-300">
										{`${client?.global && userType === "client" ? "$" : "INR"} ${userType === "client" ? call.amount : call.amountINR.toFixed(2)}`}
									</td>
								</tr>
							</tbody>
						</table>

						<div className="flex text-sm font-medium pt-4">
							<div>
								<div>{`Subtotal: ${client?.global && userType === "client" ? "$" : "INR"} ${userType === "client" ? call.amount : call.amountINR.toFixed(2)}`}</div>
								<div>{`Total Amount Due: ${client?.global && userType === "client" ? "$" : "INR"} ${userType === "client" ? call.amount : call.amountINR.toFixed(2)}`}</div>
							</div>
						</div>

						<div className="border-t pt-4 text-sm font-medium">
							<div>Payment Method: Wallet Recharge</div>
							<div>Call ID: {call._id}</div>
						</div>

						<div className="text-xs text-gray-600 border-t pt-4 text-center">
							Terms: No taxes are applicable on this transaction.
						</div>
						<div className="text-xs text-center text-gray-600 pt-2 pb-2">
							Thank you for your consultation!
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

export default CallInvoiceModal;
