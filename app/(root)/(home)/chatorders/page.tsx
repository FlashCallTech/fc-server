
// import CallList from "@/components/calls/CallList";

import ChatListMobile from "@/components/chat/chatListMobile";

const ChatOrders = () => {
	return (
		<section className="flex size-full flex-col gap-2 pb-5 md:py-0">
			<h1 className="sticky top-16 bg-white z-30 w-full px-4 py-4 pt-6 text-3xl font-bold">
				Order History
			</h1>
			<ChatListMobile />
			{/* <CallList type="ended" /> */}
		</section>
	);
};

export default ChatOrders;
