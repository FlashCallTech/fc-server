import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import TipModal from "./TipModal";
import { useChatTimerContext } from "@/lib/context/ChatTimerContext";
import RechargeModal from "./RechargeModal";
import { useEffect, useState } from "react";

const RechargeAndTip: React.FC = () => {
    const { walletBalance, setWalletBalance, updateWalletBalance } = useWalletBalanceContext();
    const { hasLowBalance } = useChatTimerContext();
    const [userType, setUserType] = useState<string>();

    useEffect(() => {
        const userType = localStorage.getItem("userType");
        if (userType) {
            setUserType(userType);
        }
    }, []);

    return (
        <>
            {hasLowBalance ? (
                <div className="flex justify-between items-center p-4 bg-[rgba(255,255,255,0.24)] mb-3">
                    <div className="leading-5 font-normal text-white">
                        Recharge to continue this <br /> chat.
                    </div>
                    <RechargeModal walletBalance={walletBalance} setWalletBalance={setWalletBalance} />
                </div>
            ) : (
                userType === 'client' && (
                    <div className="flex justify-between items-center p-4 bg-[rgba(255,255,255,0.24)] mb-3">
                        <div className="leading-5 font-normal text-white">
                            Tip to support the<br /> creator.
                        </div>
                        <TipModal walletBalance={walletBalance} setWalletBalance={setWalletBalance} updateWalletBalance={updateWalletBalance} />
                    </div>
                )
            )}
        </>
    );
};

export default RechargeAndTip;
