import AVFoundation
import Foundation
import Testing
import TrainingCoach

@Suite
struct RestNotificationAudioTests {
    @Test func validatesRealPCMFrames() throws {
        let url = temporaryCAF()
        defer { try? FileManager.default.removeItem(at: url) }
        try write(url, frames: 4000, sample: 1000)
        try RestNotificationAudio.validate(url, expectedFrames: 4000)
        #expect(throws: RestNotificationAudio.ValidationError.incomplete) {
            try RestNotificationAudio.validate(url, expectedFrames: 4001)
        }
    }

    @Test func rejectsCorruptSilentAndLongAudio() throws {
        let url = temporaryCAF()
        defer { try? FileManager.default.removeItem(at: url) }
        try Data("caff".utf8).write(to: url)
        #expect(throws: RestNotificationAudio.ValidationError.invalidContainer) { try RestNotificationAudio.validate(url) }
        try write(url, frames: 4000, sample: 0)
        #expect(throws: RestNotificationAudio.ValidationError.silent) { try RestNotificationAudio.validate(url) }
        try write(url, frames: 240_000, sample: 1000)
        #expect(throws: RestNotificationAudio.ValidationError.tooLong) { try RestNotificationAudio.validate(url) }
    }

    private func temporaryCAF() -> URL {
        FileManager.default.temporaryDirectory.appendingPathComponent("notification-\(UUID()).caf")
    }

    private func write(_ url: URL, frames: AVAudioFrameCount, sample: Int16) throws {
        let format = try #require(AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: 8000, channels: 1, interleaved: false))
        let buffer = try #require(AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frames))
        buffer.frameLength = frames
        let samples = try #require(buffer.int16ChannelData)
        for index in 0..<Int(frames) { samples[0][index] = sample }
        let file = try AVAudioFile(forWriting: url, settings: format.settings, commonFormat: .pcmFormatInt16, interleaved: false)
        try file.write(from: buffer)
    }
}
