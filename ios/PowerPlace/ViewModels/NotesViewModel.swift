import Foundation
import Combine

final class NotesViewModel: ObservableObject {
    @Published private(set) var notes: [Note] = []

    private let storage: StorageService

    init(storage: StorageService) {
        self.storage = storage
        self.notes = storage.load("notes.json", default: [])
    }

    func add(title: String, body: String) {
        let note = Note(title: title, body: body)
        notes.insert(note, at: 0)
        persist()
    }

    func update(_ note: Note, title: String, body: String) {
        if let idx = notes.firstIndex(where: { $0.id == note.id }) {
            var updated = note
            updated.title = title
            updated.body = body
            updated.updatedAt = Date()
            notes[idx] = updated
            persist()
        }
    }

    func delete(at offsets: IndexSet) {
        notes.remove(atOffsets: offsets)
        persist()
    }

    private func persist() {
        storage.save("notes.json", value: notes)
    }
}