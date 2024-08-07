/////////////////////////////////////////////////////////////////
// SelectionWindow Viewer Extension
// By Xiaodong Liang, Autodesk Inc, August 2018
//
/////////////////////////////////////////////////////////////////

//referece:
// https://forge.autodesk.com/blog/custom-window-selection-forge-viewer-simpler-extension

function SelectionWindow(viewer, options) {
  function SelectionWindowTool(viewer, toolName) {
    this.activate = function (name) {};

    this.deactivate = function (name) {};

    this.getNames = function () {
      return [toolName];
    };

    this.getName = function () {
      return toolName;
    };

    this.getCursor = function () {
      return "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAADWSURBVEiJ1ZVNEsIwCEYfTg/UjTPuemcvojfCRRMlNKGdKguZyaLkK4/8EERVybQJQERCUU3C63p+n/Bk9QHDRtbIX2GqKh6woRfxLdL0/M1KzYRaA+7AXDW9wN5fvrXEWud6AOABLD7QwREDgCdw7WV6ZjSAsi0Lzn4JmEcHeHbYWxQXw3FTEWmvaWY1X9Iie4CIKHE1fwfIsnSAZD/X/79FGbdISyzA9QMDG3axTTTVwx3NaNbm5B2dRHY1DWCUyd4qIs0bUB8nuz32/11Cu+KPM7sOXlrOS4sOkzb1AAAAAElFTkSuQmCC), auto";
    };
  }

  Autodesk.Viewing.Extension.call(this, viewer, options);

  // Has the extension already been initialized
  var initialized = false;
  // Is the selection window tool active
  var active = false;
  // selection contains
  var contains = true;
  //Forge Viewer
  var _viewer = this.viewer;
  //bounding box info
  _boundingBoxInfo = [];
  var boundingBoxMap = {};
  //bounding sphere of this model
  var _boundingSphere = null;
  //container DIV of the viewer
  var _container = _viewer.canvas.parentElement;
  var offsetX, offsetY;
  //start point of select window
  var _mouseStart = new THREE.Vector3(0, 0, -10);
  //end point of select window
  var _mouseEnd = new THREE.Vector3(0, 0, -10);
  //is selecting window running
  var _running = false;
  //rectangle lines of select window
  var _lineGeom = null;
  var _rectGroup = null;
  //material for rectangle lines of select window
  var _materialLine = null;

  // Selection window combo button
  var selectionWindowButton;
  // Selection window sub menu button;
  var selectionWindowSubButton;

  // tool
  this.tool;

  // used to store orbit tool button event
  var orbitToolButtonDown;

  //when extension is loaded
  this.load = function () {
    this.tool = new SelectionWindowTool(_viewer, "SelectionWindowTool");
    _viewer.toolController.registerTool(this.tool);
    $(document).bind("keyup", onKeyUp);
    _viewer.impl.invalidate(true);
    return true;
  };

  //when extension is unloaded
  this.unload = function () {
    $(document).unbind("keyup", this.onKeyUp);
    return true;
  };

  //build boundingbox info of each fragments
  this.init = function (model, TranslationService) {
    // store orbit tool button event as new function
    orbitToolButtonDown = _viewer.toolController
      .getTool("orbit")
      .handleButtonDown.bind(_viewer.toolController.getTool("orbit"));

    //get bounding sphere of  whole model
    _boundingSphere = model.getBoundingBox().getBoundingSphere();
    //fragments list array
    var fragList = model.getFragmentList();
    //boxes array
    var boxes = fragList.fragments.boxes;
    //map from frag to dbid
    var fragid2dbid = fragList.fragments.fragId2dbId;

    //build _boundingBoxInfo by the data of Viewer directly
    //might probably be a bit slow with large model..
    var index = 0;
    for (var step = 0; step < fragid2dbid.length; step++) {
      index = step * 6;
      var thisBox = new THREE.Box3(
        new THREE.Vector3(boxes[index], boxes[index + 1], boxes[index + 2]),
        new THREE.Vector3(boxes[index + 3], boxes[index + 4], boxes[index + 5])
      );

      _boundingBoxInfo.push({
        bbox: thisBox,
        dbId: fragid2dbid[step],
        model: model,
      });
    }

    if (!initialized) {
      initialized = true;
      //create a material for the selection rectangle
      _materialLine = new THREE.LineBasicMaterial({
        color: new THREE.Color(0x0000ff),
        linewidth: 1,
        opacity: 0.6,
      });

      // Event listener for planner page (to know if selection window should be enabled)
      window.addEventListener("SELECTION_WINDOW_ENABLE", (evt) => {
        enable(evt.detail);
      });

      setupToolbarButtons(TranslationService);
      enable(false);
    }
  };

  this.addMesh = function (mesh) {
    boundingBoxMap[mesh.model.id + ":" + mesh.dbId] = {
      bbox: mesh.box,
      dbId: mesh.dbId,
      model: mesh.model,
    };
    _boundingBoxInfo.push(boundingBoxMap[mesh.model.id + ":" + mesh.dbId]);
  };

  this.removeMesh = function (mesh) {
    _boundingBoxInfo.splice(
      _boundingBoxInfo.indexOf(boundingBoxMap[mesh.model.id + ":" + mesh.dbId]),
      1
    );
  };

  function setupToolbarButtons(TranslationService) {
    selectionWindowButton = new Autodesk.Viewing.UI.ComboButton(
      "toolbar-selectionWindow"
    );
    selectionWindowButton.onClick = () => {
      toggleSelectionWindow(false);
    };
    selectionWindowButton.setToolTip(
      TranslationService.translate("selection_window_contains")
    );
    selectionWindowButton.icon.className =
      "adsk-button-icon fas fa-compress fa-lg";

    selectionWindowSubButton = new Autodesk.Viewing.UI.Button(
      "toolbar-selectionWindowSub"
    );
    selectionWindowSubButton.onClick = () => {
      swapSelectionWindowTool(true);
    };
    selectionWindowSubButton.setToolTip(
      TranslationService.translate("selection_window_intersects")
    );
    selectionWindowSubButton.icon.className =
      "adsk-button-icon fas fa-expand fa-lg";
    selectionWindowButton.subMenu.addControl(selectionWindowSubButton);

    _viewer.toolbar
      .getControl("settingsTools")
      .addControl(selectionWindowButton);
  }

  function onKeyUp(evt) {
    // Z
    if (evt.keyCode == 90) {
      if (!contains) {
        swapSelectionWindowTool(false);
      } else {
        toggleSelectionWindow(false);
      }
    }

    // X
    if (evt.keyCode == 88) {
      if (contains) {
        swapSelectionWindowTool(false);
      } else {
        toggleSelectionWindow(false);
      }
    }
  }

  enable = function (enabled) {
    if (active) {
      toggleSelectionWindow(false);
    }
    if (enabled) {
      _viewer.toolbar
        .getControl("settingsTools")
        .addControl(selectionWindowButton);
    } else {
      _viewer.toolbar
        .getControl("settingsTools")
        .removeControl(selectionWindowButton);
    }
  };

  function swapSelectionWindowTool(hideFlyOut) {
    contains = !contains;
    if (contains) {
      selectionWindowButton.icon.className =
        "adsk-button-icon fas fa-compress fa-lg";
      selectionWindowSubButton.icon.className =
        "adsk-button-icon fas fa-expand fa-lg";
      selectionWindowButton.setToolTip("Selection Window (Contains)");
      selectionWindowSubButton.setToolTip("Selection Window (Intersects)");
    } else {
      selectionWindowButton.icon.className =
        "adsk-button-icon fas fa-expand fa-lg";
      selectionWindowSubButton.icon.className =
        "adsk-button-icon fas fa-compress fa-lg";
      selectionWindowButton.setToolTip("Selection Window (Intersects)");
      selectionWindowSubButton.setToolTip("Selection Window (Contains)");
    }
    if (hideFlyOut) {
      selectionWindowButton.toggleFlyoutVisible();
    }
    toggleSelectionWindow(true);
  }

  //when key up
  function toggleSelectionWindow(swapping) {
    if (!active) {
      active = true;
      // Hide navigation tools
      _viewer.toolbar.getControl("navTools").container.style = "display: none";

      // make orbit tool button press only fire if not left click
      _viewer.toolController.getTool("orbit").handleButtonDown = function (
        e,
        b
      ) {
        if (b !== 0) {
          orbitToolButtonDown(e, b);
        }
      };

      // activate tool
      _viewer.toolController.activateTool("SelectionWindowTool");

      // highlight toolbar button
      selectionWindowButton.container.className =
        "adsk-control adsk-button active";

      // disable hover highlight
      _viewer.impl.disableHighlight(true);

      //start to monitor mouse down
      _container.addEventListener("mousedown", onMouseDown);
    } else if (!swapping) {
      active = false;
      // Hide navigation tools
      _viewer.toolbar.getControl("navTools").container.style =
        "display: inline-block";

      // reset orbit tool button event
      _viewer.toolController.getTool("orbit").handleButtonDown =
        orbitToolButtonDown;

      // deactivate tool
      _viewer.toolController.deactivateTool("SelectionWindowTool");

      // unhighlight toolbar button
      selectionWindowButton.container.className =
        "adsk-control adsk-button inactive";

      // enable hover highlight
      _viewer.impl.disableHighlight(false);

      //remove mouse events
      _container.removeEventListener("mousedown", onMouseDown);
      $(document).unbind("mouseup", onMouseUp);
      $(document).unbind("mousemove", onMouseMove);

      _running = false;

      //remove the Overlay Scene
      _viewer.impl.removeOverlayScene("selectionWindowOverlay");
    }
  }

  function onMouseDown(evt) {
    if (evt.button !== 0) return;
    _viewer.impl.removeOverlayScene("selectionWindowOverlay");
    //get current camera
    var canvas = _viewer.canvas;
    var canvasWidth = canvas.clientWidth;
    var canvasHeight = canvas.clientHeight;

    var camera = new THREE.OrthographicCamera(
      0,
      canvasWidth,
      0,
      canvasHeight,
      1,
      1000
    );

    //create overlay scene for selection window
    _viewer.impl.createOverlayScene(
      "selectionWindowOverlay",
      _materialLine,
      _materialLine,
      camera
    );

    //get mouse points
    offsetX = _container.getBoundingClientRect().left;
    offsetY = _container.getBoundingClientRect().top;
    _mouseStart.x = evt.clientX - offsetX;
    _mouseStart.y = evt.clientY - offsetY;
    _running = true;

    //build the rectangle lines of select window
    if (_rectGroup === null) {
      _lineGeom = new THREE.Geometry();

      _lineGeom.vertices.push(
        _mouseStart.clone(),
        _mouseStart.clone(),
        _mouseStart.clone(),
        _mouseStart.clone(),
        _mouseStart.clone()
      );

      // add geom to group
      var line_mesh = new THREE.Line(_lineGeom, _materialLine, THREE.LineStrip);

      _rectGroup = new THREE.Group();
      _rectGroup.add(line_mesh);
    } else {
      _lineGeom.vertices[0] = _mouseStart.clone();
      _lineGeom.vertices[1] = _mouseStart.clone();
      _lineGeom.vertices[2] = _mouseStart.clone();
      _lineGeom.vertices[3] = _mouseStart.clone();
      _lineGeom.vertices[4] = _mouseStart.clone();

      _lineGeom.verticesNeedUpdate = true;
    }

    _viewer.impl.addOverlay("selectionWindowOverlay", _rectGroup);
    _viewer.impl.invalidate(false, false, true);

    //start to mornitor the mouse events
    $(document).bind("mouseup", onMouseUp);
    $(document).bind("mousemove", onMouseMove);
  }

  function onMouseMove(evt) {
    //var viewport = _viewer.impl.clientToViewport(evt.clientX, evt.clientY);

    if (_running) {
      //get mouse points
      _mouseEnd.x = Math.min(
        Math.max(evt.clientX - offsetX, 1),
        _container.getBoundingClientRect().width
      );
      _mouseEnd.y = Math.min(
        Math.max(evt.clientY - offsetY, 0),
        _container.getBoundingClientRect().height - 7
      );

      //update rectange lines
      _lineGeom.vertices[1].x = _mouseStart.x;
      _lineGeom.vertices[1].y = _mouseEnd.y;
      _lineGeom.vertices[2] = _mouseEnd.clone();
      _lineGeom.vertices[3].x = _mouseEnd.x;
      _lineGeom.vertices[3].y = _mouseStart.y;
      _lineGeom.vertices[4] = _lineGeom.vertices[0];

      _lineGeom.verticesNeedUpdate = true;
      _viewer.impl.invalidate(false, false, true);
    }
  }

  function onMouseUp(evt) {
    if (evt.button !== 0) return;
    //var viewport = _viewer.impl.clientToViewport(evt.clientX, evt.clientY);
    if (_running) {
      //get mouse points
      _mouseEnd.x = Math.min(
        Math.max(evt.clientX - offsetX, 1),
        _container.getBoundingClientRect().width
      );
      _mouseEnd.y = Math.min(
        Math.max(evt.clientY - offsetY, 0),
        _container.getBoundingClientRect().height - 7
      );

      //remove the overlay of one time rectangle
      _viewer.impl.removeOverlay("selectionWindowOverlay", _rectGroup);
      _running = false;

      //remove mouse event
      $(document).unbind("mouseup", onMouseUp);
      $(document).unbind("mousemove", onMouseMove);

      //get box within the area of select window, or partially intersected.
      if (_mouseStart.x - _mouseEnd.x + _mouseStart.y - _mouseEnd.y !== 0) {
        var ids = compute(
          {
            clientX: _mouseStart.x + offsetX,
            clientY: _mouseStart.y + offsetY,
          },
          { clientX: _mouseEnd.x + offsetX, clientY: _mouseEnd.y + offsetY },
          !contains
        ); // true:  partially intersected.  false: inside the area only

        //highlight the selected objects
        selections = [];
        ids.forEach((object) => {
          index = selections.findIndex((sel) => sel.model === object.model);
          if (index < 0) {
            selections.push({ model: object.model, dbIds: [object.dbId] });
          } else {
            selections[index].dbIds.push(object.dbId);
          }
        });
        selections.forEach((selection) => {
          _viewer.impl.selector.setSelection(selection.dbIds, selection.model);
        });
      }
    }
  }

  //prepare the range of select window and filter out those objects
  function compute(pointer1, pointer2, partialSelect) {
    // build 4 rays to project the 4 corners
    // of the selection window

    var xMin = Math.min(pointer1.clientX, pointer2.clientX);
    var xMax = Math.max(pointer1.clientX, pointer2.clientX);

    var yMin = Math.min(pointer1.clientY, pointer2.clientY);
    var yMax = Math.max(pointer1.clientY, pointer2.clientY);

    var ray1 = pointerToRay({
      clientX: xMin,
      clientY: yMin,
    });

    var ray2 = pointerToRay({
      clientX: xMax,
      clientY: yMin,
    });

    var ray3 = pointerToRay({
      clientX: xMax,
      clientY: yMax,
    });

    var ray4 = pointerToRay({
      clientX: xMin,
      clientY: yMax,
    });

    // first we compute the top of the pyramid
    var top = new THREE.Vector3(0, 0, 0);

    top.add(ray1.origin);
    top.add(ray2.origin);
    top.add(ray3.origin);
    top.add(ray4.origin);

    top.multiplyScalar(0.25);

    // we use the bounding sphere to determine
    // the height of the pyramid
    var { center, radius } = _boundingSphere;

    // compute distance from pyramid top to center
    // of bounding sphere

    var dist = new THREE.Vector3(
      top.x - center.x,
      top.y - center.y,
      top.z - center.z
    );

    // compute height of the pyramid:
    // to make sure we go far enough,
    // we add the radius of the bounding sphere

    var height = radius + dist.length();

    // compute the length of the side edges

    var angle = ray1.direction.angleTo(ray2.direction);

    var length = height / Math.cos(angle * 0.5);

    // compute bottom vertices

    var v1 = new THREE.Vector3(
      ray1.origin.x + ray1.direction.x * length,
      ray1.origin.y + ray1.direction.y * length,
      ray1.origin.z + ray1.direction.z * length
    );

    var v2 = new THREE.Vector3(
      ray2.origin.x + ray2.direction.x * length,
      ray2.origin.y + ray2.direction.y * length,
      ray2.origin.z + ray2.direction.z * length
    );

    var v3 = new THREE.Vector3(
      ray3.origin.x + ray3.direction.x * length,
      ray3.origin.y + ray3.direction.y * length,
      ray3.origin.z + ray3.direction.z * length
    );

    var v4 = new THREE.Vector3(
      ray4.origin.x + ray4.direction.x * length,
      ray4.origin.y + ray4.direction.y * length,
      ray4.origin.z + ray4.direction.z * length
    );

    // create planes

    var plane1 = new THREE.Plane();
    var plane2 = new THREE.Plane();
    var plane3 = new THREE.Plane();
    var plane4 = new THREE.Plane();
    var plane5 = new THREE.Plane();

    plane1.setFromCoplanarPoints(top, v1, v2);
    plane2.setFromCoplanarPoints(top, v2, v3);
    plane3.setFromCoplanarPoints(top, v3, v4);
    plane4.setFromCoplanarPoints(top, v4, v1);
    plane5.setFromCoplanarPoints(v3, v2, v1);

    var planes = [plane1, plane2, plane3, plane4, plane5];

    var vertices = [v1, v2, v3, v4, top];

    // filter all bounding boxes to determine
    // if inside, outside or intersect

    var result = filterBoundingBoxes(planes, vertices, partialSelect);

    // all inside bboxes need to be part of the selection

    var dbIdsInside = result.inside.map((bboxInfo) => {
      return { dbId: bboxInfo.dbId, model: bboxInfo.model };
    });

    // if partialSelect = true
    // we need to return the intersect bboxes

    if (partialSelect) {
      var dbIdsIntersect = result.intersect.map((bboxInfo) => {
        return { dbId: bboxInfo.dbId, model: bboxInfo.model };
      });

      return [...dbIdsInside, ...dbIdsIntersect];
    }

    return dbIdsInside;
  }

  //rays of the corners of select window
  function pointerToRay(pointer) {
    var camera = _viewer.navigation.getCamera();
    var pointerVector = new THREE.Vector3();
    var rayCaster = new THREE.Raycaster();
    var pointerDir = new THREE.Vector3();
    var domElement = _viewer.canvas;

    var rect = domElement.getBoundingClientRect();

    var x = ((pointer.clientX - rect.left) / rect.width) * 2 - 1;
    var y = -((pointer.clientY - rect.top) / rect.height) * 2 + 1;

    if (camera.isPerspective) {
      pointerVector.set(x, y, 0.5);

      pointerVector.unproject(camera);

      rayCaster.set(
        camera.position,
        pointerVector.sub(camera.position).normalize()
      );
    } else {
      pointerVector.set(x, y, -15);

      pointerVector.unproject(camera);

      pointerDir.set(0, 0, -1);

      rayCaster.set(
        pointerVector,
        pointerDir.transformDirection(camera.matrixWorld)
      );
    }

    return rayCaster.ray;
  }

  //filter out those objects in the range of select window
  function filterBoundingBoxes(planes, vertices, partialSelect) {
    var intersect = [];
    var outside = [];
    var inside = [];

    var triangles = [
      { a: vertices[0], b: vertices[1], c: vertices[2] },
      { a: vertices[0], b: vertices[2], c: vertices[3] },
      { a: vertices[1], b: vertices[0], c: vertices[4] },
      { a: vertices[2], b: vertices[1], c: vertices[4] },
      { a: vertices[3], b: vertices[2], c: vertices[4] },
      { a: vertices[0], b: vertices[3], c: vertices[4] },
    ];

    for (let bboxInfo of _boundingBoxInfo) {
      // if bounding box inside, then we can be sure
      // the mesh is inside too

      if (containsBox(planes, bboxInfo.bbox)) {
        inside.push(bboxInfo);
      } else if (partialSelect) {
        //reconstructed by using AABBCollision lib.
        if (boxIntersectVertex(bboxInfo.bbox, triangles))
          intersect.push(bboxInfo);
        else outside.push(bboxInfo);
      } else {
        outside.push(bboxInfo);
      }
    }

    return {
      intersect,
      outside,
      inside,
    };
  }

  //get those boxes which are included in the
  //range of select window
  function containsBox(planes, box) {
    var { min, max } = box;

    var vertices = [
      new THREE.Vector3(min.x, min.y, min.z),
      new THREE.Vector3(min.x, min.y, max.z),
      new THREE.Vector3(min.x, max.y, max.z),
      new THREE.Vector3(max.x, max.y, max.z),
      new THREE.Vector3(max.x, max.y, min.z),
      new THREE.Vector3(max.x, min.y, min.z),
      new THREE.Vector3(min.x, max.y, min.z),
      new THREE.Vector3(max.x, min.y, max.z),
    ];

    for (let vertex of vertices) {
      for (let plane of planes) {
        if (plane.distanceToPoint(vertex) < 0) {
          return false;
        }
      }
    }

    return true;
  }

  //get those boxes which are initersected with the
  //range of select window (triangles)
  function boxIntersectVertex(box, triangles) {
    for (index in triangles) {
      var t = triangles[index];
      if (collision.isIntersectionTriangleAABB(t.a, t.b, t.c, box)) return true;
    }
    return false;
  }
}

SelectionWindow.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
SelectionWindow.prototype.constructor = SelectionWindow;

Autodesk.Viewing.theExtensionManager.registerExtension(
  "SelectionWindow",
  SelectionWindow
);
