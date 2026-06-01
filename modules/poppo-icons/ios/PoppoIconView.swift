import ExpoModulesCore
import SwiftUI
import UIKit

class PoppoIconView: ExpoView {
  var iconName: String = "pigeon"
  var iconSize: CGFloat = 24
  var iconColorHex: String = "#FFFFFF"

  private var hostingController: UIHostingController<PoppoIconSwiftUIView>?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    backgroundColor = .clear
    isUserInteractionEnabled = false
  }

  func updateHostedIcon() {
    let swiftUIColor = Self.color(fromHex: iconColorHex)
    let rootView = PoppoIconSwiftUIView(name: iconName, color: swiftUIColor, size: iconSize)

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
      updateHostedIcon()
    }
    guard let hostView = hostingController?.view else { return }
    hostView.frame = bounds
    hostView.center = CGPoint(x: bounds.midX, y: bounds.midY)
  }

  private static func color(fromHex hex: String) -> Color {
    var cleaned = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    if cleaned.hasPrefix("#") {
      cleaned.removeFirst()
    }
    guard cleaned.count == 6 || cleaned.count == 8,
          let value = UInt64(cleaned, radix: 16) else {
      return Color.primary
    }
    let r, g, b, a: Double
    if cleaned.count == 6 {
      r = Double((value >> 16) & 0xFF) / 255
      g = Double((value >> 8) & 0xFF) / 255
      b = Double(value & 0xFF) / 255
      a = 1
    } else {
      r = Double((value >> 24) & 0xFF) / 255
      g = Double((value >> 16) & 0xFF) / 255
      b = Double((value >> 8) & 0xFF) / 255
      a = Double(value & 0xFF) / 255
    }
    return Color(red: r, green: g, blue: b, opacity: a)
  }
}
