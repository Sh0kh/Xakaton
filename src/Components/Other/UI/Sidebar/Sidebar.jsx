import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { Card, Typography } from "@material-tailwind/react";

export default function Sidebar({ open }) {
    const [role] = useState("admin");
    const location = useLocation();

    const groupedMenuItems = [
        {
            section: "Asosiy",
            items: [
                {
                    id: 1,
                    title: "Bosh sahifa",
                    path: "/",
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

            ],
        },
    ];

    return (
        <Card
            className={`h-[95%] fixed top-[15px] left-[15px] z-50 shadow-xl bg-white/30 backdrop-blur-md border border-white/20 px-4 py-6 overflow-y-auto transition-all duration-500
        ${open ? "w-[100px]" : "w-[280px]"}`}
        >
            <div className="flex items-center justify-center mb-6">
            </div>

            {/* Меню */}
            <div className="flex flex-col gap-6">
                {groupedMenuItems.map((group) => (
                    <div key={group.section}>
                        {!open && (
                            <Typography
                                variant="small"
                                color="gray"
                                className="mb-2 uppercase font-medium text-xs tracking-widest"
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
                                        `flex items-center ${open && 'justify-center'} gap-3 w-full px-4 py-3 rounded-lg transition-all duration-300
                      ${isActive
                                            ? "bg-white/80 text-[#4DA057] font-semibold shadow-md"
                                            : "text-gray-700 hover:bg-white/40 hover:text-[#0A9EB3]"
                                        }`
                                    }
                                >
                                    <span className="w-6 h-6">{item.icon}</span>
                                    {!open && <span className="text-sm">{item.title}</span>}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
