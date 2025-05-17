import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import SeatAllotment from "./pages/SeatAllotment";
import { AdminLogin } from "./pages/auth/adminlogin";
import { RunAllocation } from "./pages/admin/adminAllocation";

function App() {
  return (
    <Router>
      <Routes>
        {/* Student routes */}
        <Route path="/" element={<Login />} />
        <Route path="/allotment" element={<SeatAllotment />} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/allocate" element={<RunAllocation />} />
      </Routes>
    </Router>
  );
}

export default App;
