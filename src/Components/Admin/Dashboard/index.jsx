import React, { useEffect, useState } from "react";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";

// Realistic rule & intersection list
const rules = [
  "Qizilda o'tib ketish",
  "STOP chizig'ini bosish",
  "Piyodalar yo'lagini bosish",
  "Noto'g'ri burilish",
  "Sariqda to'xtamaslik",
  "Ajratuvchi chiziqni kesib o'tish",
];

const intersections = [
  "Registon Cross",
  "Universitet chorrahasi",
  "Afrosiyob yo'li",
  "M37 chorrahasi",
  "Siyob bozori chorrahasi",
];

const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export default function Dashboard() {
  const [stats, setStats] = useState({
    yth: 0,
    qoidabuzarlik: 0,
    engKop: "",
    topCross: "",
  });

  const [history, setHistory] = useState([]);
  const [chartData, setChartData] = useState([]);

  // Cycle: full sync update every 1s
  useEffect(() => {
    const interval = setInterval(() => {
      const isAccident = Math.random() > 0.85; // 15% YTH
      const rule = rules[random(0, rules.length - 1)];
      const cross = intersections[random(0, intersections.length - 1)];

      const newIncident = {
        id: Date.now(),
        type: isAccident ? "YTH" : "Qoidabuzarlik",
        rule,
        cross,
        time: new Date().toLocaleTimeString(),
      };

      // Update history (max 10 items)
      setHistory((prev) => [newIncident, ...prev.slice(0, 9)]);

      // Update stats in sync
      setStats((prev) => ({
        yth: prev.yth + (isAccident ? 1 : 0),
        qoidabuzarlik: prev.qoidabuzarlik + (!isAccident ? 1 : 0),
        engKop: rule,
        topCross: cross,
      }));

      // Update chart
      setChartData((prev) =>
        [...prev, { name: newIncident.time, value: random(1, 8) }].slice(-10)
      );
    }, 3000); // 1 SEC

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen text-gray-900 space-y-6">

      {/* TOP STATS */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Bugungi YTHlar" value={stats.yth} />
        <StatCard title="Qoidabuzarliklar" value={stats.qoidabuzarlik} />
        <StatCard title="Eng ko‘p buzilgan qoida" value={stats.engKop} small />
        <StatCard title="Eng ko‘p yuklama tushgan chorraha" value={stats.topCross} small />
      </div>

      {/* LIVE CHART */}
      <div className="bg-white p-5 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-3">So‘nggi 10 hodisa trendi</h2>
        <LineChart width={900} height={260} data={chartData}>
          <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
          <CartesianGrid stroke="#e5e7eb" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
        </LineChart>
      </div>

      {/* LIVE INCIDENT LIST */}
      <div className="bg-white p-5 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-3">Live hodisalar</h2>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {history.map((item) => (
            <div key={item.id} className="flex justify-between p-3 border rounded-lg bg-gray-50">
              <div>
                <div className="font-bold">{item.type}</div>
                <div className="text-sm text-gray-600">{item.rule}</div>
              </div>
              <div className="text-right">
                <div className="text-sm">{item.cross}</div>
                <div className="text-xs text-gray-500">{item.time}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, small }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow text-center">
      <div className="text-gray-600 text-sm">{title}</div>
      <div className={`font-bold mt-2 ${small ? "text-lg" : "text-3xl"}`}>
        {value || "-"}
      </div>
    </div>
  );
}
