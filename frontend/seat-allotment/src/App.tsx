import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import SeatAllotment from "./SeatAllotment";
import { AdminLogin } from "./adminlogin";
import { RunAllocation } from "./adminAllocation";

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
