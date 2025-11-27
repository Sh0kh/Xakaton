import { Button } from "@material-tailwind/react";
import { $api } from "../../../../utils/api/axios";
import { Alert } from "../../../../utils/Alert";
import { useState } from "react";

export default function Accet() {

    const [loading, setLoading] = useState(false);

    const PostAcc = async () => {
        setLoading(true);
        try {
            await $api.post(`/accident`, { status: true });
            Alert('Jonatildi', "success");
        } catch (error) {
            console.log(error);
            Alert('Xatolik', "error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Button
                onClick={PostAcc}
                disabled={loading}
            >
                {loading ? "Jonatilmoqda..." : "Avariya"}
            </Button>
        </>
    )
}
