import Foundation

@MainActor
final class ChatViewModel: ObservableObject {
    @Published var inputText: String = ""
    @Published private(set) var messages: [AIMessage] = [
        AIMessage(role: .system, content: "You are a gentle, practical mental health companion. Be concise, supportive, and action-oriented. Suggest small, doable steps.")
    ]
    @Published private(set) var isSending: Bool = false

    private let ai: AIClient

    init(ai: AIClient) {
        self.ai = ai
    }

    func send() async {
        let trimmed = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !isSending else { return }
        inputText = ""
        messages.append(AIMessage(role: .user, content: trimmed))
        isSending = true
        defer { isSending = false }
        do {
            let reply = try await ai.chat(messages: messages)
            messages.append(AIMessage(role: .assistant, content: reply))
        } catch {
            messages.append(AIMessage(role: .assistant, content: "Sorry, I couldn't reach the AI right now. Let's try again soon."))
        }
    }
}