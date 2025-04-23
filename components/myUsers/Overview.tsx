import React, { useState } from 'react'
import RecentMessagesFirebase from './RecentMessages';
import { format } from 'date-fns';
import RecentNotes from './RecentNotes';

type calls = {
    serviceTitle?: string;
    status?: string;
    startedAt: string;
    category: string;
    type: string;
    duration?: string;
}[];

type client = {
    fullName?: string;
    email?: string;
    photo?: string;
    phone?: string;
    dob?: string;
    createdAt?: string;
};

type Props = {
    clientId: string;
    creatorId: string;
    calls: calls;
    client: client
}

function getSessionTitle(call: { type?: string; category?: string }): string {
    const type = call.type?.toLowerCase();
    if (type === "video") {
        return call.category === "PPM" ? "PPM Video Session" : "Scheduled Video Session";
    } else if (type === "chat") {
        return call.category === "PPM" ? "PPM Chat Session" : "Scheduled Chat Session";
    } else if (type === "audio") {
        return call.category === "PPM" ? "PPM Audio Session" : "Scheduled Audio Session";
    }
    return "Session Title";
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

const Overview: React.FC<Props> = ({ clientId, creatorId, calls, client }) => {

    return (
        <div className="grid grid-cols-3 gap-6 p-6">
            {/* Left Column */}
            <div className="col-span-2 space-y-8">
                {/* Recent Sessions */}
                <div>
                    <h2 className="text-lg font-semibold mb-4">Recent Sessions</h2>
                    <div className="text-sm border rounded-lg">
                        {calls && calls.length > 0 ? (
                            calls.map((call, index) => (
                                <div key={index} className={`flex items-center justify-between px-4 py-3 ${(calls.length !== 1 || index !== 2) && "border-b"}`}>
                                    <div>
                                        <p className="font-semibold text-sm">
                                            {getSessionTitle(call)}
                                        </p>
                                        <p className="text-[#6B7280] text-xs">
                                            {format(new Date(call.startedAt), "MMM d, yyyy")}{" "}
                                            {call.duration && `- ${formatDuration(Number(call.duration))}`}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-xs font-semibold rounded-full px-2 py-1 ${call.status === "Booked"
                                            ? "text-blue-700 bg-blue-200"
                                            : call.status === "Ended"
                                                ? "text-green-700 bg-green-200"
                                                : (call.status === "Cancelled" ||
                                                    call.status === "Canceled")
                                                    ? "text-red-700 bg-red-200"
                                                    : ""
                                            }`}
                                    >
                                        {call.status === "Ended" ? "Completed" : call.status === "Canceled" ? "Cancelled" : call.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 text-gray-500">
                                No sessions found.
                            </div>
                        )}
                    </div>
                </div>
                {/* Recent Messages */}
                <RecentMessagesFirebase
                    clientId={clientId as string}
                    creatorId={creatorId as string}
                />
            </div>
            {/* Right Column */}
            <div className="space-y-8">
                {/* Client Information */}
                <div>
                    <h2 className="text-lg font-semibold mb-4">Client Information</h2>
                    <div className="flex flex-col gap-4 text-sm border rounded-lg p-4 text-[#374151]">
                        <p className="flex flex-col gap-1">
                            <span className="font-semibold">Phone:</span>
                            <span>{client.phone || "+1 (123) 123-4567"}</span>
                        </p>
                        <p className="flex flex-col gap-1">
                            <span className="font-semibold">Email:</span>
                            <span>{client.email || "client@example.com"}</span>
                        </p>
                        <p className="flex flex-col gap-1">
                            <span className="font-semibold">Date of Birth:</span>
                            <span>{client.dob || "March 15, 1990"}</span>
                        </p>
                        <p className="flex flex-col gap-1">
                            <span className="font-semibold">Time of Birth:</span>
                            <span>08:30 AM</span>
                        </p>
                    </div>
                </div>
                {/* Notes */}
                <RecentNotes
                    clientId={clientId}
                    creatorId={creatorId}
                />
            </div>
        </div>
    )
}

export default Overview
