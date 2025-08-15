import Foundation
import Combine

final class PlannerViewModel: ObservableObject {
    @Published private(set) var tasks: [TaskItem] = []

    private let storage: StorageService
    private let calendar: CalendarService
    private let ai: AIClient

    init(storage: StorageService, calendar: CalendarService, ai: AIClient) {
        self.storage = storage
        self.tasks = storage.load("tasks.json", default: [])
        self.calendar = calendar
        self.ai = ai
    }

    func addTask(title: String, notes: String? = nil, due: Date? = nil) {
        let item = TaskItem(title: title, notes: notes, dueDate: due)
        tasks.insert(item, at: 0)
        persist()
    }

    func toggleDone(_ task: TaskItem) {
        guard let idx = tasks.firstIndex(where: { $0.id == task.id }) else { return }
        var updated = task
        updated.status = task.status == .pending ? .done : .pending
        updated.updatedAt = Date()
        tasks[idx] = updated
        persist()
    }

    func delete(at offsets: IndexSet) {
        tasks.remove(atOffsets: offsets)
        persist()
    }

    func addEventToCalendar(title: String, notes: String?, start: Date, end: Date) async -> Bool {
        await calendar.addEvent(title: title, notes: notes, startDate: start, endDate: end)
    }

    func quickAddFromNaturalLanguage(_ text: String) async {
        // Simple heuristic; could be replaced by AI intent extraction later
        if text.lowercased().contains("tomorrow") {
            let due = Calendar.current.date(byAdding: .day, value: 1, to: Date())
            await MainActor.run { addTask(title: text, due: due) }
        } else {
            await MainActor.run { addTask(title: text) }
        }
    }

    private func persist() {
        storage.save("tasks.json", value: tasks)
    }
}