import Dashboard from "../Components/Admin/Dashboard";
import RedEvents from "../Components/Admin/RedEvents/RedEvents";

export const Rout = [
    {
        name: 'Home',
        path: 'dashboard',
        component: <Dashboard />
    },
    {
        name:"redevents",
        path:"redevents",
        component:<RedEvents/>
    },
]