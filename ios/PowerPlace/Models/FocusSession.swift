import Foundation

struct FocusSession: Identifiable, Codable, Hashable {
    enum Kind: String, Codable { case pomodoro, custom }

    let id: UUID
    var kind: Kind
    var startedAt: Date
    var durationSeconds: Int
    var completed: Bool

    init(id: UUID = UUID(), kind: Kind = .pomodoro, startedAt: Date = Date(), durationSeconds: Int, completed: Bool = false) {
        self.id = id
        self.kind = kind
        self.startedAt = startedAt
        self.durationSeconds = durationSeconds
        self.completed = completed
    }
}