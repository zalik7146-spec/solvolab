import SwiftUI

struct ThemedBackground<Content: View>: View {
    @EnvironmentObject private var appTheme: AppTheme
    let content: () -> Content

    init(@ViewBuilder content: @escaping () -> Content) {
        self.content = content
    }

    var body: some View {
        ZStack {
            appTheme.backgroundGradient()
                .ignoresSafeArea()
            content()
        }
    }
}