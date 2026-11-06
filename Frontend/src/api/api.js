const BASE_URL = import.meta.env.VITE_API_URL;

export async function api(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
        `${BASE_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );

    if (!response.ok) {
        let message = "Something went wrong";
        let errorData = null;

        try {
            errorData = await response.json();
            message = errorData.detail || message;
        } catch {}

        if (response.status === 401) {
            localStorage.removeItem("token");
            window.dispatchEvent(new CustomEvent("session-expired"));
        }

        const err = new Error(message);
        err.statusCode = response.status;
        err.detail = message;
        err.errorData = errorData;
        throw err;
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}