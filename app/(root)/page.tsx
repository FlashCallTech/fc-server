"use client";

import About from "@/components/sections/About";
import CheckoutBanner from "@/components/sections/CheckoutBanner";
import Hero from "@/components/sections/Hero";
import Info from "@/components/sections/Info";
// import MakingMoney from "@/components/sections/MakingMoney";
import OwnApp from "@/components/sections/OwnApp";
import ShareLink from "@/components/sections/ShareLink";
import SwitchToggle from "@/components/sections/SwitchToggle";
import Testimonials from "@/components/sections/Testimonials";
import Footer from "@/components/shared/Footer";
import NavbarWeb from "@/components/shared/NavbarWeb";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import React from "react";

const HomePage = () => {
	const { currentUser, handleSignout, fetchingUser, userType } =
		useCurrentUsersContext();

	return (
		<main className="grid grid-cols-1 items-center">
			{/* Navbar Landing Page */}

			<NavbarWeb
				currentUser={currentUser}
				handleSignout={handleSignout}
				fetchingUser={fetchingUser}
				userType={userType}
			/>

			{/* Hero Section */}
			<Hero
				userType={userType}
				fetchingUser={fetchingUser}
				currentUser={currentUser}
			/>
			{/* About section */}
			<About />
			{/* Switch toggle section */}
			<SwitchToggle />
			{/* Checkout Banner section */}
			<CheckoutBanner />
			{/* Share Link Section */}
			<ShareLink />
			{/* Testimonials */}
			<Testimonials />
			{/* Own App Section */}
			<OwnApp />
			{/* Accordion Section */}
			<Info />
			{/* Footer */}
			<Footer />
		</main>
	);
};

export default HomePage;
