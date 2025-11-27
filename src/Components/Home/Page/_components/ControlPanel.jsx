// app/_components/ControlPanel.jsx
const lanes = [
    { id: 'top-right', label: 'Верхняя правая', direction: 'horizontal' },
    { id: 'top-left', label: 'Верхняя левая', direction: 'horizontal' },
    { id: 'bottom-right', label: 'Нижняя правая', direction: 'horizontal' },
    { id: 'bottom-left', label: 'Нижняя левая', direction: 'horizontal' },
    { id: 'right-top', label: 'Правая верхняя', direction: 'vertical' },
    { id: 'right-bottom', label: 'Правая нижняя', direction: 'vertical' },
    { id: 'left-top', label: 'Левая верхняя', direction: 'vertical' },
    { id: 'left-bottom', label: 'Левая нижняя', direction: 'vertical' },
];

export default function ControlPanel({
    selectedLane,
    onLaneChange,
    onAddCar,
    onStartAnimation,
    onReset,
    animationStarted,
    carCount
}) {
    const selectedLaneData = lanes.find(lane => lane.id === selectedLane);

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-white text-lg font-semibold mb-3">Выберите полосу:</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {lanes.map(lane => (
                            <button
                                key={lane.id}
                                onClick={() => onLaneChange(lane.id)}
                                className={`p-2 rounded text-sm ${selectedLane === lane.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                                    }`}
                            >
                                {lane.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-white text-lg font-semibold mb-3">Управление:</h3>
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <button
                                onClick={() => selectedLaneData && onAddCar(selectedLaneData.direction)}
                                disabled={animationStarted}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white p-2 rounded"
                            >
                                Добавить машину
                            </button>

                            <button
                                onClick={onStartAnimation}
                                disabled={animationStarted || carCount === 0}
                                className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white p-2 rounded"
                            >
                                Начать анимацию
                            </button>
                        </div>

                        <button
                            onClick={onReset}
                            className="w-full bg-red-600 hover:bg-red-700 text-white p-2 rounded"
                        >
                            Сбросить
                        </button>
                    </div>

                    <div className="mt-3 text-white">
                        <p>Машин добавлено: {carCount}</p>
                        <p>Статус: {animationStarted ? 'Анимация запущена' : 'Готов к запуску'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}