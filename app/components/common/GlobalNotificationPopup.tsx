"use client";

import {useGlobalNotification} from "@/app/contexts/GlobalNotificationContext";
import {motion, AnimatePresence} from "framer-motion";
import {CheckCircle2, XCircle, AlertCircle, Info, X} from "lucide-react";

const notificationVariants = {
	initial: {opacity: 0, y: -20, scale: 0.95},
	animate: {opacity: 1, y: 0, scale: 1},
	exit: {opacity: 0, scale: 0.95, transition: {duration: 0.2}},
};

const icons = {
	success: CheckCircle2,
	error: XCircle,
	warning: AlertCircle,
	info: Info,
};

const colors = {
	success: "border-green-500/50 bg-green-500/10 text-green-500",
	error: "border-red-500/50 bg-red-500/10 text-red-500",
	warning: "border-yellow-500/50 bg-yellow-500/10 text-yellow-500",
	info: "border-blue-500/50 bg-blue-500/10 text-blue-500",
};

export const GlobalNotificationPopup = () => {
	const {notifications, removeNotification} = useGlobalNotification();

	return (
		<div className='fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none'>
			<AnimatePresence mode='popLayout'>
				{notifications.map((notification) => {
					const Icon = icons[notification.type];
					const colorClass = colors[notification.type];

					return (
						<motion.div
							key={notification.id}
							layout
							variants={notificationVariants}
							initial='initial'
							animate='animate'
							exit='exit'
							className={`pointer-events-auto relative overflow-hidden rounded-xl border p-4 shadow-lg backdrop-blur-md ${colorClass}`}
						>
							<div className='flex items-start gap-3'>
								<Icon className='h-5 w-5 mt-0.5 shrink-0' />
								<div className='flex-1'>
									{notification.title && (
										<h3 className='font-semibold text-sm mb-1'>
											{notification.title}
										</h3>
									)}
									<p className='text-sm opacity-90'>
										{notification.message}
									</p>
								</div>
								<button
									onClick={() =>
										removeNotification(notification.id)
									}
									className='shrink-0 rounded-full p-1 hover:bg-white/10 transition-colors'
								>
									<X className='h-4 w-4' />
								</button>
							</div>
						</motion.div>
					);
				})}
			</AnimatePresence>
		</div>
	);
};
