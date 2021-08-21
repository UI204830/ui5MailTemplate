sap.ui.define([
    "meldeappui5/controller/BaseController",
    "sap/ui/core/routing/History"

], function (BaseController, History) {
    "use strict";

    return BaseController.extend("meldeappui5.controller.EmailTemplate", {

        onInit: function () {
            const emailTemplateModel = this.getModel("emailTemplateModel");
            this.byId("emailTemplatePage").setModel(emailTemplateModel);
            const emailTemplateData = emailTemplateModel.getData();
            console.log(emailTemplateData);
        }
    });
});
