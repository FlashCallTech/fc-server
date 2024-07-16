import { useChatTimerContext } from "@/lib/context/ChatTimerContext";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import RechargeModal from "./RechargeModal";


const ChatRecharge: React.FC = () => {
    const { hasLowBalance } = useChatTimerContext();
    const {walletBalance, setWalletBalance} = useWalletBalanceContext();

    return (
        <>
            {hasLowBalance && <div className="flex justify-between items-center p-4 bg-[rgba(255,255,255,0.24)] mb-3">
                <div className="leading-5 font-normal text-white">Recharge to continue this <br /> chat.</div>
                <RechargeModal walletBalance = {walletBalance} setWalletBalance = {setWalletBalance}/>
            </div>}
        </>
    )
}

export default ChatRecharge;