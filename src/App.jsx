import Battlefield from "./components/Battlefield/Battlefield.jsx";
import LoginPage from "./components/LoginPage.jsx";
import HomePage from "./components/HomePage.jsx";
import InventoryPage from "./components/InventoryPage.jsx";
import DictionaryPage from "./components/DictionaryPage.jsx";
import ListingPage from "./components/ListingPage.jsx";
import ShopPage from "./components/ShopPage.jsx";
import { CardsContext, CardsProvider } from "./components/Battlefield/CardsContext.jsx";
import './index.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {
  return (
    <CardsProvider>
      <Router>
      <Routes>
        {/* Only use for actual implementation */ }

        <Route path="/:userDocId/battlefield" element={<Battlefield />}/>
        <Route path="/" element={<LoginPage />}/> 
        <Route path="/:userDocId/home" element={<HomePage />}/> 
        <Route path="/:userDocId/inventory" element={<InventoryPage />}/>
        <Route path="/:userDocId/dictionary" element={<DictionaryPage />}/>
        <Route path="/:userDocId/shop/listing" element={<ListingPage />}/>
        <Route path="/:userDocId/shop" element={<ShopPage />}/>
        {/* Only use for testing implementation */}
        {/* <Route path="/" element={<Battlefield />}/> */}
      </Routes>
    </Router>
    </CardsProvider>
  );
}

export default App;
