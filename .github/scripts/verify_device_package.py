"""Validate the iPhoneOS app extracted from the unsigned GenLian IPA."""

import json
import plistlib
import re
import shutil
import subprocess
import sys
from pathlib import Path


MACHO_MAGIC = {
    bytes.fromhex(magic)
    for magic in ("feedface", "cefaedfe", "feedfacf", "cffaedfe", "cafebabe", "bebafeca", "cafebabf", "bfbafeca")
}


def verify_coach_bundle(app):
    info = plistlib.loads((app / "Info.plist").read_bytes())
    if info.get("UIBackgroundModes") != ["audio"] or info.get("NSSupportsLiveActivities") is not True:
        raise SystemExit("GenLian is missing its audio or Live Activity Info.plist configuration.")
    widget = app / "PlugIns" / "GenLianWidget.appex"
    if not widget.is_dir():
        raise SystemExit("GenLianWidget.appex was not embedded.")
    extension = plistlib.loads((widget / "Info.plist").read_bytes())
    if (
        extension.get("CFBundleIdentifier") != "com.genlian.app.widget"
        or extension.get("NSExtension", {}).get("NSExtensionPointIdentifier") != "com.apple.widgetkit-extension"
        or extension.get("CFBundleSupportedPlatforms") != info.get("CFBundleSupportedPlatforms")
    ):
        raise SystemExit("Embedded widget identity or platform does not match GenLian.")
    executable = widget / extension.get("CFBundleExecutable", "")
    if not executable.is_file() or not is_macho(executable):
        raise SystemExit("Embedded widget executable is missing or invalid.")
    print("Verified audio background mode, Live Activities, and the embedded WidgetKit extension.")


def verify_info(app, results):
    with (app / "Info.plist").open("rb") as file:
        info = plistlib.load(file)
    expected = {
        "CFBundleIdentifier": "com.genlian.app",
        "CFBundleExecutable": "GenLian",
        "CFBundlePackageType": "APPL",
        "CFBundleSupportedPlatforms": ["iPhoneOS"],
        "DTPlatformName": "iphoneos",
        "MinimumOSVersion": "26.0",
    }
    actual = {key: info.get(key) for key in expected}
    actual["DTSDKName"] = info.get("DTSDKName")
    (results / "info-plist.json").write_text(json.dumps(actual, indent=2) + "\n", encoding="utf-8")
    for key, value in expected.items():
        if actual[key] != value:
            raise SystemExit(f"Info.plist {key}: expected {value!r}, got {actual[key]!r}.")
    if (app / "_CodeSignature").exists() or any(app.rglob("*.mobileprovision")):
        raise SystemExit("The app has a resource signature or contains a provisioning profile.")
    return app / actual["CFBundleExecutable"]


def is_macho(path):
    with path.open("rb") as file:
        return file.read(4) in MACHO_MAGIC


def record_command(command, log):
    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    print("$ " + " ".join(map(str, command)), result.stdout.strip(), sep="\n", file=log, flush=True)
    result.check_returncode()
    return result.stdout


def verify_binaries(app, executable, results):
    if not executable.is_file() or not is_macho(executable):
        raise SystemExit("The main GenLian Mach-O executable is missing or invalid.")
    binaries = sorted(path for path in app.rglob("*") if path.is_file() and is_macho(path))
    with (results / "architecture.log").open("w", encoding="utf-8") as log:
        for binary in binaries:
            arches = record_command(["xcrun", "lipo", "-archs", binary], log).split()
            if not arches or set(arches) - {"arm64", "arm64e"} or (binary == executable and arches != ["arm64"]):
                raise SystemExit(f"{binary.relative_to(app)} has unexpected architectures: {arches}.")
            build = record_command(["xcrun", "vtool", "-show-build", binary], log)
            platforms = re.findall(r"^\s*platform\s+(\S+)", build, flags=re.MULTILINE)
            if platforms != ["IOS"] * len(arches):
                raise SystemExit(f"{binary.relative_to(app)} has unexpected Mach-O platforms: {platforms}.")
            if binary == executable and re.findall(r"^\s*minos\s+(\S+)", build, flags=re.MULTILINE) != ["26.0"]:
                raise SystemExit("The main Mach-O executable does not set iOS 26.0 as its deployment target.")
    print(f"Verified iPhoneOS platform for {len(binaries)} Mach-O file(s), with an arm64 GenLian executable.")


def verify_resources(app, results):
    with (results / "resources.log").open("w", encoding="utf-8") as log:
        plans = sorted(path for path in app.rglob("WorkoutPlans.json") if path.parent.suffix == ".bundle")
        source = Path("ios/Sources/TrainingCore/Resources/WorkoutPlans.json")
        if len(plans) != 1 or json.loads(plans[0].read_bytes()) != json.loads(source.read_bytes()):
            raise SystemExit("The TrainingCore course resource is missing, duplicated or different from the source.")
        print(f"Verified TrainingCore plans in {plans[0].relative_to(app)}.", file=log, flush=True)

        catalog = app / "Assets.car"
        if not catalog.is_file() or not catalog.stat().st_size:
            raise SystemExit("The compiled Assets.car is missing or empty.")
        assetutil = shutil.which("assetutil") or record_command(["xcrun", "--find", "assetutil"], log).strip()
        with (results / "asset-catalog.json").open("w", encoding="utf-8") as file:
            subprocess.run([assetutil, "--info", catalog], stdout=file, stderr=log, check=True)
        names = {item.get("Name") for item in json.loads((results / "asset-catalog.json").read_bytes())}
        expected = {path.stem for path in Path("ios/GenLian/Assets.xcassets").rglob("*.imageset")}
        if len(expected) != 13:
            raise SystemExit(f"Expected 13 source image sets, found {len(expected)}.")
        if missing := expected - names:
            raise SystemExit("Missing compiled image sets: " + ", ".join(sorted(missing)))
        print("Verified all 13 image sets: " + ", ".join(sorted(expected)), file=log)
    print("Verified TrainingCore resources and all 13 compiled image sets.")


if __name__ == "__main__":
    unpacked, results = map(Path, sys.argv[1:])
    payload = unpacked / "Payload"
    app = payload / "GenLian.app"
    if not app.is_dir() or set(unpacked.iterdir()) != {payload} or set(payload.iterdir()) != {app}:
        raise SystemExit("IPA must contain exactly Payload/GenLian.app at its bundle root.")
    executable = verify_info(app, results)
    verify_binaries(app, executable, results)
    verify_coach_bundle(app)
    verify_resources(app, results)
    print("Verified bundle com.genlian.app, minimum iOS 26.0, and no app resource signature or provisioning profile.")
