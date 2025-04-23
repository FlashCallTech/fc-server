"use client";

import CreatorCampaignStatusChangeAlert from "@/components/alerts/CreatorCampaignStatusChangeAlert";
import DeleteCreatorCampaignAlert from "@/components/alerts/DeleteCreatorCampaignAlert";
import WhatsappCampaign from "@/components/campaign/WhatsappCampaign";
import DiscountServiceCards from "@/components/discountServices/DiscountServiceCards";
import ContentLoading from "@/components/shared/ContentLoading";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useGetCreatorCampaigns } from "@/lib/react-query/queries";
import { backendBaseUrl } from "@/lib/utils";
import { CreatorCampaign } from "@/types";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useState } from "react";

const CreatorCampaignPage = () => {
  const { creatorUser, userType, fetchingUser } = useCurrentUsersContext();
  const params = useParams();
  const [toggleCampaignSheet, setToggleCampaignSheet] = useState(false);
  const [selectedCampaign, setSelectedCampaign] =
    useState<CreatorCampaign | null>(null);
  const [toggleCampaignDeleteAlert, setToggleCampaignDeleteAlert] =
    useState(false);
  const [toggleCampaignStatusChangeAlert, setToggleCampaignStatusChangeAlert] =
    useState(false);
  const [deletingCampaign, setDeletingCampaign] = useState(false);
  const [updatingCampaignStatus, setUpdatingCampaignStatus] = useState(false);
  const { data, isLoading, isError, fetchNextPage, hasNextPage, refetch } =
    useGetCreatorCampaigns(creatorUser?._id);
  const creatorURL = localStorage.getItem("creatorURL");

  const { toast } = useToast();

  const campaigns = data?.pages.flatMap((page) => page.campaigns) || [];

  if (fetchingUser) {
    return (
      <div className="size-full h-[calc(100vh-6rem)] flex flex-col items-center justify-center text-2xl font-semibold text-center">
        <ContentLoading />
        <p className="text-green-1 font-semibold text-lg flex items-center gap-2">
          Fetching Creator&apos;s Details{" "}
          <Image
            src="/icons/loading-circle.svg"
            alt="Loading..."
            width={24}
            height={24}
            priority
          />
        </p>
      </div>
    );
  }

  const handleConfirmDelete = async (campaignId: string) => {
    try {
      setDeletingCampaign(true);
      await axios.delete(`${backendBaseUrl}/campaigns/whatsapp/${campaignId}`);
      setToggleCampaignDeleteAlert(false);
      setSelectedCampaign(null);
      toast({
        variant: "destructive",
        title: "Campaign deleted successfully",
        description: "Campaign was removed.",
        toastStatus: "positive",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unable to delete campaign",
        description: "Campaign was not removed.",
        toastStatus: "negative",
      });
      console.warn(error);
    } finally {
      refetch();
      setDeletingCampaign(false);
    }
  };

  const handleToggleCampaignStatus = async (campaignId?: string) => {
    try {
      setUpdatingCampaignStatus(true);

      const updatedStatus =
        selectedCampaign?.status === "active" ? "paused" : "active";

      const updateResponse = await axios.put(
        `${backendBaseUrl}/campaigns/whatsapp/${campaignId}`,
        { status: updatedStatus }
      );

      if (updateResponse.status === 200) {
        setToggleCampaignStatusChangeAlert(false);
        setSelectedCampaign(null);
        toast({
          variant: "destructive",
          title: "Campaign updated successfully",
          description: "Campaign status was changed.",
          toastStatus: "positive",
        });
        return;
      } else {
        throw new Error("Failed to update campaign");
      }
    } catch (error) {
      console.error("Error toggling campaign status:", error);
      toast({
        variant: "destructive",
        title: "Unable to update campaign",
        description: "Campaign was not updated.",
        toastStatus: "negative",
      });
    } finally {
      refetch();
      setUpdatingCampaignStatus(false);
    }
  };

  const isAuthenticated = !!creatorUser;

  if (!isAuthenticated || userType === "client") {
    return !fetchingUser ? (
      <div className="size-full h-[calc(100vh-6rem)] flex items-center justify-center text-2xl font-semibold text-center text-gray-400">
        <p>
          Oops! We couldn&apos;t find the campaigns you&apos;re looking for.
        </p>
      </div>
    ) : (
      <SinglePostLoader />
    );
  }

  return (
    <>
      <DeleteCreatorCampaignAlert
        showDeleteCampaignAlert={toggleCampaignDeleteAlert}
        setShowDeleteCampaignAlert={setToggleCampaignDeleteAlert}
        handleConfirmRemove={handleConfirmDelete}
        loading={deletingCampaign}
        campaignId={selectedCampaign?._id}
      />
      <CreatorCampaignStatusChangeAlert
        showCampaignStatusChangeAlert={toggleCampaignStatusChangeAlert}
        setShowCampaignStatusChangeAlert={setToggleCampaignStatusChangeAlert}
        handleConfirmUpdateStatus={handleToggleCampaignStatus}
        loading={updatingCampaignStatus}
        campaignId={selectedCampaign?._id}
        currentStatus={selectedCampaign?.status}
      />
      <div className="relative size-full flex flex-col mx-auto p-4">
        {params.type === "discount" ? (
          <DiscountServiceCards creator={creatorUser} />
        ) : params.type === "whatsapp" ? (
          // <WhatsappCampaign creator={creatorUser} />
          <>
            {!toggleCampaignSheet && (
              <section
                className={`sticky flex lg:hidden w-full items-center justify-between top-0 lg:top-[76px] bg-white z-30 -mt-4 pt-4 pb-2 transition-all duration-300`}
              >
                <div className="w-full flex justify-between flex-wrap items-center">
                  <div className="flex items-center gap-4">
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
                      Active Campaigns
                    </h1>
                  </div>
                  <Button
                    className="bg-black text-white rounded-full hoverScaleDownEffect flex items-center gap-2 ml-auto"
                    onClick={() => setToggleCampaignSheet((prev) => !prev)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                    Add Campaign
                  </Button>
                </div>
              </section>
            )}

            {isLoading ? (
              <div className="size-full h-[calc(100vh-6rem)] flex flex-col gap-2 items-center justify-center">
                <SinglePostLoader />
              </div>
            ) : isError ? (
              <div className="size-full h-[calc(100vh-6rem)] flex flex-col items-center justify-center text-2xl font-semibold text-center text-red-500">
                Failed to fetch campaigns
                <span className="text-lg">Please try again later</span>
              </div>
            ) : (
              <div className="size-full flex flex-col mx-auto">
                {toggleCampaignSheet ? (
                  <WhatsappCampaign
                    creator={creatorUser}
                    action={selectedCampaign ? "Update" : "Create"}
                    setToggleCampaignSheet={setToggleCampaignSheet}
                    selectedCampaign={selectedCampaign}
                    setSelectedCampaign={setSelectedCampaign}
                    refetchCampaigns={refetch}
                  />
                ) : campaigns && campaigns.length > 0 ? (
                  <Table className="border rounded-lg mt-7">
                    <TableHeader>
                      <TableRow className="border-b bg-gray-50">
                        <TableHead className="whitespace-nowrap px-5 py-2 text-[#6B7280] font-medium text-sm">
                          Campaign Name
                        </TableHead>
                        <TableHead className="whitespace-nowrap px-5 py-2 text-[#6B7280] font-medium text-sm">
                          Type
                        </TableHead>
                        <TableHead className="whitespace-nowrap px-5 py-2 text-[#6B7280] font-medium text-sm">
                          Status
                        </TableHead>
                        <TableHead className="whitespace-nowrap px-5 py-2 text-[#6B7280] font-medium text-sm">
                          Recipients
                        </TableHead>
                        <TableHead className="whitespace-nowrap px-5 py-2 text-[#6B7280] font-medium text-sm">
                          Success Rate
                        </TableHead>
                        <TableHead className="whitespace-nowrap px-5 py-2 text-[#6B7280] font-medium text-sm">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((campaign: CreatorCampaign) => (
                        <TableRow key={campaign._id} className="border-b">
                          <TableCell className="px-5 py-2 font-semibold text-[#111827] whitespace-nowrap">
                            {campaign.name}
                          </TableCell>
                          <TableCell className="px-5 py-2 text-[#6B7280]">
                            <Badge
                              variant="secondary"
                              className="capitalize text-white"
                            >
                              {campaign.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-5 py-2 text-[#6B7280]">
                            <Badge
                              variant={"default"}
                              className={`capitalize ${
                                campaign.status === "paused"
                                  ? "bg-red-50 text-red-500"
                                  : "text-[#166534] bg-[#DCFCE7]"
                              } `}
                            >
                              {campaign.status || "Active"}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-5 py-2 text-[#6B7280]">
                            {campaign.clients?.length || 0}
                          </TableCell>
                          <TableCell className="px-5 py-2 text-[#6B7280]">
                            {campaign.successRate
                              ? `${campaign.successRate} %`
                              : "-- %"}
                          </TableCell>{" "}
                          {/* Placeholder for success rate */}
                          <TableCell className="w-full flex gap-2">
                            <button
                              className="p-2 bg-blue-50 text-blue-500 rounded-full hover:bg-blue-100 transition"
                              onClick={() => {
                                setSelectedCampaign(campaign);
                                setToggleCampaignSheet(true);
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="size-5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM16.862 4.487L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                />
                              </svg>
                            </button>
                            <button
                              className={`p-2 ${
                                campaign.status === "active"
                                  ? "bg-[#FFF4D2] text-[#B08A00] hover:bg-[#FFE8A1]"
                                  : "bg-[#E0F2F1] text-[#00796B] hover:bg-[#d3f9f1]"
                              } rounded-full  transition"`}
                              onClick={() => {
                                setToggleCampaignStatusChangeAlert(true);
                                setSelectedCampaign(campaign);
                              }}
                            >
                              {campaign.status === "active" ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="size-5"
                                >
                                  <path
                                    fill-rule="evenodd"
                                    d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z"
                                    clip-rule="evenodd"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="size-5"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                                  />
                                </svg>
                              )}
                            </button>
                            <button
                              className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition"
                              onClick={() => {
                                setSelectedCampaign(campaign);
                                setToggleCampaignDeleteAlert(true);
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                />
                              </svg>
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex size-full h-[calc(100vh-6rem)] flex-col items-center justify-start">
                    <div className="size-full flex flex-col gap-2 items-center justify-center text-center mt-14 pb-4">
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
                            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                          />
                        </svg>
                      </div>

                      <p className="mt-2.5 font-bold text-lg text-[#111827]">
                        No Campaigns Found
                      </p>
                      <span className="text-base text-[#6B7280] font-medium">
                        Added Campaigns will appear here
                      </span>

                      <Button
                        className="bg-black text-white rounded-full hoverScaleDownEffect flex items-center gap-2 mt-4"
                        onClick={() => setToggleCampaignSheet(true)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="size-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4.5v15m7.5-7.5h-15"
                          />
                        </svg>
                        Add Campaign
                      </Button>
                    </div>
                  </div>
                )}

                {hasNextPage && (
                  <div className="flex justify-center mt-4">
                    <Button
                      onClick={() => fetchNextPage()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md"
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="size-full h-[calc(100vh-6rem)] flex flex-col items-center justify-center text-2xl font-semibold text-center text-gray-400">
            <p>
              Oops! We couldn&apos;t find the campaigns you&apos;re looking for.
            </p>
            <p className="text-base text-gray-400 mt-2">
              Please check the entered campaign type and try again.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default CreatorCampaignPage;
