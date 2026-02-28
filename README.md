# Rematch Discord Rich Presence (Overwolf)

Add **Discord Rich Presence** support for **Rematch** so others can see what you’re doing in-game.

It updates live to show:

- **Lobby status** (waiting for a match)
- **In-match status** (score + winning/losing/drawing)
- A short activity update when a **goal is scored / conceded** (7 seconds)

> Tested on **Windows**.

---

## Preview (toggle for media)

<details>
  <summary><strong>Lobby</strong> — Presence shows “In the lobby” and “Waiting for a match...”</summary>
  <br />
  <img src="docs/assets/lobby.jpeg" alt="Rematch lobby rich presence" width="420" />
</details>

<details>
  <summary><strong>Goal scored</strong> — Temporary event moment shown when your team scores</summary>
  <br />
  <img src="docs/assets/goal-scored.gif" alt="Rematch rich presence when a goal is scored" width="420" />
</details>

<details>
  <summary><strong>Goal conceded</strong> — Temporary event moment shown when the opponent scores</summary>
  <br />
  <img src="docs/assets/goal-conceded.gif" alt="Rematch rich presence when a goal is conceded" width="420" />
</details>

<details>
  <summary><strong>In-match score</strong> — Live match state with score line (Winning / Losing / Drawing)</summary>
  <br />
  <img src="docs/assets/in-match.jpeg" alt="Rematch in-match rich presence (score state)" width="420" />
</details>

---

## Who is this for?

**Everyone** — if you use Discord and play Rematch, this lets Discord display your current Rematch status automatically.

---

## Install / Run (Overwolf Developer Tools)

1. Download / clone this repository
2. Open **Overwolf Developer Tools**
3. Click **Load unpacked**
4. Select the **folder containing these files** (the repository folder)
5. Start Rematch — your Discord presence should update automatically

No additional configuration is required.

---

## What it shows

- **In the lobby**: “Waiting for a match…”
- **In a match**: “Winning / Losing / Drawing” + current score
- **Goal moments**: brief update when you score or concede (7 seconds)

---

## Limitations

- **Game mode (Ranked / Quickmatch)** is **not currently supported** due to Overwolf limitations.  
  Overwolf’s documentation marks this data as **currently unavailable**, so the Rich Presence cannot display the active game mode yet.

---

## Notes

- Currently tested on **Windows**
- If Discord doesn’t update:
  - Make sure Discord is running
  - Make sure Discord Activity is enabled
  - Reload the app in Overwolf Developer Tools

---
