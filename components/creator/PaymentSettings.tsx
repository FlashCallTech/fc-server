"use client";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { useToast } from "../ui/use-toast";
import { backendBaseUrl } from "@/lib/utils";
import axios from "axios";
import Loader from "../shared/Loader";
import AddBankAccountModal from "./AddBankAccountModal";
import AddUPIModal from "./AddUPIModal";
import ConfirmationAlert from "../alerts/ConfirmationAlert";
import PaymentMethodModal from "./NewAccountModal";


interface BankDetails {
	ifsc: string;
	accountNumber: string;
	name: string;
	bankName: string;
}

interface PaymentDetails {
	userId: string;
	paymentMode: "BANK_TRANSFER" | string; // Adjust if there are other modes
	upiId: string | null;
	bankDetails: BankDetails;
}

const PaymentSettings = () => {
	const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
	const [isUPIModalOpen, setIsUPIModalOpen] = useState(false);
	const [showModal, setShowModal] = useState<boolean>(false);
	const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
	const [saved, setSaved] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isPageLoading, setIsPageLoading] = useState(true);
	const [details, setDetails] = useState<PaymentDetails>();
	const [otp, setOtp] = useState<string>("");
	const [otpGenerated, setOtpGenerated] = useState<boolean>(false);
	const [otpSubmitted, setOtpSubmitted] = useState<boolean>(false);
	const [paymentMethod, setPaymentMethod] = useState<"UPI" | "bankTransfer" | "">("");
	const [initialPaymentMethod, setInitialPaymentMethod] = useState<"UPI" | "bankTransfer" | "">("");
	const [bankDetails, setBankDetails] = useState({
		upiId: "",
		ifscCode: "",
		accountNumber: "",
	});
	const [initialBankDetails, setInitialBankDetails] = useState({
		upiId: "",
		ifscCode: "",
		accountNumber: "",
	});
	const [errors, setErrors] = useState({
		upiId: "",
		ifscCode: "",
		accountNumber: "",
	});

	const { toast } = useToast();
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
					setSaved(true);
					setDetails(result.data);
					const method =
						result.data.paymentMode === "BANK_TRANSFER"
							? "bankTransfer"
							: "UPI";
					const details = {
						upiId: result.data.upiId || "",
						ifscCode: result.data.bankDetails?.ifsc || "",
						accountNumber: result.data.bankDetails?.accountNumber || "",
					};
					setPaymentMethod(method);
					setInitialPaymentMethod(method);
					setBankDetails(details);
					setInitialBankDetails(details);
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
				setIsPageLoading(false);
			}
			return () => abortController.abort();
		};

		if (currentUser?._id) {
			fetchPaymentDetails();
		}
	}, [currentUser]);

	const handleResize = () => {
		if (window.innerWidth < 1024) {
			setErrors({
				upiId: "",
				ifscCode: "",
				accountNumber: "",
			});
			setIsAddBankModalOpen(false);
			setIsUPIModalOpen(false);
		}
	};

	useEffect(() => {
		// Call on initial render
		handleResize();

		// Add event listener for resize
		window.addEventListener("resize", handleResize);

		// Clean up the event listener when component unmounts
		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	function formatToHumanReadable(isoDate: any) {
		const date = new Date(isoDate);

		// Options for formatting date and time
		const options: any = {
			year: "numeric",
			month: "long", // "December"
			day: "numeric", // "13"
			hour: "2-digit", // "04" (12-hour clock)
			minute: "2-digit", // "49"
			second: "2-digit", // "25"
			hour12: true, // "PM" instead of 24-hour format
		};

		return date.toLocaleString("en-US", options);
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

	const handleOpenModal = (): void => {
		setShowModal(true);
	};

	const handleCloseModal = (): void => {
		setShowModal(false);
	};

	const resetStates = () => {
		setErrors({
			upiId: "",
			ifscCode: "",
			accountNumber: "",
		});
	}

	const handleChange = async (method: string) => {
		if (
			bankDetails.accountNumber !== "" ||
			bankDetails.ifscCode !== "" ||
			bankDetails.upiId !== ""
		)
			setBankDetails(initialBankDetails);
		if (
			(initialBankDetails.accountNumber === "" ||
				initialBankDetails.ifscCode === "") &&
			method === "bankTransfer"
		)
			return;
		if (initialBankDetails.upiId === "" && method === "UPI") return;

		const details = {
			method: method === "UPI" ? "upi" : "banktransfer",
			userId: currentUser?._id,
		};

		const response = await axios.post(
			`${backendBaseUrl}/paymentSetting/updateMethod`,
			{
				details, // Sending `details` object in the body
			}
		);

		if (response.status === 200) {
			handleOpenModal();
		}
	};

	const handleSaveUPI = async () => {
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

		setErrors(newErrors);

		if (!hasError) {
			const paymentData = {
				userId: currentUser?._id,
				paymentMode: "UPI",
				upiId: bankDetails.upiId,
				bankDetails: {
					ifsc: bankDetails.ifscCode,
					accountNumber: bankDetails.accountNumber,
				},
			};

			try {
				setIsLoading(true);
				if (!otpGenerated) {
					const response = await fetch(
						`${backendBaseUrl}/paymentSetting/generateVpaOtp`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								userId: currentUser?._id,
								vpa: paymentData.upiId,
							}),
						}
					);

					const result = await response.json();
					console.log(result);

					if (!response.ok) {
						toast({
							variant: "destructive",
							title: "Failed",
							description: result.message + (result?.retryAfter ? " " + formatToHumanReadable(result.retryAfter) : ""),
							toastStatus: "negative",
						});
						setIsUPIModalOpen(false);
						return;
					} else {
						toast({
							variant: "destructive",
							title: "OTP Generated",
							toastStatus: "positive",
						});
						setOtpGenerated(true);
						return;
					}
				} else {
					const response = await fetch(
						`${backendBaseUrl}/paymentSetting/verifyVpaOtp`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								userId: currentUser?._id,
								otp,
							}),
						}
					);

					const result = await response.json();

					if (!response.ok) {
						toast({
							variant: "destructive",
							title: "Failed",
							description: result,
							toastStatus: "negative",
						});
						setIsAddBankModalOpen(false);
						setOtpGenerated(false)
						return;
					} else {
						setInitialPaymentMethod("UPI");
						setOtpSubmitted(true);
						setSaved(true);
						setOtpGenerated(false);
						const currentDetails = {
							upiId: bankDetails.upiId,
							ifscCode: initialBankDetails.ifscCode,
							accountNumber: initialBankDetails.accountNumber,
						};
						setInitialBankDetails(currentDetails);
						// setInitialBankDetails()
						toast({
							variant: "destructive",
							title: "Success",
							description: "Payment Details Saved",
							toastStatus: "positive",
						});
						setIsUPIModalOpen(false);
					}
				}
			} catch (error) {
				console.log(error)
			} finally {
				setIsLoading(false);
				setOtpSubmitted(false);
			}
		};
	}


	const handleSaveBank = async () => {
		let hasError = false;
		const newErrors = {
			upiId: "",
			ifscCode: "",
			accountNumber: "",
		};

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
				paymentMode: "BANK_TRANSFER",
				upiId: bankDetails.upiId,
				bankDetails: {
					ifsc: bankDetails.ifscCode,
					accountNumber: bankDetails.accountNumber,
				},
			};

			try {
				setIsLoading(true);

				const response = await fetch(
					`${backendBaseUrl}/paymentSetting/verifyBank`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							userId: currentUser?._id,
							bank_account: paymentData.bankDetails.accountNumber,
							ifsc: paymentData.bankDetails.ifsc,
						}),
					}
				);

				const result = await response.json();
				if (result.data.account_status !== "VALID") {
					console.error("Something wrong with Bank Details");
					alert("Failed to save payment details.");
					setIsLoading(false);
					setIsAddBankModalOpen(false);
					setIsUPIModalOpen(false);
					return;
				} else {
					setInitialPaymentMethod("bankTransfer");
					handleOpenModal();
					const currentDetails = {
						upiId: initialBankDetails.upiId,
						ifscCode: result.details.ifsc,
						accountNumber: result.details.bank_account,
					};
					setInitialBankDetails(currentDetails);
					toast({
						variant: "destructive",
						title: "Success",
						description: "Payment Details Saved",
						toastStatus: "positive",
					});
					console.log(result);
					const newBankDetails = {
						ifsc: result.details.ifsc,
						accountNumber: result.details.bank_account,
						name: result.data.name_at_bank,
						bankName: result.data.bank_name,
					};
					setDetails((prevDetails) => ({
						...prevDetails,
						bankDetails: newBankDetails,
						userId: prevDetails?.userId ?? "",
						paymentMode: prevDetails?.paymentMode ?? "BANK_TRANSFER",
						upiId: prevDetails?.upiId ?? null,
					}));
					setSaved(true);
					setIsLoading(false);
					setIsAddBankModalOpen(false);
					setIsUPIModalOpen(false);

				}
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error saving payment details:", error);
				alert("An error occurred while saving the payment details.");
				setIsLoading(false);
				setIsAddBankModalOpen(false);
				setIsUPIModalOpen(false);
			}
		}
	};

	const hasChanges = () => {
		return JSON.stringify(bankDetails) !== JSON.stringify(initialBankDetails);
	};

	if (isPageLoading) {
		return <Loader />;
	}

	return (
		<div className="size-full">
			<div className="lg:hidden flex flex-col gap-4 bg-gray-100 h-full mx-auto p-4">
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
									onChange={() => {
										handleChange("UPI"), setPaymentMethod("UPI");
									}}
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
									onChange={() => {
										handleChange("bankTransfer"),
											setPaymentMethod("bankTransfer");
									}}
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
								{otpGenerated && !otpSubmitted && (
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
								)}
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
					{hasChanges() && (
						<button
							onClick={paymentMethod === "UPI" ? handleSaveUPI : handleSaveBank}
							className={`w-full py-2 px-4 rounded-lg text-white ${hasChanges()
								? "bg-black hover:bg-gray-900"
								: "bg-gray-400 cursor-not-allowed"
								}`}
						>
							{isLoading ? (paymentMethod === "UPI" ? (otpGenerated ? "Submiting OTP..." : "Sending OTP...") : "Saving...") : (paymentMethod === "UPI" ? (otpGenerated ? "Submit OTP" : "Send OTP") : "Save")}
						</button>
					)}
				</div>
			</div>
			{/* new Design */}
			<div className="hidden lg:block size-full">
				{saved ? (
					<div className="flex flex-col gap-8 size-full justify-start text-base p-8">
						{/* Bank Section */}
						<div className="bg-white w-[60%] border-[1px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] bg-gradient-to-t from-[rgba(0,0,0,0.001)] to-[rgba(0,0,0,0.001)] text-[#6B7280] h-fit gap-6 flex flex-col p-6 rounded-lg">
							<label className={`flex flex-col gap-6 ${details?.bankDetails ? "hover:cursor-pointer" : ""}`}>
								<section className="flex justify-between">
									<div className="flex gap-3 items-center">
										<input
											type="radio"
											name="accountType"
											checked={paymentMethod === "bankTransfer"}
											className={`${details?.bankDetails ? "" : "hidden"}`}
											onChange={() => {
												handleChange("bankTransfer"), setPaymentMethod("bankTransfer");
											}}
										/>
										<div className="flex gap-2">
											<span className="font-semibold text-black">
												Bank Account Details
											</span>
											{paymentMethod === "bankTransfer" &&
												<span className="text-black">
													{`(Default)`}
												</span>
											}
										</div>
									</div>
									{details?.bankDetails && (
										<button onClick={() => {
											resetStates()
											setIsAddBankModalOpen(true)
										}}
											className="flex gap-3 text-sm items-center rounded-full bg-black text-white px-4 py-2 hoverScaleDownEffect">
											<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="16" height="16" viewBox="0 0 16 16"><defs><clipPath id="master_svg0_3_05263"><rect x="0" y="0" width="16" height="16" rx="0" /></clipPath></defs><g clipPath="url(#master_svg0_3_05263)"><g transform="matrix(1,0,0,-1,0,32.68752670288086)"><g><path d="M14.8955,31.65626335144043Q14.3274,32.18756335144043,13.6331,32.18756335144043Q12.9389,32.18756335144043,12.3708,31.65626335144043L11.4241,30.71876335144043L14.5168,27.65626335144043L15.4635,28.59376335144043Q16,29.15626335144043,16,29.84376335144043Q16,30.53126335144043,15.4635,31.09376335144043L14.8955,31.65626335144043ZM5.42801,24.78126335144043Q5.14398,24.50001335144043,5.01775,24.09376335144043L4.07101,21.34376335144043Q3.94477,20.90626335144043,4.26035,20.56251335144043Q4.6075,20.25001335144043,5.04931,20.37501335144043L7.85799,21.31251335144043Q8.23669,21.43751335144043,8.52071,21.71876335144043L13.8225,26.96876335144043L10.7298,30.03126335144043L5.42801,24.78126335144043ZM3.02959,30.34376335144043Q1.7357,30.31256335144043,0.883629,29.46876335144043Q0.0315582,28.624963351440428,0,27.34376335144043L0,19.34376335144043Q0.0315582,18.06251335144043,0.883629,17.21876335144043Q1.7357,16.37501335144043,3.02959,16.34376335144043L11.1085,16.34376335144043Q12.4024,16.37501335144043,13.2544,17.21876335144043Q14.1065,18.06251335144043,14.1381,19.34376335144043L14.1381,22.34376335144043Q14.1381,22.78126335144043,13.854,23.06251335144043Q13.57,23.34376335144043,13.1282,23.34376335144043Q12.6864,23.34376335144043,12.4024,23.06251335144043Q12.1183,22.78126335144043,12.1183,22.34376335144043L12.1183,19.34376335144043Q12.1183,18.90626335144043,11.8343,18.62501335144043Q11.5503,18.34376335144043,11.1085,18.34376335144043L3.02959,18.34376335144043Q2.58777,18.34376335144043,2.30375,18.62501335144043Q2.01972,18.90626335144043,2.01972,19.34376335144043L2.01972,27.34376335144043Q2.01972,27.78126335144043,2.30375,28.06256335144043Q2.58777,28.34376335144043,3.02959,28.34376335144043L6.05917,28.34376335144043Q6.50099,28.34376335144043,6.78501,28.624963351440428Q7.06903,28.90626335144043,7.06903,29.34376335144043Q7.06903,29.78126335144043,6.78501,30.06256335144043Q6.50099,30.34376335144043,6.05917,30.34376335144043L3.02959,30.34376335144043Z" fill="currentColor" fillOpacity="1" /></g></g></g></svg>
											<span>Edit</span>
										</button>
									)}
								</section>
								{details?.bankDetails ? (
									<section className="flex text-sm flex-col gap-3 text-[#4B5563] p-4 rounded-lg border-[1px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] bg-gradient-to-t from-[rgba(0,0,0,0.001)] to-[rgba(0,0,0,0.001)]">
										<div className="flex justify-between">
											<span>Account Holder</span>
											<span className="font-medium text-[#111827]">{details?.bankDetails.name}</span>
										</div>
										<div className="flex justify-between">
											<span>Bank Name</span>
											<span className="font-medium text-[#111827]">{details?.bankDetails.bankName}</span>
										</div>
										<div className="flex justify-between">
											<span>Account Number</span>
											<span className="font-medium text-[#111827]">{details?.bankDetails.accountNumber}</span>
										</div>
										<div className="flex justify-between">
											<span>IFSC Code</span>
											<span className="font-medium text-[#111827]">{details?.bankDetails.ifsc}</span>
										</div>
									</section>
								) : (
									<section className="p-8 border-2 border-spacing-4 border-dotted border-gray-300 rounded-lg flex flex-col items-center gap-6">
										<div className="p-5 bg-gray-200 rounded-full flex justify-center items-center">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="21"
												height="24"
												viewBox="0 0 21 24"
												fill="none"
											>
												<g transform="matrix(1,0,0,-1,0,46.03125)">
													<path
														d="M0,41.765625Q0.046875,42.703125,0.65625,43.359425Q1.3125,43.968725,2.25,44.015625L6.75,44.015625Q7.6875,43.968725,8.34375,43.359425Q8.95312,42.703125,9,41.765625L9,37.265625Q8.95312,36.328125,8.34375,35.671825Q7.6875,35.062525,6.75,35.015625L2.25,35.015625Q1.3125,35.062525,0.65625,35.671825Q0.046875,36.328125,0,37.265625L0,41.765625ZM3,41.015625L3,38.015625L3,41.015625L3,38.015625L6,38.015625L6,41.015625L3,41.015625ZM0,29.765625Q0.046875,30.703125,0.65625,31.359375Q1.3125,31.968745,2.25,32.015625L6.75,32.015625Q7.6875,31.968745,8.34375,31.359375Q8.95312,30.703125,9,29.765625L9,25.265625Q8.95312,24.328125,8.34375,23.671875Q7.6875,23.0625,6.75,23.015625L2.25,23.015625Q1.3125,23.0625,0.65625,23.671875Q0.046875,24.328125,0,25.265625L0,29.765625ZM3,29.015625L3,26.015625L3,29.015625L3,26.015625L6,26.015625L6,29.015625L3,29.015625ZM14.25,44.015625L18.75,44.015625L14.25,44.015625L18.75,44.015625Q19.6875,43.968725,20.3438,43.359425Q20.9531,42.703125,21,41.765625L21,37.265625Q20.9531,36.328125,20.3438,35.671825Q19.6875,35.062525,18.75,35.015625L14.25,35.015625Q13.3125,35.062525,12.6562,35.671825Q12.0469,36.328125,12,37.265625L12,41.765625Q12.0469,42.703125,12.6562,43.359425Q13.3125,43.968725,14.25,44.015625ZM18,41.015625L15,41.015625L18,41.015625L15,41.015625L15,38.015625L18,38.015625L18,41.015625ZM12,31.265625Q12.0469,31.968745,12.75,32.015625L15.75,32.015625Q16.4531,31.968745,16.5,31.265625Q16.5469,30.562505,17.25,30.515625L18.75,30.515625Q19.4531,30.562505,19.5,31.265625Q19.5469,31.968745,20.25,32.015625Q20.9531,31.968745,21,31.265625L21,26.765625Q20.9531,26.062505,20.25,26.015625L17.25,26.015625Q16.5469,26.062505,16.5,26.765625Q16.4531,27.468745,15.75,27.515625Q15.0469,27.468745,15,26.765625L15,23.765625Q14.9531,23.0625,14.25,23.015625L12.75,23.015625Q12.0469,23.0625,12,23.765625L12,31.265625ZM17.25,23.015625Q16.5469,23.0625,16.5,23.765625Q16.5469,24.468745,17.25,24.515625Q17.9531,24.468745,18,23.765625Q17.9531,23.0625,17.25,23.015625ZM20.25,23.015625Q19.5469,23.0625,19.5,23.765625Q19.5469,24.468745,20.25,24.515625Q20.9531,24.468745,21,23.765625Q20.9531,23.0625,20.25,23.015625Z"
														fill="#9CA3AF"
													/>
												</g>
											</svg>
										</div>
										<h2 className="font-medium text-center">No Bank Account Added</h2>
										<p className="text-sm text-gray-500 text-center">
											Add your Bank Account to receive instant payments directly to your bank
											account
										</p>
										<button
											onClick={() => {
												resetStates()
												setIsAddBankModalOpen(true)
											}}
											className="flex text-sm items-center gap-2 bg-black text-white rounded-full px-6 py-2 hoverScaleDownEffect"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="14"
												height="16"
												viewBox="0 0 14 16"
												fill="none"
											>
												<line
													x1="7"
													y1="4"
													x2="7"
													y2="12"
													stroke="white"
													strokeWidth="2"
													strokeLinecap="round"
												/>
												<line
													x1="3"
													y1="8"
													x2="11"
													y2="8"
													stroke="white"
													strokeWidth="2"
													strokeLinecap="round"
												/>
											</svg>
											<span>Add Bank Account</span>
										</button>
									</section>
								)}
							</label>
						</div>
						{/* UPI Section */}
						<div className="bg-white border-[1px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] bg-gradient-to-t from-[rgba(0,0,0,0.001)] to-[rgba(0,0,0,0.001)] text-[#6B7280] w-[60%] h-fit gap-6 flex flex-col p-6 rounded-lg">
							<label className={`flex flex-col gap-6 ${details?.upiId ? "hover:cursor-pointer" : ""}`}>
								<section className="flex justify-between">
									<div className="flex items-center gap-3">
										<input
											type="radio"
											name="accountType"
											checked={paymentMethod === "UPI"}
											className={`${initialBankDetails?.upiId ? "" : "hidden"}`}
											onChange={() => {
												handleChange("UPI"), setPaymentMethod("UPI");
											}}
										/>
										<div className="flex gap-2">
											<span className="font-semibold text-black">
												UPI Details
											</span>
											{paymentMethod === "UPI" &&
												<span className="text-black">
													{`(Default)`}
												</span>
											}
										</div>
									</div>
									{initialBankDetails?.upiId && (
										<button onClick={() => {
											resetStates()
											setIsUPIModalOpen(true)
										}}
											className="flex gap-3 text-sm items-center rounded-full px-4 py-2 bg-black text-white hoverScaleDownEffect"
										>
											<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="16" height="16" viewBox="0 0 16 16"><defs><clipPath id="master_svg0_3_05263"><rect x="0" y="0" width="16" height="16" rx="0" /></clipPath></defs><g clipPath="url(#master_svg0_3_05263)"><g transform="matrix(1,0,0,-1,0,32.68752670288086)"><g><path d="M14.8955,31.65626335144043Q14.3274,32.18756335144043,13.6331,32.18756335144043Q12.9389,32.18756335144043,12.3708,31.65626335144043L11.4241,30.71876335144043L14.5168,27.65626335144043L15.4635,28.59376335144043Q16,29.15626335144043,16,29.84376335144043Q16,30.53126335144043,15.4635,31.09376335144043L14.8955,31.65626335144043ZM5.42801,24.78126335144043Q5.14398,24.50001335144043,5.01775,24.09376335144043L4.07101,21.34376335144043Q3.94477,20.90626335144043,4.26035,20.56251335144043Q4.6075,20.25001335144043,5.04931,20.37501335144043L7.85799,21.31251335144043Q8.23669,21.43751335144043,8.52071,21.71876335144043L13.8225,26.96876335144043L10.7298,30.03126335144043L5.42801,24.78126335144043ZM3.02959,30.34376335144043Q1.7357,30.31256335144043,0.883629,29.46876335144043Q0.0315582,28.624963351440428,0,27.34376335144043L0,19.34376335144043Q0.0315582,18.06251335144043,0.883629,17.21876335144043Q1.7357,16.37501335144043,3.02959,16.34376335144043L11.1085,16.34376335144043Q12.4024,16.37501335144043,13.2544,17.21876335144043Q14.1065,18.06251335144043,14.1381,19.34376335144043L14.1381,22.34376335144043Q14.1381,22.78126335144043,13.854,23.06251335144043Q13.57,23.34376335144043,13.1282,23.34376335144043Q12.6864,23.34376335144043,12.4024,23.06251335144043Q12.1183,22.78126335144043,12.1183,22.34376335144043L12.1183,19.34376335144043Q12.1183,18.90626335144043,11.8343,18.62501335144043Q11.5503,18.34376335144043,11.1085,18.34376335144043L3.02959,18.34376335144043Q2.58777,18.34376335144043,2.30375,18.62501335144043Q2.01972,18.90626335144043,2.01972,19.34376335144043L2.01972,27.34376335144043Q2.01972,27.78126335144043,2.30375,28.06256335144043Q2.58777,28.34376335144043,3.02959,28.34376335144043L6.05917,28.34376335144043Q6.50099,28.34376335144043,6.78501,28.624963351440428Q7.06903,28.90626335144043,7.06903,29.34376335144043Q7.06903,29.78126335144043,6.78501,30.06256335144043Q6.50099,30.34376335144043,6.05917,30.34376335144043L3.02959,30.34376335144043Z" fill="currentColor" fillOpacity="1" /></g></g></g></svg>
											<span>Edit</span>
										</button>
									)}
								</section>
								{initialBankDetails?.upiId ? (
									<section className="flex flex-col gap-3 text-[#4B5563] p-4 rounded-lg border-[1px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] bg-gradient-to-t from-[rgba(0,0,0,0.001)] to-[rgba(0,0,0,0.001)]">
										<div className="flex text-sm justify-between">
											<span>UPI ID</span>
											<span className="font-medium text-[#111827]">{initialBankDetails?.upiId}</span>
										</div>
									</section>
								) : (
									<section className="p-8 border-2 border-spacing-4 border-dotted border-gray-300 rounded-lg flex flex-col items-center gap-6">
										<div className="p-[21px] bg-gray-200 rounded-full flex justify-center items-center">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="21"
												height="24"
												viewBox="0 0 21 24"
												fill="none"
											>
												<g transform="matrix(1,0,0,-1,0,46.03125)">
													<path
														d="M0,41.765625Q0.046875,42.703125,0.65625,43.359425Q1.3125,43.968725,2.25,44.015625L6.75,44.015625Q7.6875,43.968725,8.34375,43.359425Q8.95312,42.703125,9,41.765625L9,37.265625Q8.95312,36.328125,8.34375,35.671825Q7.6875,35.062525,6.75,35.015625L2.25,35.015625Q1.3125,35.062525,0.65625,35.671825Q0.046875,36.328125,0,37.265625L0,41.765625ZM3,41.015625L3,38.015625L3,41.015625L3,38.015625L6,38.015625L6,41.015625L3,41.015625ZM0,29.765625Q0.046875,30.703125,0.65625,31.359375Q1.3125,31.968745,2.25,32.015625L6.75,32.015625Q7.6875,31.968745,8.34375,31.359375Q8.95312,30.703125,9,29.765625L9,25.265625Q8.95312,24.328125,8.34375,23.671875Q7.6875,23.0625,6.75,23.015625L2.25,23.015625Q1.3125,23.0625,0.65625,23.671875Q0.046875,24.328125,0,25.265625L0,29.765625ZM3,29.015625L3,26.015625L3,29.015625L3,26.015625L6,26.015625L6,29.015625L3,29.015625ZM14.25,44.015625L18.75,44.015625L14.25,44.015625L18.75,44.015625Q19.6875,43.968725,20.3438,43.359425Q20.9531,42.703125,21,41.765625L21,37.265625Q20.9531,36.328125,20.3438,35.671825Q19.6875,35.062525,18.75,35.015625L14.25,35.015625Q13.3125,35.062525,12.6562,35.671825Q12.0469,36.328125,12,37.265625L12,41.765625Q12.0469,42.703125,12.6562,43.359425Q13.3125,43.968725,14.25,44.015625ZM18,41.015625L15,41.015625L18,41.015625L15,41.015625L15,38.015625L18,38.015625L18,41.015625ZM12,31.265625Q12.0469,31.968745,12.75,32.015625L15.75,32.015625Q16.4531,31.968745,16.5,31.265625Q16.5469,30.562505,17.25,30.515625L18.75,30.515625Q19.4531,30.562505,19.5,31.265625Q19.5469,31.968745,20.25,32.015625Q20.9531,31.968745,21,31.265625L21,26.765625Q20.9531,26.062505,20.25,26.015625L17.25,26.015625Q16.5469,26.062505,16.5,26.765625Q16.4531,27.468745,15.75,27.515625Q15.0469,27.468745,15,26.765625L15,23.765625Q14.9531,23.0625,14.25,23.015625L12.75,23.015625Q12.0469,23.0625,12,23.765625L12,31.265625ZM17.25,23.015625Q16.5469,23.0625,16.5,23.765625Q16.5469,24.468745,17.25,24.515625Q17.9531,24.468745,18,23.765625Q17.9531,23.0625,17.25,23.015625ZM20.25,23.015625Q19.5469,23.0625,19.5,23.765625Q19.5469,24.468745,20.25,24.515625Q20.9531,24.468745,21,23.765625Q20.9531,23.0625,20.25,23.015625Z"
														fill="#9CA3AF"
													/>
												</g>
											</svg>
										</div>
										<h2 className="text-base font-medium text-center">No UPI ID Added</h2>
										<p className="text-sm text-gray-500 text-center">
											Add your UPI ID to receive instant payments directly to your bank
											account
										</p>
										<button
											onClick={() => {
												resetStates()
												setIsUPIModalOpen(true)
											}}
											className="flex items-center text-sm gap-2 bg-black text-white rounded-lg px-6 py-2 hoverScaleDownEffect"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="14"
												height="16"
												viewBox="0 0 14 16"
												fill="none"
											>
												<line
													x1="7"
													y1="4"
													x2="7"
													y2="12"
													stroke="white"
													strokeWidth="2"
													strokeLinecap="round"
												/>
												<line
													x1="3"
													y1="8"
													x2="11"
													y2="8"
													stroke="white"
													strokeWidth="2"
													strokeLinecap="round"
												/>
											</svg>
											<span>Add UPI ID</span>
										</button>
									</section>
								)}
							</label>
						</div>
					</div>
				) : (
					<div className="flex size-full justify-start text-base bg-[#F9FAFB] p-8">
						<div className="flex flex-col h-fit gap-6 bg-white p-6 w-[60%] rounded-lg">
							<section className="p-8 border-2 border-spacing-4 border-dotted border-gray-300 justify-center rounded-lg bg-[#F9FAFB] flex flex-col gap-6">
								<div className="flex justify-center">
									<div className="flex justify-center items-center p-[21.5px] bg-[#F3F4F6] rounded-full">
										<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="24" height="24" viewBox="0 0 24 24"><defs><clipPath id="master_svg0_50_3829"><rect x="0" y="0" width="24" height="24" rx="0" /></clipPath></defs><g clipPath="url(#master_svg0_50_3829)"><g transform="matrix(1,0,0,-1,0,49.03124237060547)"><g><path d="M11.402823981070519,48.375021185302735L1.0643599810705187,43.875021185302735L11.402823981070519,48.375021185302735L1.0643599810705187,43.875021185302735Q0.04897598107051848,43.359421185302736,0.2335911810705185,42.234421185302736Q0.5105139810705185,41.109421185302736,1.6643639810705184,41.015621185302734L1.6643639810705184,40.640621185302734Q1.7566639810705185,39.609421185302736,2.7720539810705187,39.515621185302734L21.23362398107052,39.515621185302734Q22.24902398107052,39.609421185302736,22.34132398107052,40.640621185302734L22.34132398107052,41.015621185302734Q23.495123981070517,41.109421185302736,23.772023981070518,42.234421185302736Q23.956623981070518,43.359421185302736,22.941323981070518,43.875021185302735L12.602823981070518,48.375021185302735Q12.002823981070518,48.65622118530273,11.402823981070519,48.375021185302735ZM6.095133981070519,38.015621185302734L3.1412839810705186,38.015621185302734L6.095133981070519,38.015621185302734L3.1412839810705186,38.015621185302734L3.1412839810705186,28.828121185302734Q3.0951339810705183,28.781251185302736,3.0489739810705183,28.781251185302736L0.8335909810705185,27.281251185302736Q0.002821981070518481,26.625001185302736,0.2335911810705185,25.593741185302733Q0.6028219810705184,24.562496185302734,1.6643639810705184,24.515621185302734L22.34132398107052,24.515621185302734Q23.40282398107052,24.562496185302734,23.772023981070518,25.593741185302733Q24.00282398107052,26.625001185302736,23.17202398107052,27.281251185302736L20.956623981070518,28.781251185302736Q20.91052398107052,28.781251185302736,20.91052398107052,28.781251185302736Q20.86432398107052,28.781251185302736,20.86432398107052,28.828121185302734L20.86432398107052,38.015621185302734L17.91052398107052,38.015621185302734L17.91052398107052,29.015621185302734L16.06432398107052,29.015621185302734L16.06432398107052,38.015621185302734L13.110523981070518,38.015621185302734L13.110523981070518,29.015621185302734L10.895123981070519,29.015621185302734L10.895123981070519,38.015621185302734L7.9412839810705185,38.015621185302734L7.9412839810705185,29.015621185302734L6.095133981070519,29.015621185302734L6.095133981070519,38.015621185302734ZM12.002823981070518,45.515621185302734Q12.649023981070519,45.515621185302734,13.064323981070519,45.09372118530273Q13.479723981070519,44.671921185302736,13.479723981070519,44.015621185302734Q13.479723981070519,43.359421185302736,13.064323981070519,42.937521185302735Q12.649023981070519,42.515621185302734,12.002823981070518,42.515621185302734Q11.356623981070518,42.515621185302734,10.941323981070518,42.937521185302735Q10.525923981070518,43.359421185302736,10.525923981070518,44.015621185302734Q10.525923981070518,44.671921185302736,10.941323981070518,45.09372118530273Q11.356623981070518,45.515621185302734,12.002823981070518,45.515621185302734Z" fill="#9CA3AF" fillOpacity="1" /></g></g></g></svg>
									</div>
								</div>
								<div className="flex justify-center">
									<h2 className="font-medium">No Payment Method Added</h2>
								</div>
								<div className="flex justify-center">
									<h2 className="text-sm text-[#6B7280]">Add your preferred payment method to receive payments</h2>
								</div>
								<div className="flex justify-center">
									<button
										onClick={() => {
											resetStates()
											setShowPaymentMethodModal(true)
										}}
										className="flex text-sm gap-2 items-center text-white bg-[#16BC88] rounded-lg px-6 py-2 hoverScaleDownEffect"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="14" height="16" viewBox="0 0 14 16" fill="none">
											<line x1="7" y1="3" x2="7" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round" />
											<line x1="2" y1="8" x2="12" y2="8" stroke="white" strokeWidth="2" strokeLinecap="round" />
										</svg>
										<span>Add Payment Method</span>
									</button>
								</div>
							</section>
						</div>
					</div>
				)}
			</div>
			<ConfirmationAlert
				show={showModal}
				onClose={handleCloseModal}
			/>
			<AddBankAccountModal
				isOpen={isAddBankModalOpen}
				onClose={() => setIsAddBankModalOpen(false)}
				errors={errors}
				setPaymentMethod={setPaymentMethod}
				bankDetails={bankDetails}
				setBankDetails={setBankDetails}
				save={handleSaveBank}
				saving={isLoading}
			/>
			<AddUPIModal
				isOpen={isUPIModalOpen}
				onClose={() => {
					setOtpGenerated(false)
					setIsUPIModalOpen(false)
				}
				}
				errors={errors}
				setPaymentMethod={setPaymentMethod}
				bankDetails={bankDetails}
				setBankDetails={setBankDetails}
				save={handleSaveUPI}
				otpSubmitted={otpSubmitted}
				otpGenerated={otpGenerated}
				setOtp={setOtp}
				saving={isLoading}
			/>
			<PaymentMethodModal
				show={showPaymentMethodModal}
				onClose={() => setShowPaymentMethodModal(false)}
				setIsAddBankModalOpen={setIsAddBankModalOpen}
				setIsUPIModalOpen={setIsUPIModalOpen}
			/>
		</div>
	);
};

export default PaymentSettings;
