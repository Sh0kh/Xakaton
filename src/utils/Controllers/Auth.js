import axios from "axios";

class Auth {
    static Login = async (data) => {
        const response = await axios.post(`/auth/login`, data)
        return response;
    }
}

export { Auth };