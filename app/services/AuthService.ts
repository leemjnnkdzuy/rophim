export const authService = {
	async registerSendPin(data: {
		username?: string;
		email: string;
		password?: string;
	}) {
		const response = await fetch("/api/auth/register", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({
				action: "send-pin",
				...data,
			}),
		});
		return response.json();
	},

	async registerVerifyPin(data: {email: string; pin: string}) {
		const response = await fetch("/api/auth/register", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({
				action: "verify-pin",
				...data,
			}),
		});
		return response.json();
	},

	async resetPasswordSendPin(email: string) {
		const response = await fetch("/api/auth/reset-password", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({
				action: "send-pin",
				email,
			}),
		});
		return response.json();
	},

	async resetPasswordVerifyPin(data: {email: string; pin: string}) {
		const response = await fetch("/api/auth/reset-password", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({
				action: "verify-pin",
				...data,
			}),
		});
		return response.json();
	},

	async resetPasswordConfirm(data: {email: string; newPassword: string}) {
		const response = await fetch("/api/auth/reset-password", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({
				action: "reset-password",
				...data,
			}),
		});
		return response.json();
	},
};
