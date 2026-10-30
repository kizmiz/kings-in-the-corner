# Mobile Card Game UI Polish: Layout and Affordances (portrait phone, Kings in the Corner)

Research date: 2026-10-29. Much of the store-listing and review material is 2016-2025. Hearthstone phone-UI material is from 2015. Older items are marked. Where a figure is my own arithmetic rather than a published number, it is under "Inferences".

---

## 1. How leading mobile card games size cards and lay out a hand on a portrait phone (card width, fan overlap, 10+ cards)

### Takeaway
None of the target studios (Microsoft Casual Games, MobilityWare, Brainium, Mattel163, Playstack/LocalThunk, Tinytouchtales) publish card dimensions in pt/dp, so no measured "card width" exists in public sources. The patterns that are documented: hands overlap and compress as they grow. Large hands (about 10-13 or more) are a known pain point on phones (MTG Arena, Board Game Arena). The best-known fix on phones is a collapsed hand that shows only the top of each card and zooms when tapped (Hearthstone phone, 2015). Balatro mobile is landscape-only, so it is not a portrait model.

### Cited Findings
**Screen geometry (the real constraint)**
- iPhone portrait widths in points: iPhone 16 = 393 x 852, 16 Plus = 430 x 932, 16 Pro = 402 x 874, 16 Pro Max = 440 x 956. Older: 13/12 mini = 375 x 812, SE 2nd/3rd gen = 375 x 667, SE 1st gen = 320 x 568 — [Use Your Loaf](https://useyourloaf.com/blog/iphone-16-screen-sizes/)
- Portrait safe-area insets: top 59 pt (16/16 Plus) or 62 pt (16 Pro/Pro Max); bottom 34 pt on all four 16-series models (home indicator) — [Use Your Loaf](https://useyourloaf.com/blog/iphone-16-screen-sizes/)
- The iPhone 16 viewport of 393 x 852 is about 153 points per inch (3x density), so 1 pt is about 0.166 mm — [YesViz iPhone 16](https://yesviz.com/devices/iphone-16/)

**Hand layout precedents**
- Hearthstone phone version (2015): the hand sits along the bottom edge with only the top half of each card visible. Tapping the hand opens a zoomed-in view, and holding a card shows full details. Reviewers called it an extra step but a reasonable fit for a small screen. The main compromise: the expanded hand covers most of the play field. The phone layout also moved the hand toward the corners and used enlarged numbers for mana and minion health — 2015 launch coverage, e.g. [TrustedReviews](https://www.trustedreviews.com/news/hearthstone-now-available-on-iphone-and-android-smartphones-2928657), [KitGuru](https://www.kitguru.net/gaming/apps-software/matthew-wilson/hearthstone-has-finally-arrived-for-smartphones/), [Initial Charge](https://initialcharge.net/2015/04/hearthstone-iphone-2/), [PhoneArena](https://www.phonearena.com/news/Blizzard-finally-releases-critically-acclaimed-Hearthstone-game-for-phones---Android-and-iOS_id68264) (taken from search snippets; I could not tell which outlet wrote which sentence)
- Hearthstone, later complaints: an iPhone 12 user reported the bottom of the screen cut off their hand cards (a safe-area and notch problem). A user on a Huawei phone said the tablet layout made buttons and cards too small to tap — [Blizzard forums: cards cut off on iPhone 12](https://us.forums.blizzard.com/en/hearthstone/t/i-cant-see-my-cards-on-iphone-12-they-are-cut-off/122958); [Blizzard forums: tablet vs phone UI](https://us.forums.blizzard.com/en/hearthstone/t/how-to-change-tablet-ui-to-phone-ui/1186); [Blizzard forums: card text too small](https://us.forums.blizzard.com/en/hearthstone/t/the-card-description-txt-is-too-small/131526)
- MTG Arena (player feedback): the hand "starts to become increasingly difficult to manage around 10-12 cards". Cards at the far left and right of a big hand "don't even appear". Players proposed a searchable pile for large hands instead of a fan. On mobile, permanents overlap at the screen edge because the layout does not rescale — [MTG Arena feedback: Arena Mobile Space Issues](https://feedback.wizards.com/forums/918667-mtg-arena-bugs-product-suggestions/suggestions/42739007-arena-mobile-space-issues); [MTG Arena feedback: Graveyard UI](https://feedback.wizards.com/forums/918667-mtg-arena-bugs-product-suggestions/suggestions/50607086-graveyard-ui-update)
- Board Game Arena (bug/feature report): on iPad and mobile, a 13-card hand does not fit in one row. The user asks for partial overlap "like holding physical cards" — [BGA #25494](https://boardgamearena.com/bug?id=25494)
- Colonist.io players filed a feature request to improve the card-holder UI when a hand has too many cards — [Colonist feature upvote](https://colonist.featureupvote.com/suggestions/128260/improve-card-holder-ui-when-too-many-cards)
- Common web/JS hand pattern: cardsJS has a "fan" layout (each card rotated and overlapped, with a curvature setting and a lift on hover/selection) and a standard layout whose spacing value sets overlap (1 = no overlap) — [cardsJS fiddle](https://cdn.jsdelivr.net/npm/cardsJS@1.1.1/fiddle.html)
- UNO (older Uno smartphone version, PocketGamer review): "tapping on your cards fans them out", then you double-tap to play or slide a card onto the pile. The reviewer noted lag, with cards moving "a split-second after" the gesture — [PocketGamer Uno smartphone review](https://www.pocketgamer.com/uno-smartphone/review/) (older title, not the current Mattel163 app)
- An older Nuvo mobile Uno review: cards "while legible, are small and cramped together" — [GameSpot Uno review](https://www.gamespot.com/reviews/uno-review/1900-6132094/) (old, different product)

**Balatro mobile (portrait status)**
- No portrait mode at launch. A developer representative confirmed this, and players noted the game was designed for landscape from the start — [TouchArcade, Feb 2024](https://toucharcade.com/2024/02/21/balatro-mobile-release-on-the-cards-post-launch-developer-confirms/)
- 148apps calls the lack of a portrait mode "a letdown" — [148apps review](https://148apps.com/balatro/review)
- Engadget: on foldables the game does not use the extra vertical space. Text is "generally easy to read" but "sometimes less so on tiny devices" — [Engadget](https://www.engadget.com/gaming/balatro-is-an-almost-perfect-mobile-port-163050971.html)
- I found no 2025-2026 announcement of a portrait mode for Balatro. Pocket Tactics reported players accidentally selling Jokers while rearranging cards because of the "slightly cramped mobile UI" — [Pocket Tactics](https://www.pockettactics.com/balatro/mobile-release) (from a search snippet; the page returned 403 when fetched)

**Card Crawl / Marvel Snap**
- Card Crawl (Tinytouchtales, Berlin; Arnold Rauers): solitaire-like, survive a 54-card deck dealt one hand at a time, playing cards into your hand or onto yourself — [World of Playing Cards](https://wopc.co.uk/blog/card-crawl-ios-mobile-dungeon-crawl-card-game); [TouchArcade 2014](https://toucharcade.com/2014/11/03/card-crawl-will-shuffle-up-some-card-based-roguelike-gameplay-soon/)
- Marvel Snap was built as a "mobile-first game" — [PC Gamer](https://www.pcgamer.com/marvel-snap-is-the-first-game-from-former-hearthstone-director-ben-brodes-new-studio). Ben Brode stresses a "bite-size" design small enough to build a whole deck on a phone — [Guardian via inkl](https://www.inkl.com/news/i-craved-a-bite-size-experience-ben-brode-on-the-making-of-marvel-snap)

### Inferences
- **Solitaire card width anchor (arithmetic):** Klondike needs 7 tableau columns side by side. On a 393 pt-wide phone that leaves at most about 393/7 ≈ 56 pt per column including gaps, so a card is about 48-52 pt wide after gutters. On a 375 pt SE or mini it is about 46-50 pt. Big portrait solitaire apps are therefore working with cards roughly 7.5-8.5 mm wide (at 0.166 mm/pt). This is my derivation, not a published measurement.
- **Kings in the Corner hand math (usable width = 393 − 2×16 gutter = 361 pt; card width W = 64 pt; exposed sliver s; hand width = (n−1)·s + W):**
  - 7 cards: s ≤ 49.5 pt (fits a 44 pt sliver comfortably).
  - 10 cards: s ≤ 33 pt (above Apple's 28 pt minimum, below 44 pt).
  - 15 cards in one row: s ≤ 21 pt (below Apple's 28 pt minimum). On a 375 pt SE or mini it drops to about 20 pt.
  - 15 cards in two rows (8 + 7): s ≤ 42 pt, close to 44 pt.
  - So one row works up to about 9-10 cards. Above that, switch to two rows, a tap-to-expand or zoom hand (Hearthstone pattern), or a scrollable or compressed fan. An arc fan saves little horizontal space but lets the raised or selected card pop up clearly.
- With a standard playing-card aspect ratio (assumed about 1.4:1), a 64 pt card is about 90 pt tall. Two hand rows plus a raise-on-select offset take about 200-230 pt of height, plus the 34 pt bottom inset. That leaves about 500+ pt for the centre cross and the opponent strips on a 393 x 852 phone.
- Centre cross: a 3x3 grid of 8 piles plus a centre draw pile fits in 361 pt with cards about 56-64 pt wide and 16-24 pt gaps. If the piles show a fanned run (offset toward the outside of the cross), the corner piles need diagonal or outward offset room, which favours slightly smaller centre cards than hand cards.
- Opponents (up to 3) on the top, left and right edges should be compact avatars with a card-count badge, not fanned card backs. Space is too tight for fanned backs on a phone, and the side edges are hard thumb zones anyway (see Q5).

### Gaps
- No published pt/dp card widths or overlap percentages for Microsoft Solitaire Collection, MobilityWare Solitaire, Brainium, Spades Plus, UNO! (Mattel163), Balatro or Card Crawl. Measuring them would need screenshots of the apps.
- I could not verify how the current UNO! (Mattel163) app handles hands of 10+ cards (scrolling vs compression). The current US App Store listing did not describe it.
- I could not verify whether Card Crawl is portrait and one-handed, or how its card sizes are set. No postmortem was found; a Card Thief design blog is said to exist but was not located.
- Marvel Snap's portrait layout and hand size were not covered in any fetched source.
- I found no source describing the hand layout of any Spades or Hearts app (13-card hand) in detail.

---

## 2. Tap-to-play vs drag-and-drop vs both; how legal destinations are shown (highlights, auto-move, hints)

### Takeaway
Leading apps offer both: tap (single-tap auto-move, or tap-to-select then tap a destination) and drag. Several make the mode a setting. Microsoft Solitaire Collection's "Single Tap to Move" is opt-in and off by default on Windows. MobilityWare advertises "tap or drag". A Hearts app exposes "Drag & Drop or Click". Legal-move cues seen in shipped games: highlighting playable hand cards (UNO!), highlighting the destination square (Spades Deuces Wild), unlimited hints, and "Show Me How To Win" or auto-complete in solitaire. Players complain when a single tap moves the wrong card, or when hints and auto-complete are bad or slow.

### Cited Findings
- **Microsoft Solitaire Collection (Windows):** a "Single Tap to Move" option was added under Menu > Game options. It is not on by default — [OnMSFT](https://onmsft.com/?p=251101)
- **MobilityWare Solitaire (iOS):** "Tap or drag cards to arrange them…". Custom settings: "Play right or left-handed, portrait or landscape". Also "Unlimited hints and Undos" and a "Show Me How To Win" feature — [App Store listing](https://apps.apple.com/us/app/solitaire/id359917414)
- A 2017 MobilityWare reviewer: "the ability to use the hint button is a big help". Another asked for "a visible button to show you how to solve a game" — [App Store listing reviews](https://apps.apple.com/us/app/solitaire/id359917414)
- MobilityWare Spider Solitaire advertises "tap to move for quick gameplay" and right or left hand play — [App Store: Spider Solitaire](https://apps.apple.com/app/id1620202619)
- **Brainium Solitaire:** "intuitive tap-and-drag" controls, unlimited free hints and undos, auto-complete. One user said the hint button suggests "ridiculous moves"; Brainium apologised and said it was improving hints. The same user said auto-complete moves each card one at a time even when the game is already solved — [App Store: Brainium Solitaire](https://apps.apple.com/au/app/solitaire/id479280326)
- Reviewers of other solitaire apps wanted a single tap to move the card they tapped, not move a different card onto it, and wanted faster auto-complete — from App Store review snippets for other solitaire apps found in the same search (e.g. [Solitaire ++](https://apps.apple.com/us/app/solitaire/id447555850)); exact app attribution not verified
- **Spades Deuces Wild:** "You can either double tap or slide the card to the square highlighted to play your selected card" — [App Store](https://apps.apple.com/us/app/id1484289905)
- **A Hearts app (Spark/MWM listing):** a settings entry "Card Movement: Drag & Drop or Click" — [MWM: Hearts - Card Game](https://spark.mwm.ai/en/apps/hearts-card-game/1074758468)
- **UNO! (Mattel163):** a store listing snippet says "playable cards are highlighted each round so you don't waste seconds scanning your hand" — [App Store (regional listing)](https://apps.apple.com/lb/app/id1344700142?l=ar-eg). The current US listing I fetched did not contain this line, so the wording may be older — [App Store US](https://apps.apple.com/us/app/uno/id1344700142)
- **UNO & Friends** (older Gameloft title): "you just need to drag a card to the deck to play it". Round timers are frustrating when they end with everyone down to one or two cards — [Common Sense Media](https://www.commonsensemedia.org/app-reviews/uno-friends)
- **Balatro mobile:** Engadget praises how "easy [it is] to drag and drop objects wherever you want". Moving cards by touch is "inherently satisfying", like Hearthstone and Marvel Snap — [Engadget](https://www.engadget.com/gaming/balatro-is-an-almost-perfect-mobile-port-163050971.html). 148apps says the controls "track your finger as if it was a mouse cursor" — [148apps](https://148apps.com/balatro/review). The App Store lists "remastered controls for touch screen devices" — [App Store: Balatro](https://apps.apple.com/gb/app/balatro/id6502453075)
- Hearthstone phone (2015): a two-step model, tap the hand to zoom, then pick a card — see Q1 sources.
- **Accessibility angle:** drag gestures are harder than taps for many users. Apple's "Mobility" guidance focuses on comfortable tap targets and spacing (see Q3) — [Apple HIG Accessibility](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/accessibility.json)

### Inferences
- In Kings in the Corner, a card can often go on more than one pile (several foundations or corners, or a King into any empty corner). Pure single-tap auto-move is then ambiguous and risks the "moved the wrong card" complaint. A strong default:
  1. Tap a hand card: it raises, and the legal piles glow (outline or tint on valid piles, dim the others).
  2. Tap a glowing pile: the card is placed.
  3. Optional setting "auto-play when only one legal move" (the equivalent of MSC's opt-in Single Tap to Move).
  4. Drag-and-drop always works too. On release, the drop snaps to the nearest legal pile within a generous radius.
- Also highlight which hand cards are currently playable (the UNO! pattern). Dim unplayable cards rather than hiding them.
- Tap-select-then-confirm makes mis-taps cheap (selecting the wrong card costs nothing), which offsets the low accuracy near the bottom edge (Q5). Drag gives the tactile pleasure reviewers praise in Balatro and Hearthstone.
- Hints: offer them, but make them sensible. The worst-rated hint behaviour is suggesting pointless moves (Brainium review). An idle-time nudge that pulses a playable card after a few seconds is a lighter-weight option (my suggestion, not seen in sources).

### Gaps
- No controlled data (accuracy or speed) comparing tap and drag in card games was found. Evidence is reviews and store listings only.
- I could not confirm whether Microsoft Solitaire Collection on iOS/Android exposes the same "Single Tap to Move" toggle, or how its mobile hints are drawn (an arrow or a card glow, for example).
- Balatro's exact touch scheme (tap cards to raise or select, then Play Hand or Discard buttons; drag to reorder) is widely known but was not confirmed in a fetched source.
- No designer postmortem (Brainium, MobilityWare, Microsoft) on tap vs drag was found.

---

## 3. Minimum touch-target guidance and how overlapping cards satisfy it

### Takeaway
Apple: default 44x44 pt and minimum 28x28 pt on iOS. Padding of about 12 pt around bezelled elements, about 24 pt around unbezelled ones. Google/Material: 48x48 dp (about 9 mm) with 8 dp or more between targets. Hoober's field data: about 7 mm is enough in the screen centre, but about 12 mm is needed at the edges and corners. In an overlapped hand, the narrow exposed sliver is the binding constraint, since the card is tall. Games get around it by extending the touch area beyond the visual sliver, raising the selected card, or expanding the hand on tap.

### Cited Findings
- **Apple HIG (Accessibility > Mobility):** iOS/iPadOS default control size 44x44 pt, minimum 28x28 pt (watchOS 44/28; visionOS 60/28; tvOS 66/56; macOS 28/20) — [Apple HIG Accessibility](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/accessibility.json)
- Apple: "Consider spacing between controls as important as size… add about 12 points of padding around elements that include a bezel. For elements without a bezel, about 24 points of padding works well around the element's visible edges" — [Apple HIG Accessibility](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/accessibility.json)
- **Android / Material:** targets at least 48x48dp, "separated by 8dp of space or more". 48 dp is "about 9mm, regardless of screen size", and the recommended range is 7-10 mm. Touch targets may "extend beyond the visual bounds" (a 24 dp icon padded to 48 dp). Google notes that very small, close-together buttons cannot always be expanded without their touch regions overlapping — [Android Accessibility Help: touch target size](https://support.google.com/accessibility/android/answer/7101858?hl=en)
- **Hoober (2017, UXmatters):** targets can be as small as about 7 mm in the centre of the screen but need about 12 mm in the corners. Suggested sizes contain 95% of observed taps, and "People never tap precisely where they mean to". Specify targets in physical units, not pixels. Assume about ±20% variation and test. Put dangerous or unrelated items far from other targets — [UXmatters: Design for Fingers, Touch, and People, Part 1](https://www.uxmatters.com/mt/archives/2017/03/design-for-fingers-touch-and-people-part-1.php)
- Hoober also says the old ISO 22x22 mm standard is no longer relevant to capacitive touch. Capacitive screens report a single centroid point, so contact-patch size does not affect accuracy — [UXmatters Part 1](https://www.uxmatters.com/mt/archives/2017/03/design-for-fingers-touch-and-people-part-1.php)
- Swipe areas should be at least 45 px tall and wide to avoid accidental triggers — [Smashing Magazine: The Thumb Zone](https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/)

### Inferences
- **Conversions on an iPhone 16 (about 0.166 mm/pt):**
  - 44 pt ≈ 7.3 mm (matches Hoober's centre figure).
  - Hoober's 12 mm edge/corner figure ≈ 72 pt.
  - Apple's 28 pt minimum ≈ 4.6 mm.
  - So a hand row hugging the bottom edge needs more forgiving targets than the centre cross does.
- **Overlapped-hand strategies:**
  - (a) The hit box of each sliver is the full card height (about 90 pt) times the sliver width. Height is never the problem; width is.
  - (b) Keep slivers at 44 pt or more for 7-9 cards. Never go below about 28 pt: use two rows or expand-on-tap instead (see Q1 math).
  - (c) Resolve ambiguous taps to the card whose visible centre is nearest the touch point, not strictly the top-most z-order card.
  - (d) Raise the touched card on touch-down, and commit only on release or a second tap. A finger can then slide along the hand to "scrub" to the right card, a common pattern in shipped card games, though not confirmed in a source here.
  - (e) Pile targets in the centre cross can use the whole pile footprint plus padding, so 56-64 pt-wide piles comfortably exceed 44 pt.
- Keep End Turn, Draw and similar buttons at least 12-24 pt (Apple padding guidance) from the hand cards, and keep tap targets out of the bottom 34 pt home-indicator inset.

### Gaps
- I could not fetch Material Design 3's own page (it renders client-side). The figures above come from Google's Android accessibility help page, which is consistent with M3's 48 dp rule.
- No source documents how any specific card game sizes the hit area of overlapped cards.

---

## 4. Card-face legibility at small sizes (jumbo index, simplified faces, index-to-width ratio, contrast, app options)

### Takeaway
Physical "jumbo index" decks keep the card size but enlarge the corner rank and suit. They are quicker to read and helpful for ageing eyes, at the cost of smaller court art. Large-print bridge decks advertise indexes about 50% larger. On phones, many solitaire apps for older players market "jumbo" or large cards with high-contrast fonts. Balatro ships a "High Contrast Cards" option that makes suits easier to tell apart. Apple's text floor is 11 pt (default 17 pt), and WCAG AA contrast is 4.5:1 for text up to 17 pt. I found no published index-to-width ratio for any app.

### Cited Findings
- Jumbo index cards are the same overall size as a standard deck, with much larger corner numbers and pips. Buyers note "they're regular size but much larger font". Players say jumbo indexes are easier to read from the ends of a long table and for "aging eyes" — search summary of retailer and forum pages, e.g. [Pokerchipforum thread](https://www.pokerchipforum.com/threads/poker-size.110229/); [Old Vegas Chips: Regular vs Super Index](https://oldvegaschips.com/1cardfaces.htm)
- Trade-off: one forum poster prefers regular index for games where you hold many cards. Smaller indexes leave larger face-card images, and regular index is better for one-handed holding — [Pokerchipforum](https://www.pokerchipforum.com/threads/poker-size.110229/)
- Large-print bridge decks advertise indexes about 50% larger. These are distinct from physically oversized cards — [Bicycle large print (retailer listing)](https://www.desertcart.co.za/products/4480541-bicycle-large-print-bridge-size-playing-cards-easy-to-read) (retailer claim)
- **Balatro mobile:** a "High Contrast Cards" option "makes it easier to tell suits apart" — [Engadget](https://www.engadget.com/gaming/balatro-is-an-almost-perfect-mobile-port-163050971.html). Readability is "sometimes less so on tiny devices" — same source.
- Hearthstone phone (2015) enlarged key numbers (mana, health) for the phone UI — [KitGuru](https://www.kitguru.net/gaming/apps-software/matthew-wilson/hearthstone-has-finally-arrived-for-smartphones/) (search snippet). Players still complained that card description text was too small — [Blizzard forums](https://us.forums.blizzard.com/en/hearthstone/t/the-card-description-txt-is-too-small/131526)
- **Large-card solitaire apps (marketing claims):**
  - Vita Solitaire: a "Jumbo Card" display with high-contrast fonts and oversized faces, plus a colourblind mode — [MWM: Vita Solitaire for Seniors](https://mwm.ai/apps/vita-solitaire-for-seniors/6446669987)
  - Big Card Solitaire: shows a large copy of the card being moved on top, and a layout to "reduce finger stretching" — [App Store](https://apps.apple.com/us/app/-/id1549387337)
  - Also Solebon Solitaire for Seniors ([App Store](https://apps.apple.com/us/app/solitaire/id1230169843)), Senior Games Solitaire ([App Store](https://apps.apple.com/us/app/id1477878734)) and Spider Solitaire Large Cards ([App Store](https://apps.apple.com/app/id6751708554))
- MobilityWare: a third-party directory lists "large card options" alongside left/right-handed play and portrait/landscape — [MWM: Solitaire](https://mwm.ai/apps/solitaire/359917414) (third-party, unverified). The official listing mentions custom card faces and backs but not card size — [App Store](https://apps.apple.com/us/app/solitaire/id359917414)
- **Apple type floor:** iOS default 17 pt, minimum 11 pt. Let people enlarge text by at least 200%. Use larger sizes for thin-weight fonts — [Apple HIG Accessibility](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/accessibility.json)
- **Apple contrast:** 4.5:1 for text up to 17 pt; 3:1 for 18 pt and up or bold. Offer a higher-contrast scheme when Increase Contrast is on, and check both light and dark mode — [Apple HIG Accessibility](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/accessibility.json)

### Inferences
- In an overlapped hand only the left sliver (about 21-49 pt, see Q1) is visible, so the corner index is the whole card as far as the player is concerned:
  - Use a jumbo-style index: rank stacked above the suit, both bold.
  - Sized so "10" (the widest rank) fits the minimum sliver width minus about 4 pt of margin.
  - For a 64 pt card, a bold rank about 18-22 pt tall (about 30% of card width), with a suit pip about 14-16 pt, keeps well above Apple's 11 pt floor. At 18 pt and up it qualifies for the 3:1 large-text contrast threshold, though 4.5:1 is safer on a felt background.
- Simplify the faces: large corner index plus a big central suit pip or simple court glyph, instead of full pip arrays or detailed court art. Hand cards are only ever seen as slivers, and centre-cross piles at about 56 pt are too small for detail.
- Offer a 4-colour-suit or high-contrast option (the Balatro precedent), so spades and clubs or hearts and diamonds are not told apart by shape alone at small sizes. This also covers colourblind players (Vita Solitaire precedent).
- Offer a "large cards" toggle. It is clearly expected in the solitaire category and widely marketed to older players. In Kings in the Corner it could trade the two-row hand for a scrollable one.

### Gaps
- No published index-height-to-card-width ratios for Microsoft Solitaire Collection, MobilityWare or Brainium.
- I could not confirm whether Microsoft Solitaire Collection (mobile) has a card-size or large-print option. None was found.
- Evidence that large-card modes improve accuracy or readability is marketing only. No independent testing was found.

---

## 5. One-handed reach and thumb zones on tall phones (where End Turn, Undo and similar belong)

### Takeaway
Hoober's observation data: about 75% of touches come from one thumb, but fewer than 50% of people hold the phone one-handed (36% cradle it, 10% hold in one hand and tap with the other). People prefer to read and tap in the centre of the screen. His recommendation: primary content in the centre, secondary actions along the top and bottom edges, tertiary functions in corner menus, and dangerous actions kept away from frequent targets. Thumb-zone write-ups put primary actions in the natural (lower-middle) zone and warn against top-corner controls.

### Cited Findings
- Hoober (2017): 75% of touches use only one thumb. Fewer than 50% hold the phone with one hand, 36% cradle it, and 10% hold in one hand and tap with a finger of the other. Users prefer the centre of the screen and do not scan from top-left to bottom-right as on desktop. The data covers about 1,300 public-space observations plus 651 in schools, offices and homes, and a cited study of over 120 million touch events — [UXmatters Part 1](https://www.uxmatters.com/mt/archives/2017/03/design-for-fingers-touch-and-people-part-1.php)
- Hoober's placement advice: primary content in the centre; secondary actions (tabs, action buttons) along the top and bottom edges; tertiary functions in menus launched from corners; dangerous or unrelated items far from other targets — [UXmatters Part 1](https://www.uxmatters.com/mt/archives/2017/03/design-for-fingers-touch-and-people-part-1.php)
- Hoober's original 2013 study: 1,333 observations (Nov 2012 - Jan 2013), reported as 49% one-handed use — [UXmatters 2013](https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php). The 2013 (49%) and 2017 (<50%) figures are consistent. The widely quoted "75% thumb-driven" figure is attributed to Josh Clark in [Smashing Magazine](https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/), but Hoober's 2017 article also reports 75% one-thumb touches.
- Later commentary says Hoober has warned that his early thumb-zone illustrations were misread as rigid constraints, and that reach varies with stance and posture — [Parachute Design (secondary)](https://parachutedesign.ca/blog/thumb-zone-ux/)
- Smashing Magazine (2016): frequent actions belong in the easy-to-reach natural zone and infrequent ones in hard-to-reach zones. Top-corner close buttons conflict with the thumb zone, so prefer a bottom close button. Users swipe from the edge toward the middle, so keep swipe gestures out of hard-to-reach areas — [Smashing Magazine](https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/)
- MobilityWare offers a "Left Handed Mode" (Settings > Accessibility) that mirrors the layout, documented for Monopoly Solitaire — [MobilityWare Helpshift](https://mobilityware.helpshift.com/hc/en/49-monopoly-solitaire/faq/4123-how-do-i-change-the-card-layout-to-left-handed). The classic Solitaire app offers right or left-handed play — [App Store](https://apps.apple.com/us/app/solitaire/id359917414)
- Big Card Solitaire markets a layout that "reduce[s] finger stretching" — [App Store](https://apps.apple.com/us/app/-/id1549387337)

### Inferences
- **Proposed Kings in the Corner layout on a 393 x 852 pt phone, top to bottom:**
  - Top safe area (59-62 pt).
  - Opponent strip: the across opponent at the top, side opponents as small badges at the left and right edges in the upper-middle. These are view-only, which suits the hard-to-reach zone.
  - Centre cross with the draw pile, in Hoober's preferred centre zone. It is the main target area and needs about 7 mm or 44 pt targets, which piles easily exceed.
  - Action bar (End Turn, Draw, Undo, Hint).
  - Hand (one or two rows).
  - Bottom safe area (34 pt).
- Put the primary action (End Turn or Draw) as a large button just above the hand, toward the dominant-thumb side. Mirror it with a left-handed setting (the MobilityWare precedent).
- Put Undo and Hint as secondary buttons on the same bar, spaced 12-24 pt or more from End Turn.
- Put Settings, Menu and Quit in a corner (tertiary). Never place an irreversible action such as End Turn or Skip right beside hand cards or a frequent button (the Balatro "Skip" mis-tap; Hoober's "keep dangerous items far away" advice).
- The hand sits at the bottom edge, where accuracy is lowest (about 12 mm needed near corners). That argues for tap-select-then-confirm and generous slivers (see Q2 and Q3).
- Because 36% of people cradle the phone, horizontal reach across the full 393-440 pt width is usually fine. The top quarter is the true problem zone on tall phones, so keep nothing interactive and time-critical up there.

### Gaps
- No card-game-specific thumb-zone study was found.
- I found no newer (2023-2026) Hoober data specific to 6.7-6.9" phones, beyond the general caveats.

---

## 6. Common polish details players praise or complain about

### Takeaway
Praised: satisfying drag with finger-tracking, light haptics on tap, select and deal (Balatro), unlimited undo and hints, "show me how to win" or auto-complete, left/right-hand and orientation options, high-contrast cards. Complained about: mis-placed buttons that cause irreversible accidental taps (Balatro's pack Skip; Jokers sold while rearranging), cramped UI on small phones, input lag, bad hints, slow one-card-at-a-time auto-complete, single-tap moving the wrong card, cut-off cards on notched phones, and above all intrusive ads (30-60 s between deals; ad X buttons that open the browser).

### Cited Findings
- **Balatro haptics and feel:** light force feedback when tapping cards, pressing buttons and receiving a hand — [Shacknews](https://shacknews.com/article/141549/balatro-mobile-impressions). Reviewers called iPhone 15 Pro haptics use "satisfying" — [iPhone in Canada](https://www.iphoneincanada.ca/2024/09/25/balatros-ios-android-release). A user review on the App Store praises "great tactile touch controls and use of haptics" — [App Store: Balatro](https://apps.apple.com/gb/app/balatro/id6502453075)
- **Balatro accidental taps:** the Skip button in pack opening is badly placed. The Engadget reviewer often hit it by accident and skipped Jokers and Spectral cards he needed — [Engadget](https://www.engadget.com/gaming/balatro-is-an-almost-perfect-mobile-port-163050971.html). Players accidentally sold Jokers while rearranging because the UI is cramped — [Pocket Tactics](https://www.pockettactics.com/balatro/mobile-release) (snippet only)
- **Uno smartphone (older):** lag, with cards moving "a split-second after you've slid your finger or double-tapped" — [PocketGamer](https://www.pocketgamer.com/uno-smartphone/review/)
- **UNO & Friends:** round timers that end a near-finished round frustrate players — [Common Sense Media](https://www.commonsensemedia.org/app-reviews/uno-friends)
- **Solitaire hints and auto-complete:** Brainium hints suggest "ridiculous moves", and auto-complete plays cards one at a time even when the game is solved — [App Store: Brainium Solitaire](https://apps.apple.com/au/app/solitaire/id479280326). MobilityWare users value the hint button and want a visible "solve" button — [App Store: MobilityWare](https://apps.apple.com/us/app/solitaire/id359917414)
- **Ads (dominant complaint in MobilityWare reviews):**
  - Waiting "30-60 seconds between deals just to close out of the ad" (2025).
  - The X appears only after a delay; tapping the X can open the ad in the browser (2020).
  - "30 second commercials that you can't turn off".
  - The developer says ads should be closable after a short timer.
  - The subscription removes ad interruptions and banners.
  - Source: [App Store: MobilityWare Solitaire](https://apps.apple.com/us/app/solitaire/id359917414)
- **Microsoft Solitaire Collection:** a $1.99/month subscription removes ads (2016) — [Windows Central](https://www.windowscentral.com/microsoft-brings-solitaire-collection-android-and-ios). An automated (AI-generated) review summary claims the rating fell from 4.7 to 3.9 because of ad and technical complaints, including forced ad audio — [Marlvel.ai](https://marlvel.ai/api/llm/apps/games/microsoft-solitaire-collection) (low-reliability source; treat cautiously)
- **Daily challenge UI:** a MobilityWare reviewer found it "hard to see the crowns with or without jewels" (small low-contrast status icons) — [App Store: MobilityWare](https://apps.apple.com/us/app/solitaire/id359917414)
- **Notch and safe area:** Hearthstone hand cards were cut off at the bottom on iPhone 12 — [Blizzard forums](https://us.forums.blizzard.com/en/hearthstone/t/i-cant-see-my-cards-on-iphone-12-they-are-cut-off/122958)
- **Large-hand management:** MTG Arena hands of 10-12 or more get hard to manage, and edge cards disappear — [MTG Arena feedback](https://feedback.wizards.com/forums/918667-mtg-arena-bugs-product-suggestions/suggestions/42739007-arena-mobile-space-issues)
- **Big Card Solitaire:** shows a large copy of the dragged card so the finger does not hide it — [App Store](https://apps.apple.com/us/app/-/id1549387337)

### Inferences
**Polish checklist for Kings in the Corner, drawn from the above:**
1. Light haptic on select, place and illegal-drop.
2. Invalid drops animate back; never commit an illegal or ambiguous move.
3. Undo for the current turn's moves at least, since Kings in the Corner turns are a series of plays before ending.
4. Confirm or hold-to-end-turn only if End Turn is near the hand. Otherwise rely on spacing.
5. Show a large copy of, or offset, the dragged card so the thumb does not hide its index.
6. Make auto-play animations fast and skippable (avoid the one-at-a-time auto-complete complaint).
7. A hint that shows a genuinely useful legal move.
8. Respect safe areas (no cut-off hand).
9. Avoid ad interruptions mid-session. If ads are used, put them between games with an immediate close.
10. Keep status icons such as card counts and turn indicators high-contrast.
11. Keep opponent turns brisk, with an optional speed setting (the Spades listing mentions animation-speed settings: [App Store: Spades - Classic Card Game](https://apps.apple.com/app/id1523297725)).

### Gaps
- I found no Reddit threads from r/solitaire, r/balatro or r/gamedesign with substantive tap-vs-drag or accidental-tap discussion. Searches returned mostly store pages, and one r/iosgaming thread on Balatro's small UI returned 404 via the mirror.
- No developer postmortem or GDC talk from Brainium, MobilityWare or Microsoft Casual Games on mobile card UX was found.
- No LocalThunk interview on mobile UI decisions was found.
