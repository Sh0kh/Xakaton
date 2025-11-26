import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import { Rout } from "./Routes/Routes";
import AdminLayout from "./layouts/AdminLayout";
import Login from "./Components/Other/Login/Login";
import ErrorPage from "./Components/Other/ErrorPage/ErrorPage";
import { HomeRoutes } from "./Routes/HomeRoutes";
import HomeLayout from "./layouts/HomeLayout";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route path="/login" element={<Login />} />
          <Route element={<AdminLayout />}>
            {Rout.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={route.component}
              />
            ))}
          </Route>
          <Route element={<HomeLayout />}>
            {HomeRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={route.component}
              />
            ))}
          </Route>
          <Route path="*" element={<ErrorPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
export default App;
