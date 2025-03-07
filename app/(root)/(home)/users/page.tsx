"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useGetUniqueClients } from "@/lib/react-query/queries";
import { useInView } from "react-intersection-observer";
import GetRandomImage from "@/utils/GetRandomImage";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

// Define types based on your API's response structure.
interface ClientDetails {
    photo: string;
    fullName: string;
    email: string;
    _id: string;
}

export interface Client {
    clientDetails?: ClientDetails;
    startedAt: string;
    duration?: string;
    type?: string;
    status?: "Booked" | "Ended" | "Cancelled" | "Canceled";
    avgRating?: number | string;
}

export interface UniqueClientsResponse {
    clients: Client[];
    total: number;
    hasMore: boolean;
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

const UsersTable: React.FC = () => {
    const [search, setSearch] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("All Status");
    const [dateFilter, setDateFilter] = useState<string>("30 days");
    const { currentUser } = useCurrentUsersContext();
    const router = useRouter();

    // Set up intersection observer to trigger fetching next page.
    const { ref, inView } = useInView({
        threshold: 0.1,
        triggerOnce: false,
    });

    // Use React Query's infinite query hook.
    const {
        data: clientsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isError,
        isLoading,
    } = useGetUniqueClients(
        currentUser?._id as string,
        dateFilter,
        statusFilter,
    );

    // When the observer comes into view and there are more pages, fetch next page.
    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Combine all pages into a single array.
    const allClients: Client[] =
        clientsData?.pages.flatMap((page) => page.clients) || [];

    // Client-side filtering based on search text.
    const filteredClients = allClients.filter((client) => {
        const fullName = client?.clientDetails?.fullName ?? "User";
        const email = client?.clientDetails?.email ?? "";
        return (
            fullName.toLowerCase().includes(search.toLowerCase()) ||
            email.toLowerCase().includes(search.toLowerCase())
        );
    });

    const handleClick = (clientId: string) => {
        router.push(`/users/${clientId}`)
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-xl font-semibold">My Users</h2>
                    {/* Display total count from the first page, or 0 if undefined */}
                    <p className="text-sm text-[#4B5563]">
                        Total Users: {clientsData?.pages[0]?.total ?? 0}
                    </p>
                </div>
                <Button className="bg-[#16A34A] flex items-center gap-2 rounded-full text-white">
                    {/* SVG icon for campaign */}
                    <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="14" height="16" viewBox="0 0 14 16"><defs><clipPath id="master_svg0_142_5900"><rect x="0" y="0" width="14" height="16" rx="0" /></clipPath></defs><g clip-path="url(#master_svg0_142_5900)"><g transform="matrix(1,0,0,-1,0,30.75)"><g><path d="M11.9062,27.3438Q9.84375,29.3438,7,29.375Q5.0625,29.3438,3.5,28.4375Q1.9375,27.5,1,25.9375Q0.09375,24.375,0.0625,22.4375Q0.0625,20.5625,0.96875,18.96875L0,15.375L3.6875,16.34375Q5.21875,15.5,7,15.5Q8.9375,15.53125,10.5,16.4375Q12.0938,17.375,13.0312,18.9375Q13.9688,20.5,14,22.4375Q14,23.84375,13.4375,25.09375Q12.9062,26.3438,11.9062,27.3438ZM7,16.65625Q5.40625,16.6875,4.0625,17.46875L3.84375,17.59375L1.65625,17.03125L2.25,19.15625L2.125,19.375Q1.25,20.78125,1.21875,22.4375Q1.28125,24.875,2.9375,26.5Q4.5625,28.1562,7,28.1875Q9.375,28.1875,11.0625,26.5Q12.7812,24.8125,12.8438,22.4375Q12.75,20,11.0938,18.34375Q9.4375,16.71875,7,16.65625ZM10.1562,20.96875Q10,21.0625,9.5625,21.28125Q9.125,21.46875,8.96875,21.53125Q8.75,21.6875,8.59375,21.46875Q8.46875,21.3125,8.3125,21.09375Q8.125,20.875,8.03125,20.78125Q7.90625,20.59375,7.65625,20.75Q6.90625,21.09375,6.34375,21.53125Q5.78125,21.96875,5.3125,22.8125Q5.1875,23,5.40625,23.1875Q5.5625,23.3125,5.8125,23.75Q5.875,23.90625,5.78125,24.0625Q5.75,24.09375,5.65625,24.375Q5.5625,24.625,5.4375,24.9375Q5.3125,25.1875,5.25,25.34375Q5.0625,25.7188,4.90625,25.625Q4.875,25.625,4.875,25.625Q4.71875,25.625,4.53125,25.625Q4.34375,25.6562,4.0625,25.4375Q4.0625,25.4062,4.03125,25.375Q3.875,25.25,3.6875,24.90625Q3.5,24.5625,3.46875,23.96875Q3.5,23.34375,3.78125,22.8125Q4.0625,22.3125,4.15625,22.1875L4.1875,22.1875Q4.1875,22.15625,4.21875,22.125Q4.375,21.84375,5.15625,21Q5.90625,20.15625,7.125,19.5625Q7.9375,19.21875,8.375,19.125Q8.84375,19.0625,9.21875,19.125Q9.5,19.1875,9.875,19.40625Q10.25,19.625,10.375,19.9375Q10.5938,20.625,10.5,20.78125Q10.4375,20.875,10.25,20.9375Q10.1875,20.96875,10.1562,20.96875Z" fill="#FFFFFF" fill-opacity="1" /></g></g></g></svg>
                    <span>WhatsApp Campaign</span>
                </Button>
            </div>

            {/* Filters */}
            <div className="flex border rounded-lg p-6 gap-4 mb-8 w-full">
                <Input
                    placeholder="Search by name or email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-[2] rounded-none"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex-1 flex justify-between rounded-none">
                            <span>{statusFilter}</span>
                        </Button>
                    </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setStatusFilter("All Status")}>
                                All Status
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("Booked")}>
                                Booked
                            </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("Completed")}>
                            Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("Cancelled")}>
                            Cancelled
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex-1 flex justify-between rounded-none">
                            <span>Last {dateFilter}</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                {/* SVG path omitted */}
                            </svg>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setDateFilter("7 days")}>
                            Last 7 days
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDateFilter("30 days")}>
                            Last 30 days
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDateFilter("90 days")}>
                            Last 90 days
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Users Table */}
            <div className="rounded-lg border overflow-auto scrollbar-hide">
                <table className="table-auto w-full">
                    <thead className="text-sm font-medium text-black">
                        <tr>
                            <th className="px-6 py-3 text-left">Client</th>
                            <th className="px-6 py-3 text-left">Date & Time</th>
                            <th className="px-6 py-3 text-left">Service</th>
                            <th className="px-6 py-3 text-left">Type</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-left">Rating</th>
                            <th className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={7} className="text-center py-8">
                                    Loading...
                                </td>
                            </tr>
                        ) : isError ? (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-red-500">
                                    Error loading data
                                </td>
                            </tr>
                        ) : filteredClients.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-16 text-center align-middle">
                                    {/* A flex container inside the cell for the icon + text */}
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="52.5" height="60" viewBox="0 0 52.5 60"><defs><clipPath id="master_svg0_142_5825"><rect x="0" y="0" width="52.5" height="60" rx="0" /></clipPath></defs><g clip-path="url(#master_svg0_142_5825)"><g transform="matrix(1,0,0,-1,0,122.578125)"><g><path d="M15,121.2890625Q16.6406,121.2890625,17.6953,120.2343625Q18.75,119.1796625,18.75,117.5390625L18.75,113.7890625L33.75,113.7890625L33.75,117.5390625Q33.75,119.1796625,34.8047,120.2343625Q35.8594,121.2890625,37.5,121.2890625Q39.1406,121.2890625,40.1953,120.2343625Q41.25,119.1796625,41.25,117.5390625L41.25,113.7890625L46.875,113.7890625Q49.2188,113.6718625,50.8594,112.1484625Q52.3828,110.5078625,52.5,108.1640625L52.5,102.5390625L0,102.5390625L0,108.1640625Q0.117188,110.5078625,1.64062,112.1484625Q3.28125,113.6718625,5.625,113.7890625L11.25,113.7890625L11.25,117.5390625Q11.25,119.1796625,12.3047,120.2343625Q13.3594,121.2890625,15,121.2890625ZM0,98.7890625L52.5,98.7890625L0,98.7890625L52.5,98.7890625L52.5,66.9140625Q52.3828,64.5703125,50.8594,62.9296825Q49.2188,61.4062505,46.875,61.2890625L5.625,61.2890625Q3.28125,61.4062505,1.64062,62.9296825Q0.117188,64.5703125,0,66.9140625L0,98.7890625ZM35.7422,85.5468625Q37.3828,87.5390625,35.7422,89.5312625Q33.75,91.1718625,31.7578,89.5312625L26.25,84.0234625L20.7422,89.5312625Q18.75,91.1718625,16.7578,89.5312625Q15.1172,87.5390625,16.7578,85.5468625L22.2656,80.0390625L16.7578,74.5312625Q15.1172,72.5390625,16.7578,70.5468725Q18.75,68.9062525,20.7422,70.5468725L26.25,76.0546625L31.7578,70.5468725Q33.75,68.9062525,35.7422,70.5468725Q37.3828,72.5390625,35.7422,74.5312625L30.2344,80.0390625L35.7422,85.5468625Z" fill="#D1D5DB" fill-opacity="1" /></g></g></g></svg>
                                        <p className="mt-2 font-semibold">No users found</p>
                                        <p className="text-sm text-gray-500 max-w-md">
                                            There are no users yet. Once you start your consultation you will see
                                            your user details here.
                                        </p>
                                    </div>
                                </td>
                            </tr>

                        ) : (
                            filteredClients.map((client, index) => (
                                <tr key={index} className="border-b last:border-b-0 text-sm text-[#6B7280] hover:bg-gray-50 cursor-pointer" onClick={() => handleClick(client.clientDetails?._id as string)}>
                                    {/* Patient */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <Image
                                                src={client?.clientDetails?.photo || GetRandomImage()}
                                                width={100}
                                                height={100}
                                                alt="avatar"
                                                className="size-9 rounded-full object-cover"
                                            />
                                            <div>
                                                <p className="font-medium">
                                                    {client?.clientDetails?.fullName ?? "User"}
                                                </p>
                                                <p className="text-gray-500 text-[13px]">
                                                    {client?.clientDetails?.email ?? "-"}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Date & Time */}
                                    <td className="px-6 py-4">
                                        <p>{format(new Date(client.startedAt), "MMM d, yyyy")}</p>
                                        <p className="text-gray-500 text-sm">
                                            {format(new Date(client.startedAt), "h:mm a")}
                                        </p>
                                    </td>
                                    {/* Service */}
                                    <td className="px-6 py-4">{formatDuration(Number(client?.duration)) || "-"}</td>
                                    {/* Type */}
                                    <td className="px-6 py-4">{client?.type || "-"}</td>
                                    {/* Status */}
                                    <td className="px-6 py-4 text-[13px]">
                                        {client?.status === "Booked" && (
                                            <span className="bg-blue-200 text-blue-700 px-2 py-1 rounded-full">
                                                Booked
                                            </span>
                                        )}
                                        {client?.status === "Ended" && (
                                            <span className="bg-green-200 text-green-700 px-2 py-1 rounded-full">
                                                Completed
                                            </span>
                                        )}
                                        {(client?.status === "Cancelled" ||
                                            client?.status === "Canceled") && (
                                                <span className="bg-red-200 text-red-700 px-2 py-1 rounded-full">
                                                    Cancelled
                                                </span>
                                            )}
                                    </td>
                                    {/* Rating */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="16.75" height="16" viewBox="0 0 16.75 16"><defs><clipPath id="master_svg0_142_7976"><rect x="0" y="0" width="16.75" height="16" rx="0" /></clipPath></defs><g clip-path="url(#master_svg0_142_7976)"><g transform="matrix(1,0,0,-1,0,32.69061279296875)"><g><path d="M9.281249904632569,31.784406396484375Q8.999999904632569,32.31560639648438,8.374999904632569,32.34690639648437Q7.781249904632569,32.31560639648438,7.468749904632569,31.784406396484375L5.468749904632569,27.659406396484375L0.9687499046325684,26.971906396484375Q0.3749999046325684,26.878106396484377,0.18749990463256835,26.315616396484373Q-9.536743164617612e-8,25.721866396484373,0.4374999046325684,25.284366396484373L3.6874999046325683,22.065616396484373L2.9062499046325683,17.503116396484376Q2.8437499046325683,16.909369396484376,3.3124999046325683,16.534369396484376Q3.8124999046325683,16.190619396484376,4.374999904632569,16.471869396484376L8.374999904632569,18.596866396484376L12.406249904632569,16.471869396484376Q12.937449904632569,16.190619396484376,13.437449904632569,16.534369396484376Q13.937449904632569,16.909369396484376,13.843749904632569,17.503116396484376L13.093749904632569,22.065616396484373L16.343749904632567,25.284366396484373Q16.74994990463257,25.721866396484373,16.593749904632567,26.315616396484373Q16.37494990463257,26.878106396484377,15.781249904632569,26.971906396484375L11.281249904632569,27.659406396484375L9.281249904632569,31.784406396484375Z" fill="#FACC15" fill-opacity="1" /></g></g></g></svg>
                                            {client?.avgRating}
                                        </div>
                                    </td>
                                    {/* Actions */}
                                    <td className="px-6 py-4">
                                        <div className="flex gap-3 items-center justify-center">
                                            <button>
                                                <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="12.25" height="14" viewBox="0 0 12.25 14"><defs><clipPath id="master_svg0_142_7962"><rect x="0" y="0" width="12.25" height="14" rx="0" /></clipPath></defs><g clip-path="url(#master_svg0_142_7962)"><g transform="matrix(1,0,0,-1,0,26.90625)"><g><path d="M10.418,23.925825Q8.61328,25.675825,6.125,25.703125Q4.42969,25.675825,3.0625,24.882825Q1.69531,24.062525,0.875,22.695315Q0.0820312,21.328125,0.0546875,19.632815Q0.0546875,17.992185,0.847656,16.597655L0,13.453125L3.22656,14.300781Q4.56641,13.5625,6.125,13.5625Q7.82031,13.589844,9.1875,14.382813Q10.582,15.203125,11.4023,16.570315Q12.2227,17.937505,12.25,19.632815Q12.25,20.863285,11.7578,21.957034999999998Q11.293,23.050784999999998,10.418,23.925825ZM6.125,14.574215Q4.73047,14.601565,3.55469,15.285155L3.36328,15.394535L1.44922,14.902345L1.96875,16.761715L1.85938,16.953125Q1.09375,18.183595,1.06641,19.632815Q1.12109,21.765625,2.57031,23.187505Q3.99219,24.636725,6.125,24.664025000000002Q8.20312,24.664025000000002,9.67969,23.187505Q11.1836,21.710935,11.2383,19.632815Q11.1562,17.500005,9.70703,16.050785Q8.25781,14.628905,6.125,14.574215ZM8.88672,18.347655Q8.75,18.429685,8.36719,18.621095Q7.98438,18.785155,7.84766,18.839845Q7.65625,18.976565,7.51953,18.785155Q7.41016,18.648435,7.27344,18.457035Q7.10938,18.265625,7.02734,18.183595Q6.91797,18.019535,6.69922,18.156245Q6.04297,18.457035,5.55078,18.839845Q5.05859,19.222655,4.64844,19.960935Q4.53906,20.125005,4.73047,20.289065Q4.86719,20.398435,5.08594,20.781245Q5.14062,20.917965,5.05859,21.054685Q5.03125,21.082035,4.94922,21.328125Q4.86719,21.546875,4.75781,21.820315Q4.64844,22.039065,4.59375,22.175784999999998Q4.42969,22.503905,4.29297,22.421875Q4.26562,22.421875,4.26562,22.421875Q4.12891,22.421875,3.96484,22.421875Q3.80078,22.449215000000002,3.55469,22.257815Q3.55469,22.230465000000002,3.52734,22.203125Q3.39062,22.093745,3.22656,21.792965000000002Q3.0625,21.492185,3.03516,20.972655Q3.0625,20.425785,3.30859,19.960935Q3.55469,19.523435,3.63672,19.414065L3.66406,19.414065Q3.66406,19.386715,3.69141,19.359375Q3.82812,19.113285,4.51172,18.375005Q5.16797,17.636715,6.23438,17.117185Q6.94531,16.816405,7.32812,16.734375Q7.73828,16.679685,8.06641,16.734375Q8.3125,16.789065,8.64062,16.980465Q8.96875,17.171875,9.07812,17.445315Q9.26953,18.046875,9.1875,18.183595Q9.13281,18.265625,8.96875,18.320315Q8.91406,18.347655,8.88672,18.347655Z" fill="#16A34A" fill-opacity="1" /></g></g></g></svg>
                                            </button>
                                            <button>
                                                <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="15.75" height="14" viewBox="0 0 15.75 14"><defs><clipPath id="master_svg0_142_7966"><rect x="0" y="0" width="15.75" height="14" rx="0" /></clipPath></defs><g clip-path="url(#master_svg0_142_7966)"><g transform="matrix(1,0,0,-1,0,26.851564407348633)"><g><path d="M7.861062924258709,25.675782203674316Q6.207442924258709,25.648482203674316,4.906242924258709,25.019582203674318Q3.605032924258709,24.390582203674317,2.629132924258709,23.460982203674316Q1.680332924258709,22.558592203674316,1.056840924258709,21.601562203674316Q0.43334692425870897,20.644532203674316,0.13515402425870895,19.878912203674318Q-0.00038817574129104693,19.550782203674316,0.13515402425870895,19.222662203674318Q0.43334692425870897,18.457032203674316,1.056840924258709,17.500002203674317Q1.680332924258709,16.542972203674317,2.629132924258709,15.640622203674317Q3.605032924258709,14.710942203674316,4.906242924258709,14.082032203674316Q6.207442924258709,13.453126003674317,7.861062924258709,13.425782203674316Q9.51467292425871,13.453126003674317,10.815882924258709,14.082032203674316Q12.117082924258709,14.710942203674316,13.09298292425871,15.640622203674317Q14.041782924258708,16.542972203674317,14.665282924258708,17.500002203674317Q15.288782924258708,18.457032203674316,15.614082924258708,19.222662203674318Q15.749582924258709,19.550782203674316,15.614082924258708,19.878912203674318Q15.288782924258708,20.644532203674316,14.665282924258708,21.601562203674316Q14.041782924258708,22.558592203674316,13.09298292425871,23.460982203674316Q12.117082924258709,24.390582203674317,10.815882924258709,25.019582203674318Q9.51467292425871,25.648482203674316,7.861062924258709,25.675782203674316ZM3.957442924258709,19.550782203674316Q3.957442924258709,20.617192203674318,4.472502924258709,21.519532203674316Q4.987562924258709,22.42187220367432,5.909252924258709,22.968752203674317Q6.830932924258709,23.488282203674316,7.861062924258709,23.488282203674316Q8.89118292425871,23.488282203674316,9.81286292425871,22.968752203674317Q10.734582924258708,22.42187220367432,11.249582924258709,21.519532203674316Q11.76468292425871,20.617192203674318,11.76468292425871,19.550782203674316Q11.76468292425871,18.484372203674315,11.249582924258709,17.582032203674316Q10.734582924258708,16.679692203674318,9.81286292425871,16.132812203674316Q8.89118292425871,15.613282203674316,7.861062924258709,15.613282203674316Q6.830932924258709,15.613282203674316,5.909252924258709,16.132812203674316Q4.987562924258709,16.679692203674318,4.472502924258709,17.582032203674316Q3.957442924258709,18.484372203674315,3.957442924258709,19.550782203674316ZM7.861062924258709,21.300782203674316Q7.833952924258709,20.562502203674317,7.3459929242587085,20.070312203674316Q6.858042924258709,19.578122203674315,6.126112924258709,19.550782203674316Q5.827922924258709,19.550782203674316,5.583952924258709,19.632812203674316Q5.312862924258709,19.687502203674317,5.258652924258709,19.441412203674318Q5.258652924258709,19.167972203674317,5.339972924258709,18.867192203674318Q5.6652729242587085,17.800782203674316,6.559852924258709,17.281252203674317Q7.454432924258709,16.761722203674317,8.538772924258708,17.007812203674316Q9.596002924258709,17.335942203674318,10.111082924258708,18.238282203674316Q10.626082924258709,19.140622203674315,10.382182924258709,20.234372203674315Q10.13818292425871,21.082032203674316,9.48756292425871,21.601562203674316Q8.80985292425871,22.121092203674316,7.969492924258709,22.175782203674316Q7.725512924258709,22.121092203674316,7.779732924258709,21.847662203674318Q7.861062924258709,21.601562203674316,7.861062924258709,21.300782203674316Z" fill="#000000" fill-opacity="1" /></g></g></g></svg>
                                            </button>
                                            <button>
                                                <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="12.25" height="14" viewBox="0 0 12.25 14"><defs><clipPath id="master_svg0_142_7970"><rect x="0" y="0" width="12.25" height="14" rx="0" /></clipPath></defs><g clip-path="url(#master_svg0_142_7970)"><g transform="matrix(1,0,0,-1,0,28.6015625)"><g><path d="M2.625,27.42578125L2.625,26.55078125L2.625,27.42578125L2.625,26.55078125L1.3125,26.55078125Q0.765625,26.52348125,0.382812,26.16798125Q0.0273438,25.78518125,0,25.23828125L0,23.92578125L12.25,23.92578125L12.25,25.23828125Q12.2227,25.78518125,11.8672,26.16798125Q11.4844,26.52348125,10.9375,26.55078125L9.625,26.55078125L9.625,27.42578125Q9.625,27.80858125,9.37891,28.05468125Q9.13281,28.30078125,8.75,28.30078125Q8.36719,28.30078125,8.12109,28.05468125Q7.875,27.80858125,7.875,27.42578125L7.875,26.55078125L4.375,26.55078125L4.375,27.42578125Q4.375,27.80858125,4.12891,28.05468125Q3.88281,28.30078125,3.5,28.30078125Q3.11719,28.30078125,2.87109,28.05468125Q2.625,27.80858125,2.625,27.42578125ZM12.25,23.05078125L0,23.05078125L12.25,23.05078125L0,23.05078125L0,15.61328125Q0.0273438,15.06640625,0.382812,14.68359325Q0.765625,14.32812505,1.3125,14.30078125L10.9375,14.30078125Q11.4844,14.32812505,11.8672,14.68359325Q12.2227,15.06640625,12.25,15.61328125L12.25,23.05078125Z" fill="#000000" fill-opacity="1" /></g></g></g></svg>
                                            </button>
                                            <button>
                                                <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="14" height="14" viewBox="0 0 14 14"><defs><clipPath id="master_svg0_142_8096"><rect x="0" y="0" width="14" height="14" rx="0" /></clipPath></defs><g clip-path="url(#master_svg0_142_8096)"><g transform="matrix(1,0,0,-1,0,26.851551055908203)"><g><path d="M14.00018750372529,19.9882755279541Q13.97298750372529,18.4023355279541,13.04688750372529,17.117185527954103Q12.12078750372529,15.832025527954102,10.54108750372529,15.066395527954102Q8.98853750372529,14.328119527954101,7.02744750372529,14.300775527954102Q5.50215750372529,14.300775527954102,4.1947675037252905,14.792965527954102Q3.6772575037252904,14.410150527954102,2.7239475037252903,13.945306527954102Q1.6889275037252902,13.480463027954102,0.4904855037252903,13.425775527954102Q0.2181115037252903,13.425775527954102,0.0819249037252903,13.699213527954102Q0.00021280372529029756,13.972650527954102,0.1908745037252903,14.164056527954102L0.1908745037252903,14.191400527954102L0.2181115037252903,14.218744527954101Q0.2725865037252903,14.273431527954102,0.3542985037252903,14.382806527954102Q0.5449595037252903,14.574215527954102,0.7628585037252903,14.957025527954102Q1.2258975037252904,15.667965527954102,1.3620775037252904,16.679685527954103Q0.0819249037252903,18.1015555279541,0.0546875037252903,19.9882755279541Q0.0819249037252903,21.574215527954102,1.0079945037252904,22.859365527954104Q1.9340675037252903,24.144575527954103,3.5138275037252904,24.910175527954102Q5.06635750372529,25.6484755279541,7.02744750372529,25.6757755279541Q8.98853750372529,25.6484755279541,10.54108750372529,24.910175527954102Q12.12078750372529,24.144575527954103,13.04688750372529,22.859365527954104Q13.97298750372529,21.574215527954102,14.00018750372529,19.9882755279541Z" fill="#000000" fill-opacity="1" /></g></g></g></svg>
                                            </button>
                                        </div>
                                    </td>   
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {/* Loading indicator for next page */}
                {hasNextPage && isFetchingNextPage && (
                    <div className="flex justify-center my-5">
                        <Image
                            src="/icons/loading-circle.svg"
                            alt="Loading..."
                            width={50}
                            height={50}
                            className="invert"
                        />
                    </div>
                )}
                {/* End-of-list message */}
            </div>
            {!hasNextPage && !isFetchingNextPage && clientsData?.pages[0]?.clients.length >= 1 && (
                <div className="text-center text-gray-500 text-sm pt-4">
                    You have reached the end of the list
                </div>
            )}
            {hasNextPage && <div ref={ref} className="w-full" />}
        </div>
    );
};

export default UsersTable;
