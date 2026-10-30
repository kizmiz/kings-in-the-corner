import SwiftUI

@main
struct KingsCornerApp: App {
    var body: some Scene {
        WindowGroup {
            GameView()
                .ignoresSafeArea()  // the page pads itself with the safe-area insets
                .background(Color("Felt"))
                .preferredColorScheme(.dark)  // light status bar text over the felt
        }
    }
}
