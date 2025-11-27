import Dashboard from "../Components/Admin/Dashboard";
import PowerAlertsPage from "../Components/Admin/PowerLight/PowerLight";
import ProfilePage from "../Components/Admin/Profile/Pofile";
import RedEvents from "../Components/Admin/RedEvents/RedEvents";
import ViolationsGrid from "../Components/Admin/Violations/Violations";

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
    },
    {
        name:"violations",
        path:"fines",
        component:<ViolationsGrid/>
    },
    {
        name:"power",
        path:"powers",
        component:<PowerAlertsPage/>
    }
]