"use client";

import React from "react";

interface ShopPageContextProps {
  asset: {
    imageUrl: string;
    cardName: string;
  };
  sellerName: string;
  buttonText: string;
  onButtonClick: () => void;
}

const ShopPageContext: React.FC<ShopPageContextProps> = ({
  asset,
  sellerName,
  buttonText,
  onButtonClick,
}) => {
  return (
    <div className="card bg-white text-black rounded-lg p-4 shadow-md">
      <img
        src={asset.imageUrl}
        alt={asset.cardName}
        className="w-full h-40 object-cover rounded-md"
      />
      <h3 className="mt-2 font-bold">{asset.cardName}</h3>
      <p className="text-sm text-gray-600">Seller: {sellerName}</p>
      <button
        onClick={onButtonClick}
        className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
      >
        {buttonText}
      </button>
    </div>
  );
};

export default ShopPageContext;
