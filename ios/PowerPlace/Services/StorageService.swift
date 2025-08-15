import Foundation

final class StorageService {
    private let queue = DispatchQueue(label: "storage.service.queue", qos: .utility)
    private let fm = FileManager.default

    private var baseURL: URL {
        let urls = fm.urls(for: .documentDirectory, in: .userDomainMask)
        return urls[0].appendingPathComponent("PowerPlace")
    }

    init() {
        try? fm.createDirectory(at: baseURL, withIntermediateDirectories: true)
    }

    func load<T: Decodable>(_ filename: String, as type: T.Type = T.self, default defaultValue: T) -> T {
        let url = baseURL.appendingPathComponent(filename)
        guard fm.fileExists(atPath: url.path) else { return defaultValue }
        do {
            let data = try Data(contentsOf: url)
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            return defaultValue
        }
    }

    func save<T: Encodable>(_ filename: String, value: T) {
        queue.async {
            let url = self.baseURL.appendingPathComponent(filename)
            do {
                let data = try JSONEncoder().encode(value)
                try data.write(to: url, options: .atomic)
            } catch {
                // Intentionally ignore for scaffold
            }
        }
    }
}