# Turn-Timer UX in Multiplayer Turn-Based Mobile Games (for a same-Wi-Fi family card game with host-selectable 30s / 60s / 120s limits)

Research date: 2026-10-29. Source quality note: official help pages exist for Marvel Snap, Catan Console Edition (Dovetail patch notes), Board Game Arena (BGA, partly deprecated doc plus a dated news post), Chess.com settings and WCAG. Hearthstone details come from the community wiki (wiki.gg), which cites Blizzard staff and patch notes. For Spades Plus, UNO! mobile, Rummy apps, Scrabble GO and Catan Universe I found **no official documentation** of timer behaviour. Those gaps are flagged below rather than filled from memory.

## 1. How do popular games display a turn timer (rings, bars, numeric countdowns, colors)?

### Takeaway
Big titles mostly *hide* the timer until it matters, then show a single strong visual metaphor: Hearthstone's burning rope across the board, Marvel Snap's bar on the End Turn button plus a red screen glow. Board-game and chess platforms show plain numeric clocks next to each player's name. None of the sources I could verify documented the "ring around the avatar" pattern common in casual card apps. It is a widely seen convention, but I found no citation for it.

### Cited Findings
- **Hearthstone:** turns last at most 75 seconds and then end automatically. "Neither the turn countdown timer nor the round counter is visible to players." The only cue is a burning rope fuse that appears across the centre of the battlefield when about 20 s remain (a footnote estimates about 22.5 s), and the turn ends when the fuse reaches the "End Turn" button. — [Hearthstone Wiki (wiki.gg) – Turn](https://hearthstone.wiki.gg/wiki/Turn); [Hearthstone Wiki (Fandom) – Turn](https://hearthstone.fandom.com/wiki/Turn)
- **Hearthstone history:** the timer was 90 s in alpha and was cut to 75 s before beta (per Ben Brode, cited by the wiki). Patch 10.2.0.23180 gave the first two turns of a match shorter timers (no numbers given). — [Hearthstone Wiki – Turn](https://hearthstone.wiki.gg/wiki/Turn)
- **Marvel Snap (official):** "You roughly have 1 minute to take your turn." Early turns are a bit shorter and later turns a bit longer. "How much time you have can be seen as a timer-bar on the 'End Turn' button in the bottom right." "When you are almost out of time, the screen will glow red." — [Marvel Snap Help – How long do I have to take my turn?](https://marvelsnap.helpshift.com/hc/en/3-marvel-snap/faq/46-how-long-do-i-have-to-take-my-turn)
- Secondary Marvel Snap sources give different lengths: about 30 s per turn ([Codashop guide](https://news.codashop.com/my/?p=20581)) and about 35–40 s maximum for card selection ([Game Developer, 2022](https://www.gamedeveloper.com/game-platforms/designers-don-t-sleep-on-marvel-snap-s-simultaneous-turns)). These conflict with the official "roughly 1 minute", which should be preferred.
- **Board Game Arena:** "Your remaining time appears to the right of your name", and on your turn it also appears at the top of the page. The page is numeric and every player's clock is visible. — [BGA Docs – Game clock (marked deprecated)](https://en.doc.boardgamearena.com/Game_clock)
- In BGA "No time limit" games, "the clock is removed from the interface" entirely. — [BGA News, 25 Jan 2019 – Fast turn based and other clock improvements](https://en.boardgamearena.com/news?id=405)
- **Chess.com / Lichess:** numeric per-player chess clocks. Chess.com's official Live Chess settings include a Low-Time Warning toggle that plays a sound. — [Chess.com Support – Live Chess settings](https://support.chess.com/en/articles/8614003-live-chess-settings)
- **UNO! (Mattel163):** the App Store listing says each player gets "only a few seconds to make a move" and that a three-minute match limit keeps games quick. A review mentions "a smaller timer when choosing your card". No documentation of the visual form. — [App Store – UNO!](https://apps.apple.com/no/app/uno/id1344700142); [PocketGamer review](https://ee.pocketgamer.com/articles/084169/uno-review-friendship-wrecking-fun-is-now-portable/)
- **Physical-table timer apps:** at least one board-game turn-timer app advertises "visual alerts with circular timer and color changes". This shows the circular-plus-colour pattern is a familiar convention among tabletop players, though the source is a search-summary of App Store timer listings and not a specific game. — [App Store – Time for Settlers](https://apps.apple.com/app/id783291298) (one of several timer-app listings returned; attribution to this specific app not verified)

### Inferences
- There are two display philosophies. **Ambient/hidden until late** (Hearthstone, Snap) keeps early-turn stress low. **Always-visible numeric** (BGA, chess) puts fairness and transparency first. A family game can combine them: show a calm, thin progress ring around the active player's avatar on *every* device so everyone knows whose turn it is and roughly how long is left, and show numeric seconds only on the active player's device, and only in the warning window.
- Snap's pattern of attaching the timer to the End Turn / primary action button helps on phones because it sits next to where the thumb already is. A ring on the avatar works better for showing other players whose turn it is.
- Because the host can choose 30, 60 or 120 s, a *proportional* ring (fraction of time remaining) reads the same at every setting. A numeric countdown alone would make 120 s look intimidating at the start.

### Gaps
- No official documentation found on how Spades Plus, Rummy apps (e.g., Rummy Plus or Indian rummy apps), UNO! mobile, Words With Friends, Scrabble GO, Ticket to Ride or Catan Universe *visually* render their turn timers (ring vs bar vs number, colours). These would need first-hand app inspection or screenshots.
- No source found that names or measures the "ring around avatar" pattern, though it is commonly seen in casual card apps.

## 2. When do warnings start, and through which channels (color, pulse, sound, haptic)?

### Takeaway
Shipped games warn late and absolutely: Hearthstone's rope appears at about 20 s of 75 s (about 27% left), Snap glows red "when almost out of time", and Chess.com plays a sound at a fixed low-time threshold. Chess players repeatedly ask for adjustable or louder warnings, which suggests a single fixed cue is not enough for everyone. I found no documented use of haptics.

### Cited Findings
- **Hearthstone:** the rope appears with about 20 s left (footnote: about 22.5 s) of a 75 s turn. That is the only warning, and it is visual and animated (a burning fuse moving toward the End Turn button). — [Hearthstone Wiki – Turn](https://hearthstone.wiki.gg/wiki/Turn)
- **Marvel Snap:** the warning is a red screen glow when "almost out of time". The timer bar is visible the whole turn. — [Marvel Snap Help](https://marvelsnap.helpshift.com/hc/en/3-marvel-snap/faq/46-how-long-do-i-have-to-take-my-turn)
- **Chess.com:** the Low-Time Warning is an on/off toggle with a sound. Support has said there is no setting to change the warning time. — [Chess.com Support – Live Chess settings](https://support.chess.com/en/articles/8614003-live-chess-settings); [Chess.com forum – Adjustable Low Time Warning](https://www.chess.com/forum/view/site-feedback/adjustable-low-time-warning)
- Chess.com warning thresholds are user-reported and conflict: one forum thread says 1 minute left in Rapid and 20 s in Blitz, while another user quotes support as saying 30 s in blitz and 10 s in bullet. — [Chess.com forum – Low time warning](https://www.chess.com/forum/view/general/low-time-warning)
- Demand for more granular warnings: third-party add-ons let players pick alert points of 30, 15, 10, 5, 3, 2 and 1 seconds left, with optional countdown. — [Chess time warnings add-on listing](https://firefox.marketplace.browsertotal.com/ko/firefox/addon/chess-time-warnings/); [Chrome Web Store – Chess.com Low Time Warning](https://chromewebstore.google.com/detail/chesscom-low-time-warning/felggchimnddpdmkhdcappeknkkffmke)
- Chess.com users have also asked for a louder or more distinct low-time sound. — [Chess.com forum – change/louder low time sound](https://www.chess.com/forum/view/livechess/is-it-possible-to-change-the-getting-low-on-time-sound-effect-or-make-it-louder)
- **Lichess:** forum users say a warning plays when time gets critical, but it is less useful in increment games, and they propose a second warning at about 5 s. This is community-reported, not official. — [Lichess forum search results (lag/warning threads)](https://lichess.org/forum/lichess-feedback/lag-compensation-changes)
- **WCAG 2.2.1** (the "extend" option) requires that "the user is warned before time expires and given at least 20 seconds to extend the time limit with a simple action". This gives a principled minimum warning lead time of 20 s. — [W3C – Understanding SC 2.2.1 Timing Adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html)
- Casual design proposal: a TripleA forum post suggests a "Casual mode timer that only has audible and visual notifications on expiration", while a tournament timer actually ends the turn. — [TripleA forum](https://forums.triplea-game.org/post/6022)

### Inferences
- A fixed 20 s warning (Hearthstone-style) would take two-thirds of a 30 s turn and only a sixth of a 120 s turn. A scaled rule works better for 30/60/120 settings, for example "warn at the larger of 10 s or 25% remaining" (30 s gives 10 s, 60 s gives 15 s, 120 s gives 30 s). This is my inference and not sourced from a shipped game, but it lands near Hearthstone's 27%.
- Layer the channels and escalate gently: (1) ring colour shifts (calm to amber), (2) gentle pulse or numeric seconds appear, (3) last ~5 s soft ticks and one light haptic on the *active player's* phone only. Other players' phones should show only the visual cue, so a family table isn't filled with ticking from several phones.
- Use colour plus shape or motion, never colour alone, so colour-blind players still get the warning. This is general accessibility practice and was not sourced in this research.
- Let players mute timer sounds separately, given the requests for louder or adjustable chess warnings.

### Gaps
- No primary source found documenting haptic or vibration warnings in any of the named games.
- No official Lichess documentation found for its exact low-time warning threshold or sound behaviour.
- No user research or measured data found on the best warning threshold (absolute seconds vs percentage) for casual players.

## 3. What happens at zero (auto-pass, auto-play, strikes, kicks, time banks), and what feels fair?

### Takeaway
The common pattern is **auto-end the turn and lock in what was already done** (Hearthstone, Snap, Catan private games), escalating for repeat offenders: Hearthstone shortens the next idle turn to about 7 s, Catan gives 3 strikes then an AI replacement, and BGA lets opponents skip or expel. Players and developers prefer passing over a random auto-play, but card games with mandatory plays (follow suit) need some default move. Time banks and an explicit "I'm thinking" signal reduce perceived unfairness.

### Cited Findings
- **Hearthstone:** the turn ends automatically at 75 s. If a player takes *no action* and times out, their **next turn starts with a faster fuse giving about 7 s of playable time** (about 10 s total including animation). Taking any action restores the full 75 s turn. — [Hearthstone Wiki – Turn](https://hearthstone.wiki.gg/wiki/Turn)
- Deliberately running the rope ("roping") carries no game penalty and is treated as bad etiquette, not cheating. — [Out of Games – Why do people rope, explained](https://outof.games/realms/hearthstone/guides/553-hearthstone-why-do-people-rope-explained/)
- **Marvel Snap:** "If you don't press End Turn, the turn will auto-end after you run out of time!" Actions already taken are locked in. — [Marvel Snap Help](https://marvelsnap.helpshift.com/hc/en/3-marvel-snap/faq/46-how-long-do-i-have-to-take-my-turn)
- **Catan Console Edition (Dovetail, patch notes 26 Apr 2023):**
  - Default turn limit is 80 s. Local and private games can choose **Off, 40, 80, 120 or 160 s**. The timer is always on in public online games.
  - Public games: failing to end the turn in time gives a **strike**, and after the **3rd strike the player is removed and replaced by an AI player**.
  - Private games: **no strikes**. When time runs out the turn ends and play passes on, and a player idle for **6 minutes** can be removed.
  - The timer **pauses** while a trade is proposed (others get 30 s to respond). Discarding on a 7 gets its own 30 s that doesn't count against the turn.
  — [Dovetail – Catan Console Edition patch notes, Apr 26 2023](https://profile.dovetailgames.com/live/catan-console-edition/articles/article/catan-console-edition-patch-notes4-web)
- **Board Game Arena:**
  - Each game has an initial time (also the maximum) plus "additional time per move", recalculated in 2019 from the community's real average time per move. This is meant to shorten waits for quitters and stop stalling. — [BGA News, 25 Jan 2019](https://en.boardgamearena.com/news?id=405)
  - When a clock goes negative, any opponent can make that player skip their turn, and all later turns are then skipped automatically. A player with a *more negative* clock cannot skip one with a less negative clock. — [BGA Docs – Game clock](https://en.doc.boardgamearena.com/Game_clock)
  - BGA prefers getting opponents to rejoin over penalising them.
  - An "I would like to think a little" link shows opponents a message so they don't assume you're away. — [BGA Docs – Game clock](https://en.doc.boardgamearena.com/Game_clock)
  - Forum users report a grace warning of about 20 s on the first expel attempt, then shorter ones (about 10–15 s, then 5 s). These figures are anecdotal and conflicting. — [BGA forum – How does the 20 second expel option work](https://forum.boardgamearena.com/viewtopic.php?p=188446)
- **Auto-play debate (BGA bug tracker):**
  - One request asks to auto-play when only one card is legal, to keep games moving. — [BGA bug #46603](https://da.boardgamearena.com/bug?id=46603); [BGA bug #41674](https://it.boardgamearena.com/bug?id=41674)
  - Another asks to *stop* auto-playing when no winnable cards remain, because it ends turns abruptly and the losing player can't see what happened. — [BGA bug #121544](https://da.boardgamearena.com/bug?id=121544)
  - Auto-play can expose information if it fires while a player is offline, so one report suggests making it opt-in. — [BGA bug #41674](https://it.boardgamearena.com/bug?id=41674)
- A developer who forced a **random card play** on timeout in a turn-based card game got pushback. A commenter preferred "just passing the turn to the next player after the timer has expired". — [Photon Engine forum](https://forum.photonengine.com/discussion/comment/40575/)
- **Legends of Runeterra:** "If you run out of time, no action is completed, and your opponent gets the opportunity to perform an action." — [Gamepressure – LoR turns and rounds](https://www.gamepressure.com/legends-of-runeterra/turns-and-rounds-system/z0cf3d)
- LoR added **time banking** ("Ending your turn early banks extra time") and **time falloff** (repeating identical actions in a round shortens the next action's time, which resets each round). Patch 1.15 changed the formula so "there are no more infinite rounds". — [Dot Esports – LoR Patch 1.15 round timers](https://dotesports.com/?p=329524); [devtrackers – PlayRuneterra tweets](https://devtrackers.gg/legends-of-runeterra/p/d254acf7-tweets-by-playruneterra-on-28-nov)
- **Ticket to Ride (current Steam/mobile version, user reports from 2023):** one player waited "over 1 Hour" expecting an idle opponent to be removed, but "nothing happend". Another describes a 30 s live turn timer with separate reserve time. Both are unofficial. — [Steam discussion – Ticket to Ride](https://steamcommunity.com/app/2477010/discussions/0/4036976070313581748)
- An older Ticket to Ride iPad review says a player who drops out is "immediately replaced by a AI bot allowing you to continue the game" (dated, may not reflect the current app). — [Board Game Quest review](https://boardgamequest.com/ticket-to-ride-ipad-and-iphone-review)
- **Catan Universe:** a Steam user asked for a quick mode with 50% of the current turn time plus "a bank of extra time (2 mins for a vanilla game…)". This implies a per-turn timer plus bank exists, but there are no official figures. — [Steam – Catan Universe discussions](https://steamcommunity.com/app/544730/discussions/0/1319962173911832961/?ctp=2); [Steam – Catan Universe discussion 2](https://steamcommunity.com/app/544730/discussions/0/4521040918044367656)

### Inferences
- For a trick-taking or shedding family card game:
  - **Zero action taken, and a play is mandatory:** auto-play the *simplest legal* card (lowest legal card, or the only legal card) rather than a random one. Clearly label it ("Auto-played for Grandma ⏱"), and avoid triggering it when it would reveal hidden information unfairly.
  - **A pass or draw is legal:** pass or draw, which is the standard UNO-like behaviour and the outcome commenters found fairest.
  - **Some actions taken in a multi-step turn:** lock them in and end the turn (Snap, Hearthstone).
- Escalation should be soft in a family context: Catan *private* games use no strikes, and only remove a player after 6 minutes idle. A sensible family version is "after 2–3 consecutive timeouts, offer 'Let a bot play for X?' to the host" rather than an automatic kick. A Hearthstone-style shortened next turn could feel punitive to slow children or grandparents.
- A small per-player **time bank** (e.g., unused seconds roll into a reserve, capped, as in LoR banking and BGA's "cannot exceed initial time") can absorb occasional long thinks without stretching every turn.
- A visible **"I'm thinking" / "+30 s" button** (BGA's "I would like to think a little", WCAG's "extend with a simple action") lets slow players save face and tells the table they're not AFK. Limit it per game (e.g., once or twice per hand) to avoid stalling.

### Gaps
- No official documentation found for Spades Plus, Hearts or Rummy apps, or UNO! mobile on what happens at zero (auto-play vs auto-draw vs bot takeover, number of strikes). Common claims that these apps "auto-play after N missed turns" could not be verified.
- A BGA support reply reportedly states that extra time is added only at the start of a player's turn. I could not tie this to a specific bug ticket, so it is not cited above.
- No player survey or quantitative data found on which timeout outcome is perceived as fairest.

## 4. Multi-step turns: does the clock reset per action or per turn? Undo?

### Takeaway
Most CCGs use a **single clock per turn** that does not reset per action (Hearthstone 75 s, Snap about 1 min). Some systems **pause** the clock for sub-steps involving other players (Catan trades and discards) or add time per action (LoR, with falloff to prevent abuse). Animations that eat the player's clock are a recurring complaint. I found no documented interaction between undo and the timer.

### Cited Findings
- **Hearthstone:** one 75 s clock per turn. "Slush time" compensates for the delay between server turn start and client turn start. Animations can run past 75 s, and the timer "does not always fully account" for animation length. — [Hearthstone Wiki – Turn](https://hearthstone.wiki.gg/wiki/Turn)
- **Catan Console:** the turn timer pauses during trade proposals (30 s for others to respond), and the 7-discard phase has its own separate 30 s window. — [Dovetail – Catan Console patch notes](https://profile.dovetailgames.com/live/catan-console-edition/articles/article/catan-console-edition-patch-notes4-web)
- **Legends of Runeterra:** per-action timing with banking. Repeated identical actions within a round get progressively less time ("time falloff"). — [Dot Esports – LoR Patch 1.15](https://dotesports.com/?p=329524)
- A game-design summary claims LoR "resets its timer after each action you take on your turn". This conflicts with the falloff and banking descriptions above, which describe a more layered system. Treat the simple "reset per action" claim as unverified. — [Gamedev Stack Exchange answer (mirror)](https://backiee.wasmer.app/https_gamedev_stackexchange_com/a/194451)
- **LoR animations:** Riot acknowledged that turn timers kept counting during animations the player couldn't control (e.g., level-ups), sometimes leaving too little time, and fixed it in Patch 2.2. — [Out of Games – Runeterra Patch 2.2 turn timer improvement](https://outof.games/news/2454-runeterra-patch-22-will-include-an-improvement-to-turn-timers/)
- **Magic: Spellslingers:** players filed feedback titled "Turn timer doesn't stop when playing a card". This is the same animation-eats-clock complaint. — [Wizards feedback – Magic Spellslingers](https://feedback.wizards.com/forums/925012-magic-spellslingers/suggestions/40554124-turn-timer-doesn-t-stop-when-playing-a-card)
- **BGA:** extra time is credited per move/turn, and total time can't exceed the initial time. — [BGA Docs – Game clock](https://en.doc.boardgamearena.com/Game_clock); [BGA News 2019](https://en.boardgamearena.com/news?id=405)

### Inferences
- For a family card game where a turn may involve several steps (e.g., draw, then play or meld, then discard), use **one clock per turn** (simple to explain: "you have 60 seconds"). Pause it during deal, shuffle and card-flight animations and during any prompt that waits on *another* player (e.g., "challenge?" or "call UNO" windows), as Catan does for trades and LoR's fix does for animations.
- **Undo within a turn** (before ending it) shouldn't refund time, otherwise players can undo to stall. Undo also shouldn't be blocked by the warning state. If the clock expires mid-undo, lock in the last committed state. This is my own design inference, since no source covers it.
- If a turn has a forced sequence such as draw then discard, the timeout handler must complete the *minimum legal sequence* (e.g., auto-discard the card just drawn) so the game state is always valid.

### Gaps
- No source found documenting how any of the named games handle **undo** in relation to the turn timer (e.g., BGA "undo" in multi-action games, Ticket to Ride, Rummy meld undo).
- No official current confirmation of Marvel Snap's behaviour for multi-card turns beyond "actions taken are locked in".

## 5. Disconnects and backgrounded apps during a timed turn

### Takeaway
Competitive games **do not pause** for disconnects. Hearthstone keeps the clock running and gives a 60 s reconnect window before forfeit. Casual and board-game platforms add longer idle thresholds and bot replacement (Catan private: 6 min idle, Ticket to Ride: bot replaces a dropped player). Async word games use day-scale auto-resign limits. No source documented explicit iOS/Android backgrounding behaviour.

### Cited Findings
- **Hearthstone:** "the game will not be paused during disconnections, meaning that returning players may find their turn has expired or the state of the battle has progressed in their absence." A disconnected player has **60 s** to reconnect (since Patch 1.0.0.4944, 2014-03-11). Otherwise the opponent wins, and if both disconnect it is a tie. The client tries an automatic reconnect if an animation stalls for 25 s. — [Hearthstone Wiki – Reconnection feature](https://hearthstone.wiki.gg/wiki/Reconnection_feature)
- **Hearthstone idle handling:** an idle (no-action) timeout leads to a roughly 7 s next turn, which shortens the wait for a player who has walked away. — [Hearthstone Wiki – Turn](https://hearthstone.wiki.gg/wiki/Turn)
- **Catan Console private games:** a player idle for 6 minutes can be removed. Public games replace a player with an AI after 3 timeout strikes. — [Dovetail patch notes](https://profile.dovetailgames.com/live/catan-console-edition/articles/article/catan-console-edition-patch-notes4-web)
- **BGA:** "no time limit" means a non-responsive player's turn can't be skipped, which is why BGA "strongly discourages" it except with friends. Skipped and abandoned players get an ELO "leave" penalty, and results are "neutralized" by game progress. — [BGA Docs – Game clock](https://en.doc.boardgamearena.com/Game_clock)
- BGA bug-tracker titles show users surprised when "No time limit" friend games ended after overnight inactivity because a 4 h real-time timeout applied. — [BGA bug #21294](https://gl.boardgamearena.com/bug?id=21294); [BGA bug #52289](https://uk.boardgamearena.com/bug?id=52289)
- **BGA turn-based mode** supports "Playing Hours" (a 12 h window) during which the clock runs, and the clock is frozen outside it. — [BGA News 2019](https://en.boardgamearena.com/news?id=405)
- **Ticket to Ride:** an older review says dropped players are "immediately replaced by a AI bot". Newer versions added multi-session and async play so players can pause and resume, with notifications when running out of time (from news coverage of an update; exact article attribution between these two not verified). — [Board Game Quest](https://boardgamequest.com/ticket-to-ride-ipad-and-iphone-review); [iCulture – Ticket to Ride update](https://www.iculture.nl/apps/bordspel-ticket-to-ride-krijgt-meer-online-mogelijkheden-na-update/); [iDownloadBlog – Ticket to Ride update](https://www.idownloadblog.com/?p=385207)
- **Words With Friends (async):** an inactive game auto-resigns after 6 days for random-opponent games and 11 days for others, per Zynga's help centre as summarised in search results. An older 2011 post gave 5 and 11 days (down from 7 and 22). — [Zynga Support – Words With Friends](https://zyngasupport.helpshift.com/hc/en/21-words-with-friends/faq/1844-what-do-i-do-with-corrupted-games/); [2011 blog post](https://gamingqna.blogspot.com/2011/11/what-time-limit-for-turns-in-words-with.html)

### Inferences
- On a shared home Wi-Fi, "disconnects" are usually a phone locking, a family member switching to another app, or a Wi-Fi blip. A family game should:
  - (a) keep the authoritative clock on the host, not on the backgrounded phone;
  - (b) show other players a "📵 Sam's phone is away" badge, as with BGA's message to opponents;
  - (c) on first disconnect in a turn, either keep running and let the normal timeout action fire, or pause for a short grace (e.g., 15–30 s) if the host chose "relaxed";
  - (d) after repeated misses, offer the host "Let a bot play for Sam" instead of kicking. Bots can hand control back when Sam returns (Ticket to Ride and Catan both use AI replacement).
- On rejoin, the client must re-fetch the authoritative deadline and state. It must never resume its own local countdown, because iOS and Android suspend timers in background apps (general platform behaviour, not sourced here).
- Since the host phone is also the server, the host backgrounding the app is the critical failure case. Consider pausing the whole game, with a visible "Waiting for host" banner, when the host goes away.

### Gaps
- No source found documenting how any named mobile game treats **app backgrounding** (as distinct from network disconnect), or whether it pauses the timer when the phone locks.
- No official documentation found for UNO! mobile, Spades Plus or Rummy apps on AFK bot takeover rules.
- Hearthstone Battlegrounds disconnect/timer differences were not covered by the sources fetched.

## 6. Clock synchronization between devices (remaining time vs absolute deadlines; latency compensation)

### Takeaway
Developer consensus is that the **server is the authority and stores an absolute deadline (or turn-start timestamp)**. Clients render a local countdown from that deadline using an estimated clock offset (NTP-style round-trip handshake), with remaining-seconds updates only as corrections. Shipped games add small hidden buffers: Hearthstone's "slush time" and chess sites' lag compensation, which refunds measured lag to the mover.

### Cited Findings
- "To make sure the game clock is as accurate as possible we don't send how much time there is left to take a turn, but the time that the turn will end." The same thread notes that synchronising time between server and client is error-prone. — [Roblox DevForum – Client Timer In Sync](https://devforum.roblox.com/t/client-timer-in-sync/111842/20)
- Storing a "timestamp when turn started" is enough, because remaining time can be computed by subtraction at any moment. — [Gamedev Stack Exchange – How to manage time in a two player game (mirror)](https://backiee.wasmer.app/https_gamedev_stackexchange_com/questions/149051/how-to-manage-time-in-a-two-player-game)
- Clock-offset handshake: the client sends its timestamp, the server replies with the client timestamp plus its own, and the client assumes half the round-trip is one-way and repeats the sync periodically. — [Photon forum – real time clock for multiplayer](https://forum.photonengine.com/discussion/16515/how-can-i-get-or-create-a-real-time-clock-for-my-multiplayer-game); [Roblox DevForum – Synchronizing timers](https://devforum.roblox.com/t/synchronizing-timers-between-server-and-client/3090380)
- An alternative is to poll for remaining time and add half the ping, which is "not going to be the perfect synchronization but is close". — [Roblox DevForum – Client Timer In Sync](https://devforum.roblox.com/t/client-timer-in-sync/111842/20)
- Broadcasting a timer to many clients consistently in a draft app is the same problem in a non-game context. — [DEV Community – Sports draft app timer](https://dev.to/allison_seboldt/sports-draft-app-how-to-consistently-broadcast-timer-to-multiple-clients-49h0)
- **Hearthstone slush time** compensates for the gap between when a turn starts on the server and when it appears to start on the client. It appears to fall at the end of the turn but is actually added to the start of the next. — [Hearthstone Wiki – Turn](https://hearthstone.wiki.gg/wiki/Turn)
- **Lichess lag compensation:**
  - Lichess adds measured network lag back to the mover's clock. The system was significantly reworked in 2017, and fast time controls have a lower compensation cap to limit advantage for laggy players. — [Lichess forum – lag compensation changes](https://lichess.org/forum/lichess-feedback/lag-compensation-changes)
  - A user's analysis of game data found average per-move compensation ranging from about 50 ms to 400 ms. — [Lichess blog – Scientific analysis of lag compensation on Lichess and Chess.com](https://lichess.org/@/DaBassie/blog/scientific-analysis-of-lag-compensation-on-lichess-and-chess-dot-com/iXRCXoxd)
- **Trust failure example:** a BGA bug report titled "Timer suddenly jumping from a high positive time to negative time without warning". Clock desync is visible to players and erodes trust. — [BGA bug #146500](https://gl.boardgamearena.com/bug?id=146500)

### Inferences
- Recommended architecture for host-as-server on the same Wi-Fi:
  - (1) When a turn starts, the host broadcasts `{turnId, playerId, durationMs, deadlineHostMs}`.
  - (2) Each client keeps an offset estimate `hostNow ≈ localNow + offset`, refreshed by a ping/pong every few seconds (LAN RTT is usually a few ms, so this is cheap and accurate).
  - (3) Clients render `remaining = deadlineHostMs − (localMonotonicNow + offset)`, using a monotonic clock so wall-clock changes don't affect it.
  - (4) The host alone decides expiry, and applies a small server-side **grace window** (e.g., 300–500 ms) so a move tapped at "0.1 s" on screen is still accepted. This mirrors Hearthstone slush and chess lag compensation, scaled down for LAN.
  - (5) The client UI should hit zero slightly *after* or exactly at the host deadline, never before, so players never see "0" and then have their move accepted, or see time left and have it rejected.
- Pauses (animations, sub-prompts) are easiest to model as the host issuing a *new* deadline message. Clients never pause independently.
- Including `turnId` in every timer message stops a stale deadline from a previous turn being applied after a reconnect.

### Gaps
- The Bugnet article that appeared in search ("bug reporting for games with turn timers") could not be fetched with content, and its reported recommendations (log client and server time and offset, test with jitter) are unverified.
- No primary engineering write-up found from a commercial mobile card game (e.g., Mattel163, Zynga, Second Dinner) on their specific timer sync approach.

## 7. Accessibility guidance for time limits (WCAG 2.2.1) and "no timer" options

### Takeaway
WCAG 2.2.1 (Level A) requires that time limits can be **turned off, adjusted to at least 10× the default, or extended with a simple action after a warning that gives at least 20 s**, unless the limit is essential or part of a real-time event. Multiplayer games aren't named, but the auction example says it is unfair to extend a shared limit for one user. Shipped board-game platforms offer "Off" or "No time limit" for private/friends play, which fits a family game.

### Cited Findings
- **SC 2.2.1 Timing Adjustable (Level A):** for each time limit, at least one of the following must hold:
  - **Turn off:** the user can turn off the limit before encountering it.
  - **Adjust:** the user can adjust it "over a wide range that is at least ten times the length of the default setting".
  - **Extend:** the user is "warned before time expires and given at least 20 seconds to extend the time limit with a simple action".
  - **Real-time exception:** the limit is a required part of a real-time event and no alternative is possible.
  - **Essential exception:** extending it would invalidate the activity.
  - **20-hour exception:** the limit is longer than 20 hours.
  — [W3C – Understanding SC 2.2.1](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html)
- **Intent:** the criterion helps users who "require more time than expected", including people with cognitive or language limitations who "need more time to read and to understand". — [W3C – Understanding SC 2.2.1](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html)
- **Multi-user precedent:** in the auction example, because the limit applies to all bidders, "it would be unfair to extend the time limit for any one particular user". "Live humans interacting in a virtual world using avatars" is listed as a real-time event. The Understanding doc never mentions games explicitly. — [W3C – Understanding SC 2.2.1](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html)
- **Catan Console:** local and private games offer **Off**, 40, 80, 120 or 160 s. The timer is forced on only in public matchmaking. — [Dovetail patch notes](https://profile.dovetailgames.com/live/catan-console-edition/articles/article/catan-console-edition-patch-notes4-web)
- **BGA:** "No time limit" is offered and was made more prominent in 2019, with the clock removed from the UI. BGA still discourages it except "with friends or when learning a game", because a non-responsive player can't be skipped. — [BGA News 2019](https://en.boardgamearena.com/news?id=405); [BGA Docs – Game clock](https://en.doc.boardgamearena.com/Game_clock)
- **Hearthstone** solo adventures normally have no turn timer, so solo play is untimed by default. — [Hearthstone Wiki – Turn](https://hearthstone.wiki.gg/wiki/Turn)
- Time pressure adds anxiety and can cause mistakes, and timers "put stress on players who may not do well under pressure, particularly those overwhelmed by choices". This is design commentary, not research. — [Gamedev Stack Exchange answer (mirror)](https://backiee.wasmer.app/https_gamedev_stackexchange_com/a/194451); [EN World – Worlds of Design: When the Clock's Ticking](https://www.enworld.org/posts/9755364)
- An Artifact player said a short time bank made them feel "under pressure constantly", pulling focus from the game. — [Reddit r/Artifact comment (mirror)](https://redlib.ssps.io/r/Artifact/comments/aeq1wp/110_update/edsftkl/?context=3)
- A GMTK discussion of XCOM-style timers describes making speed optional, so running out of time costs "a missed opportunity – not a completely failed mission". — [GMTK video transcript (Amara)](https://amara.org/videos/efYjdTqQadCr/en/3100944)

### Inferences
- The host's 30/60/120 range is only 4× the shortest option, so it does **not** meet WCAG's "adjust to ≥10×" route by itself. Adding an **"Off / No timer"** option (as Catan and BGA do) satisfies the "turn off" route. A per-turn **"+30 s / I'm thinking" button** shown at the warning point satisfies the "extend with a simple action, ≥20 s" route.
- In a shared multiplayer timer, the WCAG auction reasoning implies that per-player extensions should be *visible and symmetric*: everyone gets the same number of "+time" uses. Alternatively the host can give a per-player accommodation (e.g., "Grandpa: 2× time"), which suits a family setting where fairness is negotiated socially.
- Defaulting to 60 s, or a "relaxed" preset, with soft warnings and pass/simple-auto-play on expiry fits the casual and family audience better than the 30 s competitive pace. Consider surfacing 30 s as "Fast", 60 s as "Normal" and 120 s as "Relaxed" plus "Off", mirroring BGA's fast/normal/slow naming.
- If the timer is off, the game still needs a social nudge. Something like BGA's away message, or a gentle "nudge" button others can tap after N seconds, avoids the "can't skip a non-responsive player" problem BGA warns about.

### Gaps
- No WCAG or W3C guidance found that explicitly addresses turn-based *games* (vs web content). Applying 2.2.1 to games is an analogy.
- No accessibility-specific guidance from platform game-accessibility guidelines (e.g., Xbox Accessibility Guidelines, Game Accessibility Guidelines) was fetched in this pass. Those would likely have directly relevant "timed input" recommendations and are worth a follow-up.
- No user research found specifically on children or older adults and turn timers.
