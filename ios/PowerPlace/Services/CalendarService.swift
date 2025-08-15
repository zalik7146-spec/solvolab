import Foundation
#if canImport(EventKit)
import EventKit
#endif

final class CalendarService {
    #if canImport(EventKit)
    private let store = EKEventStore()
    #endif

    func requestAccessIfNeeded(completion: ((Bool) -> Void)? = nil) {
        #if canImport(EventKit)
        store.requestAccess(to: .event) { granted, _ in
            DispatchQueue.main.async { completion?(granted) }
        }
        #else
        completion?(false)
        #endif
    }

    func addEvent(title: String, notes: String?, startDate: Date, endDate: Date) async -> Bool {
        #if canImport(EventKit)
        if #available(iOS 17.0, *) {
            do {
                let granted = try await store.requestWriteOnlyAccessToEvents()
                guard granted else { return false }
                let event = EKEvent(eventStore: store)
                event.title = title
                event.notes = notes
                event.startDate = startDate
                event.endDate = endDate
                event.calendar = store.defaultCalendarForNewEvents
                try store.save(event, span: .thisEvent)
                return true
            } catch {
                return false
            }
        } else {
            var granted = false
            let semaphore = DispatchSemaphore(value: 0)
            store.requestAccess(to: .event) { ok, _ in
                granted = ok
                semaphore.signal()
            }
            semaphore.wait()
            guard granted else { return false }
            let event = EKEvent(eventStore: store)
            event.title = title
            event.notes = notes
            event.startDate = startDate
            event.endDate = endDate
            event.calendar = store.defaultCalendarForNewEvents
            do {
                try store.save(event, span: .thisEvent)
                return true
            } catch {
                return false
            }
        }
        #else
        return false
        #endif
    }
}