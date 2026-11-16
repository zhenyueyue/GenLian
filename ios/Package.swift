// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "GenLianTraining",
    platforms: [.iOS("26.0")],
    products: [.library(name: "TrainingCore", targets: ["TrainingCore"])],
    targets: [
        .target(name: "TrainingCore", resources: [.process("Resources")]),
        .testTarget(name: "TrainingCoreTests", dependencies: ["TrainingCore"])
    ]
)
