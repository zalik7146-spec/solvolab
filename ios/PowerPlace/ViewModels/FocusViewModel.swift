import Foundation
import Combine

final class FocusViewModel: ObservableObject {
    @Published private(set) var remainingSeconds: Int
    @Published private(set) var isRunning: Bool = false
    @Published var durationSeconds: Int

    private var timerCancellable: AnyCancellable?
    private let notifications: NotificationService

    init(defaultDuration: Int = 25 * 60, notifications: NotificationService) {
        self.durationSeconds = defaultDuration
        self.remainingSeconds = defaultDuration
        self.notifications = notifications
    }

    func start() {
        guard !isRunning else { return }
        isRunning = true
        scheduleCompletionNotification()
        timerCancellable = Timer.publish(every: 1, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                guard let self = self else { return }
                if self.remainingSeconds > 0 {
                    self.remainingSeconds -= 1
                } else {
                    self.stop(reset: false)
                }
            }
    }

    func pause() {
        isRunning = false
        timerCancellable?.cancel()
        timerCancellable = nil
    }

    func stop(reset: Bool = true) {
        pause()
        if reset { remainingSeconds = durationSeconds }
    }

    func setDuration(minutes: Int) {
        durationSeconds = max(1, minutes) * 60
        remainingSeconds = durationSeconds
    }

    private func scheduleCompletionNotification() {
        let fireDate = Date().addingTimeInterval(TimeInterval(remainingSeconds))
        notifications.scheduleNotification(title: "Focus complete", body: "Nice job—take a short break.", at: fireDate)
    }
}