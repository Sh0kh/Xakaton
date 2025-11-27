import React, { useEffect, useState } from "react";
import socket from "../../../services/socket";
import { Accidents } from "../../../utils/Controllers/Accidents";
import Cookies from "js-cookie";
import { BASE_IMG_URL } from "../../../utils/api/axios";
import { MapPin, FileText, Clock, Activity } from "lucide-react";

export default function AccidentPage() {
    const userId = Cookies.get("user_id");
    const [accidents, setAccidents] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAccidents = async () => {
        try {
            setLoading(true);
            const res = await Accidents.GetAllAccidents();
            setAccidents(res.data.accidents || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccidents();

        socket.emit("joinDispatcher", userId);

        socket.on("newAccident", (data) => {
            if (data.dispatcher_id === userId) fetchAccidents();
        });

        return () => socket.off("joinDispatcher");
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 px-8 py-10">

            {/* TITLE */}
            <h1 className="text-4xl font-extrabold mb-10 text-center 
                           bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                Accident Monitoring Dashboard
            </h1>

            {/* LOADING */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="animate-pulse bg-white/40 rounded-2xl p-6 h-72 backdrop-blur-md"></div>
                    ))}
                </div>
            )}

            {/* EMPTY */}
            {!loading && accidents.length === 0 && (
                <div className="text-center text-gray-600 text-lg">
                    🚧 No accidents found
                </div>
            )}

            {/* CARDS */}
            {!loading && accidents.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {accidents.map((item) => (
                        <div
                            key={item.id}
                            className="
                                group relative overflow-hidden rounded-2xl 
                                bg-white/70 backdrop-blur-xl 
                                border border-white/40 shadow-xl 
                                hover:shadow-2xl hover:-translate-y-1
                                transition-all duration-300
                            "
                        >
                            {/* IMAGE */}
                            {item.image ? (
                                <img
                                    src={`${BASE_IMG_URL}/${item.image}`}
                                    className="w-full h-52 object-cover rounded-t-2xl"
                                    alt="accident"
                                />
                            ) : (
                                <div className="w-full h-52 bg-gray-200 flex flex-col items-center justify-center rounded-t-2xl text-gray-500">
                                    <Activity className="w-10 h-10 mb-2" />
                                    <span>No Image</span>
                                </div>
                            )}

                            {/* CONTENT */}
                            <div className="p-5 space-y-3">

                                {/* ADDRESS */}
                                <p className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                                    <MapPin className="w-5 h-5 text-blue-500" />
                                    {item.address}
                                </p>

                                {/* NOTE */}
                                <p className="flex items-start gap-2 text-sm text-gray-700">
                                    <FileText className="w-4 h-4 mt-0.5 text-gray-500" />
                                    {item.note}
                                </p>

                                {/* STATUS BADGE */}
                                <p
                                    className={`
                                        inline-block px-3 py-1 text-xs font-bold rounded-full 
                                        ${item.status === "pending" && "bg-yellow-200 text-yellow-800"}
                                        ${item.status === "approved" && "bg-green-200 text-green-800"}
                                        ${item.status === "rejected" && "bg-red-200 text-red-800"}
                                    `}
                                >
                                    {item.status.toUpperCase()}
                                </p>

                                {/* TIME */}
                                <p className="flex items-center gap-2 text-xs text-gray-500">
                                    <Clock className="w-4 h-4" />
                                    {new Date(item.createdAt).toLocaleString()}
                                </p>

                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
