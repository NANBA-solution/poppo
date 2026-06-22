import SceneKit
import UIKit

final class CardNode: SCNNode {
  let cardIndex: Int
  let rarity: CardRarity

  private let cardPlane: SCNNode
  private let edgeNode: SCNNode
  private let glowNode: SCNNode?
  private let shadowNode: SCNNode
  private var holoMaterial: SCNMaterial?
  private var pulseActionKey = "legendaryPulse"

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
    zOffset: Float
  ) {
    self.cardIndex = index
    self.rarity = face.rarity

    let plane = SCNPlane(
      width: CGFloat(CardDimensions.planeWidth),
      height: CGFloat(CardDimensions.planeHeight)
    )
    plane.cornerRadius = CardDimensions.cornerRadius / CardDimensions.height * CGFloat(CardDimensions.planeHeight)

    cardPlane = SCNNode(geometry: plane)

    let borderScale: Float = 1.0 + Float(CardDimensions.whiteBorder / CardDimensions.width)
    let edgePlane = SCNPlane(
      width: CGFloat(CardDimensions.planeWidth) * CGFloat(borderScale),
      height: CGFloat(CardDimensions.planeHeight) * CGFloat(borderScale)
    )
    edgePlane.cornerRadius = plane.cornerRadius + 0.02
    edgeNode = SCNNode(geometry: edgePlane)
    let edgeMaterial = SCNMaterial()
    edgeMaterial.diffuse.contents = CardFaceTheme.theme(for: face).bezel
    edgeMaterial.emission.contents = CardFaceTheme.theme(for: face).glow
    edgeMaterial.emission.intensity = face.rarity == .common ? 0 : (face.rarity == .rare ? 0.18 : 0.32)
    edgeMaterial.lightingModel = .constant
    edgeMaterial.isDoubleSided = false
    edgePlane.materials = [edgeMaterial]
    edgeNode.position = SCNVector3(0, 0, -0.004)

    if rarity == .legendary {
      let glowPlane = SCNPlane(
        width: CGFloat(CardDimensions.planeWidth) * 1.14,
        height: CGFloat(CardDimensions.planeHeight) * 1.14
      )
      glowPlane.cornerRadius = plane.cornerRadius + 0.06
      glowNode = SCNNode(geometry: glowPlane)
      let glowMat = SCNMaterial()
      let glowColor = CardFaceTheme.theme(for: face).glow
      glowMat.diffuse.contents = glowColor.withAlphaComponent(0.42)
      glowMat.emission.contents = glowColor
      glowMat.emission.intensity = CGFloat(rarity.glowEmissive + 0.15)
      glowMat.lightingModel = .constant
      glowMat.transparency = 0.48
      glowMat.isDoubleSided = true
      glowMat.writesToDepthBuffer = false
      glowPlane.materials = [glowMat]
      glowNode?.position = SCNVector3(0, 0, -0.01)
    } else if rarity == .rare {
      let glowPlane = SCNPlane(
        width: CGFloat(CardDimensions.planeWidth) * 1.08,
        height: CGFloat(CardDimensions.planeHeight) * 1.08
      )
      glowPlane.cornerRadius = plane.cornerRadius + 0.04
      glowNode = SCNNode(geometry: glowPlane)
      let glowMat = SCNMaterial()
      let glowColor = CardFaceTheme.theme(for: face).glow
      glowMat.diffuse.contents = glowColor.withAlphaComponent(0.28)
      glowMat.emission.contents = glowColor
      glowMat.emission.intensity = CGFloat(rarity.glowEmissive)
      glowMat.lightingModel = .constant
      glowMat.transparency = 0.58
      glowMat.isDoubleSided = true
      glowMat.writesToDepthBuffer = false
      glowPlane.materials = [glowMat]
      glowNode?.position = SCNVector3(0, 0, -0.008)
    } else {
      glowNode = nil
    }

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
    if let glowNode {
      addChildNode(glowNode)
    }
    addChildNode(edgeNode)
    addChildNode(cardPlane)

    let tiltRad = tiltDegrees * Float.pi / 180
    baseEuler = SCNVector3(0, tiltRad, 0)
    basePosition = SCNVector3(0, offsetY * 0.01, zOffset)
    position = basePosition
    syncEuler(animated: false)

    applyMaterial(face: face)
    applyRaritySettings(face: face)
    startGlowPulseIfNeeded()
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  func setFace(_ face: CardFaceData) {
    applyMaterial(face: face)
    applyRaritySettings(face: face)
    if let edgeMaterial = edgeNode.geometry?.materials.first {
      edgeMaterial.diffuse.contents = CardFaceTheme.theme(for: face).bezel
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
    let displayImage = CardFaceRenderer.render(face)

    material.diffuse.contents = displayImage
    material.specular.contents = UIColor.white
    material.shininess = 0.9
    material.lightingModel = .phong
    material.isDoubleSided = false

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
    let theme = CardFaceTheme.theme(for: face)
    uniforms.holoIntensity = theme.holoIntensity
    uniforms.baseTint = theme.holoTint
    uniforms.fresnelPower = rarity.fresnelPower
    uniforms.shininess = 0.9
    uniforms.cornerRadius = Float(CardDimensions.cornerRadius / CardDimensions.height)
  }

  private func startGlowPulseIfNeeded() {
    guard let glowNode else { return }
    let peak: CGFloat = rarity == .legendary ? 0.95 : 0.72
    let floor: CGFloat = rarity == .legendary ? 0.42 : 0.28
    let up = SCNAction.fadeOpacity(to: peak, duration: rarity == .legendary ? 0.95 : 1.2)
    let down = SCNAction.fadeOpacity(to: floor, duration: rarity == .legendary ? 0.95 : 1.2)
    let pulse = SCNAction.repeatForever(SCNAction.sequence([up, down]))
    glowNode.runAction(pulse, forKey: pulseActionKey)
  }
}

private func clamp(_ value: Float, min minValue: Float, max maxValue: Float) -> Float {
  Swift.max(minValue, Swift.min(maxValue, value))
}
