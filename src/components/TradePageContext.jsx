import React from 'react';
import PropTypes from 'prop-types';

const TradePageContext = ({ cardToGive, cardToGet, tradeGiverName, onTrade }) => {
  return (
    <div style={styles.container}>
      {/* Card to Give */}
      <div style={styles.box} id="card-to-give">
        {cardToGive && (
          <>
            <img
              src={cardToGive.cardGiveUrl}
              alt={cardToGive.cardGiveName}
              style={styles.cardImage}
            />
            <p style={styles.cardDetails}>{cardToGive.cardGiveName}</p>
          </>
        )}
      </div>

      {/* Arrow (Button) */}
      <div style={styles.arrowContainer}>
        <button style={styles.arrow} onClick={onTrade}>
          Trade
        </button>
      </div>

      {/* Card to Get */}
      <div style={styles.box} id="card-to-get">
        {cardToGet && (
          <>
            <img
              src={cardToGet.cardReceiveUrl}
              alt={cardToGet.cardReceiveName}
              style={styles.cardImage}
            />
            <p style={styles.cardDetails}>{cardToGet.cardReceiveName}</p>
          </>
        )}
      </div>

      {/* Trade Giver Name */}
      {tradeGiverName && <p style={styles.tradeGiverName}>Listed by: {tradeGiverName}</p>}
    </div>
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

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f0f0f0',
  },
  box: {
    width: '350px',
    height: '500px',
    backgroundColor: '#000',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '10px',
    borderRadius: '8px',
    color: '#fff',
  },
  cardImage: {
    width: '80%',
    height: '70%',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  cardDetails: {
    marginTop: '10px',
    fontSize: '18px',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  arrowContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '10px 0',
  },
  arrow: {
    width: '150px',
    height: '50px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '25px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  tradeGiverName: {
    marginTop: '20px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
  },
};

export default TradePageContext;
