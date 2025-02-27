'use client';

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface Group {
    name: string;
    members: number;
    description: string;
}

const groups: Group[] = [
    { name: "Active Clients", members: 150, description: "Regular customers who have made purchases in the last 3 months" },
    { name: "VIP Clients", members: 42, description: "High-value customers with premium status" },
    { name: "New Clients", members: 89, description: "Customers who joined in the last 30 days" },
    { name: "Inactive Clients", members: 234, description: "Customers without activity in the last 6 months" }
];

const GroupsPage: React.FC = () => {
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("name");

    const filteredGroups = groups
        .filter(group => group.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => sortBy === "name" ? a.name.localeCompare(b.name) : b.members - a.members);

    return (
        <div className="p-6 space-y-4">
            {/* Top Bar */}
            <div className="flex items-center space-x-4">
                <Input
                    placeholder="Search groups..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-1/3"
                />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">Sort by {sortBy === "name" ? "name" : "members"}</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSortBy("name")}>Sort by name</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy("members")}>Sort by members</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline">Import Contacts</Button>
            </div>
            <Button className="bg-black text-white">Create New Group</Button>

            {/* Groups List */}
            <div className="grid grid-cols-4 gap-4">
                {filteredGroups.map((group, index) => (
                    <Card key={index} className="p-4">
                        <CardHeader>
                            <CardTitle className="text-md font-semibold">{group.name}</CardTitle>
                            <p className="text-gray-500 text-sm">{group.members} members</p>
                        </CardHeader>
                        <CardContent className="text-gray-600 text-sm">{group.description}</CardContent>
                        <div className="flex justify-between mt-3 text-sm text-blue-500">
                            <button>Edit</button>
                            <button className="text-red-500">Delete</button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default GroupsPage;
