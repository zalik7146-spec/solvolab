import SwiftUI

struct NotesView: View {
    @StateObject private var vm = NotesViewModel(storage: StorageService())
    @State private var title: String = ""
    @State private var bodyText: String = ""

    var body: some View {
        ThemedBackground {
            VStack(spacing: 0) {
                Form {
                    Section(header: Text("New Note")) {
                        TextField("Title", text: $title)
                        TextEditor(text: $bodyText)
                            .frame(minHeight: 100)
                        Button(action: add) {
                            Label("Add", systemImage: "plus")
                        }
                        .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    }

                    Section(header: Text("Notes")) {
                        List {
                            ForEach(vm.notes) { note in
                                VStack(alignment: .leading, spacing: 8) {
                                    Text(note.title).bold()
                                    Text(note.body).font(.subheadline)
                                        .foregroundStyle(.secondary)
                                }
                                .padding(.vertical, 4)
                            }
                            .onDelete(perform: vm.delete)
                        }
                        .frame(minHeight: 200)
                    }
                }
            }
        }
        .navigationTitle("Notes")
    }

    private func add() {
        vm.add(title: title, body: bodyText)
        title = ""
        bodyText = ""
    }
}