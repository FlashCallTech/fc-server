"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { format } from "date-fns";
import axios from "axios";
import { backendBaseUrl } from "@/lib/utils";
import GetRandomImage from "@/utils/GetRandomImage";
import Overview from "@/components/myUsers/Overview";
import AllSessionsPage from "@/components/myUsers/Sessions";
import Chat from "@/components/myUsers/Chat";
import NotesList from "@/components/myUsers/Notes";
// Import your merged API function

type ClientData = {
  client: {
    fullName?: string;
    email?: string;
    photo?: string;
    phone?: string;
    dob?: string;
    createdAt?: string;
  };
  calls: {
    serviceTitle?: string;
    status?: string;
    startedAt: string;
    category: string;
    type: string;
    duration?: string;
  }[];
  total: number;
  avgRating?: number;
};

type Tab = "Overview" | "Sessions" | "Messages" | "Notes";

const UserProfilePage: React.FC = () => {
  const { currentUser } = useCurrentUsersContext();
  const { clientId } = useParams();
  const [data, setData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedButton, setSelectedButton] = useState<Tab>("Overview");

  const fetchData = async () => {
    setLoading(true);
    try {
      // getClientData expects clientId and creatorId (here currentUser._id)
      const response = await axios.get(
        `${backendBaseUrl}/calls/clientData/${clientId}/${currentUser?._id}`
      );
      console.log("Client Data:", response);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching client data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (clientId && currentUser) {
      fetchData();
    }
  }, [clientId, currentUser]);

  const getButtonClasses = (tab: Tab) =>
    `pb-4 px-1 cursor-pointer ${
      selectedButton === tab
        ? "text-black border-b-2 border-black font-semibold"
        : "text-[#6B7280]"
    }`;

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  if (!data || !data.client) {
    return <div className="p-8 text-center">No client data found.</div>;
  }

  // Extract values from data
  const { client, calls, total } = data;
  const lastSessionDate = calls && calls.length > 0 ? calls[0].startedAt : null;
  const memberSince = client.createdAt
    ? format(new Date(client.createdAt), "yyyy")
    : "N/A";

  return (
    <div className="size-full p-8">
      <div className="size-full border rounded-lg">
        {/* Top Section: Avatar, Name, Email, Action Buttons */}
        <div className="flex items-center px-6 pt-8 justify-between">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 relative rounded-full overflow-hidden">
              <Image
                src={client.photo || GetRandomImage()}
                alt={client.fullName || "Client Avatar"}
                layout="fill"
                objectFit="cover"
              />
            </div>
            {/* Name and Email */}
            <div>
              <h1 className="text-2xl font-semibold">
                {client.fullName || "Client Name"}
              </h1>
              <p className="text-[#6B7280] text-sm">
                {client.email || "client@example.com"}
              </p>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedButton("Messages")}
              className="flex gap-2 px-4 py-2 text-sm items-center border rounded-full h-fit"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                fill="none"
                version="1.1"
                width="14"
                height="14"
                viewBox="0 0 14 14"
              >
                <defs>
                  <clipPath id="master_svg0_142_6482">
                    <rect x="0" y="0" width="14" height="14" rx="0" />
                  </clipPath>
                </defs>
                <g clip-path="url(#master_svg0_142_6482)">
                  <g transform="matrix(1,0,0,-1,0,28.58941650390625)">
                    <g>
                      <path
                        d="M1.75,28.288608251953125Q1.01172,28.261308251953125,0.519531,27.769108251953124Q0.0273438,27.276908251953124,0,26.538608251953125L0,18.663628251953124Q0.0273438,17.925348251953125,0.519531,17.433158251953124Q1.01172,16.940978251953126,1.75,16.913628251953124L4.375,16.913628251953124L4.375,14.726132251953125Q4.375,14.452694251953124,4.62109,14.343319351953125Q4.86719,14.233944351953125,5.08594,14.370663151953124L8.44922,16.913628251953124L12.25,16.913628251953124Q12.9883,16.940978251953126,13.4805,17.433158251953124Q13.9727,17.925348251953125,14,18.663628251953124L14,26.538608251953125Q13.9727,27.276908251953124,13.4805,27.769108251953124Q12.9883,28.261308251953125,12.25,28.288608251953125L1.75,28.288608251953125Z"
                        fill="#374151"
                        fillOpacity="1"
                      />
                    </g>
                  </g>
                </g>
              </svg>
              <span>Message</span>
            </button>
            <button className="flex gap-2 px-4 py-2 text-sm items-center border rounded-full h-fit">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                fill="none"
                version="1.1"
                width="12.25"
                height="14"
                viewBox="0 0 12.25 14"
              >
                <defs>
                  <clipPath id="master_svg0_142_6495">
                    <rect x="0" y="0" width="12.25" height="14" rx="0" />
                  </clipPath>
                </defs>
                <g clip-path="url(#master_svg0_142_6495)">
                  <g transform="matrix(1,0,0,-1,0,28.6015625)">
                    <g>
                      <path
                        d="M2.625,27.42578125L2.625,26.55078125L2.625,27.42578125L2.625,26.55078125L1.3125,26.55078125Q0.765625,26.52348125,0.382812,26.16798125Q0.0273438,25.78518125,0,25.23828125L0,23.92578125L12.25,23.92578125L12.25,25.23828125Q12.2227,25.78518125,11.8672,26.16798125Q11.4844,26.52348125,10.9375,26.55078125L9.625,26.55078125L9.625,27.42578125Q9.625,27.80858125,9.37891,28.05468125Q9.13281,28.30078125,8.75,28.30078125Q8.36719,28.30078125,8.12109,28.05468125Q7.875,27.80858125,7.875,27.42578125L7.875,26.55078125L4.375,26.55078125L4.375,27.42578125Q4.375,27.80858125,4.12891,28.05468125Q3.88281,28.30078125,3.5,28.30078125Q3.11719,28.30078125,2.87109,28.05468125Q2.625,27.80858125,2.625,27.42578125ZM12.25,23.05078125L0,23.05078125L12.25,23.05078125L0,23.05078125L0,15.61328125Q0.0273438,15.06640625,0.382812,14.68359325Q0.765625,14.32812505,1.3125,14.30078125L10.9375,14.30078125Q11.4844,14.32812505,11.8672,14.68359325Q12.2227,15.06640625,12.25,15.61328125L12.25,23.05078125Z"
                        fill="#374151"
                        fillOpacity="1"
                      />
                    </g>
                  </g>
                </g>
              </svg>
              <span>Schedule</span>
            </button>
            <button className="flex gap-2 px-4 py-2 text-sm text-white items-center border rounded-full h-fit bg-black">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                fill="none"
                version="1.1"
                width="14"
                height="14"
                viewBox="0 0 14 14"
              >
                <defs>
                  <clipPath id="master_svg0_142_6491">
                    <rect x="0" y="0" width="14" height="14" rx="0" />
                  </clipPath>
                </defs>
                <g clip-path="url(#master_svg0_142_6491)">
                  <g transform="matrix(1,0,0,-1,0,28.6015625)">
                    <g>
                      <path
                        d="M13.0335,27.699181250000002Q12.5365,28.164081250000002,11.929,28.164081250000002Q11.3215,28.164081250000002,10.8245,27.699181250000002L9.99606,26.87888125L12.7022,24.19922125L13.5306,25.01958125Q14,25.511681250000002,14,26.11328125Q14,26.714881249999998,13.5306,27.20708125L13.0335,27.699181250000002ZM4.74951,21.68359125Q4.50099,21.43750125,4.39053,21.08203125L3.56213,18.67578125Q3.45168,18.29297125,3.72781,17.99219125Q4.03156,17.71875125,4.41815,17.82812125L6.87574,18.64844125Q7.2071,18.75781125,7.45562,19.00390125L12.0947,23.59766125L9.38856,26.277381249999998L4.74951,21.68359125ZM2.65089,26.55078125Q1.51874,26.52348125,0.773176,25.78518125Q0.0276134,25.04688125,0,23.92578125L0,16.92578125Q0.0276134,15.80469125,0.773176,15.06640625Q1.51874,14.32812505,2.65089,14.30078125L9.71992,14.30078125Q10.8521,14.32812505,11.5976,15.06640625Q12.3432,15.80469125,12.3708,16.92578125L12.3708,19.55078125Q12.3708,19.93359125,12.1223,20.17969125Q11.8738,20.42578125,11.4872,20.42578125Q11.1006,20.42578125,10.8521,20.17969125Q10.6035,19.93359125,10.6035,19.55078125L10.6035,16.92578125Q10.6035,16.54297125,10.355,16.29687125Q10.1065,16.05078125,9.71992,16.05078125L2.65089,16.05078125Q2.2643,16.05078125,2.01578,16.29687125Q1.76726,16.54297125,1.76726,16.92578125L1.76726,23.92578125Q1.76726,24.30858125,2.01578,24.55468125Q2.2643,24.80078125,2.65089,24.80078125L5.30177,24.80078125Q5.68836,24.80078125,5.93688,25.04688125Q6.1854,25.29298125,6.1854,25.67578125Q6.1854,26.05858125,5.93688,26.30468125Q5.68836,26.55078125,5.30177,26.55078125L2.65089,26.55078125Z"
                        fill="#FFFFFF"
                        fillOpacity="1"
                      />
                    </g>
                  </g>
                </g>
              </svg>
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
        {/* Stats */}
        <div className="flex gap-2 pl-28 pr-6 text-sm pb-8 border-b">
          <div className="flex-1 flex flex-col gap-1 bg-gray-100 p-4 rounded-lg">
            <span className="text-[#6B7280] text-sm">Total Sessions</span>
            <span className="font-semibold text-lg">{total}</span>
          </div>
          <div className="flex-1 flex flex-col gap-1 bg-gray-100 p-4 rounded-lg">
            <span className="text-[#6B7280] text-sm">Average Rating</span>
            <span className="font-semibold text-lg">
              {calls.length > 0 ? data.avgRating || "N/A" : "N/A"}
            </span>
          </div>
          <div className="flex-1 flex flex-col gap-1 bg-gray-100 p-4 rounded-lg">
            <span className="text-[#6B7280] text-sm">Member Since</span>
            <span className="font-semibold text-lg">{memberSince}</span>
          </div>
          <div className="flex-1 flex flex-col gap-1 bg-gray-100 p-4 rounded-lg">
            <span className="text-[#6B7280] text-sm">Last Session</span>
            <span className="font-semibold text-lg">
              {lastSessionDate
                ? format(new Date(lastSessionDate), "MMM d")
                : "N/A"}
            </span>
          </div>
        </div>
        {/* Tabs */}
        <div className="border-b px-6 py-4">
          <nav className="flex gap-9 text-sm text-[#6B7280]">
            <button
              onClick={() => setSelectedButton("Overview")}
              className={getButtonClasses("Overview")}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedButton("Sessions")}
              className={getButtonClasses("Sessions")}
            >
              Sessions
            </button>
            <button
              onClick={() => setSelectedButton("Messages")}
              className={getButtonClasses("Messages")}
            >
              Messages
            </button>
            <button
              onClick={() => setSelectedButton("Notes")}
              className={getButtonClasses("Notes")}
            >
              Notes
            </button>
          </nav>
        </div>
        {/* Main Content */}
        {selectedButton === "Overview" ? (
          <Overview
            clientId={clientId as string}
            creatorId={currentUser?._id as string}
            calls={data.calls}
            client={data.client}
          />
        ) : selectedButton === "Sessions" ? (
          <AllSessionsPage
            clientId={clientId as string}
            creatorId={currentUser?._id as string}
          />
        ) : selectedButton === "Messages" ? (
          <Chat
            clientId={clientId as string}
            creatorId={currentUser?._id as string}
          />
        ) : (
          <NotesList
            clientId={clientId as string}
            creatorId={currentUser?._id as string}
          />
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
