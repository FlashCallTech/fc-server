import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import TipModal from "./TipModal";
import { useChatTimerContext } from "@/lib/context/ChatTimerContext";
import RechargeModal from "./RechargeModal";

const RechargeAndTip: React.FC = () => {
    const { walletBalance, setWalletBalance, updateWalletBalance } = useWalletBalanceContext();
    const { hasLowBalance } = useChatTimerContext()

    return (
        <>
            {hasLowBalance ? (
                <div className="flex justify-between items-center p-4 bg-[rgba(255,255,255,0.24)] mb-3">
                    <div className="leading-5 font-normal text-white">Recharge to continue this <br /> chat.</div>
                    <RechargeModal walletBalance={walletBalance} setWalletBalance={setWalletBalance} />
                </div>
            ) : (
                <div className="flex justify-between items-center p-4 bg-[rgba(255,255,255,0.24)] mb-3">
                    <div className="leading-5 font-normal text-white">Tip to support the<br /> creator.</div>
                    <TipModal walletBalance={walletBalance} setWalletBalance={setWalletBalance} updateWalletBalance={updateWalletBalance} />
                </div>
            )

            }

        </>
    )
}

export default RechargeAndTip;