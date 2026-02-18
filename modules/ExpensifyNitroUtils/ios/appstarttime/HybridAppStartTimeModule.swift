import NitroModules
import Foundation

final class HybridAppStartTimeModule: HybridAppStartTimeModuleSpec {
    public var memorySize: Int { MemoryLayout<HybridAppStartTimeModule>.size }

    func recordAppStartTime() {
        UserDefaults.standard.set(Date().timeIntervalSince1970 * 1000, forKey: "AppStartTime")
    }

    var appStartTime: Double {
        return UserDefaults.standard.double(forKey: "AppStartTime")
    }
}
