"""Every English text the app shows has its German (web/lang/de.js), with the same placeholders."""

import json
import re
import shutil
import subprocess
from pathlib import Path

import pytest

WEB = Path(__file__).resolve().parent.parent / "web"
CALL = re.compile(r"\bt\(\s*(['\"])((?:\\.|(?!\1).)*)\1")
NON_LITERAL = re.compile(r"\bt\(\s*[^'\"\s)]")


def texts() -> dict[str, str]:
    """English text -> the file it's in, for every t('...') in the app."""
    found = {}
    for path in sorted(WEB.glob("*.js")) + sorted(WEB.glob("engine/*.js")):
        for m in CALL.finditer(path.read_text()):
            found.setdefault(m.group(2).replace("\\'", "'"), path.name)
    return found


def german() -> dict[str, str]:
    out = subprocess.run(["node", "--input-type=module", "-e",
                          "import de from './lang/de.js'; console.log(JSON.stringify(de))"],
                         capture_output=True, text=True, cwd=WEB, check=True)
    return json.loads(out.stdout)


def test_every_t_call_takes_a_plain_string():
    for path in sorted(WEB.glob("*.js")) + sorted(WEB.glob("engine/*.js")):
        if path.name == "i18n.js":
            continue
        assert not NON_LITERAL.search(path.read_text()), f"{path.name}: t() needs the English text itself"


@pytest.mark.skipif(shutil.which("node") is None, reason="needs node")
def test_every_text_has_its_german():
    english = texts()
    de = german()
    assert len(english) > 100
    missing = [t for t in english if t not in de]
    assert missing == []
    assert sorted(set(de) - set(english)) == []          # nothing left over from removed texts
    holes = re.compile(r"\{(\w+)\}")
    for en, text in de.items():
        assert set(holes.findall(en)) == set(holes.findall(text)), en
        assert text.count("<b>") == en.count("<b>") and text.count("<br>") == en.count("<br>"), en
