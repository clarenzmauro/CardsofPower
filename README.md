# 🎴 **Cards of Power**  
**_"What dwells in the cards, only the Powerful can find."_**

---

## 📖 **Overview**

**Cards of Power** is a turn-based trading card game that revolutionizes strategy and trading. With over 100+ unique cards, each equipped with custom mechanics, players can craft their playstyle to dominate the battlefield. Featuring non-fungible cards with unique IDs, every card gains a real-world and in-game market value, fostering a dynamic trading ecosystem.  

The game also integrates **data visualization** to help players improve their strategies and allows users to submit custom card ideas via the **Workshop station** for approval by developers.

Whether you’re battling opponents, investing in your card deck, or strategizing with stats, **Cards of Power** delivers a thrilling and competitive gaming experience.

---

## ✨ **Features**

- **Login/Signup Page**  
- **Card Showcasing Page**  
- **Inventory and Dictionary**  
- **Online Battle**  
- **Shop, Trades, and Listing**  
- **Workshop** (create your own cards)  
- **Friends Messaging and Gifting**  
- **Player In-Game Data Visualization**  
- **Non-Fungible Trading Cards**

---

## 🛠️ **Technologies Used**

| **Category**       | **Technology**       |
|--------------------|---------------------|
| **Frontend**        | React, HTML, CSS    |
| **Styling**         | Tailwind CSS        |
| **APIs**            | Firebase Database   |
| **Libraries**       | React Router, Toastify, Recharts |

---

## 🚀 **Installation and Setup**

1. Clone the repository:  
   ```bash
   git clone <repository-url>
   ```
2. Install dependencies:
  ```bash
  npm install
  npm install react-router-dom toastify prop-types recharts
  ```
3. Run the development server:
   ```bash
   npm run dev
   ```
---

## 🎮 How To Play

### ➡️ **Preparation Stage**
1. Create a Room and wait for someone to join, or join an existing room created by other players.
2. Each player has **5 slots** available for **Monster** and **Trap Cards**.
3. You can place **Monster Cards** in **Defense Position** during this stage.
4. Once satisfied, click the **Ready** button.
5. When all players are ready, the **Battle Stage** will begin.

---

### ⚔️ **Battle Stage**
1. The **room creator** makes the first move.
2. A Battle Stage has **10 rounds**, with each player getting **5 turns**.
3. Each player has a **time limit** to make their move during their turn.
4. Players can:
   - **Attack** using a Monster Card.
   - **Use a Card's Effect** (if applicable).

#### 🛡️ **To Attack with a Monster Card**
1. Click a **Monster Card** on your slot.
2. Press **Use Attack**.
3. Click an **opponent's Monster Card** to target it.

#### ✨ **To Use a Card's Effect**
1. Click a **Card**.
2. If the **Use Effect** option appears, click it.

---

### ☠️ **Battle Mechanics**
- If a card is destroyed, it goes to the **Graveyard**.
- If a card is destroyed, it damages the player’s HP with the formula:  
  **`(Card Level * 200) - Player's Current HP`**.

---

### 🏆 **Winning Conditions**
1. If there are no more cards available to be played.
2. If a player's HP reaches **0 or below**.
3. The defeated player will choose a card to give to the winner.

*Note: If neither winning condition is met, the game will loop back to the **Preparation Stage** and continue.*

---

### 🧠 **Game Balance Tips**
1. **Trap Cards** and **Spell Cards** can **turn the tide** of battle—use them wisely.
2. High-level cards are powerful but come with **higher risks** if destroyed.
3. A well-thought-out strategy can outperform a deck of high-level cards without proper planning.

---

## 🃏 How To List Your Card

1. Go to the **Shop** section.
2. Navigate to the **Listing** tab.
3. Choose whether to **Sell** a card or **Trade** a card for another.
4. Follow the on-screen instructions to finalize your listing.

---

## 🛠️ How To Create Your Own Card

1. Go to the **Workshop** section.
2. Fill out the required fields, including:
   - Card Name
   - Card Type (Monster, Spell, Trap)
   - Card Description
   - Attack and Defense Values (if applicable)
3. Submit the application.
4. Wait for the developers' response via email.

---

## 🤝 Contribution Guidelines

We welcome contributions to make **Cards of Power** even better!  
Please notify and communicate with one of the developers before contributing.

### 📌 Areas to Contribute
1. Enhance the **User Interface** for better aesthetics and usability.
2. Develop the **Backend** for the remaining cards and features.

### 🛠️ Steps to Contribute
1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Play and experience the game to understand its flow and mechanics.
3. Contact one of the develoeprs listed below.
4. Collaborate with team to integrate your improvements.

---

## 👨‍💻 Developers

| **Name**                 | **Role**                           | **Contact**                      |
|--------------------------|-------------------------------------|-----------------------------------|
| Mann Lester Magbuhos     | Full-Stack Developer & Project Manager | [Email](mailto:mannlesterm@gmail.com) |
| Jett Mark Manalo         | Frontend Developer                 | [Email](mailto:)                 |
| Clarenz Mauro            | Backend Developer                  | [Email](mailto:)                 |
| Vince Jericho Abella     | Backend Developer                  | [Email](mailto:)                 |

---

