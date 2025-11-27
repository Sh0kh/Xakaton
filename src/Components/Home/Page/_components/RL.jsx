export default function RL({ trafficLights = [] }) {
    const getTrafficLightState = (light) => {
        if (!light) return { top: 'gray', middle: 'gray', bottom: 'gray' };

        switch (light.color) {
            case 'red':
                return { top: 'red', middle: 'gray', bottom: 'gray' };
            case 'red-yellow':
                return { top: 'red', middle: 'yellow', bottom: 'gray' };
            case 'yellow':
                return { top: 'gray', middle: 'yellow', bottom: 'gray' };
            case 'green':
                return { top: 'gray', middle: 'gray', bottom: 'green' };
            default:
                return { top: 'gray', middle: 'gray', bottom: 'gray' };
        }
    };

    const leftLight = trafficLights.find(light => light.id === 3);
    const rightLight = trafficLights.find(light => light.id === 4);

    const leftState = getTrafficLightState(leftLight);
    const rightState = getTrafficLightState(rightLight);

    return (
        <div className="absolute left-[30px] right-[30px] top-[50%] h-[300px] -translate-y-1/2 bg-gray-700">
            <div className="w-full h-full relative flex items-start flex-col">
                {/* Горизонтальные полосы движения */}
                <div className="h-full w-full border-b border-gray-600/50"></div>
                <div className="h-full w-full border-b border-gray-600/50"></div>
                <div className="h-full w-full border-b border-gray-600/50"></div>
                <div className="h-full w-full"></div>

                {/* Разметка и светофоры */}
                <div>
                    <div
                        className="absolute left-0 top-[80px] w-[32%] h-[3px]"
                        style={{
                            backgroundImage: "repeating-linear-gradient(to right, white 0 30px, transparent 30px 60px)"
                        }}
                    ></div>
                    <div
                        className="absolute left-0 bottom-[80px] w-[32%] h-[3px]"
                        style={{
                            backgroundImage: "repeating-linear-gradient(to right, white 0 40px, transparent 40px 80px)"
                        }}
                    ></div>

                    <div
                        className="absolute left-[35%] top-[5px] h-[300px] w-[45px]"
                        style={{
                            backgroundImage: "repeating-linear-gradient(to bottom, white 0 10px, transparent 10px 20px)"
                        }}
                    ></div>
                    <div className="absolute left-[0px] top-[145px] w-[32%] flex items-center flex-col gap-[10px]">
                        <div className="bg-[white] w-[100%] h-[3px]"></div>
                        <div className="bg-[white] w-[100%] h-[3px]"></div>
                    </div>

                    {/* Светофор слева */}
                    <div className="absolute left-[32%] top-[0] h-[380px] w-[45px] flex items-center justify-center flex-col">
                        <div className="w-[5px]  h-[100%] bg-[#272727]"></div>
                        <div className="w-[35px] h-[80px] bg-[black] flex items-center rounded-[5px] justify-center gap-[5px] flex-col py-[5px] px-[8px] border-2 border-gray-400 shadow-lg">
                            <div className={`w-4 h-4 rounded-full ${leftState.top === 'red' ? 'bg-red-500 animate-pulse shadow-lg' : 'bg-gray-600'}`}></div>
                            <div className={`w-4 h-4 rounded-full ${leftState.middle === 'yellow' ? 'bg-yellow-400 animate-pulse shadow-lg' : 'bg-gray-600'}`}></div>
                            <div className={`w-4 h-4 rounded-full ${leftState.bottom === 'green' ? 'bg-green-500 animate-pulse shadow-lg' : 'bg-gray-600'}`}></div>
                        </div>
                    </div>
                </div>
                <div>
                    <div
                        className="absolute right-0 top-[80px] w-[33%] h-[3px]"
                        style={{
                            backgroundImage: "repeating-linear-gradient(to right, white 0 40px, transparent 40px 80px)"
                        }}
                    ></div>

                    <div className="absolute right-[0px] top-[145px] w-[33%] flex items-center flex-col gap-[10px]">
                        <div className="bg-[white] w-[100%] h-[3px]"></div>
                        <div className="bg-[white] w-[100%] h-[3px]"></div>
                    </div>
                    <div
                        className="absolute right-[35%] top-[5px] h-[290px] w-[45px]"
                        style={{
                            backgroundImage: "repeating-linear-gradient(to bottom, white 0 10px, transparent 10px 20px)"
                        }}
                    ></div>
                    <div
                        className="absolute right-0 bottom-[80px] w-[33%] h-[3px]"
                        style={{
                            backgroundImage: "repeating-linear-gradient(to right, white 0 40px, transparent 40px 80px)"
                        }}
                    ></div>

                    {/* Светофор справа */}
                    <div className="absolute right-[32%] bottom-[0] h-[380px] w-[45px] flex items-center justify-center flex-col">
                        <div className="w-[35px] h-[80px] bg-[black] flex items-center rounded-[5px] justify-center gap-[5px] flex-col py-[5px] px-[8px] border-2 border-gray-400 shadow-lg">
                            <div className={`w-4 h-4 rounded-full ${rightState.top === 'red' ? 'bg-red-500 animate-pulse shadow-lg' : 'bg-gray-600'}`}></div>
                            <div className={`w-4 h-4 rounded-full ${rightState.middle === 'yellow' ? 'bg-yellow-400 animate-pulse shadow-lg' : 'bg-gray-600'}`}></div>
                            <div className={`w-4 h-4 rounded-full ${rightState.bottom === 'green' ? 'bg-green-500 animate-pulse shadow-lg' : 'bg-gray-600'}`}></div>
                        </div>
                        <div className="w-[5px]  h-[100%] bg-[#272727]"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}