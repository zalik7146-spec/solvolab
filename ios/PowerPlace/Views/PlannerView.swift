import SwiftUI

struct PlannerView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var vm: PlannerViewModel
    @State private var newTask: String = ""

    init() {
        _vm = StateObject(wrappedValue: PlannerViewModel(storage: StorageService(), calendar: CalendarService(), ai: AIClientFactory.make(apiKey: nil, model: "gpt-4o-mini")))
    }

    var body: some View {
        ThemedBackground {
            VStack(spacing: 0) {
                HStack {
                    TextField("Quick add task (e.g., 'Email Sam tomorrow')", text: $newTask)
                        .textFieldStyle(.roundedBorder)
                    Button(action: quickAdd) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title3)
                    }
                    .disabled(newTask.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                .padding()

                List {
                    ForEach(vm.tasks) { task in
                        HStack {
                            Button(action: { vm.toggleDone(task) }) {
                                Image(systemName: task.status == .done ? "checkmark.circle.fill" : "circle")
                            }
                            .buttonStyle(.plain)
                            VStack(alignment: .leading) {
                                Text(task.title)
                                if let due = task.dueDate {
                                    Text("Due: \(due.formatted(date: .abbreviated, time: .omitted))")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            }
                            Spacer()
                        }
                        .padding(.vertical, 6)
                    }
                    .onDelete(perform: vm.delete)
                }
            }
        }
        .navigationTitle("Plan")
    }

    private func quickAdd() {
        let text = newTask
        newTask = ""
        Task { await vm.quickAddFromNaturalLanguage(text) }
    }
}