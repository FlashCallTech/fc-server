"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";

import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import AuthenticationSheet from "../shared/AuthenticationSheet";
import { trackEvent } from "@/lib/mixpanel";
import { creatorUser } from "@/types";
import { getDarkHexCode } from "@/lib/utils";
import MobileNav from "../shared/MobileNav";

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

const CreatorNavbar = () => {
  const {
    currentUser,
    fetchingUser,
    userType,
    setAuthenticationSheetOpen,
    currentTheme,
    creatorURL,
    pendingNotifications,
  } = useCurrentUsersContext();
  const router = useRouter();
  const [creator, setCreator] = useState<creatorUser>();
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
  const pathname = usePathname();
  const isHelpChat = pathname.includes("expertHelpChats") && currentUser;
  const isCreatorHome =
    pathname.includes("home") && userType === "creator" && currentUser;
  const isCreatorOrExpertPath =
    creatorURL && creatorURL !== "" && pathname.includes(`${creatorURL}`);
  const followCreatorTheme = isCreatorOrExpertPath ? "#ffffff" : "#000000";
  const invertCreatorTheme = isCreatorOrExpertPath
    ? getDarkHexCode(currentTheme)
    : "#ffffff";

  useEffect(() => {
    const storedCreator = localStorage.getItem("currentCreator");
    if (storedCreator) {
      const parsedCreator: creatorUser = JSON.parse(storedCreator);
      if (parsedCreator) {
        setCreator(parsedCreator);
      }
    }
  }, []);

  const handleRouting = () => {
    if (userType === "creator") {
      router.push("/authenticate?usertype=creator");
    } else {
      trackEvent("Login_TopNav_Clicked", {
        // utm_source: "google",
        Creator_ID: creator?._id,
      });
      setIsAuthSheetOpen(true);
    }
  };

  const { walletBalance } = useWalletBalanceContext();

  useEffect(() => {
    setAuthenticationSheetOpen(isAuthSheetOpen);
  }, [isAuthSheetOpen]);

  const pageName = () => {
    if (pathname.includes("blocked")) return "Blocked Account";
    else if (pathname.includes("notifications")) return "Notifications";
    else if (pathname.includes("refer")) return "Refer and Earn";
    else if (pathname.includes("meta-analytics")) return "Meta Pixel Analytics";
    else if (pathname.includes("kyc")) return "KYC";
    else if (pathname === "calendar") return "Calendar";
    else if (pathname.includes("calendar-event"))
      return "Google Calendar Settings";
    else if (pathname.includes("payment-settings")) return "Payment Method";
    else if (pathname.includes("payment")) return "Transaction History";
    else if (pathname.includes("previous")) return "Order History";
    else if (pathname.includes("userFeedbacks")) return "User Feedbacks";
    else if (pathname.includes("upcoming")) return "Upcoming Calls";
    else if (pathname.includes("campaign") && pathname.includes("discount"))
      return "Discount Campaign";
    else if (pathname.includes("campaign") && pathname.includes("whatsapp"))
      return "WhatsApp Campaign Creator";
    else if (pathname.includes("service-management"))
      return "Service Management";
    else if (pathname.includes("terms-and-conditions"))
      return "Terms and Conditions";
    else if (pathname.includes("support")) return "Support";
    else if (pathname.includes("profile")) return "Edit Profile";
    else if (pathname.includes("inbox")) return "Inbox";
    else if (pathname.includes("groupManagement")) return "Group Management";
    else if (pathname.includes("users")) return "My Users";
  };

  const handleAppRedirect = () => {
    trackEvent("Getlink_TopNav_Clicked");
    const url =
      "https://play.google.com/store/apps/details?id=com.flashcall.me";
    window.open(url, "_blank");
  };

  const AppLink = () => (
    <Button
      className="flex items-center justify-center gap-2 px-4 lg:ml-2 rounded-[6px] hoverScaleDownEffect w-[128px] h-[40px] xl:w-[200px] xl:h-[48px]"
      style={{
        border: `1px solid #000000`,
      }}
      onClick={handleAppRedirect}
    >
      <Image
        src="/icons/logo_icon.png"
        width={100}
        height={100}
        alt="flashcall logo"
        className={`size-6 xl:w-[28px] xl:h-[36px] rounded-full`}
        priority
      />
      <span className="w-fit whitespace-nowrap text-xs font-semibold">
        Get Your Link
      </span>
    </Button>
  );

  return (
    <nav
      id="navbar"
      className={`${isHelpChat ? "hidden md:flex" : ""} bg-white flex ${
        isCreatorHome ? "lg:justify-end justify-between" : "justify-between"
      } items-center sticky w-full h-[76px] z-40 top-0 left-[264px] px-4 py-4 transition-transform duration-300 shadow-sm blurEffect gap-4`}
    >
      {!fetchingUser && currentUser ? (
        <Link
          href="/home"
          className="lg:hidden flex items-center justify-center size-fit "
        >
          <Image
            src="/icons/logo_new_light.png"
            width={1000}
            height={1000}
            alt="flashcall logo"
            className="hidden xm:flex items-center justify-center gap-2 px-4 lg:ml-2 rounded-full hoverScaleDownEffect w-[128px] h-[40px] xl:w-[150px] xl:h-[48px]"
            style={{
              border: `1px solid #000000`,
            }}
          />

          <Image
            src="/icons/logo_icon.png"
            width={1000}
            height={1000}
            alt="flashcall logo"
            className="flex xm:hidden items-center justify-center gap-2 px-4 lg:ml-2 rounded-full hoverScaleDownEffect h-auto w-14"
          />
        </Link>
      ) : (
        <AppLink />
      )}

      {!fetchingUser && !isCreatorHome && (
        <div className="hidden lg:flex gap-4 items-center text-lg font-bold">
          <Link
            href={`${creatorURL ? creatorURL : "/"}`}
            className="text-xl font-bold hoverScaleDownEffect"
          >
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
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </Link>
          {pageName()}
        </div>
      )}

      <div className="flex items-center justify-end gap-4">
        {!fetchingUser && (
          <div className="relative flex items-center gap-4">
            {
              <Link
                href="/notifications"
                className="flex items-center gap-1 hoverScaleDownEffect"
              >
                <Image
                  src="/icons/notifications.svg"
                  alt="Notifications"
                  width={24}
                  height={24}
                  className={`w-6 h-6 object-cover invert`}
                  priority
                />

                {/* Notification Badge */}
                {pendingNotifications > 0 && (
                  <span className="flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 shadow-md">
                    {pendingNotifications}
                  </span>
                )}
              </Link>
            }

            <Link
              href="/inbox"
              className="relative flex items-center hoverScaleDownEffect"
            >
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
                  d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                />
              </svg>
            </Link>
          </div>
        )}

        {fetchingUser ? (
          <NavLoader />
        ) : currentUser ? (
          <div className="flex justify-end items-center gap-4 h-full">
            <Link
              href="/payment"
              className={`w-fit flex items-center justify-center gap-2 p-3 rounded-full hoverScaleDownEffect h-[40px] xl:h-[48px] ${
                pathname.includes("/payment") && "!bg-black !text-white"
              }`}
              style={{
                border: `1px solid #000000`,
              }}
            >
              <Image
                src="/wallet.svg"
                width={100}
                height={100}
                alt="wallet"
                className={`w-4 h-4 ${
                  pathname.includes("/payment") && "invert"
                }`}
              />
              <span className="w-full mt-[2px] text-center align-middle text-xs font-semibold">
                {`${currentUser.global ? "$" : "RS."} ${Math.round(
                  walletBalance
                )}`}
              </span>
            </Link>

            <MobileNav />
          </div>
        ) : (
          <Button
            className="hoverScaleDownEffect font-semibold w-fit h-[40px] xl:h-[48px] mr-1 rounded-md"
            size="lg"
            onClick={handleRouting}
            style={{
              color: `${followCreatorTheme}`,
              border: `1px solid #000000`,
              backgroundColor: `${invertCreatorTheme}`,
            }}
          >
            Login
          </Button>
        )}
      </div>

      {isAuthSheetOpen && (
        <AuthenticationSheet
          isOpen={isAuthSheetOpen}
          onOpenChange={setIsAuthSheetOpen} // Handle sheet close
        />
      )}
    </nav>
  );
};

export default CreatorNavbar;
