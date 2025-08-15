import Foundation

protocol AIClient {
    func chat(messages: [AIMessage]) async throws -> String
}

struct AIMessage: Codable {
    enum Role: String, Codable { case system, user, assistant }
    let role: Role
    let content: String
}

enum AIClientFactory {
    static func make(apiKey: String?, model: String) -> AIClient {
        guard let key = apiKey, !key.isEmpty else { return StubAIClient() }
        return OpenAIClient(apiKey: key, model: model)
    }
}

final class StubAIClient: AIClient {
    func chat(messages: [AIMessage]) async throws -> String {
        return "I'm here. Let's take a small step. What would feel manageable right now?"
    }
}

final class OpenAIClient: AIClient {
    private let apiKey: String
    private let model: String

    init(apiKey: String, model: String) {
        self.apiKey = apiKey
        self.model = model
    }

    func chat(messages: [AIMessage]) async throws -> String {
        let url = URL(string: "https://api.openai.com/v1/chat/completions")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")

        let payload: [String: Any] = [
            "model": model,
            "messages": messages.map { ["role": $0.role.rawValue, "content": $0.content] },
            "temperature": 0.7
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw NSError(domain: "AI", code: 1, userInfo: [NSLocalizedDescriptionKey: "AI request failed"])
        }
        struct Choice: Decodable { let message: InnerMsg }
        struct InnerMsg: Decodable { let role: String; let content: String }
        struct Resp: Decodable { let choices: [Choice] }
        let decoded = try JSONDecoder().decode(Resp.self, from: data)
        return decoded.choices.first?.message.content.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    }
}