import React, { useState } from 'react';

import './Battlefield.css';

import backCard from '../assets/cards/back-card.png';
import graveyardCard from '../assets/cards/graveyard.png';
import blankCard from '../assets/cards/blank.png';
import leftBtn from '../assets/others/leftBtn.png';
import rightBtn from '../assets/others/rightBtn.png';
import heartIcon from '../assets/others/heart.png';
import cardsIcon from '../assets/others/card.png';
import boneIcon from '../assets/others/bone.png';

// delete imports, get from firebase
import card1 from '../assets/cards/Divine/AethersWrath.png';
import card2 from '../assets/cards/Divine/BaneOfExistence.png';
import card3 from '../assets/cards/Divine/CelestialOutcast.png';
import card4 from '../assets/cards/Divine/CelestialZenith.png';
import card5 from '../assets/cards/Divine/ForgemasterOfCreation.png';

import card6 from '../assets/cards/Earth/EarthGolem.png';
import card7 from '../assets/cards/Earth/HeartOfTheMountain.png';
import card8 from '../assets/cards/Earth/IroncladDefender.png';
import card9 from '../assets/cards/Earth/SteelGuardian.png';
import card10 from '../assets/cards/Earth/StoneSentinel.png';

import card11 from '../assets/cards/Light/CrystalGuardian.png';
import card12 from '../assets/cards/Light/ElectricSabre.png';
import card13 from '../assets/cards/Light/LightbinderPaladin.png';
import card14 from '../assets/cards/Light/LunarWolf.png';
import card15 from '../assets/cards/Light/SolarGuardian.png';

const opponentCards = [blankCard, blankCard, blankCard, blankCard, blankCard];
const opponentDeck = [backCard, backCard, backCard, backCard, backCard, backCard];
const opponentGraveyard = [card2, card3, card5, card1, card2, card3, card5, card1, card2, card3, card5, card1, card2, card3, card5, card1];
const myCards = [blankCard, blankCard, blankCard, blankCard, blankCard];
const myDeck = [card6, card7, card8, card9, card10, card11, card12, card13, card14, card15];
const myGraveyard = [backCard, backCard, backCard, backCard, backCard];

// add logic
let lastCard = blankCard;
let turn = 1;

// let opponentHp = 5000;
// let myHp = 5000;

function Timer() {
    return(
        <div className="timer">
            <p>Turn {turn}</p>
            <p>30s</p>
        </div>
    );
}

function Utilities({ username, deck, graveyard }) {
    const [isGraveyardVisible, setIsGraveyardVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const cardsToShow = 6;

    const toggleGraveyard = () => {
        setIsGraveyardVisible(!isGraveyardVisible);
    };

    const handleNext = () => {
        if (currentIndex + cardsToShow < deck.length) {
            setCurrentIndex(currentIndex + cardsToShow);
        }
    };

    const handlePrevious = () => {
        if (currentIndex - cardsToShow >= 0) {
            setCurrentIndex(currentIndex - cardsToShow);
        }
    };

    let graveyardContent = null;
    if (isGraveyardVisible) {
        if (graveyard.length === 0) {
            graveyardContent = <p>Your graveyard is currently empty.</p>;
        } else {
            graveyardContent = (
                <div className='graveyardCards'>
                    {graveyard.map((card, index) => (
                        <img className='m-1' key={index} src={card} alt={`Graveyard Card ${index + 1}`} />
                    ))}
                </div>
            );
        }
    }

    const visibleCards = deck.slice(currentIndex, currentIndex + cardsToShow);
    const blankCardCount = Math.max(0, cardsToShow - visibleCards.length);

    return (
        <>
            {isGraveyardVisible && (
                <div className="graveyard">
                    <button className='float-end' onClick={toggleGraveyard}><img className='h-' src={boneIcon} alt="" /></button>
                    <h2 className='text-center text-5xl mb-6'>{username}'s Graveyard</h2>
                    {graveyardContent}
                </div>
            )}

            <div className="row">
                <img onClick={toggleGraveyard} src={graveyardCard} alt="" />

                <div className="carousel">
                    <button onClick={handlePrevious} className="me-2" disabled={currentIndex === 0}>
                        <img src={leftBtn} alt="Previous" />
                    </button>

                    <div className="deck">
                        {visibleCards.map((card, index) => (
                            <img key={index} src={card} alt={`Card ${currentIndex + index + 1}`} />
                        ))}
                        {Array.from({ length: blankCardCount }).map((_, index) => (
                            <img key={`blank-${index}`} src={blankCard} alt="Blank Card" />
                        ))}
                    </div>

                    <button onClick={handleNext} className="ms-2" disabled={currentIndex + cardsToShow >= deck.length}>
                        <img src={rightBtn} alt="Next" />
                    </button>
                </div>

                <div className="stats">
                    <p className='text-2xl'>{username}</p>
                    <p className='my-2'><img className='me-2' src={heartIcon} alt='' />HP: 5000</p>
                    <p><img className='me-2' src={cardsIcon} alt='' />Cards: 10</p>
                </div>
            </div>
        </>
    );
}


function CardSlots({ cards }) {
    return (
        <div className="card-slot my-4">
            {cards.map((card, index) => (
                <img key={index} src={card} alt={`Card ${index + 1}`} />
            ))}
        </div>
    );
}

function Battlefield() {
    return (
        <div className='background'>
            <Timer />
            <Utilities username={'player one'} deck={opponentDeck} graveyard={opponentGraveyard} />

            <div className='mid-row'>
                <div>
                    <CardSlots cards={opponentCards} />
                    <CardSlots cards={myCards} />
                </div>
                
                <img className='last-card' src={lastCard} alt="" />
            </div>

            <Utilities username={'player two'} deck={myDeck} graveyard={myGraveyard} />
        </div>
    );
}

export default Battlefield;