import SwiftUI

struct ContentView: View {
  var faces: [CardFaceData]
  var layout: CardLayoutKind
  var isActive: Bool
  var quality: CardQualityKind

  var body: some View {
    CardSceneView(
      faces: faces,
      layout: layout,
      isActive: isActive,
      quality: quality
    )
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color.clear)
  }
}
