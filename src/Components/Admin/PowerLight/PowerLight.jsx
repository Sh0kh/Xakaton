import React, { useEffect, useState } from "react";
import { PowerOff, Battery, BatteryFull, BatteryCharging, BatteryWarning, MapPin, Clock } from "lucide-react";
import { Power } from "../../../utils/Controllers/Power";
import Cookies from "js-cookie";
import socket from "../../../services/socket";


export default function PowerAlertsPage() {
    const getBatteryIcon = (powerTime) => {
        const minutes = extractMinutes(powerTime);

        if (minutes > 150) return <BatteryFull className="text-green-600" size={22} />;
        if (minutes > 60) return <BatteryCharging className="text-yellow-500" size={22} />;
        return <BatteryWarning className="text-red-500" size={22} />;
    };

    const extractMinutes = (time) => {
        const [h, m] = time.match(/\d+/g) || [0, 0];
        return Number(h) * 60 + Number(m);
    };

    const userId = Cookies.get("user_id");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch from API; if fails, use SAMPLE
    const fetchPowers = async () => {
        try {
            setLoading(true)
            const res = await Power.GetAllPowers();
            setItems(res.data)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPowers()
        socket.emit("joinDispatcher", userId);
        // socket.onAny((ev, data) => console.log("EVENT:", ev, data));

        socket.on("newPower", (data) => {
            if (data.dispatcher_id === userId) fetchPowers();
        });

        return () => {
            socket.off("newPower");
            // socket.offAny();
        }
    }, []);


    return (
        <div className="w-full p-6">
            <h1 className="text-2xl font-semibold mb-6 text-gray-800">
                Elektr quvvati o‘chgan svetaforlar
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {(items || []).map((item) => (
                    <div
                        key={item.id}
                        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <PowerOff size={20} className="text-red-500" />
                            <h2 className="font-semibold text-gray-900 text-lg">
                                Elektr o‘chdi
                            </h2>
                        </div>

                        {/* Address */}
                        <div className="flex items-center gap-2 mb-3 text-gray-700">
                            <MapPin size={18} className="text-blue-600" />
                            <span>{item.address}</span>
                        </div>

                        {/* Battery block */}
                        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                            {getBatteryIcon(item.powerTime)}

                            <div>
                                <p className="text-gray-800 font-medium">Batareya ishlash vaqti:</p>
                                <p className="text-gray-600 text-sm">{item.powerTime}</p>
                            </div>
                        </div>

                        {/* Note */}
                        <p className="text-gray-700 mb-4">{item.note}</p>

                        {/* updatedAt */}
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <Clock size={16} />
                            <span>
                                So‘nggi o‘zgarish: {new Date(item.updatedAt).toLocaleString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
