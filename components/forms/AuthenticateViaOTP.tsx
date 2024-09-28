import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import OTPVerification from "./OTPVerification";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";
import { success } from "@/constants/icons";
import { useRouter } from "next/navigation";
import { useToast } from "../ui/use-toast";
import { CreateCreatorParams, CreateUserParams } from "@/types";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import * as Sentry from "@sentry/nextjs";
import { trackEvent } from "@/lib/mixpanel";
import usePlatform from "@/hooks/usePlatform";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import ContentLoading from "../shared/ContentLoading";
import { backendBaseUrl } from "@/lib/utils";
import GetRandomImage from "@/utils/GetRandomImage";
import { getFCMToken } from "@/lib/firebase";

const formSchema = z.object({
	phone: z
		.string()
		.min(10, { message: "Must be exactly 10 digits." })
		.max(10, { message: "Must be exactly 10 digits." })
		.regex(/^\d{10}$/, { message: "Must contain only digits." }),
});

const FormSchemaOTP = z.object({
	pin: z.string().min(6, {
		message: "Your one-time password must be 6 characters.",
	}),
});

const AuthenticateViaOTP = ({
	userType,
	refId,
	onOpenChange,
}: {
	userType: string;
	refId: string | null;
	onOpenChange?: (isOpen: boolean) => void;
}) => {
	const router = useRouter();
	const { refreshCurrentUser, setAuthenticationSheetOpen } =
		useCurrentUsersContext();
	const { updateWalletBalance } = useWalletBalanceContext();

	const [showOTP, setShowOTP] = useState(false);
	const [phoneNumber, setPhoneNumber] = useState("");
	const [isSendingOTP, setIsSendingOTP] = useState(false);
	const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
	const [verificationSuccess, setVerificationSuccess] = useState(false);

	const [firstLogin, setFirstLogin] = useState(false);
	const [error, setError] = useState({});
	const { toast } = useToast();
	const { getDevicePlatform } = usePlatform();

	// SignUp form
	const signUpForm = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			phone: "",
		},
	});

	// OTPVerification form
	const otpForm = useForm<z.infer<typeof FormSchemaOTP>>({
		resolver: zodResolver(FormSchemaOTP),
		defaultValues: {
			pin: "",
		},
	});

	// Handle phone number submission
	const handleSignUpSubmit = async (values: z.infer<typeof formSchema>) => {
		setIsSendingOTP(true);
		try {
			await axios.post(`${backendBaseUrl}/otp/send-otp`, {
				phone: values.phone,
			});
			setPhoneNumber(values.phone);
			setShowOTP(true);
			trackEvent("Login_Bottomsheet_OTP_Generated", {
				Platform: getDevicePlatform(),
			});
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error sending OTP:", error);
			// Handle error (show message to user, etc.)
		} finally {
			setIsSendingOTP(false);
		}
	};

	// Handle OTP submission
	const handleOTPSubmit = async (values: z.infer<typeof FormSchemaOTP>) => {
		setIsVerifyingOTP(true);
		try {
			// Retrieve the FCM token
			const fcmToken = await getFCMToken();

			const response = await axios.post(`${backendBaseUrl}/otp/verify-otp`, {
				phone: phoneNumber,
				otp: values.pin,
			});

			// Extract the session token and user from the response
			const { sessionToken, message } = response.data;

			// Check if the sessionToken is missing, indicating an OTP verification failure
			if (!sessionToken) {
				throw new Error(
					message || "OTP verification failed. No session token provided."
				);
			}

			trackEvent("Login_Bottomsheet_OTP_Submitted", {
				Platform: getDevicePlatform(),
			});

			const decodedToken = jwt.decode(sessionToken) as { user?: any };

			// Save the auth token (with 1 days expiry) in localStorage
			// localStorage.setItem("authToken", sessionToken);
			// console.log("OTP verified and token saved:");

			setVerificationSuccess(true);

			// Use the user data from the decoded session token
			const user = decodedToken.user || {};
			let resolvedUserType = userType;

			if (user._id) {
				// Existing user found
				resolvedUserType = user.userType || "client";
				console.log("current usertype: ", resolvedUserType);
				localStorage.setItem("currentUserID", user._id);
				if (resolvedUserType === "client") {
					trackEvent("Login_Success", {
						Client_ID: user?._id,
						User_First_Seen: user?.createdAt?.toString().split("T")[0],
					});
				} else {
					trackEvent("Login_Success", {
						Creator_ID: user?._id,
						User_First_Seen: user?.createdAt?.toString().split("T")[0],
						Platform: getDevicePlatform(),
					});
				}
				console.log("Existing user found. Proceeding as an existing user.");
			} else {
				// No user found, proceed as new user
				console.log("No user found. Proceeding as a new user.");
				setFirstLogin(true);
				let newUser: CreateCreatorParams | CreateUserParams;

				const formattedPhone = phoneNumber.startsWith("+91")
					? phoneNumber
					: `+91${phoneNumber}`;

				// Prepare the new user object based on the userType
				if (userType === "creator") {
					newUser = {
						firstName: "",
						lastName: "",
						fullName: "",
						username: formattedPhone as string,
						photo: "",
						phone: formattedPhone,
						profession: "Astrologer",
						themeSelected: "#50A65C",
						videoRate: "0",
						audioRate: "0",
						chatRate: "0",
						walletBalance: 0,
						referredBy: refId ? refId : null,
						referralAmount: refId ? 5000 : null,
						creatorId: `@${formattedPhone as string}`,
					};
				} else {
					newUser = {
						firstName: "",
						lastName: "",
						username: formattedPhone as string,
						photo: GetRandomImage() || "",
						phone: formattedPhone,
						role: "client",
						bio: "",
						walletBalance: 0,
					};
				}

				// Register the new user
				try {
					if (userType === "creator") {
						await axios.post(
							`${backendBaseUrl}/creator/createUser`,
							newUser as CreateCreatorParams
						);
					} else {
						await axios.post(
							`${backendBaseUrl}/client/createUser`,
							newUser as CreateUserParams
						);
					}
				} catch (error: any) {
					toast({
						variant: "destructive",
						title: "Error Registering User",
						description: `${error.response.data.error}`,
					});
					resetState();
					return;
				}
			}

			localStorage.setItem("userType", resolvedUserType);
			refreshCurrentUser();
			updateWalletBalance();
			setAuthenticationSheetOpen(false);
			const creatorURL = localStorage.getItem("creatorURL");

			if (resolvedUserType === "client") {
				if (creatorURL) {
					router.replace(creatorURL);
				} else {
					router.replace("/home");
				}
			} else if (resolvedUserType === "creator") {
				if (firstLogin) {
					router.replace("/updateDetails");
				} else {
					router.replace("/home");
				}
			}
		} catch (error: any) {
			console.error("Error verifying OTP:", error);
			let newErrors = { ...error };
			newErrors.otpVerificationError = error.message;
			setError(newErrors);
			otpForm.reset(); // Reset OTP form
			setIsVerifyingOTP(false);
		} finally {
			setIsVerifyingOTP(false);
		}
	};

	// Auto-submit OTP when all digits are entered
	const handleOTPChange = (value: string) => {
		if (value.length === 6) {
			otpForm.setValue("pin", value);
			handleOTPSubmit({ pin: value });
		}
	};

	// Edit phone number
	const handleEditNumber = () => {
		setShowOTP(false);
	};

	// Watch the phone number input value
	const phone = signUpForm.watch("phone");

	// Reset the state and forms
	const resetState = () => {
		setShowOTP(false);
		setPhoneNumber("");
		setVerificationSuccess(false);
		signUpForm.reset(); // Reset sign-up form
		otpForm.reset(); // Reset OTP form
	};

	const sectionRef = useRef<HTMLElement>(null);

	const handleClickOutside = (event: any) => {
		if (sectionRef.current && !sectionRef.current.contains(event.target)) {
			// Trigger your function here
			console.log("Clicked outside the section");
			onOpenChange && onOpenChange(false);
		}
	};

	useEffect(() => {
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	return (
		<section
			ref={sectionRef}
			className="relative bg-[#F8F8F8] rounded-t-3xl md:rounded-xl flex flex-col items-center justify-start gap-4 px-8 pt-8 pb-2 shadow-lg w-screen h-fit md:w-full md:min-w-[24rem] md:max-w-sm mx-auto animate-enterFromBottom z-50 overflow-y-scroll no-scrollbar"
		>
			{onOpenChange && (
				<Button
					className="absolute top-2 right-2 z-10"
					onClick={() => onOpenChange(false)}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="size-7 text-green-1 hover:text-black"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
						/>
					</svg>
				</Button>
			)}
			{!showOTP ? (
				// SignUp form
				<>
					<div className="flex flex-col items-center justify-enter gap-2 text-center">
						<Image
							src="/icons/logoMain.png"
							width={1000}
							height={1000}
							alt="flashcall logo"
							className="w-3/4 h-10 p-2 mb-2 bg-green-1"
						/>
						<h2 className="text-lg font-semibold">Login or Signup</h2>
						<p className="text-sm text-[#707070] mb-4">
							Get start with your first consultation <br /> and start earning
						</p>
					</div>
					<Form {...signUpForm}>
						<form
							onSubmit={signUpForm.handleSubmit(handleSignUpSubmit)}
							className="space-y-4 w-full"
						>
							<FormField
								control={signUpForm.control}
								name="phone"
								render={({ field }) => (
									<FormItem>
										<div className="flex items-center border pl-2 pr-1 py-1 rounded bg-gray-100">
											<FormControl>
												<div className="w-full flex justify-between items-center">
													<div className="flex w-full items-center jusitfy-center">
														<span className="text-gray-400">+91</span>
														<span className="px-2 pr-0 text-lg text-gray-300 text-center self-center flex items-center">
															│
														</span>
														<Input
															placeholder="Enter a Valid Number"
															{...field}
															className="w-full font-semibold bg-transparent border-none focus-visible:ring-offset-0 placeholder:text-gray-400 placeholder:font-normal rounded-xl pr-4 pl-2 mx-1 py-3 focus-visible:ring-transparent !important"
														/>
													</div>

													<Button
														type="submit"
														disabled={phone.length !== 10 || isSendingOTP}
														className="w-fit text-[12px] font-semibold !px-2 bg-green-1 text-white hover:bg-green-1/80"
													>
														{isSendingOTP ? (
															<Image
																src="/icons/loading-circle.svg"
																alt="Loading..."
																width={24}
																height={24}
																className=""
																priority
															/>
														) : (
															"Get OTP"
														)}
													</Button>
												</div>
											</FormControl>
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>
						</form>
					</Form>
				</>
			) : verificationSuccess ? (
				<div className="flex flex-col items-center justify-center w-full md:min-w-[24rem] md:max-w-[24rem]  gap-4 pt-7 pb-14">
					{success}
					<span className="font-semibold text-lg">Login Successfully</span>
				</div>
			) : (
				// OTPVerification form
				<OTPVerification
					phoneNumber={phoneNumber}
					onEditNumber={handleEditNumber}
					otpForm={otpForm}
					onOTPChange={handleOTPChange}
					onSubmit={otpForm.handleSubmit(handleOTPSubmit)}
					isVerifyingOTP={isVerifyingOTP}
					errors={error}
					changeError={setError}
				/>
			)}

			{!verificationSuccess && (
				<p className="text-xs text-gray-400 text-center mt-7 pb-2 w-3/4 leading-loose">
					By signing up you agree to our <br />
					<Link
						href="https://flashcall.me/terms-and-conditions"
						target="_blank"
						className="underline hover:text-green-1 text-black"
					>
						Terms of Services
					</Link>{" "}
					and{" "}
					<Link
						href="https://flashcall.me/privacy-policy"
						target="_blank"
						className="underline hover:text-green-1 text-black"
					>
						Privacy Policy
					</Link>
				</p>
			)}
		</section>
	);
};

export default AuthenticateViaOTP;
