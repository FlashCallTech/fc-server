import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import TipModal from "./TipModal";
import { useChatTimerContext } from "@/lib/context/ChatTimerContext";
import { useEffect, useState } from "react";
import RechargeModal from "./RechargeModal";

interface Props {
    handleSendTip: (tipAmt: string) => Promise<void>;
    setText: React.Dispatch<React.SetStateAction<string>>;
}

const Tip: React.FC<Props> = ({
    handleSendTip,
    setText
}) => {
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
                        <TipModal walletBalance={walletBalance} setWalletBalance={setWalletBalance} updateWalletBalance={updateWalletBalance} handleSendTip = {handleSendTip} setText = {setText} />
                    </div>
                )
            )}
            {hasLowBalance && (
                userType === 'client' && (
                    <div>
                        <RechargeModal walletBalance={walletBalance} setWalletBalance={setWalletBalance} />
                    </div>
                )
            )
            
            }
        </>
    );
};

export default Tip;
