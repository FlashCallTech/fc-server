import React from "react";

interface ModalProps {
    show: boolean;
    onClose: () => void;
    setIsAddBankModalOpen: any
    setIsUPIModalOpen: any
}

const PaymentMethodModal: React.FC<ModalProps> = ({ show, onClose, setIsAddBankModalOpen, setIsUPIModalOpen }) => {
    if (!show) return null;

    const handleClick = (method: string) => {
        if(method === "upi") setIsUPIModalOpen(true);
        else setIsAddBankModalOpen(true);
        onClose();
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 text-center">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Select Payment Method</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <div className="py-4">
                    <button
                        onClick={() => handleClick("bank")}
                        className="flex items-center justify-between w-full p-4 border rounded-lg mb-2 text-left hoverScaleDownEffect"
                    >
                        <span className="flex gap-3 items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="16" height="16" viewBox="0 0 16 16"><defs><clipPath id="master_svg0_50_4980"><rect x="0" y="0" width="16" height="16" rx="0"/></clipPath></defs><g clipPath="url(#master_svg0_50_4980)"><g transform="matrix(1,0,0,-1,0,32.6875)"><g><path d="M7.595768975830078,32.24995L0.7034599758300781,29.24995L7.595768975830078,32.24995L0.7034599758300781,29.24995Q0.02653687583007812,28.90625,0.14961377583007812,28.15625Q0.33422897583007816,27.40625,1.103459975830078,27.34375L1.103459975830078,27.09375Q1.164998975830078,26.40625,1.841918975830078,26.34375L14.149568975830078,26.34375Q14.826568975830078,26.40625,14.888068975830079,27.09375L14.888068975830079,27.34375Q15.657268975830078,27.40625,15.841968975830078,28.15625Q15.964968975830079,28.90625,15.288068975830079,29.24995L8.395768975830078,32.24995Q7.995768975830078,32.43755,7.595768975830078,32.24995ZM4.057308975830078,25.34375L2.0880789758300784,25.34375L4.057308975830078,25.34375L2.0880789758300784,25.34375L2.0880789758300784,19.21875Q2.057308975830078,19.1875,2.026538975830078,19.1875L0.5496139758300782,18.1875Q-0.004232024169921869,17.75,0.14961377583007812,17.0625Q0.3957679758300781,16.375,1.103459975830078,16.34375L14.888068975830079,16.34375Q15.595768975830078,16.375,15.841968975830078,17.0625Q15.995768975830078,17.75,15.441968975830077,18.1875L13.964968975830079,19.1875Q13.934268975830078,19.1875,13.934268975830078,19.1875Q13.903468975830078,19.1875,13.903468975830078,19.21875L13.903468975830078,25.34375L11.934268975830078,25.34375L11.934268975830078,19.34375L10.703468975830079,19.34375L10.703468975830079,25.34375L8.734228975830078,25.34375L8.734228975830078,19.34375L7.257308975830078,19.34375L7.257308975830078,25.34375L5.288078975830078,25.34375L5.288078975830078,19.34375L4.057308975830078,19.34375L4.057308975830078,25.34375ZM7.995768975830078,30.34375Q8.426538975830079,30.34375,8.703458975830078,30.06255Q8.980378975830078,29.78125,8.980378975830078,29.34375Q8.980378975830078,28.90625,8.703458975830078,28.62495Q8.426538975830079,28.34375,7.995768975830078,28.34375Q7.564998975830078,28.34375,7.288078975830078,28.62495Q7.0111489758300785,28.90625,7.0111489758300785,29.34375Q7.0111489758300785,29.78125,7.288078975830078,30.06255Q7.564998975830078,30.34375,7.995768975830078,30.34375Z" fill="#4B5563" fillOpacity="1"/></g></g></g></svg>
                            Bank Account
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="8" height="16" viewBox="0 0 8 16"><defs><clipPath id="master_svg0_50_4985"><rect x="0" y="0" width="8" height="16" rx="0"/></clipPath></defs><g clipPath="url(#master_svg0_50_4985)"><g transform="matrix(1,0,0,-1,0,30.6875)"><g><path d="M7.71875,23.0625Q8,22.75,8,22.34375Q8,21.9375,7.71875,21.625L1.71875,15.625Q1.40625,15.34375,1,15.34375Q0.59375,15.34375,0.28125,15.625Q0,15.9375,0,16.34375Q0,16.75,0.28125,17.0625L5.59375,22.34375L0.28125,27.62495Q0,27.93755,0,28.34375Q0,28.74995,0.28125,29.06255Q0.59375,29.34375,1,29.34375Q1.40625,29.34375,1.71875,29.06255L7.71875,23.0625Z" fill="#9CA3AF" fillOpacity="1"/></g></g></g></svg>

                    </button>
                    <button
                        onClick={() => handleClick("upi")}
                        className="flex items-center justify-between w-full p-4 border rounded-lg text-left hoverScaleDownEffect"
                    >
                        <span className="flex gap-3 items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="11" height="16" viewBox="0 0 11 16"><defs><clipPath id="master_svg0_50_5005"><rect x="0" y="0" width="11" height="16" rx="0"/></clipPath></defs><g clipPath="url(#master_svg0_50_5005)"><g transform="matrix(1,0,0,-1,0,32.6875)"><g><path d="M0,30.34375Q0.03125,31.18755,0.59375,31.74995Q1.15625,32.31255,2,32.34375L9,32.34375Q9.84375,32.31255,10.4062,31.74995Q10.9688,31.18755,11,30.34375L11,18.34375Q10.9688,17.5,10.4062,16.9375Q9.84375,16.375,9,16.34375L2,16.34375Q1.15625,16.375,0.59375,16.9375Q0.03125,17.5,0,18.34375L0,30.34375ZM6.5,18.34375Q6.5,18.78125,6.21875,19.0625Q5.9375,19.34375,5.5,19.34375Q5.0625,19.34375,4.78125,19.0625Q4.5,18.78125,4.5,18.34375Q4.5,17.90625,4.78125,17.625Q5.0625,17.34375,5.5,17.34375Q5.9375,17.34375,6.21875,17.625Q6.5,17.90625,6.5,18.34375ZM9,30.34375L2,30.34375L9,30.34375L2,30.34375L2,20.34375L9,20.34375L9,30.34375Z" fill="#4B5563" fillOpacity="1"/></g></g></g></svg>
                            UPI
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="8" height="16" viewBox="0 0 8 16"><defs><clipPath id="master_svg0_50_4985"><rect x="0" y="0" width="8" height="16" rx="0"/></clipPath></defs><g clipPath="url(#master_svg0_50_4985)"><g transform="matrix(1,0,0,-1,0,30.6875)"><g><path d="M7.71875,23.0625Q8,22.75,8,22.34375Q8,21.9375,7.71875,21.625L1.71875,15.625Q1.40625,15.34375,1,15.34375Q0.59375,15.34375,0.28125,15.625Q0,15.9375,0,16.34375Q0,16.75,0.28125,17.0625L5.59375,22.34375L0.28125,27.62495Q0,27.93755,0,28.34375Q0,28.74995,0.28125,29.06255Q0.59375,29.34375,1,29.34375Q1.40625,29.34375,1.71875,29.06255L7.71875,23.0625Z" fill="#9CA3AF" fillOpacity="1"/></g></g></g></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentMethodModal;
