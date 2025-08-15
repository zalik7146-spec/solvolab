import Foundation

struct DiaryEntry: Identifiable, Codable, Hashable {
    let id: UUID
    var date: Date
    var mood: Mood
    var text: String

    init(id: UUID = UUID(), date: Date = Date(), mood: Mood, text: String) {
        self.id = id
        self.date = date
        self.mood = mood
        self.text = text
    }
}