'use client';
import { useState, useEffect, useRef } from 'react';
import TB from "./_components/TB";
import RL from "./_components/RL";
import Accet from './_components/Accet';
import Fin from './_components/Fin';
import Power from './_components/Power';

/* =========================
   БАЗОВЫЙ КЛАСС МАШИНЫ
========================= */
class Car {
    constructor(id, path, color, lane, direction, turn = null, vehicleType = 'car') {
        this.id = id;
        this.path = path;
        this.color = color;
        this.lane = lane;
        this.direction = direction;
        this.turn = turn;
        this.vehicleType = vehicleType; // 'car' | 'ambulance' | 'police' | 'firetruck'

        // Группа полосы: все варианты top_down_* в одной группе и т.д.
        this.laneGroup = this.computeLaneGroup(lane);

        this.position = { ...path[0] };
        this.currentStep = 0;
        this.baseSpeed = 2.2;
        this.speed = this.baseSpeed;
        this.isWaiting = false;
        this.waitTime = 0;
        this.isActive = false;
        this.width = 32;
        this.height = 18;
        this.hasPassedIntersection = false;
        this.isInIntersection = false;
        this.stoppedForLight = false;
        this.stoppedForCar = false;
        this.hasTurned = false;
    }

    // Общая группа для полос: чтобы "прямо" и "поворот" держали дистанцию друг с другом
    computeLaneGroup(lane) {
        if (!lane) return null;
        if (lane.startsWith('top_down')) return 'top_down';
        if (lane.startsWith('bottom_up')) return 'bottom_up';
        if (lane.startsWith('left_right')) return 'left_right';
        if (lane.startsWith('right_left')) return 'right_left';
        return lane;
    }

    update(trafficLights, allCars) {
        if (!this.isActive || this.currentStep >= this.path.length - 1) return;

        const nextStep = this.currentStep + 1;
        const target = this.path[nextStep];

        const trafficLight = this.getRelevantTrafficLight(trafficLights);

        const shouldStop = this.shouldStopForTrafficLight(trafficLight);

        if (shouldStop) {
            this.isWaiting = true;
            this.stoppedForLight = true;
            this.stoppedForCar = false;
            this.speed = 0;
            return;
        }

        // ---- MASOFANI CHIROYLI QILIB TEKSHIRISH ----
        const carAhead = this.checkCarAhead(allCars);
        if (carAhead) {
            // Juda yaqin – orqa mashina to‘xtaydi
            this.isWaiting = true;
            this.stoppedForCar = true;
            this.stoppedForLight = false;
            this.speed = 0;
            return;
        }

        // Oldida mashina yo‘q – tez qayta harakatlanadi
        this.isWaiting = false;
        this.stoppedForLight = false;
        this.stoppedForCar = false;
        this.waitTime = 0;
        this.speed = this.baseSpeed;

        const dx = target.x - this.position.x;
        const dy = target.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.speed) {
            this.position = { ...target };
            this.currentStep++;
            this.isInIntersection = this.isAtIntersection(this.position);
        } else {
            const progress = Math.min(1, this.speed / distance);
            this.position.x += dx * progress;
            this.position.y += dy * progress;
            this.isInIntersection = this.isAtIntersection(this.position);
        }
    }

    getRelevantTrafficLight(trafficLights) {
        if (this.direction === 'down') return trafficLights.find(light => light.id === 1);
        else if (this.direction === 'up') return trafficLights.find(light => light.id === 2);
        else if (this.direction === 'right') return trafficLights.find(light => light.id === 3);
        else if (this.direction === 'left') return trafficLights.find(light => light.id === 4);
        return null;
    }

    getDistanceToTrafficLight(trafficLight) {
        if (!trafficLight) return Infinity;

        let distance;
        switch (this.direction) {
            case 'down':
                distance = trafficLight.position.y - this.position.y;
                break;
            case 'up':
                distance = this.position.y - trafficLight.position.y;
                break;
            case 'right':
                distance = trafficLight.position.x - this.position.x;
                break;
            case 'left':
                distance = this.position.x - trafficLight.position.x;
                break;
            default:
                distance = Infinity;
        }
        return distance;
    }

    shouldStopForTrafficLight(trafficLight) {
        if (!trafficLight) return false;

        // Если маршрут поворотный и мы уже достаточно далеко от начала —
        // больше не смотрим на светофор (иначе "мигает" на дуге)
        if (this.lane.includes('_turn_') && this.currentStep > 4) {
            return false;
        }

        // Уже внутри перекрёстка — тоже игнорируем светофор
        if (this.isInIntersection) {
            return false;
        }

        if (trafficLight.color !== 'green') {
            const distanceToLight = this.getDistanceToTrafficLight(trafficLight);

            // прошли линию светофора
            if (!Number.isFinite(distanceToLight) || distanceToLight <= 0) {
                return false;
            }

            let inStopZone = false;

            if (this.direction === 'up' || this.direction === 'right') {
                inStopZone = distanceToLight >= 148 && distanceToLight <= 152;
            } else {
                inStopZone = distanceToLight >= 240 && distanceToLight <= 250;
            }

            if (inStopZone) {
                return true;
            }
        }

        return false;
    }

    checkCarAhead(allCars) {
        // Mashina o'lchami va xavfsiz oraliq
        const carLength = 32;   // div width/height bilan mos
        const safeGap = 18;     // mashinalar orasidagi “bo‘sh joy”
        const stopDistance = carLength + safeGap; // markazdan markazgacha min masofa (~50px)

        // Povorot bo'ylab anchadan beri ketayotgan bo'lsa,
        // ortidagi mashinaga bog'liq bo'lmasligi uchun tekshirmaymiz
        if (this.lane.includes('_turn_') && this.currentStep > 4) {
            return null;
        }

        let closestCar = null;
        let minDistance = Infinity;

        for (let otherCar of allCars) {
            if (otherCar.id === this.id) continue;
            if (!otherCar.isActive) continue;

            // Faqat bir xil yo'nalishdagi mashinalarni ko'ramiz
            if (otherCar.direction !== this.direction) continue;

            let isAhead = false;
            let longitudinalDist = 0; // yo'nalish bo'yicha masofa
            let lateralDist = 0;      // yon tomonga farq

            if (this.direction === 'down' || this.direction === 'up') {
                // Vertikal yo'nalish: x juda uzoq bo'lsa — bu boshqa yo'l
                lateralDist = Math.abs(otherCar.position.x - this.position.x);
                if (lateralDist > 20) continue;

                if (this.direction === 'down') {
                    isAhead = otherCar.position.y > this.position.y;
                    longitudinalDist = otherCar.position.y - this.position.y;
                } else {
                    isAhead = otherCar.position.y < this.position.y;
                    longitudinalDist = this.position.y - otherCar.position.y;
                }
            } else {
                // Gorizontal yo'nalish: y juda uzoq bo'lsa — bu boshqa yo'l
                lateralDist = Math.abs(otherCar.position.y - this.position.y);
                if (lateralDist > 20) continue;

                if (this.direction === 'right') {
                    isAhead = otherCar.position.x > this.position.x;
                    longitudinalDist = otherCar.position.x - this.position.x;
                } else {
                    isAhead = otherCar.position.x < this.position.x;
                    longitudinalDist = this.position.x - otherCar.position.x;
                }
            }

            if (!isAhead || longitudinalDist <= 0) continue;

            // Agar markazlar orasidagi masofa stopDistance dan kichik bo'lsa —
            // juda yaqin, to'xtash kerak
            if (longitudinalDist < stopDistance && longitudinalDist < minDistance) {
                minDistance = longitudinalDist;
                closestCar = otherCar;
            }
        }

        return closestCar;
    }


    isAtIntersection(position) {
        const intersectionLeft = 650;
        const intersectionRight = 750;
        const intersectionTop = 380;
        const intersectionBottom = 440;

        return (
            position.x >= intersectionLeft &&
            position.x <= intersectionRight &&
            position.y >= intersectionTop &&
            position.y <= intersectionBottom
        );
    }

    start() {
        this.isActive = true;
    }
}


/* =========================
   СПЕЦТРАНСПОРТ
========================= */
class Ambulance extends Car {
    constructor(id, path, color, lane, direction, turn = null) {
        super(id, path, color, lane, direction, turn, 'ambulance');
    }
}
class PoliceCar extends Car {
    constructor(id, path, color, lane, direction, turn = null) {
        super(id, path, color, lane, direction, turn, 'police');
    }
}
class FireTruck extends Car {
    constructor(id, path, color, lane, direction, turn = null) {
        super(id, path, color, lane, direction, turn, 'firetruck');
    }
}

function createVehicleInstanceFromSnapshot(carSnapshot) {
    let VehicleClass = Car;
    switch (carSnapshot.vehicleType) {
        case 'ambulance':
            VehicleClass = Ambulance;
            break;
        case 'police':
            VehicleClass = PoliceCar;
            break;
        case 'firetruck':
            VehicleClass = FireTruck;
            break;
        default:
            VehicleClass = Car;
    }

    const instance = new VehicleClass(
        carSnapshot.id,
        carSnapshot.path,
        carSnapshot.color,
        carSnapshot.lane,
        carSnapshot.direction,
        carSnapshot.turn
    );

    Object.assign(instance, {
        currentStep: carSnapshot.currentStep,
        position: { ...carSnapshot.position },
        isActive: carSnapshot.isActive,
        hasPassedIntersection: carSnapshot.hasPassedIntersection,
        isInIntersection: carSnapshot.isInIntersection,
        stoppedForLight: carSnapshot.stoppedForLight,
        stoppedForCar: carSnapshot.stoppedForCar,
        isWaiting: carSnapshot.isWaiting,
        vehicleType: carSnapshot.vehicleType || 'car',
        color: carSnapshot.color
    });

    // На всякий случай пересчитаем группу
    instance.laneGroup = instance.computeLaneGroup(instance.lane);

    return instance;
}

/* =========================
   LANE GA STATISTIKA
========================= */

// Svetofor id -> laneGroup
const getLaneGroupForLight = (lightId) => {
    switch (lightId) {
        case 1: return 'top_down';
        case 2: return 'bottom_up';
        case 3: return 'left_right';
        case 4: return 'right_left';
        default: return null;
    }
};

// LaneGroup bo‘yicha jami va kutayotgan mashinalar
const getLaneStats = (laneGroup, cars) => {
    if (!laneGroup) return { total: 0, waiting: 0 };

    const laneCars = cars.filter(c => (c.laneGroup || c.lane) === laneGroup);
    const waitingCars = laneCars.filter(c => c.isWaiting);

    return {
        total: laneCars.length,
        waiting: waitingCars.length
    };
};

// TB (top/bottom) va RL (left/right) bo‘yicha umumiy stats
const getDirectionStats = (directionKey, cars) => {
    let groups = [];
    if (directionKey === 'TB') {
        groups = ['top_down', 'bottom_up'];
    } else if (directionKey === 'RL') {
        groups = ['left_right', 'right_left'];
    }
    const total = cars.filter(c => groups.includes(c.laneGroup)).length;
    const waiting = cars.filter(c => groups.includes(c.laneGroup) && c.isWaiting).length;
    return { total, waiting };
};

export default function Home() {
    const [cars, setCars] = useState([]);
    const [trafficLights, setTrafficLights] = useState([]);
    const [isAnimationStarted, setIsAnimationStarted] = useState(false);
    const [selectedTurn, setSelectedTurn] = useState('straight');
    const [selectedVehicleType, setSelectedVehicleType] = useState('car');
    const [isAiMode, setIsAiMode] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);

    // Auto spawn boshqaruvi
    const [autoTB, setAutoTB] = useState(true); // top/bottom – 3s
    const [autoRL, setAutoRL] = useState(true); // left/right – 1s

    const animationRef = useRef(null);

    const carsRef = useRef([]);
    useEffect(() => {
        carsRef.current = cars;
    }, [cars]);

    useEffect(() => {
        const lights = [
            { id: 1, position: { x: 700, y: 350 }, color: 'red' },
            { id: 2, position: { x: 700, y: 471 }, color: 'red' },
            { id: 3, position: { x: 650, y: 411 }, color: 'green' },
            { id: 4, position: { x: 750, y: 411 }, color: 'green' },
        ];
        setTrafficLights(lights);
    }, []);

    /* =========================
       ПУТИ
    ========================= */
    const carPaths = {
        // ВЕРТИКАЛЬ
        top_down_left: [
            { x: 660, y: -50 }, { x: 660, y: 100 }, { x: 660, y: 200 },
            { x: 660, y: 300 }, { x: 660, y: 350 }, { x: 660, y: 411 },
            { x: 660, y: 500 }, { x: 660, y: 600 }, { x: 660, y: 700 },
            { x: 660, y: 800 }, { x: 660, y: 900 }
        ],
        top_down_right: [
            { x: 730, y: -50 }, { x: 730, y: 100 }, { x: 730, y: 200 },
            { x: 730, y: 300 }, { x: 730, y: 350 }, { x: 730, y: 411 },
            { x: 730, y: 500 }, { x: 730, y: 600 }, { x: 730, y: 700 },
            { x: 730, y: 800 }, { x: 730, y: 900 }
        ],
        bottom_up_left: [
            { x: 805, y: 900 }, { x: 805, y: 800 }, { x: 805, y: 700 },
            { x: 805, y: 600 }, { x: 805, y: 500 }, { x: 805, y: 471 },
            { x: 805, y: 400 }, { x: 805, y: 300 }, { x: 805, y: 200 },
            { x: 805, y: 100 }, { x: 805, y: -50 }
        ],
        bottom_up_right: [
            { x: 875, y: 900 }, { x: 875, y: 800 }, { x: 875, y: 700 },
            { x: 875, y: 600 }, { x: 875, y: 500 }, { x: 875, y: 471 },
            { x: 875, y: 400 }, { x: 875, y: 300 }, { x: 875, y: 200 },
            { x: 875, y: 100 }, { x: 875, y: -50 }
        ],

        // ГОРИЗОНТАЛЬ – ПРЯМО
        left_right_bottom: [
            { x: -50, y: 480 }, { x: 100, y: 480 }, { x: 200, y: 480 },
            { x: 300, y: 480 }, { x: 400, y: 480 }, { x: 500, y: 480 },
            { x: 550, y: 480 }, { x: 650, y: 480 }, { x: 700, y: 480 },
            { x: 800, y: 480 }, { x: 900, y: 480 }, { x: 1000, y: 480 },
            { x: 1100, y: 480 }, { x: 1200, y: 480 }, { x: 1300, y: 480 },
            { x: 1400, y: 480 }, { x: 1500, y: 480 }, { x: 1600, y: 480 }
        ],
        left_right_top: [
            { x: -50, y: 410 }, { x: 100, y: 410 }, { x: 200, y: 410 },
            { x: 300, y: 410 }, { x: 400, y: 410 }, { x: 500, y: 410 },
            { x: 550, y: 410 }, { x: 650, y: 410 }, { x: 700, y: 410 },
            { x: 800, y: 410 }, { x: 900, y: 410 }, { x: 1000, y: 410 },
            { x: 1100, y: 410 }, { x: 1200, y: 410 }, { x: 1300, y: 410 },
            { x: 1400, y: 410 }, { x: 1500, y: 410 }, { x: 1600, y: 410 }
        ],
        right_left_top: [
            { x: 1500, y: 260 }, { x: 1380, y: 260 }, { x: 1350, y: 260 }, { x: 1320, y: 260 },
            { x: 1250, y: 260 }, { x: 1200, y: 260 }, { x: 1150, y: 260 }, { x: 1100, y: 260 },
            { x: 1050, y: 260 }, { x: 1000, y: 260 }, { x: 950, y: 260 }, { x: 900, y: 260 },
            { x: 850, y: 260 }, { x: 750, y: 260 }, { x: 700, y: 260 }, { x: 600, y: 260 },
            { x: 500, y: 260 }, { x: 400, y: 260 }, { x: 300, y: 260 }, { x: 200, y: 260 },
            { x: 100, y: 260 }, { x: 50, y: 260 }, { x: -20, y: 260 }
        ],
        right_left_bottom: [
            { x: 1500, y: 335 }, { x: 1380, y: 335 }, { x: 1350, y: 335 }, { x: 1320, y: 335 },
            { x: 1250, y: 335 }, { x: 1200, y: 335 }, { x: 1150, y: 335 }, { x: 1100, y: 335 },
            { x: 1050, y: 335 }, { x: 1000, y: 335 }, { x: 950, y: 335 }, { x: 900, y: 335 },
            { x: 850, y: 335 }, { x: 750, y: 335 }, { x: 700, y: 335 }, { x: 600, y: 335 },
            { x: 500, y: 335 }, { x: 400, y: 335 }, { x: 300, y: 335 }, { x: 200, y: 335 },
            { x: 100, y: 335 }, { x: 50, y: 335 }, { x: -20, y: 335 }
        ],

        // ВЕРТИКАЛЬ – ПОВОРОТЫ
        bottom_up_turn_right: [
            { x: 870, y: 900 }, { x: 870, y: 800 }, { x: 870, y: 700 },
            { x: 870, y: 600 }, { x: 870, y: 485 }, { x: 870, y: 485 },
            { x: 870, y: 485 }, { x: 870, y: 485 }, { x: 870, y: 485 },
            { x: 900, y: 485 }, { x: 950, y: 485 }, { x: 1000, y: 485 },
            { x: 1100, y: 485 }, { x: 1200, y: 485 }, { x: 1500, y: 485 }
        ],
        bottom_up_turn_left: [
            { x: 812, y: 900 }, { x: 812, y: 800 }, { x: 812, y: 700 },
            { x: 812, y: 600 }, { x: 812, y: 500 }, { x: 812, y: 384 },

            { x: 790, y: 374 }, { x: 750, y: 369 },
            { x: 700, y: 364 }, { x: 650, y: 359 }, { x: 600, y: 354 },
            { x: 550, y: 349 }, { x: 500, y: 344 },
            { x: 400, y: 344 }, { x: 300, y: 344 }, { x: 200, y: 344 },
            { x: 100, y: 344 }, { x: -50, y: 344 }
        ],

        top_down_turn_right: [
            { x: 725, y: -50 }, { x: 725, y: 100 }, { x: 725, y: 200 },
            { x: 725, y: 300 }, { x: 725, y: 350 },
            { x: 725, y: 380 }, { x: 725, y: 390 }, { x: 725, y: 395 },
            { x: 725, y: 400 }, { x: 725, y: 405 },

            { x: 750, y: 410 }, { x: 770, y: 410 }, { x: 800, y: 410 },

            { x: 900, y: 410 },
            { x: 1000, y: 410 },
            { x: 1100, y: 410 },
            { x: 1200, y: 410 },
            { x: 1300, y: 410 },
            { x: 1400, y: 410 }
        ],

        top_down_turn_left: [
            { x: 660, y: -50 },
            { x: 660, y: 0 },
            { x: 660, y: 50 },
            { x: 660, y: 255 },

            { x: 640, y: 255 },
            { x: 620, y: 255 },
            { x: 600, y: 255 },

            { x: 500, y: 255 },
            { x: 400, y: 255 },
            { x: 300, y: 255 },
            { x: 200, y: 255 },
            { x: 100, y: 255 },
            { x: 0, y: 255 },
            { x: -50, y: 255 }
        ],

        /* =====================================
           НОВЫЕ ПУТИ ПОВОРОТА ДЛЯ ЛЕВО/ПРАВО
        ===================================== */

        // Слева → направо, поворот ВВЕРХ (налево для водителя)
        left_right_turn_up: [
            { x: 50, y: 410 }, { x: 200, y: 410 }, { x: 300, y: 410 },
            { x: 400, y: 410 }, { x: 500, y: 410 }, { x: 600, y: 410 },
            { x: 650, y: 410 }, { x: 720, y: 410 },
            { x: 800, y: 400 }, { x: 800, y: 380 }, { x: 800, y: 350 },
            { x: 800, y: 300 }, { x: 800, y: 200 }, { x: 800, y: 100 }, { x: 800, y: -50 },
        ],

        // Слева → направо, поворот ВНИЗ (направо для водителя)
        left_right_turn_down: [
            { x: -50, y: 480 }, { x: 100, y: 480 }, { x: 200, y: 480 },
            { x: 300, y: 480 }, { x: 400, y: 480 }, { x: 500, y: 480 },
            { x: 550, y: 480 }, { x: 620, y: 480 },
            { x: 650, y: 490 }, { x: 670, y: 510 }, { x: 680, y: 540 },
            { x: 680, y: 600 }, { x: 680, y: 700 }, { x: 680, y: 800 }, { x: 680, y: 900 }
        ],

        // Справа → налево, поворот ВВЕРХ (направо для водителя)
        right_left_turn_up: [
            { x: 1500, y: 260 }, { x: 1380, y: 260 }, { x: 1300, y: 260 },
            { x: 1200, y: 260 }, { x: 1100, y: 260 }, { x: 1000, y: 260 },

            { x: 875, y: 230 }, { x: 875, y: 200 }, { x: 875, y: 170 }, { x: 875, y: -110 },
        ],

        right_left_turn_down: [
            { x: 1500, y: 332 }, { x: 1380, y: 332 }, { x: 1300, y: 332 },
            { x: 1200, y: 332 }, { x: 1100, y: 332 }, { x: 1000, y: 332 },
            { x: 900, y: 332 }, { x: 850, y: 332 }, { x: 800, y: 332 }, { x: 750, y: 332 },
            { x: 730, y: 332 },

            { x: 730, y: 400 }, { x: 730, y: 500 }, { x: 730, y: 600 },
            { x: 730, y: 700 }, { x: 730, y: 800 }, { x: 730, y: 900 },
            { x: 730, y: 1000 }, { x: 730, y: 1100 }, { x: 730, y: 1200 }
        ],
    };

    /* =========================
       ДОБАВЛЕНИЕ МАШИН (ручное + автоспавн использует то же)
    ========================= */
    const addCar = (pathKey, turn = 'straight', vehicleTypeOverride = null) => {
        let effectiveTurn = turn;

        const vt = vehicleTypeOverride || selectedVehicleType;

        const colorByType = {
            car: '#f9fafb',
            police: '#1d4ed8',
            ambulance: '#ec4899',
            firetruck: '#dc2626'
        };

        const color = colorByType[vt] || colorByType.car;

        let direction = '';
        if (pathKey.includes('top_down')) direction = 'down';
        else if (pathKey.includes('bottom_up')) direction = 'up';
        else if (pathKey.includes('left_right')) direction = 'right';
        else if (pathKey.includes('right_left')) direction = 'left';

        let actualPathKey = pathKey;

        if (effectiveTurn !== 'straight') {
            if (pathKey.includes('bottom_up')) {
                actualPathKey = effectiveTurn === 'right' ? 'bottom_up_turn_right' : 'bottom_up_turn_left';
            } else if (pathKey.includes('top_down')) {
                actualPathKey = effectiveTurn === 'right' ? 'top_down_turn_right' : 'top_down_turn_left';
            } else if (pathKey.includes('left_right')) {
                if (effectiveTurn === 'left') actualPathKey = 'left_right_turn_up';
                else if (effectiveTurn === 'right') actualPathKey = 'left_right_turn_down';
            } else if (pathKey.includes('right_left')) {
                if (effectiveTurn === 'right') actualPathKey = 'right_left_turn_up';
                else if (effectiveTurn === 'left') actualPathKey = 'right_left_turn_down';
            }
        }

        let VehicleClass = Car;
        if (vt === 'ambulance') VehicleClass = Ambulance;
        else if (vt === 'police') VehicleClass = PoliceCar;
        else if (vt === 'firetruck') VehicleClass = FireTruck;

        const newCar = new VehicleClass(
            Date.now() + Math.random(),
            carPaths[actualPathKey],
            color,
            actualPathKey,
            direction,
            effectiveTurn
        );

        newCar.vehicleType = vt;
        newCar.color = color;
        newCar.isActive = false;

        setCars(prev => [...prev, newCar]);
    };

    /* =========================
       УПРАВЛЕНИЕ АНИМАЦИЕЙ
    ========================= */
    const startAnimation = () => setIsAnimationStarted(true);
    const clearCars = () => setCars([]);
    const stopAnimation = () => {
        setIsAnimationStarted(false);
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
    };

    // Mashinalarni yuritish
    useEffect(() => {
        if (!isAnimationStarted) return;

        const animate = () => {
            setCars(prev => {
                const updatedCars = prev.map(car => {
                    const updatedCar = createVehicleInstanceFromSnapshot(car);
                    updatedCar.update(trafficLights, prev);
                    return updatedCar;
                }).filter(car => car.currentStep < car.path.length - 1);

                return updatedCars;
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
        };
    }, [trafficLights, isAnimationStarted]);

    // Har 600ms – navbatdagi mashinani "start" qilish
    useEffect(() => {
        if (!isAnimationStarted) return;

        const interval = setInterval(() => {
            setCars(prev => {
                const idx = prev.findIndex(car => !car.isActive);
                if (idx === -1) {
                    return prev;
                }

                const next = [...prev];
                const snapshot = prev[idx];
                const updatedCar = createVehicleInstanceFromSnapshot(snapshot);
                updatedCar.isActive = true;
                updatedCar.isWaiting = false;
                next[idx] = updatedCar;
                return next;
            });
        }, 600);

        return () => clearInterval(interval);
    }, [isAnimationStarted]);

    /* =========================
       AUTO SPAWN:
       - RL (left/right)  – 1 sekund
       - TB (top/bottom)  – 3 sekund
    ========================= */
    useEffect(() => {
        if (!isAnimationStarted) return;

        let rlInterval = null;
        let tbInterval = null;

        if (autoRL) {
            rlInterval = setInterval(() => {
                // RL: chapdan-o‘ngga va o‘ngdan-chapga
                const keys = ['left_right_top', 'left_right_bottom', 'right_left_top', 'right_left_bottom'];
                const key = keys[Math.floor(Math.random() * keys.length)];
                // AUTO → faqat oddiy mashina
                addCar(key, selectedTurn, 'car');
            }, 1000); // 1 sekund
        }

        if (autoTB) {
            tbInterval = setInterval(() => {
                // TB: yuqoridan-pastga va pastdan-yuqoriga
                const keys = ['top_down_left', 'top_down_right', 'bottom_up_left', 'bottom_up_right'];
                const key = keys[Math.floor(Math.random() * keys.length)];
                // AUTO → faqat oddiy mashina
                addCar(key, selectedTurn, 'car');
            }, 3000); // 3 sekund
        }

        return () => {
            if (rlInterval) clearInterval(rlInterval);
            if (tbInterval) clearInterval(tbInterval);
        };
    }, [isAnimationStarted, autoRL, autoTB, selectedTurn]);

    /* =========================
       AI ДЛЯ СВЕТОФОРА + обычный цикл
    ========================= */
    /* =========================
       AI ДЛЯ СВЕТОФОРА + обычный цикл
       - Har doim: yashil → sariq → qizil
       - Sariq rangda HECH QAYSI mashina yurmaydi (shouldStopForTrafficLight da yellow = stop)
       - AI rejimida sariq biroz KO‘PROQ yonadi, chorraha tozalansin
    ========================= */
    useEffect(() => {
        let cycleStep = 0;
        let stepTimer = 0;
        const emergencyTypes = ['ambulance', 'police', 'firetruck'];

        // Oldingi holat (qaysi tomonda qanaqa rang bo‘lgan)
        let prevVertical = 'red';
        let prevHorizontal = 'green';

        // Necha tiks sariqda ushlab turamiz
        let yellowHold = 0;

        // AI va oddiy rejim uchun sariq davomiyligi (tick = 100ms)
        const YELLOW_HOLD_AI = 12;      // 12 * 100ms = 1.2s
        const YELLOW_HOLD_NORMAL = 5;   // 5 * 100ms = 0.5s

        const interval = setInterval(() => {
            let verticalColor;
            let horizontalColor;

            // Agar hozir "sariq pauza" bo'lsa — ikkala tomonda ham sariq yonadi
            if (yellowHold > 0) {
                yellowHold--;
                verticalColor = 'yellow';
                horizontalColor = 'yellow';
            } else {
                let targetVertical;
                let targetHorizontal;

                if (isAiMode) {
                    const currentCars = carsRef.current;

                    const verticalEmergency = currentCars.some(
                        c =>
                            emergencyTypes.includes(c.vehicleType) &&
                            (c.direction === 'up' || c.direction === 'down')
                    );
                    const horizontalEmergency = currentCars.some(
                        c =>
                            emergencyTypes.includes(c.vehicleType) &&
                            (c.direction === 'left' || c.direction === 'right')
                    );

                    const verticalCount = currentCars.filter(
                        c => c.direction === 'up' || c.direction === 'down'
                    ).length;
                    const horizontalCount = currentCars.filter(
                        c => c.direction === 'left' || c.direction === 'right'
                    ).length;

                    // AI logika – faqat qaysi tomonga ko'proq yashil berishni hal qiladi
                    if (verticalEmergency && !horizontalEmergency) {
                        // faqat vertikalga spetsmashina – vertikalga yashil
                        targetVertical = 'green';
                        targetHorizontal = 'red';
                    } else if (horizontalEmergency && !verticalEmergency) {
                        // faqat gorizontalga spetsmashina – gorizontalga yashil
                        targetVertical = 'red';
                        targetHorizontal = 'green';
                    } else if (verticalEmergency && horizontalEmergency) {
                        // Ikkala tomonda ham spetsmashina bor:
                        // ko'proq mashina yig'ilgan tomonni o'tkazamiz
                        if (verticalCount > horizontalCount) {
                            // vertikal yo'nalishda ko'proq mashina
                            targetVertical = 'green';
                            targetHorizontal = 'red';
                        } else if (horizontalCount > verticalCount) {
                            // gorizontal yo'nalishda ko'proq mashina
                            targetVertical = 'red';
                            targetHorizontal = 'green';
                        } else {
                            // teng bo'lsa – xavfsizlik uchun ikkala taraf ham qizil
                            targetVertical = 'red';
                            targetHorizontal = 'red';
                        }
                    } else if (verticalCount === 0 && horizontalCount === 0) {
                        stepTimer++;

                        if (cycleStep === 0 && stepTimer >= 400) {
                            cycleStep = 1;
                            stepTimer = 0;
                        } else if (cycleStep === 1 && stepTimer >= 50) {
                            cycleStep = 2;
                            stepTimer = 0;
                        } else if (cycleStep === 2 && stepTimer >= 400) {
                            cycleStep = 3;
                            stepTimer = 0;
                        } else if (cycleStep === 3 && stepTimer >= 50) {
                            cycleStep = 0;
                            stepTimer = 0;
                        }

                        switch (cycleStep) {
                            case 0:
                                targetVertical = 'red';
                                targetHorizontal = 'green';
                                break;
                            case 1:
                                targetVertical = 'yellow';
                                targetHorizontal = 'yellow';
                                break;
                            case 2:
                                targetVertical = 'green';
                                targetHorizontal = 'red';
                                break;
                            case 3:
                                targetVertical = 'yellow';
                                targetHorizontal = 'yellow';
                                break;
                            default:
                                targetVertical = 'red';
                                targetHorizontal = 'green';
                        }
                    } else if (verticalCount === 0 && horizontalCount > 0) {
                        targetVertical = 'red';
                        targetHorizontal = 'green';
                    } else if (horizontalCount === 0 && verticalCount > 0) {
                        targetVertical = 'green';
                        targetHorizontal = 'red';
                    } else if (verticalCount > horizontalCount + 3) {
                        targetVertical = 'green';
                        targetHorizontal = 'red';
                    } else if (horizontalCount > verticalCount + 3) {
                        targetVertical = 'red';
                        targetHorizontal = 'green';
                    } else {
                        stepTimer++;

                        if (cycleStep === 0 && stepTimer >= 400) {
                            cycleStep = 1;
                            stepTimer = 0;
                        } else if (cycleStep === 1 && stepTimer >= 50) {
                            cycleStep = 2;
                            stepTimer = 0;
                        } else if (cycleStep === 2 && stepTimer >= 400) {
                            cycleStep = 3;
                            stepTimer = 0;
                        } else if (cycleStep === 3 && stepTimer >= 50) {
                            cycleStep = 0;
                            stepTimer = 0;
                        }

                        switch (cycleStep) {
                            case 0:
                                targetVertical = 'red';
                                targetHorizontal = 'green';
                                break;
                            case 1:
                                targetVertical = 'yellow';
                                targetHorizontal = 'yellow';
                                break;
                            case 2:
                                targetVertical = 'green';
                                targetHorizontal = 'red';
                                break;
                            case 3:
                                targetVertical = 'yellow';
                                targetHorizontal = 'yellow';
                                break;
                            default:
                                targetVertical = 'red';
                                targetHorizontal = 'green';
                        }
                    }
                } else {
                    // Oddiy rejim – eski sikl
                    stepTimer++;

                    if (cycleStep === 0 && stepTimer >= 400) {
                        cycleStep = 1;
                        stepTimer = 0;
                    } else if (cycleStep === 1 && stepTimer >= 50) {
                        cycleStep = 2;
                        stepTimer = 0;
                    } else if (cycleStep === 2 && stepTimer >= 400) {
                        cycleStep = 3;
                        stepTimer = 0;
                    } else if (cycleStep === 3 && stepTimer >= 50) {
                        cycleStep = 0;
                        stepTimer = 0;
                    }

                    switch (cycleStep) {
                        case 0:
                            targetVertical = 'red';
                            targetHorizontal = 'green';
                            break;
                        case 1:
                            targetVertical = 'yellow';
                            targetHorizontal = 'yellow';
                            break;
                        case 2:
                            targetVertical = 'green';
                            targetHorizontal = 'red';
                            break;
                        case 3:
                            targetVertical = 'yellow';
                            targetHorizontal = 'yellow';
                            break;
                        default:
                            targetVertical = 'red';
                            targetHorizontal = 'green';
                    }
                }

                // --- Shu yerda: yashil → qizil bo'layotganda avval UZOQ sariq ---
                const verticalGreenToRed =
                    prevVertical === 'green' && targetVertical === 'red';
                const horizontalGreenToRed =
                    prevHorizontal === 'green' && targetHorizontal === 'red';

                if (verticalGreenToRed || horizontalGreenToRed) {
                    // AI rejimida sariq uzoqroq, oddiyda qisqaroq
                    yellowHold = isAiMode ? YELLOW_HOLD_AI : YELLOW_HOLD_NORMAL;
                    verticalColor = 'yellow';
                    horizontalColor = 'yellow';
                } else {
                    verticalColor = targetVertical;
                    horizontalColor = targetHorizontal;
                }
            }

            prevVertical = verticalColor;
            prevHorizontal = horizontalColor;

            setTrafficLights(prev =>
                prev.map(light => {
                    const isVertical = light.id === 1 || light.id === 2;
                    const color = isVertical ? verticalColor : horizontalColor;
                    return { ...light, color };
                })
            );
        }, 100);

        return () => clearInterval(interval);
    }, [isAiMode]);


    const getCarRotation = (direction) => {
        switch (direction) {
            case 'up': return 'rotate(0deg)';
            case 'down': return 'rotate(180deg)';
            case 'left': return 'rotate(90deg)';
            case 'right': return 'rotate(-90deg)';
            default: return 'rotate(0deg)';
        }
    };

    const plusBtnClass =
        "w-7 h-7 rounded-md bg-white/95 text-gray-800 text-sm font-bold " +
        "flex items-center justify-center shadow-md border border-gray-300 " +
        "hover:bg-gray-100 hover:scale-105 transition-transform";

    // TB/RL stats
    const tbStats = getDirectionStats('TB', cars);
    const rlStats = getDirectionStats('RL', cars);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 overflow-hidden">
            <div className="relative w-full max-w-[100%] h-screen">
                {/* Дорога */}
                <div className="absolute inset-0">
                    <TB trafficLights={trafficLights} />
                    <RL trafficLights={trafficLights} />

                    {/* Mashinalar */}
                    {cars.map(car => (
                        <div
                            key={car.id}
                            className="absolute rounded-md transform -translate-x-1/2 -translate-y-1/2 shadow-lg border border-gray-700"
                            style={{
                                left: car.position.x,
                                top: car.position.y,
                                backgroundColor: car.color,
                                width: '32px',
                                height: '30px',
                                transform: `translate(-50%, -50%) ${getCarRotation(car.direction)}`,
                                opacity: car.isWaiting ? 0.7 : 1,
                                boxShadow: car.stoppedForLight
                                    ? '0 0 12px rgba(248,113,113,0.9)'
                                    : car.stoppedForCar
                                        ? '0 0 12px rgba(251,191,36,0.9)'
                                        : '0 4px 10px rgba(0,0,0,0.5)',
                                zIndex: 10
                            }}
                        >
                            <div className="absolute w-3 h-1.5 bg-yellow-200 top-[3px] left-[4px] rounded-sm" />
                            <div className="absolute w-3 h-1.5 bg-red-400 bottom-[3px] right-[4px] rounded-sm" />
                            <div className="absolute inset-0 rounded-md border border-white/10" />
                        </div>
                    ))}
                </div>

                {/* STATISTIKA MODAL TUGMASI */}
                <button
                    onClick={() => setShowStatsModal(true)}
                    className="absolute bottom-4 right-4 z-40 text-[10px] px-3 py-1.5 rounded-full bg-white/95 text-gray-900 shadow border border-gray-200 hover:bg-gray-100"
                >
                    Umumiy yo‘l statistikasi
                </button>

                {/* CHAP YUQORI PANEL – ANIMATSIYA / AI */}
                <div className="absolute top-4 left-4 bg-white/95 text-gray-900 p-3 rounded-2xl shadow-xl backdrop-blur-sm border border-gray-200 w-[260px] space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-xs text-gray-900">
                            Animatsiya boshqaruvi
                        </h2>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            Chorraha simulyatsiyasi
                        </span>
                    </div>

                    {/* Start / Stop / Tozalash */}
                    <div className="flex gap-2">
                        <button
                            onClick={startAnimation}
                            disabled={isAnimationStarted}
                            className={`flex-1 px-3 py-1.5 rounded-lg bg-blue-500 text-[11px] font-semibold text-white ${isAnimationStarted
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                        >
                            Start
                        </button>
                        <button
                            onClick={stopAnimation}
                            className="flex-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[11px] font-semibold hover:bg-amber-600"
                        >
                            To‘xtatish
                        </button>
                        <button
                            onClick={clearCars}
                            className="flex-1 px-3  py-1.5 bg-[red] text-white rounded-lg text-[11px] font-semibold hover:bg-rose-700"
                        >
                            Tozalash
                        </button>
                    </div>

                    <div className="h-px bg-gray-200" />

                    {/* AI rejimi */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-semibold text-gray-900">
                                Svetoforning AI rejimi
                            </p>
                            <p className="text-[9px] text-gray-500">
                                Maxsus mashina va tirband yo‘llarga ustuvorlik
                            </p>
                        </div>
                        <button
                            onClick={() => setIsAiMode(prev => !prev)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-semibold border min-w-[70px] text-center ${isAiMode
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-gray-100 text-gray-700 border-gray-300'
                                }`}
                        >
                            {isAiMode ? 'O`chirish' : 'Yoqish'}
                        </button>
                    </div>
                </div>

                {/* O‘NG YUQORI PANEL – TRANSPORT / YO‘NALISH */}
                <div className="absolute top-4 right-4 bg-white/95 text-gray-900 p-3 rounded-2xl shadow-xl backdrop-blur-sm border border-gray-200 w-[260px] space-y-3">
                    {/* Transport turi */}
                    <div>
                        <p className="font-semibold text-[11px] text-gray-900 mb-1">
                            Transport turi
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                            <button
                                onClick={() => setSelectedVehicleType('car')}
                                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] border ${selectedVehicleType === 'car'
                                    ? 'bg-gray-900 text-white border-gray-900'
                                    : 'bg-gray-100 text-gray-800 border-gray-300'
                                    }`}
                            >
                                <span className="w-3 h-3 rounded-sm bg-gray-200 border border-gray-400" />
                                <span>Oddiy</span>
                            </button>
                            <button
                                onClick={() => setSelectedVehicleType('police')}
                                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] border ${selectedVehicleType === 'police'
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-gray-100 text-gray-800 border-gray-300'
                                    }`}
                            >
                                <span className="w-3 h-3 rounded-sm bg-blue-600" />
                                <span>Politsiya</span>
                            </button>
                            <button
                                onClick={() => setSelectedVehicleType('ambulance')}
                                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] border ${selectedVehicleType === 'ambulance'
                                    ? 'bg-pink-500 text-white border-pink-500'
                                    : 'bg-gray-100 text-gray-800 border-gray-300'
                                    }`}
                            >
                                <span className="w-3 h-3 rounded-sm bg-pink-500" />
                                <span>Tez yordam</span>
                            </button>
                            <button
                                onClick={() => setSelectedVehicleType('firetruck')}
                                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] border ${selectedVehicleType === 'firetruck'
                                    ? 'bg-red-600 text-white border-red-600'
                                    : 'bg-gray-100 text-gray-800 border-gray-300'
                                    }`}
                            >
                                <span className="w-3 h-3 rounded-sm bg-red-600" />
                                <span>Yong‘in mashinasi</span>
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-gray-200" />

                    {/* Yo‘nalish */}
                    <div>
                        <p className="font-semibold text-[11px] text-gray-900 mb-1">
                            Yo‘nalish
                        </p>
                        <div className="grid grid-cols-3 gap-1.5">
                            <button
                                onClick={() => setSelectedTurn('straight')}
                                className={`px-2 py-1.5 rounded-lg text-[10px] border ${selectedTurn === 'straight'
                                    ? 'bg-sky-500 text-white border-sky-500'
                                    : 'bg-gray-100 text-gray-800 border-gray-300'
                                    }`}
                            >
                                Oldinga
                            </button>
                            <button
                                onClick={() => setSelectedTurn('left')}
                                className={`px-2 py-1.5 rounded-lg text-[10px] border ${selectedTurn === 'left'
                                    ? 'bg-emerald-500 text-white border-emerald-500'
                                    : 'bg-gray-100 text-gray-800 border-gray-300'
                                    }`}
                            >
                                Chapga
                            </button>
                            <button
                                onClick={() => setSelectedTurn('right')}
                                className={`px-2 py-1.5 rounded-lg text-[10px] border ${selectedTurn === 'right'
                                    ? 'bg-violet-500 text-white border-violet-500'
                                    : 'bg-gray-100 text-gray-800 border-gray-300'
                                    }`}
                            >
                                O‘ngga
                            </button>
                        </div>
                    </div>
                </div>

                {/* Сверху (движение вниз) */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-2 bg-black/25 px-2 py-1 rounded-full backdrop-blur-sm border border-white/10">
                    <button
                        className={plusBtnClass}
                        onClick={() => addCar('top_down_left', selectedTurn)}
                        title="Сверху, левый ряд"
                    >
                        +
                    </button>
                    <button
                        className={plusBtnClass}
                        onClick={() => addCar('top_down_right', selectedTurn)}
                        title="Сверху, правый ряд"
                    >
                        +
                    </button>
                </div>

                {/* Снизу (движение вверх) */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 bg-black/25 px-2 py-1 rounded-full backdrop-blur-sm border border-white/10">
                    <button
                        className={plusBtnClass}
                        onClick={() => addCar('bottom_up_left', selectedTurn)}
                        title="Снизу, левый ряд"
                    >
                        +
                    </button>
                    <button
                        className={plusBtnClass}
                        onClick={() => addCar('bottom_up_right', selectedTurn)}
                        title="Снизу, правый ряд"
                    >
                        +
                    </button>
                </div>
                {/* Слева (движение вправо) */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-black/25 px-1.5 py-2 rounded-full backdrop-blur-sm border border-white/10">
                    <button
                        className={plusBtnClass}
                        onClick={() => addCar('left_right_top', selectedTurn)}
                        title="Слева, верхний ряд"
                    >
                        +
                    </button>
                    <button
                        className={plusBtnClass}
                        onClick={() => addCar('left_right_bottom', selectedTurn)}
                        title="Слева, нижний ряд"
                    >
                        +
                    </button>
                </div>

                {/* Справа (движение влево) */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-black/25 px-1.5 py-2 rounded-full backdrop-blur-sm border border-white/10">
                    <button
                        className={plusBtnClass}
                        onClick={() => addCar('right_left_top', selectedTurn)}
                        title="Справа, верхний ряд"
                    >
                        +
                    </button>
                    <button
                        className={plusBtnClass}
                        onClick={() => addCar('right_left_bottom', selectedTurn)}
                        title="Справа, нижний ряд"
                    >
                        +
                    </button>
                </div>
                {/* TB (Yuqoridan/pastdan) AUTO SPAWN PANEL – alohida “modal” */}
                <div className="absolute bottom-[140px] left-[280px] bg-white/95 text-gray-900 p-3 rounded-2xl shadow-xl border border-gray-200 w-[220px] text-[11px] space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold">Yuqori/Past</span>
                        <button
                            onClick={() => setAutoTB(prev => !prev)}
                            className={`px-2 py-0.5 rounded-full bg-blue-500 text-[10px] border ${autoTB
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'bg-gray-100 text-gray-700 border-gray-300'
                                }`}
                        >
                            {autoTB ? 'Auto ON (3s)' : 'Auto OFF'}
                        </button>
                    </div>
                    <div className="flex justify-between">
                        <span>Jami mashina: {tbStats.total} ta</span>
                        <span>Kutyapti: {tbStats.waiting} ta</span>
                    </div>
                </div>
                {/* RL (Chap/O‘ng) AUTO SPAWN PANEL – alohida “modal” */}
                <div className="absolute top-[140px] right-[280px] bg-white/95 text-gray-900 p-3 rounded-2xl shadow-xl border border-gray-200 w-[220px] text-[11px] space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold">Chap/O‘ng</span>
                        <button
                            onClick={() => setAutoRL(prev => !prev)}
                            className={`px-2 py-0.5 rounded-full text-[10px] border ${autoRL
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-gray-100 text-gray-700 border-gray-300'
                                }`}
                        >
                            {autoRL ? 'Auto ON (1s)' : 'Auto OFF'}
                        </button>
                    </div>
                    <div className="flex justify-between">
                        <span>Jami mashina: {rlStats.total} ta</span>
                        <span>Kutyapti: {rlStats.waiting} ta</span>
                    </div>
                </div>
                <div className='flex items-center flex-col gap-[5px] bg-[white] p-[10px] rounded-[10px] absolute w-[200px] top-[18px] left-[300px]'>
                    <Accet />
                    <Fin />
                    <Power />
                </div>

                {/* Umumiy STATISTIKA MODAL – oq tema */}
                {showStatsModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <div className="bg-white text-black rounded-2xl shadow-2xl w-[320px] max-w-[90%] p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="font-semibold text-sm">
                                    Yo‘l bo‘yicha mashinalar statistikasi
                                </h2>
                                <button
                                    onClick={() => setShowStatsModal(false)}
                                    className="text-xs px-2 py-1 rounded-full bg-black/5"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-2 text-[11px]">
                                {['top_down', 'bottom_up', 'left_right', 'right_left'].map(group => {
                                    const stats = getLaneStats(group, cars);
                                    return (
                                        <div
                                            key={group}
                                            className="border border-black/10 rounded-xl px-3 py-2"
                                        >
                                            <div className="font-medium mb-1">
                                                {group === 'top_down' && 'Yuqoridan pastga'}
                                                {group === 'bottom_up' && 'Pastdan yuqoriga'}
                                                {group === 'left_right' && 'Chapdan o‘ngga'}
                                                {group === 'right_left' && 'O‘ngdan chapga'}
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Jami: {stats.total} ta</span>
                                                <span>Kutyapti: {stats.waiting} ta</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
