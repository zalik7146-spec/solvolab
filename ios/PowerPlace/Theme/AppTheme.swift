import SwiftUI

final class AppTheme: ObservableObject {
    enum SchemePreference: String, CaseIterable, Codable, Identifiable {
        case system
        case light
        case dark
        var id: String { rawValue }
        var label: String {
            switch self {
            case .system: return "System"
            case .light: return "Light"
            case .dark: return "Dark"
            }
        }
    }

    @Published var mood: Mood = .calm {
        didSet { persist() }
    }
    @Published var schemePreference: SchemePreference = .system {
        didSet { persist() }
    }

    var preferredColorScheme: ColorScheme? {
        switch schemePreference {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }

    init() {
        if let data = UserDefaults.standard.data(forKey: "AppTheme"),
           let decoded = try? JSONDecoder().decode(Snapshot.self, from: data) {
            self.mood = decoded.mood
            self.schemePreference = decoded.schemePreference
        }
    }

    func backgroundGradient() -> LinearGradient {
        LinearGradient(colors: [primaryColor().opacity(0.25), primaryColor().opacity(0.05)], startPoint: .topLeading, endPoint: .bottomTrailing)
    }

    func primaryColor() -> Color {
        switch mood {
        case .calm: return Color(hue: 0.56, saturation: 0.30, brightness: 0.80) // soft blue
        case .focused: return Color(hue: 0.63, saturation: 0.55, brightness: 0.75) // indigo
        case .joyful: return Color(hue: 0.13, saturation: 0.80, brightness: 0.90) // orange
        case .reflective: return Color(hue: 0.79, saturation: 0.35, brightness: 0.80) // purple
        case .low: return Color(hue: 0.58, saturation: 0.10, brightness: 0.55) // muted blue-gray
        }
    }

    func subtleBackground() -> Color {
        primaryColor().opacity(0.08)
    }

    private func persist() {
        let snap = Snapshot(mood: mood, schemePreference: schemePreference)
        if let data = try? JSONEncoder().encode(snap) {
            UserDefaults.standard.set(data, forKey: "AppTheme")
        }
    }

    private struct Snapshot: Codable {
        let mood: Mood
        let schemePreference: SchemePreference
    }
}