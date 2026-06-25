import SceneKit
import SwiftUI
import UIKit

enum CardQualityKind: Equatable {
  case full
  case compact
}

final class CardSceneController: NSObject, SCNSceneRendererDelegate, UIGestureRecognizerDelegate {
  let scene = SCNScene()
  let scnView: SCNView

  private var cards: [CardNode] = []
  private var selectedCard: CardNode?
  private var panStartPoint: CGPoint = .zero
  private var motionToken: UUID?
  private var currentLayout: CardLayoutKind?
  private var renderingActive = false
  private var quality: CardQualityKind = .full
  private let cameraNode = SCNNode()
  private var gesturesConfigured = false

  init(frame: CGRect) {
    scnView = SCNView(frame: frame)
    super.init()
    configureScene()
  }

  deinit {
    if let motionToken {
      MotionManager.shared.removeSubscriber(motionToken)
    }
  }

  func setRenderingActive(_ active: Bool) {
    guard renderingActive != active else { return }
    renderingActive = active
    scnView.isPlaying = active
    scnView.rendersContinuously = active
    if active {
      bindMotionIfNeeded()
    } else if let motionToken {
      MotionManager.shared.removeSubscriber(motionToken)
      self.motionToken = nil
      cards.forEach { $0.updateMotion(roll: 0, pitch: 0) }
    }
    if !active {
      scnView.setNeedsDisplay()
    }
  }

  func setQuality(_ next: CardQualityKind) {
    guard quality != next else { return }
    quality = next
    applyQualitySettings()
  }

  private func applyQualitySettings() {
    switch quality {
    case .full:
      scnView.preferredFramesPerSecond = 60
      scnView.antialiasingMode = .multisampling4X
      ensureGestures()
    case .compact:
      scnView.preferredFramesPerSecond = 1
      scnView.antialiasingMode = .none
      removeGestures()
    }
    scnView.isPlaying = renderingActive
    scnView.rendersContinuously = renderingActive
  }

  private func ensureGestures() {
    guard !gesturesConfigured else { return }
    configureGestures()
    gesturesConfigured = true
  }

  private func removeGestures() {
    scnView.gestureRecognizers?.forEach { scnView.removeGestureRecognizer($0) }
    gesturesConfigured = false
  }

  func updateLayout(
    faces: [CardFaceData],
    layout: CardLayoutKind
  ) {
    if currentLayout == layout && cards.count == faces.count {
      for (index, face) in faces.enumerated() where index < cards.count {
        cards[index].setFace(face)
      }
      adjustCamera(for: layout)
      return
    }

    currentLayout = layout

    cards.forEach { $0.removeFromParentNode() }
    cards.removeAll()

    let configs: [(tilt: Float, offsetY: Float, z: Float, x: Float)]
    switch layout {
    case .single:
      configs = [(0, 0, 0, 0)]
    case .trio:
      configs = [
        (-6, 8, -0.35, -2.25),
        (0, 0, 0.15, 0),
        (6, 8, -0.35, 2.25),
      ]
    }

    for (index, config) in configs.enumerated() {
      let face = faces.indices.contains(index)
        ? faces[index]
        : CardFaceData(
          photo: nil,
          rarity: .common,
          rarityLabel: "N",
          typeLong: "POPPO",
          profile: "",
          name: "POPPO",
          serial: "No.000",
          starCount: 1,
          hp: "50",
          retreatCost: "1",
          hpLabel: "HP",
          retreatLabel: "",
          move1Name: "—",
          move1Damage: "0",
          move1Cost: "",
          move2Name: "",
          move2Damage: "",
          move2Cost: "",
          moveDescription: "",
          move2Description: "",
          moveTraitLabel: "特徴",
          imageScale: 1,
          imageOffsetX: 0,
          imageOffsetY: 0,
          flavor: "",
          brandLine: "POPPO",
          showMove2: false,
          showMoveDesc: false,
          showMove2Desc: false,
          showMeta: true,
          showProfile: false,
          showStats: true,
          showCosts: true,
          showBrand: true
        )
      let card = CardNode(
        face: face,
        index: index,
        tiltDegrees: config.tilt,
        offsetY: config.offsetY,
        zOffset: config.z,
        compactRender: quality == .compact
      )
      card.position = SCNVector3(config.x, Float(config.offsetY) * 0.01, config.z)
      card.basePosition = card.position
      scene.rootNode.addChildNode(card)
      cards.append(card)
    }

    adjustCamera(for: layout)
  }

  private func adjustCamera(for layout: CardLayoutKind) {
    let z: Float = layout == .single ? 5.6 : 8.2
    cameraNode.position = SCNVector3(0, 0.05, z)
  }

  private func configureScene() {
    scnView.scene = scene
    scnView.backgroundColor = .clear
    scnView.isOpaque = false
    scnView.autoenablesDefaultLighting = false
    scnView.allowsCameraControl = false
    scnView.delegate = self
    scnView.isPlaying = false
    scnView.rendersContinuously = false

    let cameraNode = self.cameraNode
    let camera = SCNCamera()
    camera.fieldOfView = 40
    camera.zNear = 0.1
    camera.zFar = 100
    cameraNode.camera = camera
    cameraNode.position = SCNVector3(0, 0.05, 8.2)
    scene.rootNode.addChildNode(cameraNode)

    let omni = SCNNode()
    let light = SCNLight()
    light.type = .omni
    light.intensity = 1200
    light.color = UIColor.white
    omni.light = light
    omni.position = SCNVector3(0.4, 1.8, 7.2)
    scene.rootNode.addChildNode(omni)

    let fillNode = SCNNode()
    let fillLight = SCNLight()
    fillLight.type = .ambient
    fillLight.intensity = 260
    fillLight.color = UIColor(white: 0.95, alpha: 1)
    fillNode.light = fillLight
    scene.rootNode.addChildNode(fillNode)
  }

  private func configureGestures() {
    let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
    scnView.addGestureRecognizer(tap)

    let pan = UIPanGestureRecognizer(target: self, action: #selector(handlePan(_:)))
    pan.delegate = self
    scnView.addGestureRecognizer(pan)
  }

  private func bindMotionIfNeeded() {
    guard renderingActive, motionToken == nil else { return }
    motionToken = MotionManager.shared.addSubscriber { [weak self] roll, pitch in
      self?.cards.forEach { $0.updateMotion(roll: roll, pitch: pitch) }
    }
  }

  @objc private func handleTap(_ gesture: UITapGestureRecognizer) {
    let point = gesture.location(in: scnView)
    guard let card = card(at: point) else { return }

    cards.forEach { node in
      if node === card {
        node.liftAnimated()
      } else {
        node.settleAnimated()
      }
    }
    selectedCard = card
  }

  @objc private func handlePan(_ gesture: UIPanGestureRecognizer) {
    switch gesture.state {
    case .began:
      let point = gesture.location(in: scnView)
      panStartPoint = point
      guard let card = card(at: point) else { return }
      selectedCard = card
      cards.forEach { $0.setMotionEnabled($0 !== card) }
      card.beginDrag()
      card.liftAnimated()
    case .changed:
      guard let card = selectedCard else { return }
      let translation = gesture.translation(in: scnView)
      card.applyDragRotation(
        deltaX: Float(translation.x),
        deltaY: Float(translation.y)
      )
    case .ended, .cancelled:
      guard let card = selectedCard else { return }
      card.endDrag()
      cards.forEach { $0.setMotionEnabled(true) }
      selectedCard = nil
    default:
      break
    }
  }

  private func card(at point: CGPoint) -> CardNode? {
    let hits = scnView.hitTest(point, options: [
      SCNHitTestOption.searchMode: SCNHitTestSearchMode.closest.rawValue,
    ])
    for hit in hits {
      var node: SCNNode? = hit.node
      while let current = node {
        if let card = current as? CardNode {
          return card
        }
        node = current.parent
      }
    }
    return nil
  }

  func renderer(_ renderer: SCNSceneRenderer, updateAtTime time: TimeInterval) {
    guard renderingActive else { return }
    for card in cards {
      card.uniforms.lightDirection = SIMD3(0.25, 0.85, 1.0)
    }
  }
}

enum CardLayoutKind: Equatable {
  case single
  case trio
}

struct CardSceneView: UIViewRepresentable {
  var faces: [CardFaceData]
  var layout: CardLayoutKind
  var isActive: Bool
  var quality: CardQualityKind

  final class Coordinator {
    var controller: CardSceneController?
  }

  func makeCoordinator() -> Coordinator {
    Coordinator()
  }

  func makeUIView(context: Context) -> SCNView {
    let controller = CardSceneController(frame: .zero)
    context.coordinator.controller = controller
    controller.setQuality(quality)
    controller.setRenderingActive(isActive)
    controller.updateLayout(faces: faces, layout: layout)
    if !isActive {
      controller.scnView.setNeedsDisplay()
    }
    return controller.scnView
  }

  func updateUIView(_ uiView: SCNView, context: Context) {
    guard let controller = context.coordinator.controller else { return }
    controller.setQuality(quality)
    controller.setRenderingActive(isActive)
    controller.updateLayout(faces: faces, layout: layout)
  }
}

enum CardImageLoader {
  private static let cache = NSCache<NSString, UIImage>()

  static func load(
    from uri: String?,
    maxPixelSize: CGFloat? = nil,
    completion: @escaping (UIImage?) -> Void
  ) {
    guard let uri, !uri.isEmpty else {
      completion(nil)
      return
    }

    let cacheKey = "\(uri)|\(maxPixelSize ?? 0)" as NSString
    if let cached = cache.object(forKey: cacheKey) {
      completion(cached)
      return
    }

    DispatchQueue.global(qos: .userInitiated).async {
      guard let image = loadSync(from: uri) else {
        DispatchQueue.main.async { completion(nil) }
        return
      }
      let output = downscale(image, maxPixelSize: maxPixelSize) ?? image
      cache.setObject(output, forKey: cacheKey)
      DispatchQueue.main.async { completion(output) }
    }
  }

  private static func downscale(_ image: UIImage, maxPixelSize: CGFloat?) -> UIImage? {
    guard let maxPixelSize, maxPixelSize > 0 else { return image }
    let longest = max(image.size.width, image.size.height)
    guard longest > maxPixelSize else { return image }
    let scale = maxPixelSize / longest
    let target = CGSize(width: image.size.width * scale, height: image.size.height * scale)
    let format = UIGraphicsImageRendererFormat.default()
    format.scale = 1
    return UIGraphicsImageRenderer(size: target, format: format).image { _ in
      image.draw(in: CGRect(origin: .zero, size: target))
    }
  }

  private static func loadSync(from uri: String) -> UIImage? {
    if uri.hasPrefix("data:"), let comma = uri.firstIndex(of: ",") {
      let base64 = String(uri[uri.index(after: comma)...])
      if let data = Data(base64Encoded: base64) {
        return UIImage(data: data)
      }
    }

    let candidates = normalizedFilePaths(from: uri)
    for path in candidates {
      if FileManager.default.fileExists(atPath: path),
         let image = UIImage(contentsOfFile: path) {
        return image
      }
    }

    if let url = URL(string: uri),
       let scheme = url.scheme?.lowercased(),
       scheme == "http" || scheme == "https" {
      var result: UIImage?
      let semaphore = DispatchSemaphore(value: 0)
      URLSession.shared.dataTask(with: url) { data, _, _ in
        if let data { result = UIImage(data: data) }
        semaphore.signal()
      }.resume()
      _ = semaphore.wait(timeout: .now() + 8)
      return result
    }

    return nil
  }

  private static func normalizedFilePaths(from uri: String) -> [String] {
    var paths: [String] = []
    func append(_ raw: String) {
      let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
      guard !trimmed.isEmpty else { return }
      if let decoded = trimmed.removingPercentEncoding, !paths.contains(decoded) {
        paths.append(decoded)
      }
      if !paths.contains(trimmed) {
        paths.append(trimmed)
      }
    }

    append(uri)
    append(uri.replacingOccurrences(of: "file://", with: ""))

    if uri.hasPrefix("poppo-scans/") || (!uri.contains("://") && !uri.hasPrefix("/")) {
      if let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
        let relative = uri.hasPrefix("poppo-scans/") ? uri : "poppo-scans/\(uri)"
        append(docs.appendingPathComponent(relative).path)
      }
    }

    if let url = URL(string: uri), url.isFileURL {
      append(url.path)
    } else if uri.hasPrefix("/") {
      append(uri)
      append("file://\(uri)")
    } else if !uri.contains("://") {
      append("file://\(uri)")
    }

    return paths
  }
}
