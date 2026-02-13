import axios, {AxiosError, AxiosResponse, InternalAxiosRequestConfig} from "axios";

interface FailedRequest {
	resolve: (token: string | null) => void;
	reject: (error: Error) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: Error | null) => {
	failedQueue.forEach((prom) => {
		if (error) {
			prom.reject(error);
		} else {
			prom.resolve(null);
		}
	});
	failedQueue = [];
};

const api = axios.create({
	baseURL: "/api",
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true,
});

api.interceptors.response.use(
	(response: AxiosResponse) => response,
	async (error: AxiosError) => {
		const originalRequest = error.config as InternalAxiosRequestConfig & {
			_retry?: boolean;
		};

		if (
			error.response?.status === 401 &&
			!originalRequest._retry &&
			!originalRequest.url?.includes("/auth/refresh") &&
			!originalRequest.url?.includes("/auth/login")
		) {
			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					failedQueue.push({resolve, reject});
				})
					.then(() => {
						return api(originalRequest);
					})
					.catch((err) => {
						return Promise.reject(err);
					});
			}

			originalRequest._retry = true;
			isRefreshing = true;

			try {
				await api.post("/auth/refresh");
				processQueue(null);
				return api(originalRequest);
			} catch (refreshError) {
				processQueue(refreshError as Error);
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		return Promise.reject(error);
	}
);

export default api;