import Dashboard from "../Components/Admin/Dashboard";
import ProfilePage from "../Components/Admin/Profile/Pofile";
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
    {
        name:"profile",
        path:"profile",
        component:<ProfilePage/>
    }
]