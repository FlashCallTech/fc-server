"use client";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import React, { useEffect, useState } from "react";
import Loader from "../shared/Loader";
import Image from "next/image";
import upload from "@/lib/upload";
import Verify from "../shared/Verify";
import imageCompression from "browser-image-compression";
import { backendBaseUrl } from "@/lib/utils";
import { Button } from "../ui/button";

const KYC: React.FC = () => {
	const [panNumber, setPanNumber] = useState("");
	const [aadhaarNumber, setAadhaarNumber] = useState("");
	const [livelinessCheckFile, setLivelinessCheckFile] = useState<File | null>(
		null
	);
	const [panVerified, setPanVerified] = useState(false);
	const [aadhaarVerified, setAadhaarVerified] = useState(false);
	const [livelinessCheckVerified, setLivelinessCheckVerified] =
		useState<boolean>(false);
	// const [verificationMethod, setVerificationMethod] = useState<'otp' | 'image'>('otp');
	const [otp, setOtp] = useState<string>("");
	const [generatingOtp, setGeneratingOtp] = useState<boolean>(false);
	const [otpGenerated, setOtpGenerated] = useState(false);
	const [otpRefId, setOtpRefId] = useState<string | null>(null);
	const [otpSubmitted, setOtpSubmitted] = useState<boolean>(false);
	const [kycDone, setKycDone] = useState<string>("PENDING");
	const [loading, setLoading] = useState<boolean>(true);
	const [isPanInputVisible, setPanInputVisible] = useState(false);
	const [isAadhaarInputVisible, setAadhaarInputVisible] = useState(false);
	const [isLivelinessCheckInputVisible, setLivelinessCheckInputVisible] =
		useState<boolean>(false);
	const [verifyingPan, setVerifyingPan] = useState<boolean>(false);
	const [verifyingAadhaar, setVerifyingAadhaar] = useState<boolean>(false);
	const [verifyingLiveliness, setVerifyingLiveliness] =
		useState<boolean>(false);
	const [reason, setReason] = useState<string>("");

	const nameMismatchCheck = "The name in the PAN and the Aadhaar do not match. Our team will contact you for manual verification, which may take up to 2 business days."

	const { creatorUser } = useCurrentUsersContext();

	useEffect(() => {
		const getKyc = async () => {
			if (creatorUser) {
				const response = await fetch(
					`${backendBaseUrl}/userKyc/getKyc/${creatorUser._id}`,
					{
						method: "GET",
						headers: {
							"Content-Type": "application/json",
						},
					}
				);

				if (!response.ok) {
					setLoading(false);
					return;
				}

				const kycResponse = await response.json();
				console.log(kycResponse);

				if (
					kycResponse.data.kyc_status === "COMPLETED" ||
					kycResponse.data.kyc_status === "FAILED"
				) {
					console.log("Inside Completed or Failed");
					setKycDone(kycResponse.data.kyc_status);
					setPanVerified(true);
					setAadhaarVerified(true);
					setLivelinessCheckVerified(true);

					setPanNumber(kycResponse.data.pan.pan_number);
					setAadhaarNumber(kycResponse.data.aadhaar.aadhaar_number);
					if (kycResponse.data.reason) {
						setReason(kycResponse.data.reason);
					}

					setLoading(false);

					return;
				}

				if (kycResponse.data.kyc_status === "PENDING") {
					if (kycResponse.data.pan) {
						if (kycResponse.data.pan.valid) {
							setPanVerified(true);
							setPanNumber(kycResponse.data.pan.pan_number);
						}
					}
					if (kycResponse.data.aadhaar) {
						if (kycResponse.data.aadhaar.status === "VALID") {
							setAadhaarVerified(true);
							setAadhaarNumber(kycResponse.data.aadhaar.aadhaar_number)
						}
					}
					if (kycResponse.data.liveliness) {
						if (kycResponse.data.liveliness.liveliness)
							setLivelinessCheckVerified(true);
					}
					setLoading(false);
				}
				setVerifyingPan(false);
				setVerifyingAadhaar(false);
				setVerifyingLiveliness(false);
			}
		}

		if (creatorUser) {
			getKyc();
		}
	}, [panVerified, aadhaarVerified, livelinessCheckVerified]);

	const generateVerificationId = () => {
		return `${creatorUser?._id}_${Date.now()}_${Math.random()
			.toString(36)
			.substr(2, 9)}`;
	};

	const handlePanVerification = async () => {
		setVerifyingPan(true);
		if (!panVerified) {
			if (!panNumber) {
				alert("Please enter your PAN number.");
				setVerifyingPan(false);
				return;
			}

			try {
				const panResponse = await fetch("/api/v1/userkyc/verifyPan", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ panNumber, userId: creatorUser?._id }),
				});

				const panResult = await panResponse.json();
				if (panResult.success) {
					setPanVerified(true);
				} else {
					if (
						panResult.message ===
						"This PAN number is already associated with another account."
					) {
						setPanNumber("");
						alert(
							"This PAN number is already associated with another account."
						);
					}
					setVerifyingPan(false);
				}
			} catch (error) {
				console.error("Error verifying PAN:", error);
				setVerifyingPan(false);
				return;
			}
		}
	};

	const handleAadhaarVerification = async () => {
		setVerifyingAadhaar(true);
		// if (verificationMethod === 'otp') {
		if (!otpGenerated) {
			if (!aadhaarNumber) {
				alert("Please enter your Aadhaar number.");
				setVerifyingAadhaar(false);
				return;
			}

			try {
				setGeneratingOtp(true);
				const otpResponse = await fetch("/api/v1/userkyc/generateAadhaarOtp", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ aadhaarNumber }),
				});

				const otpResult = await otpResponse.json();
				setOtpRefId(otpResult.data.ref_id);

				if (otpResult.data.message === "OTP sent successfully") {
					setOtpGenerated(true);
					alert("OTP has been sent to your Aadhaar-registered mobile number.");
					setGeneratingOtp(false);
					setVerifyingAadhaar(false);
				} else if (
					otpResult.data.message === "Aadhaar not linked to mobile number"
				) {
					alert("Aadhaar not linked to mobile number");
					return;
				}
			} catch (error) {
				console.error("Error generating OTP:", error);
				setVerifyingAadhaar(false);
				setGeneratingOtp(false);
			}
		} else {
			if (!otp) {
				alert("Please enter the OTP.");
				setVerifyingAadhaar(false);
				return;
			}

			try {
				setOtpSubmitted(true);
				const otpVerificationResponse = await fetch(
					"/api/v1/userkyc/verifyAadhaarOtp",
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							otp,
							aadhaarNumber,
							ref_id: otpRefId,
							userId: creatorUser?._id,
						}),
					}
				);

				const otpVerificationResult = await otpVerificationResponse.json();
				if (otpVerificationResult.success) {
					setAadhaarVerified(true);
				} else {
					if (
						otpVerificationResult.message ===
						"This Aadhaar number is already associated with another account."
					) {
						alert(
							"This PAN number is already associated with another account."
						);
						setAadhaarNumber("");
					}
					setOtp("");
					setOtpRefId(null);
					setOtpGenerated(false);
					setVerifyingAadhaar(false);
				}
				setOtpSubmitted(false);
			} catch (error) {
				console.error("Error verifying Aadhaar with OTP:", error);
				setVerifyingAadhaar(false);
			}
		}
		// } else if (verificationMethod === 'image') {
		//   if (!aadhaarFile) {
		//     alert('Please upload your Aadhaar front image.');
		//     setVerifyingAadhaar(false);
		//     return;
		//   }

		//   try {
		//     const verificationId = generateVerificationId();
		//     console.log(verificationId);
		//     const formData = new FormData();
		//     formData.append('front_image', aadhaarFile);
		//     formData.append('verification_id', verificationId);
		//     formData.append('userId', creatorUser?._id as string);

		//     const response = await fetch('/api/verify-aadhaar-image', {
		//       method: 'POST',
		//       body: formData,
		//     });

		//     const result = await response.json();
		//     console.log('Image Verification result:', result);
		//     setVerifyingAadhaar(false);
		//   } catch (error) {
		//     console.error('Error verifying Aadhaar with image:', error);
		//     setVerifyingAadhaar(false);
		//   }
		// }
	};

	const handleLivelinessVerification = async () => {
		setVerifyingLiveliness(true);
		if (!livelinessCheckFile) {
			setVerifyingLiveliness(false);
			return;
		}

		try {
			const verificationId = generateVerificationId();
			const img_url = await upload(livelinessCheckFile, "image");
			const formData = new FormData();
			formData.append("image", livelinessCheckFile);
			formData.append("verification_id", verificationId);
			formData.append("userId", creatorUser?._id as string);
			formData.append("img_url", img_url);

			const response = await fetch("/api/v1/userkyc/liveliness", {
				method: "POST",
				body: formData,
			});

			const result = await response.json();
			if (result.success) {
				setLivelinessCheckVerified(true);
			} else {
				alert("Verify Again");
				setVerifyingLiveliness(false);
			}	
		} catch (error) {
			console.error("Error verifying liveliness:", error);
			setVerifyingLiveliness(false);
		}
	};

	const handleLabelClick = () => {
		setPanInputVisible(!isPanInputVisible);
	};

	const handleAadhaarLabelClick = () => {
		setAadhaarInputVisible(!isAadhaarInputVisible);
	};

	const handleLivelinessCheckLabelClick = () => {
		setLivelinessCheckInputVisible(!isLivelinessCheckInputVisible);
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files ? e.target.files[0] : null;
		if (file) {
			try {
				const options = {
					maxSizeMB: 1, // Ensure the file size is under 1 MB
					maxWidthOrHeight: 1920, // Optional: Set a max width or height for the image
					useWebWorker: true, // Optional: Use a web worker for faster compression
				};
				const compressedFile = await imageCompression(file, options);
				setLivelinessCheckFile(compressedFile); // Store the compressed file
			} catch (error) {
				console.error("Image compression error:", error);
			}
		}
	};

	const formatMaskedString = (aadhaarNumber: string) => {
		const masked = aadhaarNumber.slice(0, -4).replace(/\d/g, '*'); // Mask all but the last 4 digits
		const visible = aadhaarNumber.slice(-4); // Extract the last 4 digits
		const combined = masked + visible;
	  
		// Add a space after every 4 characters
		return combined.replace(/(.{4})/g, '$1 ').trim();
	  }

	if (loading) {
		return <Loader />;
	}

	return (
		<div className="size-full">
			<div className="flex flex-col w-full items-start justify-start h-full bg-gray-100 lg:hidden">
				<div className="flex flex-col p-4 w-full h-full">
					{/* <button className="text-left text-lg font-medium text-gray-900">
					&lt;
					</button>
					<h2 className="text-2xl font-semibold text-gray-900 mb-6 text-start py-2">
					KYC Documents
					</h2> */}
					<div className="mb-4">
						<div className="rounded-md p-2 bg-white border">
							<label
								htmlFor="pan"
								className="flex flex-row justify-between items-center text-sm font-bold rounded-md text-gray-700 p-3 bg-white hover:cursor-pointer "
								onClick={handleLabelClick}
							>
								<span>PAN</span>

								<div className="flex flex-row gap-2">
									{panVerified ? (
										<Image
											src={"/green.svg"}
											width={0}
											height={0}
											alt="not done"
											className="w-[3.5vh] h-[3.5vh]"
											onContextMenu={(e) => e.preventDefault()}
										/>
									) : (
										!isPanInputVisible && (
											<Image
												src={"/red.svg"}
												width={0}
												height={0}
												alt="not done"
												className="w-[3.5vh] h-[3.5vh]"
												onContextMenu={(e) => e.preventDefault()}
											/>
										)
									)}
									<Image
										src={"/down.svg"}
										width={0}
										height={0}
										alt="drop down"
										className="w-[3vh] h-[3vh] "
										onContextMenu={(e) => e.preventDefault()}
									/>
								</div>
							</label>
							{isPanInputVisible && (
								<input
									type="text"
									id="pan"
									placeholder={panVerified ? "Verified" : "Enter PAN"}
									value={panNumber}
									onChange={(e) => setPanNumber(e.target.value)}
									className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
									disabled={panVerified}
								/>
							)}

							{isPanInputVisible && !panVerified && (
								<div className="flex w-full items-center mt-2">
									<button
										className="p-2 text-white w-full rounded-md bg-[#50A65C]"
										onClick={handlePanVerification}
										disabled={verifyingPan}
									>
										{verifyingPan ? "Verifying..." : "Verify"}
									</button>
								</div>
							)}
						</div>
					</div>

					<div className="mb-4">
						<div className="rounded-md p-2 bg-white border">
							<label
								htmlFor="aadhaar"
								className="flex flex-row justify-between items-center text-sm font-bold rounded-md text-gray-700 p-3 bg-white hover:cursor-pointer "
								onClick={handleAadhaarLabelClick}
							>
								<span>Aadhaar</span>

								<div className="flex flex-row gap-2">
									{aadhaarVerified ? (
										<Image
											src={"/green.svg"}
											width={0}
											height={0}
											alt="not done"
											className="w-[3.5vh] h-[3.5vh]"
											onContextMenu={(e) => e.preventDefault()}
										/>
									) : (
										!isAadhaarInputVisible && (
											<Image
												src={"/red.svg"}
												width={0}
												height={0}
												alt="not done"
												className="w-[3.5vh] h-[3.5vh]"
												onContextMenu={(e) => e.preventDefault()}
											/>
										)
									)}
									<Image
										src={"/down.svg"}
										width={0}
										height={0}
										alt="drop down"
										className="w-[3vh] h-[3vh]"
										onContextMenu={(e) => e.preventDefault()}
									/>
								</div>
							</label>
							{/* {isAadhaarInputVisible &&
              <div className="flex flex-col gap-2 p-2 items-start mb-2 rounded-md border">
			  <div >
			  <input
			  type="radio"
			  id="otp"
			  name="verificationMethod"
			  value="otp"
			  checked={verificationMethod === 'otp'}
			  onChange={() => {
                      setVerificationMethod('otp');
                      setOtpGenerated(false);
                    }}
                    className="mr-2"
                    disabled={aadhaarVerified || verifyingAadhaar || otpGenerated}
					/>
                  <label htmlFor="otp" className="mr-4">Verify via OTP</label>
				  </div>
				  <div >
                  <input
				  type="radio"
				  id="image"
				  name="verificationMethod"
				  value="image"
				  checked={verificationMethod === 'image'}
				  onChange={() => setVerificationMethod('image')}
				  className="mr-2"
				  disabled={aadhaarVerified || verifyingAadhaar || otpGenerated}
                  />
                  <label htmlFor="image">Verify via Image</label>
				  </div>
				  </div>
				  } */}

							{isAadhaarInputVisible && (
								<>
									<input
										type="text"
										id="aadhaar"
										placeholder={
											aadhaarVerified ? "Verified" : "Enter you Aadhaar Number"
										}
										value={aadhaarNumber}
										onChange={(e) => setAadhaarNumber(e.target.value)}
										className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
										disabled={otpGenerated || aadhaarVerified}
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

							{/* {isAadhaarInputVisible && verificationMethod === 'image' && (
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                capture="environment"
                onChange={(e) => setAadhaarFile(e.target.files ? e.target.files[0] : null)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
				/>
				)} */}

							{isAadhaarInputVisible && !aadhaarVerified && (
								<div className="flex w-full items-center mt-2">
									<button
										className="p-2 w-full text-white rounded-md bg-[#50A65C]"
										onClick={handleAadhaarVerification}
									>
										{otpGenerated
											? verifyingAadhaar
												? "Verifying..."
												: "Verify"
											: verifyingAadhaar
												? "Generating OTP..."
												: "Get OTP"}
									</button>
								</div>
							)}
						</div>
					</div>

					<div className="mb-4">
						<div className="rounded-md p-2 bg-white border">
							<label
								htmlFor="liveliness_check"
								className="flex flex-row justify-between items-center text-sm font-bold rounded-md text-gray-700 p-3 bg-white hover:cursor-pointer "
								onClick={handleLivelinessCheckLabelClick}
							>
								<span>Liveliness Check</span>

								<div className="flex flex-row gap-2">
									{livelinessCheckVerified ? (
										<Image
											src={"/green.svg"}
											width={0}
											height={0}
											alt="not done"
											className="w-[3.5vh] h-[3.5vh]"
											onContextMenu={(e) => e.preventDefault()}
										/>
									) : (
										!isLivelinessCheckInputVisible && (
											<Image
												src={"/red.svg"}
												width={0}
												height={0}
												alt="not done"
												className="w-[3.5vh] h-[3.5vh]"
												onContextMenu={(e) => e.preventDefault()}
											/>
										)
									)}
									<Image
										src={"/down.svg"}
										width={0}
										height={0}
										alt="drop down"
										className="w-[3vh] h-[3vh] "
										onContextMenu={(e) => e.preventDefault()}
									/>
								</div>
							</label>
							{isLivelinessCheckInputVisible &&
								(livelinessCheckVerified ? (
									<div className="border p-2 rounded-md text-sm text-gray-400">
										Verified
									</div>
								) : (
									<input
										type="file"
										accept=".jpg,.jpeg,.png"
										capture="environment"
										onChange={handleFileChange}
										className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
									/>
								))}

							{isLivelinessCheckInputVisible && !livelinessCheckVerified && (
								<div className="flex w-full items-center mt-2">
									<button
										className="p-2 text-white w-full rounded-md bg-[#50A65C]"
										onClick={handleLivelinessVerification}
										disabled={verifyingLiveliness}
									>
										{verifyingLiveliness ? "Verifying..." : "Verify"}
									</button>
								</div>
							)}
						</div>
					</div>
					<div className="flex justify-center h-full items-end">
						{kycDone === "COMPLETED" ? (
							<div className="w-full font-bold text-[#50A65C] text-center p-2">
								KYC Completed
							</div>
						) : (
							kycDone === "FAILED" && (
								<div className="w-full  text-red-500 text-center p-2">
									<p>
										<span>{reason.split(".")[0]}.</span>
										<br />
										<span className="font-bold">
											{reason.split(".")[1] + "."}
										</span>
									</p>
								</div>
							)
						)}
					</div>
				</div>
			</div>

			{/* New Design */}

			<div className="hidden lg:flex size-full flex-col items-start text-base justify-start p-8">
				<div className="flex flex-col gap-6 h-full w-[60%]">

					{/* Pan Section */}

					<div className="rounded-md p-4 bg-white border">
						<label
							htmlFor="pan"
							className={`flex flex-row justify-between items-center text-sm font-bold rounded-md p-3 bg-white ${panVerified ? "" : "hover:cursor-pointer"}`}
							onClick={handleLabelClick}
						>
							<div className="flex gap-3 items-center">
								<Image src={"/creator/pan.svg"} width={100} height={100} alt="pan" className="size-4" />
								<span className="text-base">PAN Card</span>
							</div>

							<div className="flex flex-row gap-2 items-center">
								<Image
									src={"/creator/kycCompleted.svg"}
									width={100}
									height={100}
									alt="not done"
									className={`size-4 ${panVerified ? "" : "filter grayscale brightness-[0.7] sepia hue-rotate-[220deg]"}`}
									onContextMenu={(e) => e.preventDefault()}
								/>
								<Image
									src={"/down.svg"}
									width={0}
									height={0}
									alt="drop down"
									className={`w-[3vh] h-[3vh] ${panVerified ? "hidden" : ""}`}
									onContextMenu={(e) => e.preventDefault()}
								/>
							</div>
						</label>

						{panVerified ? (
							<div className="p-2 flex flex-col text-sm text-gray-400">
								<span>Pan Number: <span className="text-black font-bold">{panNumber}</span> </span>
								<span>Status: <span className="text-[#16BC88]">Verified</span></span>
							</div>
						) : (
							<div className="flex flex-col gap-3 pl-8">
								{isPanInputVisible && (
									<input
										type="text"
										id="pan"
										placeholder={panVerified ? "Verified" : "Enter PAN Number"}
										value={panNumber}
										onChange={(e) => setPanNumber(e.target.value)}
										className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm"
										disabled={panVerified}
									/>
								)}

								{isPanInputVisible && (
									<span className="text-sm text-[#6B7280] font-normal leading-6">Format: ABCDE1234F</span>
								)}

								{isPanInputVisible && !panVerified && (
									<div className="flex w-full items-center">
										<Button
											className="text-white w-full rounded-full bg-black hoverScaleDownEffect"
											onClick={handlePanVerification}
											disabled={verifyingPan}
										>
											{verifyingPan ? "Verifying..." : "Verify"}
										</Button>
									</div>
								)}
							</div>
						)}
					</div>

					{/* Aadhaar Section */}

					<div className="rounded-md p-4 bg-white border">
						<label
							htmlFor="aadhaar"
							className={`flex flex-row justify-between items-center text-sm font-bold rounded-md p-3 bg-white ${aadhaarVerified ? "" : "hover:cursor-pointer"}`}
							onClick={handleAadhaarLabelClick}
						>
							<div className="flex gap-3 items-center">
								<Image src={"/creator/aadhaar.svg"} width={100} height={100} alt="pan" className="size-4" />
								<span className="text-base">Aadhaar</span>
							</div>

							<div className="flex flex-row gap-2 items-center">
								<Image
									src={"/creator/kycCompleted.svg"}
									width={100}
									height={100}
									alt="not done"
									className={`size-4 ${aadhaarVerified ? "" : "filter grayscale brightness-[0.7] sepia hue-rotate-[220deg]"}`}
									onContextMenu={(e) => e.preventDefault()}
								/>
								<Image
									src={"/down.svg"}
									width={0}
									height={0}
									alt="drop down"
									className={`w-[3vh] h-[3vh] ${aadhaarVerified ? "hidden" : ""}`}
									onContextMenu={(e) => e.preventDefault()}
								/>
							</div>
						</label>

						{aadhaarVerified ? (
							<div className="p-2 flex flex-col text-sm text-gray-400">
								<span>Aadhaar Number: <span className="text-black font-bold">{formatMaskedString(aadhaarNumber)}</span> </span>
								<span>Status: <span className="text-[#16BC88]">Verified</span></span>
							</div>
						) : (
							<div className="pl-8 flex flex-col gap-3">
								{isAadhaarInputVisible && (
									<>
										<input
											type="text"
											id="aadhaar"
											placeholder={
												aadhaarVerified ? "Verified" : "Enter you Aadhaar Number"
											}
											value={aadhaarNumber}
											onChange={(e) => setAadhaarNumber(e.target.value)}
											className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm"
											disabled={otpGenerated || aadhaarVerified}
										/>
										{otpGenerated && (
											<input
												type="text"
												placeholder="Enter OTP"
												value={otp}
												onChange={(e) => setOtp(e.target.value)}
												className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm"
											/>
										)}
									</>
								)}

								{isAadhaarInputVisible && !aadhaarVerified && (
									<div className="flex w-full items-center mt-2">
										<Button
											className="w-full text-white rounded-full bg-black"
											onClick={handleAadhaarVerification}
										>
											{otpGenerated
												? verifyingAadhaar
													? "Verifying..."
													: "Verify"
												: verifyingAadhaar
													? "Generating OTP..."
													: "Send OTP"}
										</Button>
									</div>
								)}
							</div>
						)}
					</div>

					{/* Liveliness Section */}

					<div className="rounded-md p-4 bg-white border">
						<label
							htmlFor="liveliness_check"
							className={`flex flex-row justify-between items-center text-sm font-bold rounded-md p-3 bg-white ${livelinessCheckVerified ? "" : "hover:cursor-pointer"}`}
							onClick={handleLivelinessCheckLabelClick}
						>
							<div className="flex gap-3 items-center">
								<Image src={"/creator/liveliness.svg"} width={100} height={100} alt="pan" className="size-4" />
								<span className="text-base">Liveliness Check</span>
							</div>

							<div className="flex flex-row gap-2 items-center">
								<Image
									src={"/creator/kycCompleted.svg"}
									width={100}
									height={100}
									alt="not done"
									className={`size-4 object-fit ${livelinessCheckVerified ? "" : "filter grayscale brightness-[0.7] sepia hue-rotate-[220deg]"}`}
									onContextMenu={(e) => e.preventDefault()}
								/>
								<Image
									src={"/down.svg"}
									width={0}
									height={0}
									alt="drop down"
									className={`w-[3vh] h-[3vh] ${livelinessCheckVerified ? "hidden" : ""}`}
									onContextMenu={(e) => e.preventDefault()}
								/>
							</div>
						</label>
						{livelinessCheckVerified ? (
							<div className="p-2 text-sm text-gray-400">
								<span>Status: </span>
								<span className="text-[#16BC88]">
									Verified
								</span>
							</div>
						) : (
							isLivelinessCheckInputVisible &&
							<div className="flex flex-col gap-3 justify-center items-center">
								<div className="flex p-6 w-full rounded-lg justify-center items-center border-[1px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] bg-gradient-to-t from-[rgba(0,0,0,0.001)] to-[rgba(0,0,0,0.001)]">
									<div className="flex flex-col gap-3 items-center justify-center">
										<Image
											src={"/creator/liveliness.svg"}
											width={100}
											height={100}
											alt="not done"
											className={`size-6`}
											onContextMenu={(e) => e.preventDefault()}
										/>
										<label
											htmlFor="file-upload"
											className="cursor-pointer text-[#4B5563] underline"
										>
											Select a  selfie for verification
										</label>
										<input
											id="file-upload"
											type="file"
											accept=".jpg,.jpeg,.png"
											capture="environment"
											onChange={handleFileChange}
											className="hidden"
										/>
										{livelinessCheckFile &&
											<div>{livelinessCheckFile.name}</div>
										}
										{isLivelinessCheckInputVisible && !livelinessCheckVerified && (
											<Button
												className={`flex items-center gap-2 ${!livelinessCheckFile ? "hoverScaleDownEffect" : ""} text-white rounded-full bg-black`}
												onClick={handleLivelinessVerification}
												disabled={verifyingLiveliness || livelinessCheckFile === null}
											>
												{!verifyingLiveliness &&
													<Image
														src={"/creator/liveliness.svg"}
														width={100}
														height={100}
														alt="camera"
														className="size-4 filter brightness-200"
													/>}
												<span>{verifyingLiveliness ? "Verifying..." : "Submit"}</span>
											</Button>
										)}
									</div>
								</div>
								<span className="text-[#4B5563] text-sm">Please ensure you&apos;re in a well-lit area and your face is clearly visible</span>
							</div>
						)}

					</div>
					<div className="flex justify-center">
						{kycDone === "COMPLETED" ? (
							<div className="flex items-center gap-2 bg-gray-200 font-semibold text-black text-center px-4 py-2 rounded-full">
								<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="16" height="16" viewBox="0 0 16 16"><defs><clipPath id="master_svg0_3_07314"><rect x="0" y="0" width="16" height="16" rx="0"/></clipPath></defs><g clip-path="url(#master_svg0_3_07314)"><g transform="matrix(1,0,0,-1,0,32.6875)"><g><path d="M8,16.34375Q10.1875,16.375,12,17.40625Q13.8125,18.46875,14.9375,20.34375Q16,22.25,16,24.34375Q16,26.43755,14.9375,28.34375Q13.8125,30.21875,12,31.28125Q10.1875,32.31255,8,32.34375Q5.8125,32.31255,4,31.28125Q2.1875,30.21875,1.0625,28.34375Q0,26.43755,0,24.34375Q0,22.25,1.0625,20.34375Q2.1875,18.46875,4,17.40625Q5.8125,16.375,8,16.34375ZM11.5312,25.8125L7.53125,21.8125L11.5312,25.8125L7.53125,21.8125Q7,21.375,6.46875,21.8125L4.46875,23.8125Q4.03125,24.34375,4.46875,24.875Q5,25.3125,5.53125,24.875L7,23.40625L10.4688,26.87495Q11,27.31255,11.5312,26.87495Q11.9688,26.34375,11.5312,25.8125Z" fill="currentColor" fill-opacity="1"/></g></g></g></svg>
								KYC Completed
							</div>
						) : (
							kycDone === "FAILED" && (
								<section className="flex gap-3 w-full text-[#B91C1C] p-4 rounded-lg border-[1px] border-[#FECACA] bg-[#FEF2F2]">
									<div>
										<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="16" height="16" viewBox="0 0 16 16"><defs><clipPath id="master_svg0_80_6736"><rect x="0" y="0" width="16" height="16" rx="0" /></clipPath></defs><g clip-path="url(#master_svg0_80_6736)"><g transform="matrix(1,0,0,-1,0,32.6875)"><g><path d="M8,16.34375Q10.1875,16.375,12,17.40625Q13.8125,18.46875,14.9375,20.34375Q16,22.25,16,24.34375Q16,26.43755,14.9375,28.34375Q13.8125,30.21875,12,31.28125Q10.1875,32.31255,8,32.34375Q5.8125,32.31255,4,31.28125Q2.1875,30.21875,1.0625,28.34375Q0,26.43755,0,24.34375Q0,22.25,1.0625,20.34375Q2.1875,18.46875,4,17.40625Q5.8125,16.375,8,16.34375ZM8,28.34375Q8.6875,28.28125,8.75,27.59375L8.75,24.09375Q8.6875,23.40625,8,23.34375Q7.3125,23.40625,7.25,24.09375L7.25,27.59375Q7.3125,28.28125,8,28.34375ZM7,21.34375Q7,21.78125,7.28125,22.0625Q7.5625,22.34375,8,22.34375Q8.4375,22.34375,8.71875,22.0625Q9,21.78125,9,21.34375Q9,20.90625,8.71875,20.625Q8.4375,20.34375,8,20.34375Q7.5625,20.34375,7.28125,20.625Q7,20.90625,7,21.34375Z" fill="#F87171" fill-opacity="1" /></g></g></g></svg>
									</div>
									<div>
										<h2 className="text-sm font-semibold">{`${reason === nameMismatchCheck ? "Name Mismatch Detected" : "Face Mismatch Detected"}`}</h2>
										<p>
											<span className="text-[13px]">{`${reason === nameMismatchCheck ? "The name on your Aadhaar card and Pan card doesn't match with the provided information. Our verification team will contact you within 24 hours to resolve this issue." : "The face on your Aadhaar card and Liveliness Photo doesn't match with the provided information. Our verification team will contact you within 24 hours to resolve this issue."}`}</span>
										</p>
									</div>
								</section>
							)
						)}
					</div>
				</div>
			</div>
		</div >
	);
};

export default KYC;
