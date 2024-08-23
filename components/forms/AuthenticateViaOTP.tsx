import React, { useEffect, useState } from "react";
import axios from "axios";
import OTPVerification from "./OTPVerification";
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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "../ui/use-toast";
import { CreateCreatorParams, CreateUserParams } from "@/types";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

const AuthenticateViaOTP = ({ userType }: { userType: string }) => {
	const searchParams = useSearchParams();
	const router = useRouter();
	const { refreshCurrentUser } = useCurrentUsersContext();
	const [showOTP, setShowOTP] = useState(false);
	const [phoneNumber, setPhoneNumber] = useState("");
	const [token, setToken] = useState<string | null>(null);
	const [isSendingOTP, setIsSendingOTP] = useState(false);
	const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
	const [verificationSuccess, setVerificationSuccess] = useState(false);
	const [error, setError] = useState({});

	const pathname = usePathname();
	const isAuthenticationPath = pathname.includes("/authenticate");
	useEffect(() => {
		localStorage.setItem("userType", (userType as string) ?? "client");
	}, [router, searchParams, userType]);

	const { toast } = useToast();
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
			const response = await axios.post("/api/v1/send-otp", {
				phone: values.phone,
			});
			setPhoneNumber(values.phone);
			setToken(response.data.token); // Store the token received from the API
			setShowOTP(true);
		} catch (error) {
			console.error("Error sending OTP:", error);
			// Handle error (show message to user, etc.)
		} finally {
			setIsSendingOTP(false);
		}
	};

	// managing single session authentication
	const updateFirestoreAuthToken = async (token: string) => {
		try {
			let updatedPhoneNumber = `+91${phoneNumber}`;
			const authTokenDocRef = doc(db, "authToken", updatedPhoneNumber);
			const authTokenDoc = await getDoc(authTokenDocRef);
			if (authTokenDoc.exists()) {
				await updateDoc(authTokenDocRef, {
					token,
				});
			} else {
				await setDoc(authTokenDocRef, {
					token,
				});
			}
		} catch (error) {
			console.error("Error updating Firestore token: ", error);
		}
	};

	// Handle OTP submission
	const handleOTPSubmit = async (values: z.infer<typeof FormSchemaOTP>) => {
		setIsVerifyingOTP(true);
		try {
			const response = await axios.post("/api/v1/verify-otp", {
				phone: phoneNumber,
				otp: values.pin,
				token: token,
			});

			let authToken = response.data.sessionToken;

			// Save the auth token (with 7 days expiry) in localStorage
			localStorage.setItem("authToken", authToken);
			console.log("OTP verified and token saved:");

			updateFirestoreAuthToken(authToken);

			setVerificationSuccess(true); // Set success state

			const existingUser = await axios.post("/api/v1/user/getUserByPhone", {
				phone: phoneNumber,
			});

			if (existingUser.data.userType) {
				localStorage.setItem(
					"userType",
					(existingUser.data.userType as string) ?? "client"
				);

				localStorage.setItem("currentUserID", existingUser.data._id);

				console.log("Existing user found. Proceeding as an existing user.");
				refreshCurrentUser();
				isAuthenticationPath && router.push("/");
			} else {
				console.log("No user found. Proceeding as a new user.");

				let user: CreateCreatorParams | CreateUserParams;
				const formattedPhone = `+91${phoneNumber}`;
				if (userType === "creator") {
					user = {
						firstName: "",
						lastName: "",
						fullName: "",
						username: "",
						photo: "",
						phone: formattedPhone,
						profession: "Astrologer",
						themeSelected: "#50A65C",
						videoRate: "0",
						audioRate: "0",
						chatRate: "0",
						walletBalance: 0,
					};
				} else {
					user = {
						firstName: "",
						lastName: "",
						username: "",
						photo: "",
						phone: formattedPhone,
						role: "client",
						bio: "",
						walletBalance: 0,
					};
				}

				if (userType === "creator") {
					try {
						await axios.post(
							"/api/v1/creator/createUser",
							user as CreateCreatorParams
						);
						refreshCurrentUser();
						router.push("/updateDetails");
					} catch (error: any) {
						toast({
							variant: "destructive",
							title: "Error Registering User",
							description: `${error.response.data.error}`,
						});
						resetState();
					}
				} else {
					try {
						await axios.post(
							"/api/v1/client/createUser",
							user as CreateCreatorParams
						);
						refreshCurrentUser();
						router.push("/updateDetails");
					} catch (error: any) {
						toast({
							variant: "destructive",
							title: "Error Registering User",
							description: `${error.response.data.error}`,
						});
						resetState();
					}
				}
			}
		} catch (error: any) {
			console.error("Error verifying OTP:", error);
			toast({
				variant: "destructive",
				title: "Error Verifying OTP",
				description: `${error.response.data.error}`,
			});
			let newErrors = { ...error };
			newErrors.otpVerificationError = error.response.data.error;
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
		setToken(null);
		setVerificationSuccess(false);
		signUpForm.reset(); // Reset sign-up form
		otpForm.reset(); // Reset OTP form
	};

	const handleRouting = (routeType: string) => {
		if (routeType === "client") {
			router.push("/authenticate");
		} else if (routeType === "creator") {
			router.push("/authenticate?usertype=creator");
		}
	};

	return (
		<section className="bg-[#F8F8F8] rounded-t-3xl md:rounded-xl flex flex-col items-center justify-center gap-4 px-8 pt-8 pb-2 shadow-lg w-screen md:w-full md:min-w-[24rem] md:max-w-sm mx-auto animate-enterFromBottom">
			{!showOTP ? (
				// SignUp form
				<>
					<div className="flex flex-col items-center justify-enter gap-2">
						<Image
							src="/icons/logoDesktop.png"
							width={1000}
							height={1000}
							alt="flashcall logo"
							className="w-28 h-full mb-4 rounded-xl hoverScaleEffect"
						/>
						<h2 className="text-lg font-semibold">Login or Signup</h2>
						<p className="text-sm text-gray-500 mb-4">
							To book your first consultation
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
														<span className="px-2 text-lg text-gray-300 text-center self-center flex items-center">
															│
														</span>
														<Input
															placeholder="Enter a Valid Number"
															{...field}
															className="w-full font-semibold bg-transparent border-none focus-visible:ring-offset-0 placeholder:text-gray-400 placeholder:font-normal rounded-xl !pl-0 pr-4 py-3 focus-visible:ring-transparent !important"
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
				<div className="flex flex-col items-center justify-center w-full md:min-w-[24rem] md:max-w-[24rem] h-full gap-4 pt-7 pb-14">
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
					setToken={setToken}
				/>
			)}

			{!verificationSuccess && (
				<div className="w-full flex flex-col items-center justify-center">
					{!showOTP && (
						<Button
							className="bg-green-1 text-white text-base rounded-xl mt-4 hoverScaleEffect flex items-center justify-center gap-2"
							onClick={() =>
								handleRouting(userType === "creator" ? "client" : "creator")
							}
						>
							<span className="text-sm">
								Proceed as {userType === "creator" ? "Client" : "Expert"}
							</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="size-4"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
								/>
							</svg>
						</Button>
					)}
					<p className="text-xs text-gray-400 text-center mt-7 w-3/4 leading-loose">
						By signing up you agree to our <br />
						<Link href="#" className="underline hover:text-green-1 text-black">
							Terms of Services
						</Link>{" "}
						and{" "}
						<Link href="#" className="underline hover:text-green-1 text-black">
							Privacy Policy
						</Link>
					</p>
				</div>
			)}
		</section>
	);
};

export default AuthenticateViaOTP;
