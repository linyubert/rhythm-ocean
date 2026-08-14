# Rhythm Voyage

A rhythm game for music class where the teacher builds the questions. The class performs a pattern together, the ship sails on, and the voyage continues to the next island.

Rhythm Voyage is part of **Dato Music Lab** (https://datomusiclab.dpdns.org), a working elementary music teacher's studio in Taipei.

## What it is

Rhythm apps ship with fixed exercises, which means the teacher has to bend the lesson to the app. This one inverts that: the rhythm editor comes first, so whatever the class is working on this week becomes the voyage.

Judging stays human. The app does not listen or score — the teacher watches the class perform and presses either *again* or *well played*. That keeps group performance, where thirty children are never perfectly aligned, from being failed by a microphone.

## Features

**Build your own patterns.** Quarter notes, eighth notes, rests and bar lines, assembled by clicking. Presets, a randomiser and a quick-start route are all there when preparation time ran out.

**A voyage that reacts.** Correct answers fade the question panel away and play the sailing animation in full — 3D waves, a royal sailing ship, treasure islands, wrecks and the treasure itself.

**Something different every leg.** Sea monsters, pirate ships, surfers, sharks and whales appear at random, and each stage switches between clear skies, sunset, overcast and storm.

**Feedback the class can see.** Treasure, combo counts, completion rate, sound effects and confetti.

**Stages persist.** Routes are saved to the browser's `localStorage`, so a route built at lunchtime is still there in the afternoon.

**Works on the room's hardware.** Desktop, classroom big screen and phone layouts.

## How to use

1. Choose **Build my route** or **Play now** on the home screen
2. Click notes to build a rhythm, or use a preset or the dice
3. Add the rhythm to today's route
4. Press **Set sail**
5. After the class performs, choose *needs another go* or *well played*

Keyboard shortcuts during play: `←` for another go, `→` for well played.
In the editor: `1` quarter note, `2` eighth notes, `3` quarter rest, `4` bar line.

## Tech

HTML, CSS and vanilla JavaScript, with [Three.js](https://threejs.org/) `0.160.0` for the ocean, the ship, the weather and the random encounters. Audio is Web Audio API; type is Google Fonts; stage data lives in `localStorage`.

Three.js and Google Fonts load from a CDN, so the **first** open needs a network connection, and whatever platform serves the page must allow those requests.

```
index.html                        Home screen, stage editor, game UI, audio and flow
assets/voyage-3d.js               Three.js ocean, ship, weather and random events
assets/rhythm-voyage-hero.png     Key art for the home and completion screens
```

Latest Chrome, Edge, Safari or Firefox recommended. If the browser requests reduced motion, transitions shorten automatically.

## License

Code is MIT — see [LICENSE](LICENSE). Artwork is original work by Yucheng Lin under separate terms; see [NOTICE.md](NOTICE.md).

## More from Dato Music Lab

Rhythm shows up all over the studio: there is a game about squeezing ketchup for exactly the length of each note, and another where the class plucks a father's beard in time with a snare drum. For a competition instead of a voyage, there is a two-team sight-reading tug-of-war on a single touchscreen. All at **https://datomusiclab.dpdns.org**.
