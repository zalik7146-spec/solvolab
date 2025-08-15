import Foundation
import Combine
import SwiftUI

final class AppState: ObservableObject {
    @Published var openAIKey: String? {
        didSet { persistSettings() }
    }

    @Published var aiModel: String = "gpt-4o-mini" {
        didSet { persistSettings() }
    }

    @Published var motivationQuotes: [String] = [
        "Small steps, consistently.",
        "Breathe. You’re doing better than you think.",
        "Focus on what you can control.",
        "Progress, not perfection.",
        "One task at a time."
    ]

    let storage: StorageService
    let calendar: CalendarService
    let notifications: NotificationService

    @Published var aiClient: AIClient

    private var cancellables = Set<AnyCancellable>()

    init(storage: StorageService = StorageService(),
         calendar: CalendarService = CalendarService(),
         notifications: NotificationService = NotificationService()) {
        self.storage = storage
        self.calendar = calendar
        self.notifications = notifications

        let envKey = ProcessInfo.processInfo.environment["OPENAI_API_KEY"]
        let envModel = ProcessInfo.processInfo.environment["OPENAI_MODEL"]
        let saved = Self.loadSettings()
        let effectiveKey = envKey ?? saved.openAIKey
        let effectiveModel = envModel ?? saved.aiModel
        self.openAIKey = effectiveKey
        self.aiModel = effectiveModel
        self.aiClient = AIClientFactory.make(apiKey: effectiveKey, model: effectiveModel)
    }

    func bootstrap() {
        notifications.requestAuthorizationIfNeeded()
    }

    func updateAIClient() {
        aiClient = AIClientFactory.make(apiKey: openAIKey, model: aiModel)
    }

    private func persistSettings() {
        let dict: [String: Any] = [
            "openAIKey": openAIKey as Any,
            "aiModel": aiModel
        ]
        UserDefaults.standard.set(dict, forKey: "AppSettings")
        updateAIClient()
    }

    private static func loadSettings() -> (openAIKey: String?, aiModel: String) {
        guard let dict = UserDefaults.standard.dictionary(forKey: "AppSettings") else {
            return (nil, "gpt-4o-mini")
        }
        let key = dict["openAIKey"] as? String
        let model = dict["aiModel"] as? String ?? "gpt-4o-mini"
        return (key, model)
    }
}