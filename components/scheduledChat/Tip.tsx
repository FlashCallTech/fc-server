import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import { useChatTimerContext } from "@/lib/context/ChatTimerContext";
import { useEffect, useState } from "react";
import TipModal from "./TipModal";

interface Props {
    handleSendTip: (tipAmt: string) => Promise<void>;
    setText: React.Dispatch<React.SetStateAction<string>>;
    creatorId: string;
}

const Tip: React.FC<Props> = ({
    handleSendTip,
    setText,
    creatorId,
}) => {
    const [userType, setUserType] = useState<string>();
    const { walletBalance, setWalletBalance, updateWalletBalance } = useWalletBalanceContext();
   
    useEffect(() => {
        const userType = localStorage.getItem("userType");
        if (userType) {
            setUserType(userType);
        }
    }, []);

    return (
        <>
            {
                userType === 'client' && (
                    <div>
                        <TipModal walletBalance={walletBalance} setWalletBalance={setWalletBalance} updateWalletBalance={updateWalletBalance} handleSendTip = {handleSendTip} setText = {setText} creatorId={creatorId} />
                    </div>
                )
            }
            
        </>
    );
};

export default Tip;
