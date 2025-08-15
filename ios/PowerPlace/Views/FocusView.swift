import SwiftUI

struct FocusView: View {
    @StateObject private var vm = FocusViewModel(notifications: NotificationService())

    var body: some View {
        ThemedBackground {
            VStack(spacing: 24) {
                Text(timeString(vm.remainingSeconds))
                    .font(.system(size: 48, weight: .bold, design: .rounded))
                    .monospacedDigit()
                HStack(spacing: 16) {
                    Button(action: { vm.start() }) {
                        Label("Start", systemImage: "play.fill")
                    }
                    .buttonStyle(.borderedProminent)
                    Button(action: { vm.pause() }) {
                        Label("Pause", systemImage: "pause.fill")
                    }
                    .buttonStyle(.bordered)
                    Button(action: { vm.stop() }) {
                        Label("Reset", systemImage: "stop.fill")
                    }
                    .buttonStyle(.bordered)
                }
                Stepper(value: Binding(get: { vm.durationSeconds / 60 }, set: { vm.setDuration(minutes: $0) }), in: 1...120) {
                    Text("Duration: \(vm.durationSeconds / 60) min")
                }
                .padding(.horizontal)
                Spacer()
            }
            .padding()
        }
        .navigationTitle("Focus")
    }

    private func timeString(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%02d:%02d", m, s)
    }
}