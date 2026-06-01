import SwiftUI

struct PoppoIconLayer {
  let d: String
  var fill: Bool = false
  var strokeWidth: CGFloat = 1.8
  var strokeLineCap: CGLineCap = .round
  var strokeLineJoin: CGLineJoin = .round
}

struct PoppoIconCircle {
  let cx: CGFloat
  let cy: CGFloat
  let r: CGFloat
  var fill: Bool = true
}

struct PoppoIconRect {
  let x: CGFloat
  let y: CGFloat
  let width: CGFloat
  let height: CGFloat
  let cornerRadius: CGFloat
  var strokeWidth: CGFloat = 1.8
}

struct PoppoIconLine {
  let x1: CGFloat
  let y1: CGFloat
  let x2: CGFloat
  let y2: CGFloat
  var strokeWidth: CGFloat = 1.8
}

struct PoppoIconGlyph {
  let layers: [PoppoIconLayer]
  let circles: [PoppoIconCircle]
  let rects: [PoppoIconRect]
  let lines: [PoppoIconLine]

  static func layers(_ layers: [PoppoIconLayer], circles: [PoppoIconCircle] = [], rects: [PoppoIconRect] = [], lines: [PoppoIconLine] = []) -> PoppoIconGlyph {
    PoppoIconGlyph(layers: layers, circles: circles, rects: rects, lines: lines)
  }
}

enum PoppoIconGlyphs {
  static func glyph(named name: String) -> PoppoIconGlyph? {
    switch name {
    case "pigeon":
      return .layers(
        [
          PoppoIconLayer(
            d: "M4 14c2-4 6-7 11-7 2 0 4 .5 5.5 1.5M20 8v4M18 10h4M6 16c-1 2-2 4-2 6h3c0-2 1-3 2-4"
          ),
        ],
        circles: [PoppoIconCircle(cx: 14, cy: 9, r: 1.2)]
      )
    case "camera":
      return PoppoIconGlyph(
        layers: [PoppoIconLayer(d: "M8 7V5.5h8V7")],
        circles: [PoppoIconCircle(cx: 12, cy: 13.5, r: 3.2, fill: false)],
        rects: [PoppoIconRect(x: 3, y: 7, width: 18, height: 13, cornerRadius: 2.5)],
        lines: []
      )
    case "brain":
      return .layers(
        [
          PoppoIconLayer(
            d: "M9 5a3 3 0 00-3 3v1a2 2 0 00-2 2 2 2 0 002 2h1v2a3 3 0 006 0v-2h1a2 2 0 002-2 2 2 0 00-2-2V8a3 3 0 00-3-3",
            strokeWidth: 1.6
          ),
          PoppoIconLayer(d: "M12 8v8M9 11h6M9 14h6", strokeWidth: 1.4),
        ]
      )
    case "book":
      return .layers([
        PoppoIconLayer(d: "M5 4h11a2 2 0 012 2v14H7a2 2 0 00-2 2V6a2 2 0 012-2z"),
        PoppoIconLayer(d: "M7 20V6"),
      ])
    case "feed":
      return .layers([
        PoppoIconLayer(d: "M4 6h16v9a2 2 0 01-2 2H9l-4 3v-3H6a2 2 0 01-2-2V6z"),
      ])
    case "settings":
      return .layers(
        [PoppoIconLayer(d: "M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4")],
        circles: [PoppoIconCircle(cx: 12, cy: 12, r: 3, fill: false)]
      )
    case "trophy":
      return .layers([
        PoppoIconLayer(d: "M6 4h12v3a4 4 0 01-8 0V4zM8 17h8M10 20h4M9 14h6v3H9v-3z"),
      ])
    case "heart":
      return .layers([PoppoIconLayer(d: "M12 20s-7-4.4-7-9.5C5 7.5 7.5 5 10.5 5c1.7 0 3.2.9 4 2.2.8-1.3 2.3-2.2 4-2.2 3 0 5.5 2.5 5.5 5.5 0 5.1-7 9.5-7 9.5z", fill: true)])
    case "heart-outline":
      return .layers([
        PoppoIconLayer(d: "M12 20s-7-4.4-7-9.5C5 7.5 7.5 5 10.5 5c1.7 0 3.2.9 4 2.2.8-1.3 2.3-2.2 4-2.2 3 0 5.5 2.5 5.5 5.5 0 5.1-7 9.5-7 9.5z"),
      ])
    case "flash":
      return .layers([
        PoppoIconLayer(d: "M13 2L5 14h6l-1 8 9-14h-6l0-6z"),
      ])
    case "flash-auto":
      return .layers([
        PoppoIconLayer(d: "M13 2L5 14h6l-1 8 9-14h-6l0-6z"),
        PoppoIconLayer(d: "M18 3h3v3M21 3l-4 4", strokeWidth: 1.6),
      ])
    case "chevron-right":
      return .layers([PoppoIconLayer(d: "M9 6l6 6-6 6", strokeWidth: 2)])
    case "chevron-left":
      return .layers([PoppoIconLayer(d: "M15 6l-6 6 6 6", strokeWidth: 2)])
    case "instagram":
      return .layers(
        [],
        circles: [
          PoppoIconCircle(cx: 12, cy: 12, r: 4, fill: false),
          PoppoIconCircle(cx: 17.5, cy: 6.5, r: 1),
        ],
        rects: [PoppoIconRect(x: 3, y: 3, width: 18, height: 18, cornerRadius: 5)]
      )
    case "x-logo":
      return .layers([PoppoIconLayer(d: "M5 5l14 14M19 5L5 19", strokeWidth: 2)])
    case "egg":
      return .layers([PoppoIconLayer(d: "M12 3c-3 0-5 4-5 8s2 8 5 8 5-4 5-8-2-8-5-8z")])
    case "bird":
      return .layers([
        PoppoIconLayer(d: "M4 12c3-5 8-7 13-6M18 8l2-2M18 8l2 2M8 16l-2 4 3-2"),
      ])
    case "moon":
      return .layers([PoppoIconLayer(d: "M20 14a7 7 0 11-9-9 7 7 0 019 9z")])
    case "sparkle":
      return .layers([
        PoppoIconLayer(d: "M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z", strokeWidth: 1.6),
      ])
    case "search":
      return .layers(
        [],
        circles: [PoppoIconCircle(cx: 11, cy: 11, r: 6, fill: false)],
        lines: [PoppoIconLine(x1: 16, y1: 16, x2: 20, y2: 20)]
      )
    case "crown":
      return .layers([
        PoppoIconLayer(d: "M4 18h16M6 18l2-9 4 5 4-5 2 9"),
      ])
    case "check":
      return .layers([PoppoIconLayer(d: "M5 12l5 5 9-10", strokeWidth: 2)])
    case "report":
      return .layers([PoppoIconLayer(d: "M12 3v14M8 7h8M6 20h12")])
    case "target":
      return .layers(
        [],
        circles: [
          PoppoIconCircle(cx: 12, cy: 12, r: 8, fill: false),
          PoppoIconCircle(cx: 12, cy: 12, r: 3, fill: false),
          PoppoIconCircle(cx: 12, cy: 12, r: 1),
        ]
      )
    case "sound":
      return .layers([
        PoppoIconLayer(d: "M8 10v4l4 3V7L8 10z", fill: true),
        PoppoIconLayer(d: "M16 9a4 4 0 010 6M18 7a7 7 0 010 10", strokeWidth: 1.6),
      ])
    default:
      return nil
    }
  }
}

private struct PoppoIconLayerShape: View {
  let layer: PoppoIconLayer
  let color: Color

  @ViewBuilder
  var body: some View {
    if layer.fill {
      PoppoSvgPath.path(from: layer.d).fill(color)
    } else {
      PoppoSvgPath.path(from: layer.d).stroke(
        color,
        style: StrokeStyle(
          lineWidth: layer.strokeWidth,
          lineCap: layer.strokeLineCap == .round ? .round : .butt,
          lineJoin: layer.strokeLineJoin == .round ? .round : .miter
        )
      )
    }
  }
}

struct PoppoIconSwiftUIView: View {
  let name: String
  let color: Color
  let size: CGFloat

  var body: some View {
    if let glyph = PoppoIconGlyphs.glyph(named: name) {
      ZStack {
        ForEach(Array(glyph.rects.enumerated()), id: \.offset) { _, rect in
          RoundedRectangle(cornerRadius: rect.cornerRadius)
            .stroke(color, lineWidth: rect.strokeWidth)
            .frame(width: rect.width, height: rect.height)
            .position(x: rect.x + rect.width / 2, y: rect.y + rect.height / 2)
        }
        ForEach(Array(glyph.circles.enumerated()), id: \.offset) { _, circle in
          Group {
            if circle.fill {
              Circle()
                .fill(color)
            } else {
              Circle()
                .stroke(color, lineWidth: 1.8)
            }
          }
          .frame(width: circle.r * 2, height: circle.r * 2)
          .position(x: circle.cx, y: circle.cy)
        }
        ForEach(Array(glyph.lines.enumerated()), id: \.offset) { _, line in
          Path { path in
            path.move(to: CGPoint(x: line.x1, y: line.y1))
            path.addLine(to: CGPoint(x: line.x2, y: line.y2))
          }
          .stroke(color, style: StrokeStyle(lineWidth: line.strokeWidth, lineCap: .round))
        }
        ForEach(Array(glyph.layers.enumerated()), id: \.offset) { _, layer in
          PoppoIconLayerShape(layer: layer, color: color)
        }
      }
      .frame(width: 24, height: 24)
      .scaleEffect(size / 24)
      .frame(width: size, height: size)
    } else {
      Color.clear.frame(width: size, height: size)
    }
  }
}
