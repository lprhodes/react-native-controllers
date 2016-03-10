var OriginalReact = require('react-native');
var RCCManager = OriginalReact.NativeModules.RCCManager;
var NativeAppEventEmitter = OriginalReact.NativeAppEventEmitter;
var utils = require('./utils');
var resolveAssetSource = require('react-native/Libraries/Image/resolveAssetSource');
var processColor = require('react-native/Libraries/StyleSheet/processColor');

var _controllerRegistry = {};

function _getRandomId() {
  return (Math.random()*1e20).toString(36);
}

function _processProperties(properties) {
  for (var property in properties) {
    if (properties.hasOwnProperty(property)) {
      if (property === 'icon' || property.endsWith('Icon')) {
        properties[property] = resolveAssetSource(properties[property]);
      }
      if (property === 'color' || property.endsWith('Color')) {
        properties[property] = processColor(properties[property]);
      }
    }
  }
}

var Controllers = {

  createClass: function (app) {
    return app;
  },

  hijackReact: function () {
    return {
      createElement: function(type, props) {
        var children = Array.prototype.slice.call(arguments, 2);
        var flatChildren = utils.flattenDeep(children);
        _processProperties(props);
        if (props['style']) {
          _processProperties(props['style']);
        }
        return {
          'type': type.name,
          'props': props,
          'children': flatChildren
        };
      },

      ControllerRegistry: Controllers.ControllerRegistry,
      TabBarControllerIOS: {name: 'TabBarControllerIOS', Item: {name: 'TabBarControllerIOS.Item'}},
      NavigationControllerIOS: {name: 'NavigationControllerIOS'},
      ViewControllerIOS: {name: 'ViewControllerIOS'},
      DrawerControllerIOS: {name: 'DrawerControllerIOS'},
    };
  },

  ControllerRegistry: {
    registerController: function (appKey, getControllerFunc) {
      _controllerRegistry[appKey] = getControllerFunc();
    },
    setRootController: function (appKey, animationType = 'none') {
      var controller = _controllerRegistry[appKey];
      if (controller === undefined) return;
      var layout = controller.render();
      RCCManager.setRootController(layout, animationType);
    }
  },

  NavigationControllerIOS: function (id) {
    return {
      push: function (params) {
        if (params['style']) {
          _processProperties(params['style']);
        }
        return RCCManager.NavigationControllerIOS(id, "push", params);
      },
      pop: function (params) {
        return RCCManager.NavigationControllerIOS(id, "pop", params);
      },
      setLeftButton: function (params) {
        if (typeof params.onPress === "function") {
          var onPressId = _getRandomId();
          var onPressFunc = params.onPress;
          params.onPress = onPressId;
          // where do we unsubscribe?
          NativeAppEventEmitter.addListener(onPressId, (event) => onPressFunc(event));
        }
        return RCCManager.NavigationControllerIOS(id, "setLeftButton", params);
      }
    };
  },

  DrawerControllerIOS: function (id) {
    return {
      open: function (params) {
        return RCCManager.DrawerControllerIOS(id, "open", params);
      },
      close: function (params) {
        return RCCManager.DrawerControllerIOS(id, "close", params);
      },
      toggle: function (params) {
        return RCCManager.DrawerControllerIOS(id, "toggle", params);
      },
      setStyle: function (params) {
        return RCCManager.DrawerControllerIOS(id, "setStyle", params);
      }
    };
  },

  TabBarControllerIOS: function (id) {
    return {
      setHidden: function (params) {
        return RCCManager.TabBarControllerIOS(id, "setTabBarHidden", params);
      }
    };
  },

  Modal: {
    showLightBox: function(params) {
      if (params.style.backgroundColor !== undefined) {
        params.style.backgroundColor = processColor(params.style.backgroundColor);
      }
      RCCManager.modalShowLightBox(params);
    },
    dismissLightBox: function() {
      RCCManager.modalDismissLightBox();
    },
    showController: function(appKey, animationType = 'slide-down') {
      var controller = _controllerRegistry[appKey];
      if (controller === undefined) return;
      var layout = controller.render();
      RCCManager.showController(layout, animationType);
    },
    dismissController: function(animationType = 'slide-down') {
      RCCManager.dismissController(animationType);
    }
  },
};

module.exports = Controllers;
