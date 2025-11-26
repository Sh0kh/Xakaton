import { Outlet } from "react-router-dom";
import Sidebar from "../Components/Other/UI/Sidebar/Sidebar";
import AdminHeader from "../Components/Other/UI/Header/AdminHeader";
import { useState } from "react";

export default function AdminLayout() {
    const [active, setActive] = useState(false); // true = открыт сайдбар

    return (
        <div className="flex w-full overflow-hidden bg-[#FAFAFA] relative">
            <Sidebar open={active} onClose={() => setActive(false)} />
            <div
                className={`mt-[110px] pb-[30px] px-[15px] min-h-screen transition-all duration-300`}
                style={{
                    marginLeft: !active ? "320px" : "110px",
                    width: !active ? "calc(100% - 320px)" : "100%",
                }}
            >
                <AdminHeader active={() => setActive(!active)} sidebarOpen={!active} />
                <Outlet />
            </div>
        </div>
    );
}
