import { useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUser } from '@clerk/nextjs';

const useUserStatus = () => {
    const { user } = useUser();

    const updateUserStatus = async (online: boolean) => {
        if (!user?.publicMetadata?.userId) return;

        try {
            const userChatsRef = doc(db, "userchats", user?.publicMetadata?.userId as string);
            const userChatsSnapshot = await getDoc(userChatsRef);

            if (userChatsSnapshot.exists()) {
                const userChatsData = userChatsSnapshot.data();
                userChatsData.online = online;

                await updateDoc(userChatsRef, {
                    online: userChatsData.online,
                });
            }
        } catch (error) {
            console.error("Error updating user status:", error);
        }
    };

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                updateUserStatus(false);
            } else {
                updateUserStatus(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);
};

export default useUserStatus;
