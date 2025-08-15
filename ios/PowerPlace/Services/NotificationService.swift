import Foundation
import UserNotifications

final class NotificationService {
    func requestAuthorizationIfNeeded() {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            guard settings.authorizationStatus == .notDetermined else { return }
            UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }
        }
    }

    func scheduleNotification(id: String = UUID().uuidString, title: String, body: String, at date: Date) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: max(5, date.timeIntervalSinceNow), repeats: false)
        let request = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request)
    }
}