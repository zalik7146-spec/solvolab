import SwiftUI

@main
struct PowerPlaceApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var appTheme = AppTheme()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .environmentObject(appTheme)
                .preferredColorScheme(appTheme.preferredColorScheme)
                .onAppear {
                    appState.bootstrap()
                }
        }
    }
}