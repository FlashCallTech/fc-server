import { useChatTimerContext } from "@/lib/context/ChatTimerContext";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import RechargeModal from "./RechargeModal";
import TippingModal from "./TippingModal";


const ChatTip: React.FC = () => {
    const { walletBalance, setWalletBalance, updateWalletBalance } = useWalletBalanceContext();

    return (

        <div className="flex justify-between items-center p-4 bg-[rgba(255,255,255,0.24)] mb-3">
            <div className="leading-5 font-normal text-white">Recharge to continue this <br /> chat.</div>
            <TippingModal walletBalance={walletBalance} setWalletBalance={setWalletBalance} updateWalletBalance={updateWalletBalance} />
        </div>

    )
}

export default ChatTip;