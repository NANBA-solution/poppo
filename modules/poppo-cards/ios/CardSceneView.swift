import SceneKit
import SwiftUI
import UIKit

final class CardSceneController: NSObject, SCNSceneRendererDelegate, UIGestureRecognizerDelegate {
  let scene = SCNScene()
  let scnView: SCNView

  private var cards: [CardNode] = []
  private var selectedCard: CardNode?
  private var panStartPoint: CGPoint = .zero
  private var motionToken: UUID?
  private var currentLayout: CardLayoutKind?
  private let cameraNode = SCNNode()

  init(frame: CGRect) {
    scnView = SCNView(frame: frame)
    super.init()
    configureScene()
    configureGestures()
    bindMotion()
  }

  deinit {
    if let motionToken {
      MotionManager.shared.removeSubscriber(motionToken)
    }
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
          name: "POPPO",
          serial: "No.000",
          starCount: 1,
          move1Name: "—",
          move1Damage: "0",
          move2Name: "",
          move2Damage: "",
          moveDescription: "",
          flavor: "",
          showMove2: false,
          showMoveDesc: false
        )
      let card = CardNode(
        face: face,
        index: index,
        tiltDegrees: config.tilt,
        offsetY: config.offsetY,
        zOffset: config.z
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
    scnView.antialiasingMode = .multisampling4X
    scnView.autoenablesDefaultLighting = false
    scnView.allowsCameraControl = false
    scnView.delegate = self
    scnView.preferredFramesPerSecond = 60

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

  private func bindMotion() {
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
    let point = gesture.location(in: scnView)

    switch gesture.state {
    case .began:
      panStartPoint = point
      selectedCard = card(at: point)
      selectedCard?.liftAnimated()
    case .changed:
      guard let card = selectedCard else { return }
      let dx = Float(point.x - panStartPoint.x)
      let dy = Float(point.y - panStartPoint.y)
      card.applyDragRotation(deltaX: dx * 0.004, deltaY: dy * -0.004)
    case .ended, .cancelled:
      selectedCard?.settleAnimated()
      selectedCard?.resetDragRotation()
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
    return cards.first
  }

  func renderer(_ renderer: SCNSceneRenderer, updateAtTime time: TimeInterval) {
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

  final class Coordinator {
    var controller: CardSceneController?
  }

  func makeCoordinator() -> Coordinator {
    Coordinator()
  }

  func makeUIView(context: Context) -> SCNView {
    let controller = CardSceneController(frame: .zero)
    context.coordinator.controller = controller
    controller.updateLayout(faces: faces, layout: layout)
    return controller.scnView
  }

  func updateUIView(_ uiView: SCNView, context: Context) {
    context.coordinator.controller?.updateLayout(faces: faces, layout: layout)
  }
}

enum CardImageLoader {
  static func load(from uri: String?, completion: @escaping (UIImage?) -> Void) {
    guard let uri, !uri.isEmpty else {
      completion(nil)
      return
    }

    DispatchQueue.global(qos: .userInitiated).async {
      let image = loadSync(from: uri)
      DispatchQueue.main.async { completion(image) }
    }
  }

  private static func loadSync(from uri: String) -> UIImage? {
    if uri.hasPrefix("data:"), let comma = uri.firstIndex(of: ",") {
      let base64 = String(uri[uri.index(after: comma)...])
      if let data = Data(base64Encoded: base64) {
        return UIImage(data: data)
      }
    }

    if let url = URL(string: uri), url.scheme?.lowercased() == "file" {
      return UIImage(contentsOfFile: url.path)
    }

    if let url = URL(string: uri), let scheme = url.scheme?.lowercased(), scheme == "http" || scheme == "https" {
      var result: UIImage?
      let semaphore = DispatchSemaphore(value: 0)
      URLSession.shared.dataTask(with: url) { data, _, _ in
        if let data { result = UIImage(data: data) }
        semaphore.signal()
      }.resume()
      _ = semaphore.wait(timeout: .now() + 8)
      return result
    }

    let trimmed = uri.replacingOccurrences(of: "file://", with: "")
    if let decoded = trimmed.removingPercentEncoding, FileManager.default.fileExists(atPath: decoded) {
      return UIImage(contentsOfFile: decoded)
    }
    if FileManager.default.fileExists(atPath: trimmed) {
      return UIImage(contentsOfFile: trimmed)
    }
    return nil
  }
}
