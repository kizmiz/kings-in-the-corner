# Make Every Card Legible, Forgiving and Paced

Kings in the Corner will feel polished through clarity, forgiveness and pacing rather than added "juice": every card readable and easy to hit at phone size, every move reversible and hard to get wrong, and every move, especially an AI's, slow and clear enough for a grandparent or a seven-year-old to follow. Concretely, draw hand cards about **64 pt wide with a jumbo corner index**, keep exposed slivers at **44 pt or more up to seven cards** and never below Apple's **28 pt** floor, and switch to two rows at 11 cards. Make **tap-to-select, tap-to-place** the default with drag as an equal option, and mark legal piles with a **solid gold ring edged by a dark keyline** instead of a soft glow. Respond to touch within **100 ms**, fly the player's own cards in **250–400 ms** on a decelerating curve, and stage each AI move as a **roughly one-second beat** with a caption, a history tray and tap-to-skip. Keep haptics rare and route them through native code (iOS WebKit has no vibration API), make sound obey the silent switch and never carry a signal alone, and have the timer scale its warning to the host's setting (10, 15 or 30 s), pause during animations, offer "+30 s" and "Off", and simply end the turn at zero, which is painless here because standard rules never force a play. No major card studio publishes card sizes or animation timings, so these values are derived from Apple, Android and WCAG specifications, Material motion tokens and shipped-game precedent, and they should be tuned in playtests rather than treated as measured optimums. A large share of the polish also lives in the native shell: Android WebViews older than about version 140 misreport safe areas, Android 16 removes the edge-to-edge opt-out and `onBackPressed`, and iOS WKWebView still caps animation at 60 fps.

## A 64-point card fits seven comfortable slivers, so plan a second row

On a portrait phone, width is the binding constraint. An iPhone 16 is **393 pt wide**, the 16 Pro Max 440 pt, and the 13 mini and SE 375 pt; in portrait the top safe area takes **59–62 pt** and the home indicator **34 pt** ([Use Your Loaf](https://useyourloaf.com/blog/iphone-16-screen-sizes/)). One point is about 0.166 mm on an iPhone 16 ([YesViz](https://yesviz.com/devices/iphone-16/)), which makes Apple's **44×44 pt default target about 7.3 mm** and its **28×28 pt minimum about 4.6 mm** ([Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)). Android asks for **48×48 dp (about 9 mm) with at least 8 dp between targets**, and lets touch areas extend beyond an element's visible edges ([Google Accessibility Help](https://support.google.com/accessibility/android/answer/7101858?hl=en)). Steven Hoober's field observations add the key nuance: about 7 mm is enough in the middle of the screen, but targets near edges and corners need about **12 mm (roughly 72 pt)**, because "people never tap precisely where they mean to" ([UXmatters](https://www.uxmatters.com/mt/archives/2017/03/design-for-fingers-touch-and-people-part-1.php)). The hand sits on the bottom edge, the least accurate zone of the phone, so that is where forgiveness has to be designed in.

With 16 pt side gutters the usable width is 361 pt, and a hand of *n* overlapped cards of width *W*, each showing a sliver *s*, needs (*n*−1)·*s* + *W* points. For a 64 pt card (about 90 pt tall at the standard 1.4 aspect ratio) that formula sets the breakpoints below. They are worked out from the screen sizes, not measured from any shipped app, because none publishes its card dimensions; on a 375 pt phone every sliver loses about 2 pt.

| Cards in hand | Widest sliver possible on a 393 pt phone | Layout to use |
|---|---|---|
| 1–7 | 49 pt or more | One row; every sliver meets Apple's 44 pt default |
| 8–10 | 42 → 33 pt | One row, compressed; still well above the 28 pt floor |
| 11–16 | One row would fall to 30 → 20 pt | **Two rows** (for example 8 over 7), which restores slivers of 42 pt or more |
| 17–22 | Two rows: 37 → 30 pt | Two compressed rows |
| 23+ | Below 28 pt even in two rows | Tap to expand the hand, or let it scroll |

Other games show the trouble starting around ten cards. MTG Arena players say a hand gets "increasingly difficult to manage around 10-12 cards" and that cards at the edges stop appearing ([MTG Arena feedback](https://feedback.wizards.com/forums/918667-mtg-arena-bugs-product-suggestions/suggestions/42739007-arena-mobile-space-issues)), and Board Game Arena users report that a 13-card hand will not fit on one row on phones ([BGA bug 25494](https://boardgamearena.com/bug?id=25494)). Hearthstone's phone port collapses the hand and zooms it on tap, at the cost of covering most of the play field ([TrustedReviews](https://www.trustedreviews.com/news/hearthstone-now-available-on-iphone-and-android-smartphones-2928657)). That trade-off is wrong for Kings in the Corner, where every decision means comparing your hand with eight piles; two rows keep both in view. A player who cannot play still draws every turn, so a long hand is a normal state, not an edge case.

Height is never the problem with an overlapped card, since each sliver is a target roughly 90 pt tall; width is, so the hit-testing has to be generous. Send an ambiguous touch to the card whose visible centre is nearest the finger rather than to whichever card is on top. Raise the touched card on touch-down so a finger can slide along the hand to the right card before lifting, and commit only on release, which WCAG's **2.5.2 Pointer Cancellation** requires anyway ([W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)). Never re-lay out the hand while a finger is down. The Game Accessibility Guidelines ask that elements needing accuracy stay stationary ([GAG full list](https://gameaccessibilityguidelines.com/full-list/)), so re-spread the hand only after the touch ends.

In an overlapped hand only the left sliver shows, so the corner index is effectively the whole card. Use a **jumbo index**: a bold rank stacked above the suit, with the rank about **18–22 pt tall (about 30% of card width)** and the suit about 14–16 pt, sized so a "10" fits inside the narrowest sliver with about 4 pt to spare. That is well above Apple's **11 pt minimum (17 pt default)**, and at 18 pt or bold it qualifies for Apple's 3:1 large-text contrast threshold ([Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)). Other games have already done this. Microsoft Solitaire Collection added a Jumbo theme with "big bold lettering and numbering" ([OnMSFT](https://onmsft.com/?p=41176)); Guy Barker's accessible solitaire offers one large suit symbol and rank in place of the small corner symbols, which looked alike ([Barker case study](https://www.linkedin.com/pulse/case-study-building-multi-platform-accessible-solitaire-guy-barker-zwlxe)); and Balatro ships "High Contrast Cards" to make suits easier to tell apart ([Engadget](https://www.engadget.com/gaming/balatro-is-an-almost-perfect-mobile-port-163050971.html)). Simplify the faces to the big index plus one large central pip or a simple court glyph, since detailed court art is invisible at 56–64 pt. Then add a **Large cards** setting that trades the two-row hand for one row that scrolls sideways, a feature solitaire apps already sell to older players, such as Vita Solitaire's "Jumbo Card" display ([MWM](https://mwm.ai/apps/vita-solitaire-for-seniors/6446669987)).

Hoober found that **75% of touches come from one thumb, but fewer than half of people hold the phone one-handed and 36% cradle it**, and that people prefer to read and tap in the centre. His placement advice is primary content in the middle, secondary actions along the top and bottom edges, tertiary functions in corner menus, and dangerous controls far from frequent targets ([UXmatters](https://www.uxmatters.com/mt/archives/2017/03/design-for-fingers-touch-and-people-part-1.php)).

On a 393×852 pt phone, that puts the opponents at the top, in table order. The player across the table sits at the top edge and side opponents become small badges on the left and right edges. Each opponent is an avatar with a card-count badge rather than a fan of card backs: they are view-only, and the top of a tall phone is the hardest zone to reach.

The central cross comes next, a 3×3 grid of 56–64 pt cards with 16–24 pt gaps, squarely in Hoober's preferred centre zone. Fan each pile slightly outward so both its base card and its top card can be read. Kings in the Corner lets a whole pile move when its base card fits on another pile, so the base matters as much as the top. On the SE, which is 185 pt shorter than an iPhone 16, shrink the cross toward 56 pt rather than shrinking the hand.

Below the cross sits the action bar. A large End Turn button goes just above the hand on the dominant-thumb side and carries the timer bar, as Marvel Snap's does. Undo and Hint are secondary buttons **12–24 pt** away, per Apple's padding guidance, and Settings goes in a top corner. Mirror the whole bar for left-handers, as MobilityWare's Left Handed Mode does ([MobilityWare Help](https://mobilityware.helpshift.com/hc/en/49-monopoly-solitaire/faq/4123-how-do-i-change-the-card-layout-to-left-handed)). The hand comes last, above the bottom inset.

Never put an irreversible button next to the hand. Balatro's badly placed Skip button repeatedly made Engadget's reviewer skip cards he needed ([Engadget](https://www.engadget.com/gaming/balatro-is-an-almost-perfect-mobile-port-163050971.html)). And respect the bottom inset: Hearthstone players on an iPhone 12 found their hand cards cut off ([Blizzard forums](https://us.forums.blizzard.com/en/hearthstone/t/i-cant-see-my-cards-on-iphone-12-they-are-cut-off/122958)).

## Tap-to-select should lead, and legal piles should light up in two tones

Leading card apps support both tapping and dragging, and several let players choose. Microsoft Solitaire Collection added "Single Tap to Move" as an option that is **off by default** ([OnMSFT](https://onmsft.com/?p=251101)). MobilityWare advertises "Tap or drag" ([App Store](https://apps.apple.com/us/app/solitaire/id359917414)), and one Hearts app has a "Drag & Drop or Click" setting ([MWM](https://spark.mwm.ai/en/apps/hearts-card-game/1074758468)). Kings in the Corner argues against making one-tap auto-move the default. A card often has several legal homes: a 7♥ can go on either of two black eights, and a King can go to any empty corner. Auto-move would have to guess.

The default should be **tap-to-select, tap-to-place**. Tapping a hand card lifts it about 16 pt with a double outline; every legal pile lights up and everything else dims. Tapping a lit pile sends the card there, and tapping the card again or empty felt cancels. Selecting the wrong card costs nothing, which makes up for the poor accuracy at the bottom edge. Offer "Play automatically when only one move is legal" as an opt-in, as Microsoft did.

Drag stays a full alternative. The card lifts when the drag starts and follows the finger exactly, riding offset above the thumb or showing an enlarged index so the thumb doesn't hide it. Big Card Solitaire shows a large copy of the dragged card for the same reason ([App Store](https://apps.apple.com/us/app/-/id1549387337)). On release the card snaps to the nearest legal pile within a generous radius, and springs home from any illegal or ambiguous drop. This satisfies WCAG 2.2's **2.5.7 Dragging Movements**, which requires a non-drag way to do anything a drag can do ([W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)).

Keep two gestures out of the core flow. Barker rejected double-tap-to-select because it delays the response to a single tap, and he found long-press unreliable once cards had moved between piles ([Barker case study](https://www.linkedin.com/pulse/case-study-building-multi-platform-accessible-solitaire-guy-barker-zwlxe)). His Accessible Solitaire app also removed its press-and-hold card zoom as "unreliable" ([App Store](https://apps.apple.com/us/app/accessible-solitaire/id6737259014)). Spades Deuces Wild still lets players double-tap or slide a card onto a highlighted square ([App Store](https://apps.apple.com/us/app/id1484289905)), but in a game where tapping selects, a double-tap only adds delay.

Moving a whole pile uses the same pattern: tap the base card to pick up the pile, then tap the destination. The draw at the start of each turn is compulsory, so do it automatically. Show the card flying from the stock and highlight it briefly in the hand. That removes a tap with no decision in it, and it simplifies what happens on timeout.

Show legal moves at both ends of the move. UNO! highlighted playable hand cards "so you don't waste seconds scanning your hand" ([App Store](https://apps.apple.com/lb/app/id1344700142?l=ar-eg)), though that wording may come from an older listing. Spades Deuces Wild highlights the destination. Three hand-card states cover it:

| Hand card state | Treatment |
|---|---|
| Playable | Full colour, raised about 6 pt |
| Not playable | Dimmed but still at least 3:1 contrast, and not raised; dim rather than hide |
| Selected | Raised about 16 pt, double outline |

Light the destination piles with a ring and, optionally, a small check or arrow glyph.

The ring needs careful drawing. WCAG **1.4.11 Non-text Contrast** requires **3:1 against adjacent colours** for graphics needed to understand content ([W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)). The ratios below were computed with the WCAG formula against a sample felt colour, `#35654D`; re-measure them with the real palette.

| Highlight colour | Contrast | Result |
|---|---|---|
| Bright gold `#FFD700` on felt | **4.80:1** | Passes |
| Metallic gold `#D4AF37` on felt | 3.20:1 | Barely passes |
| Dark gold `#B8860B` on felt | 2.07:1 | Fails |
| Bright gold where the ring meets a white card face | **1.40:1** | Fails |

A soft translucent glow blends into the felt and loses even more contrast. Draw instead a **solid 2–3 px bright-gold ring with a 1–2 px near-black or navy keyline between the ring and the card**. This is the double-outline pattern the Xbox Accessibility Guidelines cite from *For Honor*. The same guidelines ask that contrast on a textured background be measured against its "lowest contrasting area" ([XAG 102](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102)).

Undo every move within the current turn, because a Kings in the Corner turn is a run of plays before End Turn, and solitaire players value unlimited undo and hints ([App Store: MobilityWare](https://apps.apple.com/us/app/solitaire/id359917414)). In a LAN game, show an undo on the other phones as a visible reverse move so spectators never see a card silently vanish. Hints should be opt-in and genuinely useful. Brainium drew complaints when its hint button suggested "ridiculous moves", and when its auto-complete played out an already solved game one card at a time ([App Store: Brainium](https://apps.apple.com/au/app/solitaire/id479280326)). A lighter alternative is an idle nudge that outlines one playable card after a few seconds of inactivity.

## Answer touches in 100 ms, fly cards in 300 ms, give AI moves a full second

### Platform motion tokens fill the gap card studios left

Blizzard, Second Dinner, LocalThunk and Microsoft have not published their animation timings, and their GDC talks have no accessible transcripts, so the usable numbers come from the platforms.

**Material 3 durations** run from 50 ms to 1000 ms in 50 ms steps, and its decelerating `emphasizedDecelerate` curve is `cubic-bezier(0.05, 0.7, 0.1, 1.0)` ([Flutter motion.dart](https://raw.githubusercontent.com/flutter/flutter/master/packages/flutter/lib/src/material/motion.dart)). Material's spring tokens use damping 0.9 and stiffness 700 for standard movement, and **damping 1.0, which never bounces, for colour and opacity** ([androidx StandardMotionTokens](https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/StandardMotionTokens.kt)).

Apple's spring guidance starts from "When you're not sure, use a spring with bounce 0." About 15% bounce feels brisk, 30% feels noticeably bouncy, and values above about 0.4 "may feel too exaggerated." Bounce suits "the end of a gesture", because springs carry the finger's speed into the animation ([WWDC23: Animate with springs](https://developer.apple.com/videos/play/wwdc2023/10158/)).

Steve Swink's *Game Feel* puts real-time response under about **100 ms** ([Liz England](https://lizengland.com/blog/review-game-feel-by-steve-swink/)). Apple asks for brief feedback animations and little motion on frequent interactions, and says "don't make people wait for an animation to complete" ([Apple HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion)).

The most-cited Balatro recreation adds card-specific values: a 1.15 scale on hover and 1.25 on select, 0.15 s overshoot tweens, and small rotation "punches" ([Mix and Jam CardVisual.cs](https://github.com/mixandjam/balatro-feel/blob/main/Assets/Scripts/CardVisual.cs)). It is a reconstruction, not LocalThunk's code.

Combined, these sources give a starting table:

| Event | Duration | Curve | Notes |
|---|---|---|---|
| Press or lift on touch-down | Starts under 100 ms, completes in 100–150 ms | Small overshoot (spring bounce about 0.15–0.2); scale 1.08–1.15 | The shadow grows with the lift |
| Your own card flying hand → pile | **250–400 ms (about 300)** | `cubic-bezier(0.05, 0.7, 0.1, 1.0)` | After a drag, use a spring that starts at the finger's release speed |
| Arrival settle | Inside the flight | Bounce 0.2 or less, on position only | Colour and opacity never bounce |
| Illegal drop returning home | About 250 ms | Spring, no bounce | Paired with an error haptic |
| Deal | 50–100 ms between cards | Decelerate | Vary timing ±10–20% so it reads as hand-dealt |
| Flip | 250–400 ms | Two halves: squeeze width to zero, swap the face, expand back | Save 500–800 ms flips for dramatic reveals |

CSS has no native springs, so use the cubic-bezier for scripted flights and a small JavaScript spring, or a precomputed `linear()` easing, for flights that start at release speed. Animate only `transform` and `opacity`. Treat **60 fps as the ceiling on iOS**, because WKWebView's `requestAnimationFrame` is still reported as capped at 60 Hz on ProMotion iPhones ([WebKit bug 294338](https://bugs.webkit.org/show_bug.cgi?id=294338)).

Restraint matters as much as the numbers. Hearthstone's team made cards tilt and rotate in flight and throw "puffs of dust" when they land ([The Escapist](https://www.escapistmagazine.com/blizzards-hearthstone-devs-talk-strategy-and-physicality/)), yet its sound team warns "there is a case of having too much sound in the game" ([Hearthstone blog](https://hearthstone.blizzard.com/en-us/blog/23964694)). Balatro, the benchmark for juicy card games, eventually shipped a Game Speed setting of 0.5x–4x ([Steam](https://steamcommunity.com/app/2379780/discussions/0/4201364375109001844/)) and a Reduced Motion toggle that removes "much of the 'juice'" ([PC Gamer](https://pcgamer.com/games/card-games/balatros-first-big-balance-patch-fiddles-with-fibonacci-and-makes-a-mod-to-odd-todd)). Apple says it plainly: "Don't add motion for the sake of adding motion" ([Apple HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion)). For a calm family game, keep three tiers:

| Tier | What belongs there |
|---|---|
| Always on, very small | A slight tilt in flight, drop shadows |
| Short punches | Lift and land |
| Rare, big moments | A King reaching a corner and, above all, the win; reserve any particles or screen shake for the win |

### AI turns need a narrator as well as an animation

Players dislike both extremes. An AI that moved the instant the player ended a turn "looked unrealistic and monotonous" ([Treehouse](https://teamtreehouse.com/community/android-timer-dialog)). Slow, unskippable per-card animations in Elder Scrolls Online's card mode were called tedious once the outcome was settled ([ESO forums](https://forums.elderscrollsonline.com/en/discussion/comment/8171712)). In Dead Man's Draw, AI sequences between turns stretched to about two minutes ([Dead Man's Draw forums](https://forums.deadmansdrawgame.com/468082/long-turn-times-inbetween-turns-1-cause-found-solution-suggested)).

Hearthstone keeps a history column with **red borders for the opponent's actions and blue for the player's** ([Hearthstone Wiki](https://hearthstone.wiki.gg/wiki/History)), though players criticised how few actions it remembers ([TheGameHaus](https://thegamehaus.com/esports/quality-of-life-ui-issues-in-hearthstone-and-how-to-fix-them/2017/05/25/)). Marvel Snap uses a glowing outline on a player's name to show who reveals first ([PCGamesN](https://www.pcgamesn.com/marvel-snap/who-reveals-first)). The Game Accessibility Guidelines list an adjustable game speed as a basic requirement ([GAG Basic](https://gameaccessibilityguidelines.com/basic/)). No source publishes tested millisecond values for AI pacing, so the script below is a synthesis to playtest.

| Beat (at 1×) | Duration | What the table sees |
|---|---|---|
| Handoff | About 300 ms | Turn indicator and timer ring move to Grandma's avatar |
| Thinking | 300–600 ms, randomised | A quiet "thinking" mark on her avatar |
| Draw | About 400 ms | A card back flies from the stock to her badge; her count goes up |
| Each play: reveal | About 150 ms | The card appears from her side of the screen and turns face-up |
| Each play: flight | 350–400 ms | A decelerating flight to the pile |
| Each play: hold | 300–500 ms | The pile keeps her accent-coloured outline; the caption updates |
| End of turn | About 300 ms | The indicator moves on |

That works out to **roughly 0.8–1.1 s per play**, so a three-play turn takes about four to five seconds. The asymmetry is deliberate. AI flights run slower than the player's own 300 ms flights, because players already know what they just did but must track what Grandma did. Direction shows ownership: cards always enter from the opponent's seat.

A persistent caption ("Grandma played 7♥ on 8♠") lets a distracted player catch up. Back it with a history tray covering at least the last full round, with each entry marked by the player's avatar as well as colour. Tapping anywhere skips to the end of the AI turn, and a **Game Speed** setting of 0.5×, 1× or 2× scales every beat. To avoid the Dead Man's Draw problem, shorten the beats progressively after the fourth play so no AI turn runs past about 6–8 s at 1×. Spectators' phones should stage a LAN human's moves the same way. If a fast player gets ahead of the animation queue, shorten the holds so nobody falls more than one move behind.

### Haptics belong to the player's own hands, routed through native code

Both platforms give the same advice. Apple says to use system patterns "according to their documented meanings", use them consistently, match their strength to the animation, "avoid overusing haptics" and make them optional, because "the best haptic experience is one that people may not be conscious of, but miss when it's turned off" ([Apple HIG: Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics)). Android says "less is more" and "given the choice of buzzy haptics or no haptics for touch feedback, choose no haptics," and puts a good key-click at **10–20 ms** ([Android haptics principles](https://developer.android.com/develop/ui/views/haptics/haptics-principles)). Android's `View.performHapticFeedback` **needs no VIBRATE permission and respects the user's touch-feedback setting** ([Android: Haptic feedback](https://developer.android.com/develop/ui/views/haptics/haptic-feedback)).

iOS WebKit does not implement `navigator.vibrate` ([caniuse](https://caniuse.com/mdn-api_navigator_vibrate)), so the JavaScript has to call native code: `UIFeedbackGenerator` on iOS, with `prepare()` called on touch-down to cut latency ([Apple: UIFeedbackGenerator](https://developer.apple.com/documentation/uikit/uifeedbackgenerator)), and `performHapticFeedback` on the WebView itself on Android. Done well, it pays off: reviewers singled out Balatro's light feedback when tapping cards, pressing buttons and receiving a hand ([Shacknews](https://shacknews.com/article/141549/balatro-mobile-impressions)). The map below gives selection ticks to choosing, impacts to physical contact and notifications to outcomes, following each platform's documented meanings ([Android HapticFeedbackConstants](https://developer.android.com/reference/android/view/HapticFeedbackConstants)).

| Event | iOS | Android (API level) | Rule |
|---|---|---|---|
| Card selected or picked up | Selection feedback | `VIRTUAL_KEY`; `DRAG_START` (34) once a drag begins | On touch-down |
| Dragged card enters a legal pile | Selection feedback | `GESTURE_THRESHOLD_ACTIVATE` (34), or `SEGMENT_TICK` | Once per new target, never continuous |
| Card lands on a pile | Impact, light | `CONFIRM` (30) | Timed to the frame where the card touches the pile, not to finger-up |
| King to a corner, or a whole pile moved | Impact, medium | `CONFIRM` (30) | A heavier event gets a stronger haptic |
| Illegal drop springs back | Notification, error | `REJECT` (30) | Once, with the return animation |
| Timer warning (active player's phone only) | Notification, warning | `CLOCK_TICK` (21) | Once at the threshold, once more at 5 s |
| Win | Notification, success, or a short Core Haptics pattern synced to the win sound | `CONFIRM`, or a composed effect that falls back to nothing | Never reuse the error pattern for good news |
| AI or remote moves, each dealt card, scrolling | None | None | The player did not cause these |

Put a Haptics toggle in settings, separate from the OS setting.

### Sound must obey the silent switch and never travel alone

Apple says people in silent mode expect "sound effects, game soundtracks, and other audible feedback" to stop. The **ambient** audio category respects the silent switch and mixes with whatever music the player already has playing, and the system volume always governs output ([Apple HIG: Playing audio](https://developer.apple.com/design/human-interface-guidelines/playing-audio)). Data on how many people play muted conflicts. A 2022 TapResearch survey found only **8%** of mobile gamers play with sound on ([TapResearch](https://blog.tapresearch.com/how-sound-preferences-impact-player-engagement)), while 2013 in-app analytics found **73%** with volume at 10% or higher ([TouchArcade](https://toucharcade.com/2013/11/05/73-of-mobile-gamers-play-with-the-sound-on/)). The two are a decade apart, and one is self-reported while the other was measured. Either way, the game must be fully understandable on mute, and Apple advises pairing audio cues with matching haptics ([Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)).

Hearthstone's team builds sound around fixed beats, "when you drag a card out of your hand and drop it into play", and decides "what should be heard when, or even not at all" ([Hearthstone blog](https://hearthstone.blizzard.com/en-us/blog/23964694)). A suitable palette for Kings in the Corner is a soft slide on pickup and flight, a crisp snap on landing, and a duller thunk for a snap-back. Add one riffle per shuffle and quiet deal ticks with ±3–5% pitch variation and a cap on how many overlap. Finish with a small chime when a King reaches a corner and a short flourish for the win. Play AI moves slightly quieter so the player's own actions stay on top.

A family game adds a problem single-device games never face: **four phones in one room**. Play each move's sound at full volume only on the mover's phone (the host's, for AI moves) and quietly or not at all on the others. Tick the timer only on the active player's phone. Otherwise the table fills with overlapping, slightly out-of-sync sound. Provide separate Music and SFX controls, which Apple's game guidance lists as "sound balance" ([Apple HIG: Designing for games](https://developer.apple.com/design/human-interface-guidelines/designing-for-games)). This research did not check whether WKWebView's web audio follows the app's native audio-session category, so verify silent-switch behaviour on a device or route sound effects through the native bridge.

## Scale timer warnings to the host's setting and let zero simply end the turn

Shipped games split into two display styles. Hearthstone hides its 75 s turn timer until a burning rope appears with about 20 s left ([Hearthstone Wiki: Turn](https://hearthstone.wiki.gg/wiki/Turn)). Marvel Snap shows a timer bar on its End Turn button and makes "the screen glow red" near the end ([Marvel Snap Help](https://marvelsnap.helpshift.com/hc/en/3-marvel-snap/faq/46-how-long-do-i-have-to-take-my-turn)). Board Game Arena takes the opposite approach and shows numeric clocks beside every name ([BGA Docs](https://en.doc.boardgamearena.com/Game_clock)).

Combine the two styles. A **proportional ring around the active player's avatar on every phone** lets the whole table see whose turn it is and roughly how much time is left. A **bar on End Turn on the active phone** puts the countdown where the thumb already is. Numeric seconds appear only during the warning window. A proportional ring reads the same at 30, 60 and 120 s, while a bare "120" looks intimidating.

Name the presets **Fast (30 s), Normal (60 s), Relaxed (120 s) and Off**. Catan's console edition offers Off, 40, 80, 120 and 160 s for private games ([Dovetail patch notes](https://profile.dovetailgames.com/live/catan-console-edition/articles/article/catan-console-edition-patch-notes4-web)). Default to Normal for games with other humans and to **Off for games against AI only**. Hearthstone's solo adventures are untimed ([Hearthstone Wiki: Turn](https://hearthstone.wiki.gg/wiki/Turn)), and Apple advises "minimize use of time-boxed interface elements" ([Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)).

Hearthstone's rope arrives with about 27% of the turn left. A fixed 20 s warning would take two-thirds of a 30 s turn, so scale it: **warn at 10 s or 25% of the setting, whichever is larger**. That gives warnings at 10, 15 and 30 s, close to Hearthstone's ratio. The rule is a synthesis; no source has tested warning thresholds.

Escalate through more than colour. At the threshold the ring shifts from calm to amber and thickens, and numeric seconds appear. In the last 5 s, soft ticks and one warning haptic play on the active phone only, while other phones show only the visual change. A screen reader announces the warning once rather than every second. Give timer sounds their own mute. Chess.com players keep asking for adjustable or louder low-time warnings ([Chess.com forum](https://www.chess.com/forum/view/site-feedback/adjustable-low-time-warning)).

| Setting | Amber warning at | "+30 s" chip shown from | At zero |
|---|---|---|---|
| Fast, 30 s | 10 s | 20 s left | Keep plays already made, end the turn |
| Normal, 60 s | 15 s | 20 s left | Same |
| Relaxed, 120 s | 30 s | 30 s left | Same; optional 15–30 s grace if a phone drops off |
| Off | None | None | A "Nudge" button for others after a long wait |

WCAG **2.2.1 Timing Adjustable** offers three ways to comply. Users can turn the limit off, adjust it across at least 10× the default, or be warned and given **at least 20 seconds to extend it with a simple action**; the extend route also requires allowing at least ten extensions ([W3C Understanding 2.2.1](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html)). The 30/60/120 range spans only 4×, so **the Off preset is what actually meets the standard**. A capped "I'm thinking, +30 s" chip shown at least 20 s before expiry is a fairness-preserving courtesy, not full compliance.

WCAG's auction example warns that extending a shared limit for one person is unfair. So give every player the same small allowance, for example two per game, and announce each use to the table ("Grandpa is thinking, +30 s"), echoing BGA's "I would like to think a little" link ([BGA Docs](https://en.doc.boardgamearena.com/Game_clock)). A host who wants to give one player extra time should do so openly in the lobby.

At zero, Hearthstone and Snap both end the turn automatically and keep what was already played ([Marvel Snap Help](https://marvelsnap.helpshift.com/hc/en/3-marvel-snap/faq/46-how-long-do-i-have-to-take-my-turn)). A developer who forced a random card play on timeout got pushback from a commenter who preferred simply passing the turn ([Photon forum](https://forum.photonengine.com/discussion/comment/40575/)).

Kings in the Corner avoids the auto-play debate entirely, because the draw is compulsory and already automatic, and every play after it is optional. When time expires, keep the plays already made, return any selected or half-dragged card to the hand, end the turn, and caption it: "Time's up: Sam's turn ended." The host should accept any move that arrives within **300–500 ms** after the deadline.

Escalate repeated timeouts gently. Hearthstone shrinks an idle player's next turn to about 7 s, Catan's public games replace a player with an AI after three strikes, and its private games use no strikes at all ([Hearthstone Wiki: Turn](https://hearthstone.wiki.gg/wiki/Turn); [Dovetail](https://profile.dovetailgames.com/live/catan-console-edition/articles/article/catan-console-edition-patch-notes4-web)). In a family game, after two or three consecutive timeouts with no action, offer the host "Let a bot play for Sam", and hand control back the moment Sam touches the screen. Never kick a player automatically or shorten their turn as a penalty.

The clock must never pay for animation. Riot admitted Legends of Runeterra's timers kept running during animations players couldn't control, and fixed it in Patch 2.2 ([Out of Games](https://outof.games/news/2454-runeterra-patch-22-will-include-an-improvement-to-turn-timers/)). Magic: Spellslingers players filed "Turn timer doesn't stop when playing a card" ([Wizards feedback](https://feedback.wizards.com/forums/925012-magic-spellslingers/suggestions/40554124-turn-timer-doesn-t-stop-when-playing-a-card)). Use **one clock per turn**, started only after the previous turn's replay and the automatic draw finish, and frozen during the deal and any host-initiated Pause. An undo gives no time back, so undo can't be used to stall, and a clock that expires mid-undo keeps the last committed state.

The host phone owns the clock and broadcasts an **absolute deadline, not seconds remaining** ([Roblox DevForum](https://devforum.roblox.com/t/client-timer-in-sync/111842/20)). Each deadline carries a turn ID so a stale message can't be applied after a reconnect. Each phone estimates its offset from the host's clock with a ping round-trip ([Photon forum](https://forum.photonengine.com/discussion/16515/how-can-i-get-or-create-a-real-time-clock-for-my-multiplayer-game)) and draws the countdown from a monotonic clock, reaching zero at or after the host's deadline and never before. A pause is just a new deadline message. This scales down Hearthstone's hidden "slush time" and Lichess's lag compensation ([Lichess forum](https://lichess.org/forum/lichess-feedback/lag-compensation-changes)). Players notice when sync fails: one BGA bug is titled "Timer suddenly jumping from a high positive time to negative time" ([BGA bug 146500](https://gl.boardgamearena.com/bug?id=146500)).

On a home LAN a "disconnect" is usually a phone that locked, which becomes likely when someone waits through three 120 s turns. Keep screens awake only while a game is running: on Android with `FLAG_KEEP_SCREEN_ON`, cleared afterwards ([Android: Keep the screen on](https://developer.android.com/develop/background-work/background-tasks/awake/screen-on)), and on iOS with the equivalent idle-timer setting, which this research did not verify.

When a phone does drop off, show "Sam's phone is away" and let the normal timeout fire, or allow a short grace in Relaxed mode. If the host goes away, pause the whole game with "Waiting for host", since the host phone is the server. On return, a phone fetches the deadline again rather than resuming its own countdown. Hearthstone, by contrast, never pauses for disconnects and allows 60 s to reconnect ([Hearthstone Wiki: Reconnection](https://hearthstone.wiki.gg/wiki/Reconnection_feature)), a competitive stance a family game doesn't need.

## Kings in the Corner's red-black rule makes redundant encoding mandatory

### Suits, contrast and highlights

Colour blindness affects "up to 10% of some populations". Apple's guidance is to keep colour but never make it the only cue, and to offer alternative schemes where colour carries meaning ([Apple: Differentiate Without Color Alone](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/differentiate-without-color-alone-evaluation-criteria)); the HIG names red-green as a hard pairing ([Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)). In Kings in the Corner colour is load-bearing, because cards build down in alternating red and black. There are three defences, in order of strength.

The strongest is legal-move highlighting itself. It runs the red-black check for the player, so a colour-blind player never has to judge colour to play correctly. That makes "Show legal moves" an accessibility feature that should be on by default.

The second is the large suit glyph, the strongest cue that doesn't depend on colour.

The third is an optional four-colour deck. The standard version (black spades, red hearts, green clubs, blue diamonds) dates to Mike Caro in 1992 and is popular in online poker, but its benefits are asserted rather than measured ([Wikipedia](https://en.wikipedia.org/wiki/Four-color_deck)). A live trial at EPT Malta drew mixed reactions: one pro found green hard to see under green light, and another found the green and blue too light ([Pokerfuse](https://pokerfuse.com/news/live-and-online/27528-four-color-decks-go-live-ept-malta/)). The standard scheme also breaks the red and black families the rule depends on. Kings in the Corner should use a **warm/cool variant** instead: red hearts and deep orange or magenta diamonds, black spades and deep-blue clubs. Offer it next to the card-style picker with a live preview, as Battlefield 2042 does for its colour presets ([XAG 102](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102)). Test every theme in Grayscale and in simulated protanopia and deuteranopia.

WCAG requires **4.5:1 for text (3:1 when large)** and **3:1 for graphics** ([W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)), and Apple applies 3:1 to bold text at any size ([Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)). Card ranks count as text; pips, highlights and focus rings count as graphics. These ratios were computed with the WCAG formula on sample colours, so re-measure them with the shipped palette:

| Colour pair | Computed ratio | Verdict |
|---|---|---|
| Red pips `#C8102E` on white | 5.88:1 | Passes for ranks and pips |
| Pure red `#FF0000` on white | 4.00:1 | Fails 4.5:1 for small rank text |
| Blue `#0057B8` / green `#008000` on white (four-colour) | 6.87:1 / 5.14:1 | Pass |
| Bright green `#00A651` on white | 3.19:1 | Fails for rank text |
| Red `#C8102E` on Devils felt `#5A0F0F` | 2.36:1 | Fails: never use red as a highlight or state colour in that theme |
| White card faces / gold on Devils felt | 13.9:1 / 6.6–9.9:1 | Pass |

Ship a **high-contrast table at 7:1**, as the Xbox guideline recommends. Microsoft Solitaire opens in such a mode when the system setting is on, with black cards outlined in bright green and white symbols on a black table ([XAG 102](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102)). Barker logged a low-contrast empty card slot as a real bug ([Barker case study](https://www.linkedin.com/pulse/case-study-building-multi-platform-accessible-solitaire-guy-barker-zwlxe)), so give Kings in the Corner's empty corner slots a 3:1 outline. No one has verified whether either WebView exposes iOS Increase Contrast through `prefers-contrast`, so read that setting through the native bridge.

### Text scaling needs a native bridge in both WebViews

Plan for **200% text**. WCAG 1.4.4 requires it, and Apple grants its Larger Text label only at 200%. Apple explicitly lets games "manage their own font sizes with an in-app setting", but apps can't rely on the system Zoom feature to qualify ([Apple: Larger Text criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/larger-text-evaluation-criteria)).

Neither WebView handles this cleanly. On iOS, `-apple-system-body` makes text follow Dynamic Type, but the shorthand overrides custom fonts, and setting `font-size` in the same rule breaks the link ([Use Your Loaf](https://useyourloaf.com/blog/using-dynamic-type-with-web-views/); [Apple Developer Forums](https://developer.apple.com/forums/thread/105571)). On Android, WebView applies the system font scale as text zoom unless the app calls `setTextZoom` ([Chromium code review](https://codereview.chromium.org/173943002)), and that zoom breaks fixed layouts ([Start Debugging](https://startdebugging.net/2026/09/fix-flutter-text-renders-off-screen-in-an-android-webview-with-font-scaling/)). Android 14 scales fonts up to 200% on a nonlinear curve ([Android 14](https://developer.android.com/about/versions/14/features)). The emerging `env(preferred-text-scale)` variable shipped in Chrome 138 on Android, but its behaviour inside WebView was described as "in flux", with a risk of double scaling, and WebKit has given no signal ([CSSWG explainer](https://drafts.csswg.org/css-env-1/explainers/env-preferred-text-scale.md); [blink-dev](https://groups.google.com/a/chromium.org/g/blink-dev/c/bZuQAcwcEig)).

The workable recipe is to call `setTextZoom(100)` on Android and pass `Configuration.fontScale` into CSS as a custom property, and on iOS to pass the Dynamic Type scale the same way, updating whenever it changes. Scale reflowing UI text continuously: menus, captions, history, scores and settings. Map the scale to **Normal, Large and Jumbo card-index presets**, because card faces are fixed-size game objects and continuous scaling would overflow them. Add in-game Text Size and Card Size settings as well. Apple's large-text rules ask apps to wrap rather than truncate and to stack elements that sit side by side, so at 200% opponent badges should put the name above the card count.

### Reduced motion should replace meaning, not delete it

iOS Reduce Motion and Android's "Remove animations" both reach web content as `prefers-reduced-motion`. Android supports it since Chrome 74 and WebView 74, and players can change it mid-session, so listen for changes ([web.dev](https://web.dev/articles/prefers-reduced-motion); [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)). Android WebView's behaviour across manufacturers' skins is unverified, so keep a native fallback: `UIAccessibility.isReduceMotionEnabled` on iOS and an animator duration scale of 0 on Android ([DEV: Android reduced motion](https://dev.to/eevajonnapanula/android-animations-and-reduced-motion-2em2)).

Apple's App Store criteria say to change parallax, blur, depth, spinning and ongoing motion. Where motion conveys meaning, "don't remove the animation entirely"; use "a dissolve, highlight fade, or color shift" ([Apple: Reduced Motion criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria)). The HIG adds: tighten springs, track gestures directly, and replace movement along any axis with fades ([Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)).

| Element | Under reduced motion |
|---|---|
| Card flights (yours, AI, deal) | Travel in 100–150 ms with no overshoot, or fade out at the source and in at the destination with a 150–250 ms highlight |
| AI moves | Keep the destination fade-in, the caption and the history entry; the meaning stays |
| Flip | Cross-fade from back to face |
| Dragging | Keep exact finger tracking |
| Pickup scale-pop, pulsing legal-move glow, idle nudge | Static outline and shadow change; static ring |
| Snap-back | A short fade home plus the haptic or a text cue |
| Shuffle, win cascade, confetti, screen shake, Devils-theme embers | Cut; show a static "You win" panel |

Expose an in-game Reduce Motion toggle that defaults to the OS setting and stays separate from Game Speed, as Balatro's two settings are.

### Screen readers need labels, a live region and on-demand summaries

Blind players can and do play these games, and value them: one AppleVis user "completed a game of solitaire for the first time in his life" ([AppleVis](https://www.applevis.com/comment/194482)). Accessible Solitaire announces cards as the player moves through them and announces the moves available after each play. It adds "Available moves" and "Game state" buttons and is fully playable with Voice Control and Switch Control ([App Store](https://apps.apple.com/us/app/accessible-solitaire/id6737259014)).

Barker puts selection state directly into each label, for example "10 of Clubs, selected, 3 of 5, In list Pile 3", because TalkBack would not announce it otherwise. He also warns that "too many custom announcements can make an app very hard to use" ([Barker case study](https://www.linkedin.com/pulse/case-study-building-multi-platform-accessible-solitaire-guy-barker-zwlxe)). The Hearthstone Access mod, built outside the game, kept breaking with patches until its developer ended support in 2022 ([PC Gamer](https://www.pcgamer.com/the-creator-of-a-popular-hearthstone-accessibility-mod-has-ended-support-for-it)). Accessibility bolted on from outside decays.

In a WebView, render cards and piles as real DOM buttons, or keep a parallel accessible DOM layer over a canvas. Label each card with its state and position, for example "7 of Hearts, playable, 3 of 9, your hand". Label each pile with what it accepts, for example "North pile, 8 of Spades on top, King of Clubs at the base, takes a red 7".

Announce game events through one polite live region, which WCAG 4.1.3 requires for status messages ([W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)). Batch each AI turn into one summary: "Grandma drew, played 7 of Hearts on 8 of Spades and King of Clubs to the top-left corner. Your turn, 3 playable cards." Reserve assertive announcements for "Your turn" and the timer warning. Offer on-demand buttons for Read table, Read my hand, Last moves and Available moves.

Budget for platform-specific fixes and test with blind players. Barker tested with at least 20 people and found Google's automated report "useful but not always right." How well VoiceOver and TalkBack keep up with rapid live-region updates inside WebViews remains unverified.

### Motor access means no drag-only, hold-only or precision-timing moves

WCAG 2.2 sets a **24×24 CSS px floor (44 px at AAA)**, platform targets remain 44 pt and 48 dp, and the tap flow above already covers 2.5.7 ([W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)). The Game Accessibility Guidelines ask that drag be "only a supplementary alternative", that held buttons be avoided, that precise timing not be essential, and that all settings be remembered ([GAG full list](https://gameaccessibilityguidelines.com/full-list/)). Android has a system "Touch & hold delay" setting for people who trigger long-presses by accident ([Google Accessibility Help](https://support.google.com/accessibility/android/answer/6006989?hl=en-GB)), so any long-press should use system timing passed through the bridge. A portrait lock conflicts with WCAG 1.3.4 Orientation for players whose devices are mounted. At minimum, support landscape on tablets, where Android 16 ignores orientation locks for apps targeting SDK 36 unless they declare themselves a game ([Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16)).

## The native shell decides whether the WebView feels native

Apple's game guidance supplies the core numbers: **44×44 pt controls (28 pt minimum) and 17 pt text (11 pt minimum)**, platform safe areas, and relative layouts that survive 16:10, 19.5:9 and 4:3 screens. It also says to let people play "as soon as installation completes", to take defaults from the player's accessibility settings, and to let players customise "type size… motion intensity, and sound balance" ([Apple HIG: Designing for games](https://developer.apple.com/design/human-interface-guidelines/designing-for-games)). With `width=device-width`, one CSS pixel equals one point on iOS, so those numbers carry straight into CSS.

Don't take over the screen edges from the system or hide the home indicator. Apple says, "Whenever possible, you should allow the system gestures to take precedence" ([Apple: preferredScreenEdgesDeferringSystemGestures](https://developer.apple.com/documentation/uikit/uiviewcontroller/preferredscreenedgesdeferringsystemgestures)). Keep the hand above the 34 pt inset instead.

iOS sheet conventions are one sheet at a time, a medium detent on iPhone, a grabber on resizable sheets, swipe-down to dismiss, and Done always paired with Cancel ([Apple HIG: Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)). Settings therefore belongs in a medium-height bottom sheet with a grabber at least 44 pt / 48 dp tall and toggles that apply instantly, so no Done/Cancel pair is needed. Round results belong in a modal that can't be swiped away, with "Play again" and "Home" buttons.

Android brings hard deadlines. Targeting SDK 35 forces edge-to-edge on Android 15 ([Android: Edge-to-edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge)). Targeting SDK 36 removes the opt-out entirely; `onBackPressed` is no longer called and `KEYCODE_BACK` is no longer sent ([Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16)). Register one `OnBackPressedCallback` whose enabled state mirrors a JavaScript "overlay open" flag, so back closes the topmost sheet first. Make back on the results screen go Home. At the root, disable the callback so the predictive back-to-home animation plays ([Android: Predictive back](https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture)). Copy Material's modal-sheet behaviour: a scrim, dismissal by tapping outside or dragging down, and a 48 dp handle ([MDC BottomSheet](https://github.com/material-components/material-components-android/blob/master/docs/components/BottomSheet.md)).

Safe areas are the subtlest Android trap. WebView passed insets to web content only when fullscreen from M136, and for all WebViews only from M144 ([Chromium: WebView insets](https://chromium.googlesource.com/chromium/src/+/main/android_webview/docs/insets.md)). Versions before about 140 report wrong `env(safe-area-inset-*)` values ([Capawesome](https://dev.to/capawesome/capacitor-edge-to-edge-safe-areas-the-complete-guide-k30)). So the shell should inject `--safe-area-inset-*` CSS variables from `WindowInsetsCompat`, with CSS such as `max(var(--safe-area-inset-bottom, env(safe-area-inset-bottom)), 8px)`. Never return `WindowInsets.CONSUMED`, which stops WebView forwarding insets, and don't also pad the WebView natively, which doubles the spacing.

| WebView problem | Fix |
|---|---|
| Tap delay | `width=device-width` plus `touch-action: manipulation` ([WebKit](https://webkit.org/blog/5610/more-responsive-tapping-on-ios/); [Chrome](https://developer.chrome.com/blog/300ms-tap-delay-gone-away)) |
| Grey tap flash | `-webkit-tap-highlight-color: transparent` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-tap-highlight-color)), replaced by a custom pressed state (scale 0.97 plus a shadow change) |
| Text selection and callouts on cards | `user-select: none` and `-webkit-touch-callout: none`, re-enabled on the name field ([Stable Money WebShell](https://stablemoney.in/engineering/webshell-making-web-content-feel-native)) |
| Rubber-banding and pull-to-refresh | `overscroll-behavior: none` plus native `scrollView.bounces = false`, because iOS support is partial ([caniuse](https://caniuse.com/css-overscroll-behavior); [WebKit bug 275947](https://bugs.webkit.org/show_bug.cgi?id=275947)); `OVER_SCROLL_NEVER` on Android |
| Name field zooms the page on iOS | Input font-size of 16 px or more ([Rick Strahl](https://weblog.west-wind.com/posts/2023/Apr/17/Preventing-iOS-Textbox-Auto-Zooming-and-ViewPort-Sizing)) |
| Keyboard covers the field | Position with `visualViewport` and don't consume keyboard insets natively; Android WebView resizes for the keyboard only from M139 ([Chromium](https://chromium.googlesource.com/chromium/src/+/main/android_webview/docs/insets.md)) |
| Pinch-zoom | Disable it only if the in-game Large cards and Text Size settings exist |
| White flash at launch | Hold the native splash screen until the WebView reports it is ready, and match background colours ([Android: Splash screens](https://developer.android.com/develop/ui/views/launch/splash-screen)) |

The same-Wi-Fi feature has its own permission rules. On iOS, traffic that starts inside WKWebView doesn't trigger the Local Network prompt, but native Bonjour or sockets do. Native networking needs `NSLocalNetworkUsageDescription`, `NSBonjourServices` and, for multicast, a special entitlement, and there is no API to show the prompt or to query whether access was granted ([Apple TN3179](https://developer.apple.com/documentation/technotes/tn3179-understanding-local-network-privacy)). Show a short primer ("Find family on this Wi-Fi") right before the first native discovery call, detect a denial from the network framework's error, and link to Settings. On Android, `NEARBY_WIFI_DEVICES` covers Wi-Fi Direct, Wi-Fi Aware, local-only hotspots and Wi-Fi round-trip-time ranging, not ordinary LAN sockets ([Android: Wi-Fi permissions](https://developer.android.com/develop/connectivity/wifi/wifi-permissions)), so don't request it unless the app uses those. Whether Android's network service discovery needs extra permissions was not verified.

## Conclusion

The game's own rules are its strongest design asset, and most of these recommendations follow from them. Alternating colours turn legal-move highlighting into colour-blind support. Optional plays let a timeout simply end the turn, with no auto-play controversy. Turns that are runs of moves call for one clock per turn and undo within the turn. Whole piles moving on their base card require both the base and top cards to stay visible. The other key point is an asymmetry: **be fast for what you did, slow for what others did**. A player's own card should land in about 300 ms, while an opponent's move needs about a second plus a caption, because polish means pacing each motion for the person who has to understand it.

The numbers here are well-grounded starting points, not settled answers. No studio has published card-game timings, no controlled study compares tap with drag, and nobody has tested timer warning thresholds. So instrument the playtests and tune from them. Track mis-taps by hand size and how often players fast-forward AI turns, which is a direct signal that the pacing is too slow. Track how often "+30 s" gets used and how often turns time out at each setting, and how many players turn on Large cards or Reduce Motion. Plan the JavaScript-to-native bridge as a first-class API from day one. Safe areas, the back gesture, haptics, text scale, reduced-motion fallbacks, keeping the screen awake and local-network permissions all depend on it.
