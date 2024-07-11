 (function(){
  
    'use strict';

  
    function GritCutToolExtension(viewer, options) {

        window.addEventListener('ROUTE_CHANGE', (e) => {
            disableCut(true);
            if (e.detail.endsWith('models') || e.detail.endsWith('master-schedule') || e.detail.endsWith('planner')){
                if (viewer.toolbar) viewer.toolbar.getControl('navTools').addControl(cutButton)
            } else {
                if (viewer.toolbar) viewer.toolbar.getControl('navTools').removeControl(cutButton)
            }
        });

        Autodesk.Viewing.Extension.call(this, viewer, options);

        var cutButton;
        var saveButton;
        var undoButton;
        var addButton;
        var closeButton;
        var cutHit = null;
        var cutGeometry = null;
        var cutMeshes = [];
        var cutObjects = [];
        var cutting = false;
        var planes = [];
        var cutLine = null;
        var getOriginalPlanes;
        var getOriginalHit;

        var removedButtons = {};
        var removedChildren = [];
        var modelHiddenNodes = [];

        function side(vertex, plane) {
            const inner = vertex[0] * plane[0] + vertex[1] * plane[1] + vertex[2] * plane[2];
            return inner < plane[3] ? -1 : inner > plane[3] ? 1 : 0;
        }
        
        function intersect(inside, outside, plane) {
            const dir = [outside[0] - inside[0], outside[1] - inside[1], outside[2] - inside[2]];
            const inner = (dir[0] * plane[0] + dir[1] * plane[1] + dir[2] * plane[2]);
            const best = Math.abs(inner) < 0.0001 ? 1 : (plane[3] - inside[0] * plane[0] - inside[1] * plane[1] - inside[2] * plane[2]) / (dir[0] * plane[0] + dir[1] * plane[1] + dir[2] * plane[2]);
            return [inside[0] + best * dir[0], inside[1] + best * dir[1], inside[2] + best * dir[2]];
        }
        
        function SplitMesh(mesh, plane) {
            const meshes = [];
            for (let i = 0; i < 2; i++) {
                const newMesh = {
                    vertices: [],
                    triangles: [],
                    copies: [],
                    material: mesh.material,
                    fragments: []
                };
                meshes.push(newMesh);
        
                let vertexIndex = 0;
                for (let l = 0; l < mesh.fragments.length; l++) {
                    const insideVertices = [];
                    const outsideVertices = [];
                    const insideMap = {};
                    const outsideMap = {};
                    const triangles = [];
                    for (let j = vertexIndex; j < vertexIndex + mesh.fragments[l] * 3; j += 3) {
                        let flag = 1;
                        const vertex = [mesh.vertices[j], mesh.vertices[j + 1], mesh.vertices[j + 2]];
                        let inside = true;
                        const compare = side(vertex, plane);
                        if ((i & flag) === 0 && compare < 0 || (i & flag) > 0 && compare > 0) {
                            inside = false;
                        }
                        if (inside) {
                            insideMap[j / 3] = insideVertices.length;
                            insideVertices.push(vertex);
                        } else {
                            outsideMap[j / 3] = outsideVertices.length;
                            outsideVertices.push(vertex);
                        }
                    }
                    for (let j = 0; j < mesh.copies.length; j++) {
                        const ci = mesh.copies[j];
                        if (ci >= vertexIndex / 3 && ci < vertexIndex / 3 + mesh.fragments[l]) {
                            if (insideMap[ci] != null) {
                                insideMap[mesh.vertices.length / 3 + j] = insideVertices.length;
                                insideVertices.push(insideVertices[insideMap[ci]]);
                            } else {
                                outsideMap[mesh.vertices.length / 3 + j] = outsideVertices.length;
                                outsideVertices.push(outsideVertices[outsideMap[ci]]);
                            }
                        }
                    }
                    vertexIndex += mesh.fragments[l] * 3;
                    if (insideVertices.length === 0) {
                        newMesh.fragments.push(insideVertices.length);
                        continue;
                    }
                    for (let j = 0; j < mesh.triangles.length; j += 3) {
                        const index = [mesh.triangles[j], mesh.triangles[j + 1], mesh.triangles[j + 2]];
                        const in1 = insideMap[index[0]] != null ? 1 : 0;
                        const in2 = insideMap[index[1]] != null ? 1 : 0;
                        const in3 = insideMap[index[2]] != null ? 1 : 0;
                        const inCount = in1 + in2 + in3;
        
                        if (inCount === 0) continue;
        
                        if (inCount === 3) {
                            for (let k = 0; k < 3; k++) {
                                triangles.push(insideMap[index[k]]);
                            }
                        } else if (inCount === 2) {
                            const k = in1 ? in2 ? 2 : 1 : 0;
                            const outside = outsideVertices[outsideMap[index[k]]];
                            const int1 = intersect(insideVertices[insideMap[index[(k + 1) % 3]]], outside, plane);
                            const int2 = intersect(insideVertices[insideMap[index[(k + 2) % 3]]], outside, plane);
                            triangles.push(insideVertices.length);
                            triangles.push(insideMap[index[(k + 1) % 3]]);
                            triangles.push(insideMap[index[(k + 2) % 3]]);
                            triangles.push(insideVertices.length);
                            triangles.push(insideMap[index[(k + 2) % 3]]);
                            triangles.push(insideVertices.length + 1);
                            insideVertices.push(int1);
                            insideVertices.push(int2);
                        } else if (inCount === 1) {
                            const k = in1 ? 0 : in2 ? 1 : 2;
                            const inside = insideVertices[insideMap[index[k]]];
                            const int1 = intersect(inside, outsideVertices[outsideMap[index[(k + 1) % 3]]], plane);
                            const int2 = intersect(inside, outsideVertices[outsideMap[index[(k + 2) % 3]]], plane);
                            triangles.push(insideMap[index[k]]);
                            triangles.push(insideVertices.length);
                            insideVertices.push(int1);
                            triangles.push(insideVertices.length);
                            insideVertices.push(int2);
                        }
                    }
        
                    newMesh.fragments.push(insideVertices.length);
                    triangles.forEach(t => newMesh.triangles.push(t + newMesh.vertices.length / 3));
                    insideVertices.forEach(v => {
                        newMesh.vertices.push(v[0]);
                        newMesh.vertices.push(v[1]);
                        newMesh.vertices.push(v[2]);
                    });
                }
            }
            return meshes;
        }

        var getHit = function(event) {
            var result = getOriginalHit(event);
            if (result && result.dbId >= 1e6) {
                var modelId = Math.floor(result.fragId / 1e9);
                result.originalDbId = result.fragId - result.dbId - modelId * 1e9;
                result.model = models.find(m => m.id === modelId);
            } else if (result) {
                result.originalDbId = result.dbId;
            }
            return result;
        };

        var getGeometry = function(dbId, model) {
            var svf = model.getData();

            var frags = model.getFragmentList();
            var geoms = model.getGeometryList();

            
            var combined = {
                vertices: [],
                triangles: [],
                copies: [],
                material: [],
                fragments: []
            };

            svf.fragments.fragId2dbId.forEach((id, fragId) => {
                if (dbId == id) {
                    var geom = geoms.getGeometry(frags.getGeometryId(fragId));
                    var mat = svf.materials.materials[svf.fragments.materials[fragId]].materials[0].properties.colors.generic_diffuse;
                    var f = getFragment(geom, mat ? mat.values[0] : null, [0, 0, 0], false, svf.fragments.transforms.slice(fragId * 12, fragId * 12 + 12), 1);
                    
                    var vertCount = combined.vertices.length / 3;
                    combined.vertices = combined.vertices.concat(f.vertices);
                    f.triangles.forEach(i => {
                        combined.triangles.push(vertCount + i);
                    });
                    combined.material = combined.material.concat(f.material);
                    combined.fragments.push(f.vertices.length / 3);
                }
            });

            return combined;
        }

        var getFragment = function(geometry, mat, offset, reorient, transform, scale) {
            const vertices = [];
            const uvs = [];
            const triangles = [];
            const lines = [];
            const positionOffset = geometry.attributes.position.itemOffset;
            const uvOffset = geometry.attributes.uv ? geometry.attributes.uv.itemOffset : null;
            for (let i = 0; i < geometry.vb.length; i += geometry.vbstride) {
                const p = [
                    geometry.vb[i + positionOffset],
                    geometry.vb[i + positionOffset + 1],
                    geometry.vb[i + positionOffset + 2]
                ];
    
                const tp = // [p[0] * scale, p[1] * scale, p[2] * scale];
                [
                    (p[0] * transform[0] + p[1] * transform[3] + p[2] * transform[6] + transform[9] + offset[0]) * scale,
                    (p[0] * transform[1] + p[1] * transform[4] + p[2] * transform[7] + transform[10] + offset[1]) * scale,
                    (p[0] * transform[2] + p[1] * transform[5] + p[2] * transform[8] + transform[11] + offset[2]) * scale
                ];
    
                vertices.push(reorient ? -tp[0] : tp[0]);
                vertices.push(reorient ? tp[2] : tp[1]);
                vertices.push(reorient ? -tp[1] : tp[2]);
    
                if (uvOffset != null) {
                    uvs.push(geometry.vb[i + uvOffset] || 0);
                    uvs.push(geometry.vb[i + uvOffset + 1] || 0);
                } else {
                    uvs.push(0);
                    uvs.push(0);
                }
            }
            if (geometry.isLines) {
                geometry.ib.forEach(i => {
                    lines.push(i);
                });
            } else {
                geometry.ib.forEach(i => {
                    triangles.push(i);
                });
                if (reorient) {
                    triangles.reverse();
                }
            }
    
            return {
                vertices: vertices,
                triangles: triangles,
                copies: [],
                material: mat ? [mat.r, mat.g, mat.b, mat.a] : [1, 1, 1, 1]
            };
        }

        var asRgb = function(h, s, l) {
            const hp = h / 60;
            const c = (1 - Math.abs(2 * l - 1)) * s;
            const x = c * (1 - Math.abs((hp % 2) - 1));
            const r = 0 <= hp && hp < 1 || 5 <= hp && hp < 6 ? c :
            1 <= hp && hp < 2 || 4 <= hp && hp < 5 ? x : 0;
            const g = 1 <= hp && hp < 2 || 2 <= hp && hp < 3 ? c :
            0 <= hp && hp < 1 || 3 <= hp && hp < 4 ? x : 0;
            const b = 3 <= hp && hp < 4 || 4 <= hp && hp < 5 ? c :
            2 <= hp && hp < 3 || 5 <= hp && hp < 6 ? x : 0;
            const m = l - 0.5 * c;
            return {r: r + m, g: g + m, b: b + m};
        }

        var getColor = function(i, m) {
            const h = (i / m * 360 + 270) % 360;
            const s = 1;
            const l = ((i + 1) % 2) * 0.33 + 0.33;
            return asRgb(h, s, l);
        }

        var getPlane = function() {
            var camera = viewer.getCamera();

            var position = camera.position.clone();
            var vector = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

            return [vector.x, vector.y, vector.z, vector.x * position.x + vector.y * position.y + vector.z * position.z];
        }

        var previewCut = function(save) {
            cutObjects.forEach(o => viewer.impl.sceneAfter.remove(o));
            cutObjects = [];

            cutMeshes = [cutGeometry];
            var plane = getPlane();
            if (save) {
                planes.push(plane);
            } else {
                planes[planes.length - 1] = plane;
            }
            planes.forEach(p => {
                var newMeshes = [];
                cutMeshes.forEach(m => {
                    SplitMesh(m, p).forEach(nm => newMeshes.push(nm));
                });
                cutMeshes = newMeshes;
            });
            cutMeshes.forEach(data => {
                const geometry = new THREE.BufferGeometry();
                const vertices = [];
                for (let i = 0; i < data.triangles.length; i += 3) {
                    const t1 = data.triangles[i];
                    const t2 = data.triangles[i + 1];
                    const t3 = data.triangles[i + 2];
                    const v1 = t1 * 3 >= data.vertices.length ? data.copies[t1 - data.vertices.length / 3] * 3 : t1 * 3;
                    const v2 = t2 * 3 >= data.vertices.length ? data.copies[t2 - data.vertices.length / 3] * 3 : t2 * 3;
                    const v3 = t3 * 3 >= data.vertices.length ? data.copies[t3 - data.vertices.length / 3] * 3 : t3 * 3;
                    vertices.push(data.vertices[v1]);
                    vertices.push(data.vertices[v1 + 1]);
                    vertices.push(data.vertices[v1 + 2]);
                    vertices.push(data.vertices[v2]);
                    vertices.push(data.vertices[v2 + 1]);
                    vertices.push(data.vertices[v2 + 2]);
                    vertices.push(data.vertices[v3]);
                    vertices.push(data.vertices[v3 + 1]);
                    vertices.push(data.vertices[v3 + 2]);
                }
                geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(vertices), 3 ) );
                geometry.computeVertexNormals();
                geometry.computeBoundingBox();
                geometry.computeBoundingSphere();
                const color = getColor(cutObjects.length, cutMeshes.length);
                const colorHex = Math.floor(color.r * 255) * 0x10000 + Math.floor(color.g * 255) * 0x100 + Math.floor(color.b * 255);
                const material = new THREE.MeshPhongMaterial( {color: colorHex} );
                viewer.impl.matman().addMaterial('SplitMesh-' + cutObjects.length, material, true);
                const mesh = new THREE.Mesh( geometry, material );
                mesh.dbId = cutHit.originalDbId;
                mesh.model = cutHit.model;
                mesh.fragId = cutHit.fragId;
                cutObjects.push(mesh);
                viewer.impl.sceneAfter.add( mesh );
            });
            viewer.impl.invalidate(true);
        };

        var saveCut = function() {
            var plane = planes[planes.length - 1];
            if (planes.length > 1) {
                var last = planes[planes.length - 2];
                if (last[0] === plane[0] && last[1] === plane[1] && last[2] === plane[2] && last[3] === plane[3]) {
                    planes.pop();
                }
            }
            var detail = {meshes: cutMeshes, originalObjectId: cutHit.originalDbId, objectId: cutHit.dbId, modelId: cutHit.model.id, planes: planes};
            disableCut(true);
            window.dispatchEvent(new CustomEvent('VIEWER_CUT', {detail: detail}));
        };

        var disableCut = function(force) {
            if (!viewer.container) return;

            if (planes.length > 0 && !force) {
                planes.pop();
                previewCut();
            } else {
                cutButton.setState(1);
                if (cutHit) {
                    viewer.toolbar.getControl('navTools').removeControl(saveButton);
                    viewer.toolbar.getControl('navTools').removeControl(addButton);
                    viewer.toolbar.getControl('navTools').removeControl(closeButton);
                    viewer.toolbar.getControl('navTools').removeControl(undoButton);
                    cutObjects.forEach(o => viewer.impl.sceneAfter.remove(o));
                
                    removedChildren.forEach(c => viewer.impl.scene.add(c));
                    removedChildren = [];
            
                    if (cutLine) {
                        viewer.impl.removeOverlay('cutOverlay', cutLine);
                        viewer.impl.removeOverlayScene('cutOverlay');
                    }
                    cutLine = null;

                    models.forEach(function(model) {
                        const array = modelHiddenNodes[model.id];
                        if (array) {
                            viewer.impl.visibilityManager.show(array, model);
                        }
                    });
                    viewer.impl.invalidate(true);
                    modelHiddenNodes = {};
                    cutObjects = [];
                    planes = [];
                    cutHit = null;
                    cutGeometry = null;
                } else {
                    viewer.toolbar.getControl('navTools').removeControl(cutButton);
                }
                viewer.toolController.deactivateTool(toolName);
                cutting = false;
                
                viewer.toolbar.getControl('navTools').removeControl(cutButton);
                Object.keys(removedButtons).forEach(key => {
                    var toolbar = viewer.toolbar.getControl(key);
                    removedButtons[key].forEach(button => {
                        toolbar.addControl(button);
                    });
                });
                removedButtons = {};

                window.dispatchEvent(new CustomEvent('VIEWER_CUT', {detail: {disabled: true}}));
            }
        };

        var initialized = false;
        var models = [];
        var toolName = 'gritCutTool';
        var Tool = function() {
            this.activate = function() {

            }

            this.deactivate = function() {
                
            }

            this.getNames = function() {
                return [toolName];
            };
            this.getName = function() {
                return toolName;
            };

            this.handleSingleClick = function(event) {

                var hit = getHit(event);
                if (hit && !cutHit) {
                    cutHit = hit;
                    
                    var canvas = viewer.canvas;
                    var canvasWidth = canvas.clientWidth;
                    var canvasHeight = canvas.clientHeight;

                    var camera = new THREE.OrthographicCamera(
                        0, canvasWidth, 0, canvasHeight, 1, 1000)

                    var lineMaterial = new THREE.LineBasicMaterial({
                        color: new THREE.Color(0x0000FF),
                        linewidth: 1,
                        opacity: .6
                    });
                    viewer.impl.createOverlayScene(
                        "cutOverlay",
                        lineMaterial,
                        lineMaterial,
                        camera);
                    var lineGeometry = new THREE.Geometry();
                    lineGeometry.vertices.push(
                        new THREE.Vector3(canvas.clientWidth / 2, 0, -10),
                        new THREE.Vector3(canvas.clientWidth / 2, canvas.clientHeight, -10)
                    );

                    // add geom to group
                    cutLine = new THREE.Line(lineGeometry, lineMaterial, THREE.LineStrip);
                    viewer.impl.addOverlay('cutOverlay', cutLine);

                    viewer.toolbar.getControl('navTools').addControl(saveButton);
                    viewer.toolbar.getControl('navTools').addControl(addButton);
                    viewer.toolbar.getControl('navTools').addControl(undoButton);
                    viewer.toolbar.getControl('navTools').addControl(closeButton);
                    viewer.toolbar.getControl('navTools').removeControl(cutButton);

                    viewer.impl.scene.children.forEach(c => {
                        if (c.isCustomVisible) {
                            removedChildren.push(c);
                        }
                    });
                    removedChildren.forEach(c => viewer.impl.scene.remove(c));
                    cutGeometry = getGeometry(cutHit.originalDbId, cutHit.model);
                    
                    models.forEach(model => {
                        const fragList = model.getFragmentList().fragments.fragId2dbId;
                        // Map is to avoid searching an array, and array is so we don't have to go through map an convert to numbers since keys return strings
                        const map = {};
                        const array = [];
                        modelHiddenNodes[model.id] = [];
                        fragList.forEach(num => {
                            if (!map[num]) {
                                map[num] = true;
                                if (!model.visibilityManager.getFragmentMap().isNodeHidden(num)) {
                                    array.push(num);
                                    modelHiddenNodes[model.id].push(num);
                                }
                            }
                        });
                        viewer.impl.visibilityManager.hide(array, model);
                    });
                    viewer.fitToView([hit.originalDbId], hit.model);
                    planes = getOriginalPlanes(hit.dbId, hit.model.id);
                }
                if (hit) {
                    previewCut(true);
                } else if (!cutHit) {
                    disableCut(true);
                }
                return true;
            }
            this.handleSingleTap = function(event) {
                return this.handleSingleClick(event);
            }
            this.handleKeyDown = function(event, keyCode) {
                if (keyCode === 27) {
                    disableCut();
                    return true;
                }
            }
            this.handleKeyUp = function(event, keyCode) {
                if (cutHit) {
                    previewCut();                    
                }
            }
            this.handleButtonDown = function(event) {
            };
            this.handleButtonUp = function(event) {
                if (cutHit) {
                    previewCut();
                }
            };
            this.handleMouseMove = function(event) {

            };

            this.getCursor = function() {
                return "url('data:image/x-icon;base64,AAACAAEAICAAAAAAAACoEAAAFgAAACgAAAAgAAAAQAAAAAEAIAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3PEkBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAgIFAgIDSgwNEHkPERRREBMXBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMD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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGRshDQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA///////////////////////////////////b////u////7v///+7////w////5////+/////P////3////5////8/1///P7n//A47/8ABt/4A/+/wMf///+P////H////z////5////8////+/////////////////////////8='), auto";
            };
        };
        this.load = function() {
            this.tool = new Tool();
            viewer.toolController.registerTool(this.tool);
            return true;
        };
        this.unload = function() {
            viewer.toolController.deactivateTool(toolName);
            return true;
        };

        this.init = function(loadedRoute, model, getPlanes, getHit, TranslationService) {
            getOriginalPlanes = getPlanes;
            getOriginalHit = getHit;
            if (models.find(m => m.id === model.id) == null) {
                models.push(model);
            }
            if (!initialized) {
                cutButton = new Autodesk.Viewing.UI.Button('toolbar-cutComboTool');
                cutButton.onClick = (() => {
                    if (!cutting) {
                        for (let i = 0; i < viewer.toolbar.getNumberOfControls(); i++) {
                            var key = viewer.toolbar.getControlId(i);
                            var tools = viewer.toolbar.getControl(key);
                            removedButtons[key] = [];
                            while (tools.getNumberOfControls() > 0) {
                                const button = tools.getControl(tools.getControlId(0));
                                tools.removeControl(button);
                                removedButtons[key].push(button);
                            }
                        }
                        viewer.toolbar.getControl('navTools').addControl(cutButton);
                        cutButton.setState(0);
                        cutting = true;
                        viewer.toolController.activateTool(toolName);
                    } else {
                        disableCut(true);
                    }
                });
                cutButton.setToolTip(TranslationService.translate('cut'));
                cutButton.icon.className = 'adsk-button-icon fa fa-cut fa-lg';

                saveButton = new Autodesk.Viewing.UI.Button('toolbar-saveCut');
                saveButton.onClick = (() => { saveCut(); });
                saveButton.setToolTip(TranslationService.translate('save'));
                saveButton.icon.className = 'adsk-button-icon fas fa-save fa-lg';

                addButton = new Autodesk.Viewing.UI.Button('toolbar-addCut');
                addButton.onClick = (() => { previewCut(true); });
                addButton.setToolTip(TranslationService.translate('add_cut'));
                addButton.icon.className = 'adsk-button-icon fas fa-plus fa-lg';

                closeButton = new Autodesk.Viewing.UI.Button('toolbar-closeCut');
                closeButton.onClick = (() => { disableCut(true); });
                closeButton.setToolTip(TranslationService.translate('cancel'));
                closeButton.icon.className = 'adsk-button-icon fas fa-times fa-lg';
                
                undoButton = new Autodesk.Viewing.UI.Button('toolbar-undoCut');
                undoButton.onClick = (() => { disableCut(); });
                undoButton.setToolTip(TranslationService.translate('undo'));
                undoButton.icon.className = 'adsk-button-icon fas fa-undo fa-lg';

                if (loadedRoute.endsWith('models') || loadedRoute.endsWith('master-schedule') || loadedRoute.endsWith('planner')) {
                    viewer.toolbar.getControl('navTools').addControl(cutButton);
                }
                
            }
            return true;
        }
    }
  
    Autodesk.Viewing.theExtensionManager.registerExtension(
      'GritCutTool',
      GritCutToolExtension);
  })()