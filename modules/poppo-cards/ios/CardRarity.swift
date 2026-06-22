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

  var fresnelPower: Float {
    switch self {
    case .common: return 2.4
    case .rare: return 3.0
    case .legendary: return 4.2
    }
  }

  var glowEmissive: Float {
    switch self {
    case .common: return 0.0
    case .rare: return 0.08
    case .legendary: return 0.35
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
  var name: String
  var serial: String
  var starCount: Int
  var move1Name: String
  var move1Damage: String
  var move2Name: String
  var move2Damage: String
  var moveDescription: String
  var flavor: String
  var showMove2: Bool
  var showMoveDesc: Bool
}

struct CardFaceTheme {
  let frameTop: UIColor
  let frameBottom: UIColor
  let plateTop: UIColor
  let plateBottom: UIColor
  let paper: UIColor
  let accent: UIColor
  let ink: UIColor
  let muted: UIColor
  let accentSoft: UIColor

  static func theme(for rarity: CardRarity) -> CardFaceTheme {
    switch rarity {
    case .common:
      return CardFaceTheme(
        frameTop: UIColor(red: 0.77, green: 0.72, blue: 0.66, alpha: 1),
        frameBottom: UIColor(red: 0.35, green: 0.32, blue: 0.28, alpha: 1),
        plateTop: UIColor(red: 0.97, green: 0.96, blue: 0.93, alpha: 1),
        plateBottom: UIColor(red: 0.87, green: 0.84, blue: 0.79, alpha: 1),
        paper: UIColor(red: 0.98, green: 0.97, blue: 0.95, alpha: 1),
        accent: UIColor(red: 0.42, green: 0.37, blue: 0.31, alpha: 1),
        ink: UIColor(red: 0.1, green: 0.1, blue: 0.1, alpha: 1),
        muted: UIColor(red: 0.42, green: 0.4, blue: 0.38, alpha: 1),
        accentSoft: UIColor(red: 0.42, green: 0.37, blue: 0.31, alpha: 0.15)
      )
    case .rare:
      return CardFaceTheme(
        frameTop: UIColor(red: 0.66, green: 0.72, blue: 0.78, alpha: 1),
        frameBottom: UIColor(red: 0.23, green: 0.26, blue: 0.35, alpha: 1),
        plateTop: UIColor(red: 0.94, green: 0.96, blue: 0.98, alpha: 1),
        plateBottom: UIColor(red: 0.79, green: 0.85, blue: 0.9, alpha: 1),
        paper: UIColor(red: 0.96, green: 0.98, blue: 0.99, alpha: 1),
        accent: UIColor(red: 0.29, green: 0.38, blue: 0.47, alpha: 1),
        ink: UIColor(red: 0.1, green: 0.1, blue: 0.1, alpha: 1),
        muted: UIColor(red: 0.35, green: 0.42, blue: 0.47, alpha: 1),
        accentSoft: UIColor(red: 0.29, green: 0.38, blue: 0.47, alpha: 0.16)
      )
    case .legendary:
      return CardFaceTheme(
        frameTop: UIColor(red: 0.83, green: 0.69, blue: 0.22, alpha: 1),
        frameBottom: UIColor(red: 0.29, green: 0.22, blue: 0.03, alpha: 1),
        plateTop: UIColor(red: 1.0, green: 0.96, blue: 0.78, alpha: 1),
        plateBottom: UIColor(red: 0.83, green: 0.69, blue: 0.31, alpha: 1),
        paper: UIColor(red: 1.0, green: 0.97, blue: 0.91, alpha: 1),
        accent: UIColor(red: 0.54, green: 0.41, blue: 0.03, alpha: 1),
        ink: UIColor(red: 0.16, green: 0.12, blue: 0.03, alpha: 1),
        muted: UIColor(red: 0.42, green: 0.35, blue: 0.19, alpha: 1),
        accentSoft: UIColor(red: 0.54, green: 0.41, blue: 0.03, alpha: 0.18)
      )
    }
  }
}

enum CardFaceRenderer {
  private static let size = CGSize(width: 800, height: 1120)
  private static let corner: CGFloat = 32

  static func render(_ data: CardFaceData) -> UIImage {
    let theme = CardFaceTheme.theme(for: data.rarity)
    let renderer = UIGraphicsImageRenderer(size: size)
    return renderer.image { ctx in
      let bounds = CGRect(origin: .zero, size: size)
      let path = UIBezierPath(roundedRect: bounds, cornerRadius: corner)
      path.addClip()

      drawFrame(in: bounds, theme: theme, context: ctx.cgContext)
      let inner = bounds.insetBy(dx: 28, dy: 28)
      drawInnerFace(data: data, in: inner, theme: theme, context: ctx.cgContext)
    }
  }

  private static func drawFrame(in rect: CGRect, theme: CardFaceTheme, context: CGContext) {
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
  }

  private static func drawInnerFace(
    data: CardFaceData,
    in rect: CGRect,
    theme: CardFaceTheme,
    context: CGContext
  ) {
    let bezel = rect.insetBy(dx: 8, dy: 8)
    let bezelPath = UIBezierPath(roundedRect: bezel, cornerRadius: 20)
    UIColor.white.setFill()
    bezelPath.fill()

    let face = bezel.insetBy(dx: 10, dy: 10)
    let facePath = UIBezierPath(roundedRect: face, cornerRadius: 16)
    theme.paper.setFill()
    facePath.fill()

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

    let artH = face.height * 0.48
    let artRect = CGRect(x: left, y: cursorY + 10, width: contentW, height: artH)
    drawArt(photo: data.photo, in: artRect, context: context)
    cursorY = artRect.maxY + 12

    let nameH: CGFloat = 62
    let nameRect = CGRect(x: left, y: cursorY, width: contentW, height: nameH)
    drawNameBar(name: data.name, in: nameRect, theme: theme)
    cursorY = nameRect.maxY + 10

    let boxRect = CGRect(x: left, y: cursorY, width: contentW, height: face.maxY - cursorY - pad)
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

  private static func drawArt(photo: UIImage?, in rect: CGRect, context: CGContext) {
    let recess = rect.insetBy(dx: 0, dy: 0)
    UIColor(white: 0.06, alpha: 1).setFill()
    UIBezierPath(roundedRect: recess, cornerRadius: 12).fill()

    let inner = recess.insetBy(dx: 6, dy: 6)
    context.saveGState()
    UIBezierPath(roundedRect: inner, cornerRadius: 8).addClip()
    if let photo {
      let fitted = aspectFillRect(imageSize: photo.size, in: inner)
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
  }

  private static func drawNameBar(name: String, in rect: CGRect, theme: CardFaceTheme) {
    let colors = [theme.plateTop.cgColor, theme.plateBottom.cgColor] as CFArray
    let space = CGColorSpaceCreateDeviceRGB()
    if let gradient = CGGradient(colorsSpace: space, colors: colors, locations: [0, 1]) {
      let path = UIBezierPath(roundedRect: rect, cornerRadius: 8)
      path.addClip()
      UIGraphicsGetCurrentContext()?.drawLinearGradient(
        gradient,
        start: CGPoint(x: rect.minX, y: rect.minY),
        end: CGPoint(x: rect.minX, y: rect.maxY),
        options: []
      )
    }
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
    let boxPath = UIBezierPath(roundedRect: rect, cornerRadius: 8)
    UIColor(white: 1, alpha: 0.55).setFill()
    boxPath.fill()
    theme.muted.withAlphaComponent(0.25).setStroke()
    boxPath.lineWidth = 2
    boxPath.stroke()

    var y = rect.minY + 14
    let left = rect.minX + 14
    let width = rect.width - 28

    y = drawAttackRow(
      name: data.move1Name,
      damage: data.move1Damage,
      left: left,
      y: y,
      width: width,
      theme: theme
    ) + 6

    if data.showMove2, !data.move2Name.isEmpty {
      y = drawAttackRow(
        name: data.move2Name,
        damage: data.move2Damage,
        left: left,
        y: y,
        width: width,
        theme: theme
      ) + 6
    }

    if data.showMoveDesc, !data.moveDescription.isEmpty {
      let descRect = CGRect(x: left, y: y, width: width, height: 44)
      drawText(
        data.moveDescription,
        in: descRect,
        font: .italicSystemFont(ofSize: 18),
        color: theme.muted,
        align: .left,
        lineBreak: .byTruncatingTail
      )
      y = descRect.maxY + 8
    }

    let lineRect = CGRect(x: left, y: y, width: width, height: 2)
    theme.accentSoft.setFill()
    UIRectFill(lineRect)
    y += 10

    let flavorRect = CGRect(x: left, y: y, width: width, height: rect.maxY - y - 10)
    drawText(
      data.flavor,
      in: flavorRect,
      font: .italicSystemFont(ofSize: 17),
      color: theme.muted,
      align: .left,
      lineBreak: .byWordWrapping
    )
  }

  private static func drawAttackRow(
    name: String,
    damage: String,
    left: CGFloat,
    y: CGFloat,
    width: CGFloat,
    theme: CardFaceTheme
  ) -> CGFloat {
    let rowH: CGFloat = 30
    let nameRect = CGRect(x: left, y: y, width: width - 56, height: rowH)
    let dmgRect = CGRect(x: left + width - 52, y: y, width: 52, height: rowH)
    drawText(
      name,
      in: nameRect,
      font: .systemFont(ofSize: 22, weight: .heavy),
      color: theme.accent,
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

  private static func aspectFillRect(imageSize: CGSize, in rect: CGRect) -> CGRect {
    guard imageSize.width > 0, imageSize.height > 0 else { return rect }
    let scale = max(rect.width / imageSize.width, rect.height / imageSize.height)
    let w = imageSize.width * scale
    let h = imageSize.height * scale
    return CGRect(
      x: rect.midX - w / 2,
      y: rect.midY - h / 2,
      width: w,
      height: h
    )
  }
}
