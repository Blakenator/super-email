Pod::Spec.new do |s|
  s.name           = 'DownloadsSaver'
  s.version        = '1.0.0'
  s.summary        = 'Save files to device Downloads folder'
  s.description    = 'Expo module that saves files to the Downloads folder using MediaStore on Android and Documents on iOS'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
