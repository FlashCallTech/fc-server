import CreatorCard from "@/components/creator/CreatorCard";
import { Metadata } from "next";
import * as Sentry from "@sentry/nextjs";
import {
	getDisplayName,
	getProfileImagePlaceholder,
	getImageSource,
	backendBaseUrl,
} from "@/lib/utils";
import axios from "axios";

export async function generateMetadata({
	params,
}: {
	params: { username: string };
}): Promise<Metadata> {
	const decodedUsername = decodeURIComponent(params.username as string);

	if (!decodedUsername || decodedUsername.startsWith("_next")) {
		return {
			title: "FlashCall",
			description: "Creator Platform | FlashCall",
		};
	}

	const formattedUsername = decodedUsername.startsWith("@")
		? decodedUsername.substring(1)
		: decodedUsername;
	let creator: any;
	try {
		const response = await axios.get(
			`${backendBaseUrl}/creator/getByUsername/${formattedUsername}`
		);

		if (response.status === 200) {
			creator = response.data;
		}
	} catch (error) {
		console.log(error);
	}

	const creatorProfile = creator ? creator : null;

	if (!creatorProfile) {
		return {
			title: "FlashCall",
			description: "Creator Not Found",
		};
	}

	const imageURL = creatorProfile
		? getImageSource(creatorProfile)
		: getProfileImagePlaceholder();

	const fullName = getDisplayName(creatorProfile);

	try {
		return {
			title: `Creator | ${fullName}` || "FlashCall",
			description: "Creator | Expert | Flashcall.me",
			openGraph: {
				type: "website",
				url: `https://flashcall.me/@${formattedUsername}`,
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
		console.error("Error fetching creator data:", error);

		return {
			title: "FlashCall",
			description: "Error fetching creator data",
		};
	}
}

const CreatorProfile = () => {
	return (
		<div className="flex items-start justify-start h-full">
			<CreatorCard />
		</div>
	);
};

export default CreatorProfile;
