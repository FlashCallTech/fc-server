import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import TipModal from "./TipModal";
import { useChatTimerContext } from "@/lib/context/ChatTimerContext";
import RechargeModal from "./RechargeModal";
import { useEffect, useState } from "react";

const Recharge: React.FC = () => {
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
            {hasLowBalance && (
                <div className="flex justify-between items-center p-4 bg-[rgba(255,255,255,0.24)] mb-3">
                    <div className="leading-5 font-normal text-white">
                        Recharge to continue this <br /> chat.
                    </div>
                    <RechargeModal walletBalance={walletBalance} setWalletBalance={setWalletBalance} />
                </div>
            )}
        </>
    );
};

export default Recharge;
