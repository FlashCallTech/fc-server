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
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "../ui/use-toast";
import {
	CreateCreatorParams,
	CreateForeignUserParams,
	CreateUserParams,
} from "@/types";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import * as Sentry from "@sentry/nextjs";
import { trackEvent } from "@/lib/mixpanel";
import usePlatform from "@/hooks/usePlatform";
import { backendBaseUrl } from "@/lib/utils";
import GetRandomImage from "@/utils/GetRandomImage";
import { auth, getFCMToken, provider } from "@/lib/firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { headers } from "next/headers";

const formSchema = z.object({
	phone: z
		.string()
		.min(10, { message: "Must be exactly 10 digits." })
		.max(10, { message: "Must be exactly 10 digits." })
		.regex(/^[6-9][0-9]{9}$/, { message: "Invalid phone number." }),
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
	const { refreshCurrentUser, setAuthenticationSheetOpen, region, fetchingGlobalUser } = useCurrentUsersContext();
	const [showOTP, setShowOTP] = useState(false);
	const [phoneNumber, setPhoneNumber] = useState("");
	const [isSendingOTP, setIsSendingOTP] = useState(false);
	const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
	const [verificationSuccess, setVerificationSuccess] = useState(false);
	const [isLoggingThroughGoogle, setLoggingThroughGoogle] = useState(false);
	const [waitToCloseSheet, setWaitToCloseSheet] = useState(false);

	const firstLoginRef = useRef(false);
	const [error, setError] = useState({});
	const { toast } = useToast();
	const { getDevicePlatform } = usePlatform();

	const pathname = usePathname();

	const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 584);

	useEffect(() => {
		const handleResize = () => {
			setIsMobileView(window.innerWidth <= 584);
			const height = window.innerHeight;
			document.documentElement.style.setProperty("--vh", `${height * 0.01}px`);
		};

		window.addEventListener("resize", handleResize);
		handleResize();

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	useEffect(() => {
	if (waitToCloseSheet && !fetchingGlobalUser) {
		setAuthenticationSheetOpen(false);
		onOpenChange && onOpenChange(false);
		setWaitToCloseSheet(false); // reset
	}
}, [waitToCloseSheet, fetchingGlobalUser, onOpenChange, setAuthenticationSheetOpen]);

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
		try {
			setIsVerifyingOTP(true);
			// Retrieve the FCM token
			const fcmToken: any = await getFCMToken();

			const response = await axios.post(
				`${backendBaseUrl}/otp/verify-otp`,
				{
					phone: phoneNumber,
					otp: values.pin,
					fcmToken,
				},
				{ withCredentials: true }
			);

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

			setVerificationSuccess(true);

			// Use the user data from the decoded session token
			const user = decodedToken.user || {};
			let resolvedUserType = userType;

			if (user._id || !user.error) {
				// Existing user found
				resolvedUserType = user.userType || "client";
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
			} else {
				firstLoginRef.current = true;
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
						themeSelected: "#88D8C0",
						videoRate: "10",
						audioRate: "10",
						chatRate: "10",
						walletBalance: 0,
						referredBy: refId ? refId : null,
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
						description:
							`${error.response.data.error}` || "Something went wrong",
						toastStatus: "negative",
					});
					resetState();
					return;
				}
			}

			setAuthenticationSheetOpen(false);
			onOpenChange && onOpenChange(false);
			setIsVerifyingOTP(false);

			const creatorURL = localStorage.getItem("creatorURL");

			if (resolvedUserType === "client") {
				localStorage.setItem("userType", resolvedUserType);
				router.replace(
					creatorURL || (!pathname.includes("/discover") ? "/" : pathname)
				);

				refreshCurrentUser();
			} else if (resolvedUserType === "creator") {
				localStorage.setItem("userType", resolvedUserType);
				router.replace(firstLoginRef.current ? "/updateDetails" : "/home");
				refreshCurrentUser();
			}
		} catch (error: any) {
			console.error("Error verifying OTP:", error);
			let newErrors = { ...error };
			newErrors.otpVerificationError = "Error verifying OTP";
			setError(newErrors);
			otpForm.reset(); // Reset OTP form
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

	const handleGoogleSignIn = async () => {
		setLoggingThroughGoogle(true);
		try {
			let result: any;
			let email: string = "";

			// Google Sign-In
			try {
				result = await signInWithPopup(auth, provider);
				email = result.user.email as string;
			} catch (error: any) {
				if (error.code === "auth/popup-closed-by-user") {
					console.warn("User closed the popup before signing in.");
					toast({
						variant: "destructive",
						title: "Sign-In Cancelled",
						description:
							"You closed the popup before signing in. Please try again.",
						toastStatus: "negative",
					});
					return; // Prevent throwing a new error
				}
				console.log(error);
				throw new Error("Google Sign-In failed");
			}

			if (!email) {
				throw new Error("Email is not available after sign-in.");
			}

			setWaitToCloseSheet(true);

		} catch (error) {
			console.error("Error during sign-in:", error);
			await signOut(auth); // Sign out if an error occurs
			toast({
				variant: "destructive",
				title: "Error Signing In",
				description: "Try again later",
				toastStatus: "negative",
			});
		} finally {
			setLoggingThroughGoogle(false);
		}
	};

	return (
		<section className="relative bg-[#F8F8F8] rounded-t-3xl sm:rounded-xl flex flex-col items-center justify-start gap-4 px-8 pt-2 shadow-lg w-screen h-fit sm:w-full sm:min-w-[24rem] sm:max-w-sm mx-auto">
			{!showOTP && !verificationSuccess ? (
				// SignUp form
				<>
					<div className="flex flex-col items-center justify-enter gap-2 text-center pt-4">
						<Image
							src="/icons/newLogo.png"
							width={1000}
							height={1000}
							alt="flashcall logo"
							className={`flex items-center justify-center w-[120px] h-[25px] mb-2`}
						/>

						<h2 className="text-black text-lg font-semibold">
							Login or Signup
						</h2>
						<p className="text-sm text-[#707070] mb-2.5">
							Get started with your first consultation <br /> and start earning
						</p>
					</div>
					{region === "India" ? (
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
											<div className="flex items-center border-none pl-2 pr-1 py-1 rounded bg-gray-100">
												<FormControl>
													<div className="w-full flex justify-between items-center">
														<div className="flex w-full items-center justify-center">
															<span className="text-gray-400">+91</span>
															<span className="px-2 pr-0 text-lg text-gray-300 text-center self-center flex items-center">
																│
															</span>
															<Input
																placeholder="Enter a Valid Number"
																{...field}
																className="w-full font-semibold bg-transparent border-none text-black focus-visible:ring-offset-0 placeholder:text-gray-400 placeholder:font-normal rounded-xl pr-4 pl-2 mx-1 py-3 focus-visible:ring-transparent hover:bg-transparent !important"
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
											<FormMessage className="text-center" />
										</FormItem>
									)}
								/>
							</form>
						</Form>
					) : (
						<Button
							className="w-[80%] p-2 text-black text-sm bg-white rounded-md flex items-center justify-center gap-2 border shadow-sm"
							onClick={handleGoogleSignIn}
							disabled={fetchingGlobalUser || isLoggingThroughGoogle}
						>
							{fetchingGlobalUser || isLoggingThroughGoogle ? (
								<Image
									src="/icons/loading-circle.svg"
									alt="Loading..."
									width={24}
									height={24}
									priority
								/>
							) : (
								<>
									<Image
										src="/google.svg" // Replace with your Google logo image path
										alt="Google Logo"
										width={1000}
										height={1000}
										className="size-5"
									/>
									Continue with Google
								</>
							)}
						</Button>
					)}
				</>
			) : verificationSuccess ? (
				<div className="flex flex-col items-center justify-center w-full sm:min-w-[24rem] sm:max-w-[24rem]  gap-4 pt-7 pb-14">
					{success}
					<span className="text-black font-semibold text-lg">
						Login Successfully
					</span>
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
				<p className="text-xs text-gray-400 text-center pb-2 w-3/4 leading-loose">
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
