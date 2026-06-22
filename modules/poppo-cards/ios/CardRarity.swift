import Foundation
import simd
import UIKit

enum CardRarity: String, CaseIterable, Equatable {
  case common
  case rare
  case legendary

  init(raw: String) {
    switch raw.lowercased() {
    case "rare":
      self = .rare
    case "legendary", "sr", "ur", "secret":
      self = .legendary
    default:
      self = .common
    }
  }

  /// POPPO アプリの CardRarity 文字列から変換
  static func fromPoppo(_ value: String) -> CardRarity {
    switch value.uppercased() {
    case "R":
      return .rare
    case "SR", "UR", "SECRET":
      return .legendary
    default:
      return .common
    }
  }

  var holoIntensity: Float {
    switch self {
    case .common: return 0.28
    case .rare: return 0.55
    case .legendary: return 0.92
    }
  }

  var baseTint: SIMD3<Float> {
    switch self {
    case .common: return SIMD3(0.42, 0.52, 0.62)
    case .rare: return SIMD3(0.82, 0.58, 0.18)
    case .legendary: return SIMD3(0.42, 0.22, 0.68)
    }
  }

  var glowEmissive: Float {
    switch self {
    case .common: return 0.0
    case .rare: return 0.22
    case .legendary: return 0.48
    }
  }

  var fresnelPower: Float {
    switch self {
    case .common: return 2.2
    case .rare: return 3.4
    case .legendary: return 4.8
    }
  }
}

struct CardHoloUniforms {
  var lightDirection: SIMD3<Float>
  var viewAngle: SIMD2<Float>
  var holoIntensity: Float
  var hueShift: Float
  var shininess: Float
  var fresnelPower: Float
  var baseTint: SIMD3<Float>
  var cornerRadius: Float
}

enum CardDimensions {
  static let width: CGFloat = 200
  static let height: CGFloat = 280
  static let cornerRadius: CGFloat = 16
  static let whiteBorder: CGFloat = 2.5

  static let planeWidth: Float = 2.0
  static let planeHeight: Float = 2.8
}

struct CardFaceData {
  var photo: UIImage?
  var rarity: CardRarity
  var rarityLabel: String
  var typeLong: String
  var profile: String
  var name: String
  var serial: String
  var starCount: Int
  var hp: String
  var retreatCost: String
  var hpLabel: String
  var retreatLabel: String
  var move1Name: String
  var move1Damage: String
  var move1Cost: String
  var move2Name: String
  var move2Damage: String
  var move2Cost: String
  var moveDescription: String
  var move2Description: String
  var moveTraitLabel: String
  var imageScale: Float = 1
  var imageOffsetX: Float = 0
  var imageOffsetY: Float = 0
  var flavor: String
  var brandLine: String
  var showMove2: Bool
  var showMoveDesc: Bool
  var showMove2Desc: Bool
  var showMeta: Bool
  var showProfile: Bool
  var showStats: Bool
  var showCosts: Bool
  var showBrand: Bool
}

struct CardFaceTheme {
  let frameTop: UIColor
  let frameBottom: UIColor
  let plateTop: UIColor
  let plateBottom: UIColor
  let paperTop: UIColor
  let paperBottom: UIColor
  let textBoxTop: UIColor
  let textBoxBottom: UIColor
  let bezel: UIColor
  let glow: UIColor
  let accent: UIColor
  let ink: UIColor
  let muted: UIColor
  let accentSoft: UIColor
  let holoIntensity: Float
  let holoTint: SIMD3<Float>

  private static let readableInk = UIColor(white: 0.06, alpha: 1)
  private static let readableMuted = UIColor(white: 0.22, alpha: 1)

  static func theme(for data: CardFaceData) -> CardFaceTheme {
    theme(forLabel: data.rarityLabel, tier: data.rarity)
  }

  static func theme(forLabel label: String, tier: CardRarity) -> CardFaceTheme {
    switch label.uppercased() {
    case "SECRET":
      return CardFaceTheme(
        frameTop: UIColor(red: 0.12, green: 0.12, blue: 0.1, alpha: 1),
        frameBottom: UIColor(red: 0.02, green: 0.02, blue: 0.02, alpha: 1),
        plateTop: UIColor(red: 0.22, green: 0.2, blue: 0.14, alpha: 1),
        plateBottom: UIColor(red: 0.12, green: 0.11, blue: 0.08, alpha: 1),
        paperTop: UIColor(red: 0.97, green: 0.95, blue: 0.88, alpha: 1),
        paperBottom: UIColor(red: 0.9, green: 0.86, blue: 0.74, alpha: 1),
        textBoxTop: UIColor(red: 1.0, green: 0.98, blue: 0.9, alpha: 1),
        textBoxBottom: UIColor(red: 0.94, green: 0.9, blue: 0.78, alpha: 1),
        bezel: UIColor(red: 0.83, green: 0.69, blue: 0.22, alpha: 1),
        glow: UIColor(red: 0.59, green: 0.84, blue: 0.66, alpha: 1),
        accent: UIColor(red: 0.54, green: 0.41, blue: 0.03, alpha: 1),
        ink: readableInk,
        muted: readableMuted,
        accentSoft: UIColor(red: 0.83, green: 0.69, blue: 0.22, alpha: 0.22),
        holoIntensity: 1.05,
        holoTint: SIMD3(0.45, 0.38, 0.12)
      )
    case "UR":
      return CardFaceTheme(
        frameTop: UIColor(red: 0.56, green: 0.44, blue: 0.9, alpha: 1),
        frameBottom: UIColor(red: 0.16, green: 0.08, blue: 0.34, alpha: 1),
        plateTop: UIColor(red: 0.94, green: 0.9, blue: 1.0, alpha: 1),
        plateBottom: UIColor(red: 0.78, green: 0.7, blue: 0.96, alpha: 1),
        paperTop: UIColor(red: 0.97, green: 0.94, blue: 1.0, alpha: 1),
        paperBottom: UIColor(red: 0.9, green: 0.84, blue: 0.98, alpha: 1),
        textBoxTop: UIColor(red: 0.98, green: 0.95, blue: 1.0, alpha: 1),
        textBoxBottom: UIColor(red: 0.92, green: 0.86, blue: 0.99, alpha: 1),
        bezel: UIColor(red: 0.7, green: 0.55, blue: 0.95, alpha: 1),
        glow: UIColor(red: 0.62, green: 0.42, blue: 0.95, alpha: 1),
        accent: UIColor(red: 0.45, green: 0.28, blue: 0.72, alpha: 1),
        ink: readableInk,
        muted: readableMuted,
        accentSoft: UIColor(red: 0.56, green: 0.44, blue: 0.9, alpha: 0.18),
        holoIntensity: 0.98,
        holoTint: SIMD3(0.42, 0.22, 0.68)
      )
    case "SR":
      return CardFaceTheme(
        frameTop: UIColor(red: 0.92, green: 0.76, blue: 0.2, alpha: 1),
        frameBottom: UIColor(red: 0.42, green: 0.3, blue: 0.04, alpha: 1),
        plateTop: UIColor(red: 1.0, green: 0.96, blue: 0.78, alpha: 1),
        plateBottom: UIColor(red: 0.9, green: 0.78, blue: 0.34, alpha: 1),
        paperTop: UIColor(red: 1.0, green: 0.97, blue: 0.88, alpha: 1),
        paperBottom: UIColor(red: 0.96, green: 0.88, blue: 0.66, alpha: 1),
        textBoxTop: UIColor(red: 1.0, green: 0.98, blue: 0.9, alpha: 1),
        textBoxBottom: UIColor(red: 0.96, green: 0.9, blue: 0.72, alpha: 1),
        bezel: UIColor(red: 0.9, green: 0.72, blue: 0.18, alpha: 1),
        glow: UIColor(red: 0.95, green: 0.76, blue: 0.18, alpha: 1),
        accent: UIColor(red: 0.54, green: 0.41, blue: 0.03, alpha: 1),
        ink: readableInk,
        muted: readableMuted,
        accentSoft: UIColor(red: 0.9, green: 0.72, blue: 0.18, alpha: 0.2),
        holoIntensity: 0.88,
        holoTint: SIMD3(0.82, 0.58, 0.18)
      )
    case "R":
      return CardFaceTheme(
        frameTop: UIColor(red: 0.74, green: 0.8, blue: 0.88, alpha: 1),
        frameBottom: UIColor(red: 0.23, green: 0.28, blue: 0.38, alpha: 1),
        plateTop: UIColor(red: 0.95, green: 0.97, blue: 0.99, alpha: 1),
        plateBottom: UIColor(red: 0.8, green: 0.86, blue: 0.93, alpha: 1),
        paperTop: UIColor(red: 0.97, green: 0.98, blue: 1.0, alpha: 1),
        paperBottom: UIColor(red: 0.9, green: 0.93, blue: 0.98, alpha: 1),
        textBoxTop: UIColor(red: 0.98, green: 0.99, blue: 1.0, alpha: 1),
        textBoxBottom: UIColor(red: 0.92, green: 0.95, blue: 0.99, alpha: 1),
        bezel: UIColor(red: 0.82, green: 0.87, blue: 0.94, alpha: 1),
        glow: UIColor(red: 0.62, green: 0.74, blue: 0.9, alpha: 1),
        accent: UIColor(red: 0.29, green: 0.38, blue: 0.47, alpha: 1),
        ink: readableInk,
        muted: readableMuted,
        accentSoft: UIColor(red: 0.62, green: 0.74, blue: 0.9, alpha: 0.2),
        holoIntensity: 0.68,
        holoTint: SIMD3(0.55, 0.65, 0.78)
      )
    default:
      return CardFaceTheme(
        frameTop: UIColor(red: 0.77, green: 0.72, blue: 0.66, alpha: 1),
        frameBottom: UIColor(red: 0.35, green: 0.32, blue: 0.28, alpha: 1),
        plateTop: UIColor(red: 0.97, green: 0.96, blue: 0.93, alpha: 1),
        plateBottom: UIColor(red: 0.87, green: 0.84, blue: 0.79, alpha: 1),
        paperTop: UIColor(red: 0.99, green: 0.98, blue: 0.96, alpha: 1),
        paperBottom: UIColor(red: 0.94, green: 0.91, blue: 0.86, alpha: 1),
        textBoxTop: UIColor(red: 1.0, green: 0.99, blue: 0.97, alpha: 1),
        textBoxBottom: UIColor(red: 0.96, green: 0.94, blue: 0.9, alpha: 1),
        bezel: UIColor.white,
        glow: UIColor(white: 0.9, alpha: 1),
        accent: UIColor(red: 0.42, green: 0.37, blue: 0.31, alpha: 1),
        ink: readableInk,
        muted: readableMuted,
        accentSoft: UIColor(red: 0.42, green: 0.37, blue: 0.31, alpha: 0.15),
        holoIntensity: tier == .common ? 0.22 : 0.35,
        holoTint: SIMD3(0.42, 0.52, 0.62)
      )
    }
  }
}

enum CardFaceRenderer {
  private static let size = CGSize(width: 800, height: 1120)
  private static let corner: CGFloat = 32

  static func render(_ data: CardFaceData) -> UIImage {
    let theme = CardFaceTheme.theme(for: data)
    let renderer = UIGraphicsImageRenderer(size: size)
    return renderer.image { ctx in
      let bounds = CGRect(origin: .zero, size: size)
      let path = UIBezierPath(roundedRect: bounds, cornerRadius: corner)
      path.addClip()

      drawFrame(in: bounds, data: data, theme: theme, context: ctx.cgContext)
      let inner = bounds.insetBy(dx: 28, dy: 28)
      drawInnerFace(data: data, in: inner, theme: theme, context: ctx.cgContext)
    }
  }

  private static func drawFrame(
    in rect: CGRect,
    data: CardFaceData,
    theme: CardFaceTheme,
    context: CGContext
  ) {
    let colors = [theme.frameTop.cgColor, theme.frameBottom.cgColor] as CFArray
    let space = CGColorSpaceCreateDeviceRGB()
    if let gradient = CGGradient(colorsSpace: space, colors: colors, locations: [0, 1]) {
      context.drawLinearGradient(
        gradient,
        start: CGPoint(x: rect.minX, y: rect.minY),
        end: CGPoint(x: rect.maxX, y: rect.maxY),
        options: []
      )
    }

    guard data.rarityLabel.uppercased() != "N" else { return }

    context.saveGState()
    let foilPath = UIBezierPath(roundedRect: rect.insetBy(dx: 2, dy: 2), cornerRadius: corner - 2)
    foilPath.addClip()

    let highlight = CGGradient(
      colorsSpace: space,
      colors: [
        UIColor.white.withAlphaComponent(0.55).cgColor,
        UIColor.clear.cgColor,
        UIColor.white.withAlphaComponent(0.35).cgColor,
        UIColor.clear.cgColor,
      ] as CFArray,
      locations: [0, 0.35, 0.62, 1]
    )
    if let highlight {
      context.drawLinearGradient(
        highlight,
        start: CGPoint(x: rect.minX, y: rect.minY),
        end: CGPoint(x: rect.maxX, y: rect.maxY),
        options: []
      )
    }

    drawLameFlakes(in: rect, label: data.rarityLabel, context: context)
    context.restoreGState()
  }

  private static func lameColor(for label: String, alpha: CGFloat) -> UIColor {
    switch label.uppercased() {
    case "SECRET":
      return UIColor(red: 1.0, green: 0.9, blue: 0.45, alpha: alpha)
    case "UR":
      return UIColor(red: 0.88, green: 0.78, blue: 1.0, alpha: alpha)
    case "SR":
      return UIColor(red: 1.0, green: 0.86, blue: 0.42, alpha: alpha)
    default:
      return UIColor(red: 0.9, green: 0.94, blue: 1.0, alpha: alpha)
    }
  }

  private static func drawLameFlakes(in rect: CGRect, label: String, context: CGContext) {
    let density: Int
    switch label.uppercased() {
    case "SECRET": density = 220
    case "UR": density = 190
    case "SR": density = 160
    case "R": density = 130
    default: density = 0
    }
    guard density > 0 else { return }

    let seed = label.hashValue
    for i in 0..<density {
      let unitX = CGFloat((seed &+ i &* 73) % 10_000) / 10_000.0
      let unitY = CGFloat((seed &+ i &* 131) % 10_000) / 10_000.0
      let unitA = CGFloat((seed &+ i &* 197) % 10_000) / 10_000.0
      let unitS = CGFloat((seed &+ i &* 311) % 10_000) / 10_000.0
      let unitB = CGFloat((seed &+ i &* 419) % 10_000) / 10_000.0
      let x = rect.minX + unitX * rect.width
      let y = rect.minY + unitY * rect.height
      let angle = unitA * .pi * 2
      let width = 2.5 + unitS * 9.5
      let height = 0.7 + unitB * 2.4
      let alpha = 0.14 + unitS * 0.38

      context.saveGState()
      context.translateBy(x: x, y: y)
      context.rotate(by: angle)
      context.setFillColor(lameColor(for: label, alpha: alpha).cgColor)
      let flake = CGRect(x: -width * 0.5, y: -height * 0.5, width: width, height: height)
      context.fill(flake)
      if unitB > 0.55 {
        context.setFillColor(UIColor.white.withAlphaComponent(alpha * 0.85).cgColor)
        context.fill(flake.insetBy(dx: width * 0.18, dy: height * 0.1))
      }
      context.restoreGState()
    }
  }

  private static func drawFoilSparkles(in rect: CGRect, label: String, context: CGContext) {
    drawLameFlakes(in: rect, label: label, context: context)
  }

  private static func drawInnerFace(
    data: CardFaceData,
    in rect: CGRect,
    theme: CardFaceTheme,
    context: CGContext
  ) {
    let bezel = rect.insetBy(dx: 8, dy: 8)
    let bezelPath = UIBezierPath(roundedRect: bezel, cornerRadius: 20)
    theme.bezel.setFill()
    bezelPath.fill()

    let face = bezel.insetBy(dx: 10, dy: 10)
    let facePath = UIBezierPath(roundedRect: face, cornerRadius: 16)
    fillVerticalGradient(
      in: face,
      top: theme.paperTop,
      bottom: theme.paperBottom,
      cornerRadius: 16
    )

    if data.rarityLabel.uppercased() != "N" {
      context.saveGState()
      UIBezierPath(roundedRect: face, cornerRadius: 16).addClip()
      drawLameFlakes(in: face, label: data.rarityLabel, context: context)
      context.restoreGState()
    }

    let pad: CGFloat = 22
    var cursorY = face.minY + pad
    let contentW = face.width - pad * 2
    let left = face.minX + pad

    cursorY = drawTopRow(
      data: data,
      left: left,
      y: cursorY,
      width: contentW,
      theme: theme
    )

    if data.showMeta {
      cursorY = drawMetaRow(
        data: data,
        left: left,
        y: cursorY + 6,
        width: contentW,
        theme: theme
      )
    }

    let artH = face.height * 0.42
    let artRect = CGRect(x: left, y: cursorY + 10, width: contentW, height: artH)
    drawArt(
      photo: data.photo,
      in: artRect,
      rarityLabel: data.rarityLabel,
      imageScale: data.imageScale,
      imageOffsetX: data.imageOffsetX,
      imageOffsetY: data.imageOffsetY,
      context: context
    )
    cursorY = artRect.maxY + 12

    let nameH: CGFloat = 56
    let nameRect = CGRect(x: left, y: cursorY, width: contentW, height: nameH)
    drawNameBar(name: data.name, in: nameRect, theme: theme)
    cursorY = nameRect.maxY + 8

    if data.showProfile, !data.profile.isEmpty {
      let profileRect = CGRect(x: left, y: cursorY, width: contentW, height: 24)
      drawText(
        data.profile,
        in: profileRect,
        font: .systemFont(ofSize: 16, weight: .semibold),
        color: theme.muted,
        align: .center
      )
      cursorY = profileRect.maxY + 6
    }

    let boxHeight = max(140, face.maxY - cursorY - pad)
    let boxRect = CGRect(x: left, y: cursorY, width: contentW, height: boxHeight)
    drawTextBox(data: data, in: boxRect, theme: theme)
  }

  private static func drawTopRow(
    data: CardFaceData,
    left: CGFloat,
    y: CGFloat,
    width: CGFloat,
    theme: CardFaceTheme
  ) -> CGFloat {
    let badge = CGRect(x: left, y: y, width: 74, height: 30)
    theme.accentSoft.setFill()
    UIBezierPath(roundedRect: badge, cornerRadius: 6).fill()
    theme.accent.setStroke()
    let badgePath = UIBezierPath(roundedRect: badge.insetBy(dx: 0.5, dy: 0.5), cornerRadius: 6)
    badgePath.lineWidth = 2
    badgePath.stroke()
    drawText(
      data.rarityLabel,
      in: badge,
      font: .systemFont(ofSize: 18, weight: .black),
      color: theme.accent,
      align: .center
    )

    let serialRect = CGRect(x: left + 84, y: y, width: width - 168, height: 30)
    drawText(
      data.serial,
      in: serialRect,
      font: .monospacedDigitSystemFont(ofSize: 17, weight: .bold),
      color: theme.muted,
      align: .center
    )

    let stars = (0..<5).map { i in i < data.starCount ? "★" : "·" }.joined(separator: " ")
    let starRect = CGRect(x: left + width - 84, y: y, width: 84, height: 30)
    drawText(
      stars,
      in: starRect,
      font: .systemFont(ofSize: 18, weight: .bold),
      color: theme.accent,
      align: .right
    )
    return y + 30
  }

  private static func drawMetaRow(
    data: CardFaceData,
    left: CGFloat,
    y: CGFloat,
    width: CGFloat,
    theme: CardFaceTheme
  ) -> CGFloat {
    let rowH: CGFloat = 26
    let typeRect = CGRect(x: left, y: y, width: width * 0.58, height: rowH)
    drawText(
      data.typeLong,
      in: typeRect,
      font: .systemFont(ofSize: 17, weight: .heavy),
      color: theme.ink,
      align: .left
    )
    if data.showStats {
      let hpRect = CGRect(x: left + width * 0.58, y: y, width: width * 0.42, height: rowH)
      let hpText = "\(data.hpLabel) \(data.hp)"
      drawText(
        hpText,
        in: hpRect,
        font: .monospacedDigitSystemFont(ofSize: 17, weight: .black),
        color: theme.ink,
        align: .right
      )
    }
    return y + rowH
  }

  private static func drawArt(
    photo: UIImage?,
    in rect: CGRect,
    rarityLabel: String,
    imageScale: Float,
    imageOffsetX: Float,
    imageOffsetY: Float,
    context: CGContext
  ) {
    let recess = rect.insetBy(dx: 0, dy: 0)
    UIColor(white: 0.06, alpha: 1).setFill()
    UIBezierPath(roundedRect: recess, cornerRadius: 12).fill()

    let inner = recess.insetBy(dx: 6, dy: 6)
    context.saveGState()
    UIBezierPath(roundedRect: inner, cornerRadius: 8).addClip()
    if let photo {
      let fitted = aspectFillRect(
        imageSize: photo.size,
        in: inner,
        scale: CGFloat(imageScale),
        offsetX: CGFloat(imageOffsetX),
        offsetY: CGFloat(imageOffsetY)
      )
      photo.draw(in: fitted)
    } else {
      UIColor(white: 0.12, alpha: 1).setFill()
      context.fill(inner)
    }
    context.restoreGState()

    UIColor(white: 1, alpha: 0.15).setStroke()
    let line = UIBezierPath(roundedRect: inner.insetBy(dx: 0.5, dy: 0.5), cornerRadius: 8)
    line.lineWidth = 1
    line.stroke()

    if rarityLabel.uppercased() != "N" {
      drawLameFlakes(in: inner, label: rarityLabel, context: context)
    }
  }

  private static func drawNameBar(name: String, in rect: CGRect, theme: CardFaceTheme) {
    let context = UIGraphicsGetCurrentContext()
    context?.saveGState()
    let colors = [theme.plateTop.cgColor, theme.plateBottom.cgColor] as CFArray
    let space = CGColorSpaceCreateDeviceRGB()
    if let gradient = CGGradient(colorsSpace: space, colors: colors, locations: [0, 1]) {
      let path = UIBezierPath(roundedRect: rect, cornerRadius: 8)
      path.addClip()
      context?.drawLinearGradient(
        gradient,
        start: CGPoint(x: rect.minX, y: rect.minY),
        end: CGPoint(x: rect.minX, y: rect.maxY),
        options: []
      )
    }
    context?.restoreGState()

    theme.accent.setStroke()
    UIBezierPath(roundedRect: rect.insetBy(dx: 0.5, dy: 0.5), cornerRadius: 8).lineWidth = 2.5
    UIBezierPath(roundedRect: rect.insetBy(dx: 0.5, dy: 0.5), cornerRadius: 8).stroke()
    drawText(
      name,
      in: rect,
      font: .systemFont(ofSize: 34, weight: .black),
      color: theme.ink,
      align: .center
    )
  }

  private static func drawTextBox(data: CardFaceData, in rect: CGRect, theme: CardFaceTheme) {
    fillVerticalGradient(
      in: rect,
      top: theme.textBoxTop,
      bottom: theme.textBoxBottom,
      cornerRadius: 8
    )
    theme.accent.withAlphaComponent(0.35).setStroke()
    let boxPath = UIBezierPath(roundedRect: rect, cornerRadius: 8)
    boxPath.lineWidth = 2
    boxPath.stroke()

    var y = rect.minY + 14
    let left = rect.minX + 14
    let width = rect.width - 28

    y = drawAttackRow(
      name: data.move1Name,
      damage: data.move1Damage,
      cost: data.showCosts ? data.move1Cost : "",
      left: left,
      y: y,
      width: width,
      theme: theme
    ) + 4

    if data.showMoveDesc, !data.moveDescription.isEmpty {
      y = drawMoveTrait(
        label: data.moveTraitLabel,
        trait: data.moveDescription,
        left: left,
        y: y,
        width: width,
        theme: theme
      ) + 6
    }

    if data.showMove2, !data.move2Name.isEmpty {
      y = drawAttackRow(
        name: data.move2Name,
        damage: data.move2Damage,
        cost: data.showCosts ? data.move2Cost : "",
        left: left,
        y: y,
        width: width,
        theme: theme
      ) + 4

      if data.showMove2Desc,
         !data.move2Description.isEmpty,
         data.move2Description != data.moveDescription {
        y = drawMoveTrait(
          label: data.moveTraitLabel,
          trait: data.move2Description,
          left: left,
          y: y,
          width: width,
          theme: theme
        ) + 6
      }
    }

    let lineRect = CGRect(x: left, y: y, width: width, height: 2)
    theme.accentSoft.setFill()
    UIRectFill(lineRect)
    y += 10

    let flavorRect = CGRect(x: left, y: y, width: width, height: rect.maxY - y - 34)
    drawText(
      data.flavor,
      in: flavorRect,
      font: .italicSystemFont(ofSize: 16),
      color: theme.muted,
      align: .left,
      lineBreak: .byWordWrapping
    )

    if data.showBrand {
      let brandY = rect.maxY - 28
      let brandRect = CGRect(x: left, y: brandY, width: width * 0.45, height: 22)
      drawText(
        data.brandLine,
        in: brandRect,
        font: .systemFont(ofSize: 14, weight: .black),
        color: theme.muted,
        align: .left
      )
      if data.showStats, !data.retreatLabel.isEmpty {
        let retreatRect = CGRect(x: left + width * 0.45, y: brandY, width: width * 0.55, height: 22)
        let retreatText = "\(data.retreatLabel) \(data.retreatCost)"
        drawText(
          retreatText,
          in: retreatRect,
          font: .monospacedDigitSystemFont(ofSize: 14, weight: .bold),
          color: theme.muted,
          align: .right
        )
      }
    }
  }

  private static func drawMoveTrait(
    label: String,
    trait: String,
    left: CGFloat,
    y: CGFloat,
    width: CGFloat,
    theme: CardFaceTheme
  ) -> CGFloat {
    let rowH: CGFloat = 38
    let labelRect = CGRect(x: left, y: y, width: 52, height: rowH)
    let traitRect = CGRect(x: left + 52, y: y, width: width - 52, height: rowH)
    drawText(
      label,
      in: labelRect,
      font: .systemFont(ofSize: 14, weight: .bold),
      color: theme.accent,
      align: .left
    )
    drawText(
      trait,
      in: traitRect,
      font: .italicSystemFont(ofSize: 15),
      color: theme.muted,
      align: .left,
      lineBreak: .byTruncatingTail
    )
    return y + rowH
  }

  private static func drawAttackRow(
    name: String,
    damage: String,
    cost: String,
    left: CGFloat,
    y: CGFloat,
    width: CGFloat,
    theme: CardFaceTheme
  ) -> CGFloat {
    let rowH: CGFloat = 28
    var nameLeft = left
    if !cost.isEmpty {
      let costRect = CGRect(x: left, y: y, width: 34, height: rowH)
      drawText(
        cost,
        in: costRect,
        font: .systemFont(ofSize: 15, weight: .black),
        color: theme.accent,
        align: .center
      )
      nameLeft += 38
    }
    let nameRect = CGRect(x: nameLeft, y: y, width: width - 56 - (nameLeft - left), height: rowH)
    let dmgRect = CGRect(x: left + width - 52, y: y, width: 52, height: rowH)
    drawText(
      name,
      in: nameRect,
      font: .systemFont(ofSize: 22, weight: .heavy),
      color: theme.ink,
      align: .left
    )
    drawText(
      damage,
      in: dmgRect,
      font: .monospacedDigitSystemFont(ofSize: 22, weight: .black),
      color: theme.ink,
      align: .right
    )
    return y + rowH
  }

  private static func fillVerticalGradient(
    in rect: CGRect,
    top: UIColor,
    bottom: UIColor,
    cornerRadius: CGFloat
  ) {
    let context = UIGraphicsGetCurrentContext()
    context?.saveGState()
    UIBezierPath(roundedRect: rect, cornerRadius: cornerRadius).addClip()
    let colors = [top.cgColor, bottom.cgColor] as CFArray
    let space = CGColorSpaceCreateDeviceRGB()
    if let gradient = CGGradient(colorsSpace: space, colors: colors, locations: [0, 1]) {
      context?.drawLinearGradient(
        gradient,
        start: CGPoint(x: rect.midX, y: rect.minY),
        end: CGPoint(x: rect.midX, y: rect.maxY),
        options: []
      )
    }
    context?.restoreGState()
  }

  private static func drawText(
    _ text: String,
    in rect: CGRect,
    font: UIFont,
    color: UIColor,
    align: NSTextAlignment,
    lineBreak: NSLineBreakMode = .byTruncatingTail
  ) {
    let paragraph = NSMutableParagraphStyle()
    paragraph.alignment = align
    paragraph.lineBreakMode = lineBreak
    let attrs: [NSAttributedString.Key: Any] = [
      .font: font,
      .foregroundColor: color,
      .paragraphStyle: paragraph,
    ]
    let inset = rect.insetBy(dx: 2, dy: 2)
    (text as NSString).draw(
      with: inset,
      options: [.usesLineFragmentOrigin, .truncatesLastVisibleLine],
      attributes: attrs,
      context: nil
    )
  }

  private static func aspectFillRect(
    imageSize: CGSize,
    in rect: CGRect,
    scale: CGFloat = 1,
    offsetX: CGFloat = 0,
    offsetY: CGFloat = 0
  ) -> CGRect {
    guard imageSize.width > 0, imageSize.height > 0 else { return rect }
    let baseScale = max(rect.width / imageSize.width, rect.height / imageSize.height)
    let applied = baseScale * max(1, scale)
    let w = imageSize.width * applied
    let h = imageSize.height * applied
    let ox = offsetX * rect.width * 0.5
    let oy = offsetY * rect.height * 0.5
    return CGRect(
      x: rect.midX - w / 2 + ox,
      y: rect.midY - h / 2 + oy,
      width: w,
      height: h
    )
  }
}
