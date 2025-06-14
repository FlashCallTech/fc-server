"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { creatorUser } from "@/types";
import Link from "next/link";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { Cursor, Typewriter } from "react-simple-typewriter";
import ContentLoading from "@/components/shared/ContentLoading";
import { trackEvent } from "@/lib/mixpanel";
import useRecharge from "@/hooks/useRecharge";
import axios from "axios";
import { backendBaseUrl } from "@/lib/utils";

const Recharge: React.FC = () => {
  const [creator, setCreator] = useState<creatorUser>();
  const [method, setMethod] = useState("");
  const [pg, setPg] = useState<string>("");
  const { userType, clientUser } = useCurrentUsersContext();
  const { loading } = useRecharge();
  const searchParams = useSearchParams();
  const amount = searchParams.get("amount");

  const amountInt: number | null = amount ? parseFloat(amount) : null;

  const subtotal: number | null =
    amountInt !== null ? parseFloat(amountInt.toFixed(2)) : null;
  const gstRate: number = 18; // GST rate is 18%
  const gstAmount: number | null =
    subtotal !== null
      ? parseFloat(((subtotal * gstRate) / 100).toFixed(2))
      : null;
  const totalPayable: number | null =
    subtotal !== null && gstAmount !== null
      ? parseFloat((subtotal + gstAmount).toFixed(2))
      : null;

  useEffect(() => {
    const getPg = async () => {
      const response = await axios.get(`${backendBaseUrl}/order/getPg`);
      const data = response.data;
      if (data.activePg) setPg(data.activePg);
    };

    getPg();
  }, []);

  useEffect(() => {
    const storedCreator = localStorage.getItem("currentCreator");
    if (storedCreator) {
      const parsedCreator: creatorUser = JSON.parse(storedCreator);
      if (parsedCreator) {
        setCreator(parsedCreator);
      }
    }
  }, []);

  useEffect(() => {
    if (creator)
      trackEvent("Recharge_Page_Cart_review_Impression", {
        Client_ID: clientUser?._id,
        User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
        Creator_ID: creator?._id,
        Recharge_value: amount,
        Walletbalace_Available: clientUser?.walletBalance,
      });
  }, [creator]);

  const creatorURL = localStorage.getItem("creatorURL");

  return (
    <>
      {loading ? (
        <section className="w-full h-full flex flex-col items-center justify-center gap-4">
          <ContentLoading />
          <h1 className="text-xl md:text-2xl font-semibold">
            <Typewriter
              words={["Processing Current Transaction", "Please Wait ..."]}
              loop={true}
              cursor
              cursorStyle="_"
              typeSpeed={50}
              deleteSpeed={50}
              delaySpeed={2000}
            />
            <Cursor cursorColor="#50A65C" />
          </h1>
        </section>
      ) : (
        <div className="overflow-y-scroll p-4 pt-0 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col items-center justify-center w-full">
          {/* Payment Information */}
          <section className="w-full py-5 sticky">
            <section className="flex items-center gap-2 mb-2">
              <Link
                href={`${
                  creatorURL
                    ? creatorURL
                    : userType === "creator"
                    ? "/home"
                    : "/"
                }`}
                className="text-xl font-bold hoverScaleDownEffect"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5 8.25 12l7.5-7.5"
                  />
                </svg>
              </Link>
              <h1 className="text-xl md:text-2xl font-bold">
                Payment Information{" "}
              </h1>
            </section>
            {/* Payment Details */}
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
              <h2 className="text-sm text-gray-500 mb-4">Payment Details</h2>
              <div className="flex justify-between mb-2">
                <span>Total Amount</span>
                <span>{`₹${amount}`}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>GST(18%)</span>
                <span>{`₹${gstAmount?.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total Payable Amount</span>
                <span>{`₹${totalPayable?.toFixed(2)}`}</span>
              </div>
            </div>
          </section>

          {/* UPI Payment Options */}
          <section className="w-full grid grid-cols-1  gap-4 mb-5">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col items-start justify-center gap-4 w-full ">
              <h3 className="text-sm text-gray-500">
                Pay directly with your favourite UPI apps
              </h3>
              <div className="w-full grid grid-cols-2 gap-4 text-sm text-gray-500">
                {[
                  { name: "UPI", icon: "/upi.svg" },
                  { name: "NetBanking", icon: "/netbanking.svg" },
                  { name: "Wallet", icon: "/wallet.svg" },
                  { name: "Cards", icon: "/card.svg" },
                ].map((app) => (
                  <button
                    key={app.name}
                    onClick={() => setMethod(app.name.toLowerCase())}
                    className={`flex flex-col items-center bg-white hover:bg-gray-300  ${
                      method === app.name.toLowerCase()
                        ? "bg-gray-300"
                        : "bg-white"
                    }`}
                  >
                    <Image
                      src={app.icon}
                      alt={app.name}
                      width={0}
                      height={0}
                      className="w-10 h-auto"
                    />
                    <span className="mt-2">{app.name}</span>
                  </button>
                ))}
              </div>
              {/* <button className="text-black">
								Pay with other UPI apps &rarr;
							</button> */}
            </div>

            {/* Other Payment Methods

						<div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
							<h3 className="text-sm text-gray-500 font-medium mb-4">
								Other Payment Methods
							</h3>
							<div className="space-y-2">
								{["UPI", "Credit/Debit Card", "Net Banking"].map((method) => (
									<label key={method} className="flex items-center space-x-2">
										<input
											type="radio"
											name="paymentMethod"
											className="form-radio"
										/>
										<span>{method}</span>
									</label>
								))}
							</div>
						</div> */}
          </section>

          <div className="w-full flex flex-row items-center justify-center opacity-[75%] mb-14">
            <Image
              src="/secure.svg"
              width={20}
              height={20}
              alt="secure"
              className="mr-2"
            />
            <p className="font-bold text-sm leading-5">
              Secured By Trusted Indian Banks
            </p>
          </div>

          {/* Payment Button */}
          <button
            className="w-4/5 md:w-1/3 mx-auto py-3 text-black bg-white rounded-lg border-2 border-black font-semibold fixed bottom-3"
            style={{ boxShadow: "3px 3px black" }}
            disabled={loading} // Disable the button when loading
          >
            Proceed to Payment
          </button>
        </div>
      )}
    </>
  );
};

export default Recharge;
