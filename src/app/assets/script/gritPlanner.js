AutodeskNamespace('Autodesk.Viewing.Extensions.WebVR')

//Global Vars
class ProjectObject 
{
  constructor(object3d, material)
  {
    this.object3d = object3d;
    this.material = material;
    this.selected = false;
  }
}

var selectedObj;
var hoveredObject;
var lastHovered = null;
var selectedObjs = [];
var projectObjects = [];

var loadedObj = new THREE.Object3D();
var newObjPos = new THREE.Vector3();
var aNewObj = new THREE.Object3D();

const modes = {
  NavigateMode: 'navigateM',
  SelectMode: 'selectM',
  PickerMode: 'pickerM'
}

var curMode = modes.NavigateMode;

Autodesk.Viewing.Extensions.WebVR.StereoRenderContext = function (_vrDisplay, camera, HUD, toolConfig, viewer) 
{
  var L_xButtonPressed = false;
  var L_yButtonPressed = false;
  var L_indexTrigPressed = false;
  var L_handTrigPressed = false;
  var L_clickPressed = false;
  var L_axisLeftPressed = false;
  var L_axisRightPressed = false;
  var L_axisUpPressed = false;
  var L_axisDownPressed = false;

  var gamepads;
  var _vrDisplay; // holds the VR device object info supported by webVR    
  var _context;
  var _renderer;
  var _w, _h;
  var pose;
  var RADIUS = 2.1;

  var leftEyeParams = _vrDisplay.getEyeParameters('left');
  var rightEyeParams = _vrDisplay.getEyeParameters('right');
  var eyeTranslationL = new THREE.Vector3();
  var eyeTranslationR = new THREE.Vector3();
  var cameraL = new THREE.PerspectiveCamera();
  var cameraR = new THREE.PerspectiveCamera();


  var _standing = false;
  var _userHeight = 0.5;
  var _scale = 1.0 * _vrDisplay.modelScaleFactor; // scale factor 10.0 of a 'toy house'.  Make a UI for this.
  var frameData = null;

  var heading = new THREE.Vector3();
  var elevation = -1;
  var rot = 0;


  this.init = function (renderer, width, height) 
  {
    _context = new avp.RenderContext();
    _renderer = renderer;

    var dpr = window.devicePixelRatio * 1.5;
    _w = _vrDisplay.getEyeParameters('left').renderWidth * 2 / dpr;
    _h = _vrDisplay.getEyeParameters('right').renderHeight / dpr;

    this.settings = _context.settings;
    _context.init(_renderer, _w, _h);
    eyeTranslationL.fromArray(leftEyeParams.offset);
    eyeTranslationR.fromArray(rightEyeParams.offset);

    frameData = new VRFrameData();

    viewer.impl.setFPSTargets(20, 30, 60);
    viewer.impl.showTransparencyWhenMoving(true);

    curMode = modes.NavigateMode;

    //console.log(viewer);

    //viewer.impl.scale.invalidated(true, )

    // loader.load('assets/obj/oculus_cv1_controller_left.json', 
    // function(obj){
    //   //var meshMat = new THREE.MeshBasicMaterial({color: 0x7777ff});
    //   //loadedObj = new THREE.Mesh(geometry, meshMat);
    //   //viewer.impl.sceneAfter.add(loadedObj);
    //   console.log('success');
    // });

  }
  this.handleNavModeInput = (button, pose) =>
  {
    switch(button)
    {
      case 'L_x':
        HUD.menu.selectMenuOption();
        break;
      case 'L_y':
        heading.sub(new THREE.Vector3(0,3,0).applyQuaternion(new THREE.Quaternion(pose.orientation[0], pose.orientation[2], pose.orientation[1], pose.orientation[3])));
        break;
      case 'L_it':
        heading.add(new THREE.Vector3(0,3,0).applyQuaternion(new THREE.Quaternion(pose.orientation[0], pose.orientation[2], pose.orientation[1], pose.orientation[3])));
        newObjPos.copy(heading);
        newObjPos.multiply(new THREE.Vector3(0,3,0).applyQuaternion(new THREE.Quaternion(pose.orientation[0], pose.orientation[2], pose.orientation[1], pose.orientation[3])));
        break;
      case 'L_ht':
        curMode = modes.SelectMode;
        break;
      case 'L_ar':
        HUD.menu.changeSelection(1);
        break;
      case 'L_al':
        HUD.menu.changeSelection(-1);
        break;
      case 'L_au':
        elevation += 1;
        break;
      case 'L_ad':
        elevation -= 1;
        break;
      case 'L_c':
        console.log(aNewObj.getWorldPosition());
        
        aNewObj.position.set(2, 2, 2);
        break;
    }
  }
  this.handleSelectModeInput = (button) =>
  {
    switch(button)
    {
      case 'L_x':
        HUD.menu.selectMenuOption();
        break;
      case 'L_y':
        //stuff
        break;
      case 'L_it':
        HUD.cursor.select(HUD);
        break;
      case 'L_ht':
        curMode = modes.NavigateMode;
        break;
      case 'L_ar':
        HUD.menu.changeSelection(1);
        break;
      case 'L_al':
        HUD.menu.changeSelection(-1);
        break;
      case 'L_au':
        //stuff
        break;
      case 'L_ad':
        //stuff
        break;
      case 'L_c':
        //stuff
        break;
    }
  }
  this.handlePickerModeInput = (button) =>
  {
    switch(button)
    {
      case 'L_x':
        //stuff
        break;
      case 'L_y':
        //stuff
        break;
      case 'L_it':
        //stuff
        break;
      case 'L_ht':
        //stuff
        break;
    }
  }
  this.modeWalkthrough = function ( pose ) 
  {
    //////////////////////////////////////////////////////Input managment//////////////////////////////////////////////////
    gamepads = navigator.getGamepads();
    var gamepad = gamepads[0];
    if (gamepad)
    {
      //////////////////////////////////////////////////////Left X button
      if (gamepad.buttons[3].pressed) 
      {
        if(!L_xButtonPressed)
        {
          L_xButtonPressed = true;
          switch(curMode)
          {
            case 'navigateM':
              this.handleNavModeInput('L_x', pose);
              break;
            case 'selectM':
              this.handleSelectModeInput('L_x');
              break;
            case 'pickerM':
              break;
          }
        }
      }
      else
      {
        L_xButtonPressed = false;
      }
      //////////////////////////////////////////////////////Left Y button
      if (gamepad.buttons[4].pressed) 
      {
        if(!L_yButtonPressed)
        {
          L_yButtonPressed = true;
          switch(curMode)
          {
            case 'navigateM':
              this.handleNavModeInput('L_y', pose);
              break;
            case 'selectM':
              this.handleSelectModeInput('L_y');
              break;
            case 'pickerM':
              break;
          }
        }
      }
      else
      {
        L_yButtonPressed = false;
      }
      //////////////////////////////////////////////////////Left index trigger
      if(gamepad.buttons[1].pressed)
      {
        if(!L_indexTrigPressed)
        {
          L_indexTrigPressed = true;
          switch(curMode)
          {
            case 'navigateM':
              this.handleNavModeInput('L_it', pose);
              break;
            case 'selectM':
              this.handleSelectModeInput('L_it');
              break;
            case 'pickerM':
              break;
          }
        }
      }
      else
      {
        L_indexTrigPressed = false;
      }
      //////////////////////////////////////////////////////Left hand trigger
      if(gamepad.buttons[2].pressed)
      {
        if(!L_handTrigPressed)
        {
          L_handTrigPressed = true;
          switch(curMode)
          {
            case 'navigateM':
              this.handleNavModeInput('L_ht', pose);
              break;
            case 'selectM':
              this.handleSelectModeInput('L_ht');
              break;
            case 'pickerM':
              break;
          }
        }
      }
      else
      {
        L_handTrigPressed = false;
      }
      //////////////////////////////////////////////////////Left axis right
      if(gamepad.axes[0] > 0.5)
      {
        if(!L_axisRightPressed)
        {
          L_axisRightPressed = true;
          switch(curMode)
          {
            case 'navigateM':
              this.handleNavModeInput('L_ar', pose);
              break;
            case 'selectM':
              this.handleSelectModeInput('L_ar');
              break;
            case 'pickerM':
              break;
          }
        }
      }
      else
      {
        L_axisRightPressed = false;
      }
      //////////////////////////////////////////////////////Left axis left
      if(gamepad.axes[0] < -0.5)
      {
        if(!L_axisLeftPressed)
        {
          L_axisLeftPressed = true;
          switch(curMode)
          {
            case 'navigateM':
              this.handleNavModeInput('L_al', pose);
              break;
            case 'selectM':
              this.handleSelectModeInput('L_al');
              break;
            case 'pickerM':
              break;
          }
        }
      }
      else
      {
        L_axisLeftPressed = false;
      }
      //////////////////////////////////////////////////////Left axis up
      if(gamepad.axes[1] < -0.5)
      {
        if(!L_axisUpPressed)
        {
          L_axisUpPressed = true;
          switch(curMode)
          {
            case 'navigateM':
              this.handleNavModeInput('L_au', pose);
              break;
            case 'selectM':
              this.handleSelectModeInput('L_au');
              break;
            case 'pickerM':
              break;
          }
        }
      }
      else
      {
        L_axisUpPressed = false;
      }
      //////////////////////////////////////////////////////Left axis down
      if(gamepad.axes[1] > 0.5)
      {
        if(!L_axisDownPressed)
        {
          L_axisDownPressed = true;
          switch(curMode)
          {
            case 'navigateM':
              this.handleNavModeInput('L_ad', pose);
              break;
            case 'selectM':
              this.handleSelectModeInput('L_ad');
              break;
            case 'pickerM':
              break;
          }
        }
      }
      else
      {
        L_axisDownPressed = false;
      }
      //////////////////////////////////////////////////////Left click-in
      if(gamepad.buttons[0].pressed)
      {
        if(!L_clickPressed)
        {
          L_clickPressed = true;
          switch(curMode)
          {
            case 'navigateM':
              this.handleNavModeInput('L_c', pose);
              break;
            case 'selectM':
              this.handleSelectModeInput('L_c');
              break;
            case 'pickerM':
              break;
          }
        }
      }
      else
      {
        L_clickPressed = false;
      }
    }
    //////////////////////////////////////////////////////End of Input managment//////////////////////////////////////////////////


    // adjust for alternate worldup
    if (camera.worldup && camera.worldup.z == 1)
    {
      camera.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2)
      camera.quaternion.multiply(new THREE.Quaternion().fromArray(pose.orientation))

      if (pose.position && pose.position[0] != 0)
      {
        //readjust heading for camera rot
        var newPos = new Float32Array(3);
        newPos[0] = pose.position[0] + heading.x;
        newPos[1] = pose.position[1] + elevation;
        newPos[2] = pose.position[2] - heading.y;

        var theNewPos = new Float32Array(3);
        theNewPos[0] = pose.position[0] + newObjPos.x;
        theNewPos[1] = pose.position[1] + elevation;
        theNewPos[2] = pose.position[2] - newObjPos.y;

        if(loadedObj)
        {
          //console.log('setting loadedobj position: ', theNewPos);

          //loadedObj.position.fromArray(theNewPos).multiplyScalar(_scale);
        }

        camera.position.fromArray(newPos).multiplyScalar(_scale);
      }

      if (pose.position && pose.position[0] != 0){
        camera.position.set(camera.position.x, -camera.position.z, camera.position.y);
      }
    }

    // adjust camera target
    var lookAtDir = new THREE.Vector3(0, 0, -1);
    lookAtDir.applyQuaternion(camera.quaternion);
    camera.target = camera.position.clone().add(lookAtDir.clone().multiplyScalar(10));
  }

  this.updateCamera = function ()
  {
    if (!(_vrDisplay && _vrDisplay._isPresenting)) return

    // set position and orientation
    _vrDisplay.depthNear = camera.near
    _vrDisplay.depthFar = camera.far
    _vrDisplay.getFrameData(frameData)

    pose = frameData.pose
    if (!pose.orientation) return


    this.modeWalkthrough(pose)
    
    camera.updateMatrixWorld()
    
    camera.dirty = true;

    getStereoCamera(camera, frameData, true, false, cameraL)
    getStereoCamera(camera, frameData, false, false, cameraR)

    if (HUD) {
      HUD.camera = camera.clone();
      HUD.camera.position.set(camera.getWorldPosition().x, camera.getWorldPosition().y, camera.getWorldPosition().z);

      getStereoCamera(HUD.camera, frameData, true, true, HUD.cameraL)
      getStereoCamera(HUD.camera, frameData, false, true, HUD.cameraR)

    }

    return {L: cameraL, R: cameraR, C: camera}
  }

  this.beginScene = function (prototypeScene, _camera, customLights, needClear) {
    _context.beginScene(prototypeScene, camera, customLights, needClear)
  }

  this.renderScenePart = function (scene, want_colorTarget, want_saoTarget, want_idTarget, updateLights) {
    var halfW = _w / 2

    _renderer.setViewport(0, 0, halfW, _h)
    _context.setCamera(cameraL)
    _context.renderScenePart(scene, true, false, false, false)

    _renderer.setViewport(halfW, 0, halfW, _h)
    _context.setCamera(cameraR)
    _context.renderScenePart(scene, true, false, false, false)

    if (HUD) 
    {
      _renderer.setViewport(0, 0, halfW, _h)
      _context.setCamera(HUD.cameraL)
      _context.renderScenePart(HUD.scene, true, false, false, false)

      _renderer.setViewport(halfW, 0, halfW, _h)
      _context.setCamera(HUD.cameraR)
      _context.renderScenePart(HUD.scene, true, false, false, false)
    }

    _renderer.setViewport(0, 0, _w, _h)
  }

  this.sceneDirty = function(camera, bbox) {
      _context.sceneDirty(camera, bbox);
  };

  //TODO: get rid of this and combine it with composeFinalFrame
  this.endScene = function() {
      _context.endScene();
  };

  this.clearAllOverlays = function() {};

  this.renderOverlays = function(overlays) {
      // disabled, due to performance hit on mobile
  };

  this.composeFinalFrame = function(skipAOPass, skipPresent) {
    
      _context.composeFinalFrame(true, skipPresent);
      if (_vrDisplay._isPresenting) _vrDisplay.submitFrame();
  };

  this.cleanup = function() {
      _context.cleanup();
  };

  this.setSize = function(w, h, force) {
      _w = w;
      _h = h;
      _context.setSize(_w, _h, force);
  };

  this.getMaxAnisotropy = function() {
      return _context.getMaxAnisotropy();
  };

  this.hasMRT = function() {
      return _context.hasMRT();
  };

  this.initPostPipeline = function(useSAO, useFXAA, useIDBuffer) {
      _context.initPostPipeline(false, false, false);
  };

  this.setClearColors = function(colorTop, colorBot) {
      _context.setClearColors(colorTop, colorBot);
  };

  this.setAOOptions = function(radius, intensity) {
      _context.setAOOptions(radius, intensity);
  };

  this.getAORadius = function() {
      return _context.getAORadius();
  };

  this.getAOIntensity = function() {
      return _context.getAOIntensity();
  };

  this.setTonemapExposureBias = function(bias) {
      _context.setTonemapExposureBias(bias);
  };

  this.getExposureBias = function() {
      return _context.getExposureBias();
  };

  this.setTonemapMethod = function(value) {
      _context.setTonemapMethod(value);
  };

  this.getToneMapMethod = function() {
      return _context.getToneMapMethod();
  };

  this.toggleTwoSided = function(isTwoSided) {
      _context.toggleTwoSided(isTwoSided);
  };

  this.enter2DMode = function(idMaterial) {
      _context.enter2DMode(idMaterial);
  };

  this.getAOEnabled = function() {
      return false
  };

  this.idAtPixel = function(vpx, vpy) {
      // idAtPixel not implemented in stereo context
      return 0;
  };

  this.overlayUpdate = function(highResTimer) {
      _context.overlayUpdate(highResTimer);
  };

  this.rolloverObjectViewport = function(vpx, vpy) {};

  this.screenCapture = function() {
      console.warn("Screen capture not implemented by stereo render context");
      return null;
  };

  this.setUnitScale = function(metersPerUnit) {
      _context.setUnitScale(metersPerUnit);
  };

  this.getUnitScale = function() {
      return _context.getUnitScale();
  };

  function getStereoCamera (camera, frameData, leftEye, fixed, result) 
  {
    // Copy world transform and move camera to origin if it's fixed.
    camera.matrixWorld.decompose(result.position, result.quaternion, result.scale)
    if (fixed) {
      result.position.set(0, 0, 0)
    }

    // Translate eye bye scene scaling.
    result.translateOnAxis(leftEye ? eyeTranslationL : eyeTranslationR, _scale)

    // Copy projection matrix.
    result.projectionMatrix.elements =
      leftEye ? frameData.leftProjectionMatrix : frameData.rightProjectionMatrix
  }
}

'use strict'

AutodeskNamespace('Autodesk.Viewing.Extensions.WebVR')

Autodesk.Viewing.Extensions.WebVR.VRExtension = function (viewer, options) {
  Autodesk.Viewing.Extension.call(this, viewer, options)
  
}

Autodesk.Viewing.Extensions.WebVR.VRExtension.populateDefaultOptions = function (options) {
  // Use double-dashes to prevent flag from being active by default while still surfacing them out (cuz why not)
  options.experimental.push('--webVR_orbitModel');
  options.experimental.push('webVR_cursor');
  options.experimental.push('webVR_menu');
}

Autodesk.Viewing.Extensions.WebVR.VRExtension.prototype = Object.create(Autodesk.Viewing.Extension.prototype)
Autodesk.Viewing.Extensions.WebVR.VRExtension.prototype.constructor = Autodesk.Viewing.Extensions.WebVR.VRExtension

Autodesk.Viewing.Extensions.WebVR.VRExtension.prototype.load = function () {
  var self = this
  var _vrDisplay = null
  avp.injectCSS('extensions/WebVR/WebVR.css')
  
  // check if browser supports webVR1.1 natively, if not, load polyfill
  avp.loadDependency('VRFrameData', 'webvr-polyfill.js', function () {
    navigator.getVRDisplays().then(function (displays) {
      if (displays.length > 0) {
        _vrDisplay = displays[0]
        if (_vrDisplay.capabilities.canPresent) {
          // VR detected, add the 'VR button'
          var viewer = self.viewer
          var toolbar = viewer.getToolbar(true)
          var avu = Autodesk.Viewing.UI

          Autodesk.Viewing.Extensions.WebVR.VRExtension.populateDefaultOptions(self.options)
          // Register tool
          self.tool = new Autodesk.Viewing.Extensions.WebVR.VRTool(viewer, self, _vrDisplay)
          viewer.toolController.registerTool(self.tool)
          self.createUI(toolbar, self.tool)

          // Register listeners
          self.onToolChanged = function (e) {
            var vrToolActive = (e.toolName === 'vr') && e.active
            var state = vrToolActive ? avu.Button.State.ACTIVE : avu.Button.State.INACTIVE
            self.vrToolButton && self.vrToolButton.setState(state)
          }
          viewer.addEventListener(Autodesk.Viewing.TOOL_CHANGE_EVENT, self.onToolChanged)
          return
        }
      }
      avp.logger.warn('Attempted to load WebVR extension, but WebVR is not supported.')
    })
  })

  return true
}

Autodesk.Viewing.Extensions.WebVR.VRExtension.prototype.createUI = function (toolbar, vrTool) {
  var self = this
  var viewer = this.viewer
  var avu = Autodesk.Viewing.UI
  var navTools = toolbar.getControl(Autodesk.Viewing.TOOLBAR.NAVTOOLSID)

  // Create a button for the VR Tool. 
  this.vrToolButton = new avu.Button('toolbar-vrTool')
  this.vrToolButton.setToolTip('Enable VR mode')
  this.vrToolButton.setIcon('adsk-icon-webvr')
  this.vrToolButton.onClick = function (e) {
    var state = self.vrToolButton.getState()
    if (state === avu.Button.State.INACTIVE) {
      viewer.setActiveNavigationTool('vr')
    } else if (state === avu.Button.State.ACTIVE) {

      //Put logic to unselect and unhover all objects on exit of VR
      vrTool.clearHUD();
      viewer.setActiveNavigationTool();
      viewer.setViewFromFile();
    }
  }

  var cameraSubmenuTool = navTools.getControl('toolbar-cameraSubmenuTool')
  if (cameraSubmenuTool) {
    navTools.addControl(this.vrToolButton, {
      index: navTools.indexOf(cameraSubmenuTool.getId())
    })
  } else {
    navTools.addControl(this.vrToolButton)
  }
}

Autodesk.Viewing.Extensions.WebVR.VRExtension.prototype.unload = function () {
  var viewer = this.viewer

  // Remove listeners
  if (this.onToolChanged) {
    viewer.removeEventListener(Autodesk.Viewing.TOOL_CHANGE_EVENT, this.onToolChanged)
    this.onToolChanged = undefined
  }

  // Remove the UI
  var toolbar = viewer.getToolbar(false)
  if (toolbar && this.vrToolButton) {
    toolbar.getControl(Autodesk.Viewing.TOOLBAR.NAVTOOLSID).removeControl(this.vrToolButton.getId())
  }
  this.vrToolButton = null
  
  // Deregister tool
  if (this.tool) {
    viewer.toolController.deregisterTool(this.tool)
    this.tool = null
  }

  return true
}

Autodesk.Viewing.theExtensionManager.registerExtension('Autodesk.Viewing.WebVRWCTRL', Autodesk.Viewing.Extensions.WebVR.VRExtension)

// /////////////////////////////////////////////////////////////////////////////////////////////////////

// /////////////////////////////////////////////////////////////////////////////////////////////////////
Autodesk.Viewing.Extensions.WebVR.Menu = function(_scale, viewer, cursor) {
  var DEFAULT_COLOR = 0xffffff; // default color of menu items
  var YOFFSET = -6;
  var DEPTH = -14;

  var _menu, menuAnchor, menuRotOffset;
  var menuOffset;
  var prevMenuIdx;

  var menuButtons = [];
  var menuSelection = 0;

  var infoCanvas;
  var infoGeom;
  var _info;

  this.init = function(scene) 
  {
    if (_menu) return;

    var imgLoader = THREE.ImageUtils;
    imgLoader.crossOrigin = 'anonymous';
    // var BASE_URL = "res/webvr/";
    var BASE_URL = "assets/img/vr_menu/";
    var icons = [
      "info_button.png",
      "deselect_button.png"
    ];

    // position the menu so it is floating at waist level in front of the user
    _menu = new THREE.Object3D();
    _menu.visible = false;
    menuAnchor = new THREE.Object3D();
    menuOffset = new THREE.Object3D();
    menuOffset.position.set(0, YOFFSET, DEPTH);
    // menuOffset.rotateX(-0.2);

    //INIT ALL OF THE INFO MENU STUFF
    infoCanvas = document.createElement('canvas');
    infoGeom = new THREE.PlaneBufferGeometry(10, 10);
    _info = new THREE.Mesh(infoGeom, new THREE.MeshBasicMaterial({
      color: DEFAULT_COLOR,
      side: THREE.DoubleSide,
      depthTest: false,
      transparent: true,
      opacity: 1
    }));
    _info.position.set(0, 8, 0.01);
    _info.scale.set(0.94, 0.94, 0.1);
    _info.visible = false;
    menuOffset.add(_info);

    // create each menu item
    function createMenuItem(url, xScale, opacity) {
        return new THREE.Mesh(
            new THREE.PlaneBufferGeometry(xScale, 1),
            new THREE.MeshBasicMaterial({
                map: imgLoader.loadTexture( url ),
                color: DEFAULT_COLOR,
                side: THREE.DoubleSide,
                depthTest: false,
                transparent: true,
                opacity: opacity
            })
        );
    }
    // horizontal menu layout
    for (var i = 0; i < icons.length; i++) {
        var item = createMenuItem(BASE_URL + icons[i], 2, 1);
        menuButtons.push(item);
        item.position.set(2 * (i - icons.length / 2), 0, 0.1);
        item.scale.set(0.94, 0.94, 0.1);
        menuOffset.add(item);
    };

    menuButtons[menuSelection].material.color.setHex(0xffff00);

    // add wide transparent black background for menu container
    var menuBg = createMenuItem(BASE_URL + "bg.png", 48, 0.1);
    menuOffset.add(menuBg);
    menuAnchor.add(menuOffset)
    _menu.add(menuAnchor);

    scene.add(_menu);
  }

  this.update = function(camera) {
      // move menu based on camera orientation only
      var cam = camera.quaternion.clone();
      _menu.quaternion.copy(cam);

      // if ((prevMenuIdx >= 0) && (prevMenuIdx < 4)) {
      //     _menu.children[0].children[0].children[prevMenuIdx].material.color.setHex(DEFAULT_COLOR);
      // }
      // prevMenuIdx = Math.floor((menuRotOffset + _menu.quaternion.y + 0.14) * 4.54 * 4);
      // if ((prevMenuIdx >= 0) && (prevMenuIdx < 4)) {
      //     _menu.children[0].children[0].children[prevMenuIdx].material.color.setHex(0xaaaaff);
      // }   
  };

  this.onClick = function() {
      // handle menu click
  }

  this.showMenu = function (){
    this.changeSelection(0);
    _menu.visible = true;
  }

  this.hideMenu = function (){
    _menu.visible = false;
    _info.visible = false;
  }

  this.changeSelection = function(direction){
    if(direction < 0){
      if(menuSelection > 0){
        menuSelection--;
      }
    } else if(direction > 0) {
      if(menuSelection < menuButtons.length - 1){
        menuSelection++;
      }
    } else {
      menuSelection = 0;
    }
    menuButtons.forEach(button => {
      button.material.color.setHex(0xffffff);
    });
    menuButtons[menuSelection].material.color.setHex(0xffff00);
  }

  this.selectMenuOption = function(){
    if(menuSelection == 0)
    {
      this.showInfo();
    }
    if(menuSelection == 1)
    {
      cursor.deselectEverything(this);
    }
  }

  this.showInfo = function()
  {
    if(!_info.visible){
      var infoContext = infoCanvas.getContext('2d');
      infoContext.clearRect(0, 0, infoCanvas.width, infoCanvas.height);
      infoCanvas.width = 1000;
      infoCanvas.height = 1000;
      infoContext.font = 'Bold 300px Arial';

      infoContext.fillStyle = 'white';
      infoContext.fillRect(0, 0, infoCanvas.width, infoCanvas.height);
      infoContext.fillStyle = 'black';
      infoContext.fillText(viewer.getSelection()[0], 0, 500);

      // canvas contents will be used for a texture
      var texture = new THREE.Texture(infoCanvas) ;
      texture.needsUpdate = true;

      var infoMat = new THREE.MeshBasicMaterial({
        map: texture,
        color: DEFAULT_COLOR,
        side: THREE.DoubleSide,
        depthTest: false,
        transparent: true,
        opacity: 1
      });

      _info.material = infoMat;
      _info.visible = true;
    } else {
      _info.visible = false;
    }
  }
};

Autodesk.Viewing.Extensions.WebVR.VRTool = function (viewer, vrExtension, _vrDisplay) {
  var _canvas = viewer.canvas
  var _navapi = viewer.navigation
  var _camera = _navapi.getCamera()
  var HUDCamera;
  var cursor;
  var _stereoRenderContext
  var _HUD;
  var toolConfig = {
    webVR_cursor: avp.isExperimentalFlagEnabled('webVR_cursor', vrExtension.options),
    webVR_menu : avp.isExperimentalFlagEnabled('webVR_menu', vrExtension.options),
    webVR_orbitModel: avp.isExperimentalFlagEnabled('webVR_orbitModel', vrExtension.options)
  }

  // VR state
  var _names = ['vr']
  var _isActive = false
  var _isPresenting = false

  //controllerMesh
  var _messh;
  var loading = true;
  this.activate = function (name) {
    _isActive = true

    // prepare camera for VR mode
    viewer.impl.toggleGroundShadow(false)
    viewer.impl.toggleGroundReflection(false)
    _navapi.toPerspective()
    _navapi.setVerticalFov(75, true) // same as firstPerson FOV
    _navapi.setRequestFitToView(true)

    // Calculate a model scale factor based on the model bounds.
    var boundsSize = viewer.model.getBoundingBox().size()
    _vrDisplay.target = viewer.model.getBoundingBox().center()
    _navapi.setPivotPoint(_vrDisplay.target, true, true)
    _navapi.setView(_camera.position, _vrDisplay.target)
    _navapi.setCameraUpVector(new THREE.Vector3(0, 1, 0))
    _vrDisplay.modelScaleFactor = Math.max(Math.min(Math.min(boundsSize.x, boundsSize.y), boundsSize.z) / 10.0, 0.0001)

    // Request webVR full screen
    _vrDisplay._isPresenting = av.isMobileDevice()
    _vrDisplay.requestPresent([{
      source: _canvas
    }]).then(function () {
      viewer.impl.setLmvDisplay(_vrDisplay)
      _vrDisplay._isPresenting = true
    // viewer.resize(viewer.canvas.clientWidth, viewer.canvas.clientHeight)
    })
    _vrDisplay.resetPose()

    // handle fullscreen on mobile/cardboard differently.  Add 'exit VR' button and hide toolbar
    if (av.isMobileDevice()) {
      var self = this
      showHUD(false)
      viewer.setScreenMode(Autodesk.Viewing.ScreenMode.kFullScreen)
      _canvas.addEventListener('dblclick', function () {
        if (_isActive)
          viewer.setActiveNavigationTool()
      })
    }
    if (toolConfig.webVR_cursor || toolConfig.webVR_menu)
      _HUD = this.initHUD()

    _stereoRenderContext = new Autodesk.Viewing.Extensions.WebVR.StereoRenderContext(_vrDisplay, _camera, _HUD, toolConfig, viewer)
    viewer.impl.setUserRenderContext(_stereoRenderContext)
  }
  this.clearHUD = function ()
  {
    cursor.deselectEverything(_HUD.menu);
  }
  this.initHUD = function () {
    // Create HUD overlay scene and camera
    var scene = new THREE.Scene()
    
    //_camera.add(HUDCamera);
    HUDCamera = _camera.clone()

    if (toolConfig.webVR_cursor) {
      var camYup = (_camera.worldup && _camera.worldup.z == 1)
      cursor = new Autodesk.Viewing.Extensions.WebVR.Cursor(viewer.impl, viewer.autocam, _vrDisplay.modelScaleFactor, camYup, viewer)
      cursor.init(scene);
      _canvas.addEventListener('click', cursor.onClick)
    }

    if (toolConfig.webVR_menu) {
      // Add menu and cursor to the HUD scene
      var menu = new Autodesk.Viewing.Extensions.WebVR.Menu(_vrDisplay.modelScaleFactor, viewer, cursor);
      menu.init(scene);
    }

    var manager = new THREE.LoadingManager();

    return {
      scene: scene,
      camera: HUDCamera,
      cameraL: HUDCamera.clone(),
      cameraR: HUDCamera.clone(),
      menu: menu,
      cursor: cursor,
      IPD: 1.2
    }
  }

  this.update = function (timeStamp, camOffset) {
    if (!_vrDisplay) {
      return true
    }

    if (_isPresenting && !_vrDisplay.isPresenting && _isActive) {
      viewer.setActiveNavigationTool()
    }
    _isPresenting = _vrDisplay.isPresenting

    var cam = _stereoRenderContext.updateCamera()
    if (!_HUD) return true

    if (toolConfig.webVR_cursor)
      _HUD.cursor.update(cam.C, _HUD)
    if (toolConfig.webVR_menu)
      _HUD.menu.update(_HUD.camera);

    return true
  }

  this.deactivate = function (name) {
    if (_vrDisplay) {
      if (_vrDisplay.isPresenting)
        _vrDisplay.exitPresent() // Stops VR mode
      _vrDisplay._isPresenting = false
    }
    _isActive = false
    showHUD(true)

    viewer.impl.setUserRenderContext(null)
    viewer.setScreenMode(Autodesk.Viewing.ScreenMode.kNormal)
    viewer.resize(viewer.canvas.clientWidth, viewer.canvas.clientHeight)
    viewer.autocam.resetHome()
    if (_HUD)
      _canvas.removeEventListener('click', _HUD.cursor.onClick)
  }

  var showHUD = function (isVisible) {
    // Show/hide the toolbar (don't show when in mobile)
    viewer.displayViewCubeUI(isVisible)
    viewer.displayViewCube(isVisible && !av.isMobileDevice())

    var tbar = document.getElementsByClassName('adsk-toolbar')
    if (tbar.length > 0) { // HACK: Assume only 1
      if (tbar[0] !== '')
        tbar[0].style.display = isVisible ? 'block' : 'none'
    }
  }

  this.isActive = function () {
    return _isActive;
  }
  this.getNames = function () {
    return _names;
  }
  this.getName = function () {
    return _names[0];
  }
}

Autodesk.Viewing.Extensions.WebVR.Cursor = function (viewerImpl, autocam, _scale, USE_YUP, viewer) {
  var DEFAULT_RED = 0xaa0022;
  var _cursor;
  var hit;
  var selectedMat = new THREE.MeshPhongMaterial({ color: 0xd1ff});
  var hoveredMat = new THREE.MeshPhongMaterial({ color: 0x93e300});
  var selectArr = [];
  var lastHit;
  

  viewerImpl.matman().addMaterial(
    'ADN-Material-' + 'common color material',
    selectedMat,
    true
  );
  viewerImpl.matman().addMaterial(
    'ADN-Material-' + 'common color material',
    hoveredMat,
    true
  );

  this.init = function (scene) 
  {
    // Create Cursor
    _cursor = new THREE.Object3D()
    _cursor.scale.set(0.25, 0.25, 1)
    _cursor.add(new THREE.Mesh(
      new THREE.RingGeometry(.6, 1, 32, 32),
      new THREE.MeshBasicMaterial({
        color: DEFAULT_RED,
        depthTest: false,
        side: THREE.DoubleSide
      })
    ))
    scene.add(_cursor);

    aNewObj.add(new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({
        color: 0x7777ff,
        depthTest: false,
        side: THREE.DoubleSide
      })
    ))
    //scene.add(aNewObj);
  }

  this.update = function (camera, hud) 
  {
    var dist

    hit = viewerImpl.hitTestViewport(new THREE.Vector3(), false)



    if (hit && curMode == modes.SelectMode)
    {
      dist = hit.intersectPoint.clone().sub(camera.position).length()

      //dbId and FragId signify a unique object, not just dbId because setting materials on the new hit sets them on the fragList
      hoveredObject = projectObjects.find(obj => {
        return obj.object3d.dbId == hit.dbId && obj.object3d.fragId == hit.fragId && obj.object3d.model === hit.model;
      });
      //See if we've never hovered over this object before, if null we have not
      if(!hoveredObject)
      {
        //Add this to our projectObjects array (store the hit obj and the material for easy access)
        //and set hoveredObject to what we just added
        projectObjects.push(new ProjectObject(hit, hit.model.getFragmentList().getMaterial(hit.fragId)));
        hoveredObject = projectObjects[projectObjects.length - 1];
      }
      //See if we hovered over anything previously, if lasthovered null we have do not need to change back any mats
      if(!lastHovered)
      {
        //See if the object we are hovering currently is selected, if not we can set to the hoverMat
        if(!hoveredObject.selected)
        {
          hit.model.getFragmentList().setMaterial(hit.fragId, hoveredMat);
          
          //This is what we hovered last now
          lastHovered = hoveredObject;
        }
      }
      else
      {
        //See if we are hovering over the same thing from last frame, if not we need swap materials back on the lastHovered
        //and set the newly hoveredObj's mat
        if((hit.dbId !== lastHovered.object3d.dbId) && (hit.fragId !== lastHovered.object3d.fragId))
        {
          //See if the object we hoveredLast is selected, if not we can set to the original mat from projectObjects
          if(!lastHovered.selected)
          {
            lastHovered.object3d.model.getFragmentList().setMaterial(lastHovered.object3d.fragId, lastHovered.material);
          }
          //See if the object we are hovering is selected, if not we can set to the hoverMat
          if(!hoveredObject.selected)
          {
            hit.model.getFragmentList().setMaterial(hit.fragId, hoveredMat);
            lastHovered = hoveredObject;
          }
        }
      }
    }
    else 
    {
      dist = (camera.far - camera.near) * 0.5;
    }

    //for setting back to original mat when entering nav mode
    if(curMode != modes.SelectMode && lastHovered)
    {
      if(!lastHovered.selected)
      {
        lastHovered.object3d.model.getFragmentList().setMaterial(lastHovered.object3d.fragId, lastHovered.material);
      }
    }

    var matrix = new THREE.Matrix4()
    matrix.extractRotation(hud.camera.matrixWorld)

    var direction = new THREE.Vector3(0, 0, -1)
    direction = matrix.multiplyVector3(direction)
    direction.multiplyScalar(dist)

    _cursor.position.copy(direction)
    _cursor.lookAt(new THREE.Vector3())
  }

  this.select = function(HUD)
  {
    if(hit)
    {
      //set the selection color, need to use only 1 mode for now
      selectedObj = selectedObjs.find(obj => {
        return obj.object3d.dbId == hit.dbId;
      });
      if(!selectedObj)
      {
        //select by finding the object stored in project objects to set as selected
        selectedObj = projectObjects.find(obj => {
          return obj.object3d.dbId == hit.dbId;
        });
        selectedObj.selected = true;
        selectedObjs.push(selectedObj)

        //store the dbId of the selected object for lookup later
        selectedObjs.forEach(element => {
          selectArr.push(element.object3d.dbId);
        });

        viewer.select(selectArr, 1);
        HUD.menu.showMenu();
      }
      else
      {
        //Keeping this here on purpose/ need to figure out raycast issues in deselecting
        // //deselect
        // console.log('deselect');
        // var index = 0;
        // for( var i = 0; i < selectedObjs.length; i++)
        // {
        //   if(selectedObjs[i].object3d.dbId == hit.dbId)
        //   {
        //     index = i;
        //   }
        // }
        // //hit.model.getFragmentList().setMaterial(hit.fragId, hoveredMat)
        // var afterModel = hit.model.getData();
        // console.log(afterModel);
        // selectedObjs[index].selected = false;
        // selectedObjs.splice(index, 0);
      }
    }
  }
  this.deselectEverything = function(menu)
  {
    projectObjects.forEach(element =>{
      element.object3d.model.getFragmentList().setMaterial(element.object3d.fragId, element.material);
      element.selected = false;
    });
    selectedObjs.length = 0;
    selectArr.length = 0;
    selectedObj = null;
    hoveredObject = null;
    lastHovered = null;
    viewer.clearSelection();
    menu.hideMenu();
  }
}
