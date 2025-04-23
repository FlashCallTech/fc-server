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
import Image from "next/image";
import React from "react";

const HomePage = () => {
  const { currentUser, handleSignout, fetchingUser } = useCurrentUsersContext();

  if (fetchingUser) {
    return (
      <section className="absolute bg-white top-0 left-0 flex justify-center items-center h-screen w-full z-40">
        <Image
          src="/icons/newLogo.png"
          alt="Loading..."
          width={500}
          height={500}
          className="w-36 animate-pulse"
          priority
        />
      </section>
    );
  }

  return (
    <main className="grid grid-cols-1 items-center">
      {/* Navbar Landing Page */}
      {
        <NavbarWeb
          currentUser={currentUser}
          handleSignout={handleSignout}
          fetchingUser={fetchingUser}
        />
      }
      {/* Hero Section */}
      <Hero />
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
