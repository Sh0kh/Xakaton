import { $api } from "../api/axios";

class Fines {
    // Get
    static GetAllFines = async () => {
        const response = await $api.get(`fine`);
        return response;
    }
    // Create 
    static CreateAccidents = async (Data) => {
        const response = await $api.post(`accident/create`, Data)
        return response;
    }
    // Edit
    static EditAccidents = async (Data) => {
        const response = await $api.put(`accident/update/${Data?.id}`, Data)
        return response
    }
    // Delete 
    static DeleteAccidents = async (id) => {
        const response = await $api.delete(`accident/delete/${id}`)
        return response;
    }
}

export { Fines}