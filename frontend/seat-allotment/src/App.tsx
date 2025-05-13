import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import SeatAllotment from "./SeatAllotment";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/allotment" element={<SeatAllotment />} />
      </Routes>
    </Router>
  );
}

export default App;
