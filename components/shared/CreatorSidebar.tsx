import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordionNormal";
import { newSidebarLinksCreator } from "@/constants";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState, useMemo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { getDisplayName, getImageSource } from "@/lib/utils";
import { creatorUser } from "@/types";
import { trackEvent } from "@/lib/mixpanel";

const CreatorSidebar = () => {
  const [creator, setCreator] = useState<creatorUser | null>(null);
  const pathname = usePathname();
  const [toggleMenu, setToggleMenu] = useState(false);
  const { currentUser, fetchingUser, pendingNotifications } =
    useCurrentUsersContext();

  const fullName = useMemo(
    () =>
      getDisplayName({
        fullName: currentUser?.fullName,
        firstName: currentUser?.firstName,
        lastName: currentUser?.lastName,
        username: currentUser?.username as string,
      }),
    [currentUser]
  );

  useEffect(() => {
    const storedCreator = localStorage.getItem("currentCreator");
    if (storedCreator) {
      setCreator(JSON.parse(storedCreator));
    }
  }, []);

  const handleLogEvent = (item: { label: string; route: string }) => {
    if (["Order History", "Favorites", "Support"].includes(item.label)) {
      trackEvent(`Menu_${item.label.replace(" ", "")}_Clicked`, {
        Client_ID: currentUser?._id,
        User_First_Seen: currentUser?.createdAt?.toString().split("T")[0],
        Creator_ID: creator?._id,
        WalletBalance_Available: currentUser?.walletBalance,
      });
    }
  };

  const imageSrc = getImageSource(currentUser as creatorUser) ?? "";

  return (
    <section
      id="sidebar"
      className="sticky left-0 top-0 flex h-screen flex-col justify-between min-w-[264px] border shadow-sm bg-gradient-to-t from-transparent to-transparent max-lg:hidden"
    >
      {/* Logo */}
      <Link href="/home" className="p-4 mx-auto">
        <Image
          src="/icons/newLogo.png"
          width={1000}
          height={1000}
          alt="flashcall logo"
          className="w-20"
          priority
        />
      </Link>

      {/* Sidebar Sections */}
      <div className="flex flex-1 flex-col gap-2.5 px-2 py-4 overflow-y-scroll no-scrollbar">
        {/* Non-section Links */}
        {newSidebarLinksCreator.links.map((item, index) => {
          const isActive =
            pathname === item.route || pathname.startsWith(`${item.route}/`);
          return (
            <Tooltip key={item.label + index}>
              <TooltipTrigger asChild>
                <Link
                  href={
                    currentUser ? item.route : "/authenticate?usertype=creator"
                  }
                  className={`flex w-full px-4 py-2 items-center gap-5 rounded-lg ${
                    isActive
                      ? "bg-[#0000001A] text-black"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => handleLogEvent(item)}
                >
                  {item.imgURL && (
                    <Image
                      src={item.imgURL}
                      alt={item.label}
                      width={16}
                      height={16}
                      className="size-4 gray-color"
                    />
                  )}
                  <p className="flex gap-2 items-center text-sm font-medium">
                    {item.label}
                  </p>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Sectioned Links */}
        <Accordion type="multiple">
          {newSidebarLinksCreator.sections.map((section, sectionIndex) => (
            <AccordionItem key={sectionIndex} value={section.section}>
              <AccordionTrigger className="text-gray-500 uppercase text-xs font-semibold px-4 mb-2">
                {section.section}
              </AccordionTrigger>
              <AccordionContent>
                {section.links.map((item, index) => {
                  if (!item) return null;
                  const isActive =
                    pathname === item.route ||
                    pathname.startsWith(`${item.route}/`);
                  return (
                    <Tooltip key={item.label + index}>
                      <TooltipTrigger asChild>
                        <Link
                          href={
                            currentUser
                              ? item.route
                              : "/authenticate?usertype=creator"
                          }
                          className={`flex w-full px-4 py-2 pl-6 items-center gap-5 rounded-lg ${
                            isActive
                              ? "bg-[#0000001A] text-black"
                              : "bg-white text-gray-600 hover:bg-gray-100"
                          }`}
                          onClick={() => handleLogEvent(item)}
                        >
                          {item.imgURL && (
                            <Image
                              src={item.imgURL}
                              alt={item.label}
                              width={16}
                              height={16}
                              className="size-4 gray-color"
                            />
                          )}
                          <p className="flex gap-2 items-center text-sm font-medium">
                            {item.label}
                          </p>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Footer Section */}
      <div className="w-full flex flex-col items-center justify-center py-1">
        {currentUser && !fetchingUser ? (
          <div className="relative w-full px-4 py-2 border-t">
            <div className="flex items-center justify-between cursor-pointer">
              <Link
                href={`/profile/${currentUser?._id}`}
                className="flex gap-5 items-center hoverScaleDownEffect"
              >
                <Image
                  src={imageSrc}
                  alt="Profile"
                  width={36}
                  height={36}
                  className="size-10 object-cover rounded-full bg-white"
                />
                <div className="flex flex-col text-gray-600">
                  <span className="text-sm font-medium">{fullName}</span>
                  <span className="text-sm">
                    {currentUser?.phone || `@${fullName}`}
                  </span>
                </div>
              </Link>
              <button
                className="flex"
                onClick={() => setToggleMenu((prev) => !prev)}
              >
                {toggleMenu ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
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
                      d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25"
                    />
                  </svg>
                )}
              </button>
            </div>
            {toggleMenu && (
              <div
                className="absolute -top-20 right-4 mt-2 min-w-56 bg-white shadow-lg rounded-xl p-2 z-10 transition-all duration-200"
                onMouseLeave={() => setToggleMenu(false)}
              >
                <Link
                  href="/terms-and-conditions"
                  className="flex items-center gap-5 text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100"
                >
                  <Image
                    src="/creator/terms&conditions.svg"
                    width={16}
                    height={16}
                    alt="Terms"
                    className="size-4 gray-color"
                  />
                  Terms & Conditions
                </Link>
                <Link
                  href="/support"
                  className="flex items-center gap-5 text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100"
                >
                  <Image
                    src="/creator/support.svg"
                    width={16}
                    height={16}
                    alt="Support"
                    className="size-4 gray-color"
                  />
                  Support
                </Link>
              </div>
            )}
          </div>
        ) : (
          <Button
            asChild
            className="hoverScaleDownEffect flex items-center gap-2 font-semibold w-4/5 rounded-[24px] bg-black text-white"
            size="lg"
          >
            <Link href="/authenticate">
              <span>Login</span>
              <div className="border-2 border-white/40 rounded-full p-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="size-2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
                  />
                </svg>
              </div>
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
};

export default CreatorSidebar;
