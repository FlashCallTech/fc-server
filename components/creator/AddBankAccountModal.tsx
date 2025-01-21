import React, { useState } from "react";
import { Button } from "../ui/button";

const AddBankAccountModal = ({ isOpen, onClose, errors, setPaymentMethod, bankDetails, setBankDetails, save, saving }: { isOpen: boolean; onClose: () => void; errors: any; setPaymentMethod: any; bankDetails: any; setBankDetails: any; save: () => void; saving: boolean }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
                {/* Modal Header */}
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Add New Bank Account</h2>
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
                            Account Number
                        </label>
                        <input
                            type="text"
                            id="accountNumber"
                            placeholder="Enter account number"
                            value={bankDetails.accountNumber}
                            onChange={(e) =>
                                setBankDetails({
                                    ...bankDetails,
                                    accountNumber: e.target.value,
                                })
                            }
                            className="mt-1 px-3 py-2 block w-full focus:outline-none rounded-lg border-[1px] border-solid border-[#D1D5DB]"
                        />
                        {errors.accountNumber && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.accountNumber}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="ifscCode"
                            className="block text-sm font-medium text-gray-700"
                        >
                            IFSC Code
                        </label>
                        <input
                            type="text"
                            id="ifscCode"
                            placeholder="Enter IFSC code"
                            value={bankDetails.ifscCode}
                            onChange={(e) =>
                                setBankDetails({
                                    ...bankDetails,
                                    ifscCode: e.target.value.toUpperCase(),
                                })
                            }
                            className="mt-1 px-3 py-2 block w-full focus:outline-none rounded-lg border-[1px] border-solid border-[#D1D5DB]"
                        />
                        {errors.ifscCode && (
                            <p className="text-red-500 text-sm mt-1">{errors.ifscCode}</p>
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
                                setPaymentMethod("bankTransfer")
                        }}
                        className="text-white bg-black rounded-full hoverScaleDownEffect">
                        {saving ? "Saving..." : "Add Account"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AddBankAccountModal;