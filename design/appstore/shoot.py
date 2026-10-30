"""App Store screenshots from the real iOS app in the simulator.

Each shot: a fresh install, a first launch whose page saves the shot's state through the app's own
bridge (as the game would), then a second launch that opens on that state and taps what the shot
needs. The app's debug build runs `-kitcEval <js>` once the page has loaded.

    python3 shoot.py [iphone|iphone63|ipad|duo|duo-inner ...] [shot ...]
"""
import json
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).parent
APP = str(HERE.parents[1] / "ios/build/sim/Build/Products/Debug-iphonesimulator/KingsCorner.app")
BUNDLE = "com.kizmiz.kingscorner"
DEVICES = {"iphone": "6C8470C1-2AD7-4D59-941F-BA7A04DA0253", "iphone63": "070DCAC7-2625-476E-85F4-0CD8A8C63CD0", "ipad": "33F80859-52FF-48C1-8985-18CC30A52B67",
           "duo": "3F3D9B5C-949A-4BA8-B0DC-7F4EE24AA598", "duo-inner": "3F3D9B5C-949A-4BA8-B0DC-7F4EE24AA598"}
# App Store Connect: 1320 x 2868, 1206 x 2622 (the size it requires), 2064 x 2752, and iPhone Duo's
# cover and inner screens, 1398 x 2034 and 2007 x 2853. The Duo's inner screen is display 3; the
# simulator has to be unfolded by hand first (DeviceHub), as simctl can't fold it.
FOLDERS = {"iphone": "iphone-6.9", "iphone63": "iphone-6.3", "ipad": "ipad-13", "duo": "iphone-duo-cover", "duo-inner": "iphone-duo-inner"}
DISPLAYS = {"duo": "1", "duo-inner": "3"}
STATES = json.loads((HERE / "states.json").read_text())

SETTINGS = {"hints": True, "autoEnd": False, "haptics": True, "name": "Maya", "avatar": "star", "pace": "normal"}
TABLE4 = {"variant": "classic", "players": 4, "rivals": ["leo", "june", "nana"], "match": False}

PICK = "document.querySelector('.hand .card.playable')?.click();"
DEVIL = """
const later = window.setTimeout;
window.setTimeout = (f, ms, ...a) => later(f, ms === 2200 ? 600000 : ms, ...a);
const red = [...document.querySelectorAll('.hand .card.playable')].find((c) => /^K[hd]/.test(c.dataset.card));
red.click();
document.querySelector('.spot.corner.target').click();
"""
CLICK = lambda *sels: "".join(f"setTimeout(() => document.querySelector('{s}')?.click(), {400 * i});" for i, s in enumerate(sels))

SHOTS = {
    "1-kings": ({"kitc.game": STATES["kings"]["kept"], "kitc.table": TABLE4}, PICK, 1),
    "2-devils": ({"kitc.game": STATES["devils"]["kept"], "kitc.table": {**TABLE4, "variant": "demons", "players": 3, "rivals": ["leo", "nana"]}}, DEVIL, 1),
    "3-match": ({"kitc.game": STATES["match"]["kept"], "kitc.table": {**TABLE4, "match": True}}, "", 2),
    "4-family": ({"kitc.table": TABLE4}, CLICK("[data-go=setup]"), 1),
    "5-wifi": ({"kitc.table": TABLE4}, CLICK("[data-go=wifi]", "[data-act=host]"), 2),
    "6-home": ({"kitc.table": TABLE4}, "", 1),
    "7-rules": ({"kitc.table": TABLE4}, CLICK("[data-go=rules]"), 1),
}


def sh(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout


def launch(dev, js):
    sh("xcrun", "simctl", "launch", "--terminate-running-process", dev, BUNDLE, "-kitcEval", js)


LOG = "window.webkit.messageHandlers.native.postMessage({type: 'log', text: %s});"


def wait_for(dev, marker, since, timeout=60):
    """Until the page logs `marker` (the app NSLogs a page's log messages)."""
    end = time.time() + timeout
    while time.time() < end:
        out = subprocess.run(["xcrun", "simctl", "spawn", dev, "log", "show", "--style", "compact", "--start", since,
                              "--predicate", f'process == "KingsCorner" AND eventMessage CONTAINS "{marker}"'],
                             capture_output=True, text=True).stdout
        if marker in out:
            return
        time.sleep(1)
    raise TimeoutError(marker)


def now():
    return time.strftime("%Y-%m-%d %H:%M:%S")


def shoot(device, name):
    dev = DEVICES[device]
    saved, action, wait = SHOTS[name]
    subprocess.run(["xcrun", "simctl", "terminate", dev, BUNDLE], capture_output=True)
    subprocess.run(["xcrun", "simctl", "uninstall", dev, BUNDLE], capture_output=True)
    sh("xcrun", "simctl", "install", dev, APP)
    values = {"kitc.settings": SETTINGS, **saved}
    store = "".join(f"window.webkit.messageHandlers.native.postMessage({{type: 'save', key: {json.dumps(k)}, value: {json.dumps(json.dumps(v))}}});"
                    for k, v in values.items())
    since = now()
    time.sleep(1)
    launch(dev, store + LOG % "'shot:saved'")
    wait_for(dev, "shot:saved", since)
    time.sleep(1)
    since = now()
    time.sleep(1)
    launch(dev, (action or "") + f"setTimeout(() => {{ {LOG % repr('shot:ready')} }}, 1600);")
    wait_for(dev, "shot:ready", since)
    time.sleep(wait)
    out = HERE / FOLDERS[device] / f"{name}.png"
    out.parent.mkdir(exist_ok=True)
    display = [f"--display={DISPLAYS[device]}"] if device in DISPLAYS else []
    sh("xcrun", "simctl", "io", dev, "screenshot", "--type=png", *display, str(out))
    return out


if __name__ == "__main__":
    devices = [a for a in sys.argv[1:] if a in DEVICES] or ["iphone", "iphone63", "ipad", "duo"]
    names = [a for a in sys.argv[1:] if a in SHOTS] or list(SHOTS)
    for device in devices:
        for name in names:
            print(shoot(device, name), flush=True)
