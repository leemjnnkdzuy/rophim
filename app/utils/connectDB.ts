import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let cachedConnection: typeof mongoose | null = null;

const connectDatabase = async (): Promise<void> => {
	if (cachedConnection && mongoose.connection.readyState === 1) {
		return;
	}

	try {
		let uri = process.env.MONGODB_URI;

		if (!uri) {
			const username = process.env.MONGODB_USER;
			const password = process.env.MONGODB_PASSWORD;
			const cluster = process.env.MONGODB_CLUSTER;
			const database =
				process.env.MONGODB_DATABASE_DEVELOPMENT ||
				process.env.MONGODB_DATABASE_PROD;

			if (!username || !password || !cluster || !database) {
				throw new Error(
					"❌ Thiếu biến môi trường MongoDB. Cần có MONGODB_URI hoặc MONGODB_USER, MONGODB_PASSWORD, MONGODB_CLUSTER, MONGODB_DATABASE_DEVELOPMENT",
				);
			}

			uri = `mongodb+srv://${username}:${password}@${cluster}/${database}?retryWrites=true&w=majority`;
		}

		if (!cachedConnection || mongoose.connection.readyState === 0) {
			cachedConnection = await mongoose.connect(uri, {
				serverSelectionTimeoutMS: 10000,
				socketTimeoutMS: 45000,
			});
		}
	} catch (error) {
		console.error("❌ Lỗi kết nối MongoDB:", error);
		throw error;
	}
};

export default connectDatabase;
