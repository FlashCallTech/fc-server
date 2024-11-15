"use client";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { useToast } from "../ui/use-toast";
import { backendBaseUrl } from "@/lib/utils";
import axios from "axios";
import Loader from "../shared/Loader";

const PaymentSettings = () => {
	const { toast } = useToast();
	const [paymentMethod, setPaymentMethod] = useState<
		"UPI" | "bankTransfer" | ""
	>("");
	const [bankDetails, setBankDetails] = useState({
		upiId: "",
		ifscCode: "",
		accountNumber: "",
	});
	const [initialPaymentMethod, setInitialPaymentMethod] = useState<
		"UPI" | "bankTransfer" | ""
	>("");
	const [initialBankDetails, setInitialBankDetails] = useState({
		upiId: "",
		ifscCode: "",
		accountNumber: "",
	});
	const [isLoading, setIsLoading] = useState(true);
	const [otp, setOtp] = useState<string>("");
	const [showOtp, setShowOtp] = useState<boolean>(false);
	const [otpGenerated, setOtpGenerated] = useState<boolean>(false);
	const [otpSubmitted, setOtpSubmitted] = useState<boolean>(false);
	const [errors, setErrors] = useState({
		upiId: "",
		ifscCode: "",
		accountNumber: "",
	});

	const { currentUser } = useCurrentUsersContext();
	const router = useRouter();

	useEffect(() => {
		const fetchPaymentDetails = async () => {
			const abortController = new AbortController();
			try {
				const response = await fetch(
					`${backendBaseUrl}/paymentSetting/getPaymentSettings/${currentUser?._id}`,
					{
						signal: abortController.signal,
					}
				);
				const result = await response.json();
				if (result.success) {
					const method = result.data.paymentMode === "BANK_TRANSFER" ? "bankTransfer" : "UPI";
					const details = {
						upiId: result.data.upiId || "",
						ifscCode: result.data.bankDetails?.ifsc || "",
						accountNumber: result.data.bankDetails?.accountNumber || "",
					};
					setPaymentMethod(method);
					setBankDetails(details);
					setInitialPaymentMethod(method);
					setInitialBankDetails(details);
				} else {
					console.error(result.message);
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

	function formatToHumanReadable(isoDate: any) {
		const date = new Date(isoDate);

		// Options for formatting date and time
		const options: any = {
			year: 'numeric',
			month: 'long',    // "December"
			day: 'numeric',   // "13"
			hour: '2-digit',  // "04" (12-hour clock)
			minute: '2-digit',// "49"
			second: '2-digit',// "25"
			hour12: true,     // "PM" instead of 24-hour format
		};

		return date.toLocaleString('en-US', options);
	}

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

	const handleChange = async (method: string) => {
		if (bankDetails.accountNumber !== "" || bankDetails.ifscCode !== "" || bankDetails.upiId !== "") setBankDetails(initialBankDetails);
		if ((initialBankDetails.accountNumber === "" || initialBankDetails.ifscCode === "") && method === "bankTransfer") return;
		if (initialBankDetails.upiId === "" && method === "UPI") return;

		const details = {
			method: method==="UPI"? "upi": "banktransfer",
			userId: currentUser?._id
		}

		const response = await axios.post(`${backendBaseUrl}/paymentSetting/updateMethod`, {
			details, // Sending `details` object in the body
		});

		console.log('Response:', response.data);
	}

	const handleSave = async () => {
		let hasError = false;
		const newErrors = {
			upiId: "",
			ifscCode: "",
			accountNumber: "",
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

		if (paymentMethod === "bankTransfer") {
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
		}

		setErrors(newErrors);

		if (!hasError) {
			const paymentData = {
				userId: currentUser?._id,
				paymentMode: paymentMethod === "bankTransfer" ? "BANK_TRANSFER" : "UPI",
				upiId: bankDetails.upiId,
				bankDetails: {
					ifsc: bankDetails.ifscCode,
					accountNumber: bankDetails.accountNumber,
				},
			};

			try {
				setIsLoading(true);
				if (paymentData.paymentMode === 'UPI') {
					if (!otpGenerated) {
						const response = await fetch(`${backendBaseUrl}/paymentSetting/generateVpaOtp`, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({
								userId: currentUser?._id,
								vpa: paymentData.upiId,
							})
						})

						const result = await response.json();
						console.log(result);

						if (!response.ok) {
							toast({
								variant: "destructive",
								title: "Failed",
								description: result.message + " " + formatToHumanReadable(result.retryAfter),
							});
							setIsLoading(false);
							return;
						} else {
							toast({
								variant: "destructive",
								title: "OTP Generated",
							});
							setShowOtp(true);
							setOtpGenerated(true);
							setIsLoading(false);
							return;
						}
					} else {
						const response = await fetch(`${backendBaseUrl}/paymentSetting/verifyVpaOtp`, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({
								userId: currentUser?._id,
								otp,
							})
						})

						const result = await response.json();
						console.log(result);

						if (!response.ok) {
							toast({
								variant: "destructive",
								title: "Failed",
								description: result,
							});
							setIsLoading(false);
							return;
						} else {
							setInitialPaymentMethod('UPI');
							setOtpSubmitted(true);
							setOtpGenerated(false);
							const currentDetails = {
								upiId: bankDetails.upiId,
								ifscCode: initialBankDetails.ifscCode,
								accountNumber: initialBankDetails.accountNumber,
							}
							setInitialBankDetails(currentDetails);
							// setInitialBankDetails()
							toast({
								variant: "destructive",
								title: "Success",
								description: "Payment Details Saved",
							});
							setIsLoading(false);
						}
					}
				}
				else if (paymentData.paymentMode === 'BANK_TRANSFER') {
					const response = await fetch(`${backendBaseUrl}/paymentSetting/verifyBank`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							userId: currentUser?._id,
							bank_account: paymentData.bankDetails.accountNumber,
							ifsc: paymentData.bankDetails.ifsc
						})
					})

					const result = await response.json();
					if (result.data.account_status !== 'VALID') {
						console.error('Something wrong with Bank Details');
						alert("Failed to save payment details.");
						setIsLoading(false);
						return;
					}
					else {
						setInitialPaymentMethod('bankTransfer');
						const currentDetails = {
							upiId: initialBankDetails.upiId,
							ifscCode: result.details.ifsc,
							accountNumber: result.details.bank_account,
						}
						setInitialBankDetails(currentDetails);
						toast({
							variant: "destructive",
							title: "Success",
							description: "Payment Details Saved",
						});
						setIsLoading(false);
					}
				}
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error saving payment details:", error);
				alert("An error occurred while saving the payment details.");
				setIsLoading(false);
			}
		}
	};

	const hasChanges = () => {
		return (
			JSON.stringify(bankDetails) !== JSON.stringify(initialBankDetails)
		);
	};

	console.log("Initial", initialBankDetails);
	console.log("Final", bankDetails);
	console.log("Changes", hasChanges());

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
								onChange={() => { handleChange("UPI"), setPaymentMethod("UPI") }}
								className="mr-2"
							/>
							UPI
						</label>
						<label className="flex text-sm items-center bg-white border rounded-lg p-2">
							<input
								type="radio"
								name="paymentMethod"
								value="bankTransfer"
								checked={paymentMethod === "bankTransfer"}
								onChange={() => { handleChange("bankTransfer"), setPaymentMethod("bankTransfer") }}
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
							{
								otpGenerated && !otpSubmitted &&
								<div className="mt-2">
									<label
										className="block text-sm font-semibold mb-1"
										htmlFor="otp"
									>
										OTP
									</label>
									<input
										id="otp"
										type="text"
										placeholder="Enter OTP"
										onChange={(e) => setOtp(e.target.value)}
										className="w-full border p-2 text-sm rounded-lg"
									/>
								</div>
							}
						</div>
					)}

					{paymentMethod === "bankTransfer" && (
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
						</>
					)}
				</div>
				{
					hasChanges() && <button
						onClick={handleSave}
						className={`w-full py-2 px-4 rounded-lg text-white ${hasChanges()
							? "bg-black hover:bg-gray-900"
							: "bg-gray-400 cursor-not-allowed"
							}`}
					>
						Save
					</button>
				}
			</div>
		</div>
	);
};

export default PaymentSettings;
