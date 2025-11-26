import React, { useState } from "react";
import { Button, Input } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { Auth } from "../../../utils/Controllers/Auth";
import { Alert } from "../../../utils/Alert";


const Login = () => {
  const [username, setUsername] = useState("");e
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const handleLogin = async () => {
    try {
      setLoading(true);
      const { data } = await Auth.Login({ username, password });
      const { access_token, role } = data?.data || {}
      localStorage.setItem("token", access_token);
      const roleMap = {
        SUPR_ADMIN: "SPAfefefeUID",
        ADMIN: "AutngergUID",
        SELLER: "SefwfmgrUID",
      };

      localStorage.setItem("qwer", roleMap[role] || "");

      Alert("Muvaffaqiyatli", "success");
      navigate('/')
    } catch (error) {
      Alert(error?.response?.data?.message || error.message || "Xatolik yuz berdi", "error");
    } finally {
      setLoading(false);
    }
  };


  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-neutral-900 to-gray-800 px-2">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/20">
        {/* 🔹 Заголовок сверху */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-wide">
            Login
          </h1>
          <p className="mt-2 text-sm text-gray-300">
            Kirish uchun ma'lumotlarni kiriting
          </p>
        </div>
        <div className="space-y-6">
          <div>
            <label
              htmlFor="Username"
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              Login
            </label>
            <Input
              id="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder=""
              className="bg-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-white"
              crossOrigin={undefined}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              Parol
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Parolni kiriting"
                className="bg-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-white"
                crossOrigin={undefined}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
              >
                {showPassword ? (
                  <VisibilityOffIcon className="h-5 w-5" />
                ) : (
                  <VisibilityIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <Button
            onClick={handleLogin}
            disabled={loading}
            ripple={true}
            className="w-full bg-white text-black font-bold py-3 rounded-xl shadow-lg hover:bg-gray-200 transition"
          >
            {loading ? "Yuklanmoqda..." : "Kirish"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
