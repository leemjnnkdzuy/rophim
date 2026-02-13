import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

interface SectionTitleProps {
    title: string;
    icon?: React.ReactNode;
    href?: string;
}

export function SectionTitle({
    title,
    icon,
    href,
}: SectionTitleProps) {
    const router = useRouter();
    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {icon}
                    </div>
                )}
                <h2 className="text-xl font-bold text-white">{title}</h2>
            </div>
            {href && (
                <div
                    onClick={() => router.push(href)}
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-primary transition-colors group cursor-pointer"
                >
                    Xem tất cả
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
            )}
        </div>
    );
}
