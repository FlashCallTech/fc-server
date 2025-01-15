import React from "react";

interface ModalProps {
    show: boolean;
    onClose: () => void;
    heading?: string;
    body?: string;
}

const Modal: React.FC<ModalProps> = ({ show, onClose, heading, body }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 text-center">
                <div className="py-6">
                    <div className="w-full lg:text-[#16BC88] text-green-1 flex justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="60" height="60" viewBox="0 0 60 60"><defs><clipPath id="master_svg0_3_05273"><rect x="0" y="0" width="60" height="60" rx="0" /></clipPath></defs><g clipPath="url(#master_svg0_3_05273)"><g transform="matrix(1,0,0,-1,0,122.578125)"><g><path d="M30,61.2890625Q38.2031,61.4062505,45,65.2734425Q51.7969,69.2578125,56.0156,76.2890625Q60,83.4374625,60,91.2890625Q60,99.14066249999999,56.0156,106.2890625Q51.7969,113.3202625,45,117.3046625Q38.2031,121.1718625,30,121.2890625Q21.7969,121.1718625,15,117.3046625Q8.20312,113.3202625,3.98438,106.2890625Q0,99.14066249999999,0,91.2890625Q0,83.4374625,3.98438,76.2890625Q8.20312,69.2578125,15,65.2734425Q21.7969,61.4062505,30,61.2890625ZM43.2422,96.7968625L28.2422,81.7968625L43.2422,96.7968625L28.2422,81.7968625Q26.25,80.1562625,24.2578,81.7968625L16.7578,89.2968625Q15.1172,91.2890625,16.7578,93.2812625Q18.75,94.9218625,20.7422,93.2812625L26.25,87.7734625L39.2578,100.7812625Q41.25,102.4218625,43.2422,100.7812625Q44.8828,98.7890625,43.2422,96.7968625Z" fill="currentColor" fillOpacity="1" /></g></g></g></svg>
                    </div>
                    <h2 className="text-xl text-[#111827] font-semibold mb-2">{heading || 'Payment Settings Updated'}</h2>
                    <p className="text-[#4B5563] text-base mb-6">
                        {body || "Your bank account details have been successfully saved."}
                    </p>
                    <button
                        onClick={onClose}
                        className="lg:bg-[#16BC88] bg-green-1 w-full text-white py-2 px-6 rounded-full hoverScaleDownEffect"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
