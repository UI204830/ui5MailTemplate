sap.ui.define([
    "meldeappui5/controller/BaseController",
    "sap/ui/core/routing/History"

], function (BaseController, History) {
    "use strict";

    return BaseController.extend("meldeappui5.controller.EmailTemplate", {

        onInit: function () {
            const notificationcreateModel = this.getModel("notificationcreateModel");
            this.byId("emailTemplatePage").setModel(notificationcreateModel);
            const notificationData = notificationcreateModel.getData();
            const sUrl = "#" + this.getOwnerComponent().getRouter().getURL("CreateNotification");
            console.log(sUrl);
        },

        onBack: function () {
            var sPreviousHash = History.getInstance().getPreviousHash();

            //The history contains a previous entry
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                // There is no history!
                // replace the current hash with page 1 (will not add an history entry)
                this.getOwnerComponent().getRouter().navTo("CreateNotification", null, true);
            }
        }
    });
});
