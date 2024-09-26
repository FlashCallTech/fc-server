import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import * as Sentry from "@sentry/nextjs";
import { useParams } from 'next/navigation';


const useMarkAsSeen = () => {
  const { chatId } = useParams();

  const markMessagesAsSeen = async () => {
		if (!chatId) return;
		try {
			const chatRef = doc(db, "chats", chatId as string);
			const chatSnapshot = await getDoc(chatRef);
			if (chatSnapshot.exists()) {
				const chatData = chatSnapshot.data();
				const updatedMessages = chatData.messages.map((message: any) => ({
					...message,
					seen: true,
				}));
				await updateDoc(chatRef, { messages: updatedMessages });
			}
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error marking messages as seen:", error);
		}
	};
  return {
    markMessagesAsSeen
  }
}

export default useMarkAsSeen
