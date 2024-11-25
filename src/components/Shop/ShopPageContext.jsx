import React from "react";
import PropTypes from "prop-types"; // Import PropTypes

// The ShopPageContext component is receiving props and displaying them
const ShopPageContext = ({ asset, sellerName, buttonText, onButtonClick }) => {
  return (
    <>
      <img src={asset.imageUrl} alt={asset.cardName} />
      <h2>{asset.cardName}</h2>
      <p>Seller: {sellerName}</p>
      <button className="w-full text-center py-1 bg-white text-black rounded-lg mt-2" onClick={onButtonClick}>{buttonText}</button>
    </>
  );
};

// Define prop types for validation
ShopPageContext.propTypes = {
  asset: PropTypes.shape({
    imageUrl: PropTypes.string.isRequired, // imageUrl should be a string and is required
    cardName: PropTypes.string.isRequired, // cardName should be a string and is required
  }).isRequired,
  sellerName: PropTypes.string.isRequired, // sellerName should be a string and is required
  buttonText: PropTypes.string.isRequired, // buttonText should be a string and is required
  onButtonClick: PropTypes.func.isRequired, // onButtonClick should be a function and is required
};

export default ShopPageContext;
