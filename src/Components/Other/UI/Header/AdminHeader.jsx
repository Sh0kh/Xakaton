import React, { useState, useRef, useEffect } from "react";
import { LogOut, User, ChevronDown, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminHeader({ active, sidebarOpen }) {
    const navigate = useNavigate();
    const [openMenu, setOpenMenu] = useState(false);
    const menuRef = useRef(null);

    // Close dropdown outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const logout = () => {
        localStorage.clear();
        navigate("/login");
    };

    return (
        <header
            className="
                fixed top-4 z-40 flex items-center justify-between
                px-6 py-3 rounded-2xl
                bg-white/50 backdrop-blur-xl
                border border-white/30 shadow-md
                transition-all duration-500
            "
            style={{
                width: sidebarOpen ? "calc(100% - 340px)" : "calc(100% - 150px)",
                left: sidebarOpen ? "330px" : "120px",
            }}
        >
            {/* LEFT — SIDEBAR TOGGLE */}
            <button
                onClick={active}
                className="
                    w-11 h-11 flex items-center justify-center
                    rounded-xl bg-white/80 backdrop-blur-sm
                    border border-gray-200 text-gray-700
                    hover:bg-gray-100 active:scale-95
                    transition-all
                "
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* RIGHT — PROFILE */}
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setOpenMenu(!openMenu)}
                    className="
                        flex items-center gap-3 px-4 py-2
                        rounded-xl border border-gray-200
                        bg-white/80 backdrop-blur-sm shadow-sm
                        hover:bg-gray-100 active:scale-95
                        transition-all text-gray-800
                    "
                >
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-700" />
                    </div>

                    <span className="font-medium">Dispatcher</span>

                    <ChevronDown
                        className={`w-4 h-4 transition-transform ${openMenu ? "rotate-180" : ""
                            }`}
                    />
                </button>

                {/* DROPDOWN */}
                {openMenu && (
                    <div
                        className="
                            absolute right-0 mt-3 w-48 rounded-xl
                            bg-white/90 backdrop-blur-lg
                            border border-gray-200 shadow-xl
                            animate-dropdown
                        "
                    >
                        <button
                            onClick={() => navigate("/profile")}
                            className="
                                w-full px-4 py-3 flex items-center gap-2
                                text-gray-700 hover:bg-gray-100
                                transition text-sm
                            "
                        >
                            <User className="w-4 h-4" />
                            Profil
                        </button>

                        <div className="h-px bg-gray-200"></div>

                        <button
                            onClick={logout}
                            className="
                                w-full px-4 py-3 flex items-center gap-2
                                text-red-600 hover:bg-red-50
                                transition text-sm
                            "
                        >
                            <LogOut className="w-4 h-4" />
                            Chiqish
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
