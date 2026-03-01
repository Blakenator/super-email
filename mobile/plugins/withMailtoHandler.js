const {
  withInfoPlist,
  withAndroidManifest,
} = require("expo/config-plugins");

function withMailtoHandler(config) {
  config = withInfoPlist(config, (config) => {
    const urlTypes = config.modResults.CFBundleURLTypes || [];
    const hasMailto = urlTypes.some((t) =>
      t.CFBundleURLSchemes?.includes("mailto")
    );
    if (!hasMailto) {
      urlTypes.push({
        CFBundleURLSchemes: ["mailto"],
      });
    }
    config.modResults.CFBundleURLTypes = urlTypes;
    return config;
  });

  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const mainActivity =
      manifest.manifest.application?.[0]?.activity?.find(
        (a) => a.$?.["android:name"] === ".MainActivity"
      );
    if (mainActivity) {
      if (!mainActivity["intent-filter"]) {
        mainActivity["intent-filter"] = [];
      }
      mainActivity["intent-filter"].push({
        action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
        category: [
          { $: { "android:name": "android.intent.category.DEFAULT" } },
          { $: { "android:name": "android.intent.category.BROWSABLE" } },
        ],
        data: [{ $: { "android:scheme": "mailto" } }],
      });
    }
    return config;
  });

  return config;
}

module.exports = withMailtoHandler;
