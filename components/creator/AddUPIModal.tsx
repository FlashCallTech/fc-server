import React, { useState } from "react";
import { Button } from "../ui/button";

const AddBankAccountModal = ({ isOpen, onClose, errors, setPaymentMethod, bankDetails, setBankDetails, save, otpGenerated, otpSubmitted, setOtp, saving }: { isOpen: boolean; onClose: () => void; errors: any; setPaymentMethod: any; bankDetails: any; setBankDetails: any; save: () => void; otpGenerated: boolean; otpSubmitted: any; setOtp: any, saving: any }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
                {/* Modal Header */}
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Add New UPI ID</h2>
                    <button
                        className="text-gray-500 text-xl hover:text-gray-700"
                        onClick={onClose}
                    >
                        &times;
                    </button>
                </div>

                {/* Modal Body */}
                <form className="mt-4 space-y-4">
                    <div>
                        <label
                            htmlFor="accountNumber"
                            className="block text-sm font-medium text-[#374151]"
                        >
                            UPI ID
                        </label>
                        <input
                            type="text"
                            id="accountNumber"
                            placeholder="Enter UPI ID"
                            value={bankDetails.upiId}
                            onChange={(e) =>
                                setBankDetails({
                                    ...bankDetails,
                                    upiId: e.target.value,
                                })
                            }
                            className="mt-1 px-3 py-2 block w-full focus:outline-none rounded-lg border-[1px] border-solid border-[#D1D5DB]"
                        />
                        {errors.accountNumber && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.upiId}
                            </p>
                        )}
                        {otpGenerated && !otpSubmitted && (
                            <div className="mt-2">
                                <label
                                    className="block text-sm font-semibold mb-1"
                                    htmlFor="otp"
                                >
                                    Add the last two digits after decimal of the amount received
                                </label>
                                <input
                                    id="otp"
                                    type="text"
                                    placeholder="Enter OTP"
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full border p-2 text-sm rounded-lg"
                                />
                            </div>
                        )}
                    </div>
                </form>

                {/* Modal Footer */}
                <div className="mt-6 flex justify-end gap-4">
                    <Button
                        className="text-gray-700 border border-gray-300 rounded-full hoverScaleDownEffect"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            save(),
                                setPaymentMethod("UPI")
                        }}
                        className="text-white bg-black rounded-full hoverScaleDownEffect">
                        {saving ? (otpGenerated ? "Saving..." : "Sending OTP..." ) : otpGenerated ? "Submit OTP" : "Send OTP"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AddBankAccountModal;