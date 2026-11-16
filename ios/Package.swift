// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "GenLianTraining",
    platforms: [.iOS("26.0"), .macOS(.v13)],
    products: [
        .library(name: "TrainingCore", targets: ["TrainingCore"]),
        .library(name: "TrainingCoach", targets: ["TrainingCoach"])
    ],
    targets: [
        .target(name: "TrainingCore", resources: [.process("Resources")]),
        .target(name: "TrainingCoach", dependencies: ["TrainingCore"]),
        .testTarget(name: "TrainingCoreTests", dependencies: ["TrainingCore"]),
        .testTarget(name: "TrainingCoachTests", dependencies: ["TrainingCoach", "TrainingCore"])
    ]
)
