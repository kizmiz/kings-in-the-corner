# Accessibility for a Mobile Classic-Deck Card Game (iOS/Android, WebView): Color-Blind Suits, Contrast, Large Text, Reduced Motion, Screen Readers, Motor Access

Context for the report writer: the target game uses red hearts/diamonds and black spades/clubs on green felt, has a dark-red "Devils" theme, and marks legal moves with gold highlights. It runs in a WebView on iOS and Android. Research is current to October 2026. Contrast ratios marked "computed" are my own calculations using the WCAG relative-luminance formula on sample hex values. They are not from a source, and the real theme colors should be re-measured.

## 1. Four-color decks and other color-blind-friendly suit treatments

### Takeaway
The standard four-color scheme is black spades, red hearts, blue diamonds and green clubs (Mike Caro's design). Online poker clients commonly offer it as a "four-color deck" toggle in their table or card settings, but I found no controlled study showing it helps. Mainstream solitaire apps rarely offer it. Accessible-first apps lean on larger suit/rank glyphs instead of recoloring. Apple's guidance is to keep color and add redundant shape or text cues, and to offer alternative schemes where color carries meaning.

### Cited Findings
- **Standard scheme and origin:**
  - The English poker four-color deck uses black spades, red hearts, green clubs and blue diamonds. Mike Caro developed it and introduced it at his World Poker Finals in 1992. — [Wikipedia: Four-color deck](https://en.wikipedia.org/wiki/Four-color_deck)
  - The World Poker Tour uses these colors "for increased visibility on small television screens." — [Wikipedia: Four-color deck](https://en.wikipedia.org/wiki/Four-color_deck)
- **Claimed benefits (asserted, not measured):** "Having each suit represented by a different color can make it easier for players to recognize a flush." The aim is to "forestall any confusion of suits." Reduced revoking is described only as "perceived." — [Wikipedia: Four-color deck](https://en.wikipedia.org/wiki/Four-color_deck)
- **Early reception:** Caro's original design "was not a success as the colors were a surprise to players." — [Wikipedia: Four-color deck](https://en.wikipedia.org/wiki/Four-color_deck)
- **Online adoption:**
  - Four-color decks are "somewhat popular" in online poker software. — [Wikipedia: Four-color deck](https://en.wikipedia.org/wiki/Four-color_deck)
  - 888poker's 2019 "Poker 8" client listed a four-color deck among the card options in its Settings menu. — [PokerNews, 2019](https://www.pokernews.com/news/2019/03/early-review-of-888poker-new-poker-8-software-33167.htm)
  - Other poker software (Poker Mavens) exposes it under Lobby > Options > Table Settings. — [Briggsoft forum](https://briggsoft.com/forums/viewtopic.php?p=15972)
  - Bridge Base Online users have also requested and discussed 4-color decks. — [BBO forums](https://www1.dal12.sl.bridgebase.com/forums/topic/80647-4-colors-deck-in-bbo/)
- **Live-play trial and player reactions:**
  - PokerStars' EPT trialled four-color Copag decks at EPT Malta in October 2015: clubs green, diamonds blue, 1,000 decks, not used in the Main Event. — [Pokerfuse](https://pokerfuse.com/news/live-and-online/27528-four-color-decks-go-live-ept-malta/)
  - Reactions were mixed. Kenny Hallaert said green was hard to distinguish under green light. Jake Cody uses four-color online for multi-tabling but found the live green and blue too light and hard to tell apart. Mike McDonald said they help on low-resolution screens and in dim lighting. The article offers "no systematic data." — [Pokerfuse](https://pokerfuse.com/news/live-and-online/27528-four-color-decks-go-live-ept-malta/)
- **Limits for color blindness:**
  - A forum user notes there are several significant types of color blindness, so "it is difficult to find a scheme that does not cause problems" for everyone. — [BBO forum thread](https://www4.dal12.sl.bridgebase.com/forums/topic/62321-four-color-deck-see-examples-shown/)
  - Another poker player said green and blue cards are less readable than black and red beyond arm's length. — [Poker Chip Forum](https://www.pokerchipforum.com/threads/what-is-your-opinion-about-four-color-decks.53439/post-1016876)
- **Solitaire apps:**
  - Accessible Solitaire (Guy Barker) *removed* its suit-color customization in v4.1 (Feb 2026) because it was "proving unreliable on some devices." — [App Store: Accessible Solitaire](https://apps.apple.com/us/app/accessible-solitaire/id6737259014)
  - The same developer's multi-platform solitaire instead offers an option that replaces the small corner symbols with one large suit symbol and a large rank letter or number, because the small suit symbols looked similar. — [Guy Barker, LinkedIn case study](https://www.linkedin.com/pulse/case-study-building-multi-platform-accessible-solitaire-guy-barker-zwlxe)
  - Vita Solitaire's App Store listing advertises a "colorblind mode," left-handed mode and dark mode, without saying what the colorblind mode does. — [App Store: Vita Solitaire](https://apps.apple.com/us/app/id6446669987?l=en-us)
  - The terminal game Solkit added a `--four-color` flag. — [Rust users forum](https://users.rust-lang.org/t/solkit-1-0-0-solitaire-collection-for-terminal/53975)
- **Microsoft Solitaire Collection:** It added a "Jumbo" theme with "big bold lettering and numbering on the cards" for players with poor eyesight. — [OnMSFT](https://onmsft.com/?p=41176)
- **Redundant symbol coding precedent:** Mattel's UNO ColorADD adds ColorADD symbols so color-blind players can tell the card colors apart. — [The Dieline](https://thedieline.com/the-first-card-game-for-the-colorblind-is-here-meet-uno-coloradd/)
- **Apple's guidance:**
  - Color blindness affects "up to 10% of some populations." Apple says: "Don't remove color from your app… just make sure color isn't the *only* way." — [App Store Connect: Differentiate Without Color Alone criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/differentiate-without-color-alone-evaluation-criteria)
  - Where color is the differentiator, let users pick alternative color schemes. Apple gives "games where color is used to indicate different teams or characters" as the example. — [App Store Connect: Differentiate Without Color Alone criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/differentiate-without-color-alone-evaluation-criteria)
  - Apple recommends Grayscale filter testing. Ideally the default design does not depend on color, and a setting should be "a last resort or stop-gap." — [App Store Connect: Differentiate Without Color Alone criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/differentiate-without-color-alone-evaluation-criteria)
  - The HIG flags red-green and blue-orange as hard pairings for color-blind users. It suggests letting people customize color schemes for "game characters." — [Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
  - Battlefield 2042 offers Deuteranopia, Protanopia and Tritanopia presets plus a custom color picker with a preview. — [Xbox Accessibility Guideline 102](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102)

### Inferences
- **Make the four-color deck an opt-in setting next to the card style picker, with a live preview card.** This mirrors poker clients and the Battlefield preview pattern. Use dark, saturated tones for the new colors. The computed contrast against a white card face:

  | Suit color | Contrast on white | Verdict |
  |---|---|---|
  | Blue `#0057B8` | 6.87:1 | passes |
  | Green `#008000` | 5.14:1 | passes |
  | Bright green `#00A651` | 3.19:1 | fails 4.5:1 for small index text |

  This also addresses Jake Cody's complaint that the live green and blue were too light.
- **Rules that depend on red vs. black.** If the game's rules use red vs. black (for example, alternating colors in Klondike-style building), a four-color deck can blur the "diamonds are red" mental model. One option is to keep diamonds a warm hue (such as orange or magenta) and clubs a cool or dark one. Another is to keep two colors and lean on bigger suit glyphs. Trick-taking or poker-style games don't have this problem.
- **Suit glyphs are the strongest non-color cue, so let them grow.** Offer a "large index" or "jumbo" card face with a big rank and a big suit symbol in the corner (the Barker and Microsoft Jumbo precedent). This helps both low-vision and color-blind players.
- **Test under all theme backgrounds.** Test in Grayscale and in simulated protanopia and deuteranopia on both the green felt and the Devils dark-red theme. With protanopia, red pips get darker and can approach black.

### Gaps
- I found no peer-reviewed or controlled study measuring suit-identification speed or errors with four-color versus two-color decks. A University of Iowa undergraduate project, "Poker Cards for the Color Blind," exists ([Iowa Research Online](https://iro.uiowa.edu/esploro/outputs/undergraduate/Poker-Cards-for-the-Color-Blind/9984111227302771)), but I did not read it.
- I could not confirm current menu paths for the four-color option in PokerStars or GGPoker from official help pages. Searches returned only third-party or forum content.
- I could not confirm whether Microsoft Solitaire Collection or MobilityWare Solitaire currently offer a four-color or colorblind suit mode.

## 2. Contrast requirements for card indices, highlights on dark felt and focus indicators

### Takeaway
Under WCAG 2.2 AA, card rank text needs 4.5:1 (3:1 if large), and suit pips, highlights and focus rings need 3:1 against adjacent colors. Bright gold on mid-green felt passes, but metallic or dark gold does not, and a gold glow touching a white card face is roughly 1.4:1. Red UI elements on a dark-red theme fail. A two-tone outline (dark keyline plus bright ring) solves most of these cases.

### Cited Findings
- **WCAG 2.2 criteria:**
  - **1.4.3 Contrast (Minimum), AA:** text needs at least 4.5:1, or 3:1 for large text. Inactive components, decoration and logotypes are exempt. — [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
  - **1.4.11 Non-text Contrast, AA:** UI component visuals and "graphical objects required to understand the content" need 3:1 "against adjacent color(s)." — [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
  - **2.4.13 Focus Appearance, AAA:** the focus indicator must be at least as large as a 2 CSS px perimeter and have 3:1 contrast between its focused and unfocused states. **2.4.7 Focus Visible (AA)** requires a visible keyboard focus indicator. **2.4.11 Focus Not Obscured (Minimum), AA:** the focused item must not be *entirely* hidden by author content. — [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- **What counts as large text:**
  - Android: 4.5:1 applies to text smaller than 18sp, or bold text smaller than 14sp, and 3:1 to all other text. — [Android Developers: Make apps more accessible](https://developer.android.com/guide/topics/ui/accessibility/apps)
  - Apple's Accessibility Inspector uses 4.5:1 up to 17 pt, 3:1 at 18 pt or above, and 3:1 for bold text at any size. If the defaults fall short, Apple says to provide a higher-contrast scheme when the system Increase Contrast setting is on, and to check both light and dark appearances. — [Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- **Xbox Accessibility Guideline 102 (Contrast):**
  - Standard text and visual elements need 4.5:1. Large text and elements need 3:1. On mobile, large text is "36 px at 100 DPI, 72 px at 200 DPI, 144 px at 400 DPI," scaling linearly. — [XAG 102](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102)
  - A high contrast mode should be provided, with at least 7:1 for all UI elements. — [XAG 102](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102)
  - Over a non-solid background, measure contrast "against the lowest contrasting area of the background." This matters for felt textures and vignettes. — [XAG 102](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102)
  - Games should read the platform's high-contrast setting at launch. Microsoft Solitaire opens in its high contrast version when the system setting is on: black cards outlined in bright green with white symbols on a black table. — [XAG 102](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102)
  - XAG 102 also recommends outlines. Fenyx Rising uses a white arrow with a black outline. For Honor uses icons outlined in black and then white, so they stay visible on both dark and light backgrounds. Eagle Island offers "outline characters" and backdrop dimming. — [XAG 102](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102)
  - XAG 102 notes that red and green targeting cues cause problems for color-blind players. — [XAG 102](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102)
- **Game Accessibility Guidelines:** "Provide high contrast between text/UI and background" is Basic. "Provide an option to adjust contrast" is Intermediate. — [Game Accessibility Guidelines full list](https://gameaccessibilityguidelines.com/full-list/)
- **Solitaire case study:** Barker's accessibility testing flagged an empty card slot as low contrast, and he logged it as a real bug. — [Guy Barker case study](https://www.linkedin.com/pulse/case-study-building-multi-platform-accessible-solitaire-guy-barker-zwlxe)

### Inferences
These ratios were computed with the WCAG formula. Re-measure them with the real theme hex values.

- **Gold highlights on green felt (`#35654D`):**
  - Bright gold `#FFD700`: 4.80:1, passes 3:1.
  - Metallic gold `#D4AF37`: 3.20:1, a marginal pass.
  - Dark gold `#B8860B`: 2.07:1, fails.
  - A gold glow touching a white card face: `#FFD700` is 1.40:1 and `#D4AF37` is 2.10:1. Both fail.
  - A soft, semi-transparent gold glow blends toward the felt color and loses even more contrast.
  - **Recommendation:** draw the legal-move highlight as a solid ring at least 2–3 CSS px wide, using bright gold plus a 1–2 px dark keyline (near-black or deep navy) between the ring and the white card. This is the For Honor double-outline pattern.
- **Devils dark-red theme (`#5A0F0F`):**
  - Red elements on dark red: `#C8102E` is 2.36:1 and `#FF0000` on `#4A0A0A` is 3.92:1. Red text, red card backs, red chips or red "danger" highlights on the Devils felt are therefore likely to fail.
  - White card faces on dark red are 13.9:1 and gold on dark red is 6.6–9.9:1, so those are fine.
  - Red pips on white cards are fine if dark enough: `#C8102E` is 5.88:1. Pure `#FF0000` is only 4.00:1, which fails 4.5:1 for small rank text but passes 3:1 for pips and large text.
  - **Recommendation:** in the Devils theme, never use red as the highlight or state color.
- **Theme-wide checks:**
  - Card indices (rank characters) count as text, so use 4.5:1 unless rendered large. Suit pips and highlights count as graphical objects, so 3:1 applies.
  - Ship a "High contrast table" option that targets 7:1, following the Microsoft Solitaire style. Auto-enable it when the OS reports Increase Contrast (iOS) or high-contrast text (Android). In a WebView this likely means using `prefers-contrast` or a native bridge; verify support.
  - Focus rings for Full Keyboard Access and Switch Control must stay visible against both the felt and the white card faces, and must not be fully covered by a fanned hand or bottom sheet (2.4.11).

### Gaps
- I did not fetch Apple's "Sufficient Contrast" App Store evaluation criteria page, so any game-specific ratio guidance it gives is not captured.
- I did not verify whether WKWebView and Android WebView expose iOS Increase Contrast or Android high-contrast text through `prefers-contrast` media queries. This needs device testing.
- I found no source specifically analyzing gold-on-green highlight usability in card games. The analysis above is computed.

## 3. Not relying on color alone for legal-move highlights; redundant state communication

### Takeaway
Use of color is a Level A WCAG requirement with no exceptions, and both Apple and the Game Accessibility Guidelines treat color-only cues as a baseline failure. Legal-move gold should be paired with a shape or outline change, a non-color glyph or offset, and, for screen-reader users, a spoken list of available moves.

### Cited Findings
- **1.4.1 Use of Color, Level A:** "Color is not used as the only visual means of conveying information." — [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- **Game Accessibility Guidelines (Basic):** "Ensure no essential information is conveyed by a fixed colour alone." — [GAG](https://gameaccessibilityguidelines.com/ensure-no-essential-information-is-conveyed-by-a-fixed-colour-alone/)
- **Apple's guidance:**
  - "Consider using placement, order, shape, iconography, or other stylistic differences *in addition* to color." Apple's accessible example is a green circled checkmark next to a red octagon with an X. — [App Store Connect: Differentiate Without Color Alone](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/differentiate-without-color-alone-evaluation-criteria)
  - "Offer visual indicators, like distinct shapes or icons, in addition to color to help people perceive differences in function and changes in state." — [Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- **Xbox Accessibility Guideline 102:** "Avoid relying on color alone… When this isn't possible, provide players the option to choose the color of key game elements." — [XAG 102](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102)
- **Selection state in text and speech:**
  - Accessible Solitaire has VoiceOver announce available moves after each move, plus an optional "Available moves" button. — [App Store: Accessible Solitaire](https://apps.apple.com/us/app/accessible-solitaire/id6737259014)
  - Barker's TalkBack labels put the selection state in the card's name, for example "10 of Clubs, selected, 3 of 5, In list Pile 3." — [Guy Barker case study](https://www.linkedin.com/pulse/case-study-building-multi-platform-accessible-solitaire-guy-barker-zwlxe)

### Inferences
Concrete redundant-encoding recipe for the gold legal-move highlight:
1. Change shape or outline: a thicker, double-stroked ring, or a dashed versus solid border for "selectable" versus "valid drop target."
2. Change position: lift playable cards in hand by 8–12 px, a common card-game convention.
3. Dim illegal cards: reduce saturation or opacity. Keep the result at 3:1 or better so the cards remain readable, since WCAG exempts inactive components but XAG 102 still asks for 3:1 on inactive text.
4. Add an optional small glyph, such as a check or arrow, on target piles.
5. For assistive technology, add "playable" or "valid target" to the accessible name, and announce the count of legal moves.

- Avoid pulsing or glowing animation as the *only* extra cue. It conflicts with Reduce Motion (see Section 5).
- Selected versus unselected cards should differ by more than tint, for example by lifting or outlining.

### Gaps
- I found no published usability data comparing highlight styles (outline versus lift versus dim) in card games specifically.

## 4. Large text, Dynamic Type and display zoom in a WebView game; minimum text sizes

### Takeaway
Plan to scale text to 200%, which is what both WCAG 1.4.4 and Apple's "Larger Text" App Store label require. A WebView does not do this cleanly. On iOS it needs `-apple-system-body` or a native bridge. On Android, WebView applies the system font scale as text zoom unless the app calls `setTextZoom`, which can break fixed game layouts. The cleanest approach for a game is a native bridge that passes the OS text scale into CSS, applied deliberately to UI text, plus an in-game text-size and large-card-index setting. Apple explicitly allows games to meet the requirement with an in-app setting.

### Cited Findings
- **Requirements and minimum sizes:**
  - WCAG 1.4.4 Resize Text (AA): text must be resizable "up to 200 percent without loss of content or functionality." — [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
  - Apple's Larger Text label can be claimed only if "users can enlarge text to at least 200% or the maximum font size for the system." Apps that use a web view for common tasks should "provide a font size controller or let Safari handle this task." Games "may choose to manage their own font sizes with an in-app setting." Apps must not rely on Zoom or Hover Text to claim support. — [App Store Connect: Larger Text criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/larger-text-evaluation-criteria)
  - Apple's layout rules for larger text: avoid truncation, wrap text, scale main content before navigation, and stack side-by-side elements instead of letting them overlap. — [App Store Connect: Larger Text criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/larger-text-evaluation-criteria)
  - Apple's HIG gives iOS and iPadOS a default custom text size of 17 pt and a minimum of 11 pt. It says to use larger sizes for thin weights and to "give people the option to enlarge text by at least 200 percent." — [Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
  - The Game Accessibility Guidelines rate "Use an easily readable default font size" as Basic and "Allow the font size to be adjusted" as Advanced. — [GAG full list](https://gameaccessibilityguidelines.com/full-list/)
- **iOS WKWebView:**
  - Setting `font: -apple-system-body` on the root element makes text follow Dynamic Type. — [Use Your Loaf](https://useyourloaf.com/blog/using-dynamic-type-with-web-views/)
  - Pitfalls: the shorthand overrides custom fonts (set `font-family` afterward), and setting `font-size` on the same rule breaks the Dynamic Type link (use an `em` multiplier on a child instead). — [Apple Developer Forums](https://developer.apple.com/forums/thread/105571); [Use Your Loaf](https://useyourloaf.com/blog/using-dynamic-type-with-web-views/)
  - `-apple-system-body` defaults to 13px on macOS. — [WebKit bug 230348](https://bugs.webkit.org/show_bug.cgi?id=230348)
- **Android WebView:**
  - If the app never calls `setTextZoom`, WebView applies the system font scale. Once the app calls it, WebView uses that value and ignores the system scale. — [Chromium code review](https://codereview.chromium.org/173943002); [Chromium WebView docs](https://chromium.googlesource.com/chromium/src/+show/a3094de98eb0fc9cd97bcb2ee797fe00353cbc47/android_webview/docs/web-page-layout.md)
  - A 2026 report describes layouts breaking when the system font slider sets a textZoom other than 100. — [Start Debugging, Sept 2026](https://startdebugging.net/2026/09/fix-flutter-text-renders-off-screen-in-an-android-webview-with-font-scaling/)
  - Reports conflict on whether `setTextZoom(100)` reliably pins text size across Android versions. — [B4X forum](https://www.b4x.com/android/forum/threads/system-font-size-problem.109867/post-933844)
  - Android 14 supports font scaling up to 200% with a nonlinear curve, so large text grows less than small text. Test at 200%. — [Android 14 features](https://developer.android.com/about/versions/14/features)
- **Emerging standard, `env(preferred-text-scale)`:**
  - A CSS environment variable returns the OS text scale, for example 2 at 200%. Recommended usage is `:root { font-size: calc(100% * env(preferred-text-scale, 1)); }`. — [CSSWG explainer](https://drafts.csswg.org/css-env-1/explainers/env-preferred-text-scale.md)
  - Chrome shipped it on Android in milestone 138 (Intent to Ship, May 2025). — [blink-dev Intent to Ship](https://groups.google.com/a/chromium.org/g/blink-dev/c/bZuQAcwcEig)
  - For Android WebView, interaction with `setTextZoom` was described as "in flux," with a risk of "double scaling" (as of July 2025). — [CSSWG explainer](https://drafts.csswg.org/css-env-1/explainers/env-preferred-text-scale.md); [blink-dev](https://groups.google.com/a/chromium.org/g/blink-dev/c/bZuQAcwcEig)
  - I found no WebKit or iOS signal for it. — [blink-dev](https://groups.google.com/a/chromium.org/g/blink-dev/c/bZuQAcwcEig)
- **Precedents for large card faces:**
  - Microsoft Solitaire Collection's Jumbo theme uses bigger, bolder card lettering. — [OnMSFT](https://onmsft.com/?p=41176)
  - Barker's solitaire has a settings zoom (for example 150%) and a large-suit-and-rank option. Testers found zoom alone "required too much scrolling," and they asked for a direct per-card zoom. — [Guy Barker case study](https://www.linkedin.com/pulse/case-study-building-multi-platform-accessible-solitaire-guy-barker-zwlxe)
- **Orientation:** WCAG 1.3.4 Orientation (AA) says content should not be locked to one orientation unless that is essential. — [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)

### Inferences
Recommended WebView strategy:
1. **Android:** call `setTextZoom(100)` to stop uncontrolled scaling. Read `Configuration.fontScale` natively and pass it to the page as a CSS custom property, such as `--os-text-scale`.
2. **iOS:** read the `UIContentSizeCategory` or `UIFontMetrics` scale natively, or use `-apple-system-body` on UI text only, and pass it the same way. Update on change notifications.
3. **Where scaling applies:** apply the scale to menus, dialogs, scores, chat, tooltips and settings, which can reflow. Card faces are fixed-size game objects. Map the OS scale to a few card-index presets (Normal, Large, Jumbo) rather than scaling card text continuously, which would overflow the card.
4. **In-game setting:** offer an in-game Text Size and Card Index Size setting so the game can claim Apple's Larger Text label without relying on Dynamic Type.

Further notes:
- **Minimum sizes on a phone.** Treat Apple's 11 pt minimum as the floor for any text, including card indices at default zoom. Aim for 17 pt for body and UI text. Card indices should be bold, which also lowers the WCAG contrast threshold to 3:1.
- **Display Zoom.** iOS Display Zoom and Android Display size enlarge the whole UI by shrinking the effective viewport in CSS px. Test the table layout at the smallest effective widths, where Display Zoom on a small iPhone yields a narrow viewport.
- **Pinch-zoom.** Don't disable pinch-zoom (`user-scalable=no`) unless the game provides its own card or table zoom.

### Gaps
- I did not find an authoritative Apple doc stating how Display Zoom affects WKWebView viewport width, or recommended handling.
- I did not find confirmation that Android WebView ships `env(preferred-text-scale)` as of late 2026. Its status was "in flux" in mid-2025.
- Google publishes no single minimum sp for text comparable to Apple's 11 pt in the pages I read.

## 5. prefers-reduced-motion, iOS Reduce Motion and Android "Remove animations": what to keep and what to cut

### Takeaway
Both OS settings reach web content through `prefers-reduced-motion`. Apple's guidance is to replace, not delete, animations that carry meaning, using dissolves, highlight fades or color shifts. Remove decorative, depth, spinning, multi-axis and ongoing motion. For a card game, cut the card-flight, flip, shuffle and win-cascade motion. Keep short cross-fades and gesture-tracked dragging.

### Cited Findings
- **OS settings and web mapping:**
  - Android 9+ exposes Settings > Accessibility > Remove animations, and Chrome on Android (since Chrome 74) maps it to `prefers-reduced-motion`. — [web.dev: prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion); [9to5Google, Chrome 74](https://9to5google.com/2019/04/25/google-chrome-74-android-stable/)
  - Users can change the preference on the fly without a reload, so listen for changes in JavaScript. — [web.dev](https://web.dev/articles/prefers-reduced-motion)
  - Android WebView is listed as supporting `prefers-reduced-motion` from version 74 in MDN-derived compatibility data. — [MDN: prefers-reduced-motion](https://developer.mozilla.org/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
  - Android's label is "vague as to whether they mean all animation or only motion animation." — [W3C CSS archive](https://lists.w3.org/Archives/Public/public-css-archive/2021Sep/0054.html)
- **Apple's App Store Reduced Motion criteria (Accessibility Nutrition Labels, 2025):**
  - Change or disable "parallax effects, animated blur, and depth-of-field effects," "multi-axis or multi-speed motion, spinning, or vortex effects," and auto-advancing or ongoing motion. For the last, stop it or provide a control. — [App Store Connect: Reduced Motion criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria)
  - Where motion conveys meaning, such as a status change or hierarchy, "don't remove the animation entirely." Instead use "a dissolve, highlight fade, or color shift." — [App Store Connect: Reduced Motion criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria)
  - "Removing animations entirely can have a negative effect on usability and understandability." An in-app setting with "similar functionality" is acceptable. — [App Store Connect: Reduced Motion criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria)
- **Apple HIG on Reduce Motion:**
  - Reduce "automatic and repetitive animations, including zooming, scaling, and peripheral motion." Tighten springs to reduce bounce, track animations directly with gestures, avoid animating z-axis depth, replace x, y and z transitions with fades, and avoid animating into or out of blurs. — [Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- **WCAG and the Game Accessibility Guidelines:**
  - WCAG 2.3.3 Animation from Interactions (AAA): motion triggered by interaction "can be disabled" unless essential. — [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
  - WCAG 2.2.2 Pause, Stop, Hide (A) applies to auto-starting moving or blinking content that lasts over 5 seconds alongside other content. — [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
  - Relevant Game Accessibility Guidelines: "Avoid flickering images and repetitive patterns" (Basic), "Provide an option to turn off / hide background movement" (Intermediate), and "Avoid any sudden unexpected movement or events" (Advanced). — [GAG full list](https://gameaccessibilityguidelines.com/full-list/)

### Inferences
Card-game keep or cut list when reduced motion is on, or when an in-game "Reduce animations" toggle is set. The toggle should default to the OS value.

| Element | Reduced-motion behavior |
|---|---|
| Deal, trick-collection and discard flights across the table | Replace with instant placement plus a 150–200 ms cross-fade or highlight fade at the destination, so the player still sees where the card went. |
| 3D card flip | Replace with a cross-fade from back to face. This avoids z-axis or depth motion. |
| Shuffle animation | Cut. Show a brief "Shuffling…" label or icon instead. |
| Win cascade, bouncing cards, confetti, fireworks, screen shake, camera zoom or pan | Cut. These are decorative and multi-axis. Use a static "You win" panel. |
| Pulsing or breathing gold glow on legal moves | Make it static. This is ongoing motion. |
| Idle or ambient felt animation (flames or embers in the Devils theme) | Stop it. This is background and peripheral motion. |
| Card following the finger during a drag | Keep. Apple says to track animations directly with gestures. |
| Snap-back of an invalid drop | Shorten it, or replace it with a fade plus a shake-free error cue (outline flash under 3 times per second, or a text or haptic cue). |
| Brief opacity transitions and color shifts for turn changes and the score | Keep. |
| Opponent card plays | Keep a short fade-in at the played position plus a text or log entry. The motion carries meaning, so replace it rather than remove it. |

### Gaps
- I did not verify on devices whether Android WebView (as opposed to Chrome) reliably reflects "Remove animations" through `prefers-reduced-motion` across OEM skins. A native bridge (`Settings.Global.ANIMATOR_DURATION_SCALE` or `UIAccessibility.isReduceMotionEnabled`) is a safer fallback, but I did not source this.
- I found no game-specific Apple guidance on Reduce Motion. The App Store criteria page has no game section.

## 6. Screen reader support (VoiceOver/TalkBack): labelling cards and piles, announcing moves

### Takeaway
Blind-playable card games exist and are valued: AppleVis users report finishing solitaire for the first time. The working patterns are:
- Each card and pile is a labelled, focusable element (rank, suit, state, position, pile).
- Moves use a select-then-target flow with no drag.
- A short announcement follows each move and opponent action.
- On-demand query buttons ("game state," "available moves," "open cards") replace constant chatter.

iOS and Android screen readers differ enough that platform-specific code was needed.

### Cited Findings
- **Accessible Solitaire (Guy Barker), the main mobile example:**
  - VoiceOver "announces details of the playing cards as you move through the game." After a move, it announces the moves now available.
  - An optional setting announces game state, optionally including the rank and suit of face-down cards.
  - Optional buttons offer "Available moves," "Game state" (v5.0) and "Open Cards," which reads all open cards in Pyramid and later the top cards of Klondike piles.
  - It added Undo, Restart and New Game actions (v5.0) and Pause/Resume (v3.13).
  - It is also fully playable with Voice Control and Switch Control, including an Xbox Adaptive Controller.
  
  — [App Store: Accessible Solitaire](https://apps.apple.com/us/app/accessible-solitaire/id6737259014)
- **Player feedback:** one player told the developer he "completed a game of solitaire for the first time in his life" using the app. — [AppleVis: Inviting feedback on the Accessible Solitaire app](https://www.applevis.com/comment/194482)
- **Implementation detail from Barker's case study (.NET MAUI, iOS and Android):**
  - Label format: "10 of Clubs, selected, 3 of 5, In list Pile 3."
  - Move announcement: "Moved 3 of Spades, Revealed Empty card pile in dealt card pile 3."
  - It uses semantic descriptions, hints and headings plus explicit `SemanticScreenReader.Announce()` calls after game actions.
  - Barker cautions that "too many custom announcements can make an app very hard to use."
  - TalkBack would not announce selection state or position for list items, so he put them in the label text.
  - The *only* platform-specific `#if` in the app is for the screen reader experience.
  - He tested with at least 20 people. Google's automated accessibility report "was useful but not always right."
  
  — [Guy Barker case study](https://www.linkedin.com/pulse/case-study-building-multi-platform-accessible-solitaire-guy-barker-zwlxe)
- **Platform guidance:**
  - Android: give each element a `contentDescription` that conveys "purpose and result… not the visual details." Expose the role, keep descriptions unique, avoid redundant words like "button," and hide decorative elements. — [Android Developers](https://developer.android.com/guide/topics/ui/accessibility/apps)
  - Apple: describe the interface for VoiceOver, label elements for Voice Control, and support Switch Control, Full Keyboard Access and AssistiveTouch. — [Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- **Status messages:** WCAG 4.1.3 Status Messages (AA) requires that status messages "can be programmatically determined through role or properties" so assistive technology can present them without moving focus. In web content this means ARIA live regions or `role="status"`. — [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- **Game Accessibility Guidelines:** "Ensure screenreader support for mobile devices" (Intermediate) and "Ensure screen reader support, including menus & installers" (Advanced). — [GAG full list](https://gameaccessibilityguidelines.com/full-list/)
- **Hearthstone Access cautionary tale:**
  - The third-party Hearthstone Access mod added NVDA screen-reader support on Windows, with a fallback to Microsoft's Speech API. — [Hearthstone Access](https://hearthstoneaccess.github.io); [PC Gamer](https://www.pcgamer.com/the-creator-of-a-popular-hearthstone-accessibility-mod-has-ended-support-for-it)
  - Game patches kept breaking it, and its developer ended support in late 2022. — [PC Gamer](https://www.pcgamer.com/the-creator-of-a-popular-hearthstone-accessibility-mod-has-ended-support-for-it); [GamesRadar](https://www.gamesradar.com/hearthstone-updates-keep-breaking-its-accessibility-mod-so-fans-want-blizzard-to-support-it-officially)
  - Blizzard then said it would explore native features for blind and low-vision players. — [Can I Play That?](https://caniplaythat.com/2022/11/12/hearthstone-accessibility-to-be-improved-as-mod-support-ends/)
- **Microsoft Solitaire Collection:** a non-official 2025 guide claims it works with Narrator and has a high-contrast theme and large-card mode. This is unverified; the high-contrast behavior is confirmed by XAG 102. — [solitairegameguide (unofficial)](https://solitairegameguide-com.pages.dev/blog/solitaire-accessibility-best-games-vision-impairment-2025); [XAG 102](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102)

### Inferences
WebView implementation recipe:
- **Render as real elements.** Render cards and piles as real DOM elements (`<button>` or `role="button"`) rather than drawing only to `<canvas>`. If canvas is used, maintain a parallel, positioned accessible DOM layer.
- **Card labels.** Label each card "Queen of Spades." Add a state where relevant: "selected," "playable" or "face down" (never reveal face-down identity unless the player opts in, as Barker's option does). Add position, for example "3 of 7, Pile 2." Mark each pile as a group or heading with a count, for example "Your hand, 13 cards" or "Trick, 2 cards."
- **Live region for game events.** Use one `aria-live="polite"` / `role="status"` region for game events. For example: "West plays 9 of Hearts," "North plays King of Hearts, wins the trick," "Your turn. 3 playable cards." Use `assertive` sparingly, perhaps only for "Your turn" in a timed game. Batch rapid AI moves into one message per trick or turn to avoid announcement overload, per Barker's warning.
- **On-demand queries.** Offer query buttons or actions: "Repeat last play," "Read table / trick," "Read my hand," "Score," "Available moves." Expose them as buttons, which also serves Voice Control and Switch Control users.
- **Move flow without drag.** Use tap or double-tap to select, then tap the target pile or "Play" button. Screen-reader users can't easily drag (see Section 7).
- **Platform differences.** Budget for platform-specific tweaks. TalkBack and VoiceOver handle selection state and list position differently, so embed critical state in the label text.
- **Testing.** Recruit blind testers through AppleVis-style communities. Barker found real-user testing more valuable than automated reports.

### Gaps
- I did not find Microsoft-official documentation of Narrator or screen-reader support in Microsoft Solitaire Collection.
- I did not confirm whether Blizzard shipped native Hearthstone screen-reader support after 2022.
- I did not research multiplayer, trick-taking, blind-accessible apps such as Blindfold Card Games or RS Games in detail. They are additional precedents worth a look for announcing opponents' moves.
- I did not verify how reliably VoiceOver in WKWebView and TalkBack in Android WebView handle rapid `aria-live` updates during fast AI play.

## 7. Motor accessibility: tap vs drag, hold durations, precision gestures, time limits

### Takeaway
WCAG 2.2 AA now requires a non-drag alternative for every drag action (2.5.7) and targets of at least 24×24 CSS px (2.5.8). Platform guidance is larger: 44×44 pt on iOS and 48×48 dp on Android. Hold-to-act interactions proved unreliable in practice. Turn timers must be adjustable or removable unless they are essential to real-time multiplayer play.

### Cited Findings
- **WCAG 2.2:**
  - **2.5.7 Dragging Movements (AA):** "All functionality that uses a dragging movement for operation can be achieved by a single pointer without dragging," unless dragging is essential. — [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
  - **2.5.8 Target Size (Minimum), AA:** at least 24×24 CSS px, or spaced so 24 px circles don't overlap. **2.5.5 Target Size (Enhanced), AAA:** 44×44 CSS px. — [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
  - **2.5.1 Pointer Gestures (A):** path-based or multipoint gestures need a single-pointer alternative. — [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
  - **2.5.2 Pointer Cancellation (A):** do not complete actions on the down-event; complete on the up-event with a way to abort or undo. — [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
  - **2.5.4 Motion Actuation (A):** device-motion features (for example, shake to shuffle) need a UI alternative, and motion response must be possible to disable. — [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
  - **2.2.1 Timing Adjustable (A):** for each content-set time limit, the user can turn it off or adjust it to at least 10 times the default, or is warned and allowed to extend it. Exceptions cover real-time events where no alternative is possible, essential limits, and limits over 20 hours. — [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
  - **"Essential"** means removing it "would fundamentally change the information or functionality" and it can't be achieved another conforming way. — [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- **Apple:**
  - iOS controls should be 44×44 pt by default, with a 28×28 pt minimum. Allow about 12 pt of padding around bezeled elements and about 24 pt around unbezeled ones. — [Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
  - "Use the simplest gesture possible — avoid custom multifinger and multihand gestures," and "offer onscreen ways to achieve the same outcome." — [Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
  - "Minimize use of time-boxed interface elements." — [Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
  - Consider difficulty accommodations, such as adjusting reaction time. — [Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- **Android touch targets:** "at least 48dp×48dp. Larger is even better." Custom interactive elements must set this size themselves. — [Android Developers](https://developer.android.com/guide/topics/ui/accessibility/apps)
- **Android touch-and-hold delay:** Android has a system "Touch & hold delay" setting (Short, Medium or Long) for users who trigger long-presses by accident or need more time. — [Google Accessibility Help](https://support.google.com/accessibility/android/answer/6006989?hl=en-GB)
- **Game Accessibility Guidelines:**
  - Interactive elements should be "large and well spaced, particularly on small or touch screens" (Basic).
  - Click-drag and swipe should be "not required and… only a supplementary alternative" (Intermediate).
  - "Avoid / provide alternatives to requiring buttons to be held down" (Intermediate).
  - "Make interactive elements that require accuracy… stationary" (Intermediate).
  - "Do not make precise timing essential to gameplay" (Advanced).
  - Basic: "Include an option to adjust the game speed" and "Ensure that all settings are saved/remembered."
  
  — [GAG full list](https://gameaccessibilityguidelines.com/full-list/)
- **Solitaire practice:**
  - Accessible Solitaire removed its press-and-hold large-card pop-up in v4.10 because it was "proving unreliable." — [App Store: Accessible Solitaire](https://apps.apple.com/us/app/accessible-solitaire/id6737259014)
  - Barker found long-press unreliable after cards moved between lists and replaced it with a per-card Zoom button. He rejected double-tap-to-select because it delayed single-tap selection. He also notes that partly overlapped cards have small hit targets. — [Guy Barker case study](https://www.linkedin.com/pulse/case-study-building-multi-platform-accessible-solitaire-guy-barker-zwlxe)
  - Android Switch Access with an Xbox Adaptive Controller (A and B buttons to select and move) and iOS Switch Control both completed full games. — [Guy Barker case study](https://www.linkedin.com/pulse/case-study-building-multi-platform-accessible-solitaire-guy-barker-zwlxe)
- **Xbox Accessibility Guidelines:** they show the precedent of letting players choose element colors and customize the UI, and the general XAG set covers input. — [XAG 102](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102)

### Inferences
- **Tap-to-select, tap-to-place as a first-class mode.** Make it a peer of drag, not a hidden fallback.
  - Tap a card to select it: lifted, double outline, announced.
  - Tap a destination to move it.
  - Tap the selected card again, or tap empty felt, to cancel.
  - Offer an optional "auto-play single legal move" or "tap to play to best target," as many solitaire apps do with one-tap auto-move.
- **Drag must satisfy 2.5.2.** Commit only on release over a valid target. Dropping back or outside cancels. Always offer Undo.
- **Hit targets for fanned hands and overlapping tableau piles.**
  - Make each card's *exposed sliver* hit area at least 24 CSS px wide (WCAG AA floor). Aim for 44 pt or 48 dp where the layout allows.
  - Alternatively, use a "tap the fan to expand, then pick" pattern.
  - Make pile and empty-slot targets the full card size.
  - Keep cards stationary while a player is aiming. Don't let a hand reflow or animate under the finger.
- **No hold-only actions.** If long-press shows card details or a zoom, also provide a visible button or a "magnify selected card" action. If long-press is used, prefer the system long-press timing via a native bridge rather than a hard-coded short duration, so Android's Touch & hold delay setting is respected. Feasibility in a WebView needs verification.
- **Time limits.**
  - Single-player versus AI: no turn timer, or an optional one that can be turned off.
  - Multiplayer versus humans: the real-time exception in 2.2.1 may apply. Even so, offer generous defaults, a visible countdown with a warning, "time bank" extensions, and auto-play-on-timeout that picks a legal move rather than forfeiting.
  - Store the timer preference persistently, per the Game Accessibility Guidelines.
- **Orientation.** Support both orientations if feasible (WCAG 1.3.4). Players with mounted devices or wheelchair mounts may not be able to rotate the phone.

### Gaps
- I did not fetch XAG 107 (Input) or other XAG input guidance directly. Only XAG 102 was read in full.
- I did not find the exact millisecond values for Android's Short, Medium and Long touch-and-hold delays, or a confirmed way to read them from a WebView.
- I did not research iOS Touch Accommodations (Hold Duration, Ignore Repeat) and how they interact with web touch events in WKWebView. This is worth device testing.
- I found no AbleGamers resource specific to card games within this research budget.
