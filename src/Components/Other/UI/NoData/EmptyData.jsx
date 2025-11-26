import { Typography } from "@material-tailwind/react";
import { Inbox } from "lucide-react";

export default function EmptyData({ text }) {
    return (
        <div className="w-full flex flex-col items-center justify-center py-20">
            <div className="flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-sm mb-6">
                <Inbox className="w-12 h-12 text-blue-500" />
            </div>
            <Typography variant="h5" color="blue-gray" className="mb-2">
                {text}
            </Typography>
            <Typography className="text-gray-500 text-center max-w-md">
                Bu yerda hozircha hech qanday ma’lumot yo‘q.
                Yangi yozuv qo‘shib ko‘ring yoki keyinroq qaytib keling.
            </Typography>
        </div>
    );
}
