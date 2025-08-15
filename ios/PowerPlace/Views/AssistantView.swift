import SwiftUI

struct AssistantView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var vm: ChatViewModel

    init(ai: AIClient) {
        _vm = StateObject(wrappedValue: ChatViewModel(ai: ai))
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 12) {
                    ForEach(Array(vm.messages.enumerated()), id: \.offset) { _, msg in
                        HStack {
                            if msg.role == .assistant {
                                Text(msg.content)
                                    .padding(10)
                                    .background(Color.gray.opacity(0.15))
                                    .cornerRadius(10)
                                Spacer()
                            } else if msg.role == .user {
                                Spacer()
                                Text(msg.content)
                                    .padding(10)
                                    .background(Color.accentColor.opacity(0.15))
                                    .cornerRadius(10)
                            }
                        }
                    }
                }
                .padding()
            }
            HStack(spacing: 8) {
                TextField("Ask for advice or say what's on your mind", text: $vm.inputText)
                    .textFieldStyle(.roundedBorder)
                Button(action: { Task { await vm.send() } }) {
                    Image(systemName: vm.isSending ? "hourglass" : "paperplane.fill")
                }
                .disabled(vm.isSending)
            }
            .padding()
        }
        .navigationTitle("AI")
    }
}