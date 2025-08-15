import Foundation

struct TaskItem: Identifiable, Codable, Hashable {
    enum Status: String, Codable { case pending, done }

    let id: UUID
    var title: String
    var notes: String?
    var dueDate: Date?
    var status: Status
    var createdAt: Date
    var updatedAt: Date

    init(id: UUID = UUID(),
         title: String,
         notes: String? = nil,
         dueDate: Date? = nil,
         status: Status = .pending,
         createdAt: Date = Date(),
         updatedAt: Date = Date()) {
        self.id = id
        self.title = title
        self.notes = notes
        self.dueDate = dueDate
        self.status = status
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}