import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var appTheme: AppTheme

    var body: some View {
        ThemedBackground {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Text("PowerPlace")
                            .font(.largeTitle).bold()
                        Spacer()
                    }

                    MoodPicker()

                    if let quote = appState.motivationQuotes.randomElement() {
                        Text(quote)
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(appTheme.subtleBackground())
                            .cornerRadius(12)
                    }

                    NavigationLink(destination: DiaryView()) {
                        Label("Write a quick note in your diary", systemImage: "pencil")
                    }
                    .buttonStyle(.borderedProminent)

                    NavigationLink(destination: PlannerView()) {
                        Label("Add a task", systemImage: "plus")
                    }
                    .buttonStyle(.bordered)
                    
                    NavigationLink(destination: AssistantView(ai: appState.aiClient)) {
                        Label("Ask the AI for advice", systemImage: "sparkles")
                    }
                    .buttonStyle(.bordered)
                }
                .padding()
            }
        }
    }
}