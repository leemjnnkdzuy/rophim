import React from "react";

export default function FooterLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1">{children}</main>
            <footer className="border-t border-white/5 bg-[#0a0a15] py-6">
                <div className="max-w-[1440px] mx-auto px-4 text-center text-xs text-gray-600">
                    © 2025 RoPhim. Tất cả quyền được bảo lưu.
                </div>
            </footer>
        </div>
    );
}
