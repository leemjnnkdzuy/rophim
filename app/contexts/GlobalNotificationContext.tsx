"use client";

import React, {createContext, useContext, useState, useCallback} from "react";
import {AnimatePresence} from "framer-motion";
import {GlobalNotificationPopup} from "@/app/components/common/GlobalNotificationPopup";

export type NotificationType = "success" | "error" | "info" | "warning";

export interface Notification {
	id: string;
	title?: string;
	message: string;
	type: NotificationType;
	duration?: number;
}

interface GlobalNotificationContextType {
	notifications: Notification[];
	showNotification: (
		message: string,
		type: NotificationType,
		title?: string,
		duration?: number,
	) => void;
	removeNotification: (id: string) => void;
}

const GlobalNotificationContext = createContext<
	GlobalNotificationContextType | undefined
>(undefined);

export const GlobalNotificationProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const [notifications, setNotifications] = useState<Notification[]>([]);

	const showNotification = useCallback(
		(
			message: string,
			type: NotificationType,
			title?: string,
			duration = 3000,
		) => {
			const id = Math.random().toString(36).substring(2, 9);
			const newNotification: Notification = {
				id,
				message,
				type,
				title,
				duration,
			};

			setNotifications((prev) => [...prev, newNotification]);

			if (duration > 0) {
				setTimeout(() => {
					setNotifications((prev) => prev.filter((n) => n.id !== id));
				}, duration);
			}
		},
		[],
	);

	const removeNotification = useCallback((id: string) => {
		setNotifications((prev) => prev.filter((n) => n.id !== id));
	}, []);

	return (
		<GlobalNotificationContext.Provider
			value={{notifications, showNotification, removeNotification}}
		>
			{children}
			<GlobalNotificationPopup />
		</GlobalNotificationContext.Provider>
	);
};

export const useGlobalNotification = () => {
	const context = useContext(GlobalNotificationContext);
	if (!context) {
		throw new Error(
			"useGlobalNotification must be used within a GlobalNotificationProvider",
		);
	}
	return context;
};
