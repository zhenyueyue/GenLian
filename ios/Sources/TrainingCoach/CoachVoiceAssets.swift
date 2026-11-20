import Foundation

public enum CoachVoiceAssets {
    private struct Clip: Decodable {
        let text: String
        let file: String
    }

    private static let clipsByText: [String: URL] = {
        guard let manifest = Bundle.module.url(forResource: "manifest", withExtension: "json", subdirectory: "CoachVoice"),
              let data = try? Data(contentsOf: manifest),
              let clips = try? JSONDecoder().decode([String: Clip].self, from: data) else { return [:] }
        let directory = manifest.deletingLastPathComponent()
        var result: [String: URL] = [:]
        for clip in clips.values {
            let file = directory.appendingPathComponent(clip.file)
            if FileManager.default.fileExists(atPath: file.path) { result[clip.text] = file }
        }
        return result
    }()

    public static func clip(for text: String) -> URL? { clipsByText[text] }
}
