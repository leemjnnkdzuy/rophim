import React from "react";
import {LucideIcon} from "lucide-react";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	icon?: LucideIcon;
	rightElement?: React.ReactNode;
	containerClassName?: string;
}

export const TextInput = ({
	label,
	icon: Icon,
	rightElement,
	containerClassName,
	className,
	...props
}: TextInputProps) => {
	return (
		<div className={`space-y-2 ${containerClassName || ""}`}>
			{label && (
				<label className='text-sm font-medium text-black/70 dark:text-white/70 ml-1'>
					{label}
				</label>
			)}
			<div className='relative group'>
				{Icon && (
					<div className='absolute left-3 top-0 bottom-0 flex items-center justify-center pointer-events-none text-black/40 dark:text-white/40 group-focus-within:text-primary transition-colors'>
						<Icon className='w-5 h-5' />
					</div>
				)}
				<input
					className={`w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-3 ${
						Icon ? "pl-10" : "pl-4"
					} ${
						rightElement ? "pr-12" : "pr-4"
					} text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all ${
						className || ""
					}`}
					{...props}
				/>
				{rightElement && (
					<div className='absolute right-3 top-0 bottom-0 flex items-center justify-center cursor-pointer text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors'>
						{rightElement}
					</div>
				)}
			</div>
		</div>
	);
};
