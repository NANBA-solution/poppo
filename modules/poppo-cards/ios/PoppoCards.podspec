Pod::Spec.new do |s|
  s.name           = 'PoppoCards'
  s.version        = '1.0.0'
  s.summary        = 'SceneKit holographic cards for poppo'
  s.description    = 'Pokemon-style holographic TCG card rendering with SceneKit, Metal, and CoreMotion'
  s.author         = 'poppo'
  s.homepage       = 'https://github.com/poppo'
  s.platforms      = { :ios => '15.5' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.frameworks = 'SceneKit', 'CoreMotion', 'UIKit', 'SwiftUI', 'Metal'

  s.source_files = [
    'CardRarity.swift',
    'CardNode.swift',
    'CardSceneView.swift',
    'ContentView.swift',
    'MotionManager.swift',
    'PoppoCardsModule.swift',
    'PoppoHoloCardView.swift',
    'CardHolo.metal',
  ]
end
