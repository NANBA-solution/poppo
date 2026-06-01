import SwiftUI

/// Minimal SVG `d` path parser (M/L/H/V/C/c/l/h/v/Z/A) for 24×24 icon paths.
enum PoppoSvgPath {
  static func path(from d: String) -> Path {
    var result = Path()
    var index = d.startIndex
    var cmd: Character = "M"
    var current = CGPoint.zero
    var start = CGPoint.zero
    var lastControl: CGPoint?

    func skipSeparators() {
      while index < d.endIndex, ", \t\n\r".contains(d[index]) {
        index = d.index(after: index)
      }
    }

    func readNumber() -> CGFloat? {
      skipSeparators()
      guard index < d.endIndex else { return nil }
      let startIdx = index
      if d[index] == "-" || d[index] == "+" {
        index = d.index(after: index)
      }
      while index < d.endIndex, (d[index].isNumber || d[index] == ".") {
        index = d.index(after: index)
      }
      if startIdx == index { return nil }
      return CGFloat(Double(d[startIdx..<index]) ?? 0)
    }

    func readPoint() -> CGPoint? {
      guard let x = readNumber(), let y = readNumber() else { return nil }
      return CGPoint(x: x, y: y)
    }

    func arcTo(end: CGPoint, rx: CGFloat, ry: CGFloat, rotation: CGFloat, large: Bool, sweep: Bool) {
      // Approximate arcs as cubics for icon-scale paths.
      let mid = CGPoint(x: (current.x + end.x) / 2, y: (current.y + end.y) / 2)
      let dx = (end.y - current.y) * (sweep ? 0.25 : -0.25)
      let dy = (end.x - current.x) * (sweep ? -0.25 : 0.25)
      let c1 = CGPoint(x: mid.x + dx, y: mid.y + dy)
      let c2 = CGPoint(x: mid.x - dx, y: mid.y - dy)
      result.addCurve(to: end, control1: c1, control2: c2)
      current = end
      _ = (rx, ry, rotation, large)
    }

    while index < d.endIndex {
      let ch = d[index]
      if ch.isLetter {
        cmd = ch
        index = d.index(after: index)
      }

      switch cmd {
      case "M":
        guard let p = readPoint() else { break }
        result.move(to: p)
        current = p
        start = p
        cmd = "L"
      case "m":
        guard let p = readPoint() else { break }
        let np = CGPoint(x: current.x + p.x, y: current.y + p.y)
        result.move(to: np)
        current = np
        start = np
        cmd = "l"
      case "L":
        while let p = readPoint() {
          result.addLine(to: p)
          current = p
        }
      case "l":
        while let p = readPoint() {
          let np = CGPoint(x: current.x + p.x, y: current.y + p.y)
          result.addLine(to: np)
          current = np
        }
      case "H":
        while let x = readNumber() {
          let np = CGPoint(x: x, y: current.y)
          result.addLine(to: np)
          current = np
        }
      case "h":
        while let dx = readNumber() {
          let np = CGPoint(x: current.x + dx, y: current.y)
          result.addLine(to: np)
          current = np
        }
      case "V":
        while let y = readNumber() {
          let np = CGPoint(x: current.x, y: y)
          result.addLine(to: np)
          current = np
        }
      case "v":
        while let dy = readNumber() {
          let np = CGPoint(x: current.x, y: current.y + dy)
          result.addLine(to: np)
          current = np
        }
      case "C":
        while let c1 = readPoint(), let c2 = readPoint(), let end = readPoint() {
          result.addCurve(to: end, control1: c1, control2: c2)
          current = end
          lastControl = c2
        }
      case "c":
        while let c1 = readPoint(), let c2 = readPoint(), let end = readPoint() {
          let ac1 = CGPoint(x: current.x + c1.x, y: current.y + c1.y)
          let ac2 = CGPoint(x: current.x + c2.x, y: current.y + c2.y)
          let aend = CGPoint(x: current.x + end.x, y: current.y + end.y)
          result.addCurve(to: aend, control1: ac1, control2: ac2)
          current = aend
          lastControl = ac2
        }
      case "A", "a":
        while let rx = readNumber(), let ry = readNumber(), let rot = readNumber(),
              let large = readNumber(), let sweep = readNumber(), let end = readPoint() {
          let target: CGPoint
          if cmd == "a" {
            target = CGPoint(x: current.x + end.x, y: current.y + end.y)
          } else {
            target = end
          }
          arcTo(
            end: target,
            rx: rx,
            ry: ry,
            rotation: rot,
            large: large != 0,
            sweep: sweep != 0
          )
        }
      case "Z", "z":
        result.closeSubpath()
        current = start
      default:
        if let p = readPoint() {
          result.addLine(to: p)
          current = p
        } else {
          index = d.index(after: index)
        }
      }
    }

    return result
  }
}
