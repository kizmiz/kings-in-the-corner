# App Store listing, version 1.0

Everything to paste into App Store Connect, field by field. The limits are App Store Connect's;
`python3 design/appstore/check_listing.py` counts every field against them.

## App information

| Field | Value |
| --- | --- |
| Primary category | Games: Card, with Family as the second subcategory |
| Price | Free |
| Age rating | 4+ (answer None or No to every question; see the notes below) |
| Copyright | 2026 Kizmiz |
| App Privacy | Data Not Collected |
| Support URL | https://kizmiz.github.io/kings-in-the-corner/ |
| Privacy Policy URL | https://kizmiz.github.io/kings-in-the-corner/privacy/ |

## Screenshots

Seven of each, from the app in the simulator (`shoot.py`), numbered in upload order. One set per
slot is enough: App Store Connect scales each down for the smaller sizes in its family.

| Folder | App Store Connect slot | Size | |
| --- | --- | --- | --- |
| `iphone-6.3/` | iPhone with Dynamic Island (medium display) | 1206 × 2622 | Required |
| `iphone-6.9/` | iPhone with Dynamic Island (large display) | 1320 × 2868 | Optional |
| `ipad-13/` | iPad 13" display | 2064 × 2752 | Required: the app runs on iPad |
| `iphone-duo-cover/` | iPhone Duo, outer display | 1398 × 2034 | Optional until April 2027; earns the "optimized for iPhone Duo" badge |
| `iphone-duo-inner/` | iPhone Duo, inner display | 2007 × 2853 | Same |

## Header and search results

Two optional images, shown on iOS 27 and iPadOS 27: a wide header at the top of the product page,
and a card that replaces the screenshot strip in search results. In App Store Connect: Product Page
Information, Header and Search Results. Upload each language's own pair, leave "Use header asset in
search results" off (the search card is its own image), and check the crops in Preview. Apple
reviews each one.

| File | Placement | Size | Words |
| --- | --- | --- | --- |
| `creative/header-en.png` | Product page header | 3840 × 1646 | Pull up a chair. |
| `creative/search-en.png` | Search results | 3840 × 2560 | Kings go in the corners. |
| `creative/header-de.png` | Product page header (German) | 3840 × 1646 | Setz dich dazu. |
| `creative/search-de.png` | Search results (German) | 3840 × 2560 | Könige in die Ecken. |

They're drawn from `art.html` with the app's own cards and portraits
(`playwright-cli run-code --filename=.playwright-cli/creative.js`). iPhone shows only the middle of
each: everything that matters sits inside the art-safe area of Apple's templates, and outside it is
only more table. `creative/guides/` has copies with that area outlined, for checking; don't upload
those.
<!-- The safe areas, from Apple's Sketch template as measured by blakecrosley.com: header 1646 x 661
     at (1097, 493); search 2168 x 1030 at (836, 765). -->

## English (U.S.)

### Name (30)

```
Kings in the Corner
```

If the name is taken, `Kings in the Corner: Family` also fits.

### Subtitle (30)

```
Classic card game, 2–4 players
```

### Promotional text (170)

```
New: Match to 50. Play hand after hand and keep score; land on exactly 50 to drop back to 25. Hold ace to king in one hand and you win on the spot.
```

### Keywords (100)

```
solitaire,crazy eights,rummy,offline,wifi,multiplayer,family,devils,cards,deck,ai,grandma,patience
```

### Description (4000)

```
Kings in the Corner is the family card game, on a green felt table. Four piles make a cross, kings start the corners, and every card goes down on one a rank higher of the other color. Play everything you can, end your turn, and be the first to play your last card.

Play against the family
Five computer players sit at the table, from easy to expert:
• Pip is just learning and plays almost at random
• Uncle Ray plays every card he can
• Aunt June thinks every turn through, and holds cards back
• Cousin Leo and Nana learned the game by playing it against themselves, over and over. Nana beats Aunt June seven games in ten.
They see only their own cards, just like you. Pick who sits down, from one to three of them.

Play each other on Wi-Fi
One phone hosts a table and the others on the same Wi-Fi join it, each on their own phone. No account, no internet. Empty seats go to the family, and if someone has to leave, Aunt June takes their cards so the rest play on. The host chooses whether the play aid is allowed and how long each turn gets.

Two games
• Kings in the Corner, the classic.
• Devils in the Corner: the kings become devils. Play a red devil into a corner and you trade your whole hand with a rival. Play a black devil there and the sides are dealt out again.

Match to 50
Play hand after hand and keep score. Go out and you score nothing; everyone else counts the cards they hold, face cards 10 and aces 1. Go over 50 and you lose. Land on exactly 50 and you drop back to 25. And if you ever hold ace to king, one of each, it's Kamikaze: you win the match outright.

Your way
• The play aid raises the cards you can play and lights up where they go. Turn it off to play from memory.
• Undo a card you didn't mean to play.
• Four-color suits, so no two suits share a color.
• Large card corners for easier reading.
• A left-handed layout, with End turn under your thumb.
• Choose how quickly the others play, and tap the table to hurry them along.
• Your games are kept: close the app and pick up where you left off.
• In English and German.

Free, with no ads, no in-app purchases and no sign-in. Nothing you do in the game leaves your phone.
```

### App Review notes (4000)

```
No account or sign-in. The whole game, including the computer players, runs on the device and works offline.

To play alone: Play, choose the game and who sits down, then Deal.

To play on Wi-Fi you need two devices on the same Wi-Fi network:
1. On the first device: Play on Wi-Fi, then Host a table. Choose the play aid and turn timer.
2. On the second device: Play on Wi-Fi, then Join a table, and pick the table.
3. On the first device: Deal.
iOS asks for Local Network access the first time. It is used only to find and connect to tables on the same network (Bonjour service _kitc._tcp); nothing is sent to the internet. If you have only one device, everything else in the app can be reviewed alone.

Match to 50 is a scoring mode with no wagering of any kind. The app has no ads, no purchases, no analytics and no tracking.
```

## German (Deutsch)

The app already speaks German, so the listing can too. The screenshots fall back to the English ones.

### Name (30)

```
Kings in the Corner
```

### Untertitel (30)

```
Kartenspiel für die Familie
```

### Werbetext (170)

```
Neu: Partie bis 50. Spiel Runde um Runde und zähl die Punkte; wer genau 50 erreicht, fällt auf 25 zurück. Ass bis König auf der Hand? Dann gewinnst du sofort.
```

### Schlüsselwörter (100)

```
karten,könige,ecke,patience,solitär,rommé,mau mau,wlan,offline,teufel,mehrspieler,klassiker
```

### Beschreibung (4000)

```
Kings in the Corner ist das Kartenspiel für die ganze Familie, auf grünem Filz. Vier Stapel bilden ein Kreuz, Könige eröffnen die Ecken, und jede Karte kommt auf eine um einen Rang höhere der anderen Farbe. Leg, so viel du kannst, beende deinen Zug, und wer zuerst seine letzte Karte ausspielt, gewinnt.

Gegen die Familie
Fünf Mitspieler sitzen am Tisch, von leicht bis stark:
• Pip lernt noch und spielt fast zufällig
• Onkel Ray legt jede Karte, die er kann
• Tante June denkt jeden Zug durch und hält Karten zurück
• Cousin Leo und Nana haben das Spiel gelernt, indem sie es immer wieder gegen sich selbst gespielt haben. Nana schlägt Tante June in sieben von zehn Spielen.
Sie sehen nur ihre eigenen Karten, genau wie du. Du wählst, wer mitspielt, einer bis drei.

Gegeneinander im WLAN
Ein Handy eröffnet einen Tisch, die anderen im selben WLAN setzen sich dazu, jeder auf seinem eigenen Handy. Kein Konto, kein Internet. Freie Plätze übernimmt die Familie, und wer gehen muss, dessen Karten übernimmt Tante June, damit die anderen weiterspielen. Wer den Tisch eröffnet, entscheidet über die Spielhilfe und die Zugzeit.

Zwei Spiele
• Könige in der Ecke, der Klassiker.
• Teufel in der Ecke: Aus den Königen werden Teufel. Ein roter Teufel in einer Ecke tauscht deine ganze Hand mit einem Gegner. Ein schwarzer Teufel dort verteilt die Seiten neu.

Partie bis 50
Runde um Runde, mit Punkten. Wer ausgeht, bekommt nichts; alle anderen zählen ihre Karten, Bildkarten 10, Asse 1. Wer über 50 kommt, verliert. Wer genau 50 erreicht, fällt auf 25 zurück. Und wer Ass bis König auf der Hand hat, jeden Rang einmal, ruft Kamikaze und gewinnt die Partie sofort.

Wie du willst
• Die Spielhilfe hebt die Karten an, die du legen kannst, und zeigt, wohin sie passen. Ohne sie spielst du aus dem Kopf.
• Rückgängig, wenn eine Karte danebenging.
• Vierfarbiges Blatt, damit keine zwei Farben gleich aussehen.
• Große Kartenecken zum leichteren Lesen.
• Linkshändig: „Zug beenden“ unter deinem Daumen.
• Wähle, wie schnell die anderen spielen, und tippe auf den Tisch, um sie anzutreiben.
• Dein Spiel bleibt erhalten: App schließen und später weiterspielen.
• Auf Deutsch und Englisch.

Kostenlos, ohne Werbung, ohne In-App-Käufe und ohne Anmeldung. Was du im Spiel tust, bleibt auf deinem Handy.
```

## Notes

- **Age rating.** The Wi-Fi tables show the name each player types to the others at the table, on
  the same network only. That isn't chat or user content shared with strangers, so the answers
  for messaging and user-generated content are No. Match scoring involves no wager, so simulated
  gambling is None.
- **No other platforms.** App Store metadata may not mention Android (guideline 2.3.10), so the
  text says "each on their own phone". The app shows its one line naming Android only in a
  browser, never in the iOS app.
- **No trademarks in keywords.** Other games' names (Uno and the like) are left out (guideline
  2.3.7). Crazy eights, rummy and solitaire are generic names of card games.

## Privacy policy and support

Both pages are in `docs/`, published with GitHub Pages, each in English with German below (`#de`):

- Support URL: https://kizmiz.github.io/kings-in-the-corner/ (German: `…/#de`)
- Privacy Policy URL: https://kizmiz.github.io/kings-in-the-corner/privacy/ (German: `…/privacy/#de`)

They're self-contained, in the app's own look (`docs/style.css`, the app's fonts in `docs/fonts/`),
and send people to the studio's Impressum for the address and how to reach us.
