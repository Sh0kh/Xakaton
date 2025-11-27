import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { Card, Typography } from "@material-tailwind/react";
import { AlertTriangle } from "lucide-react";

export default function AdminSidebar({ open }) {
    const [role] = useState("admin");
    const location = useLocation();

    const groupedMenuItems = [
        {
            section: "Asosiy",
            items: [
                {
                    id: 1,
                    title: "Bosh sahifa",
                    path: "/admin/dashboard",
                    icon: (
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 9.75L12 3l9 6.75M4.5 10.5v9.75h5.25V15h4.5v5.25H19.5V10.5"
                            />
                        </svg>
                    ),
                },
                {
                    id: 2,
                    title: "Ogohlantirishlar",
                    path: "/admin/redevents",
                    icon: <AlertTriangle />,
                },
            ],
        },
    ];

    return (
        <Card
            className={`
                fixed top-4 left-4 z-50 h-[95%]
                shadow-2xl border border-white/20
                bg-white/20 backdrop-blur-xl
                transition-all duration-500 ease-in-out
                rounded-3xl overflow-hidden
                
                ${open ? "w-[95px]" : "w-[290px]"}
            `}
        >

            {/* LOGO ZONA */}
            <div className="flex items-center justify-center mb-6 mt-2">
                <div
                    className={`
                        flex items-center justify-center font-bold text-white
                        bg-gradient-to-br from-[#4DA057] to-[#0A9EB3]
                        rounded-2xl shadow-lg shadow-black/20
                        transition-all duration-500
                        ${open ? "w-12 h-12 text-sm" : "w-14 h-14 text-lg"}
                    `}
                >
                    YPX
                </div>
            </div>

            {/* MENU */}
            <div className="flex flex-col gap-7 px-2">
                {groupedMenuItems.map((group) => (
                    <div key={group.section}>

                        {/* SECTION TITLE */}
                        {!open && (
                            <Typography
                                variant="small"
                                className="mb-2 text-gray-700/70 uppercase font-semibold text-[11px] tracking-widest pl-2"
                            >
                                {group.section}
                            </Typography>
                        )}

                        <div className="flex flex-col gap-2">
                            {group.items.map((item) => (
                                <NavLink
                                    key={item.id}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `
                                        group relative flex items-center
                                        ${open ? "justify-center" : "justify-start"} 
                                        gap-3 px-4 py-3 rounded-xl w-full
                                        transition-all duration-300

                                        ${isActive
                                            ? "bg-white/80 text-[#4DA057] font-semibold shadow-lg shadow-black/10"
                                            : "text-gray-800 hover:bg-white/40 hover:text-[#0A9EB3]"
                                        }
                                        `
                                    }
                                >

                                    {/* ICON */}
                                    <span
                                        className={`
                                            w-6 h-6 transition-all duration-300
                                            group-hover:scale-110 
                                            group-hover:text-[#0A9EB3]
                                        `}
                                    >
                                        {item.icon}
                                    </span>

                                    {/* TEXT */}
                                    {!open && (
                                        <span className="text-[15px] tracking-wide">
                                            {item.title}
                                        </span>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
