"use client";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import React, { useEffect, useState } from "react";
import Loader from "../shared/Loader";
import Image from "next/image";
import upload from "@/lib/upload";
import Verify from "../shared/Verify";
import imageCompression from "browser-image-compression";

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
	const [nameMatch, setNameMatch] = useState<boolean>(false);
	const [faceMatch, setFaceMatch] = useState<boolean>(false);
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
	const [verifying, setVerifying] = useState<boolean>(false);
	const [reason, setReason] = useState<string>("");

	const { creatorUser } = useCurrentUsersContext();

	useEffect(() => {
		const getKyc = async () => {
			if (creatorUser) {
				if (creatorUser.kycStatus) {
					console.log(creatorUser.kycStatus);
					if (creatorUser.kycStatus === 'COMPLETED' || creatorUser.kycStatus === "FAILED") {
						setKycDone(creatorUser.kycStatus);
						setPanVerified(true);
						setAadhaarVerified(true);
						setLivelinessCheckVerified(true);
						if (creatorUser.kycStatus === 'FAILED') {
							const response = await fetch(
								`/api/v1/userkyc/getKyc?userId=${creatorUser?._id}`,
								{
									method: "GET",
									headers: {
										"Content-Type": "application/json",
									},
								}
							);

							if (!response.ok) {
								console.log('response not ok')
								setLoading(false);
								return;
							}

							const kycResponse = await response.json();
							if (kycResponse.success) {
								if (kycResponse.data.reason) {
									setReason(kycResponse.data.reason);
								}
							}

						}
						setLoading(false);

						return;
					}
				}
			}

			const response = await fetch(
				`/api/v1/userkyc/getKyc?userId=${creatorUser?._id}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			if (!response.ok) {
				console.log('response not ok')
				setLoading(false);
				return;
			}

			const kycResponse = await response.json();
			if (kycResponse.success) {
				if (kycResponse.data.pan) {
					if (kycResponse.data.pan.valid) {
						setPanVerified(true);
					}
				}
				if (kycResponse.data.aadhaar) {
					if (kycResponse.data.aadhaar.status === "VALID") setAadhaarVerified(true);
				}
				if (kycResponse.data.liveliness) {
					if (kycResponse.data.liveliness.liveliness) setLivelinessCheckVerified(true);
				}
				if (kycResponse.data.name_match) {
					if (kycResponse.data.name_match.score > 0.84) {
						setNameMatch(true);
					}
				}
				setLoading(false);
			} else {
				setLoading(false);
			}
		};

		if (creatorUser) {
			console.log("Creator: ", creatorUser);
			getKyc();
		}
	}, []);

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
					if (panResult.kycStatus) {
						setKycDone("COMPLETED");
						alert('KYC VERIFIED');
					} else {
						if (panResult.message === 'Our team will verify the details you have submitted. This usually takes 24 hours.') {
							setKycDone("FAILED");
							alert('KYC FAILED');
						} else {
							setKycDone("PENDING");
						}
					}
					setPanVerified(true);
				} else {
					if (panResult.message === 'This PAN number is already associated with another account.') {
						setPanNumber('');
						alert('This PAN number is already associated with another account.');
					}
				}

				setVerifyingPan(false);
				return;
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
				console.log("OTP generated:", otpResult);

				if (otpResult.data.message === "OTP sent successfully") {
					setOtpGenerated(true);
					alert("OTP has been sent to your Aadhaar-registered mobile number.");
					setGeneratingOtp(false);
					setVerifyingAadhaar(false);
				} else if (otpResult.data.message === "Aadhaar not linked to mobile number") {
					alert('Aadhaar not linked to mobile number');
					return;
				}
			} catch (error) {
				console.error("Error generating OTP:", error);
				setVerifyingAadhaar(false);
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
					if (otpVerificationResult.kycStatus) {
						setKycDone("COMPLETED");
						alert('KYC VERIFIED');
					} else {
						if (otpVerificationResult.message === 'Our team will verify the details you have submitted. This usually takes 24 hours.') {
							setKycDone("FAILED");
							alert('KYC FAILED');
						} else {
							setKycDone("PENDING");
						}
					}
					setAadhaarVerified(true);
				}
				else {
					if (otpVerificationResult.message === 'This Aadhaar number is already associated with another account.') {
						alert('This PAN number is already associated with another account.');
						setAadhaarNumber('');
					}
					setOtp("");
					setOtpRefId(null);
					setOtpGenerated(false);
				}
				setOtpSubmitted(false);
				console.log("OTP Verification result:", otpVerificationResult);
				setVerifyingAadhaar(false);
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
				if (result.kycStatus) {
					setKycDone("COMPLETED");
					alert('KYC VERIFIED');
				} else {
					if (result.message === 'Our team will verify the details you have submitted. This usually takes 24 hours.') {
						setKycDone("FAILED");
						alert('KYC FAILED');
					} else {
						setKycDone("PENDING");
					}
				}
				setLivelinessCheckVerified(true);
			}
			else {
				alert("Verify Again");
			}
			setVerifyingLiveliness(false);
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

	if (loading) {
		return <Loader />;
	}

	return (
		<div className="flex flex-col w-full items-start justify-start h-full bg-gray-100">
			<div className="flex flex-col p-4 w-full h-full">
				<button className="text-left text-lg font-medium text-gray-900">
					&lt;
				</button>
				<h2 className="text-2xl font-semibold text-gray-900 mb-6 text-start py-2">
					KYC Documents
				</h2>
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
									<span>{reason.split('.')[0]}.</span>
									<br />
									<span className="font-bold">{reason.split('.')[1] + "."}</span>
								</p>
							</div>
						)
					)}
				</div>
			</div>
		</div>
	);
};

export default KYC;
