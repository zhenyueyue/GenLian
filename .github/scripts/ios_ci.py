import json
import os
import plistlib
import re
import shutil
import subprocess
import sys
from pathlib import Path
from xml.etree import ElementTree
from verify_device_package import verify_coach_bundle


def report_tests(results, outcome):
    cases = []
    for report in sorted(results.glob("training-core*.xml")):
        try:
            cases.extend(ElementTree.parse(report).getroot().iter("testcase"))
        except ElementTree.ParseError as error:
            print(f"{report.name}: incomplete xUnit report: {error}")

    failed = sum(case.find("failure") is not None or case.find("error") is not None for case in cases)
    skipped = sum(case.find("skipped") is not None for case in cases)
    passed = len(cases) - failed - skipped
    lines = [f"TrainingCore: `swift test` status: {outcome}."]
    if cases:
        lines.append(f"xUnit test cases: {passed} passed, {failed} failed, {skipped} skipped.")
    else:
        log = (results / "training-core.log").read_text(encoding="utf-8", errors="replace")
        footer = re.search(r"Test run with ([1-9][0-9]*) tests?[^\n]*\bpassed after\b", log)
        if outcome == "success" and footer:
            passed = int(footer[1])
            lines.append(f"Swift Testing summary: {passed} passed, 0 failed. No xUnit case list was emitted.")
        else:
            lines.append("No test counts were available. See training-core.log for the build or test failure.")

    summary = "\n".join(lines) + "\n"
    print(summary, end="")
    (results / "training-core-summary.md").write_text(summary, encoding="utf-8")
    with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as file:
        file.write(summary)
    if outcome == "success" and (not passed or failed):
        raise SystemExit("Successful Swift command did not report a passing test run.")


def report_ui_tests(results, outcome):
    summary = json.loads((results / "ui-test-summary.json").read_text(encoding="utf-8"))
    passed, failed, skipped = (summary[key] for key in ("passedTests", "failedTests", "skippedTests"))
    summary_line = f"GenLianUITests: {passed} passed, {failed} failed, {skipped} skipped."
    print(summary_line)
    with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as file:
        file.write(summary_line + "\n")

    attachments = results / "ui-attachments"
    manifest = json.loads((attachments / "manifest.json").read_text(encoding="utf-8"))
    screenshots = results / "ui-screenshots"
    screenshots.mkdir(exist_ok=True)
    for case in manifest:
        for attachment in case["attachments"]:
            name = attachment.get("suggestedHumanReadableName", "")
            match = re.match(r"^([0-9]{2}[a-z]?(?:-[a-z]+)+)(?=[_.]|$)", name)
            source = attachments / attachment["exportedFileName"]
            if match and source.suffix.lower() == ".png":
                shutil.copyfile(source, screenshots / f"{match[1]}.png")
    if outcome == "success":
        if passed < 8 or failed or skipped:
            raise SystemExit("The eight required GenLian UI tests did not all pass.")
        required = {
            "01-today", "02-workout-detail", "03-training-setup", "04-strength-player",
            "05-between-set-rest", "06-workout-summary", "07-training-history", "08-history-detail",
            "09-recovery-player", "15-summary-scrolled-bottom", "16-accessibility-player",
            "17-accessibility-rest", "17b-accessibility-rest-next", "18-accessibility-summary-bottom",
            "19-accessibility-archived", "19a-accessibility-history-detail",
            "20-shoulder-press-player", "22-real-clock-summary",
            "23-background-resumed", "24-cold-recovery",
            "25-coach-settings", "26-live-activity-system",
        }
        missing = required - {path.stem for path in screenshots.glob("*.png")}
        if missing:
            raise SystemExit("Required UI screenshots missing: " + ", ".join(sorted(missing)))


def select_iphone(devices, destinations):
    supported, *_ = destinations.split("Ineligible destinations", 1)
    valid_ids = {
        match.upper()
        for match in re.findall(r"platform:\s*iOS Simulator\b[^\n]*?\bid:\s*([0-9a-f-]{36})\b", supported, re.I)
    }
    ranks = []
    for runtime, entries in devices.items():
        version = re.fullmatch(r"com\.apple\.CoreSimulator\.SimRuntime\.iOS-(\d+(?:-\d+)*)", runtime)
        if not version:
            continue
        for entry in entries:
            model = entry.get("deviceTypeIdentifier", "").removeprefix("com.apple.CoreSimulator.SimDeviceType.")
            if (
                entry.get("isAvailable")
                and entry.get("udid", "").upper() in valid_ids
                and model.startswith("iPhone-")
            ):
                preference = 2 if model == "iPhone-15-Pro-Max" else int(model.endswith("-Pro-Max"))
                ranks.append((
                    preference,
                    tuple(map(int, version[1].split("-"))),
                    entry.get("state") == "Booted",
                    entry["name"],
                    entry["udid"],
                ))
    return max(ranks, default=None)


def discover_simulator(results, scheme_path):
    devices = json.loads((results / "simulators.json").read_text(encoding="utf-8"))["devices"]
    destinations = (results / "destinations.log").read_text(encoding="utf-8")
    selected = select_iphone(devices, destinations)
    scheme = ElementTree.parse(scheme_path).getroot()
    has_tests = (
        any(item.get("skipped") != "YES" for item in scheme.findall("./TestAction/Testables/TestableReference"))
        or bool(scheme.findall("./TestAction/TestPlans/TestPlanReference"))
    )
    if selected is None:
        raise SystemExit("No available iPhone destination matched the GenLian scheme.")
    if not has_tests:
        raise SystemExit("No enabled test target or test plan in the shared GenLian scheme.")
    _, version, _, name, device = selected
    print(f"Selected {name}, iOS {'.'.join(map(str, version))}, {device}.")
    with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as file:
        file.write(f"device={device}\n")


def verify_resources(results, app):
    verify_coach_bundle(app)
    with (app / "Info.plist").open("rb") as file:
        info = plistlib.load(file)
    if "iPhoneSimulator" not in info.get("CFBundleSupportedPlatforms", ()):
        raise SystemExit("The built app does not declare iPhoneSimulator support.")
    executable = app / info["CFBundleExecutable"]
    if not executable.is_file() or not executable.stat().st_size:
        raise SystemExit("The simulator app executable is missing or empty.")
    print(f"Found iOS Simulator executable: {executable.name}.")

    plans = sorted(p for p in app.rglob("WorkoutPlans.json") if p.parent.suffix == ".bundle")
    source_plans = Path("ios/Sources/TrainingCore/Resources/WorkoutPlans.json")
    if len(plans) != 1 or json.loads(plans[0].read_bytes()) != json.loads(source_plans.read_bytes()):
        raise SystemExit("The embedded TrainingCore course resource is missing, duplicated, or different from the source.")
    print(f"Verified TrainingCore plans in {plans[0].relative_to(app)}.")

    catalog = app / "Assets.car"
    if not catalog.is_file() or not catalog.stat().st_size:
        raise SystemExit("The compiled asset catalog is missing or empty.")
    print("Found compiled Assets.car.")
    assetutil = shutil.which("assetutil")
    if assetutil is None:
        lookup = subprocess.run(["xcrun", "--find", "assetutil"], capture_output=True, text=True)
        assetutil = lookup.stdout.strip() if lookup.returncode == 0 else None
    if not assetutil:
        print("::warning::assetutil is unavailable; individual image renditions could not be verified.")
        return
    with (results / "asset-catalog.json").open("w", encoding="utf-8") as file:
        subprocess.run([assetutil, "--info", str(catalog)], stdout=file, check=True)
    entries = json.loads((results / "asset-catalog.json").read_text(encoding="utf-8"))
    names = {entry.get("Name") for entry in entries}
    assets = Path("ios/GenLian/Assets.xcassets")
    expected = {path.stem for path in assets.rglob("*.imageset")}
    if not expected:
        raise SystemExit("No source image sets were found.")
    if missing := expected - names:
        raise SystemExit("Image renditions missing from Assets.car: " + ", ".join(sorted(missing)))
    print(f"Verified {len(expected)} compiled image sets.")


if __name__ == "__main__":
    command, directory, value = sys.argv[1:]
    results = Path(directory)
    if command == "tests":
        report_tests(results, value)
    elif command == "ui-tests":
        report_ui_tests(results, value)
    elif command == "simulator":
        discover_simulator(results, Path(value))
    elif command == "resources":
        verify_resources(results, Path(value))
    else:
        raise SystemExit(f"Unknown CI command: {command}")
