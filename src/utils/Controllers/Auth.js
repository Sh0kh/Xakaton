import axios from "axios";
import { BASE_URL } from "../api/axios";
class Auth {
    static Login = async (data) => {
        const response = await axios.post(`${BASE_URL}auth/login`, data)
        return response;
    }
}

export { Auth };