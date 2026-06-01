import SwiftUI

enum PoppoHeroSceneKind: String {
  case scan
  case ai
  case collection
  case welcome

  init(raw: String) {
    self = PoppoHeroSceneKind(rawValue: raw) ?? .scan
  }
}

struct PoppoHeroSwiftUIView: View {
  let scene: PoppoHeroSceneKind
  let accent: Color

  var body: some View {
    ZStack {
      RoundedRectangle(cornerRadius: 32, style: .continuous)
        .fill(
          LinearGradient(
            colors: [
              Color.white.opacity(0.08),
              accent.opacity(0.12),
              Color.black.opacity(0.2),
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
          )
        )
        .overlay(
          RoundedRectangle(cornerRadius: 32, style: .continuous)
            .stroke(Color.white.opacity(0.12), lineWidth: 1)
        )

      heroScene
    }
    .frame(width: 280, height: 280)
  }

  @ViewBuilder
  private var heroScene: some View {
    switch scene {
    case .scan:
      ScanHeroScene(accent: accent)
    case .ai:
      AiHeroScene(accent: accent)
    case .collection:
      CollectionHeroScene(accent: accent)
    case .welcome:
      WelcomeHeroScene(accent: accent)
    }
  }
}

// MARK: - Scan（カメラ・鳩・ビューファインダー）

private struct ScanHeroScene: View {
  let accent: Color

  var body: some View {
    ZStack {
      RoundedRectangle(cornerRadius: 22, style: .continuous)
        .fill(Color.black.opacity(0.55))
        .frame(width: 148, height: 200)
        .overlay(
          RoundedRectangle(cornerRadius: 22, style: .continuous)
            .stroke(accent.opacity(0.5), lineWidth: 1.5)
        )

      ViewfinderCorners()
        .frame(width: 120, height: 120)

      PigeonSilhouette()
        .fill(accent.opacity(0.85))
        .frame(width: 72, height: 52)
        .offset(y: 8)

      Rectangle()
        .fill(
          LinearGradient(
            colors: [accent.opacity(0), accent.opacity(0.7), accent.opacity(0)],
            startPoint: .leading,
            endPoint: .trailing
          )
        )
        .frame(width: 110, height: 2)
        .offset(y: -12)
        .opacity(0.9)

      Circle()
        .stroke(accent.opacity(0.35), lineWidth: 1)
        .frame(width: 200, height: 200)
    }
  }
}

// MARK: - AI（判定カード・タグ）

private struct AiHeroScene: View {
  let accent: Color

  var body: some View {
    ZStack {
      ForEach(0..<6, id: \.self) { i in
        Circle()
          .fill(accent.opacity(0.15))
          .frame(width: 6, height: 6)
          .offset(
            x: CGFloat(cos(Double(i) * .pi / 3) * 95),
            y: CGFloat(sin(Double(i) * .pi / 3) * 95)
          )
      }

      RoundedRectangle(cornerRadius: 20, style: .continuous)
        .fill(Color.black.opacity(0.5))
        .frame(width: 160, height: 110)
        .overlay(
          RoundedRectangle(cornerRadius: 20, style: .continuous)
            .stroke(accent.opacity(0.45), lineWidth: 1)
        )

      PigeonSilhouette()
        .fill(accent)
        .frame(width: 56, height: 40)
        .offset(y: -18)

      HStack(spacing: 10) {
        TagPill(icon: "scope", accent: accent)
        TagPill(icon: "text.quote", accent: accent, highlight: true)
      }
      .offset(y: 32)

      Image(systemName: "sparkles")
        .font(.system(size: 22, weight: .semibold))
        .foregroundColor(accent)
        .offset(x: 88, y: -72)
    }
  }
}

// MARK: - Collection（グリッド・共有）

private struct CollectionHeroScene: View {
  let accent: Color

  private static let slots: [CGPoint] = [
    CGPoint(x: -52, y: -52),
    CGPoint(x: 52, y: -52),
    CGPoint(x: -52, y: 52),
    CGPoint(x: 52, y: 52),
  ]

  var body: some View {
    ZStack {
      ForEach(0..<4, id: \.self) { i in
        RoundedRectangle(cornerRadius: 16, style: .continuous)
          .fill(Color.black.opacity(0.45))
          .frame(width: 88, height: 88)
          .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
              .stroke(Color.white.opacity(0.1), lineWidth: 1)
          )
          .overlay(
            PigeonSilhouette()
              .fill(accent.opacity(i == 1 ? 1 : 0.55))
              .frame(width: 40, height: 28)
          )
          .offset(x: Self.slots[i].x, y: Self.slots[i].y)
      }

      Circle()
        .fill(accent)
        .frame(width: 44, height: 44)
        .overlay(
          Image(systemName: "square.and.arrow.up")
            .font(.system(size: 18, weight: .bold))
            .foregroundColor(Color(red: 0.12, green: 0.06, blue: 0.2))
        )
        .shadow(color: accent.opacity(0.5), radius: 12, y: 4)
    }
  }
}

// MARK: - Welcome（クラウド引き継ぎ）

private struct WelcomeHeroScene: View {
  let accent: Color

  var body: some View {
    ZStack {
      Image(systemName: "icloud.fill")
        .font(.system(size: 72, weight: .light))
        .foregroundColor(accent.opacity(0.85))
        .offset(y: -36)

      PigeonSilhouette()
        .fill(Color.white.opacity(0.92))
        .frame(width: 80, height: 56)
        .offset(y: 42)

      HStack(spacing: 40) {
        Image(systemName: "iphone")
          .font(.system(size: 28, weight: .light))
          .foregroundColor(Color.white.opacity(0.5))
        Image(systemName: "arrow.left.arrow.right")
          .font(.system(size: 20, weight: .semibold))
          .foregroundColor(accent)
        Image(systemName: "iphone")
          .font(.system(size: 28, weight: .light))
          .foregroundColor(accent.opacity(0.8))
      }
      .offset(y: 108)
    }
  }
}

// MARK: - Shapes

private struct PigeonSilhouette: Shape {
  func path(in rect: CGRect) -> Path {
    var p = Path()
    let w = rect.width
    let h = rect.height
    p.move(to: CGPoint(x: w * 0.08, y: h * 0.55))
    p.addCurve(
      to: CGPoint(x: w * 0.55, y: h * 0.12),
      control1: CGPoint(x: w * 0.2, y: h * 0.2),
      control2: CGPoint(x: w * 0.38, y: h * 0.08)
    )
    p.addCurve(
      to: CGPoint(x: w * 0.92, y: h * 0.35),
      control1: CGPoint(x: w * 0.72, y: h * 0.16),
      control2: CGPoint(x: w * 0.88, y: h * 0.22)
    )
    p.addLine(to: CGPoint(x: w * 0.98, y: h * 0.42))
    p.addLine(to: CGPoint(x: w * 0.82, y: h * 0.48))
    p.addCurve(
      to: CGPoint(x: w * 0.35, y: h * 0.88),
      control1: CGPoint(x: w * 0.65, y: h * 0.72),
      control2: CGPoint(x: w * 0.48, y: h * 0.9)
    )
    p.addCurve(
      to: CGPoint(x: w * 0.08, y: h * 0.55),
      control1: CGPoint(x: w * 0.18, y: h * 0.78),
      control2: CGPoint(x: w * 0.02, y: h * 0.68)
    )
    p.closeSubpath()
    return p
  }
}

private struct ViewfinderCorners: View {
  var body: some View {
    ZStack {
      Corner(rotation: 0).offset(x: -50, y: -50)
      Corner(rotation: 90).offset(x: 50, y: -50)
      Corner(rotation: 180).offset(x: 50, y: 50)
      Corner(rotation: 270).offset(x: -50, y: 50)
    }
  }
}

private struct Corner: View {
  let rotation: Double

  var body: some View {
    Path { path in
      path.move(to: CGPoint(x: 0, y: 18))
      path.addLine(to: CGPoint(x: 0, y: 0))
      path.addLine(to: CGPoint(x: 18, y: 0))
    }
    .stroke(Color.white.opacity(0.85), style: StrokeStyle(lineWidth: 3, lineCap: .round))
    .frame(width: 18, height: 18)
    .rotationEffect(.degrees(rotation))
  }
}

private struct TagPill: View {
  let icon: String
  let accent: Color
  var highlight: Bool = false

  var body: some View {
    Image(systemName: icon)
      .font(.system(size: 14, weight: .bold))
      .foregroundColor(highlight ? Color(red: 0.12, green: 0.06, blue: 0.2) : accent)
      .padding(.horizontal, 12)
      .padding(.vertical, 8)
      .background(
        Capsule()
          .fill(highlight ? accent : accent.opacity(0.15))
      )
  }
}
