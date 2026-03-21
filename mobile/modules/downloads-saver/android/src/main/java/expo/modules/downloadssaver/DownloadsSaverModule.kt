package expo.modules.downloadssaver

import android.content.ContentValues
import android.os.Environment
import android.provider.MediaStore
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileInputStream
import java.net.URLDecoder

class DownloadsSaverModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DownloadsSaver")

    AsyncFunction("saveToDownloads") { sourceUri: String, filename: String, mimeType: String ->
      val context = appContext.reactContext
        ?: throw Exception("React context is not available")
      val resolver = context.contentResolver

      val values = ContentValues().apply {
        put(MediaStore.Downloads.DISPLAY_NAME, filename)
        put(MediaStore.Downloads.MIME_TYPE, mimeType)
        put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
        put(MediaStore.Downloads.IS_PENDING, 1)
      }

      val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
        ?: throw Exception("Failed to create MediaStore entry")

      val sourcePath = URLDecoder.decode(sourceUri.removePrefix("file://"), "UTF-8")
      resolver.openOutputStream(uri)?.use { output ->
        FileInputStream(File(sourcePath)).use { input ->
          input.copyTo(output)
        }
      } ?: throw Exception("Failed to open output stream")

      values.clear()
      values.put(MediaStore.Downloads.IS_PENDING, 0)
      resolver.update(uri, values, null, null)

      return@AsyncFunction uri.toString()
    }
  }
}
