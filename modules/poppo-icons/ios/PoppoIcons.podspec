Pod::Spec.new do |s|
  s.name           = 'PoppoIcons'
  s.version        = '1.0.0'
  s.summary        = 'SwiftUI icons for poppo'
  s.description    = 'Native SwiftUI icon views for the poppo app'
  s.author         = 'poppo'
  s.homepage       = 'https://github.com/poppo'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
