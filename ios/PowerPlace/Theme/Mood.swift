import Foundation

enum Mood: String, CaseIterable, Codable, Identifiable {
    case calm
    case focused
    case joyful
    case reflective
    case low

    var id: String { rawValue }
    var displayName: String {
        switch self {
        case .calm: return "Calm"
        case .focused: return "Focused"
        case .joyful: return "Joyful"
        case .reflective: return "Reflect"
        case .low: return "Low"
        }
    }
}