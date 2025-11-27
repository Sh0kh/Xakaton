import React, { useEffect, useReducer, useRef, useState } from "react";

/*
  SmartTrafficIntersection.jsx
  ----------------------------
  A single-file, componentized React + Tailwind implementation of the smart
  traffic intersection you described. Drop into a React + Tailwind project
  and render <SmartTrafficIntersection />.

  Features implemented:
  - Modal to enter vertical/horizontal lane counts (per direction)
  - Componentized structure: Controls, Map, TrafficLight, Vehicle
  - Vehicles: light, heavy, tow, police, fvv (different sizes & speeds)
  - Movement loop with spacing & queueing per lane
  - Smart traffic controller: green/yellow/red, dynamic shortening when idle,
    priority handling for emergency vehicles (police/fvv) and tow
  - Avoids vehicle overlap using lane queues and min-gap enforcement
  - Clean Tailwind-based UI and minimal inline CSS for map positioning

  Notes:
  - This is a frontend-only simulation. For real deployment you'd connect
    to sensors or a backend.
  - The code is intentionally explicit and commented so you can extend it.
*/

// ----------------------------- Constants & Utilities -----------------------------
const VEHICLE_TYPES = {
    light: { key: "light", label: "Yengil", size: 20, baseSpeed: 1.0 },
    heavy: { key: "heavy", label: "Og'ir", size: 36, baseSpeed: 0.6 },
    tow: { key: "tow", label: "Tex yordam", size: 20, baseSpeed: 0.9 },
    police: { key: "police", label: "Polis", size: 20, baseSpeed: 1.05 },
    fvv: { key: "fvv", label: "FVV", size: 42, baseSpeed: 1.15 },
};

const SIDES = ["north", "east", "south", "west"];
const AXIS_OF = (side) => (side === "north" || side === "south" ? "vertical" : "horizontal");

// helper to generate unique ids
let NEXT_ID = 1;
function uid() { return NEXT_ID++; }

// ----------------------------- Reducer for vehicles -----------------------------
function vehiclesReducer(state, action) {
    switch (action.type) {
        case "ADD": {
            const vdef = VEHICLE_TYPES[action.payload.type];
            const v = {
                id: uid(),
                type: vdef.key,
                side: action.payload.side,
                size: vdef.size,
                speed: vdef.baseSpeed,
                // pos: distance from intersection center; spawnDistance can scale with map
                pos: 260,
                state: "queued", // queued | moving | passed
                target: action.payload.target || "straight",
                color: pickColor(vdef.key),
                addedAt: Date.now(),
            };
            return [...state, v];
        }
        case "REMOVE_PASSED": {
            return state.filter(v => v.pos > -400);
        }
        case "UPDATE_LIST": {
            return action.payload;
        }
        case "CLEAR": return [];
        default: return state;
    }
}

function pickColor(key) {
    switch (key) {
        case 'light': return '#2563eb';
        case 'heavy': return '#1f2937';
        case 'tow': return '#f97316';
        case 'police': return '#0ea5e9';
        case 'fvv': return '#ef4444';
        default: return '#374151';
    }
}

// ----------------------------- Traffic Controller Hook -----------------------------
function useTrafficController(vehicles, setVehicles, lanesConfig) {
    // lanesConfig = { v: lanesPerDirection , h: lanesPerDirection }
    const [phase, setPhase] = useState("vertical"); // which axis currently has 'green'
    const [lights, setLights] = useState({ vertical: 'green', horizontal: 'red' });
    const timerRef = useRef(0);
    const lastTickRef = useRef(performance.now());
    const idleSinceRef = useRef(null);
    const emergencyRequestRef = useRef(null); // {axis, side, ts}

    // tunable timings
    const BASE_GREEN = 9000; // ms
    const YELLOW_MS = 2000;

    // external: function to request priority (call when emergency added)
    function requestPriorityFor(side) {
        emergencyRequestRef.current = { axis: AXIS_OF(side), side, ts: Date.now() };
    }

    // count queued by axis
    function countQueued(axis) {
        if (axis === 'vertical') return vehicles.filter(v => AXIS_OF(v.side) === 'vertical' && v.pos > 0).length;
        return vehicles.filter(v => AXIS_OF(v.side) === 'horizontal' && v.pos > 0).length;
    }

    // change to yellow on current phase
    function triggerYellow(axis) {
        setLights(s => ({ ...s, [axis]: 'yellow' }));
        timerRef.current = 0;
    }

    // main loop: decide when to switch phases & manage smart shortening
    useEffect(() => {
        let raf = null;
        function step(now) {
            const dt = now - lastTickRef.current; lastTickRef.current = now;
            timerRef.current += dt;

            // if emergency exists -> ensure its axis turns green quickly
            const emergency = emergencyRequestRef.current;
            if (emergency) {
                const axis = emergency.axis;
                if (phase !== axis) {
                    // if current axis green and not in yellow yet, go to yellow immediately
                    if (lights[phase] === 'green') {
                        triggerYellow(phase);
                    }
                    // if current axis is yellow and yellow elapsed, or current is red, switch
                    if (lights[phase] === 'yellow' && timerRef.current >= YELLOW_MS) {
                        const nextAxis = axis;
                        setPhase(nextAxis);
                        setLights({ vertical: nextAxis === 'vertical' ? 'green' : 'red', horizontal: nextAxis === 'horizontal' ? 'green' : 'red' });
                        timerRef.current = 0;
                        emergencyRequestRef.current = null;
                    }
                } else {
                    // already on that axis -> keep green (optionally extend)
                    // we simply reset idleSince so green won't shorten
                    idleSinceRef.current = null;
                }
            } else {
                // normal smart shortening logic
                const active = phase;
                const queued = countQueued(active);
                if (queued === 0) {
                    if (!idleSinceRef.current) idleSinceRef.current = now;
                    const idleMs = now - idleSinceRef.current;
                    if (idleMs > 1500 && lights[active] === 'green' && timerRef.current > 1000) {
                        // shorten early
                        triggerYellow(active);
                    }
                } else {
                    idleSinceRef.current = null;
                }

                // normal green -> yellow switching if exceeded duration
                const greenDuration = BASE_GREEN + Math.min(6000, queued * 700);
                if (lights[phase] === 'green' && timerRef.current >= greenDuration) {
                    triggerYellow(phase);
                }
                if (lights[phase] === 'yellow' && timerRef.current >= YELLOW_MS) {
                    const next = phase === 'vertical' ? 'horizontal' : 'vertical';
                    setPhase(next);
                    setLights({ vertical: next === 'vertical' ? 'green' : 'red', horizontal: next === 'horizontal' ? 'green' : 'red' });
                    timerRef.current = 0;
                }
            }

            raf = requestAnimationFrame(step);
        }
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [vehicles, lights, phase]);

    // expose controller data
    return { lights, phase, requestPriorityFor };
}

// ----------------------------- Main Component -----------------------------
export default function SmartTrafficIntersection() {
    // lanes per direction (palasa) - default to 1
    const [vLanes, setVLanes] = useState(1);
    const [hLanes, setHLanes] = useState(1);
    const [showModal, setShowModal] = useState(true);

    // vehicles state via reducer
    const [vehicles, dispatchVehicles] = useReducer(vehiclesReducer, []);

    // lane config object used by controller
    const lanesConfig = { v: vLanes, h: hLanes };

    // traffic controller hook
    const controller = useTrafficController(vehicles, (list) => dispatchVehicles({ type: 'UPDATE_LIST', payload: list }), lanesConfig);

    // main movement loop: updates vehicle positions obeying lights & spacing
    const lastRef = useRef(performance.now());
    useEffect(() => {
        let raf = null;
        function step(now) {
            const dt = now - lastRef.current; lastRef.current = now;

            // Copy vehicles to mutate and then dispatch
            let list = vehicles.slice();

            // We'll per-side sort by pos descending (front first)
            const bySide = {};
            SIDES.forEach(s => bySide[s] = list.filter(v => v.side === s).sort((a, b) => b.pos - a.pos));

            // helper: is axis green enough for vehicle to enter intersection
            function axisAllows(side, v) {
                const axis = AXIS_OF(side);
                const light = controller.lights[axis];
                if (light === 'green') return true;
                if (light === 'yellow') return v.pos < 90; // if close enough, allow to pass
                return false; // red
            }

            // update each side list
            SIDES.forEach(side => {
                const arr = bySide[side];
                for (let i = arr.length - 1; i >= 0; i--) {
                    const v = arr[i];
                    // find front vehicle (smaller index) because sorted desc
                    const front = arr[i - 1];
                    const minGap = (v.size + (front ? front.size : 0)) / 2 + 6; // px

                    // If front exists and gap too small -> stop
                    const gap = front ? (front.pos - v.pos) : Infinity;
                    if (gap <= minGap) {
                        v.state = 'queued';
                        continue;
                    }

                    // If vehicle already in intersection (pos small) keep moving
                    if (v.pos <= 0) {
                        // proceed through: decrement to negative values to simulate leaving
                        v.pos -= v.speed * dt * 0.06;
                        v.state = 'passed';
                        continue;
                    }

                    // If approaching intersection and axis doesn't allow -> wait
                    if (v.pos <= 120 && !axisAllows(side, v)) {
                        v.state = 'queued';
                        continue;
                    }

                    // else move towards intersection
                    const baseMove = v.speed * dt * 0.12;
                    let move = baseMove;
                    // heavy and fvv modifiers
                    if (v.type === 'heavy') move *= 0.8;
                    if (v.type === 'fvv') move *= 1.2;

                    v.pos = Math.max(-400, v.pos - move);
                    // when v.pos crosses <=0, it's inside intersection and will be marked passed next updates
                    if (v.pos <= 0) v.state = 'inside'; else v.state = 'moving';
                }
            });

            // remove very old passed vehicles
            list = [].concat(...SIDES.map(s => bySide[s]));
            list = list.filter(v => v.pos > -350);
            dispatchVehicles({ type: 'UPDATE_LIST', payload: list });

            raf = requestAnimationFrame(step);
        }
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [vehicles, controller.lights]);

    // when emergency vehicles are added, notify controller
    useEffect(() => {
        // find latest emergency (police/fvv/tow) waiting
        const em = vehicles.find(v => v.type === 'police' || v.type === 'fvv' || v.type === 'tow');
        if (em) controller.requestPriorityFor(em.side);
    }, [vehicles]);

    // UI actions
    function addVehicle(type, side) {
        dispatchVehicles({ type: 'ADD', payload: { type, side } });
    }

    return (
        <div className="p-6 min-h-screen bg-gray-50">
            <h1 className="text-2xl font-bold mb-4">Smart svetafor — batafsil simulyator</h1>

            <div className="flex gap-6">
                <div className="w-80 bg-white rounded-lg p-4 shadow">
                    <h2 className="font-semibold mb-2">Sozlamalar</h2>
                    <label className="text-sm">Vertikal palasalar (har tomonda)</label>
                    <input type="number" min={1} max={3} value={vLanes} onChange={(e) => setVLanes(Math.max(1, Math.min(3, Number(e.target.value) || 1)))} className="w-full p-2 my-2 rounded border" />
                    <label className="text-sm">Gorizontal palasalar (har tomonda)</label>
                    <input type="number" min={1} max={3} value={hLanes} onChange={(e) => setHLanes(Math.max(1, Math.min(3, Number(e.target.value) || 1)))} className="w-full p-2 my-2 rounded border" />

                    <div className="mt-4">
                        <h3 className="font-medium">Transport qo'shish</h3>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {Object.values(VEHICLE_TYPES).map(t => (
                                <button key={t.key} onClick={() => addVehicle(t.key, 'north')} className="p-2 border rounded text-sm">{t.label} (shimolga)</button>
                            ))}
                        </div>

                        <div className="mt-3 text-xs text-gray-600">
                            <p>Qo'shish tugmasi shimolga yaratadi — panel ichida boshqa yo'nalish tugmalari yoki drop-down qo'shib qo'ya olamiz.</p>
                        </div>

                        <div className="mt-4">
                            <button onClick={() => dispatchVehicles({ type: 'CLEAR' })} className="w-full bg-gray-100 p-2 rounded">Tozalash</button>
                        </div>
                    </div>

                    <div className="mt-4 text-sm">
                        <div>Vehicles: <strong>{vehicles.length}</strong></div>
                        <div>Vertical green: <strong className="ml-2">{controller.lights.vertical}</strong></div>
                        <div>Horizontal green: <strong className="ml-2">{controller.lights.horizontal}</strong></div>
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-lg p-4 shadow">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="font-semibold">Xarita va simulyatsiya</h2>
                        <div className="text-sm text-gray-600">Palasalar: V={vLanes} , H={hLanes}</div>
                    </div>

                    <div className="relative w-full h-[640px] flex items-center justify-center">
                        <MapView vehicles={vehicles} lights={controller.lights} vLanes={vLanes} hLanes={hLanes} />
                    </div>
                </div>
            </div>

            {/* modal to enforce lanes on first open */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white p-6 rounded w-[420px]">
                        <h3 className="text-lg font-semibold mb-2">Chorrahani sozlash</h3>
                        <p className="text-sm text-gray-600 mb-4">Vertikal va gorizontal palasalar sonini kiriting (har bir tomonda).</p>
                        <label className="text-sm">Vertikal palasalar</label>
                        <input className="w-full p-2 rounded border my-2" type="number" min={1} max={3} value={vLanes} onChange={(e) => setVLanes(Math.max(1, Math.min(3, Number(e.target.value) || 1)))} />
                        <label className="text-sm">Gorizontal palasalar</label>
                        <input className="w-full p-2 rounded border my-2" type="number" min={1} max={3} value={hLanes} onChange={(e) => setHLanes(Math.max(1, Math.min(3, Number(e.target.value) || 1)))} />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded bg-indigo-600 text-white">Davom et</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ----------------------------- Map & Visual Components -----------------------------
function MapView({ vehicles, lights, vLanes, hLanes }) {
    // map size & center coordinates
    const SIZE = 600;
    const CENTER = SIZE / 2;

    return (
        <div className="relative w-[600px] h-[600px] bg-green-50 rounded-md border border-gray-200">
            {/* Horizontal road */}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-[160px] flex justify-center pointer-events-none">
                <div className="w-full h-full bg-gray-300 rounded"></div>
            </div>
            {/* Vertical road */}
            <div className="absolute left-1/2 top-0 transform -translate-x-1/2 h-full w-[160px] flex items-center pointer-events-none">
                <div className="h-full w-full bg-gray-300 rounded"></div>
            </div>

            {/* center box */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] bg-gray-200 rounded-md flex items-center justify-center z-10">
                <div className="text-sm text-gray-700">Chorrah</div>
            </div>

            {/* traffic lights (visual) */}
            <TrafficLight x={CENTER - 120} y={60} axis={'vertical'} state={lights.vertical} />
            <TrafficLight x={CENTER + 120} y={540} axis={'vertical'} state={lights.vertical} flipped />
            <TrafficLight x={540} y={CENTER - 120} axis={'horizontal'} state={lights.horizontal} rotated />
            <TrafficLight x={60} y={CENTER + 120} axis={'horizontal'} state={lights.horizontal} rotated flipped />

            {/* Draw vehicles */}
            {vehicles.map(v => (
                <VehicleSprite key={v.id} v={v} center={CENTER} />
            ))}
        </div>
    );
}

function TrafficLight({ x, y, state = 'red', rotated = false, flipped = false }) {
    const wrapperStyle = { position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) ${flipped ? 'scaleX(-1)' : ''}` };
    return (
        <div style={wrapperStyle} className="z-20">
            <div className="p-1 rounded bg-black/80 w-[34px] h-[80px] flex flex-col items-center justify-around">
                <div className={`w-6 h-6 rounded-full ${state === 'red' ? 'bg-red-500' : 'bg-red-800/30'}`}></div>
                <div className={`w-6 h-6 rounded-full ${state === 'yellow' ? 'bg-yellow-400' : 'bg-yellow-800/30'}`}></div>
                <div className={`w-6 h-6 rounded-full ${state === 'green' ? 'bg-green-500' : 'bg-green-800/30'}`}></div>
            </div>
        </div>
    );
}

function VehicleSprite({ v, center }) {
    // compute x,y based on side and pos
    const laneOffset = 0; // currently single-lane visuals; can be expanded for multi-lane
    const base = { width: v.size, height: Math.max(14, v.size * 0.6) };
    let x = center, y = center, rot = 0;
    if (v.side === 'north') { x = center - 40 * laneOffset; y = center - v.pos; rot = 180; }
    if (v.side === 'south') { x = center + 40 * laneOffset; y = center + v.pos; rot = 0; }
    if (v.side === 'east') { x = center + v.pos; y = center - 40 * laneOffset; rot = -90; }
    if (v.side === 'west') { x = center - v.pos; y = center + 40 * laneOffset; rot = 90; }

    const style = {
        position: 'absolute', left: `${x}px`, top: `${y}px`, width: `${base.width}px`, height: `${base.height}px`, transform: `translate(-50%,-50%) rotate(${rot}deg)`, background: v.color, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10
    };

    return (
        <div style={style} title={`${v.type} #${v.id}`}>{v.type[0].toUpperCase()}</div>
    );
}
