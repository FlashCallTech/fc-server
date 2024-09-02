import CreatorCard from "@/components/creator/CreatorCard";
import { getUserByUsername } from "@/lib/actions/creator.actions";
import { Metadata } from "next";
import * as Sentry from "@sentry/nextjs";

// Function to generate metadata dynamically
export async function generateMetadata({
	params,
}: {
	params: { username: string };
}): Promise<Metadata> {
	const imageSrc = (creator: any) => {
		const isValidUrl = (url: string) => {
			try {
				new URL(url);
				return true;
			} catch {
				return false;
			}
		};

		if (creator?.photo && isValidUrl(creator.photo)) {
			return creator.photo;
		} else {
			return "/images/defaultProfileImage.png";
		}
	};
	const creator = await getUserByUsername(String(params.username));
	let imageURL = await imageSrc(creator[0]);
	const fullName =
		`${creator[0]?.firstName || ""} ${creator[0]?.lastName || ""}`.trim() ||
		params.username;

	try {
		return {
			title: `Creator | ${fullName}` || "FlashCall",
			description: "Creator | Expert | Flashcall.me",
			openGraph: {
				type: "website",
				url: `https://app.flashcall.me/${fullName}`,
				title: `Creator | ${fullName}` || "FlashCall",
				description: `Book your first consultation with ${fullName}`,
				images: [
					{
						url: `${imageURL}`,
						width: 800,
						height: 600,
						alt: "Profile Picture",
					},
				],
				siteName: "Flashcall.me",
				locale: "en_US",
			},
		};
	} catch (error) {
		Sentry.captureException(error);
		// Log any error that occurs during the API call
		console.error("Error fetching creator data:", error);

		return {
			title: "FlashCall",
			description: "Error fetching creator data",
		};
	}
}

const CreatorProfile = () => {
	return (
		<div className="flex items-start justify-start h-full overflow-scroll no-scrollbar md:pb-14">
			<CreatorCard />
		</div>
	);
};

export default CreatorProfile;
