// src/components/ViolationsGrid.jsx
import React, { useEffect, useState } from "react";
import { Fines } from "../../../utils/Controllers/fines";
import socket from "../../../services/socket";
import Cookies from "js-cookie";

/*
  Qoidabuzarlik nomlari listi:
  const names = [
    'Qizilda o‘tdi',
    'Tezlikni oshirdi',
    'Notog‘ri parkovka',
    'Yuk cheklovini buzdi',
    'Tosh yo‘lda xavfli manevr',
  ];
*/

// SAMPLE fallback data (sen bergan response)
// const SAMPLE = [
//     {
//         id: "2a5c6bef-0e65-436a-956d-bbe1080e09ff",
//         address: "Yangiyer shahar",
//         name: "Yuk cheklovini buzdi",
//         carNumber: "20A4157AA",
//         note: "Tartibga rioya qilmagan",
//         createdAt: "2025-11-27T06:20:50.107Z",
//     },
//     {
//         id: "822a4665-4ca5-4891-beb3-24a29e20f575",
//         address: "Yangiyer shahar",
//         name: "Tezlikni oshirdi",
//         carNumber: "20A3372AA",
//         note: "Ruxsat etilgan tezlikni oshirgan",
//         createdAt: "2025-11-27T06:21:23.683Z",
//     },
//     {
//         id: "d0596a92-da4a-4586-8d8c-eea67b0f9bb7",
//         address: "Guliston tuman",
//         name: "Tosh yo‘lda xavfli manevr",
//         carNumber: "20A8172AA",
//         note: "Tartibga rioya qilmagan",
//         createdAt: "2025-11-27T06:21:35.965Z",
//     },
//     {
//         id: "fe18536b-dde9-46d3-a50f-c2119c0b2918",
//         address: "Guliston shahar",
//         name: "Tezlikni oshirdi",
//         carNumber: "20A8313AA",
//         note: "Notog‘ri joyda to‘xtagan",
//         createdAt: "2025-11-27T06:21:38.643Z",
//     },
// ];

// Mapping: nomga mos rang va SVG icon (inline, vector)
const RULE_META = {
    "qizilda o‘tib ketish": {
        title: "Qizilda o‘tib ketish",
        color: "bg-red-100",
        badge: "bg-red-600",
        icon: (props) => (
            <svg viewBox="0 0 24 24" {...props} aria-hidden>
                <rect x="8.2" y="3.5" width="7.6" height="17" rx="2" fill="#374151" />
                <circle cx="12" cy="7.5" r="2.3" fill="#ef4444" />
            </svg>
        ),
    },
    "tezlikni oshirdi": {
        title: "Tezlikni oshirdi",
        color: "bg-yellow-100",
        badge: "bg-yellow-600",
        icon: (props) => (
            <svg viewBox="0 0 24 24" {...props} aria-hidden>
                <path d="M3 12c0 5 4 9 9 9s9-4 9-9" fill="#f59e0b" />
                <path d="M12 7v6l4 2" fill="#fff" opacity="0.9" />
            </svg>
        ),
    },
    "notog‘ri parkovka": {
        title: "Notog‘ri parkovka",
        color: "bg-indigo-100",
        badge: "bg-indigo-600",
        icon: (props) => (
            <svg viewBox="0 0 24 24" {...props} aria-hidden>
                <rect x="4" y="6" width="14" height="10" rx="1.5" fill="#4f46e5" />
                <circle cx="7.5" cy="16.5" r="1.2" fill="#111827" />
            </svg>
        ),
    },
    "yuk cheklovini buzdi": {
        title: "Yuk cheklovini buzdi",
        color: "bg-green-100",
        badge: "bg-emerald-600",
        icon: (props) => (
            <svg viewBox="0 0 24 24" {...props} aria-hidden>
                <rect x="3.6" y="7" width="12" height="7" rx="1.2" fill="#10b981" />
                <path d="M17 13h3v2h-3z" fill="#111827" />
            </svg>
        ),
    },
    "tosh yo‘lda xavfli manevr": {
        title: "Tosh yo‘lda xavfli manevr",
        color: "bg-pink-100",
        badge: "bg-pink-600",
        icon: (props) => (
            <svg viewBox="0 0 24 24" {...props} aria-hidden>
                <polygon points="12,3 2,21 22,21" fill="#ec4899" />
                <text x="12" y="17" fontSize="10" textAnchor="middle" fill="#fff">!</text>
            </svg>
        ),
    },
    // default
    default: {
        title: "Boshqa",
        color: "bg-gray-100",
        badge: "bg-gray-600",
        icon: (props) => (
            <svg viewBox="0 0 24 24" {...props} aria-hidden>
                <circle cx="12" cy="12" r="8" fill="#9ca3af" />
            </svg>
        ),
    },
};

// helper: normalize incoming name to key
function normalizeName(name = "") {
    if (!name) return "default";
    const s = name.toLowerCase().replace(/’|'/g, "‘").replace(/\s+/g, " ").trim();

    // direct matches or contains
    if (s.includes("qizil")) return "qizilda o‘tib ketish";
    if (s.includes("tezlik")) return "tezlikni oshirdi";
    if (s.includes("park")) return "notog‘ri parkovka";
    if (s.includes("yuk")) return "yuk cheklovini buzdi";
    if (s.includes("tosh") || s.includes("manevr")) return "tosh yo‘lda xavfli manevr";
    return "default";
}

export default function ViolationsGrid() {
    const userId = Cookies.get("user_id");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch from API; if fails, use SAMPLE
    const fetchItems = async () => {
        try {
            setLoading(true)
            const res = await Fines.GetAllFines();
            setItems(res.data)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchItems()
        socket.emit("joinDispatcher", userId);
        // socket.onAny((ev, data) => console.log("EVENT:", ev, data));

        socket.on("newFine", (data) => {
            if (data.dispatcher_id === userId) fetchItems();
        });

        return () => {
            socket.off("newFine");
            // socket.offAny();
        }
    }, []);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto">

                <header className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900">Qoidabuzarliklar</h2>
                        <p className="text-sm text-gray-500">Oxirgi qayd etilgan hodisalar — tasniflangan va rasm bilan.</p>
                    </div>
                    <div className="text-sm text-gray-600">
                        {loading ? "Yuklanmoqda..." : `${items.length} ta topildi`}
                    </div>
                </header>

                {/* GRID */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((it) => {
                        const key = normalizeName(it.name);
                        const meta = RULE_META[key] || RULE_META.default;
                        const Icon = meta.icon;

                        // consider "yangi" label: created within last 2 minutes
                        const created = new Date(it.createdAt);
                        const isNew = (Date.now() - created.getTime()) < 1000 * 60 * 2;

                        return (
                            <article
                                key={it.id}
                                className={`group relative overflow-hidden rounded-xl border bg-white p-4 flex gap-4 shadow-sm transform transition hover:-translate-y-1 hover:shadow-md`}
                                aria-labelledby={`title-${it.id}`}
                            >
                                <div className={`flex-none w-16 h-16 rounded-lg flex items-center justify-center ${meta.color}`}>
                                    <Icon width="48" height="48" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 id={`title-${it.id}`} className="text-md font-semibold text-gray-900 truncate">
                                                {it.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-0.5 truncate">{it.address}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-gray-700">{it.carNumber}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">{new Date(it.createdAt).toLocaleTimeString()}</div>
                                        </div>
                                    </div>

                                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">{it.note}</p>

                                    <div className="mt-3 flex items-center gap-2">
                                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium text-white rounded ${meta.badge}`}>
                                            {meta.title}
                                        </span>

                                        {isNew && (
                                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                                                Yangi
                                            </span>
                                        )}

                                        <button
                                            onClick={() => navigator.clipboard?.writeText(JSON.stringify(it))}
                                            className="ml-auto text-xs text-indigo-600 hover:underline"
                                            title="Copy raw"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>

                {/* empty state */}
                {!loading && items.length === 0 && (
                    <div className="mt-12 text-center text-gray-500">
                        Hech qanday qoidabuzarlik qo‘shilmagan.
                    </div>
                )}
            </div>
        </div>
    );
}
