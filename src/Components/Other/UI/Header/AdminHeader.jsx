import React, { useState, useRef, useEffect } from "react";
import { LogOut, User, ChevronDown, Moon, Sun, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@material-tailwind/react";

export default function AdminHeader({ active, sidebarOpen, ...props }) {
    const navigate = useNavigate();
    const [openMenu, setOpenMenu] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const menuRef = useRef(null);

    // Инициализация темы
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

        if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
            setIsDarkMode(true);
            document.documentElement.classList.add("dark");
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove("dark");
        }
    }, []);

    // Переключение тёмной темы
    const toggleDarkMode = () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);

        if (newDarkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    // Закрытие меню при клике вне
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div
            className={`fixed top-[10px] z-30 flex justify-between items-center 
                       mb-6 px-6 py-4 rounded-2xl border shadow-lg 
                       transition-all duration-500 ${isDarkMode
                    ? "bg-gray-900 backdrop-blur-md border-gray-700 shadow-gray-900/20"
                    : "bg-white backdrop-blur-md border-gray-200"
                }`}
            style={{
                width: sidebarOpen ? "calc(99% - 320px)" : "91%",
                left: sidebarOpen ? "320px" : "120px",
            }}
        >
            {/* Левая часть - кнопка меню */}
            <div className="flex items-center gap-[20px]">
                <Button
                    onClick={active}
                    className={`px-4 py-3 rounded-xl transition-all duration-300 ${isDarkMode
                        ? "bg-gray-800 hover:bg-gray-700 text-white"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                        }`}
                >
                    <Menu className="w-5 h-5" />
                </Button>
            </div>

            {/* Правая часть - переключатель темы + профиль */}
            <div className="flex items-center gap-4">
                {/* Переключатель темы с улучшенной анимацией */}
                <button
                    onClick={toggleDarkMode}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className={`relative flex items-center justify-center w-10 h-10 rounded-xl 
                               border shadow transition-all duration-500 ${isDarkMode
                            ? "bg-gray-800 hover:bg-gray-700 border-gray-600 text-yellow-300"
                            : "bg-white hover:bg-gray-100 border-gray-300 text-gray-700"
                        } ${isHovered ? "scale-110 rotate-12" : "scale-100 rotate-0"}`}
                    title={isDarkMode ? "Светлый режим" : "Тёмный режим"}
                >
                    {isDarkMode ? (
                        <Sun className="w-5 h-5 transition-transform duration-300" />
                    ) : (
                        <Moon className="w-5 h-5 transition-transform duration-300" />
                    )}
                </button>

                {/* Профиль с улучшенным дизайном */}
                <div className="relative flex items-center gap-4" ref={menuRef}>
                    <button
                        onClick={() => setOpenMenu(!openMenu)}
                        className={`flex items-center gap-3 px-4 py-1 rounded-xl border 
                                   shadow transition-all duration-300 text-sm font-medium ${isDarkMode
                                ? "bg-gray-800 hover:bg-gray-700 border-gray-600 text-white"
                                : "bg-white hover:bg-gray-100 border-gray-300 text-gray-800"
                            }`}
                    >
                        <div className={`p-2 rounded-full ${isDarkMode
                            ? "bg-gray-700"
                            : "bg-gray-200"
                            }`}>
                            <User className="w-4 h-4" />
                        </div>
                        <span>Admin</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openMenu ? "rotate-180" : ""}`} />
                    </button>

                    {/* Выпадающее меню с glassmorphism эффектом */}
                    {openMenu && (
                        <div className={`absolute right-0 top-16 w-48 backdrop-blur-xl 
                                        border shadow-xl rounded-xl py-2 z-50 overflow-hidden 
                                        transition-all duration-300 ${isDarkMode
                                ? "bg-gray-800 border-gray-600"
                                : "bg-white border-gray-200"
                            }`}>
                            {/* Декоративная полоска */}
                            <div className={`absolute top-0 left-0 w-full h-1 ${isDarkMode
                                ? "bg-gray-700"
                                : "bg-gray-300"
                                }`}></div>

                            <button
                                onClick={() => navigate("/profile")}
                                className={`w-full px-4 py-3 text-left text-sm transition-all duration-200 flex items-center gap-2 ${isDarkMode
                                    ? "text-white hover:bg-gray-700"
                                    : "text-gray-700 hover:bg-gray-100"
                                    }`}
                            >
                                <User className="w-4 h-4" />
                                <span>Profil</span>
                            </button>
                            <div className={`h-px my-1 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
                            <button
                                onClick={handleLogout}
                                className={`w-full px-4 py-3 text-left text-sm transition-all duration-200 flex items-center gap-2 ${isDarkMode
                                    ? "text-red-400 hover:bg-red-900/20"
                                    : "text-red-600 hover:bg-red-50"
                                    }`}
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Chiqish</span>
                            </button>
                        </div>
                    )}
                    {props.children}
                </div>
            </div>
        </div>
    );
}