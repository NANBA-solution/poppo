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
    edgeMaterial.diffuse.contents = UIColor.white
    edgeMaterial.lightingModel = .constant
    edgeMaterial.isDoubleSided = false
    edgePlane.materials = [edgeMaterial]
    edgeNode.position = SCNVector3(0, 0, -0.004)

    if rarity == .legendary {
      let glowPlane = SCNPlane(
        width: CGFloat(CardDimensions.planeWidth) * 1.08,
        height: CGFloat(CardDimensions.planeHeight) * 1.08
      )
      glowPlane.cornerRadius = plane.cornerRadius + 0.04
      glowNode = SCNNode(geometry: glowPlane)
      let glowMat = SCNMaterial()
      glowMat.diffuse.contents = UIColor(red: 0.55, green: 0.35, blue: 0.95, alpha: 0.35)
      glowMat.emission.contents = UIColor(red: 0.7, green: 0.45, blue: 1.0, alpha: 1.0)
      glowMat.emission.intensity = CGFloat(rarity.glowEmissive)
      glowMat.lightingModel = .constant
      glowMat.transparency = 0.55
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
    eulerAngles = baseEuler

    applyMaterial(face: face)
    applyRaritySettings()
    startLegendaryPulseIfNeeded()
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  func setFace(_ face: CardFaceData) {
    applyMaterial(face: face)
    applyRaritySettings()
  }

  func updateMotion(roll: Float, pitch: Float) {
    uniforms.viewAngle = SIMD2(roll, pitch)
    uniforms.hueShift = roll * 0.35 + pitch * 0.28

    let motionTiltX = pitch * 0.22
    let motionTiltY = roll * 0.22
    eulerAngles = SCNVector3(
      baseEuler.x + motionTiltX,
      baseEuler.y + motionTiltY,
      baseEuler.z
    )
  }

  func liftAnimated() {
    guard !isLifted else { return }
    isLifted = true

    let lift = SCNAction.group([
      SCNAction.move(to: SCNVector3(basePosition.x, basePosition.y + 0.16, basePosition.z + 0.12), duration: 0.28),
      SCNAction.scale(to: 1.05, duration: 0.28),
      SCNAction.rotateTo(x: CGFloat(-8 * Float.pi / 180), y: CGFloat(baseEuler.y - 0.14), z: 0, duration: 0.28),
    ])
    lift.timingMode = SCNActionTimingMode.easeOut
    runAction(lift, forKey: "lift")
  }

  func settleAnimated() {
    isLifted = false
    let settle = SCNAction.group([
      SCNAction.move(to: basePosition, duration: 0.42),
      SCNAction.scale(to: CGFloat(baseScale.x), duration: 0.42),
      SCNAction.rotateTo(x: CGFloat(baseEuler.x), y: CGFloat(baseEuler.y), z: CGFloat(baseEuler.z), duration: 0.42),
    ])
    settle.timingMode = SCNActionTimingMode.easeInEaseOut
    runAction(settle, forKey: "lift")
  }

  func applyDragRotation(deltaX: Float, deltaY: Float) {
    eulerAngles = SCNVector3(
      baseEuler.x + deltaY * 0.45,
      baseEuler.y + deltaX * 0.55,
      baseEuler.z
    )
  }

  func resetDragRotation() {
    let spring = SCNAction.rotateTo(
      x: CGFloat(eulerAngles.x),
      y: CGFloat(baseEuler.y),
      z: CGFloat(baseEuler.z),
      duration: 0.35
    )
    spring.timingMode = SCNActionTimingMode.easeInEaseOut
    runAction(spring)
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

  private func applyRaritySettings() {
    uniforms.holoIntensity = rarity.holoIntensity
    uniforms.baseTint = rarity.baseTint
    uniforms.fresnelPower = rarity.fresnelPower
    uniforms.shininess = 0.9
    uniforms.cornerRadius = Float(CardDimensions.cornerRadius / CardDimensions.height)
  }

  private func startLegendaryPulseIfNeeded() {
    guard rarity == .legendary, let glowNode else { return }
    let up = SCNAction.fadeOpacity(to: 0.85, duration: 1.1)
    let down = SCNAction.fadeOpacity(to: 0.45, duration: 1.1)
    let pulse = SCNAction.repeatForever(SCNAction.sequence([up, down]))
    glowNode.runAction(pulse, forKey: pulseActionKey)
  }

}
