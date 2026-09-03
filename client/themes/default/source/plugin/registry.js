const RbpanPlugins = (function() {
  const plugins = [];

  return {
    register(plugin) {
      if (!plugin.name || !plugin.version) {
        console.warn('[rbpan Plugins] Plugin must have name and version');
        return;
      }
      plugins.push(plugin);
      if (plugin.onInit) {
        plugin.onInit();
      }
    },

    getAll() {
      return plugins;
    },

    get(name) {
      return plugins.find(p => p.name === name);
    },

    trigger(hookName, ...args) {
      plugins.forEach(plugin => {
        if (plugin[hookName] && typeof plugin[hookName] === 'function') {
          try {
            plugin[hookName](...args);
          } catch (e) {
            console.error(`[rbpan Plugins] Error in plugin "${plugin.name}" hook "${hookName}":`, e);
          }
        }
      });
    },

    onThemeChange(theme) {
      this.trigger('onThemeChange', theme);
    },

    onDownloadStart(file) {
      this.trigger('onDownloadStart', file);
    },
    onDownloadProgress(progress) {
      this.trigger('onDownloadProgress', progress);
    },
    onDownloadComplete(file) {
      this.trigger('onDownloadComplete', file);
    },
    onDownloadError(file, error) {
      this.trigger('onDownloadError', file, error);
    },

    onNavigate(path) {
      this.trigger('onNavigate', path);
    },
  };
})();