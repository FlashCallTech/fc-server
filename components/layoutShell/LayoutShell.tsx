// components/LayoutShell.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Typewriter, Cursor } from "react-simple-typewriter";
import { usePathname } from "next/navigation";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

const LayoutShell = ({ children }: { children: React.ReactNode }) => {
  const { fetchingUser } = useCurrentUsersContext();
  const [isMounted, setIsMounted] = useState(false);
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const pathname = usePathname();

  console.log('still fetching: ', fetchingUser);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !fetchingUser) {
      setIsSplashVisible(false);
    }
  }, [isMounted, fetchingUser]);

  if (isSplashVisible) {
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

  if (!navigator.onLine) {
    return (
      <section className="w-full h-screen flex flex-col items-center justify-center gap-4">
        {/* your offline UI */}
        <h1 className="text-2xl text-[#50A65C] font-semibold mt-7">
          <Typewriter
            words={[
              "Connection Lost",
              "It seems you are offline",
              "Check your connection",
            ]}
            loop={true}
            cursor
            cursorStyle="_"
            typeSpeed={50}
            deleteSpeed={50}
            delaySpeed={2000}
          />
          <Cursor cursorColor="#50A65C" />
        </h1>
      </section>
    );
  }

  return (
    <div className={`relative ${pathname.includes("helpChat") ? "" : "min-h-screen"} w-full`}>
      {children}
    </div>
  );
};

export default LayoutShell;
