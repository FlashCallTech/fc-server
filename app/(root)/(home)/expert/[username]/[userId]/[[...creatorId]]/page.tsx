"use client";

import CreatorCard from "@/components/creator/CreatorCard";
import ContentLoading from "@/components/shared/ContentLoading";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useToast } from "@/components/ui/use-toast";
import { getCreatorById } from "@/lib/actions/creator.actions";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { analytics } from "@/lib/firebase";
import { logEvent } from "firebase/analytics";
import Image from "next/image";
import { useParams, usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const CreatorProfile = () => {
	const [creator, setCreator] = useState(null);
	const [loading, setLoading] = useState(true);
	const { userId } = useParams();
	const { toast } = useToast();
	const pathname = usePathname();
	const router = useRouter();
	const [eventLogged, setEventLogged] = useState(false);
	const { currentUser, userType } = useCurrentUsersContext();

	useEffect(() => {
		if (userType === "creator") {
			toast({
				variant: "destructive",
				title: "You are a Creator",
				description: "Redirecting to HomePage ...",
			});

			router.push("/"); // Redirect to homepage if userType is creator
			return;
		}
		const getCreator = async () => {
			try {
				const response = await getCreatorById(String(userId));
				setCreator(response);
			} catch (error) {
				console.log(error);
			} finally {
				setTimeout(() => {
					setLoading(false);
				}, 2000);
			}
		};

		getCreator();
	}, [pathname, userId]);

	if (loading || !creator) {
		return (
			<section className="w-full h-full flex flex-col items-center justify-center">
				<SinglePostLoader />

				{!creator && !loading && (
					<div className="size-full flex items-center justify-center text-2xl font-semibold text-center text-red-500">
						No creators found.
					</div>
				)}
			</section>
		);
	}

	return (
		<div className="flex items-start justify-start h-full overflow-scroll no-scrollbar md:pb-14">
			<CreatorCard creator={creator} />
		</div>
	);
};

export default CreatorProfile;
