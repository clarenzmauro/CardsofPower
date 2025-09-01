import React from "react";

const TradePageContext = ({ width = "w-2/12", padding = "p-2" }) => {
  // Mock data for preview
  const cardToGive = {
    cardGiveUrl: "https://placehold.co/150x200?text=Fire+Dragon",
    cardGiveName: "Fire Dragon",
  };

  const cardToGet = {
    cardReceiveUrl: "https://placehold.co/150x200?text=Water+Phoenix",
    cardReceiveName: "Water Phoenix",
  };

  const tradeGiverName = "PlayerOne";

  return (
    <section className={`${width} ${padding} mb-4`}>
      <img src={cardToGive.cardGiveUrl} alt={cardToGive.cardGiveName} />

      <button
        className="w-full text-center py-1 my-2 bg-white text-black rounded-lg mt-2"
        onClick={() => alert("Mock trade triggered")}
      >
        Trade
      </button>

      <img src={cardToGet.cardReceiveUrl} alt={cardToGet.cardReceiveName} />

      <p className="text-center">Listed by: {tradeGiverName}</p>
    </section>
  );
};

export default TradePageContext;
