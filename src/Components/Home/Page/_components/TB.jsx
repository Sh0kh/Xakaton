export default function TB({ trafficLights = [] }) {
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

    const topLight = trafficLights.find(light => light.id === 1);
    const bottomLight = trafficLights.find(light => light.id === 2);

    const topState = getTrafficLightState(topLight);
    const bottomState = getTrafficLightState(bottomLight);

    return (
        <div className="absolute top-0 bottom-0 left-1/2 w-[300px] -translate-x-1/2 bg-gray-700">
            <div className="w-full h-full relative flex items-start">
                {/* Вертикальные полосы движения */}
                <div className="h-full w-full border-r border-gray-600/50"></div>
                <div className="h-full w-full border-r border-gray-600/50"></div>
                <div className="h-full w-full border-r border-gray-600/50"></div>
                <div className="h-full w-full"></div>

                {/* Разметка и светофоры */}
                <div>
                    <div
                        className="absolute top-0 left-[80px] w-[3px] h-[18%]"
                        style={{
                            backgroundImage: "repeating-linear-gradient(to bottom, white 0 20px, transparent 20px 50px)"
                        }}
                    ></div>
                    <div
                        className="absolute top-0 right-[80px] w-[3px] h-[18%]"
                        style={{
                            backgroundImage: "repeating-linear-gradient(to bottom, white 0 20px, transparent 20px 50px)"
                        }}
                    ></div>
                    <div
                        className="absolute right-0 top-[21%] w-[295px] h-[45px]"
                        style={{
                            backgroundImage: "repeating-linear-gradient(to right, white 0 10px, transparent 10px 20px)"
                        }}
                    ></div>
                    <div className="absolute top-[0px] left-[145px] h-[17%] flex items-start gap-[10px]">
                        <div className="bg-[white] h-[100%] w-[3px]"></div>
                        <div className="bg-[white] h-[100%] w-[3px]"></div>
                    </div>

                    {/* Светофор сверху */}
                    <div className="absolute top-[10%] right-[0]  w-[350px] flex items-end justify-center ">
                        <div className="w-[35px] h-[70px] bg-[black] flex items-center rounded-[5px] justify-center gap-[5px] flex-col py-[5px] px-[8px] border-2 border-gray-400 shadow-lg">
                            <div className={`w-4 h-4 rounded-full ${topState.top === 'red' ? 'bg-red-500 animate-pulse shadow-lg' : 'bg-gray-600'}`}></div>
                            <div className={`w-4 h-4 rounded-full ${topState.middle === 'yellow' ? 'bg-yellow-400 animate-pulse shadow-lg' : 'bg-gray-600'}`}></div>
                            <div className={`w-4 h-4 rounded-full ${topState.bottom === 'green' ? 'bg-green-500 animate-pulse shadow-lg' : 'bg-gray-600'}`}></div>
                        </div>
                        <div className="h-[5px]  w-[100%] bg-[#272727]"></div>
                    </div>
                </div>
                <div>
                    <div
                        className="absolute right-0 bottom-[21%] w-[295px] h-[45px]"
                        style={{
                            backgroundImage: "repeating-linear-gradient(to right, white 0 10px, transparent 10px 20px)"
                        }}
                    ></div>
                    <div className="absolute bottom-[0px] h-[18%] left-[145px] flex items-start gap-[10px]">
                        <div className="bg-[white] h-[100%] w-[3px]"></div>
                        <div className="bg-[white] h-[100%] w-[3px]"></div>
                    </div>
                    <div
                        className="absolute bottom-0 right-[80px] w-[3px] h-[18%]"
                        style={{
                            backgroundImage: "repeating-linear-gradient(to bottom, white 0 20px, transparent 20px 50px)"
                        }}
                    ></div>
                    <div
                        className="absolute bottom-0 left-[80px] w-[3px] h-[18%]"
                        style={{
                            backgroundImage: "repeating-linear-gradient(to bottom, white 0 20px, transparent 20px 50px)"
                        }}
                    ></div>

                    {/* Светофор снизу */}
                    <div className="absolute bottom-[11%] left-[0]  w-[350px] flex items-start justify-center ">
                        <div className="h-[5px]  w-[100%] bg-[#272727]"></div>
                        <div className="w-[35px] h-[70px] bg-[black] flex items-center rounded-[5px] justify-center gap-[5px] flex-col py-[5px] px-[8px] border-2 border-gray-400 shadow-lg">
                            <div className={`w-4 h-4 rounded-full ${bottomState.top === 'red' ? 'bg-red-500 animate-pulse shadow-lg' : 'bg-gray-600'}`}></div>
                            <div className={`w-4 h-4 rounded-full ${bottomState.middle === 'yellow' ? 'bg-yellow-400 animate-pulse shadow-lg' : 'bg-gray-600'}`}></div>
                            <div className={`w-4 h-4 rounded-full ${bottomState.bottom === 'green' ? 'bg-green-500 animate-pulse shadow-lg' : 'bg-gray-600'}`}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}