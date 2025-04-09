"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FaAndroid, FaCheckCircle } from "react-icons/fa";
import Image from "next/image";

export default function DownloadPage() {
  useEffect(() => {
    const apkUrl =
      "https://dxvnlnyzij172.cloudfront.net/downloads/official.apk";
    const link = document.createElement("a");
    link.href = apkUrl;
    link.download = "official.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-10 min-h-screen bg-gradient-to-b from-white  via-[#FDF2F8] to-[#FDF2F8] p-6">
      {/* Logo */}
      <div className="mb-6">
        <Image
          width={1000}
          height={1000}
          src="/icons/mainOfficialLogo.png"
          alt="Official.me"
          className="w-full h-16 object-cover"
        />
      </div>

      <div className="grid grid-cols-1 items-center">
        {/* Heading */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
          Download Our Android App
        </h1>

        {/* Card Container */}
        <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md text-center">
          {/* Android Icon and Version */}
          <div className="flex items-center justify-start gap-4 mb-4 text-gray-700">
            <FaAndroid className="text-xl text-[#6366F1]" />
            <div className="flex flex-col items-start justify-center">
              <p className="font-semibold">Android App</p>
              <span className="text-sm text-gray-500">Version 2</span>
            </div>
          </div>

          {/* Features List */}
          <ul className="space-y-3 text-gray-700 text-left">
            <li className="flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              <span>Pay per minute Video and Audio Calls</span>
            </li>
            <li className="flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              <span>Set your own price</span>
            </li>
            <li className="flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              <span>Receive calls only when online</span>
            </li>
          </ul>

          <p className="text-sm text-gray-600 mt-4">
            Your download should start automatically. If not, click below.
          </p>

          {/* Download Button */}
          <a
            href="https://dxvnlnyzij172.cloudfront.net/downloads/official.apk"
            download="official.apk"
          >
            <Button className="w-full mt-4 bg-[#6366F1] text-white py-3 rounded-lg shadow-md hoverScaleDownEffect">
              Download APK
            </Button>
          </a>
        </div>

        {/* Instructions & Support */}
        <p className="text-sm text-[#6366F1] font-semibold mt-6 text-center">
          If you are using an older version of the app, <br />
          uninstall and install this new version.
        </p>

        <p className="flex flex-wrap gap-2.5 text-sm text-gray-600 mt-10">
          Having trouble downloading?{" "}
          <a
            href="mailto:support@official.me"
            className="text-[#6366F1] font-semibold"
          >
            Reach Us: support@official.me
          </a>
        </p>
      </div>
    </div>
  );
}
