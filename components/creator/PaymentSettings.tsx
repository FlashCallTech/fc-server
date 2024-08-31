"use client";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import React, { useEffect, useState, useCallback } from "react";
import Loader from "../shared/Loader";
import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";

const PaymentSettings = () => {
	const [paymentMethod, setPaymentMethod] = useState<
		"UPI" | "BankTransfer" | ""
	>("");
	const [bankDetails, setBankDetails] = useState({
		accountType: "",
		upiId: "",
		ifscCode: "",
		accountNumber: "",
	});
	const [initialPaymentMethod, setInitialPaymentMethod] = useState<
		"UPI" | "BankTransfer" | ""
	>("");
	const [initialBankDetails, setInitialBankDetails] = useState({
		accountType: "",
		upiId: "",
		ifscCode: "",
		accountNumber: "",
	});
	const [isLoading, setIsLoading] = useState(true);
	const [errors, setErrors] = useState({
		upiId: "",
		ifscCode: "",
		accountNumber: "",
		accountType: "",
	});

	const { currentUser } = useCurrentUsersContext();
	const router = useRouter();

	useEffect(() => {
		const fetchPaymentDetails = async () => {
			const abortController = new AbortController();
			try {
				const response = await fetch(
					`/api/v1/creator/get-payment?userId=${currentUser?._id}`,
					{
						signal: abortController.signal,
					}
				);
				if (response.ok) {
					const data = await response.json();
					const method =
						data.paymentMode === "BANK_TRANSFER" ? "BankTransfer" : "UPI";
					const details = {
						upiId: data.upiId || "",
						ifscCode: data.bankDetails?.ifsc || "",
						accountNumber: data.bankDetails?.accountNumber || "",
						accountType: data.bankDetails?.accountType || "",
					};
					setPaymentMethod(method);
					setBankDetails(details);
					setInitialPaymentMethod(method);
					setInitialBankDetails(details);
				} else {
					console.error("Failed to fetch payment details.");
				}
			} catch (error: unknown) {
				if (error instanceof Error) {
					if (error.name !== "AbortError") {
						console.error("Error fetching payment details:", error.message);
					}
				} else {
					console.error("An unexpected error occurred:", error);
				}
			} finally {
				setIsLoading(false);
			}
			return () => abortController.abort();
		};

		if (currentUser?._id) {
			fetchPaymentDetails();
		}
	}, []);

	const isValidUpiId = useCallback(
		(upiId: string) => /^[\w.-]+@[\w.-]+$/.test(upiId),
		[]
	);
	const isValidIfscCode = useCallback(
		(ifscCode: string) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode),
		[]
	);
	const isValidAccountNumber = useCallback(
		(accountNumber: string) => /^\d{9,18}$/.test(accountNumber),
		[]
	);

	const handleSave = async () => {
		let hasError = false;
		const newErrors = {
			upiId: "",
			ifscCode: "",
			accountNumber: "",
			accountType: "",
		};

		if (paymentMethod === "UPI") {
			if (!bankDetails.upiId) {
				newErrors.upiId = "UPI ID is required";
				hasError = true;
			} else if (!isValidUpiId(bankDetails.upiId)) {
				newErrors.upiId = "Not a valid UPI ID";
				hasError = true;
			}
		}

		if (paymentMethod === "BankTransfer") {
			if (!bankDetails.ifscCode) {
				newErrors.ifscCode = "IFSC Code is required";
				hasError = true;
			} else if (!isValidIfscCode(bankDetails.ifscCode)) {
				newErrors.ifscCode = "Not a valid IFSC Code";
				hasError = true;
			}
			if (!bankDetails.accountNumber) {
				newErrors.accountNumber = "Account Number is required";
				hasError = true;
			} else if (!isValidAccountNumber(bankDetails.accountNumber)) {
				newErrors.accountNumber = "Not a valid Account Number";
				hasError = true;
			}
			if (!bankDetails.accountType) {
				newErrors.accountType = "Account Type is required";
				hasError = true;
			}
		}

		setErrors(newErrors);

		if (!hasError) {
			const paymentData = {
				userId: currentUser?._id,
				paymentMode: paymentMethod === "BankTransfer" ? "BANK_TRANSFER" : "UPI",
				upiId: bankDetails.upiId,
				bankDetails: {
					ifsc: bankDetails.ifscCode,
					accountNumber: bankDetails.accountNumber,
					accountType: bankDetails.accountType,
				},
			};

			try {
				const response = await fetch("/api/v1/creator/save-payment", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(paymentData),
				});

				if (response.ok) {
					alert("Payment details saved successfully!");
					// Update initial states to reflect the new saved state
					setInitialPaymentMethod(paymentMethod);
					setInitialBankDetails(bankDetails);
				} else {
					alert("Failed to save payment details.");
				}
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error saving payment details:", error);
				alert("An error occurred while saving the payment details.");
			}
		}
	};

	const hasChanges = () => {
		return (
			paymentMethod !== initialPaymentMethod ||
			JSON.stringify(bankDetails) !== JSON.stringify(initialBankDetails)
		);
	};

	if (isLoading) {
		return <Loader />;
	}

	return (
		<div className="flex flex-col gap-4 bg-gray-100 h-full mx-auto p-4">
			<div className="flex items-start">
				<button onClick={() => router.back()} className="text-xl font-bold l-0">
					&lt;
				</button>
			</div>
			<div className="flex flex-col justify-between bg-gray-100 h-full">
				<div>
					<h2 className="text-xl font-semibold mb-4">Payment Settings</h2>
					<div className="mb-4">
						<label className="flex text-sm items-center bg-white mb-4 border rounded-lg p-2">
							<input
								type="radio"
								name="paymentMethod"
								value="UPI"
								checked={paymentMethod === "UPI"}
								onChange={() => setPaymentMethod("UPI")}
								className="mr-2"
							/>
							UPI
						</label>
						<label className="flex text-sm items-center bg-white border rounded-lg p-2">
							<input
								type="radio"
								name="paymentMethod"
								value="BankTransfer"
								checked={paymentMethod === "BankTransfer"}
								onChange={() => setPaymentMethod("BankTransfer")}
								className="mr-2"
							/>
							Bank Transfer/NEFT
						</label>
					</div>

					{paymentMethod === "UPI" && (
						<div className=" flex flex-col mb-4">
							<label
								className="block text-sm font-semibold mb-1"
								htmlFor="upiId"
							>
								UPI ID
							</label>
							<input
								id="upiId"
								type="text"
								placeholder="Enter UPI ID"
								value={bankDetails.upiId}
								onChange={(e) =>
									setBankDetails({ ...bankDetails, upiId: e.target.value })
								}
								className="w-full border p-2 text-sm rounded-lg"
							/>
							{errors.upiId && (
								<p className="text-red-500 text-sm mt-1">{errors.upiId}</p>
							)}
						</div>
					)}

					{paymentMethod === "BankTransfer" && (
						<>
							<div className="mb-4">
								<label
									className="block text-sm font-semibold mb-1"
									htmlFor="ifscCode"
								>
									IFSC Code
								</label>
								<input
									id="ifscCode"
									type="text"
									placeholder="Enter IFSC Code"
									value={bankDetails.ifscCode}
									onChange={(e) =>
										setBankDetails({
											...bankDetails,
											ifscCode: e.target.value.toUpperCase(),
										})
									}
									className="w-full border p-2 rounded-lg text-sm"
								/>
								{errors.ifscCode && (
									<p className="text-red-500 text-sm mt-1">{errors.ifscCode}</p>
								)}
							</div>
							<div className="mb-4">
								<label
									className="block text-sm font-semibold mb-1"
									htmlFor="accountNumber"
								>
									Account Number
								</label>
								<input
									id="accountNumber"
									type="text"
									placeholder="Enter Account Number"
									value={bankDetails.accountNumber}
									onChange={(e) =>
										setBankDetails({
											...bankDetails,
											accountNumber: e.target.value,
										})
									}
									className="w-full border p-2 rounded-lg text-sm"
								/>
								{errors.accountNumber && (
									<p className="text-red-500 text-sm mt-1">
										{errors.accountNumber}
									</p>
								)}
							</div>
							<div className="mb-4">
								<label
									className="block text-sm font-semibold mb-1"
									htmlFor="accountType"
								>
									Account Type
								</label>
								<select
									id="accountType"
									value={bankDetails.accountType}
									onChange={(e) =>
										setBankDetails({
											...bankDetails,
											accountType: e.target.value,
										})
									}
									className="w-full border p-2 rounded-lg text-sm"
								>
									<option value="">Select Account Type</option>
									<option value="Savings">Savings</option>
									<option value="Current">Current</option>
								</select>
								{errors.accountType && (
									<p className="text-red-500 text-sm mt-1">
										{errors.accountType}
									</p>
								)}
							</div>
						</>
					)}
				</div>
				<button
					disabled={!hasChanges()}
					onClick={handleSave}
					className={`w-full py-2 px-4 rounded-lg text-white ${
						hasChanges()
							? "bg-black hover:bg-gray-900"
							: "bg-gray-400 cursor-not-allowed"
					}`}
				>
					Save
				</button>
			</div>
		</div>
	);
};

export default PaymentSettings;
