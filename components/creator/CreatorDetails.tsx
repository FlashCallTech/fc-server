import React, { useEffect, useState } from "react";
import { sparkles } from "@/constants/icons";
import { creatorUser } from "@/types";
import { usePathname } from "next/navigation";
import { toggleFavorite } from "@/lib/actions/favorites.actions";
import { useToast } from "../ui/use-toast";
import Favorites from "../shared/Favorites";
import ShareButton from "../shared/ShareButton";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { isValidUrl, isValidHexColor } from "@/lib/utils";
import AuthenticationSheet from "../shared/AuthenticationSheet";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as Sentry from "@sentry/nextjs";

interface CreatorDetailsProps {
	creator: creatorUser;
}

const CreatorDetails = ({ creator }: CreatorDetailsProps) => {
	const pathname = usePathname();
	const isCreatorOrExpertPath = pathname.includes(`/${creator.username}`);
	const [isImageLoaded, setIsImageLoaded] = useState(false);
	const [addingFavorite, setAddingFavorite] = useState(false);
	const [markedFavorite, setMarkedFavorite] = useState(false);
	const [isAlreadyNotified, setIsAlreadyNotified] = useState(false);
	const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
	const [status, setStatus] = useState<string>("Online"); // Default status to "Offline"

	const themeColor = isValidHexColor(creator.themeSelected)
		? creator.themeSelected
		: "#50A65C";

	const { clientUser, setAuthenticationSheetOpen, setCurrentTheme } =
		useCurrentUsersContext();
	const { toast } = useToast();

	const fullName =
		`${creator?.firstName || ""} ${creator?.lastName || ""}`.trim() ||
		creator.username;

	const imageSrc =
		creator?.photo && isValidUrl(creator?.photo)
			? creator?.photo
			: "/images/defaultProfileImage.png";

	useEffect(() => {
		if (isCreatorOrExpertPath) {
			localStorage.setItem("currentCreator", JSON.stringify(creator));
			localStorage.setItem("creatorURL", `/${creator?.username}`);
			setCurrentTheme(themeColor);
		}
	}, [creator?._id, isCreatorOrExpertPath]);

	useEffect(() => {
		// Retrieve the notify list from localStorage
		const notifyList = JSON.parse(localStorage.getItem("notifyList") || "{}");

		// Check if the creator.username or creator.phone is already in the notify list
		if (
			notifyList[creator.username] === creator.phone ||
			Object.values(notifyList).includes(creator.phone)
		) {
			setIsAlreadyNotified(true);
		}
	}, [creator.username, creator.phone]);

	useEffect(() => {
		setAuthenticationSheetOpen(isAuthSheetOpen);
	}, [isAuthSheetOpen]);

	useEffect(() => {
		const docRef = doc(db, "userStatus", creator.phone);
		const unsubscribe = onSnapshot(
			docRef,
			(docSnap) => {
				if (docSnap.exists()) {
					const data = docSnap.data();
					const newStatus = data.status || "Offline";
					setStatus(newStatus);

					// Check if the creator's status is now "Online" and reset notification
					if (newStatus === "Online") {
						const notifyList = JSON.parse(
							localStorage.getItem("notifyList") || "{}"
						);

						// If the creator is in the notify list, remove them
						if (
							notifyList[creator.username] === creator.phone ||
							Object.values(notifyList).includes(creator.phone)
						) {
							setIsAlreadyNotified(false); // Reset the notification state
						}
					}
				} else {
					setStatus("Offline");
				}
			},
			(error) => {
				console.error("Error fetching status:", error);
				setStatus("Offline");
			}
		);

		// Clean up the listener on component unmount
		return () => unsubscribe();
	}, [creator.phone, creator.username]);

	useEffect(() => {
		const img = new Image();
		img.src = imageSrc;

		img.onload = () => {
			setIsImageLoaded(true);
		};

		img.onerror = () => {
			setIsImageLoaded(true);
		};
	}, [imageSrc]);

	const handleToggleFavorite = async () => {
		if (!clientUser) {
			setIsAuthSheetOpen(true);
			return;
		}
		const clientId = clientUser?._id;
		setAddingFavorite(true);
		try {
			const response = await toggleFavorite({
				clientId: clientId as string,
				creatorId: creator._id,
			});

			if (response.success) {
				setMarkedFavorite((prev) => !prev);
				toast({
					variant: "destructive",
					title: "List Updated",
					description: `${
						markedFavorite ? "Removed From Favorites" : "Added to Favorites"
					}`,
				});
			}
		} catch (error) {
			Sentry.captureException(error);
			console.log(error);
		} finally {
			setAddingFavorite(false);
		}
	};

	const handleNotifyUser = () => {
		try {
			const notifyList = JSON.parse(localStorage.getItem("notifyList") || "{}");

			// Check if the creator.username or creator.phone is already in the notify list
			if (
				!notifyList[creator.username] &&
				!Object.values(notifyList).includes(creator.phone)
			) {
				// Add the creator's username and phone to the notify list
				notifyList[creator.username] = creator.phone;
				localStorage.setItem("notifyList", JSON.stringify(notifyList));
				setIsAlreadyNotified(true); // Disable the button after adding

				toast({
					variant: "default",
					title: `We&apos;ll let you know as soon as ${fullName} is back online!`,
					description: `${fullName} isn&apos;t online yet.`,
				});
			} else {
				toast({
					variant: "default",
					title: "Can&apos;t repeat the action",
					description: `You are already set to be notified when ${fullName} comes online.`,
				});
			}
		} catch (error) {
			console.error("Error storing notification:", error);
			toast({
				variant: "destructive",
				title: "Error",
				description: "There was an issue setting up the notification.",
			});
		}
	};

	const backgroundImageStyle = {
		backgroundImage: `url(${imageSrc})`,
		backgroundSize: "cover",
		backgroundPosition: "center",
		backgroundRepeat: "no-repeat",
		opacity: isImageLoaded ? 1 : 0,
		transform: isImageLoaded ? "scale(1)" : "scale(0.95)",
		transition: "opacity 0.5s ease-in-out, transform 0.5s ease-in-out",
	};

	if (isAuthSheetOpen && !clientUser)
		return (
			<AuthenticationSheet
				isOpen={isAuthSheetOpen}
				onOpenChange={setIsAuthSheetOpen} // Handle sheet close
			/>
		);

	return (
		<>
			<div className="flex flex-col items-center px-5 sm:px-7 justify-center">
				<div
					className={`relative flex flex-col items-center w-full max-w-[85%] md:max-w-[60%] xl:max-w-[35%] mx-auto gap-4 p-4 rounded-[24px] z-10 `}
					style={{
						backgroundColor: themeColor,
					}}
				>
					{!isImageLoaded ? (
						<div
							className={`bg-gray-300 opacity-60 animate-pulse rounded-[24px]  w-full h-72 xl:h-80 object-cover`}
						/>
					) : (
						<div
							className={`relative rounded-xl w-full h-72 xl:h-80 bg-center`}
							style={backgroundImageStyle}
						>
							<div className="flex flex-col items-end justify-center gap-2 absolute top-4 right-4">
								<>
									<ShareButton
										username={
											creator.username ? creator.username : creator.phone
										}
										profession={creator.profession ?? "Astrologer"}
										gender={creator.gender ?? ""}
										firstName={creator.firstName}
										lastName={creator.lastName}
									/>

									<Favorites
										setMarkedFavorite={setMarkedFavorite}
										markedFavorite={markedFavorite}
										handleToggleFavorite={handleToggleFavorite}
										addingFavorite={addingFavorite}
										creator={creator}
										user={clientUser}
										isCreatorOrExpertPath={isCreatorOrExpertPath}
									/>
								</>
							</div>

							{status !== "Online" && clientUser && (
								<button
									className={`absolute bottom-0 right-0 ${
										!isAlreadyNotified
											? "bg-[#232323]/35 cursor-not-allowed"
											: "bg-green-1"
									}  p-3 rounded-xl rounded-tr-none rounded-bl-none transition-all duration-300 hover:scale-105 group text-white shadow-md white hover:bg-green-1 flex gap-2 items-center`}
									onClick={handleNotifyUser}
									disabled={isAlreadyNotified}
								>
									{isAlreadyNotified ? (
										<span className="text-sm">You&apos;ll be notified</span>
									) : (
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth={1.5}
											stroke="currentColor"
											className="size-6"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0M3.124 7.5A8.969 8.969 0 0 1 5.292 3m13.416 0a8.969 8.969 0 0 1 2.168 4.5"
											/>
										</svg>
									)}
								</button>
							)}
						</div>
					)}

					<div className="text-white flex flex-col items-start w-full">
						<p className="font-semibold text-3xl max-w-[90%] text-ellipsis whitespace-nowrap overflow-hidden">
							{creator.firstName ? (
								<span className="capitalize">
									{creator.firstName} {creator.lastName}
								</span>
							) : (
								creator.username
							)}
						</p>
						<div className="flex items-center justify-between w-full mt-2">
							<span className="text-md h-full">
								{creator.profession ? creator.profession : "Expert"}
							</span>

							<div
								className={`${
									status === "Online"
										? "bg-green-500"
										: status === "Offline"
										? "bg-red-500"
										: "bg-orange-400"
								} text-[10px] rounded-[4px] border border-white py-1 px-2 font-semibold`}
							>
								<span className="flex">
									{status === "Online"
										? "Online"
										: status === "Offline"
										? "Offline"
										: "Busy"}
								</span>
							</div>
						</div>
					</div>

					<span
						className="absolute top-1/3 -right-7"
						style={{
							color: themeColor,
						}}
					>
						{sparkles}
					</span>
				</div>

				<div
					className={`border-2 border-gray-200 p-4 -mt-[5.5rem] pt-24 text-center rounded-[24px] rounded-tr-none  h-full w-full relative bg-white 
						text-base lg:max-w-[85%] xl:max-w-[50%]
							
					`}
				>
					{creator.bio ? <>{creator.bio}</> : "Select the Call Type Below ..."}

					<span
						className="absolute max-xl:top-7 xl:-bottom-2 -left-4"
						style={{ color: themeColor }}
					>
						{sparkles}
					</span>
				</div>
			</div>
		</>
	);
};

export default CreatorDetails;
