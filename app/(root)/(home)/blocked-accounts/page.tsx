"use client";

import Blocked from "@/components/client/Blocked";
import ClientList from "@/components/client/ClientList";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";

const BlockedClients = () => {
  const [clientListType, setClientListType] = useState<"All" | "Blocked">(
    "Blocked"
  );
  const options: ("Blocked" | "All")[] = ["All", "Blocked"];

  return (
    <div>
      <section className="lg:hidden flex flex-col gap-4 pb-5 w-full max-w-screen-lg h-full mx-auto">
        <section
          className={`sticky top-0 md:top-[76px] bg-white z-30 w-full p-4 pb-2 flex flex-row flex-wrap md:items-center justify-end transition-all duration-300`}
        >
          {/* Toggle Buttons */}
          <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
            {options.map((option) => (
              <Button
                key={option}
                className={`text-sm font-medium px-4 py-2 rounded-full border border-gray-300 hoverScaleDownEffect ${
                  clientListType === option && "bg-black text-white"
                }`}
                onClick={() => setClientListType(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </section>

        {/* Client List */}
        {clientListType === "Blocked" ? (
          <Blocked setClientListType={setClientListType} />
        ) : (
          <ClientList />
        )}
      </section>
      {/* new design */}
      <section className="hidden lg:flex flex-col gap-4 pb-5 w-full max-w-screen-lg h-full mx-auto">
        <section
          className={`sticky top-0 md:top-[76px] bg-white z-30 w-full p-4 pb-2 flex flex-row flex-wrap md:items-center justify-end transition-all duration-300`}
        >
          {/* Toggle Buttons */}
          <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
            {options.map((option) => (
              <Button
                key={option}
                className={`text-sm font-medium px-4 py-2 rounded-full border border-gray-300 hoverScaleDownEffect ${
                  clientListType === option && "bg-black text-white"
                }`}
                onClick={() => setClientListType(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </section>

        {/* Client List */}
        {clientListType === "Blocked" ? (
          <Blocked setClientListType={setClientListType} />
        ) : (
          <ClientList />
        )}
      </section>
    </div>
  );
};

export default BlockedClients;
