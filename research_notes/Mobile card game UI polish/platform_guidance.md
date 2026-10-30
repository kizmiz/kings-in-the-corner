# Platform guidance for a native-feeling WebView card game (iOS SwiftUI + WKWebView, Android Kotlin + WebView)

Research date: 2026-10-29. Sources are mostly Apple HIG and developer docs, Android developer docs, Chromium/WebKit docs and bug trackers, and a few practitioner write-ups (marked as such). Apple HIG pages were read through Apple's JSON data endpoints because the HTML pages render client-side. Citations point to the human-readable URLs.

## 1. iOS HIG for games: safe areas, Dynamic Island, home indicator, portrait layout, control sizing, sheets/alerts, haptics

### Takeaway
Apple's game HIG sets hard numbers: 44x44 pt default and 28x28 pt minimum controls, 17 pt default and 11 pt minimum text. It also says to rely on the platform safe areas for rounded corners, the camera housing and the Dynamic Island, and to keep layouts relative rather than fixed across 16:10, 19.5:9 and 4:3. For haptics it says to use system patterns for their documented meanings, sparingly and consistently, and to make them optional. A WebView game can't call any haptics API from JavaScript, so a native bridge is needed (see section 3).

### Cited Findings
**Sizing and text (Designing for games, iOS/iPadOS table)**
- Default button size is 44x44 pt and minimum button size is 28x28 pt. The page says "buttons in iOS must be at least 44x44 pt to accommodate touch interaction." — [HIG: Designing for games](https://developer.apple.com/design/human-interface-guidelines/designing-for-games)
- Default text size is 17 pt and minimum text size is 11 pt. Text should "contrast well with the background and use at least the recommended minimum text size in each platform." — [HIG: Designing for games](https://developer.apple.com/design/human-interface-guidelines/designing-for-games)
- Pay "special attention to control sizing and menu behavior, especially when bringing your game from a pointer-based context to a touch-based one." On iOS a game can let players interact directly with game elements, such as tapping and dragging cards, and can also use virtual controls overlaid on the content. — [HIG: Designing for games](https://developer.apple.com/design/human-interface-guidelines/designing-for-games)

**Safe areas, Dynamic Island, layout**
- "A device may have rounded corners or a camera housing that can affect parts of your interface… accommodate such features during layout, relying on platform-provided safe areas when possible." — [HIG: Designing for games](https://developer.apple.com/design/human-interface-guidelines/designing-for-games)
- "Respecting the safe area is essential to make sure system UI and hardware features like the Dynamic Island don't obstruct content and controls." — [HIG: Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- Full-screen background content should extend under bars to fill the screen. When scaling background art, "don't change the aspect ratio… scale it so that it fills the screen completely." — [HIG: Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- "Determine layout based on size classes, not device type or orientation… Even if your app is locked to a certain orientation… it's still important to ensure your interface resizes well." — [HIG: Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- Games should handle aspect ratios "such as 16:10, 19.5:9, and 4:3". "Avoid fixed layouts as much as possible" and use relative constraints. In-game menus must stay legible in every supported orientation "without obscuring other content." — [HIG: Designing for games](https://developer.apple.com/design/human-interface-guidelines/designing-for-games)
- Liquid Glass layout guidance, added June 9, 2025: use a scroll edge effect to elevate controls instead of solid or semi-opaque backgrounds under them. `backgroundExtensionEffect()` (SwiftUI) and `UIBackgroundExtensionView` (UIKit) mirror and blur background art under adjacent components. — [HIG: Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- The HIG Layout page says "No additional considerations for iOS or iPadOS". It doesn't cover the home indicator, status bar hiding or iPhone screen dimensions. — [HIG: Layout](https://developer.apple.com/design/human-interface-guidelines/layout)

**Home indicator and system edge gestures (UIKit)**
- `preferredScreenEdgesDeferringSystemGestures` sets "the screen edges for which you want your gestures to take precedence over the system gestures." Apple adds: "Whenever possible, you should allow the system gestures to take precedence. However, immersive apps can use this property…". After a change, call `setNeedsUpdateOfScreenEdgesDeferringSystemGestures()`. — [Apple Developer: preferredScreenEdgesDeferringSystemGestures](https://developer.apple.com/documentation/uikit/uiviewcontroller/preferredscreenedgesdeferringsystemgestures)
- `prefersHomeIndicatorAutoHidden` is "a Boolean that indicates whether the system is allowed to hide the visual indicator for returning to the Home Screen." Its companion is `setNeedsUpdateOfHomeIndicatorAutoHidden()`. — [Apple Developer: preferredScreenEdgesDeferringSystemGestures (related members)](https://developer.apple.com/documentation/uikit/uiviewcontroller/preferredscreenedgesdeferringsystemgestures)

**Onboarding, settings, permissions**
- "Let people play as soon as installation completes." Fold onboarding into a playable tutorial, and offer any written tutorial as a reference "instead of making it a prerequisite for gameplay." — [HIG: Designing for games](https://developer.apple.com/design/human-interface-guidelines/designing-for-games)
- Pick defaults from the device and the player's accessibility settings. Let players customize "type size, game control mapping, motion intensity, and sound balance." Don't rely only on color to convey important details, which matters for card suits and red/black. — [HIG: Designing for games](https://developer.apple.com/design/human-interface-guidelines/designing-for-games)
- Ask for permissions "at the right time", inside the scenario that needs the data. Ask for ratings only after people "spend quality time with your game." — [HIG: Designing for games](https://developer.apple.com/design/human-interface-guidelines/designing-for-games)
- Game Center offers leaderboards, achievements and challenges. GameSave helps players "start back up exactly where they left off on a different device." — [HIG: Designing for games](https://developer.apple.com/design/human-interface-guidelines/designing-for-games)

**Haptics (HIG: Playing haptics)**
- "Use system-provided haptic patterns according to their documented meanings." "Use haptics consistently." Haptics should complement visual and audio feedback, with the haptic's intensity and sharpness matched to the animation. "Avoid overusing haptics." "In most apps, prefer playing short haptics that complement discrete events." "Make haptics optional." — [HIG: Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics)
- The iOS `UIFeedbackGenerator` families and their meanings:
  - Notification: success, warning and error, for "the outcome of a task or action".
  - Impact: light, medium, heavy, rigid and soft, as "a physical metaphor… a tap when a view snaps into place".
  - Selection: for when "a UI element's values are changing". — [HIG: Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics)
- Games can design custom patterns with Core Haptics from transient events (taps or impulses) and continuous events, varying sharpness and intensity, optionally with audio. — [HIG: Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics); [HIG: Designing for games](https://developer.apple.com/design/human-interface-guidelines/designing-for-games)
- A misuse example: if a pattern signals failure, don't reuse it for a positive outcome such as completing a level. — [HIG: Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics)

### Inferences
- Card-game haptic mapping that follows the documented meanings:
  - Card snaps into a pile or slot: impact, light or soft.
  - Scrolling or dragging through a hand: selection.
  - Win or round complete: notification success.
  - Illegal move: notification error or warning.

  Never reuse the error haptic for a positive event. Provide a "Haptics" toggle in settings.
- In a WKWebView, size tappable cards and buttons at 44 CSS px or more. On iOS with `width=device-width`, 1 CSS px corresponds to 1 pt. Keep secondary icon buttons at 28 px or more, and body text at 17 px by default and 11 px minimum. Supporting the "type size" customization means scaling the web UI from a setting or from Dynamic Type passed through the bridge.
- A casual card game should not defer the bottom system edge or hide the home indicator. Apple says to let system gestures win "whenever possible." Instead, keep the player's hand above the bottom safe-area inset so a drag starting at the bottom edge isn't swallowed by the home gesture.

### Gaps
- The HIG "Game controls > Touch controls" subpage and the HIG "Alerts" page were not fetched, so there are no alert-specific rules here, such as button count or destructive styling.
- I did not find an Apple source saying whether WKWebView content inherits Dynamic Type automatically. It is commonly reported that it doesn't unless you use `font: -apple-system-body`, but this is unverified.
- The SwiftUI equivalents `.defersSystemGestures(on:)` and `.persistentSystemOverlays(.hidden)` could not be verified because the doc page returned 404. From memory they are iOS 16+; check before citing.
- No Apple source was found for `UIApplication.shared.isIdleTimerDisabled`, the keep-screen-awake call. It is widely used, but this session did not verify it.
- I did not review any 2023–2025 WWDC game or haptics sessions directly.

## 2. Android: edge-to-edge (Android 15/16), WindowInsets, display cutouts, predictive back, M3 bottom sheets, touch targets, haptics, keep screen on

### Takeaway
Apps targeting SDK 35 are drawn edge-to-edge on Android 15+. With targetSdk 36 on Android 16 the opt-out attribute is disabled, so there is no escape hatch. Targeting 36 also enables predictive-back system animations by default and stops `onBackPressed`/`KEYCODE_BACK`. Back must go through `OnBackPressedCallback`, enabled only while a sheet or modal is open. Use 48x48 dp touch targets and `View.performHapticFeedback` with `HapticFeedbackConstants`, which needs no permission and respects user settings. Keep the screen on with `FLAG_KEEP_SCREEN_ON`.

### Cited Findings
**Edge-to-edge enforcement**
- "Once you target SDK 35 or higher on a device running Android 15 or higher, your app is displayed edge-to-edge." The window draws behind the status, caption and navigation bars, and "portions of your app may be obscured and you must handle insets." — [Android Developers: Edge-to-edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge)
- "For apps targeting Android 16 (API level 36), `R.attr#windowOptOutEdgeToEdgeEnforcement` is deprecated and disabled, and your app can't opt-out of going edge-to-edge." The attribute still works for a targetSdk 36 app running on an Android 15 device. — [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16)
- For older OS versions, call `WindowCompat.enableEdgeToEdge(window)` (or `enableEdgeToEdge()`) in `onCreate`. Bars become transparent, except that 3-button navigation gets a translucent scrim. `Window.setNavigationBarContrastEnforced(false)` removes that scrim. Status-bar icon color is set with `WindowCompat.getInsetsController(window, window.decorView).isAppearanceLightStatusBars`. — [Android Developers: Edge-to-edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge)
- Inset types:
  - `systemBars()`: "best for views that are tappable and that must not be visually obscured by the system bars."
  - `displayCutout()`: the area where a device cutout may exist.
  - `systemGestures()`: "gesture-navigational areas used by the system that take priority over your app", recommended for bottom sheets and game swiping.

  On Android 10+ the bottom systemGestures inset is the home gesture and the left/right insets are back gestures. — [Android Developers: Edge-to-edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge)
- Immersive mode uses `WindowInsetsControllerCompat.hide(WindowInsetsCompat.Type.systemBars())`. — [Android Developers: Edge-to-edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge)
- Gotcha: on Android 10 and earlier, insets aren't dispatched to siblings after returning `CONSUMED`. Call `ViewGroupCompat.installCompatInsetsDispatch(rootView)` (AndroidX Core 1.16.0-alpha01+). Full-screen dialogs need `WindowCompat.enableEdgeToEdge(dialog.window)` in `onStart()`. In desktop windowing the caption bar is always visible. — [Android Developers: Edge-to-edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge)

**Orientation on large screens (Android 16)**
- For targetSdk 36, `screenOrientation`, `resizableActivity`, `min/maxAspectRatio` and `setRequestedOrientation()` are ignored on displays with sw ≥ 600dp. Apps fill the window with no pillarboxing. Exceptions:
  - games, identified by the `android:appCategory` flag
  - users who opt in through the device's aspect-ratio settings
  - screens smaller than sw600dp

  A temporary opt-out is `PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY`, which "won't apply when targeting API level 37." — [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16)

**Predictive back**
- For targetSdk 36 on Android 16+, "the predictive back system animations (back-to-home, cross-task, and cross-activity) are enabled by default. Additionally, `onBackPressed` is not called and `KeyEvent.KEYCODE_BACK` is not dispatched anymore." The temporary opt-out is `android:enableOnBackInvokedCallback="false"`. — [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16)
- From Android 15 the developer option is gone, and system animations show for apps that opted in. Use AndroidX `OnBackPressedCallback` (Activity 1.6.0+), or `PredictiveBackHandler`/`BackHandler` in Compose (activity-compose 1.8.0+). Callbacks form a stack, and "the last added enabled callback handles the next back gesture." — [Android Developers: Predictive back](https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture)
- An enabled callback at `PRIORITY_DEFAULT` or `PRIORITY_OVERLAY` means "the predictive back animations don't run and you must handle the back event." Tie the callback's enabled state to observable UI state instead of deciding conditionally inside the callback. "Don't create these callbacks to run business logic or to log." Android 16 adds `PRIORITY_SYSTEM_NAVIGATION_OBSERVER` for observing without consuming. — [Android Developers: Predictive back](https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture)

**Material 3 bottom sheets (Material Components for Android)**
- Modal sheets (`BottomSheetDialogFragment`) sit above a scrim and dismiss on outside tap or drag-down, since `behavior_hideable` defaults to true for modal sheets. Standard sheets have no scrim. — [MDC-Android BottomSheet docs](https://github.com/material-components/material-components-android/blob/master/docs/components/BottomSheet.md)
- `maxWidth` defaults to 640dp. `BottomSheetDragHandleView` has a 48dp minimum, and you need to leave at least 48dp at the top for it. It is the main accessibility affordance for TalkBack, Switch Access and Voice Access: tap toggles expand/collapse and double-tap hides. — [MDC-Android BottomSheet docs](https://github.com/material-components/material-components-android/blob/master/docs/components/BottomSheet.md)
- "The modal BottomSheetDialogFragment and BottomSheetDialog components automatically support predictive back." Standard sheets need a custom `OnBackPressedCallback`, enabled only in the expanded and half-expanded states. `ThemeOverlay.Material3.BottomSheetDialog` already sets `enableEdgeToEdge`. — [MDC-Android BottomSheet docs](https://github.com/material-components/material-components-android/blob/master/docs/components/BottomSheet.md)

**Touch targets**
- "We recommend that each interactive UI element have a focusable area, or touch target size, of at least 48dp x 48dp. Larger is even better." Padding can make up the difference for a smaller visual element. — [Android Developers: Make apps more accessible](https://developer.android.com/guide/topics/ui/accessibility/apps); [Google Accessibility Help: Touch target size](https://support.google.com/accessibility/android/answer/7101858)
- Google suggests 8dp or more between targets. Accessibility Scanner flags targets under 48dp, or under 32dp at a display edge. — [Google Accessibility Help: Touch target size](https://support.google.com/accessibility/android/answer/7101858)

**Haptics**
- "Use a `View` (recommended). This approach is action-oriented, has the widest support, and doesn't require the `VIBRATE` permission." `HapticFeedbackConstants` have fallback behavior, so the only consideration is the SDK level of each constant. "All haptic feedback methods respect the user's touch feedback settings by default." — [Android Developers: Haptic feedback](https://developer.android.com/develop/ui/views/haptics/haptic-feedback)
- Examples: `VIRTUAL_KEY`/`VIRTUAL_KEY_RELEASE` on down/up. "A `CONFIRM` effect is a short and light vibration"; "a `REJECT` might be a stronger feedback to signal failure." — [Android Developers: Haptic feedback](https://developer.android.com/develop/ui/views/haptics/haptic-feedback)
- "We strongly discourage using older `Vibrator` methods employing `createOneshot` or `createWaveform`… often too loud." If an effect isn't available, prefer "falling back to nothing rather than a discordant alternative." — [Android Developers: Haptic feedback](https://developer.android.com/develop/ui/views/haptics/haptic-feedback)

**Keep screen on**
- `window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)` or `android:keepScreenOn="true"`. The flag "may only be set in an activity." Clear it with `clearFlags(...)` when it's no longer needed. The system lets the screen turn off when the app is backgrounded. Do this "for as short a time as possible" to save battery. — [Android Developers: Keep the screen on](https://developer.android.com/develop/background-work/background-tasks/awake/screen-on)

### Inferences
- Plan on targetSdk 36 now. Edge-to-edge is mandatory and `onBackPressed` is dead, so the shell must forward insets to the WebView (section 3) and route back gestures through a JS bridge.
- To get the native "back closes sheet first" behavior: register one `OnBackPressedCallback` whose `isEnabled` mirrors a JS-reported "overlay open" flag. When it fires, tell JS to close the topmost sheet. When no overlay is open, disable the callback so the system back-to-home animation runs.
- Set `android:appCategory="game"` if you want to keep a portrait lock on tablets under targetSdk 36. Otherwise expect the WebView to get landscape tablet windows and plan a responsive layout.
- Bridge haptics:
  - Card snap: `CLOCK_TICK` or `VIRTUAL_KEY`.
  - Valid play: `CONFIRM`.
  - Invalid play: `REJECT`.
  - Drag start: `DRAG_START`, if minSdk allows.

  Call them on the WebView itself so no `VIBRATE` permission is needed.

### Gaps
- I couldn't read API levels for the `HapticFeedbackConstants` list: the reference page is too long for the fetch tool. From memory, `CONFIRM`/`REJECT`/`GESTURE_START`/`GESTURE_END` are API 30, `TOGGLE_ON/OFF`, `DRAG_START`, `SEGMENT_TICK` and `SEGMENT_FREQUENT_TICK` are API 34, and `FLAG_IGNORE_GLOBAL_SETTING` was deprecated in API 33. All of this is unverified.
- m3.material.io guideline pages render client-side and couldn't be read, so Material 3 / M3 Expressive visual guidance (shape, motion, typography scale) isn't captured. The MDC-Android component docs were used instead.
- I found no Compose-specific keep-screen-on guidance.

## 3. WebView polish: tap highlight, touch-action, overscroll, user-select, passive listeners, env(safe-area-inset-*) on Android WebView, 300ms delay, ProMotion/120Hz, compositor-friendly animation, font loading

### Takeaway
The biggest WebView-specific risks are on Android and in frame rate:
- **Android WebView safe areas:** WebView forwards insets as `env(safe-area-inset-*)` only from M136 (fullscreen only) and M144 (all WebViews). Versions before about 140 have reported wrong values, so the shell should inject its own `--safe-area-inset-*` CSS variables from `WindowInsetsCompat`.
- **iOS frame rate:** WKWebView `requestAnimationFrame` is still reported capped at 60 fps even with `CADisableMinimumFrameDurationOnPhone`. As of Sept 2026 there is no public API, so design animations to look good at 60 Hz.
- **iOS overscroll:** `overscroll-behavior` is only partially supported in iOS WebKit, so disable bounce natively with `scrollView.bounces`.
- **Tap delay:** with `width=device-width` and `touch-action: manipulation` it is effectively gone on both platforms.

### Cited Findings
**Safe areas in Android WebView**
- Milestones:
  - "In M136, WebView added support for displayCutout() insets and systemBars() insets", passed to web content only "when the WebView was fullscreen."
  - In M139 WebView "adopted support for the ime() inset type so that the Visual Viewport could be resized independently of the Layout Viewport."
  - In M144 "we expanded inset support to all WebViews regardless of whether they are displaying fullscreen or not."

  Insets "should still only report non-zero values when the UI directly overlaps with WebView's bounds." — [Chromium: Android WebView & Insets](https://chromium.googlesource.com/chromium/src/+/main/android_webview/docs/insets.md)
- Consumption gotcha: "If you return the constant WindowInsets.CONSUMED from your method, WebView will not send any safe area insets to the web contents." It is preferred to return insets with those types zeroed. Padding the WebView natively while also letting it pass insets through causes "extra spacing." — [Chromium: Android WebView & Insets](https://chromium.googlesource.com/chromium/src/+/main/android_webview/docs/insets.md)
- The English Android developer page still describes M136 as "Fullscreen WebViews only". The Chromium doc and the localized Android pages list the M144 expansion. — [Android Developers: Understand window insets in WebView](https://developer.android.com/develop/ui/views/layout/webapps/understand-window-insets); [Chromium insets.md](https://chromium.googlesource.com/chromium/src/+/main/android_webview/docs/insets.md)
- Practitioner report: "Due to a bug in some older versions of Android WebView (< 140), correct safe area values are not available via the `safe-area-inset-x` CSS `env` variables." The top inset is sometimes 0 or off by a few px. Capacitor 8.3.0+ reads `WindowInsetsCompat` natively and injects `--safe-area-inset-*` custom properties. The recommendation is `var(--safe-area-inset-top, env(safe-area-inset-top))`. On iOS, `env()` values "have always been correct." — [Capawesome: Capacitor edge-to-edge & safe areas guide](https://dev.to/capawesome/capacitor-edge-to-edge-safe-areas-the-complete-guide-k30)
- `viewport-fit=cover` is the opt-in on both platforms. In Chromium Android, `cover` maps to `LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES`. — [Chromium: Display cutout doc](https://chromium.googlesource.com/chromium/src.git/+/fafff21/docs/ui/android/display_cutout.md); [Chrome: edge-to-edge migration guide](https://developer.chrome.com/docs/css-ui/edge-to-edge)
- Third-party report: Android WebView reports non-zero insets even with `viewport-fit=contain/auto`, while iOS reports zero unless `cover` is set (Google issue 396827865). — [NiklasMerz/edge repro](https://github.com/NiklasMerz/edge)
- Chrome (browser, not WebView) 135+ added `safe-area-max-inset-bottom` and a dynamic `safe-area-inset-bottom`. It recommends `bottom: env(safe-area-inset-bottom, 0px)` over padding, which "results in layout thrashing." — [Chrome: edge-to-edge migration guide](https://developer.chrome.com/docs/css-ui/edge-to-edge)

**Tap delay and tap highlight**
- WebKit iOS: "viewports that have width=device-width will have fast single tapping when the user is at initial scale." `touch-action: manipulation` gives fast taps at all zoom scales and is inherited by descendants. `user-scalable=no` disables double-tap entirely. The baseline delay was 350 ms (WebKit blog, Dec 2015). — [WebKit: More Responsive Tapping on iOS](https://webkit.org/blog/5610/more-responsive-tapping-on-ios/)
- Chrome: "As of Chrome 32… this delay is gone for mobile-optimized sites" with `width=device-width`. `touch-action: manipulation` is the alternative. — [Chrome Developers: 300ms tap delay, gone away](https://developer.chrome.com/blog/300ms-tap-delay-gone-away)
- `-webkit-tap-highlight-color` is non-standard. `-webkit-tap-highlight-color: transparent` removes the highlight, and the initial value is black. — [MDN: -webkit-tap-highlight-color](https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-tap-highlight-color)

**Overscroll / rubber-banding**
- caniuse lists iOS Safari 16.0–26.3 as "Partial support" for `overscroll-behavior`. The web-features explorer lists Safari iOS as unsupported (webkit.org/b/243452). The two sources disagree. — [caniuse: overscroll-behavior](https://caniuse.com/css-overscroll-behavior); [web-features explorer](https://web-platform-dx.github.io/web-features-explorer/features/overscroll-behavior/)
- WebKit bug 275947: `overscroll-behavior: none/contain` doesn't disable pull-to-refresh on iOS 16, and the reporter saw the same on iOS 18 beta. — [WebKit Bug 275947](https://bugs.webkit.org/show_bug.cgi?id=275947)
- In WKWebView the common fix is native `webView.scrollView.bounces = false` (Stack Overflow practitioner consensus, surfaced via search). — [WebKit Bug 158325 / related discussions](https://bugs.webkit.org/show_bug.cgi?id=158325)

**120 Hz / ProMotion**
- `CADisableMinimumFrameDurationOnPhone` in Info.plist unlocks the full refresh range for `CADisplayLink`/`CAAnimation` on iPhone 13 Pro and later. This is a secondary source quoting Apple documentation. — [iClarified (quoting Apple docs)](https://www.iclarified.com/82663/apple-posts-developer-documentation-for-promotion-on-iphone-13-pro-12-refresh-rates-used)
- WebKit bug 294338, "Allow WKWebView to Support 120Hz Refresh Rate on ProMotion Devices", was filed 2025-06-11 and is still NEW and unassigned as of last modification 2026-09-17. Commenters report WKWebView "was still hard-capped to 60fps -- even if Info.plist setting for CADisableMinimumFrameDurationOnPhone is set." Turning off Safari's "Prefer Page Rendering Updates near 60fps" gives 120 fps in Home Screen web apps on iOS 26, but not in WKWebView apps. Internal pref `PreferPageRenderingUpdatesNear60FPSEnabled` exists but has no public embedder API. Capacitor and Tauri plugins reportedly use private WebKit API to get 120 Hz. — [WebKit Bug 294338](https://bugs.webkit.org/show_bug.cgi?id=294338)
- An Apple Developer Forums thread likewise reports `requestAnimationFrame` throttled to 60 Hz in WKWebView. — [Apple Developer Forums: WKWebView 120hz Support](https://developer.apple.com/forums/thread/773222)

**Haptics from web content**
- iOS Safari/WebKit doesn't implement `navigator.vibrate`, and all iOS browsers inherit this. Practitioner sources describe a hidden `<input type="checkbox" switch>` hack (Safari 17.4/18+) that triggers a system haptic, and call it non-standard. — [web-haptics browser support](https://www.mintlify.com/lochie/web-haptics/advanced/browser-support); [caniuse: navigator.vibrate](https://caniuse.com/mdn-api_navigator_vibrate)

**Android text scaling**
- The Android system font-size setting changes WebView `textZoom`, which scales text rather than CSS px and can break layouts. Apps commonly pin it with `webSettings.textZoom = 100` (practitioner sources, not official docs). — [Capawesome: Text Zoom](https://capawesome.io/docs/sdks/capacitor/text-zoom/)
- A Blink "Intent to Ship: CSS env variable for OS-level font scale" exists. I did not read its details. — [blink-dev thread](https://groups.google.com/a/chromium.org/g/blink-dev/c/bZuQAcwcEig)

**Native shell patterns (practitioner)**
- Stable Money's "WebShell":
  - disables zoom at WebView construction
  - uses `user-select: none` on non-selectable regions
  - uses `env(safe-area-inset-top)`, falling back to native-measured heights on old Android WebViews
  - uses a promise-based JS bridge
  - sends Android hardware back to the page instead of popping WebView history, so the page can close modals first
  - preloads a background WebView after the splash
  — [Stable Money Engineering: WebShell](https://stablemoney.in/engineering/webshell-making-web-content-feel-native)

### Inferences
- Recommended baseline CSS for game screens:
  - `html, body { overscroll-behavior: none; -webkit-tap-highlight-color: transparent; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; touch-action: manipulation; }`
  - Re-enable `user-select: text` on the name input.
  - Replace the removed tap highlight with a custom `:active` press state, scale 0.97 plus a shadow change, so taps still feel acknowledged.
- Viewport: `width=device-width, initial-scale=1, viewport-fit=cover`. Pad HUD and hand using `max(var(--safe-area-inset-*, env(safe-area-inset-*)), 8px)` so Android WebView builds before 140 still get correct values from the shell.
- Animate only `transform` and `opacity`, and use `will-change` sparingly on dragged cards. Treat 60 fps as the ceiling on iOS WKWebView. Android WebView typically follows display refresh, but this wasn't verified here.
- Native shell settings to consider, all unverified this session:
  - iOS: `scrollView.bounces = false`; `scrollView.contentInsetAdjustmentBehavior = .never` (let CSS handle safe areas); `isOpaque = false` plus a matching `backgroundColor` to avoid a white flash; `allowsLinkPreview = false`; `allowsBackForwardNavigationGestures = false`.
  - Android: `overScrollMode = OVER_SCROLL_NEVER`; `textZoom = 100`, or better, honor it deliberately for accessibility.

### Gaps
- Passive event listeners, `will-change` and font loading (`font-display`, preloading bundled fonts from app assets) were not researched with primary sources this session.
- I found no authoritative doc on whether Android WebView `requestAnimationFrame` runs at 90/120 Hz on high-refresh devices.
- The white-flash fix (`isOpaque = false`), `contentInsetAdjustmentBehavior`, and `WKPreferences.isTextInteractionEnabled` (iOS 14.5+, from memory) are not source-verified.
- Current WebKit status of webkit.org/b/243452 (overscroll-behavior on iOS) wasn't checked.

## 4. Text input in a WebView game (name field): keyboard avoidance and iOS input zoom

### Takeaway
On iOS, set the input's computed font-size to at least 16px or WebKit zooms the page on focus. On Android under edge-to-edge, keyboard resizing for WebView arrived in M139 through the `ime()` inset resizing the visual viewport. Don't consume insets in a native listener, or WebView never sees keyboard changes. Placing the name field in the upper half of a sheet or screen sidesteps most avoidance bugs.

### Cited Findings
- iOS auto-zooms when the rendered font size of an input is under 16px, even 15.75px. Fixes:
  - set inputs to 16px or more, for example body 16px and inputs 1em
  - add `maximum-scale=1`, which limits zoom
  - use a scale transform on a 16px input

  These are practitioner sources about Safari. They don't specifically cover WKWebView. — [Rick Strahl: Preventing iOS Textbox Auto Zooming](https://weblog.west-wind.com/posts/2023/Apr/17/Preventing-iOS-Textbox-Auto-Zooming-and-ViewPort-Sizing); [CSS-Tricks (Josh Comeau TIL)](https://css-tricks.com/?p=339455)
- `user-scalable=no` / equal min/max scale makes WebKit disable double-tap and send taps immediately. — [WebKit: More Responsive Tapping on iOS](https://webkit.org/blog/5610/more-responsive-tapping-on-ios/)
- Android WebView before M139: "both WebView's Layout and Visual Viewports were fixed and identical", and the IME could hide elements. From M139 "the ime insets directly affect the size of the Visual Viewport." This applies only when the bottom of the WebView goes off-screen. Expect more `resize` events. Chromium also notes that resize events "are clearing the page's focus" in some cases. — [Chromium: Android WebView & Insets](https://chromium.googlesource.com/chromium/src/+/main/android_webview/docs/insets.md)
- If the app consumes IME insets natively, "The keyboard may cover inputs near the bottom of the page," and `scrollIntoView` may fail. — [Chromium: Android WebView & Insets](https://chromium.googlesource.com/chromium/src/+/main/android_webview/docs/insets.md); [Android Developers: Understand window insets in WebView](https://developer.android.com/develop/ui/views/layout/webapps/understand-window-insets)

### Inferences
- Name field: `font-size: 16px` (or larger), `autocomplete="nickname"`, `enterkeyhint="done"`, `autocapitalize="words"`, `spellcheck="false"`, and `maxlength`. Re-enable `user-select: text` on it.
- Position the field and its confirm button using `visualViewport.height` (listen to `visualViewport` resize). Don't use `100vh`. `dvh`/`svh` units are an alternative.
- On Android devices with WebView before M139, fall back to native handling: apply `WindowInsetsCompat.Type.ime()` bottom inset as WebView padding or margin. Detect the version via `WebView.getCurrentWebViewPackage()` (API, from memory).
- On iOS, consider hiding the form accessory bar (prev/next/done). This needs a private-API-adjacent swizzle in WKWebView, so evaluate App Review risk; unverified.

### Gaps
- I found no primary Apple/WebKit doc confirming that the 16px threshold applies identically in WKWebView. Practitioner consensus says yes, but verify on device.
- I didn't research `interactive-widget=resizes-content` in Android WebView. The Chrome edge-to-edge page doesn't mention it.
- Native iOS keyboard avoidance for WKWebView (it scrolls the content inset automatically) wasn't researched with primary sources.

## 5. Sheets/modals conventions on both platforms for settings and results; back gesture closing sheets

### Takeaway
iOS sheets: one at a time, swipe-down to dismiss, grabber when resizable, medium detent for progressive disclosure. Cancel goes on the leading side and Done on the trailing side, and Done is always paired with Cancel or Back. Android modal bottom sheets: scrim, tap-outside and drag-down dismissal, 48dp drag handle, 640dp max width, and system back closes the sheet first (built-in predictive back for the MDC dialog sheet). In a WebView you reproduce these behaviors in HTML and wire Android back through `OnBackPressedCallback`.

### Cited Findings
**iOS (HIG: Sheets, updated March 24, 2026 for button placement)**
- "A sheet helps people perform a scoped task that's closely related to their current context." It can be modal or nonmodal on iOS. For complex or prolonged flows, consider the full-screen modal style. — [HIG: Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- "Display only one sheet at a time from the main interface." Close the first sheet before showing a second. — [HIG: Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- Detents: large is full height and medium is "about half". Large is always supported. Medium-only prevents full expansion. "In an iPhone app, consider supporting the medium detent to allow progressive disclosure." Custom detents are allowed. — [HIG: Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- "Include a grabber in a resizable sheet." Tapping it cycles detents, and it works with VoiceOver. — [HIG: Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- "Support swiping to dismiss a sheet." If there are unsaved changes, use an action sheet to confirm. — [HIG: Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- Buttons:
  - Cancel/Close dismisses without saving. Done dismisses after completing or saving. Back navigates steps and "isn't intended to dismiss a sheet."
  - "If you provide a Done button, always pair it with a Cancel button… or a Back button." "Avoid showing all three."
  - Cancel goes on the leading edge of the top toolbar and Done on the trailing edge.
  — [HIG: Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- Developer APIs: SwiftUI `sheet(item:onDismiss:content:)`, UIKit `UISheetPresentationController`, `detents` and `prefersGrabberVisible`. — [HIG: Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)

**Android (MDC-Android / predictive back)**
- Modal bottom sheet: scrim, dismissal on outside tap, drag-down to hide, 640dp default max width, 48dp drag handle, and automatic predictive back for `BottomSheetDialog`/`BottomSheetDialogFragment`. — [MDC-Android BottomSheet docs](https://github.com/material-components/material-components-android/blob/master/docs/components/BottomSheet.md)
- The back callback stack means the innermost enabled callback handles back first. At the root, the system plays back-to-home. Enabling a callback suppresses the system predictive animation for that event. — [Android Developers: Predictive back](https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture)
- `systemGestures()` insets are recommended "for bottom sheets" so drag areas don't fight the home gesture. — [Android Developers: Edge-to-edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge)

### Inferences
- Settings as a web sheet: medium-height bottom sheet with a top grabber or drag handle at least 44pt/48dp tall. Swipe down or tap the scrim to dismiss, and close with Done or a close button. Settings toggles apply instantly, so no Cancel/Done pair is needed. If you show a Done button, also show Cancel, per the iOS rule.
- Round results: a non-dismissible-by-swipe modal or full sheet with explicit primary ("Play again") and secondary ("Home") actions. Swipe-dismissing results is ambiguous, so treat it like the "unsaved changes" case and disable it.
- Android back: when JS reports a sheet open, enable the native callback and close the sheet in JS. On the results screen, back should map to "Home", not exit. In the lobby or root, disable the callback so predictive back-to-home animates.
- iOS has no system back gesture inside a WKWebView, assuming `allowsBackForwardNavigationGestures` is off. Swipe-down on sheets is the expected affordance, so implement it with pointer events and `touch-action: none` on the sheet handle.

### Gaps
- I couldn't read the Material 3 bottom-sheet guidance at m3.material.io (client-rendered), so there are no M3 spec values for corner radius, elevation or motion.
- HIG "Modality" and "Alerts" pages were not fetched.

## 6. Store/platform requirements that affect UI: Local Network (iOS), NEARBY_WIFI_DEVICES (Android), app icons, launch/splash screens

### Takeaway
On iOS, traffic from WKWebView itself doesn't trigger the Local Network prompt. Any native LAN networking, Bonjour, or sockets to private IPs does, and needs `NSLocalNetworkUsageDescription` (plus `NSBonjourServices`, and the multicast entitlement for broadcast/multicast). On Android, `NEARBY_WIFI_DEVICES` applies only to Wi-Fi Direct, Aware, LocalOnlyHotspot and RTT APIs, not to ordinary LAN sockets. For icons, iOS now wants layered Icon Composer icons with Liquid Glass and dark/clear/tinted variants. Android splash screens must use the SplashScreen API's icon sizes.

### Cited Findings
**iOS Local Network privacy (TN3179, revised 2026-10-06)**
- Operations that need access:
  - outgoing TCP connections
  - UDP unicast, multicast and broadcast sends
  - connecting a UDP socket
  - receiving UDP multicast or broadcast
  - resolving `.local` names
  - "All Bonjour operations"

  Listening for and accepting incoming TCP, and receiving UDP unicast, do not need access. — [Apple TN3179](https://developer.apple.com/documentation/technotes/tn3179-understanding-local-network-privacy)
- "Traffic originating from WKWebView, SFSafariViewController, and Safari doesn't require local network access." — [Apple TN3179](https://developer.apple.com/documentation/technotes/tn3179-understanding-local-network-privacy)
- Add `NSLocalNetworkUsageDescription` to explain the behavior, and `NSBonjourServices` for the service types you register or browse (Multipeer: `_name._tcp`). Multicast or broadcast requires `com.apple.developer.networking.multicast`. "The user is more likely to grant… if they understand the context of the request." — [Apple TN3179](https://developer.apple.com/documentation/technotes/tn3179-understanding-local-network-privacy)
- "There's no API to explicitly bring up the local network alert"; it can be triggered implicitly by connecting a UDP socket to a local address. "There's no general API that returns whether the current process has local network access." Detect denial via `NWBrowser` `kDNSServiceErr_PolicyDenied` (-65570), or `NWConnection` `.waiting` with `unsatisfiedReason == .localNetworkDenied`. — [Apple TN3179](https://developer.apple.com/documentation/technotes/tn3179-understanding-local-network-privacy)
- If the app is in the background with an undetermined privilege, the operation is denied silently. The simulator doesn't support Local Network privacy. An iOS 18 state-sync bug was fixed in 18.6. — [Apple TN3179](https://developer.apple.com/documentation/technotes/tn3179-understanding-local-network-privacy)

**Android NEARBY_WIFI_DEVICES**
- Apps targeting API 33+ that manage Wi-Fi connections request `NEARBY_WIFI_DEVICES`. It is in the "Nearby devices" group with Bluetooth and UWB, toggled as a group. Declare `usesPermissionFlags="neverForLocation"` if location isn't derived. Keep `ACCESS_FINE_LOCATION` with `maxSdkVersion="32"` for older versions. — [Android Developers: Wi-Fi permissions](https://developer.android.com/develop/connectivity/wifi/wifi-permissions)
- It's required for `WifiManager.startLocalOnlyHotspot()`, `WifiAwareManager.attach`, `WifiAwareSession.publish/subscribe`, `WifiP2pManager` methods (`discoverPeers`, `connect`, `createGroup`, `discoverServices`…), and `WifiRttManager.startRanging()`. NSD is not in the list. `getScanResults()`/`startScan()` still need fine location. — [Android Developers: Wi-Fi permissions](https://developer.android.com/develop/connectivity/wifi/wifi-permissions)

**iOS app icons (HIG: App icons; updated 2025-06-09, 2026-06-08, 2026-10-28)**
- Prefer a layered Icon Composer file over a flat bitmap. With bitmaps, Liquid Glass applies only to "large, simple shapes." Layers are a background plus one or more foreground layers, and there should be no pre-applied masking or custom highlights, shadows or blurs ("Let the system handle blurring and other visual effects"). Layout size is 1024x1024 px, square, with system-rounded corners. — [HIG: App icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- Appearances: default, dark, clear light, clear dark, tinted light and tinted dark. The system generates any you omit. "Keep your icon's features consistent across appearances." Avoid text, photos and UI replicas. Alternate icons need their own variants and go through App Review. — [HIG: App icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- See WWDC25 sessions 220 ("Say hello to the new look of app icons") and 361 ("Create icons with Icon Composer"). — [HIG: App icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)

**Android splash screen (SplashScreen API)**
- `androidx.core:core-splashscreen` backports to API 23. Icon with icon background: 240x240 dp within a 160 dp circle. Without background: 288x288 dp within a 192 dp circle. Animated icon is an AVD at 432 dp, with ≤1,000 ms recommended and a start delay ≤166 ms. The splash is dismissed on the first frame. A `ViewTreeObserver.OnPreDrawListener` can hold it until ready, for example until the WebView's first paint. Migrate custom Android 11-era splash screens. — [Android Developers: Splash screens](https://developer.android.com/develop/ui/views/launch/splash-screen)
- On iOS, `UIStatusBarStyle` sets the initial status-bar style before JavaScript loads and "should match the launch screen" (Capacitor guidance). — [Capawesome guide](https://dev.to/capawesome/capacitor-edge-to-edge-safe-areas-the-complete-guide-k30)

### Inferences
- A same-LAN multiplayer card game whose networking runs entirely in JS inside WKWebView (WebSocket or fetch to a LAN IP) shouldn't trigger the iOS Local Network prompt, per TN3179. Native Bonjour or Multipeer discovery will trigger it. Show an in-app primer ("Find friends on this Wi-Fi") right before the first native discovery call, and handle denial with a Settings deep link.
- On Android, ordinary sockets or NSD on the same Wi-Fi likely need only `INTERNET` (and `CHANGE_WIFI_MULTICAST_STATE` for multicast). Request `NEARBY_WIFI_DEVICES` only if you use Wi-Fi Direct, Aware or LocalOnlyHotspot. This is an inference, since the page doesn't address NSD.
- Hold the native splash until the WebView signals "ready", for example via a JS bridge message after first meaningful paint. Set WebView background colors to match the splash so no white flash shows between them.

### Gaps
- TN3179 doesn't say whether App Review has specific copy rules for `NSLocalNetworkUsageDescription`, and App Store Review Guidelines weren't fetched.
- I didn't verify the NSD/mDNS permission needs on Android 13+ (the NSD guide wasn't read), or whether `CHANGE_WIFI_MULTICAST_STATE` is required.
- iOS launch screen configuration (`UILaunchScreen` Info.plist dictionary vs. storyboard) wasn't researched with a primary source this session.
- Google Play policy pages (for example the Families policy and the target API level deadline for 2026) weren't fetched. The Play requirement to target a recent API level, which drives targetSdk 35/36 adoption, is unverified here.
