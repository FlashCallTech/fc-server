import Image from "next/image";
import React from "react";
import { Button } from "../ui/button";
import Link from "next/link";
import { clientUser, creatorUser } from "@/types";

const NavLoader = () => {
	return (
		<div className="w-24 space-y-3">
			<div className="grid grid-cols-3 gap-4">
				<div className="h-2 bg-gray-300 rounded col-span-2"></div>
				<div className="h-2 bg-gray-300 rounded col-span-1"></div>
			</div>
			<div className="h-2 bg-gray-300 rounded"></div>
		</div>
	);
};

const NavbarWeb = ({
	fetchingUser,
	currentUser,
	handleSignout,
}: {
	fetchingUser: boolean;
	currentUser: clientUser | creatorUser | null;
	handleSignout: () => void;
}) => {
	const theme = `5px 5px 5px 0px #232323`;

	return (
		<nav className="sticky top-0 bg-white md:bg-transparent blurEffect w-full md:px-14 lg:px-24 z-40 py-2">
			<section className="flex items-center justify-between px-3 xs:px-5 md:px-10 py-2 md:bg-green-1 rounded-full border border-white">
				{/* logo */}
				<Link href="/home" className="hidden md:block">
					<Image
						src="/web/icons/logoFooter.png"
						alt="logo"
						width={1000}
						height={1000}
						className="rounded-[4px] w-full h-10 hoverScaleEffect p-2 border border-black"
						style={{
							boxShadow: theme,
						}}
					/>
				</Link>

				<Link href="/home" className="md:hidden">
					<Image
						src="/web/icons/logoMobile.png"
						alt="logo"
						width={1000}
						height={1000}
						className="rounded-[4px] w-12 h-12 border border-black hoverScaleEffect"
						style={{
							boxShadow: theme,
						}}
					/>
				</Link>

				{/* navLinks */}
				{fetchingUser ? (
					<NavLoader />
				) : (
					<div className="flex items-center justify-center gap-4 px-2 md:px-4 md:py-2">
						{currentUser ? (
							<>
								{/* Home Button */}
								<Link href="/home">
									<Button
										className="uppercase bg-green-1 text-white rounded-[4px] hoverScaleDownEffect text-xs border border-black md:!px-7"
										style={{
											boxShadow: theme,
										}}
									>
										Home
									</Button>
								</Link>
								{/* Sign Out Button */}
								<Button
									className="uppercase bg-white hover:bg-white rounded-[4px] hoverScaleDownEffect text-xs border border-black md:!px-7"
									onClick={handleSignout}
									style={{
										boxShadow: theme,
									}}
								>
									Sign Out
								</Button>
							</>
						) : (
							<>
								{/* Sign Up Button */}
								<Link href="/authenticate?usertype=creator">
									<Button
										className="uppercase bg-green-1 text-white rounded-[4px] hoverScaleDownEffect text-xs border border-black md:!px-7"
										style={{
											boxShadow: theme,
										}}
									>
										For Creator
									</Button>
								</Link>
								{/* Login Button */}
								<Link href="/authenticate">
									<Button
										className="uppercase bg-white hover:bg-white rounded-[4px] hoverScaleDownEffect text-xs border border-black md:!px-7"
										style={{
											boxShadow: theme,
										}}
									>
										For Client
									</Button>
								</Link>
							</>
						)}
					</div>
				)}
			</section>
		</nav>
	);
};

export default NavbarWeb;
