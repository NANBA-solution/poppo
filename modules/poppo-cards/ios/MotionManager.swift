import CoreMotion
import Foundation

final class MotionManager {
  static let shared = MotionManager()

  private let motionManager = CMMotionManager()
  private var subscriberCount = 0
  private var listeners: [UUID: (Float, Float) -> Void] = [:]

  private(set) var roll: Float = 0
  private(set) var pitch: Float = 0

  private init() {}

  @discardableResult
  func addSubscriber(_ handler: @escaping (Float, Float) -> Void) -> UUID {
    let id = UUID()
    listeners[id] = handler
    subscriberCount = listeners.count
    startIfNeeded()
    handler(roll, pitch)
    return id
  }

  func removeSubscriber(_ id: UUID) {
    listeners.removeValue(forKey: id)
    subscriberCount = listeners.count
    if subscriberCount == 0 {
      stop()
    }
  }

  func removeAllSubscribers() {
    listeners.removeAll()
    subscriberCount = 0
    stop()
  }

  private func startIfNeeded() {
    guard subscriberCount > 0, !motionManager.isDeviceMotionActive else { return }
    guard motionManager.isDeviceMotionAvailable else { return }

    motionManager.deviceMotionUpdateInterval = 1.0 / 60.0
    motionManager.startDeviceMotionUpdates(using: .xArbitraryCorrectedZVertical, to: .main) { [weak self] motion, _ in
      guard let self, let motion else { return }
      self.roll = Float(motion.attitude.roll)
      self.pitch = Float(motion.attitude.pitch)
      for listener in self.listeners.values {
        listener(self.roll, self.pitch)
      }
    }
  }

  private func stop() {
    motionManager.stopDeviceMotionUpdates()
    roll = 0
    pitch = 0
  }
}
