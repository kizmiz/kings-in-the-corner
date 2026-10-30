# Kings in the Corner

A free card game for iPhone and Android: you and up to three of the family at a green felt table,
with *Devils in the Corner* as a second game. Everything runs on the phone, including Nana, a
self-play RL agent that learned the game from the strongest rule bot and then learned to beat it.
The family at home can also sit at one table on the same Wi-Fi, each on their own phone.

| Path | What it is |
| --- | --- |
| `web/` | The app: plain HTML, CSS and JS, no build step. Both phone shells bundle this folder |
| `web/engine/` | The rules (`game.js`), the family's bots (`bots.js`), Nana's observation (`encoding.js`) and network (`policy.js`) |
| `web/render.js` | Cards, piles, seats and the table, as HTML; the app and the design boards both draw with it |
| `web/i18n.js`, `web/lang/de.js` | The words on screen, in English or German |
| `web/net.js` | Tables on the same Wi-Fi: the shells' networking, or tabs over a loopback in a browser |
| `web/agents/` | Nana's and Leo's weights, one file per game (`nana-classic.bin`, `leo-demons.bin`, ...) |
| `design/boards.html` | The design boards: every screen, drawn with the app's own CSS and renderer |
| `ios/` | The iOS app: a SwiftUI shell around the bundled `web/` folder (`KingsCorner.xcodeproj`) |
| `android/` | The Android app: a Kotlin shell around the same folder, packed as the APK's assets |
| `kitc/` | The Python side: engine, bots, encoder, PPO training and evaluation |
| `tests/` | Rules, hidden information, devils, match play, and the app's JS engine replaying Python games move for move |

## The rules

From [Bicycle's rules](https://bicyclecards.com/how-to-play/kings-corner), for two to four players:

- Everyone gets seven cards. Four more go face up on the sides of a cross (north, east, south, west);
  a king turned up there goes to a corner and the side gets the next card. The rest is the stock.
- A turn: draw one card from the stock, then play as many cards as you like, then end the turn.
- A card goes on a card one rank higher of the other color (a red 9 on a black 10). Any card fills an
  empty side; only a king starts a corner.
- A whole pile on a side moves onto another pile if its first card fits there; the side it leaves is empty.
- The first player to play their last card wins.
- **Stuck games**: once the stock is out, a turn with no move is a pass. If every player passes in a
  row, whoever holds the fewest cards wins; players who share the fewest tie.

**Devils in the Corner** is the same game with the kings turned into devils, each with an eye. A
devil played from the hand straight into a corner unleashes its power:

- **Red devils** (hearts, diamonds): its player trades their whole hand with a rival (heads-up the
  other player; at a bigger table, one at random) and plays on with the new hand.
- **Black devils** (spades, clubs): the cards on the four sides are dealt into new random piles, the
  same number of piles on the same sides, each still building down in alternating colors.

A devil dealt to a corner, played on an empty side or moved there with its pile does nothing, and
playing a devil as your last card wins without a trade. In the app, Undo can't take back a power.

**Match to 50** plays either game hand after hand (`web/engine/match.js`), alone or on the Wi-Fi:

- Whoever goes out scores nothing for the hand; everyone else scores the cards they still hold:
  jacks, queens and kings 10, every other card its number (an ace 1). A stuck hand has nobody out,
  so everyone scores what they hold. Each hand starts with the next player.
- Whoever goes over 50 loses, and the lowest score then wins (a shared lowest is a tie). A score
  that lands on exactly 50 drops back to 25.
- **Kamikaze**: a hand of exactly thirteen cards, ace to king, one of each rank, wins the match
  outright, the moment it comes together (a draw, a play or a red devil's trade). Both engines
  know the rule (`kamikaze: true`); only matches turn it on.
- The family plays each hand as in a single game, to go out first. Matches keep their own record
  at each table, and a match closed between hands opens again at the scores.

## The family

| Rival | Level | How it plays |
| --- | --- | --- |
| Pip | 1 | Picks at random among the cards it can play and ending the turn (`RandomBot`) |
| Uncle Ray | 2 | Plays every card it can, in no particular order (`GreedyBot`) |
| Aunt June | 3 | Searches every order of moves in the turn and keeps the one that leaves the fewest cards in hand, no empty side for the next player and the fewest places for cards the others may hold (`HeuristicBot`) |
| Cousin Leo | 4 | A trained network an eighth of Nana's width (128 units a layer to her 1,024), picked from his training run at a strength between June and Nana (the standings are below). Weights from `runs/s2` iteration 280 and `runs/sd2` iteration 60 |
| Nana | 5 | The trained network (`kitc/policy.py`, `web/engine/policy.js`) |

June beats Ray 74% of the time heads-up in Kings. Holding cards back is most of her
edge: a June that only counts cards beats Ray 51% of the time.

### How the family does

Leo and Nana play their top-rated move every time, with the weights the app ships
(`web/agents/*.bin`). Every deal is played once from every seat, and a tie (the stock ran out and
the fewest cards were shared) counts as neither a win nor a loss. From `python -m kitc.standings`,
2,000 deals for each figure; ±1.0 to 1.5 points (95%).

How often each one wins at a table of Aunt Junes. A June among Junes shows the share a player of
equal strength gets, a little under 50%, 33% and 25% because of ties:

| Wins at a table of Junes | Kings, 2 players | 3 players | 4 players | Devils, 2 players | 3 players | 4 players |
| --- | --- | --- | --- | --- | --- | --- |
| Pip | 2.9% | 3.8% | 4.2% | 1.7% | 4.9% | 4.6% |
| Uncle Ray | 21.4% | 23.6% | 27.3% | 21.2% | 21.2% | 23.1% |
| Aunt June | 48.8% | 30.6% | 22.6% | 49.2% | 30.6% | 22.4% |
| Cousin Leo | 56.9% | 35.1% | 32.3% | 51.5% | 34.4% | 29.7% |
| Nana | **69.6%** | **39.4%** | **34.2%** | **56.0%** | **36.4%** | **30.3%** |

Heads-up, how often the row beats the column:

| Kings | Pip | Ray | June | Leo | Nana |
| --- | --- | --- | --- | --- | --- |
| Pip | | 1.0% | 2.9% | 1.8% | 0.1% |
| Uncle Ray | 99.0% | | 21.4% | 17.3% | 7.2% |
| Aunt June | 94.7% | 74.2% | | 37.9% | 24.7% |
| Cousin Leo | 95.9% | 78.4% | 56.9% | | 29.3% |
| Nana | 98.8% | 90.2% | 69.6% | 63.4% | |

| Devils | Pip | Ray | June | Leo | Nana |
| --- | --- | --- | --- | --- | --- |
| Pip | | 2.5% | 1.7% | 2.3% | 1.6% |
| Uncle Ray | 97.5% | | 21.2% | 24.4% | 20.1% |
| Aunt June | 96.3% | 76.4% | | 45.2% | 40.8% |
| Cousin Leo | 94.5% | 73.7% | 51.5% | | 42.6% |
| Nana | 95.8% | 77.5% | 56.0% | 52.6% | |

Devils in the Corner leaves less to skill: a red devil can hand anyone the smaller hand, and a black
one redeals the table, so every edge there is smaller. At bigger tables the other players' moves
change the table between your turns, so edges shrink too, and holding cards back, June's strength
heads-up, stops paying: at four players Ray, who plays everything he can, wins more often among
three Junes than a fourth June does.

How she got there, heads-up against June: PPO from scratch stalled at 21%; copying June first
reached 44%; PPO from that copy reached 65% after 400 iterations (about 30 million decisions), and a
further 150 iterations on a mix of two to four players lifted her four-player result from 26% to 31%
without losing the heads-up one. Devils in the Corner started from her classic weights, copied
June's devils game (44%) and trained on mixed tables to 54%. Longer runs (`runs/p3`, `runs/d3`) took
her to the 70% and 56% above.

## Playing on the same Wi-Fi

Home, then Play on Wi-Fi: one phone hosts a table and the others on the same Wi-Fi join it, iPhones
and Android phones alike, with no server and no internet. Seats nobody takes go to the family
(Nana, June, Ray); someone who leaves mid-game is replaced by Aunt June so the rest play on.

- The host's phone runs the game (`web/app.js`, mode `host`) and the bots. Each phone gets the table
  as its own seat sees it: its own cards, how many everyone else holds, and the table; the
  others' cards only once the game is over. Moves go back to the host, which checks them.
- Every phone says what happened in its own language: the host sends what happened (who played
  which card where, which devil did what), not sentences.
- The shells do the networking (`ios/KingsCorner/Net.swift`, `android/.../Net.kt`): the host listens
  on TCP and advertises the table over Bonjour / DNS-SD as `_kitc._tcp`, and messages are JSON, one
  per line. iOS asks once for local network access (`NSLocalNetworkUsageDescription`).
- In a browser, `index.html?loopback` lets tabs on one computer stand in for phones (`web/net.js`),
  for development: open two tabs, host in one and join from the other.

Tested: two tabs over the loopback (a whole game, with both phones checked to show the same table
throughout, Play again and closing the table); the iOS app hosting in the simulator with a Mac
script as the other phone over real Bonjour and TCP (a whole game); and the iOS app joining a table
the Mac hosted. The Android side builds but hasn't been run: no emulator image on this Mac.

## Languages

English and German. The app follows the phone's language: the iOS and Android shells pass it to
the page (`window.kitc.lang`), and a browser uses its own. Every text on screen is written in English
inside `t()` (`web/i18n.js`) and `web/lang/de.js` gives its German (informal *du*; the stock is the
*Talon*). The cards keep their international indices, A, J, Q and K, in both. `tests/test_i18n.py`
fails if a text has no German or the placeholders differ. The name on the home screen is Kings
Corner in both languages.

## Run it

```bash
python3 -m http.server 8000 -d web          # the app in a browser: http://localhost:8000
python3 -m http.server 8790                 # the design boards: http://localhost:8790/design/boards.html
```

**iOS.** Open `ios/KingsCorner.xcodeproj` and run, or build from the command line:

```bash
cd ios && xcodebuild -project KingsCorner.xcodeproj -scheme KingsCorner \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' -derivedDataPath build/dd build
```

The bundle ID is `com.kizmiz.kingscorner` and the team is the one Cambio Agents uses. The project
copies `../web` into the app as a folder, so a change to the web app reaches the next build.

**Android.** With Android Studio's JDK:

```bash
cd android && JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

The APK packs `../web` as its assets and serves them from `https://kitc.local/` inside the app (no
network). The application ID is `com.kizmiz.kingscorner`; release builds are signed with the debug
key until an upload key is set in `android/app/build.gradle.kts`.

## Train Nana

```bash
.venv/bin/pip install -e ".[dev]"
.venv/bin/python -m kitc.imitate --name bc-classic                    # 1. copy June
.venv/bin/python -m kitc.train --name p1 --init runs/bc-classic/checkpoints/best.pt \
    --lr 1e-4 --lr-end 3e-5 --ent-coef 0.003 --ent-end 0.001 --opponents june:0.5,snapshot:0.25,self:0.25
.venv/bin/python -m kitc.policy runs/p1/checkpoints/best.pt web/agents/nana-classic.bin
.venv/bin/python -m kitc.evaluate web/agents/nana-classic.bin --deals 5000
```

Every decision is one step: a turn is a chain of plays and pile moves ending with "end turn", and
the only reward is the result at the end of the game, +1 for a win, -1 for a loss and 0 for a tie.
Each learner seat's decisions form their own chain for GAE, so the result lands on that seat's last
move.

From scratch, PPO found Ray's game (play everything) within a few million decisions and stalled at
21% against June: her edge is in what she doesn't play, and a final +1/-1 teaches that slowly. So
Nana first copies June (`kitc/imitate.py`: 1.5 million of June's decisions, 91% matched on held-out
ones, 44% wins against her), and PPO then starts from there against June, earlier snapshots of
itself and itself. The observation (`kitc/encoding.py`, 873 numbers) spells out what June reasons
about: for each card in hand, how many piles it fits, whether playing it opens a place for cards the
others may hold or covers one, and how many unseen cards have somewhere to go.

`--variant demons` trains for Devils in the Corner, `--players 2:0.5,3:0.25,4:0.25` mixes table
sizes, and `--eval-players 2,4` evaluates at each size and keeps the checkpoint with the best mean
edge (win rate times players). `runs/<name>/metrics.jsonl` has every number.

## Tests

```bash
.venv/bin/python -m pytest
```

The tests check the rules and the stuck-game ending, that every card is always somewhere, that a
seat's observation doesn't change when cards it can't see do, the devils' powers, and that the
app's JS engine replays Python games move for move: legal moves, observations, June's choices,
devil powers, results and Nana's move scores. They need `node` for the JS part.

The family can't see your cards. `tests/js_hidden.mjs` checks the bots the app runs (June, and Leo
and Nana with the shipped weights) at two to four players in both games: in each position it deals
every other hand and the stock out again at random, the same counts in each, and the bot has to
make the same move. Over 5,500 decisions, none changes; a test bot that peeks changes two moves in
three. They read their own hand, how many cards the others hold, the table and the size of the
stock. Holding cards back is their strategy, not knowledge: an empty side or a fresh place to
play helps whoever moves next, so they keep cards that would open one.

Match play has its own checks (`tests/js_match.mjs`): the points, exactly 50 dropping to 25, over 50
losing, ties, Kamikaze in both engines and through a saved game, and the scores turned for each
Wi-Fi seat.

## License

All rights reserved: the source is public to read, not to reuse (see `LICENSE`). Fonts: Bodoni Moda
and Atkinson Hyperlegible Next, under the SIL Open Font License (`web/fonts/`).

The app's support page and privacy policy are in `docs/`, published with GitHub Pages at
[kizmiz.github.io/kings-in-the-corner](https://kizmiz.github.io/kings-in-the-corner/).
