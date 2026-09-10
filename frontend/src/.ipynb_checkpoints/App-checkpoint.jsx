import { NavLink, Route, Routes } from "react-router-dom";
import LiveAttendance from "./pages/LiveAttendance.jsx";
import Register from "./pages/Register.jsx";
import Reports from "./pages/Reports.jsx";

export default function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <span className="brand">Attendance Dashboard</span>
        <div className="links">
          <NavLink to="/" end>Live Attendance</NavLink>
          <NavLink to="/register">Register</NavLink>
          <NavLink to="/reports">Reports</NavLink>
        </div>
      </nav>
      <main className="content">
        <Routes>
          <Route path="/" element={<LiveAttendance />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  );
}
