import { $api } from "../Headers"

class Categorys {
    // Get
    static GetAllCategory = async () => {
        const response = await $api.get(`/category/get/all/parent`);
        return response;
    }
    // Create 
    static CreateCategory = async (Data) => {
        const response = await $api.post(`/category/create`, Data)
        return response;
    }
    // Edit
    static EditCategory = async (Data) => {
        const response = await $api.put(`/category/update/${Data?.id}`, Data)
        return response
    }
    // Delete 
    static DeleteCategory = async (id) => {
        const response = await $api.delete(`/category/delete/${id}`)
        return response;
    }
}

export { Categorys }