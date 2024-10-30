import Battlefield from "./components/Battlefield";
import HomePage from "./components/HomePage";
import InventoryPage from "./components/InventoryPage";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/battlefield" element={<Battlefield />}/>
        <Route path="/inventory" element={<InventoryPage />}/>
        <Route path="/login" element={<LoginPage />}/>
        <Route path="/signup" element={<SignupPage />}/>
        <Route path="/" element={<HomePage />}/>
      </Routes>
    </Router>
  );
}

export default App;
