import Foundation

public struct TrainingArchive: Codable, Equatable, Sendable {
    public internal(set) var current: WorkoutSession?
    public internal(set) var history: [WorkoutSession]

    public init() {
        current = nil
        history = []
    }
}

@MainActor
public protocol TrainingStore {
    func load() throws -> TrainingArchive
    func save(_ archive: TrainingArchive) throws
}

public enum TrainingStoreError: Error, Equatable {
    case unsupportedSchema(Int)
}

public struct AtomicTrainingStore: TrainingStore {
    private struct Header: Decodable {
        let version: Int
    }

    private struct Document: Codable {
        let version: Int
        let archive: TrainingArchive
    }

    private static let version = 1
    private let file: URL

    public init(file: URL) {
        self.file = file
    }

    public static func applicationSupport() throws -> AtomicTrainingStore {
        let support = try FileManager.default.url(
            for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true
        )
        let directory = support.appendingPathComponent("GenLian", isDirectory: true)
        return AtomicTrainingStore(file: directory.appendingPathComponent("training.json"))
    }

    public func load() throws -> TrainingArchive {
        let bytes: Data
        do {
            bytes = try Data(contentsOf: file)
        } catch let error as CocoaError where error.code == .fileReadNoSuchFile || error.code == .fileNoSuchFile {
            return TrainingArchive()
        }

        let decoder = JSONDecoder()
        let header = try decoder.decode(Header.self, from: bytes)
        guard header.version == Self.version else { throw TrainingStoreError.unsupportedSchema(header.version) }
        return try decoder.decode(Document.self, from: bytes).archive
    }

    public func save(_ archive: TrainingArchive) throws {
        let bytes = try JSONEncoder().encode(Document(version: Self.version, archive: archive))
        try FileManager.default.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)
        try bytes.write(to: file, options: .atomic)
    }
}
