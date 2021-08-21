sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/base/Log"

], function (Controller,
             UIComponent,
             Log) {
    "use strict";

    return Controller.extend("meldeappui5.controller.BaseController", {

        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },

        getModel: function (name) {
            let model = this.getView().getModel(name);
            if (!model) {
                model = this.getOwnerComponent().getModel(name);
            }
            return model;
        },

        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        getResourceBundle: function () {
            const language = sap.ui.getCore().getConfiguration().getLanguage();
            const resourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            resourceBundle.sLocale = language;
            return resourceBundle;
        },

        getI18nText: function (key) {
            return this.getResourceBundle().getText(key);
        }
    });
});
