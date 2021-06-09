sap.ui.define([
    "meldeappui5/controller/BaseController"

], function (BaseController) {
    "use strict";

    return BaseController.extend("meldeappui5.controller.App", {

        onInit: function () {
            this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
        }
    });
});
