import SceneKit
import UIKit

final class CardNode: SCNNode {
  let cardIndex: Int
  let rarity: CardRarity

  private let cardPlane: SCNNode
  private let backPlateNode: SCNNode
  private let edgeNode: SCNNode
  private let shadowNode: SCNNode
  private var holoMaterial: SCNMaterial?
  private let compactRender: Bool

  var basePosition = SCNVector3Zero
  var baseEuler = SCNVector3Zero
  private var baseScale = SCNVector3(1, 1, 1)
  private var isLifted = false

  private var motionEnabled = true
  private var isDragging = false
  private var motionTilt = SCNVector3Zero
  private var dragTilt = SCNVector3Zero
  private var liftTilt = SCNVector3Zero

  var uniforms = CardHoloUniforms(
    lightDirection: SIMD3(0.2, 0.8, 1.0),
    viewAngle: .zero,
    holoIntensity: 0.3,
    hueShift: 0,
    shininess: 0.9,
    fresnelPower: 2.5,
    baseTint: SIMD3(0.42, 0.52, 0.62),
    cornerRadius: 0.12
  )

  init(
    face: CardFaceData,
    index: Int,
    tiltDegrees: Float,
    offsetY: Float,
    zOffset: Float,
    compactRender: Bool = false
  ) {
    self.compactRender = compactRender
    self.cardIndex = index
    self.rarity = face.rarity

    let plane = SCNPlane(
      width: CGFloat(CardDimensions.planeWidth),
      height: CGFloat(CardDimensions.planeHeight)
    )
    let planeCorner =
      CardDimensions.cornerRadius / CardDimensions.height * CGFloat(CardDimensions.planeHeight)
    plane.cornerRadius = planeCorner

    let theme = CardFaceTheme.theme(for: face)
    let frameLabel = face.rarityLabel.uppercased()
    let premiumFrame = frameLabel == "SR" || frameLabel == "UR" || frameLabel == "SECRET" || frameLabel == "R"

    let borderScale: Float = frameLabel == "N"
      ? 1.0 + Float(CardDimensions.whiteBorder / CardDimensions.width)
      : 1.018

    cardPlane = SCNNode(geometry: plane)

    let backPlate = SCNPlane(
      width: CGFloat(CardDimensions.planeWidth) * 1.018,
      height: CGFloat(CardDimensions.planeHeight) * 1.018
    )
    backPlate.cornerRadius = planeCorner + 0.006
    backPlateNode = SCNNode(geometry: backPlate)
    let backMat = SCNMaterial()
    backMat.diffuse.contents = theme.frameBottom
    backMat.lightingModel = .constant
    backMat.isDoubleSided = false
    backPlate.materials = [backMat]
    backPlateNode.position = SCNVector3(0, 0, -0.003)

    let edgePlane = SCNPlane(
      width: CGFloat(CardDimensions.planeWidth) * CGFloat(borderScale),
      height: CGFloat(CardDimensions.planeHeight) * CGFloat(borderScale)
    )
    edgePlane.cornerRadius = planeCorner + 0.012
    edgeNode = SCNNode(geometry: edgePlane)
    let edgeMaterial = SCNMaterial()
    if premiumFrame {
      edgeMaterial.diffuse.contents = theme.frameBottom
      edgeMaterial.emission.contents = UIColor.clear
      edgeMaterial.emission.intensity = 0
    } else {
      edgeMaterial.diffuse.contents = theme.bezel
      edgeMaterial.emission.contents = theme.glow
      edgeMaterial.emission.intensity = face.rarity == .common ? 0 : (face.rarity == .rare ? 0.18 : 0.32)
    }
    edgeMaterial.lightingModel = .constant
    edgeMaterial.isDoubleSided = false
    edgePlane.materials = [edgeMaterial]
    edgeNode.position = SCNVector3(0, 0, -0.001)

    let shadowPlane = SCNPlane(width: 2.1, height: 0.35)
    shadowNode = SCNNode(geometry: shadowPlane)
    let shadowMat = SCNMaterial()
    shadowMat.diffuse.contents = UIColor.black.withAlphaComponent(0.42)
    shadowMat.lightingModel = .constant
    shadowMat.transparency = 0.65
    shadowPlane.materials = [shadowMat]
    shadowNode.eulerAngles = SCNVector3(-Float.pi / 2, 0, 0)
    shadowNode.position = SCNVector3(0, -1.55, 0.02)
    shadowNode.scale = SCNVector3(1.0, 1.0, 1.0)

    super.init()

    name = "card-\(index)"
    addChildNode(shadowNode)
    addChildNode(backPlateNode)
    addChildNode(edgeNode)
    addChildNode(cardPlane)

    let tiltRad = tiltDegrees * Float.pi / 180
    baseEuler = SCNVector3(0, tiltRad, 0)
    basePosition = SCNVector3(0, offsetY * 0.01, zOffset)
    position = basePosition
    syncEuler(animated: false)

    applyMaterial(face: face)
    applyRaritySettings(face: face)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  func setFace(_ face: CardFaceData) {
    applyMaterial(face: face)
    applyRaritySettings(face: face)
    let theme = CardFaceTheme.theme(for: face)
    let frameLabel = face.rarityLabel.uppercased()
    let premiumFrame = frameLabel == "SR" || frameLabel == "UR" || frameLabel == "SECRET" || frameLabel == "R"
    if let edgeMaterial = edgeNode.geometry?.materials.first {
      if premiumFrame {
        edgeMaterial.diffuse.contents = theme.frameBottom
        edgeMaterial.emission.contents = UIColor.clear
        edgeMaterial.emission.intensity = 0
      } else {
        edgeMaterial.diffuse.contents = theme.bezel
        edgeMaterial.emission.contents = theme.glow
        edgeMaterial.emission.intensity = face.rarity == .common ? 0 : (face.rarity == .rare ? 0.18 : 0.32)
      }
    }
    if let backMaterial = backPlateNode.geometry?.materials.first {
      backMaterial.diffuse.contents = theme.frameBottom
    }
  }

  func setMotionEnabled(_ enabled: Bool) {
    motionEnabled = enabled
  }

  func updateMotion(roll: Float, pitch: Float) {
    guard motionEnabled, !isDragging else { return }

    uniforms.viewAngle = SIMD2(roll, pitch)
    uniforms.hueShift = roll * 0.48 + pitch * 0.38
    motionTilt = SCNVector3(pitch * 0.16, roll * 0.16, 0)
    syncEuler(animated: false)
  }

  func beginDrag() {
    isDragging = true
    removeAction(forKey: "lift")
    removeAction(forKey: "dragRelease")
  }

  func applyDragRotation(deltaX: Float, deltaY: Float) {
    let maxTilt: Float = 0.38
    dragTilt = SCNVector3(
      clamp(-deltaY * 0.002, min: -maxTilt, max: maxTilt),
      clamp(deltaX * 0.0025, min: -maxTilt, max: maxTilt),
      0
    )
    syncEuler(animated: false)
  }

  func endDrag() {
    isDragging = false
    dragTilt = SCNVector3Zero
    syncEuler(animated: true, duration: 0.38)
    if isLifted {
      settleAnimated()
    }
  }

  func liftAnimated() {
    guard !isLifted else { return }
    isLifted = true

    SCNTransaction.begin()
    SCNTransaction.animationDuration = 0.26
    SCNTransaction.animationTimingFunction = CAMediaTimingFunction(name: .easeOut)
    position = SCNVector3(basePosition.x, basePosition.y + 0.14, basePosition.z + 0.1)
    scale = SCNVector3(1.04, 1.04, 1.04)
    liftTilt = SCNVector3(-0.12, -0.1, 0)
    syncEuler(animated: false)
    SCNTransaction.commit()
  }

  func settleAnimated() {
    isLifted = false

    SCNTransaction.begin()
    SCNTransaction.animationDuration = 0.36
    SCNTransaction.animationTimingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
    position = basePosition
    scale = baseScale
    liftTilt = SCNVector3Zero
    syncEuler(animated: false)
    SCNTransaction.commit()
  }

  private func syncEuler(animated: Bool, duration: TimeInterval = 0.36) {
    let target = SCNVector3(
      baseEuler.x + liftTilt.x + motionTilt.x + dragTilt.x,
      baseEuler.y + liftTilt.y + motionTilt.y + dragTilt.y,
      baseEuler.z + liftTilt.z + motionTilt.z + dragTilt.z
    )

    if animated {
      SCNTransaction.begin()
      SCNTransaction.animationDuration = duration
      SCNTransaction.animationTimingFunction = CAMediaTimingFunction(name: .easeOut)
      eulerAngles = target
      SCNTransaction.commit()
    } else {
      eulerAngles = target
    }
  }

  private func applyMaterial(face: CardFaceData) {
    let material = SCNMaterial()
    let displayImage = CardFaceRenderer.render(face, compact: compactRender)

    material.diffuse.contents = displayImage
    material.isDoubleSided = false
    material.transparency = 1
    material.transparencyMode = .default

    if compactRender {
      material.lightingModel = .constant
      cardPlane.geometry?.materials = [material]
      holoMaterial = material
      return
    }

    material.specular.contents = UIColor.white
    material.shininess = 0.9
    material.lightingModel = .phong

    if let device = MTLCreateSystemDefaultDevice(),
       let library = try? device.makeDefaultLibrary(bundle: Bundle(for: CardNode.self)) {
      let program = SCNProgram()
      program.library = library
      program.vertexFunctionName = "cardHoloVertex"
      program.fragmentFunctionName = "cardHoloFragment"

      program.handleBinding(ofBufferNamed: "uniforms", frequency: .perFrame) { [weak self] buffer, _, _, _ in
        guard let self else { return }
        var local = self.uniforms
        withUnsafeBytes(of: &local) { raw in
          guard let base = raw.baseAddress else { return }
          buffer.writeBytes(base, count: MemoryLayout<CardHoloUniforms>.stride)
        }
      }

      material.program = program
    }

    cardPlane.geometry?.materials = [material]
    holoMaterial = material
  }

  private func applyRaritySettings(face: CardFaceData) {
    guard !compactRender else { return }
    let theme = CardFaceTheme.theme(for: face)
    uniforms.holoIntensity = theme.holoIntensity
    uniforms.baseTint = theme.holoTint
    uniforms.fresnelPower = rarity.fresnelPower
    uniforms.shininess = 0.9
    holoMaterial?.shininess = 0.9
    uniforms.cornerRadius = Float(CardDimensions.cornerRadius / CardDimensions.height)
  }
}

private func clamp(_ value: Float, min minValue: Float, max maxValue: Float) -> Float {
  Swift.max(minValue, Swift.min(maxValue, value))
}
