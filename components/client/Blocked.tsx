import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useGetBlockedClients } from "@/lib/react-query/queries";

import { creatorUser } from "@/types";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import ClientCard from "./ClientCard";
import { Button } from "../ui/button";

const Blocked = ({
  setClientListType,
}: {
  setClientListType: React.Dispatch<React.SetStateAction<"All" | "Blocked">>;
}) => {
  const [blockedClients, setBlockedClients] = useState<creatorUser[]>([]);
  const { creatorUser } = useCurrentUsersContext();
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });
  const {
    data: userBlockedClients,
    isFetching,
    isError,
    isLoading,
    hasNextPage,
    refetch,
    fetchNextPage,
  } = useGetBlockedClients(creatorUser?._id as string);

  useEffect(() => {
    const flatBlockedClients =
      userBlockedClients?.pages.flatMap((page) => page?.blockedClients || []) ||
      [];
    setBlockedClients(flatBlockedClients);
  }, [userBlockedClients]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetching]);

  return (
    <section className="flex size-full flex-col gap-2 px-4">
      {isLoading ? (
        <section
          className={`w-full h-[calc(100vh-14rem)] flex items-center justify-center`}
        >
          <SinglePostLoader />
        </section>
      ) : blockedClients.length === 0 ? (
        <div className="size-full md:h-[calc(100vh-14rem)] flex flex-col gap-2 items-center justify-center text-center !mt-0">
          <div className="bg-black/10 size-20 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-[35px]"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
              />
            </svg>
          </div>

          <p className="mt-2.5 font-bold text-lg text-[#111827]">
            No Blocked Clients Found
          </p>
          <span className="text-base text-[#6B7280]">
            Your blocked clients will appear here
          </span>
          <Button
            className={`text-sm font-medium mt-2.5 px-4 py-2 lg:rounded-full rounded-lg border border-gray-300 hoverScaleDownEffect lg:bg-black bg-green-1 text-white`}
            onClick={() => setClientListType("All")}
          >
            Browse Clients
          </Button>
        </div>
      ) : isError ? (
        <div className="size-full h-[calc(100vh-6rem)] flex flex-col items-center justify-center text-2xl font-semibold text-center text-red-500">
          Failed to fetch Blocked Clients
          <span className="text-lg">Please try again later.</span>
        </div>
      ) : (
        <div
          className={`w-full h-fit grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 items-center gap-5 text-black`}
        >
          {blockedClients.map((client) => (
            <ClientCard key={client._id} client={client} refetch={refetch} />
          ))}
        </div>
      )}
      {hasNextPage && isFetching && (
        <Image
          src="/icons/loading-circle.svg"
          alt="Loading..."
          width={50}
          height={50}
          className="mx-auto invert my-5 mt-10 z-20"
        />
      )}
      {creatorUser &&
        blockedClients.length > 0 &&
        !hasNextPage &&
        !isFetching && (
          <div className="text-center text-gray-500  py-4">
            You have reached the end of the list.
          </div>
        )}
      {hasNextPage && <div ref={ref} className="py-4 w-full" />}{" "}
    </section>
  );
};

export default Blocked;
