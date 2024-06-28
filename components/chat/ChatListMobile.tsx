"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import SinglePostLoader from "../shared/SinglePostLoader";

const ChatListMobile = () => {
	const [chats, setChats] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchChatIds = async () => {
			try {
				const response = await fetch("/api/chats/getAllChatIds");
				const data = await response.json();
				setChats(data);
			} catch (error) {
				console.warn("Error fetching chat IDs:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchChatIds();
	}, []);

	if (loading) {
		return (
			<section className="w-full h-full flex items-center justify-center">
				<SinglePostLoader />
			</section>
		);
	}

	return (
		// <section className="grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 gap-5 xl:gap-10 w-full h-fit text-black px-4">
		// 	{chats.map((chat) => (
		// 		<Link href={`/chats/${chat.chatId}`} key={chat.chatId}>
		// 			<a className="flex items-center justify-between py-2 xl:max-w-[568px] border-b xl:border xl:rounded-xl xl:p-4 xl:shadow-md border-gray-300">
		// 				<p className="text-base tracking-wide">{chat.chatId}</p>
		// 			</a>
		// 		</Link>
		// 	))}
		// </section>
        <div></div>
	);
};

export default ChatListMobile;
