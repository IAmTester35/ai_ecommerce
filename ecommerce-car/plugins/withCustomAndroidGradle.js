const { withProjectBuildGradle } = require('@expo/config-plugins');

function withCustomAndroidGradle(config) {
  return withProjectBuildGradle(config, (projectBuildGradleConfig) => {
    if (projectBuildGradleConfig.modResults.language === 'groovy') {
      projectBuildGradleConfig.modResults.contents = projectBuildGradleConfig.modResults.contents.replace(
        /classpath\(['"]com\.android\.tools\.build:gradle['"]\)/,
        "classpath('com.android.tools.build:gradle:8.9.0')"
      );
    }
    return projectBuildGradleConfig;
  });
}

module.exports = withCustomAndroidGradle;
