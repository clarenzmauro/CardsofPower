import React from "react";
import PropTypes from "prop-types";

const TradePageContext = ({
  cardToGive,
  cardToGet,
  tradeGiverName,
  onTrade,
}) => {
  return (
    <section className="w-2/12 p-2 mb-4">
      {cardToGive && (
        <img src={cardToGive.cardGiveUrl} alt={cardToGive.cardGiveName} />
      )}

      <button
        className="w-full text-center py-1 my-2 bg-white text-black rounded-lg mt-2"
        onClick={onTrade}
      >
        Trade
      </button>

      {cardToGet && (
        <img src={cardToGet.cardReceiveUrl} alt={cardToGet.cardReceiveName} />
      )}

      {tradeGiverName && (
        <p className="text-center">Listed by: {tradeGiverName}</p>
      )}
    </section>
  );
};

// Define PropTypes for props validation
TradePageContext.propTypes = {
  cardToGive: PropTypes.shape({
    cardGiveId: PropTypes.string.isRequired,
    cardGiveName: PropTypes.string.isRequired,
    cardGiveUrl: PropTypes.string.isRequired,
  }).isRequired,
  cardToGet: PropTypes.shape({
    cardReceiveId: PropTypes.string.isRequired,
    cardReceiveName: PropTypes.string.isRequired,
    cardReceiveUrl: PropTypes.string.isRequired,
  }).isRequired,
  tradeGiverName: PropTypes.string.isRequired,
  onTrade: PropTypes.func.isRequired, // Function prop to handle the trade action
};

export default TradePageContext;
