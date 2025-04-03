"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { useGetCallsByClientIdAndCreatorId } from "@/lib/react-query/queries";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";

type Props = {
  clientId: string;
  creatorId: string;
};

// Example data structure for a session/call
type Session = {
  id: string;
  category: "PPM" | "Scheduled";
  type: "audio" | "video" | "chat";
  startedAt: Date; // e.g. "2023-12-15"
  time: string; // e.g. "1:00 PM"
  duration: number; // in minutes
  status: "Upcoming" | "Ended" | "Cancelled" | "Canceled" | "cancelled";
};

// Helper to build the session title based on category/type
function getSessionTitle(call: { type?: string; category?: string }): string {
  const type = call.type?.toLowerCase();
  if (type === "video") {
    return call.category === "PPM"
      ? "PPM Video Session"
      : "Scheduled Video Session";
  } else if (type === "chat") {
    return call.category === "PPM"
      ? "PPM Chat Session"
      : "Scheduled Chat Session";
  } else if (type === "audio") {
    return call.category === "PPM"
      ? "PPM Audio Session"
      : "Scheduled Audio Session";
  }
  return "Session Title";
}

// Helper to display a small icon for each type (Audio/Video/Chat)
function getSessionIcon(type: Session["type"]) {
  switch (type) {
    case "audio":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          fill="none"
          version="1.1"
          width="20"
          height="20"
          viewBox="0 0 20 20"
        >
          <defs>
            <clipPath id="master_svg0_142_7504">
              <rect x="0" y="0" width="20" height="20" rx="0" />
            </clipPath>
          </defs>
          <g clip-path="url(#master_svg0_142_7504)">
            <g transform="matrix(1,0,0,-1,0,40.8593635559082)">
              <g>
                <path
                  d="M6.42023,39.4530817779541Q6.18677,40.0390817779541,5.68093,40.2734817779541Q5.13619,40.5077817779541,4.55253,40.3905817779541L1.1284,39.4530817779541Q0.077821,39.062481777954105,0,37.9296817779541Q0.0389105,33.0468817779541,2.37354,29.101561777954103Q4.70817,25.1562417779541,8.63813,22.8124917779541Q12.5681,20.4687442779541,17.4319,20.4296817779541Q18.5603,20.5078067779541,18.9494,21.5624917779541L19.8833,24.9999917779541Q20,25.5859317779541,19.7665,26.1328017779541Q19.5331,26.640621777954102,18.9494,26.8749917779541L15.214,28.4374917779541Q14.1634,28.789061777954103,13.4241,27.9687417779541L11.8677,26.0546817779541Q9.80545,27.0312417779541,8.1712,28.6328017779541Q6.57588,30.2734317779541,5.60311,32.3437817779541L7.50973,33.9062817779541Q8.32685,34.6483817779541,7.97665,35.703081777954104L6.42023,39.4530817779541Z"
                  fill="currentColor"
                  fillOpacity="1"
                />
              </g>
            </g>
          </g>
        </svg>
      );
    case "video":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          fill="none"
          version="1.1"
          width="22.5"
          height="20"
          viewBox="0 0 22.5 20"
        >
          <defs>
            <clipPath id="master_svg0_142_7460">
              <rect x="0" y="0" width="22.5" height="20" rx="0" />
            </clipPath>
          </defs>
          <g clip-path="url(#master_svg0_142_7460)">
            <g transform="matrix(1,0,0,-1,0,35.859375)">
              <g>
                <path
                  d="M0,30.4296875Q0.0390625,31.4843875,0.742188,32.1874875Q1.44531,32.8905875,2.5,32.9296875L12.5,32.9296875Q13.5547,32.8905875,14.2578,32.1874875Q14.9609,31.4843875,15,30.4296875L15,20.4296875Q14.9609,19.3749975,14.2578,18.6718755Q13.5547,17.96875,12.5,17.9296875L2.5,17.9296875Q1.44531,17.96875,0.742188,18.6718755Q0.0390625,19.3749975,0,20.4296875L0,30.4296875ZM21.8359,31.5234875Q22.4609,31.1718875,22.5,30.4296875L22.5,20.4296875Q22.4609,19.6874975,21.8359,19.3359375Q21.1719,18.9843775,20.5469,19.3749975L16.7969,21.8749975L16.25,22.2656275L16.25,22.9296875L16.25,27.9296875L16.25,28.593787499999998L16.7969,28.9843875L20.5469,31.4843875Q21.1719,31.8358875,21.8359,31.5234875Z"
                  fill="currentColor"
                  fillOpacity="1"
                />
              </g>
            </g>
          </g>
        </svg>
      );
    case "chat":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          fill="none"
          version="1.1"
          width="25"
          height="20"
          viewBox="0 0 25 20"
        >
          <defs>
            <clipPath id="master_svg0_142_7442">
              <rect x="0" y="0" width="25" height="20" rx="0" />
            </clipPath>
          </defs>
          <g clip-path="url(#master_svg0_142_7442)">
            <g transform="matrix(1,0,0,-1,0,40.859375)">
              <g>
                <path
                  d="M8.152654947845935,26.6796875Q11.568824947845936,26.7578075,13.859224947845936,28.7109375Q16.149524947845936,30.6249875,16.227224947845936,33.5546875Q16.149524947845936,36.4843875,13.859224947845936,38.3984875Q11.568824947845936,40.3515875,8.152654947845935,40.4296875Q4.736514947845936,40.3515875,2.4461349478459358,38.3984875Q0.1557647478459358,36.4843875,0.07812494784593582,33.5546875Q0.11694484784593581,31.2499875,1.6309249478459358,29.5312475Q1.3980049478459358,28.9453175,1.0486219478459358,28.5546875Q0.7768829478459358,28.2031275,0.5439639478459358,28.0078075Q0.4275039478459358,27.8906275,0.3886839478459358,27.8515675Q0.34986394784593583,27.8124975,0.34986394784593583,27.8124975L0.3110439478459358,27.8124975Q0.0004851478459358266,27.5390675,0.11694484784593581,27.1093775Q0.27222394784593584,26.7187475,0.6992429478459358,26.6796875Q2.019114947845936,26.7187475,3.106074947845936,27.1484375Q3.6495549478459357,27.3828075,4.076574947845936,27.6171875Q5.901104947845936,26.7187475,8.152654947845935,26.6796875ZM17.469424947845937,33.5546875Q17.352924947845935,30.1953075,14.984924947845936,28.0078075Q12.578124947845936,25.8203075,9.084334947845935,25.4687475Q9.821914947845936,23.2421875,11.918224947845935,21.8749975Q14.014424947845935,20.46875,16.848324947845935,20.4296875Q19.099824947845935,20.46875,20.924424947845935,21.3671875Q21.351424947845935,21.1328125,21.894924947845936,20.8984375Q22.981824947845936,20.46875,24.301724947845937,20.4296875Q24.728724947845937,20.46875,24.884024947845937,20.8593755Q25.000524947845935,21.2890625,24.651124947845936,21.5624975L24.651124947845936,21.6015675Q24.612324947845934,21.6015675,24.612324947845934,21.6015675Q24.573424947845936,21.6406275,24.457024947845937,21.7578075Q24.224124947845937,21.9531275,23.952324947845934,22.3046875Q23.602924947845935,22.7343775,23.370024947845934,23.2812475Q24.884024947845937,24.9999975,24.922824947845935,27.3046875Q24.845224947845935,30.0781275,22.748924947845936,31.9921875Q20.652624947845936,33.9062875,17.430624947845935,34.1796875Q17.469424947845937,33.8671875,17.469424947845937,33.5546875Z"
                  fill="currentColor"
                  fillOpacity="1"
                />
              </g>
            </g>
          </g>
        </svg>
      );
    default:
      return "❓";
  }
}
// Badge color classes for each status
function getStatusClasses(status: Session["status"]): string {
  switch (status) {
    case "Upcoming":
      return "text-blue-700 bg-blue-100";
    case "Ended":
      return "text-green-700 bg-green-100";
    case "Cancelled":
      return "text-red-700 bg-red-100";
    case "Canceled":
      return "text-red-700 bg-red-100";
    case "cancelled":
      return "text-red-700 bg-red-100";
    default:
      return "text-gray-700 bg-gray-100";
  }
}

function formatDuration(durationSeconds: number): string {
  if (durationSeconds <= 0) {
    return "0 sec";
  }

  // Calculate hours, minutes, and seconds
  const hours = Math.floor(durationSeconds / 3600);
  const remainder = durationSeconds % 3600;
  const minutes = Math.floor(remainder / 60);
  const seconds = Math.round(remainder % 60);

  // Build a readable string
  let result = "";

  if (hours > 0) {
    result += `${hours} hr`;
    if (hours > 1) result += "s"; // plural if needed
  }

  if (minutes > 0) {
    // Add a space if hours are present
    if (result) result += " ";
    result += `${minutes} min`;
    if (minutes > 1) result += "s"; // plural if needed
  }

  if (seconds > 0) {
    // Add a space if hours or minutes are present
    if (result) result += " ";
    result += `${seconds} sec`;
    if (seconds > 1) result += "s"; // plural if needed
  }

  return result;
}

const AllSessionsPage: React.FC<Props> = ({ clientId, creatorId }) => {
  // Replace these with actual values or props as needed.

  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("All Types");
  const [sort, setSort] = useState("Descending");
  const { data, isLoading, error } = useGetCallsByClientIdAndCreatorId(
    clientId,
    creatorId,
    currentPage,
    sort,
    filter
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;

  // Assume the API returns an object with `calls` and `total`
  const sessions: Session[] = data?.calls || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 5);

  return (
    <div className="w-full p-6">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">All Sessions</h2>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex gap-2 items-center px-4 py-2 border rounded-full text-sm">
                {/* Filter icon */}
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
                    <clipPath id="master_svg0_142_7562">
                      <rect x="0" y="0" width="14" height="14" rx="0" />
                    </clipPath>
                  </defs>
                  <g clip-path="url(#master_svg0_142_7562)">
                    <g transform="matrix(1,0,0,-1,0,26.871734619140625)">
                      <g>
                        <path
                          d="M0.26702625,25.067067309570312Q0.56091925,25.668567309570314,1.22885625,25.695967309570314L12.77085625,25.695967309570314Q13.43875625,25.668567309570314,13.73265625,25.067067309570312Q13.99985625,24.43816730957031,13.59905625,23.918567309570314L8.70977625,17.793597309570313L8.70977625,14.320941309570312Q8.68305625,13.801410309570313,8.22885625,13.527972509570313Q7.77465625,13.309222309570313,7.34717625,13.610003309570313L5.63725625,14.922507309570312Q5.28992625,15.195937309570313,5.28992625,15.633437309570311L5.28992625,17.793597309570313L0.40061425,23.918567309570314Q-0.00014875000000000305,24.43816730957031,0.26702625,25.067067309570312Z"
                          fill="#374151"
                          fillOpacity="1"
                        />
                      </g>
                    </g>
                  </g>
                </svg>
                <span>Filter</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="mt-2 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
              sideOffset={4}
            >
              {/* ALL TYPES */}
              <DropdownMenuItem
                onClick={() => {
                  setFilter("All Types");
                  setCurrentPage(1);
                }}
                className={`${
                  filter === "All Types"
                    ? "font-semibold cursor-default"
                    : "hover:bg-gray-100 cursor-pointer"
                } text-gray-700 text-sm px-4 py-2 focus:outline-none`}
              >
                All Types
              </DropdownMenuItem>

              {/* COMPLETED */}
              <DropdownMenuItem
                onClick={() => {
                  setFilter("Completed");
                  setCurrentPage(1);
                }}
                className={`${
                  filter === "Completed"
                    ? "font-semibold cursor-default"
                    : "hover:bg-gray-100 cursor-pointer"
                } text-gray-700 text-sm px-4 py-2 focus:outline-none`}
              >
                Completed
              </DropdownMenuItem>

              {/* CANCELLED */}
              <DropdownMenuItem
                onClick={() => {
                  setFilter("Cancelled");
                  setCurrentPage(1);
                }}
                className={`${
                  filter === "Cancelled"
                    ? "font-semibold cursor-default"
                    : "hover:bg-gray-100 cursor-pointer"
                } text-gray-700 text-sm px-4 py-2 focus:outline-none`}
              >
                Cancelled
              </DropdownMenuItem>

              {/* INITIATED */}
              <DropdownMenuItem
                onClick={() => {
                  setFilter("Initiated");
                  setCurrentPage(1);
                }}
                className={`${
                  filter === "Initiated"
                    ? "font-semibold cursor-default"
                    : "hover:bg-gray-100 cursor-pointer"
                } text-gray-700 text-sm px-4 py-2 focus:outline-none`}
              >
                Initiated
              </DropdownMenuItem>

              {/* SCHEDULED */}
              <DropdownMenuItem
                onClick={() => {
                  setFilter("Scheduled");
                  setCurrentPage(1);
                }}
                className={`${
                  filter === "Scheduled"
                    ? "font-semibold cursor-default"
                    : "hover:bg-gray-100 cursor-pointer"
                } text-gray-700 text-sm px-4 py-2 focus:outline-none`}
              >
                Scheduled
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 border rounded-full text-sm focus:outline-none">
                {/* Single icon or a simpler up/down icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  fill="none"
                  version="1.1"
                  width="8.75"
                  height="14"
                  viewBox="0 0 8.75 14"
                >
                  <defs>
                    <clipPath id="master_svg0_142_7553">
                      <rect x="0" y="0" width="8.75" height="14" rx="0" />
                    </clipPath>
                  </defs>
                  <g clip-path="url(#master_svg0_142_7553)">
                    <g transform="matrix(1,0,0,-1,0,26.851585388183594)">
                      <g>
                        <path
                          d="M3.765107280883789,25.4296926940918Q4.030267280883789,25.675792694091797,4.374957280883789,25.675792694091797Q4.719657280883789,25.675792694091797,4.984807280883789,25.4296926940918L8.37874728088379,21.929702694091795Q8.74995728088379,21.492202694091795,8.564357280883788,20.9726726940918Q8.325717280883788,20.453132694091796,7.768897280883789,20.425792694091797L0.981020280883789,20.425792694091797Q0.4242022808837891,20.453132694091796,0.18556598088378906,20.9726726940918Q-0.000039719116210937266,21.492202694091795,0.37117228088378906,21.929702694091795L3.765107280883789,25.4296926940918ZM3.765107280883789,13.671886694091796L0.37117228088378906,17.171882694091796L3.765107280883789,13.671886694091796L0.37117228088378906,17.171882694091796Q-0.000039719116210937266,17.609382694091796,0.18556598088378906,18.128912694091795Q0.4242022808837891,18.648452694091798,0.981020280883789,18.675792694091797L7.768897280883789,18.675792694091797Q8.325717280883788,18.648452694091798,8.564357280883788,18.128912694091795Q8.74995728088379,17.609382694091796,8.37874728088379,17.171882694091796L4.984807280883789,13.671886694091796Q4.719657280883789,13.425792694091797,4.374957280883789,13.425792694091797Q4.030267280883789,13.425792694091797,3.791627280883789,13.671886694091796L3.765107280883789,13.671886694091796Z"
                          fill="#374151"
                          fillOpacity="1"
                        />
                      </g>
                    </g>
                  </g>
                </svg>
                <span>Sort</span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="mt-2 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
              sideOffset={4} // moves the menu slightly away from the trigger
            >
              <DropdownMenuItem
                onClick={() => {
                  setSort("Descending");
                  setCurrentPage(1);
                }}
                className={`${
                  sort === "Descending"
                    ? "font-semibold cursor-default"
                    : "hover:bg-gray-100 cursor-pointer"
                } text-gray-700 text-sm px-4 py-2 focus:outline-none `}
              >
                Descending
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSort("Ascending");
                  setCurrentPage(1);
                }}
                className={`${
                  sort === "Ascending"
                    ? "font-semibold cursor-default"
                    : "hover:bg-gray-100 cursor-pointer"
                } text-gray-700 text-sm px-4 py-2 focus:outline-none `}
              >
                Ascending
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {sessions.map((session) => {
          const sessionDate = new Date(session.startedAt);
          const formattedDate = format(sessionDate, "MMM d, yyyy");
          const statusClasses = getStatusClasses(session.status);

          return (
            <div
              key={session.id}
              className="flex items-center justify-between border rounded-md p-4 bg-white"
            >
              {/* Left: Icon + Title + Date/Time/Duration */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center rounded-lg size-10 ${statusClasses}`}
                >
                  {getSessionIcon(session.type)}
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {getSessionTitle(session)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formattedDate}{" "}
                    {session.status === "Ended" &&
                      ` • ${formatDuration(session.duration)}`}
                  </p>
                </div>
              </div>
              {/* Right: Status Badge */}
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${statusClasses}`}
              >
                {session.status === "Ended"
                  ? "Completed"
                  : session.status === "Canceled"
                  ? "Cancelled"
                  : session.status === "cancelled"
                  ? "Cancelled"
                  : session.status}
              </span>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          {(() => {
            const maxVisiblePages = 5;
            const currentBlock = Math.floor(
              (currentPage - 1) / maxVisiblePages
            );
            const startPage = currentBlock * maxVisiblePages + 1;
            const endPage = Math.min(
              startPage + maxVisiblePages - 1,
              totalPages
            );

            return (
              <div className="inline-flex items-center divide-x divide-gray-300 border border-gray-300 rounded overflow-hidden text-sm">
                {/* Left Arrow */}
                {startPage > 1 && (
                  <button
                    onClick={() => setCurrentPage(startPage - 1)}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                  >
                    &lt;
                  </button>
                )}

                {/* Page Number Buttons */}
                {Array.from({ length: endPage - startPage + 1 }, (_, index) => {
                  const page = startPage + index;
                  const isActive = page === currentPage;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      disabled={isActive}
                      className={`px-3 py-2 ${
                        isActive
                          ? "bg-blue-500 text-white cursor-default"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                {/* Right Arrow */}
                {endPage < totalPages && (
                  <button
                    onClick={() => setCurrentPage(endPage + 1)}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                  >
                    &gt;
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default AllSessionsPage;
