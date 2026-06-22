import SwiftUI

struct ContentView: View {
  var faces: [CardFaceData]
  var layout: CardLayoutKind

  var body: some View {
    CardSceneView(faces: faces, layout: layout)
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .background(Color.clear)
  }
}
