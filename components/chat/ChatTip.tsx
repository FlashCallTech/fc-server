import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import TipModal from "./TipModal";

const ChatTip: React.FC = () => {
    const { walletBalance, setWalletBalance, updateWalletBalance } = useWalletBalanceContext();

    return (

        <div className="flex justify-between items-center p-4 bg-[rgba(255,255,255,0.24)] mb-3">
            <div className="leading-5 font-normal text-white">Tip to support the<br /> creator.</div>
            <TipModal walletBalance={walletBalance} setWalletBalance={setWalletBalance} updateWalletBalance={updateWalletBalance} />
        </div>

    )
}

export default ChatTip;