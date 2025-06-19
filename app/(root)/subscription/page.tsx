"use client";

import { useEffect } from "react";

// Extend the global window interface to include 'paypal'
declare global {
  interface Window {
    paypal: any;
  }
}

const SubscribePage = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://www.paypal.com/sdk/js?client-id=AZqBx_DdMrrTE37oT9qFtzzkV7mxjxJmk0bBvhRZDO1KdFNySkZfKXDluB3PBPJS3V2a7dxrfiPPQ_aG&vault=true&intent=subscription";
    script.setAttribute("data-sdk-integration-source", "button-factory");

    script.onload = () => {
      if (window.paypal) {
        window.paypal.Buttons({
          style: {
            shape: "rect",
            color: "gold",
            layout: "vertical",
            label: "subscribe",
            height: 55, // increase button height
          },
          createSubscription: function (data: any, actions: any) {
            return actions.subscription.create({
              plan_id: "P-5KY44176C1295790ANBJ46OA",
            });
          },
          onApprove: function (data: any, actions: any) {
            alert(`Subscription ID: ${data.subscriptionID}`);
          },
        }).render("#paypal-button-container");
      }
    };

    document.body.appendChild(script);

    return () => {
      const container = document.getElementById("paypal-button-container");
      if (container) container.innerHTML = "";
    };
  }, []);

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-gray-100">
      <div className="w-full max-w-xs px-4"> {/* limit max width and add padding */}
        <div id="paypal-button-container" className="w-full" />
      </div>
    </div>
  );
};

export default SubscribePage;
