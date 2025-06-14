import React, { createContext, useContext, useState } from "react";
import { Service } from "@/types";

export type SelectedServiceType = Service | null;
export type SelectedServicesType = Service[] | null;
export type FinalServicesType = Service[] | null;

interface SelectedServiceContextType {
	selectedService: SelectedServiceType;
	setSelectedService: React.Dispatch<React.SetStateAction<SelectedServiceType>>;
	selectedServices: SelectedServicesType;
	setSelectedServices: React.Dispatch<
		React.SetStateAction<SelectedServicesType>
	>;
	newUserService: SelectedServiceType;
	setNewUserService: React.Dispatch<React.SetStateAction<SelectedServiceType>>;
	resetServices: () => void;
	getFinalServices: () => FinalServicesType;
	getSpecificServiceOffer: (
		type: string,
		creatorRate?: number
	) => SelectedServiceType;
	getSpecificServiceOfferViaServiceId: (type: string) => SelectedServiceType;
}

const SelectedServiceContext = createContext<
	SelectedServiceContextType | undefined
>(undefined);

export const SelectedServiceProvider: React.FC<{
	children: React.ReactNode;
}> = ({ children }) => {
	const [selectedService, setSelectedService] =
		useState<SelectedServiceType>(null);
	const [selectedServices, setSelectedServices] =
		useState<SelectedServicesType>(null);
	const [newUserService, setNewUserService] =
		useState<SelectedServiceType>(null);

	// Function to reset the states
	const resetServices = () => {
		setSelectedService(null);
		setNewUserService(null);
	};

	// Function to combine selected service and new user service into a single array
	const getFinalServices = (): FinalServicesType => {
		const servicesArray: Service[] = [];

		if (selectedService) {
			if (Array.isArray(selectedService)) {
				servicesArray.push(...selectedService);
			} else {
				servicesArray.push(selectedService);
			}
		}
		return servicesArray.length > 0 ? servicesArray : null;
	};

	const getSpecificServiceOffer = (
		type: string,
		creatorRate?: number
	): SelectedServiceType => {
		const services = selectedServices || [];
		const lowerType = type.toLowerCase();

		let exactMatch = services.find(
			(service) =>
				service.typeLabel?.toLowerCase() === lowerType ||
				(Array.isArray(service.type) && service.type.includes(lowerType))
		);

		if (
			exactMatch &&
			creatorRate &&
			!(
				Number(creatorRate) >
				(exactMatch.discountRules?.[0]?.discountAmount || 0)
			)
		) {
			exactMatch = undefined;
		}

		if (!exactMatch) {
			const allTypeMatch = services.find(
				(service) => Array.isArray(service.type) && service.type.includes("all")
			);

			if (
				allTypeMatch &&
				creatorRate &&
				Number(creatorRate) >
					(allTypeMatch.discountRules?.[0]?.discountAmount || 0)
			) {
				exactMatch = allTypeMatch;
			}
		}

		return exactMatch || null;
	};

	const getSpecificServiceOfferViaServiceId = (
		serviceId: string
	): SelectedServiceType => {
		const services = selectedServices || [];

		let exactMatch = services.find(
			(service) => service._id?.toLowerCase() === serviceId
		);

		return exactMatch || null;
	};

	return (
		<SelectedServiceContext.Provider
			value={{
				selectedServices,
				setSelectedServices,
				selectedService,
				setSelectedService,
				newUserService,
				setNewUserService,
				resetServices,
				getFinalServices,
				getSpecificServiceOffer,
				getSpecificServiceOfferViaServiceId,
			}}
		>
			{children}
		</SelectedServiceContext.Provider>
	);
};

export const useSelectedServiceContext = () => {
	const context = useContext(SelectedServiceContext);
	if (!context) {
		throw new Error(
			"useSelectedServiceContext must be used within a SelectedServiceProvider"
		);
	}
	return context;
};

export default SelectedServiceProvider;
