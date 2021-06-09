sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device"

], function (UIComponent, Device) {
    "use strict";

    return UIComponent.extend("meldeappui5.Component", {

        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            this.getRouter().initialize();
        },

        getContentDensityClass: function () {
            if (!this._sContentDensityClass) {
                if (!Device.support.touch) {
                    this._sContentDensityClass = "sapUiSizeCompact";
                } else {
                    this._sContentDensityClass = "sapUiSizeCozy";
                }
            }
            return this._sContentDensityClass;
        }
    });
});
