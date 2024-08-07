(function () {
  window.addEventListener("ROUTE_CHANGE", (e) => {
    proto.setCurrentRouteForMenu(e.detail);
  });

  window.addEventListener("SELECTING_PREREQS", (e) => {
    proto.setSelectingPrereqs(e.detail);
  });

  window.addEventListener("SELECTED_WORK_PACKAGE", (e) => {
    proto.setWorkPackageSelected(e.detail);
  });

  ("use strict");

  function GritContextMenuExternalExtension(viewer, options) {
    Autodesk.Viewing.Extension.call(this, viewer, options);
  }

  GritContextMenuExternalExtension.prototype = Object.create(
    Autodesk.Viewing.Extension.prototype
  );
  GritContextMenuExternalExtension.prototype.constructor =
    GritContextMenuExternalExtension;

  var proto = GritContextMenuExternalExtension.prototype;

  proto.load = function () {
    this.viewer.setContextMenu(new GritContextMenu(this.viewer));
    return true;
  };

  proto.init = function (loadedRoute, TranslationService) {
    proto.setCurrentRouteForMenu(loadedRoute);
    this.TranslationService = TranslationService;
    return true;
  };

  proto.unload = function () {
    this.viewer.setContextMenu(
      new Autodesk.Viewing.Extensions.ViewerObjectContextMenu(this.viewer)
    );
    return true;
  };

  proto.setCurrentRouteForMenu = function (value) {
    this.currentRoute = value;
  };

  proto.setSelectingPrereqs = function (value) {
    this.selectingPrereqs = value;
  };

  proto.setWorkPackageSelected = function (value) {
    this.workPackageSelected = value;
  };

  Autodesk.Viewing.theExtensionManager.registerExtension(
    "GritContextMenu",
    GritContextMenuExternalExtension
  );
})();

class GritContextMenu extends Autodesk.Viewing.Extensions
  .ViewerObjectContextMenu {
  constructor(viewer) {
    super(viewer);
  }

  async buildMenu(event) {
    const menu = [];
    const similarObjectRoutes = ["models", "planner", "master-schedule"];
    const clearFiltersRoutes = ["models", "planner", "master-schedule"];
    const addUnmodeledRoutes = ["planner"];
    const addActivityPrereqRoutes = ["planner"];
    const curRoute = this.viewer.loadedExtensions.GritContextMenu.currentRoute;
    const selectingPrereqs =
      this.viewer.loadedExtensions.GritContextMenu.selectingPrereqs;
    const workPackageSelected =
      this.viewer.loadedExtensions.GritContextMenu.workPackageSelected;
    const TranslationService =
      this.viewer.loadedExtensions.GritContextMenu.TranslationService;
    const detailData = { event: "", data: {} };

    if (similarObjectRoutes.filter((r) => curRoute.includes(r)).length > 0) {
      // Do hitTest to get dbIds
      const viewport = this.viewer.container.getBoundingClientRect();
      const canvasX = event.clientX - viewport.left;
      const canvasY = event.clientY - viewport.top;

      const result = this.viewer.impl.hitTest(canvasX, canvasY, false);

      if (result) {
        menu.push({
          title: TranslationService.translate("filter_similar_objects"),
          target: () => {
            var contextMenuEvent = new CustomEvent("VIEWER_SHOW_SIMILAR", {
              detail: result,
            });
            window.dispatchEvent(contextMenuEvent);
          },
        });
      }
    }
    if (clearFiltersRoutes.filter((r) => curRoute.includes(r)).length > 0) {
      menu.push({
        title: TranslationService.translate("clear_filters"),
        target: () => {
          var contextMenuEvent = new CustomEvent("VIEWER_CLEAR_FILTERS");
          window.dispatchEvent(contextMenuEvent);
        },
      });
    }
    if (
      workPackageSelected &&
      addUnmodeledRoutes.filter((r) => curRoute.includes(r)).length > 0
    ) {
      menu.push({
        title: TranslationService.translate("add_unmodeled_task"),
        target: () => {
          detailData.event = "ADD_UNMODELED";
          detailData.data = {};
          var contextMenuEvent = new CustomEvent("GRIT_CONTEXT_MENU", {
            detail: detailData,
          });
          window.dispatchEvent(contextMenuEvent);
        },
      });
    }
    if (
      selectingPrereqs &&
      addActivityPrereqRoutes.filter((r) => curRoute.includes(r)).length > 0
    ) {
      menu.push({
        title: TranslationService.translate("activity_prerequisite"),
        target: () => {
          detailData.event = "ADD_ACTIVITY_PREREQ";
          detailData.data = {};
          var contextMenuEvent = new CustomEvent("GRIT_CONTEXT_MENU", {
            detail: detailData,
          });
          window.dispatchEvent(contextMenuEvent);
        },
      });
    }

    return menu;
  }

  /**
   * @override
   */
  async show(event) {
    const menu = await this.buildMenu(event);
    this.viewer.runContextMenuCallbacks(menu);

    if (menu && menu.length > 0) {
      this.contextMenu.show(event, menu);
    }
  }
}
