import SwiftUI

struct MoodPicker: View {
    @EnvironmentObject private var appTheme: AppTheme

    var body: some View {
        HStack(spacing: 12) {
            ForEach(Mood.allCases) { mood in
                Button(action: { appTheme.mood = mood }) {
                    Text(mood.displayName)
                        .font(.caption)
                        .padding(.vertical, 6)
                        .padding(.horizontal, 10)
                        .background(appTheme.mood == mood ? appTheme.primaryColor().opacity(0.2) : Color.gray.opacity(0.12))
                        .cornerRadius(8)
                }
                .buttonStyle(.plain)
            }
        }
    }
}