import React from 'react';
import { Link } from 'react-router-dom';

import './HomePage.css'

function HomePage() {
  return (
    <main id='home' className='pirata-font text-center'>
      <div className="overlay"></div>

      <div className='banners'>
        <Link to="/battlefield"><img src="src/assets/images/ai.png" alt="" /></Link>
        <Link to="/battlefield"><img src="src/assets/images/battle.png" alt="" /></Link>
        <Link to="/shop"><img src="src/assets/images/shop.png" alt="" /></Link>
      </div>

      <div className='links text-white text-xl'>
        <div className='sm:mx-6 lg:mx-12'>
          <Link to="/inventory">
            <img src="src/assets/images/inventory.png" alt="" />
            <p>Inventory</p>
          </Link>
        </div>

        <div className='sm:mx-6 lg:mx-12'>
          <Link to="/dictionary">
            <img src="src/assets/images/dictionary.png" alt="" />
            <p>Dictionary</p>
          </Link>
        </div>

        <div className='sm:mx-6 lg:mx-12'>
          <Link to="/workshop">
            <img src="src/assets/images/workshop.png" alt="" />
            <p>Workshop</p>
          </Link>
        </div>

        <div className='sm:mx-6 lg:mx-12'>
          <Link to="/friends">
            <img src="src/assets/images/friends.png" alt="" />
            <p>Friends</p>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default HomePage;