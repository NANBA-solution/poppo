import ExpoModulesCore
import SwiftUI
import UIKit

class PoppoHeroView: ExpoView {
  var sceneName: String = "scan"
  var accentColorHex: String = "#a78bfa"

  private var hostingController: UIHostingController<PoppoHeroSwiftUIView>?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    backgroundColor = .clear
    isUserInteractionEnabled = false
  }

  func updateHostedHero() {
    let scene = PoppoHeroSceneKind(raw: sceneName)
    let accent = Self.color(fromHex: accentColorHex)
    let rootView = PoppoHeroSwiftUIView(scene: scene, accent: accent)

    if let hostingController {
      hostingController.rootView = rootView
      hostingController.view.setNeedsLayout()
    } else {
      let controller = UIHostingController(rootView: rootView)
      controller.view.backgroundColor = .clear
      controller.view.isUserInteractionEnabled = false
      addSubview(controller.view)
      hostingController = controller
    }
    setNeedsLayout()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    if hostingController == nil {
      updateHostedHero()
    }
    guard let hostView = hostingController?.view else { return }
    hostView.frame = bounds
  }

  private static func color(fromHex hex: String) -> Color {
    var cleaned = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    if cleaned.hasPrefix("#") {
      cleaned.removeFirst()
    }
    guard cleaned.count == 6 || cleaned.count == 8,
          let value = UInt64(cleaned, radix: 16) else {
      return Color(red: 0.65, green: 0.55, blue: 0.98)
    }
    let r = Double((value >> 16) & 0xFF) / 255
    let g = Double((value >> 8) & 0xFF) / 255
    let b = Double(value & 0xFF) / 255
    return Color(red: r, green: g, blue: b)
  }
}
