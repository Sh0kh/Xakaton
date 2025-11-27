import React from "react";
import { useAuthStore } from "../../../store/authStore";
import { User, Home, BadgeCheck, CalendarDays } from "lucide-react";

export default function ProfilePage() {
    const user = useAuthStore((state) => state.user);

    if (!user) {
        return (
            <div className="p-10 text-center text-gray-600">
                Foydalanuvchi ma’lumotlari topilmadi.
            </div>
        );
    }

    const info = [
        { icon: <User size={18} />, label: "To‘liq ism", value: user.full_name },
        { icon: <BadgeCheck size={18} />, label: "Username", value: user.username },
        { icon: <Home size={18} />, label: "Manzil", value: user.address },
        { icon: <CalendarDays size={18} />, label: "Ro‘yxatdan o‘tgan", value: new Date(user.createdAt).toLocaleString() },
        { icon: <CalendarDays size={18} />, label: "Oxirgi yangilanish", value: new Date(user.updatedAt).toLocaleString() },
        { icon: <BadgeCheck size={18} />, label: "Rol", value: user.role },
    ];

    return (
        <div className="min-h-screen bg-gray-100 p-8 text-gray-900 flex justify-center">

            <div className="w-full max-w-3xl bg-white rounded-2xl shadow p-8">

                {/* HEADER */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                        <User size={32} className="text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{user.full_name}</h1>
                        <p className="text-gray-500">{user.role.toUpperCase()}</p>
                    </div>
                </div>

                {/* DETAILS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {info.map((item, idx) => (
                        <div
                            key={idx}
                            className="p-5 bg-gray-50 border rounded-xl flex flex-col gap-1"
                        >
                            <div className="flex items-center gap-2 text-gray-500">
                                {item.icon}
                                <span className="text-sm">{item.label}</span>
                            </div>
                            <div className="text-lg font-semibold mt-1">
                                {item.value}
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
