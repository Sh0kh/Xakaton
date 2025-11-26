import axios from "axios";

export const BASE_URL = "http://84.247.167.241:7171";

export const $api = axios.create({
    baseURL: `${BASE_URL}/api/v1/`,
    headers: {
        "Content-Type": "application/json",
    },
});

$api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

$api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) {
            localStorage.clear();
            window.location.replace("/login");
        }
        return Promise.reject(error);
    }
);
