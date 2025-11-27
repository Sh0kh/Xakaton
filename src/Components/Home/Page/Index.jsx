'use client';
import { useState, useEffect, useRef } from 'react';
import TB from "./_components/TB";
import RL from "./_components/RL";

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

        const carAhead = this.checkCarAhead(allCars);
        if (carAhead) {
            this.isWaiting = true;
            this.stoppedForCar = true;
            this.stoppedForLight = false;
            this.speed = 0;
            return;
        }

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
        // Очень близко (~30px) – только тогда стоп
        const safeDistance = 30;

        // В повороте после нескольких шагов не тормозим,
        // чтобы не было дёрганий на дуге.
        if (this.lane.includes('_turn_') && this.currentStep > 4) {
            return null;
        }

        const myLaneGroup = this.laneGroup || this.lane;

        const carsOnSameLane = allCars.filter(otherCar =>
            otherCar.id !== this.id &&
            otherCar.isActive &&
            (otherCar.laneGroup || otherCar.lane) === myLaneGroup
        );

        if (carsOnSameLane.length === 0) return null;

        let closestCar = null;
        let minDistance = Infinity;

        for (let otherCar of carsOnSameLane) {
            let distance = 0;
            let isAhead = false;

            if (this.direction === 'down') {
                isAhead = otherCar.position.y > this.position.y;
                distance = otherCar.position.y - this.position.y;
            } else if (this.direction === 'up') {
                isAhead = otherCar.position.y < this.position.y;
                distance = this.position.y - otherCar.position.y;
            } else if (this.direction === 'right') {
                isAhead = otherCar.position.x > this.position.x;
                distance = otherCar.position.x - this.position.x;
            } else if (this.direction === 'left') {
                isAhead = otherCar.position.x < this.position.x;
                distance = this.position.x - otherCar.position.x;
            }

            // На всякий случай отсеиваем странные случаи
            if (!isAhead || distance <= 0) continue;

            // Стоп только если прям очень близко
            if (distance <= safeDistance && distance < minDistance) {
                minDistance = distance;
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

export default function Home() {
    const [cars, setCars] = useState([]);
    const [trafficLights, setTrafficLights] = useState([]);
    const [isAnimationStarted, setIsAnimationStarted] = useState(false);
    const [selectedTurn, setSelectedTurn] = useState('straight');
    const [selectedVehicleType, setSelectedVehicleType] = useState('car');
    const [isAiMode, setIsAiMode] = useState(false);
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
       AI ДЛЯ СВЕТОФОРА + обычный цикл
    ========================= */
    useEffect(() => {
        let cycleStep = 0;
        let stepTimer = 0;
        const emergencyTypes = ['ambulance', 'police', 'firetruck'];

        const interval = setInterval(() => {
            let verticalColor, horizontalColor;

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

                if (verticalEmergency && !horizontalEmergency) {
                    verticalColor = 'green';
                    horizontalColor = 'red';
                } else if (horizontalEmergency && !verticalEmergency) {
                    verticalColor = 'red';
                    horizontalColor = 'green';
                } else if (verticalEmergency && horizontalEmergency) {
                    verticalColor = 'red';
                    horizontalColor = 'red';
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
                            verticalColor = 'red';
                            horizontalColor = 'green';
                            break;
                        case 1:
                            verticalColor = 'yellow';
                            horizontalColor = 'yellow';
                            break;
                        case 2:
                            verticalColor = 'green';
                            horizontalColor = 'red';
                            break;
                        case 3:
                            verticalColor = 'yellow';
                            horizontalColor = 'yellow';
                            break;
                        default:
                            verticalColor = 'red';
                            horizontalColor = 'green';
                    }
                } else if (verticalCount === 0 && horizontalCount > 0) {
                    verticalColor = 'red';
                    horizontalColor = 'green';
                } else if (horizontalCount === 0 && verticalCount > 0) {
                    verticalColor = 'green';
                    horizontalColor = 'red';
                } else if (verticalCount > horizontalCount + 3) {
                    verticalColor = 'green';
                    horizontalColor = 'red';
                } else if (horizontalCount > verticalCount + 3) {
                    verticalColor = 'red';
                    horizontalColor = 'green';
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
                            verticalColor = 'red';
                            horizontalColor = 'green';
                            break;
                        case 1:
                            verticalColor = 'yellow';
                            horizontalColor = 'yellow';
                            break;
                        case 2:
                            verticalColor = 'green';
                            horizontalColor = 'red';
                            break;
                        case 3:
                            verticalColor = 'yellow';
                            horizontalColor = 'yellow';
                            break;
                        default:
                            verticalColor = 'red';
                            horizontalColor = 'green';
                    }
                }
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
                        verticalColor = 'red';
                        horizontalColor = 'green';
                        break;
                    case 1:
                        verticalColor = 'yellow';
                        horizontalColor = 'yellow';
                        break;
                    case 2:
                        verticalColor = 'green';
                        horizontalColor = 'red';
                        break;
                    case 3:
                        verticalColor = 'yellow';
                        horizontalColor = 'yellow';
                        break;
                    default:
                        verticalColor = 'red';
                        horizontalColor = 'green';
                }
            }

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
       ДОБАВЛЕНИЕ МАШИН
    ========================= */
    const addCar = (pathKey, turn = 'straight') => {
        let effectiveTurn = turn;

        const colorByType = {
            car: '#f9fafb',
            police: '#1d4ed8',
            ambulance: '#ec4899',
            firetruck: '#dc2626'
        };

        const color = colorByType[selectedVehicleType] || colorByType.car;

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
        if (selectedVehicleType === 'ambulance') VehicleClass = Ambulance;
        else if (selectedVehicleType === 'police') VehicleClass = PoliceCar;
        else if (selectedVehicleType === 'firetruck') VehicleClass = FireTruck;

        const newCar = new VehicleClass(
            Date.now() + Math.random(),
            carPaths[actualPathKey],
            color,
            actualPathKey,
            direction,
            effectiveTurn
        );

        newCar.vehicleType = selectedVehicleType;
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

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 overflow-hidden">
            <div className="relative w-full max-w-[100%] h-screen">
                {/* Дорога */}
                <div className="absolute inset-0">
                    <TB trafficLights={trafficLights} />
                    <RL trafficLights={trafficLights} />

                    {/* Машины */}
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

                {/* ПАНЕЛИ ДОБАВЛЕНИЯ МАШИН */}
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
                            className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] bg-blue-500 font-semibold text-white ${isAnimationStarted
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
                            {isAiMode ? 'YOQ' : 'O‘CHIR'}
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
            </div>
        </div>
    );
}
