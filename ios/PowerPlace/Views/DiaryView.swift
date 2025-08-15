import SwiftUI

struct DiaryView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var appTheme: AppTheme
    @StateObject private var vm: DiaryViewModel
    @State private var draft: String = ""
    @State private var mood: Mood

    init() {
        _vm = StateObject(wrappedValue: DiaryViewModel(storage: StorageService()))
        _mood = State(initialValue: .calm)
    }

    var body: some View {
        ThemedBackground {
            VStack(spacing: 0) {
                Form {
                    Section(header: Text("New Entry")) {
                        Picker("Mood", selection: $mood) {
                            ForEach(Mood.allCases) { m in
                                Text(m.displayName).tag(m)
                            }
                        }
                        .pickerStyle(.segmented)
                        TextEditor(text: $draft)
                            .frame(minHeight: 120)
                        Button(action: save) {
                            Label("Save", systemImage: "tray.and.arrow.down")
                        }
                        .disabled(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    }

                    Section(header: Text("Entries")) {
                        List {
                            ForEach(vm.entries) { entry in
                                VStack(alignment: .leading, spacing: 6) {
                                    Text(entry.date.formatted(date: .abbreviated, time: .shortened))
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                    Text(entry.text)
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
        .navigationTitle("Diary")
    }

    private func save() {
        vm.addEntry(mood: mood, text: draft)
        draft = ""
    }
}