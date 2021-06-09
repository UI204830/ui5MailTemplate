/* global _:true */
sap.ui.define([
    "meldeappui5/controller/BaseController",
    "sap/m/library",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/ui/core/syncStyleClass",
    "meldeappui5/libs/underscore",
    "meldeappui5/libs/loadash",
    "sap/m/UploadCollectionParameter",
    "sap/m/MessageBox"

], function (
    BaseController,
    mobileLibrary,
    JSONModel,
    ODataModel,
    MessageToast,
    Fragment,
    syncStyleClass,
    Underscore,
    Loadash,
    UploadCollectionParameter,
    MessageBox) {
    "use strict";

    var URLHelper = mobileLibrary.URLHelper;
    var sapNotificaiton, toasMsg, sapDIR;

    return BaseController.extend("meldeappui5.controller.CreateNotification", {

        onInit: function () {
            //if	(window.navigator.userAgent.includes("Chrome") || window.navigator.userAgent.includes("Edge")){
            this._checkForRobotics();
            this.readUserDataFromPortal();
            var oDialog = this.getView().byId("BusyDialog");
            oDialog.open();

            // var oModel = this.getOwnerComponent().getModel("productsModel");
            // var oModel2 = this.getOwnerComponent().getModel("dropdownModel");
            // this.getView().setModel(oModel);
            // this.getView().setModel(oModel2);
            //	this.getOwnerComponent().getModel("dropdownModel").setSizeLimit(500);
            var appModel = this.getOwnerComponent().getModel("appModel");
            var oOrderModel, oDataUrl;
            var that = this;
            var complete_url = window.location.href;
            if (complete_url.includes("gatecons")) {
                oDataUrl = appModel.getProperty("/serverUrlMQ2");
            } else if (complete_url.includes("gatedev")) {
                oDataUrl = appModel.getProperty("/serverUrlMQ2");
            } else if (complete_url.includes("gateqa")) {
                oDataUrl = appModel.getProperty("/serverUrlMQ2");
            } else if (complete_url.includes("webide")) {
                oDataUrl = appModel.getProperty("/serverUrlMQ2");
            } else {
                oDataUrl = appModel.getProperty("/serverUrlMP2");
            }

            oOrderModel = new ODataModel(oDataUrl, {
                useBatch: false,
                DefaultCountMode: "Inline",
                DefaultBindingMode: "TwoWay"
            });

            this.getOwnerComponent().setModel(oOrderModel, "order");

            oOrderModel.read("/BuildingSet", {
                success: function (data) {
                    // resolve(data);
                    that.getOwnerComponent().getModel("dropdownModel").setProperty("/buildingset", data.results);
                    that.createTextsearchModel(data);
                    //that.setAllBuildingsToSearchResults();
                },
                error: function (error) {
                }
            });

            oOrderModel.read("/CategorySet", {
                success: function (data) {
                    // resolve(data);
                    var mfmCatagories = _.filter(data.results, function (obj) {
                        return (obj.group.includes("BAUMFM"));
                    });
                    that.getOwnerComponent().getModel("dropdownModel").setProperty("/categoryset", mfmCatagories);
                },
                error: function (error) {
                }
            });
            oOrderModel.read("/PlanGroupSet", {
                success: function (data) {
                    // resolve(data);
                    that.getOwnerComponent().getModel("dropdownModel").setProperty("/plangroupset", data.results);
                },
                error: function (error) {
                }
            });

            oOrderModel.read("/PrioritySet", {
                success: function (data) {
                    that.getOwnerComponent().getModel("dropdownModel").setProperty("/priorityset", data.results);
                },
                error: function (error) {
                }
            });
            //} else {
            //	MessageBox.information("Die Anwendung läuft nur unter Chrome oder Edge Browser!");
            //	window.open("https://teamwork.rwe.com/", "_self");
            //}

        },

        _checkForRobotics: function () {
            var that = this;
            this.getOwnerComponent().getModel("appModel").setProperty("/robotics", false);
            var complete_url = window.location.href;
            var pieces = complete_url.split("?");
            if (pieces.length > 1) {
                var params = pieces[1].split("&");
                $.each(params, function (key, value) {
                    var param_value = value.split("=");
                    if (value.includes("Robotics=true")) {
                        that.getOwnerComponent().getModel("appModel").setProperty("/robotics", true);
                    }
                    //console.log(key + ": " + value + " | " + param_value[1]);
                });
            }
        },

        onBeforeRendering: function () {
            var oDialog = this.getView().byId("BusyDialog");

            oDialog.close();
        },

        readUserDataFromPortal: function () {
            var loginModel = this.getOwnerComponent().getModel("loginModel");
            var complete_url = window.location.href;
            var url = "";
            if (complete_url.includes("gatecons")) {
                var url = this.getOwnerComponent().getModel("appModel").getProperty("/pc7Url");
            } else if (complete_url.includes("gatedev")) {
                var url = this.getOwnerComponent().getModel("appModel").getProperty("/pd7Url");
            } else if (complete_url.includes("gateqa")) {
                var url = this.getOwnerComponent().getModel("appModel").getProperty("/pq7Url");
            } else {
                var url = this.getOwnerComponent().getModel("appModel").getProperty("/pp7Url");
            }
            var aData = jQuery.ajax({
                type: "GET",
                contentType: "application/json",
                url: url,
                dataType: "json",
                async: false,
                success: function (data, textStatus, jqXHR) {
                    loginModel.setProperty("/firstname", data.firstname);
                    loginModel.setProperty("/lastname", data.lastname);
                    loginModel.setProperty("/email", data.email);
                    loginModel.setProperty("/telephone", data.phone);

                }
            });
            //this.getView().setModel(oModel);
        },

        createTextsearchModel: function (data) {
            var myResults = [];
            var textsearchModel = this.getOwnerComponent().getModel("textsearchModel");
            var sampledata = textsearchModel.getData();
            myResults = data.results;

            for (var i = 0; i < myResults.length; i++) {
                sampledata = textsearchModel.getData();
                var obj = myResults[i];
                var buldingName = {};
                buldingName['text'] = obj.buldingName.trim();
                sampledata.fulltext.push(buldingName);

                var location = {};
                location['text'] = obj.location.trim();
                sampledata.fulltext.push(location);

                var street = {};
                street['text'] = obj.street.trim();
                sampledata.fulltext.push(street);

                var houseNumber = {};
                houseNumber['text'] = obj.houseNumber.trim();
                sampledata.fulltext.push(houseNumber);

                var postalCode = {};
                postalCode['text'] = obj.postalCode.trim();
                sampledata.fulltext.push(postalCode);

                var city = {};
                city['text'] = obj.city.trim();
                sampledata.fulltext.push(city);

                textsearchModel.setData(sampledata);
            }

            var nonDuplidatedData = _.uniqBy(sampledata.fulltext, 'text');
            this.getOwnerComponent().getModel("textsearchModel").setProperty("/fulltext", nonDuplidatedData);

        },

        setAllBuildingsToSearchResults: function () {
            var allBuildings = this.getOwnerComponent().getModel("dropdownModel").getProperty("/buildingset");
            this.getOwnerComponent().getModel("textsearchModel").setProperty("/buildingresults", allBuildings);
        },

        onFullsearchChange: function (oEvent) {
            var fullsearchText = this.getView().byId("fullsearchInput").getValue();
            var allBuildings = this.getOwnerComponent().getModel("dropdownModel").getProperty("/buildingset");
            var buildingResults = _.filter(allBuildings, function (obj) {
                return (obj.city.includes(fullsearchText)) || (obj.buldingName.includes(fullsearchText)) ||
                    (obj.houseNumber.includes(fullsearchText)) || (obj.location.includes(fullsearchText)) || (obj.postalCode.includes(
                        fullsearchText)) ||
                    (obj.street.includes(fullsearchText));
            });
            if (buildingResults.length == 1) {
                this.getOwnerComponent().getModel("notificationcreateModel").setProperty("/funcLocationId", buildingResults[0].funcLocationId);
                this.getOwnerComponent().getModel("appModel").setProperty("/selectBuildingEnabled", true);
                this.getView().byId("fullsearchInput").setValueState("Success");
                MessageToast.show("Bitte ein Gebäude auswählen!");
            } else if (buildingResults.length > 1) {
                this.getOwnerComponent().getModel("notificationcreateModel").setProperty("/funcLocationId", buildingResults[0].funcLocationId);
                this.getOwnerComponent().getModel("appModel").setProperty("/selectBuildingEnabled", true);
                this.getView().byId("fullsearchInput").setValueState("Success");
                MessageToast.show("Bitte ein Gebäude auswählen!");
            } else {
                this.getOwnerComponent().getModel("notificationcreateModel").setProperty("/funcLocationId", "");
                this.getView().byId("fullsearchInput").setValueState("Error");
                this.getOwnerComponent().getModel("appModel").setProperty("/selectBuildingEnabled", false);
                MessageToast.show("Keine Gebäude zu dieser Suche gefunden!");
            }
            this.getOwnerComponent().getModel("textsearchModel").setProperty("/buildingresults", buildingResults);
        },

        onLiveBuildingChangeInput: function (event) {
            var fullsearchText = this.getView().byId("fullsearchInput").getValue();
            var allBuildings = this.getOwnerComponent().getModel("dropdownModel").getProperty("/buildingset");
            var buildingResults = _.filter(allBuildings, function (obj) {
                return (obj.city.includes(fullsearchText)) || (obj.buldingName.includes(fullsearchText)) ||
                    (obj.houseNumber.includes(fullsearchText)) || (obj.location.includes(fullsearchText)) || (obj.postalCode.includes(
                        fullsearchText)) ||
                    (obj.street.includes(fullsearchText)) ||
                    (obj.gebisNumber.includes(fullsearchText));
            });
            if (buildingResults.length > 0) {
                this.getView().byId("fullsearchInput").setValueState("Success");
                this.getView().byId("fullsearchInput").setValueStateText("Bitte ein Gebäude auswählen!");
                //	MessageToast.show("Bitte ein Gebäude auswählen!");
            } else {
                // this.getView().byId("fullsearchInput").setValueState("Error");
                // this.getView().byId("fullsearchInput").setValueStateText("Keine Gebäude zu dieser Suche gefunden!");
                this.getOwnerComponent().getModel("notificationcreateModel").setProperty("/funcLocationId", "");
                //	MessageToast.show("Keine Gebäude zu dieser Suche gefunden!");
            }
        },

        onLiveChangeInput: function (event) {
            var notificationModel = this.getOwnerComponent().getModel("notificationcreateModel");
            notificationModel.setProperty(event.getSource().mBindingInfos.value.binding.sPath, event.getSource().getValue());
            //	this.getView().fillTextArea();
        },

        onSelectBuilding: function (oEvent) {
            this.getOwnerComponent().getModel("notificationcreateModel").setProperty("/funcLocationId", oEvent.getSource().getSelectedKey());
            var selectedFunLocationId = this.getView().byId("selectBuilding").getSelectedKey();
            if (!selectedFunLocationId) {
                this.getView().byId("selectBuilding").setValueState("Error");
            } else {
                this.getView().byId("selectBuilding").setValueState("Success");
            }
        },

        onBuidlingTitleClicked: function () {
            var sKey = this.byId("fullsearchInput").getValue();
            // var selectedId = oColumnListItem.getParameters().selectedRow.getId()
            // var selectedIndex = selectedId.split("-").slice(-1).pop();

            // var selectedBuilding = this.getOwnerComponent().getModel("dropdownModel").getProperty("/buildingset")[selectedIndex];
            // this.getOwnerComponent().getModel("notificationcreateModel").setProperty("/funcLocationId", selectedBuilding.funcLocationId);
            // this.getOwnerComponent().getModel("dropdownModel").setProperty("/selectedBuildingName", selectedBuilding.buldingName);
            // this.getView().byId("fullsearchInput").setValue(selectedBuilding.buldingName);
        },

        onSuggestionItemSelected: function (oColumnListItem) {
            var sKey = this.byId("fullsearchInput").getValue();
            var selectedId = oColumnListItem.getParameters().selectedRow.getId()
            var selectedIndex = selectedId.split("-").slice(-1).pop();

            var selectedBuilding = this.getOwnerComponent().getModel("dropdownModel").getProperty("/buildingset")[selectedIndex];
            this.getOwnerComponent().getModel("notificationcreateModel").setProperty("/funcLocationId", selectedBuilding.funcLocationId);
            this.getOwnerComponent().getModel("dropdownModel").setProperty("/selectedBuildingName", selectedBuilding.buldingName);
            var searchInputText = selectedBuilding.buldingName + ", " + selectedBuilding.street + " " + selectedBuilding.houseNumber + ", " + selectedBuilding.postalCode + " " + selectedBuilding.city;
            this.getView().byId("fullsearchInput").setValue(searchInputText);
        },

        onSelectCategory: function (oEvent) {
            this.getOwnerComponent().getModel("notificationcreateModel").setProperty("/category", oEvent.getSource().getSelectedKey());
        },

        _validateData: function () {
            var that = this;
            var promise = new Promise(function (resolved, rejected) {
                var shortText = that.getView().byId("textAreaShorText").getValue();
                var selectedFunLocationId = that.getOwnerComponent().getModel("notificationcreateModel").getProperty("/funcLocationId");
                //	var selectedFunLocationId = that.getView().byId("selectBuilding").getSelectedKey();
                shortText.trim();
                if (!shortText || shortText == "") {
                    MessageToast.show("Bitte Überschrift eingeben!");
                    that.getView().byId("textAreaShorText").setValueState("Error");
                    rejected("error");
                } else if (shortText.length > 40) {
                    MessageToast.show("Überschrift max. 40 Zeichen erlaubt");
                    that.getView().byId("textAreaShorText").setValueState("Error");
                    rejected("error");
                } else if (!selectedFunLocationId || selectedFunLocationId == "") {
                    //	that.getView().byId("selectBuilding").setValueState("Error");
                    that.getView().byId("fullsearchInput").setValueState("Error");
                    MessageToast.show("Bitte ein Ort suchen und Gebäude auswählen!");
                    rejected("error");
                } else {
                    resolved("no_error");
                }
            });
            return promise;
        },

        handleShortTextLiveChange: function () {
            var shortText = this.getView().byId("textAreaShorText").getValue();
            shortText.trim();
            if (!shortText || shortText == "") {
                this.getView().byId("textAreaShorText").setValueState("Error");
            } else if (shortText.length > 40) {
                this.getView().byId("textAreaShorText").setValueState("Error");
            } else {
                this.getView().byId("textAreaShorText").setValueState("Success");
            }
        },

        handleLongTextLiveChange: function () {
            var shortText = this.getView().byId("textAreaLongText").getValue();
            shortText.trim();
            if (shortText.length > 1000) {
                this.getView().byId("textAreaLongText").setValueState("Error");
            } else {
                this.getView().byId("textAreaLongText").setValueState("Success");
            }
        },

        onCreateNotification: function () {
            var that = this;
            this._validateData()
                .then(function (result) {
                    if (result == "no_error") {
                        var notification = that.getOwnerComponent().getModel("notificationcreateModel").getData();
                        var oData = that.getOwnerComponent().getModel("notificationcreateModel").getData();
                        var oDataModel = that.getOwnerComponent().getModel("order");
                        var oDialog = that.getView().byId("BusyDialog");
                        //	var selectedFunLocationId = that.getView().byId("selectBuilding").getSelectedKey();
                        var selectedFunLocationId = that.getOwnerComponent().getModel("notificationcreateModel").getProperty("/funcLocationId");
                        var selectedCategory = that.getView().byId("selectCategory").getSelectedKey();
                        oData.reportedBy_l = that.getOwnerComponent().getModel("loginModel").getProperty("/lastname");
                        oData.reportedBy_f = that.getOwnerComponent().getModel("loginModel").getProperty("/firstname");
                        oData.reportedBy_t = that.getOwnerComponent().getModel("loginModel").getProperty("/telephone");
                        oData.reportedBy_e = that.getOwnerComponent().getModel("loginModel").getProperty("/email");

                        oData.funcLocationId = selectedFunLocationId;
                        oData.category = selectedCategory;
                        oDialog.open();

                        oDataModel.create("/NotificationCreateSet", oData, {
                            success: function (response, responseHeaders) {
                                var result = {
                                    data: sapNotificaiton,
                                    response: response
                                };

                                if (responseHeaders && responseHeaders.headers && responseHeaders.headers["sap-message"]) {
                                    var messageObject = JSON.parse(responseHeaders.headers["sap-message"]);
                                    if (messageObject && messageObject.severity === "error") {
                                        //  reject(messageObject);
                                        toasMsg = "Unbekannter Fehler beim Anlegen einer Meldung"
                                        oDialog.close();
                                        return;
                                    }
                                }
                                //
                                var allImages = that.getOwnerComponent().getModel("notificationDIRModel").getProperty("/images");
                                if (allImages.length != 0) {
                                    that.uploadImagesToNotification(allImages, result.response.notificationId);
                                } else {
                                    //toasMsg = "Meldung " + result.response.notificationId + " gesichert";
                                    oDialog.close();
                                    //open
                                    that._showSuccessDialog(result.response.notificationId);

                                }
                                //  resolve(result);
                            },
                            error: function (error) {

                                if (error.responseText) {
                                    let messageObject = JSON.parse(error.responseText);
                                    if (messageObject.error.message.value) {
                                        toasMsg = messageObject.error.message.value;
                                        oDialog.close();
                                        return;
                                    }
                                }
                                //reject(error);
                            },
                        });
                    }
                    return;
                });
        },

        _fileToBase64String: function (file) {
            var promise = new Promise(function (resolved, rejected) {
                var reader = new FileReader();
                var fixname = file.name;
                var filename = fixname.substring(0, fixname.indexOf("."));
                var extension = fixname.substring(fixname.indexOf(".") + 1);
                reader.onload = function (e) {
                    var raw = e.target.result;
                    var base64String = raw.replace("data:image/png;base64,", "");
                    base64String = base64String.replace("data:image/jpeg;base64,", "");
                    var fileData = {
                        file: file,
                        filename: filename,
                        extension: extension,
                        base64String: base64String
                    }
                    resolved(fileData);
                };
                reader.onerror = function (e) {
                    rejected("error");
                };
                reader.readAsDataURL(file);
            });
            return promise;
        },

        uploadImagesToNotification: function (allImages, notificaitonId) {
            var that = this;
            var oDialog = this.getView().byId("BusyDialog");
            var oDataModel = this.getOwnerComponent().getModel("order");
            var mimeTypes = "";
            var base64Strings = "";
            var fileNames = "";
            for (var i = 0; i < allImages.length; i++) {
                if (i == 0) {
                    base64Strings = allImages[0].base64String;
                    mimeTypes = allImages[0].extension;
                    fileNames = allImages[0].filename;
                } else {
                    base64Strings = base64Strings + "|" + allImages[i].base64String;
                    mimeTypes = mimeTypes + "|" + allImages[i].extension;
                    fileNames = fileNames + "|" + allImages[i].filename;
                }
            }

            var oData = {
                notificationId: notificaitonId,
                mimeType: mimeTypes,
                mimeValue: base64Strings,
                fileName: fileNames
            };

            oDataModel.create("/NotificationDIRSet", oData, {
                success: function (response, responseHeaders) {
                    var result = {
                        data: sapDIR,
                        response: response
                    };
                    oDialog.close();
                    //toasMsg = "Meldung " + result.response.notificationId + " gesichert";
                    that._showSuccessDialog(result.response.notificationId);
                },
                error: function (error) {
                    //reject(error);
                }
            });
        },

        _showSuccessDialog: function (data) {
            MessageBox.success("Vielen Dank für Ihre Meldung. Ihre Meldung wurde angelegt unter der Nummer: " + data, {
                actions: ["Fertig"],
                styleClass: "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer",
                emphasizedAction: "Fertig",
                onClose: function (sAction) {
                    if (sAction == "Neue Meldung erstellen") {
                        location.reload();
                    } else {
                        location.reload();
                        //window.open("https://teamwork.rwe.com/", "_PARENT");
                        //	URLHelper.redirect("https://teamwork.rwe.com/", true);
                    }
                }
            });
        },

        onChange: function (oEvent) {
            var that = this;
            var oUploadCollection = oEvent.getSource();
            // Header Token
            var oCustomerHeaderToken = new UploadCollectionParameter({
                name: "x-csrf-token",
                value: "securityTokenFromModel"
            });
            oUploadCollection.addHeaderParameter(oCustomerHeaderToken);

            var files = oEvent.getParameter("files");
            for (var i = 0; i < files.length; i++) {
                //fill array with uploaded file
                this._fileToBase64String(files[i])
                    .then(function (result) {
                        var fileData = result
                        var allImages = that.getOwnerComponent().getModel("notificationDIRModel").getProperty("/images");
                        allImages.push(fileData);
                        that.getOwnerComponent().getModel("notificationDIRModel").setProperty("/images", allImages);
                        return;
                    });
            }
        },

        onBeforeUploadStarts: function (oEvent) {
            // Header Slug
            var oCustomerHeaderSlug = new UploadCollectionParameter({
                name: "slug",
                value: oEvent.getParameter("fileName")
            });
            oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
            setTimeout(function () {
                MessageToast.show("Event beforeUploadStarts triggered");
            }, 4000);
        },

        onSelectChange: function (oEvent) {
            var oUploadCollection = this.byId("UploadCollection");
            oUploadCollection.setShowSeparators(oEvent.getParameters().selectedItem.getProperty("key"));
        },

        onUploadComplete: function (oEvent) {
            var oUploadCollection = this.byId("UploadCollection");
            var oData = oUploadCollection.getModel().getData();

            oData.items.unshift({
                "documentId": Date.now().toString(), // generate Id,
                "fileName": oEvent.getParameter("files")[0].fileName,
                "mimeType": "",
                "thumbnailUrl": "",
                "url": "",
                "attributes": [{
                    "title": "Uploaded By",
                    "text": "You",
                    "active": false
                }, {
                    "title": "Uploaded On",
                    "text": new Date().toLocaleDateString(),
                    "active": false
                }, {
                    "title": "File Size",
                    "text": "505000",
                    "active": false
                }],
                "statuses": [{
                    "title": "",
                    "text": "",
                    "state": "None"
                }],
                "markers": [{}],
                "selected": false
            });
            this.getView().getModel().refresh();

            // Sets the text to the label
            //	this.byId("attachmentTitle").setText(this.getAttachmentTitleText());

            // delay the success message for to notice onChange message
            setTimeout(function () {
                MessageToast.show("UploadComplete event triggered.");
            }, 4000);
        },

        onFileDeleted: function (oEvent) {
            this.deleteItemById(oEvent.getParameter("documentId"));
        },

        deleteItemById: function (sItemToDeleteId) {
            var oData = this.byId("UploadCollection").getModel().getData();
            var aItems = deepExtend({}, oData).items;
        },

        handleUrlPress: function (evt) {
            URLHelper.redirect(this._getVal(evt), true);
        },

        onDialogClosed: function (oEvent) {
            if (oEvent.getParameter("cancelPressed")) {
                MessageToast.show("The operation has been cancelled");
            } else if (toasMsg) {
                MessageToast.show(toasMsg);
            }
        }
    });
});
