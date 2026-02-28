function OverwolfPlugin(extraObjectNameInManifest, addNameToObject) {
  var _pluginInstance = null;
  var _extraObjectName = extraObjectNameInManifest;
  var _addNameToObject = addNameToObject;

  this.initialize = function (callback) {
    return _initialize(callback);
  };

  this.initialized = function () {
    return _pluginInstance != null;
  };

  this.get = function () {
    return _pluginInstance;
  };

  function _initialize(callback) {
    var proxy = null;

    try {
      proxy = overwolf.extensions.current.getExtraObject;
    } catch (e) {
      console.error(
        "overwolf.extensions.current.getExtraObject doesn't exist!",
      );
      return callback(false);
    }

    proxy(_extraObjectName, function (result) {
      if (result.status != "success") {
        console.error(
          "failed to create " +
            _extraObjectName +
            " object: " +
            stringify(result),
        );
        return callback(false);
      }

      _pluginInstance = result.object;

      if (_addNameToObject) {
        _pluginInstance._PluginName_ = _extraObjectName;
      }

      return callback(true);
    });
  }
}

function stringify(value) {
  try {
    return JSON.stringify(value);
  } catch (e) {
    return String(value);
  }
}
