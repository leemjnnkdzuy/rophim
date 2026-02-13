import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import {ClientProviders} from "@/app/components/providers/ClientProviders";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "RoPhim - Xem Phim Online Miễn Phí",
	description:
		"Xem phim online chất lượng cao, phim lẻ, phim bộ, phim chiếu rạp mới nhất hoàn toàn miễn phí.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='vi' className='dark'>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<ClientProviders>{children}</ClientProviders>
			</body>
		</html>
	);
}
