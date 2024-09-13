import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import TipModal from "./TipModal";
import { useChatTimerContext } from "@/lib/context/ChatTimerContext";
import RechargeModal from "./RechargeModal";
import { useEffect, useState } from "react";

const Tip: React.FC = () => {
    const [userType, setUserType] = useState<string>();
    const { walletBalance, setWalletBalance, updateWalletBalance } = useWalletBalanceContext();
    const { hasLowBalance } = useChatTimerContext();

    useEffect(() => {
        const userType = localStorage.getItem("userType");
        if (userType) {
            setUserType(userType);
        }
    }, []);

    return (
        <>
            {!hasLowBalance && (
                userType === 'client' && (
                    <div>
                        <TipModal walletBalance={walletBalance} setWalletBalance={setWalletBalance} updateWalletBalance={updateWalletBalance} />
                    </div>
                )
            )}
        </>
    );
};

export default Tip;
