sap.ui.define([
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/odata/v2/ODataModel"
    ],

    function (JSONModel, ODataModel) {
        "use strict";

        return {

            readServiceData: function (oDataModel, serviceUrl) {
                return new Promise(function (resolve, reject) {
                    oDataModel.read(serviceUrl, {
                        success: function (data) {
                            resolve(data);
                        },
                        error: function (error) {
                            reject(error);
                        }
                    });
                });
            },

            getBuildingSet: function (oDataModel) {
                return this.readServiceData(oDataModel, "/BuildingSet");
            },

            getCategorySet: function (oDataModel){
                return this.readServiceData(oDataModel, "/CategorySet");
            },

            getPlanGroupSet: function (oDataModel){
                return this.readServiceData(oDataModel, "/PlanGroupSet");
            },

            getPrioritySet: function (oDataModel){
                return this.readServiceData(oDataModel, "/PrioritySet");
            }

        }
    });
