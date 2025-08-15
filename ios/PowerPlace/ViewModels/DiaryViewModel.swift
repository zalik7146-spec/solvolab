import Foundation
import Combine

final class DiaryViewModel: ObservableObject {
    @Published private(set) var entries: [DiaryEntry] = []

    private let storage: StorageService
    private var cancellables = Set<AnyCancellable>()

    init(storage: StorageService) {
        self.storage = storage
        self.entries = storage.load("diary.json", default: [])
    }

    func addEntry(mood: Mood, text: String) {
        var new = DiaryEntry(mood: mood, text: text)
        entries.insert(new, at: 0)
        persist()
    }

    func updateEntry(_ entry: DiaryEntry, text: String, mood: Mood) {
        if let idx = entries.firstIndex(where: { $0.id == entry.id }) {
            var updated = entry
            updated.text = text
            updated.mood = mood
            entries[idx] = updated
            persist()
        }
    }

    func delete(at offsets: IndexSet) {
        entries.remove(atOffsets: offsets)
        persist()
    }

    private func persist() {
        storage.save("diary.json", value: entries)
    }
}