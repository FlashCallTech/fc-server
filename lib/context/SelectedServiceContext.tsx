import React, { createContext, useContext, useState } from "react";
import { Service } from "@/types";

type SelectedServiceType = Service | null;
type FinalServicesType = Service[] | null;

interface SelectedServiceContextType {
	selectedService: SelectedServiceType;
	setSelectedService: React.Dispatch<React.SetStateAction<SelectedServiceType>>;
	newUserService: SelectedServiceType;
	setNewUserService: React.Dispatch<React.SetStateAction<SelectedServiceType>>;
	resetServices: () => void;
	getFinalServices: () => FinalServicesType;
}

const SelectedServiceContext = createContext<
	SelectedServiceContextType | undefined
>(undefined);

export const SelectedServiceProvider: React.FC<{
	children: React.ReactNode;
}> = ({ children }) => {
	const [selectedService, setSelectedService] =
		useState<SelectedServiceType>(null);
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
		if (newUserService) servicesArray.push(newUserService);
		if (selectedService) {
			if (Array.isArray(selectedService)) {
				servicesArray.push(...selectedService);
			} else {
				servicesArray.push(selectedService);
			}
		}
		return servicesArray.length > 0 ? servicesArray : null;
	};

	return (
		<SelectedServiceContext.Provider
			value={{
				selectedService,
				setSelectedService,
				newUserService,
				setNewUserService,
				resetServices,
				getFinalServices,
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
