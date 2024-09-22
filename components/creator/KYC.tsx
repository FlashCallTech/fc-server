"use client";
import React, { useState } from "react";

const KYC: React.FC = () => {
	const [panNumber, setPanNumber] = useState("");
	const [panVerified, setPanVerified] = useState(false);
	const [aadhaarNumber, setAadhaarNumber] = useState("");
	const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
	const [verificationMethod, setVerificationMethod] = useState<"otp" | "image">(
		"otp"
	);
	const [otp, setOtp] = useState<string>("");
	const [otpGenerated, setOtpGenerated] = useState(false);
	const [otpRefId, setOtpRefId] = useState<string | null>(null);

	const handleSubmit = async () => {
		if (!panVerified) {
			if (!panNumber) {
				alert("Please enter your PAN number.");
				return;
			}

			try {
				const panResponse = await fetch("/api/verify-pan", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ panNumber }),
				});

				const panResult = await panResponse.json();
				if (panResult.data.valid) setPanVerified(true);

				console.log("PAN Verification result:", panResult);
			} catch (error) {
				console.error("Error verifying PAN:", error);
			}
		}

		if (verificationMethod === "otp") {
			if (!otpGenerated) {
				if (!aadhaarNumber) {
					alert("Please enter your Aadhaar number.");
					return;
				}

				try {
					const otpResponse = await fetch("/api/generateAadhaarOtp", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ aadhaarNumber }),
					});

					const otpResult = await otpResponse.json();
					setOtpRefId(otpResult.data.ref_id);
					console.log("OTP generated:", otpResult);

					if (otpResult.data.status === "SUCCESS") {
						setOtpGenerated(true);
						alert(
							"OTP has been sent to your Aadhaar-registered mobile number."
						);
					}
				} catch (error) {
					console.error("Error generating OTP:", error);
				}
			} else {
				if (!otp) {
					alert("Please enter the OTP.");
					return;
				}

				try {
					const otpVerificationResponse = await fetch("/api/verifyAadhaarOtp", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ otp, ref_id: otpRefId }),
					});

					const otpVerificationResult = await otpVerificationResponse.json();
					console.log("OTP Verification result:", otpVerificationResult);
				} catch (error) {
					console.error("Error verifying Aadhaar with OTP:", error);
				}
			}
		} else if (verificationMethod === "image") {
			if (!aadhaarFile) {
				alert("Please upload your Aadhaar front image.");
				return;
			}

			try {
				const formData = new FormData();
				formData.append("aadhaar", aadhaarFile);

				const imageResponse = await fetch(
					"https://sandbox.cashfree.com/verification/document/aadhaar",
					{
						method: "POST",
						body: formData,
					}
				);

				const imageResult = await imageResponse.json();
				console.log("Image Verification result:", imageResult);
			} catch (error) {
				console.error("Error verifying Aadhaar with image:", error);
			}
		}
	};

	console.log(otpRefId);
	console.log(otp);

	return (
		<div className="flex flex-col items-start justify-start h-full bg-gray-100">
			<div className="flex flex-col p-6 w-full h-full">
				<button className="text-left text-lg font-medium text-gray-900">
					&lt;
				</button>
				<h2 className="text-2xl font-semibold text-gray-900 mb-6 text-start py-2">
					KYC Documents
				</h2>

				<div className="mb-4">
					<label
						htmlFor="pan"
						className="block text-sm font-bold text-gray-700"
					>
						PAN Card Number
					</label>
					<input
						type="text"
						id="pan"
						placeholder="Enter PAN"
						value={panNumber}
						onChange={(e) => setPanNumber(e.target.value)}
						className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
					/>
				</div>

				<div className="mb-4">
					<label
						htmlFor="aadhaar"
						className="block text-sm font-bold text-gray-700 pb-2"
					>
						Aadhaar Card Details
					</label>

					<div className="flex items-center mb-2">
						<input
							type="radio"
							id="otp"
							name="verificationMethod"
							value="otp"
							checked={verificationMethod === "otp"}
							onChange={() => {
								setVerificationMethod("otp");
								setOtpGenerated(false);
							}}
							className="mr-2"
						/>
						<label htmlFor="otp" className="mr-4">
							Verify via OTP
						</label>

						<input
							type="radio"
							id="image"
							name="verificationMethod"
							value="image"
							checked={verificationMethod === "image"}
							onChange={() => setVerificationMethod("image")}
							className="mr-2"
						/>
						<label htmlFor="image">Verify via Image</label>
					</div>

					{verificationMethod === "otp" && (
						<>
							<input
								type="text"
								id="aadhaar"
								placeholder="Enter Aadhaar Number"
								value={aadhaarNumber}
								onChange={(e) => setAadhaarNumber(e.target.value)}
								className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
							/>
							{otpGenerated && (
								<input
									type="text"
									placeholder="Enter OTP"
									value={otp}
									onChange={(e) => setOtp(e.target.value)}
									className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
								/>
							)}
						</>
					)}

					{verificationMethod === "image" && (
						<input
							type="file"
							accept="image/*"
							onChange={(e) =>
								setAadhaarFile(e.target.files ? e.target.files[0] : null)
							}
							className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
						/>
					)}
				</div>

				<button
					onClick={handleSubmit}
					className="mt-4 w-full py-2 bg-blue-500 text-white rounded-md text-center font-medium"
				>
					{verificationMethod === "otp" && !otpGenerated
						? "Generate OTP"
						: "Submit"}
				</button>
			</div>
		</div>
	);
};

export default KYC;
