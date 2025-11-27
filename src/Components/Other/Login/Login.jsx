import { useRef, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { Auth } from "../../../utils/Controllers/Auth";
import { toastService } from "../../../utils/toast";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const logInput = useRef("");
  const passInput = useRef("");

  const [errors, setErrors] = useState({ login: "", password: "" });
  const [loading, setLoading] = useState(false);

  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async () => {
    const loginText = logInput.current.value.trim();
    const password = passInput.current.value.trim();

    const newErrors = {};

    if (!loginText) newErrors.login = "Login kiritilmadi";
    if (!password) newErrors.password = "Parol kiritilmadi";
    else if (password.length < 6)
      newErrors.password = "Parol kamida 6 belgi bo‘lishi kerak";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      setLoading(true);

      const payload = {
        username: loginText,
        password: password,
      };

      const res = await Auth.Login(payload);

      if (res.status === 200 || res.status === 201) {
        const data = res.data;

        login({
          token: data.tokens.access_token,
          refreshToken: data.tokens.refresh_token,
          user: data.newUser
        });

        if (data.newUser.role === "dispatcher") {
          toastService.success("Successfully");
          navigate("/admin/dashboard");
        } else {
          toastService.error("Role mos kelmadi");
        }
      } else {
        toastService.error(res?.data?.message || "Xatolik!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 px-4">

      {/* Main Card */}
      <div className="w-full max-w-md bg-white backdrop-blur-xl border border-gray-200/60 shadow-xl shadow-gray-300/30 rounded-2xl px-8 py-10">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-full bg-white border border-gray-200 shadow-lg shadow-blue-200 flex items-center justify-center text-xl font-bold text-blue-700 tracking-wide relative">
            <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl"></div>
            YPX
          </div>
        </div>

        {/* Title */}
        <h1 className="text-center text-3xl font-semibold text-gray-800 mb-2">
          Kirish
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Tizimga kirish uchun ma’lumotlarni kiriting
        </p>

        {/* Login Input */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-1.5">
            Login
          </label>
          <input
            ref={logInput}
            onChange={() => clearError("login")}
            type="text"
            placeholder="Loginni kiriting"
            className={`w-full border ${errors.login ? "border-red-500" : "border-gray-300"
              } rounded-xl px-4 py-3 text-gray-900 bg-white focus:border-blue-600 outline-none transition`}
          />
          {errors.login && (
            <p className="text-red-500 text-xs mt-1">{errors.login}</p>
          )}
        </div>

        {/* Password Input */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1.5">
            Parol
          </label>
          <input
            ref={passInput}
            onChange={() => clearError("password")}
            type="password"
            placeholder="Parolni kiriting"
            className={`w-full border ${errors.password ? "border-red-500" : "border-gray-300"
              } rounded-xl px-4 py-3 text-gray-900 bg-white focus:border-blue-600 outline-none transition`}
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
        </div>


        {/* Forgot */}
        <div className="flex justify-end mb-6">
          <button className="text-sm text-blue-600 hover:underline">
            Parolni unutdingizmi?
          </button>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-3 rounded-xl text-white font-semibold transition transform ${loading
            ? "bg-blue-400 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-600 to-blue-500 hover:scale-[1.02] hover:shadow-lg"
            }`}
        >
          {loading ? "Yuklanmoqda..." : "Kirish"}
        </button>
      </div>
    </div>
  );
}
