import type {NextConfig} from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "phim.nguonc.com",
			},
			{
				protocol: "https",
				hostname: "**",
			},
		],
	},
};

export default nextConfig;
