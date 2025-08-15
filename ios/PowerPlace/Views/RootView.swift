import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var appTheme: AppTheme

    var body: some View {
        NavigationStack {
            TabView {
                HomeView()
                    .tabItem { Label("Home", systemImage: "house") }

                DiaryView()
                    .tabItem { Label("Diary", systemImage: "book") }

                NotesView()
                    .tabItem { Label("Notes", systemImage: "note.text") }

                PlannerView()
                    .tabItem { Label("Plan", systemImage: "checklist") }

                FocusView()
                    .tabItem { Label("Focus", systemImage: "timer") }

                AssistantView(ai: appState.aiClient)
                    .tabItem { Label("AI", systemImage: "sparkles") }
            }
            .tint(appTheme.primaryColor())
            .background(appTheme.backgroundGradient())
        }
    }
}

struct RootView_Previews: PreviewProvider {
    static var previews: some View {
        RootView()
            .environmentObject(AppState())
            .environmentObject(AppTheme())
    }
}