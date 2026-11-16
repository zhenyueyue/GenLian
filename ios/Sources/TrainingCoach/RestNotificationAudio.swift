import AVFoundation
import Foundation

public enum RestNotificationAudio {
    public static func validate(_ url: URL, expectedFrames: AVAudioFramePosition? = nil) throws {
        let header = try FileHandle(forReadingFrom: url)
        defer { try? header.close() }
        // Read the opened file's length. URL resource metadata can outlive a replacement at the same path.
        let size = try header.seekToEnd()
        try header.seek(toOffset: 0)
        guard size > 8, try header.read(upToCount: 4) == Data("caff".utf8) else {
            throw ValidationError.invalidContainer
        }

        let file = try AVAudioFile(forReading: url, commonFormat: .pcmFormatInt16, interleaved: false)
        let format = file.fileFormat.streamDescription.pointee
        guard format.mFormatID == kAudioFormatLinearPCM, format.mBitsPerChannel == 16,
              (1...2).contains(format.mChannelsPerFrame), format.mSampleRate.isFinite, format.mSampleRate > 0 else {
            throw ValidationError.unsupportedFormat
        }
        let frames = file.length
        guard frames > 0, expectedFrames.map({ $0 == frames }) != false else {
            throw ValidationError.incomplete
        }
        guard Double(frames) / format.mSampleRate < 30 else { throw ValidationError.tooLong }
        guard let buffer = AVAudioPCMBuffer(pcmFormat: file.processingFormat, frameCapacity: 4096),
              let samples = buffer.int16ChannelData else { throw ValidationError.unsupportedFormat }
        var decoded: AVAudioFramePosition = 0
        var hasSignal = false
        while decoded < frames {
            let count = AVAudioFrameCount(min(frames - decoded, AVAudioFramePosition(buffer.frameCapacity)))
            try file.read(into: buffer, frameCount: count)
            guard buffer.frameLength == count else { throw ValidationError.incomplete }
            if !hasSignal {
                hasSignal = (0..<Int(format.mChannelsPerFrame)).contains { channel in
                    UnsafeBufferPointer(start: samples[channel], count: Int(count)).contains { $0 != 0 }
                }
            }
            decoded += AVAudioFramePosition(count)
        }
        guard hasSignal else { throw ValidationError.silent }
    }

    public enum ValidationError: LocalizedError {
        case invalidContainer, unsupportedFormat, incomplete, tooLong, silent

        public var errorDescription: String? {
            switch self {
            case .invalidContainer: "CAF 文件缺失或文件头无效"
            case .unsupportedFormat: "CAF 不是支持的 16 位线性 PCM 格式"
            case .incomplete: "CAF 音频帧缺失或文件不完整"
            case .tooLong: "通知语音达到 30 秒上限"
            case .silent: "CAF 只包含静音采样"
            }
        }
    }
}
