import React from "react";
import { Link, useParams } from "react-router-dom";
import accountImage from "../assets/images/account.png";
import battleImage from "../assets/images/battle.png";
import shopImage from "../assets/images/shop.png";
import inventoryImage from "../assets/images/inventory.png";
import dictionaryImage from "../assets/images/dictionary.png";
import workshopImage from "../assets/images/workshop.png";
import friendsImage from "../assets/images/friends.png";
import loginBackground from "../assets/backgrounds/login.jpg";
import "./HomePage.css";

function HomePage() {
  const { userDocId } = useParams();
  return (
    <main
      id="home"
      className="text-center"
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      <div className="overlay"></div>

      <div className="banners">
        <Link to={`/${userDocId}/workshop`}>
          <img src={workshopImage} alt="" />
        </Link>
        <Link to={`/${userDocId}/battlefield`}>
          <img src={battleImage} alt="" />
        </Link>
        <Link to={`/${userDocId}/shop`}>
          <img src={shopImage} alt="" />
        </Link>
      </div>

      <div className="links text-white text-xl">
        <div className="sm:mx-6 lg:mx-12">
          <Link to={`/${userDocId}/inventory`}>
            <img src={inventoryImage} alt="" />
            <p>Inventory</p>
          </Link>
        </div>

        <div className="sm:mx-6 lg:mx-12">
          <Link to={`/${userDocId}/dictionary`}>
            <img src={dictionaryImage} alt="" />
            <p>Dictionary</p>
          </Link>
        </div>

        <div className="sm:mx-6 lg:mx-12">
          <Link to={`/${userDocId}/friends`}>
            <img src={friendsImage} alt="" />
            <p>Friends</p>
          </Link>
        </div>

        <div className="sm:mx-6 lg:mx-12">
          <Link to={`/${userDocId}/account`}>
            <img src={accountImage} alt="" />
            <p>Account</p>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default HomePage;
