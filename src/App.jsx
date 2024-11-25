import LoadingPage from "./components/LoadingPage.jsx";
import LoginPage from "./components/LoginPage.jsx";
import Showcase from "./components/Showcase.jsx";
import HomePage from "./components/HomePage.jsx";
import Workshop from "./components/Workshop.jsx";
import Battlefield from "./components/Battlefield/Battlefield.jsx";
import ShopPage from "./components/ShopPage.jsx";
import TradePage from "./components/TradePage.jsx";
import ListingPage from "./components/ListingPage.jsx";
import InventoryPage from "./components/InventoryPage.jsx";
import DictionaryPage from "./components/DictionaryPage.jsx";
import AccountPage from "./components/AccountPage.jsx";
import { CardsContext, CardsProvider } from "./components/Battlefield/CardsContext.jsx";
import './index.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useEffect } from "react";

function App() {
  useEffect(() =>{
    document.title = "Cards of Power";
  }, []);
  return (
    <CardsProvider>
      <Router>
      <Routes>
        {/* Only use for actual implementation */ }

        <Route path="/:userDocId/battlefield" element={<Battlefield />}/>
        <Route path="/" element={<LoadingPage />}/>
        <Route path="/login" element={<LoginPage />}/> 
        <Route path="/:userDocId/home" element={<HomePage />}/> 
        <Route path="/:userDocId/inventory" element={<InventoryPage />}/>
        <Route path="/:userDocId/dictionary" element={<DictionaryPage />}/>
        <Route path="/:userDocId/shop/listing" element={<ListingPage />}/>
        <Route path="/:userDocId/shop" element={<ShopPage />}/>
        <Route path="/:userDocId/shop/trades" element={<TradePage />}/> 
        <Route path="/:userDocId/workshop" element={<Workshop />}/>
        <Route path="/:userDocId/showcase" element={<Showcase />} />
        <Route path="/:userDocId/account" element={<AccountPage />} />
        {/* Only use for testing implementation */}
        {/* <Route path="/" element={<Battlefield />}/> */}
      </Routes>
    </Router>
    </CardsProvider>
  );
}

export default App;
