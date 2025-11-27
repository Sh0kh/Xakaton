import { Outlet } from "react-router-dom";
import AdminHeader from "../Components/Other/UI/Header/AdminHeader";
import AdminSidebar from "../Components/Other/UI/Sidebar/AdminSidebar";
import { useState } from "react";

export default function AdminLayout() {
    const [active, setActive] = useState(false); // false = keng sidebar; true = kichik sidebar

    return (
        <div className="flex w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">

            {/* Sidebar */}
            <AdminSidebar open={active} onClose={() => setActive(false)} />

            {/* MAIN CONTENT WRAPPER */}
            <div
                className={`flex flex-col transition-all duration-300 ease-in-out`}
                style={{
                    marginLeft: active ? "110px" : "320px",
                    width: active ? "calc(100% - 110px)" : "calc(100% - 320px)",
                }}
            >

                {/* HEADER */}
                <div className="fixed top-0 right-0 z-30"
                    style={{
                        width: active ? "calc(100% - 110px)" : "calc(100% - 320px)",
                        transition: "all 0.3s ease",
                    }}
                >
                    <AdminHeader 
                        active={() => setActive(!active)} 
                        sidebarOpen={!active} 
                    />
                </div>

                {/* CONTENT */}
                <main className="mt-[110px] px-6 pb-10 min-h-screen">
                    <div className="w-full mx-auto max-w-[1600px]">

                        {/* content itself */}
                        <Outlet />

                    </div>
                </main>

            </div>
        </div>
    );
}
