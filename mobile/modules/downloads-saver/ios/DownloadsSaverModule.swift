import ExpoModulesCore

public class DownloadsSaverModule: Module {
  public func definition() -> ModuleDefinition {
    Name("DownloadsSaver")

    AsyncFunction("saveToDownloads") { (sourceUri: String, filename: String, mimeType: String) -> String in
      let fileManager = FileManager.default
      guard let documentsDir = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first else {
        throw Exception(name: "ERR_NO_DOCUMENTS_DIR", description: "Could not find Documents directory")
      }

      let destURL = documentsDir.appendingPathComponent(filename)
      let sourceURL: URL
      if sourceUri.hasPrefix("file://") {
        sourceURL = URL(string: sourceUri)!
      } else {
        sourceURL = URL(fileURLWithPath: sourceUri)
      }

      if fileManager.fileExists(atPath: destURL.path) {
        try fileManager.removeItem(at: destURL)
      }
      try fileManager.copyItem(at: sourceURL, to: destURL)

      return destURL.absoluteString
    }
  }
}
