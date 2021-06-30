/* global _:true */
sap.ui.define([
    "meldeappui5/controller/BaseController",
    "meldeappui5/util/Database",
    "sap/base/Log",
    "sap/m/library",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/ui/core/syncStyleClass",
    "meldeappui5/libs/loadash",
    "sap/m/UploadCollectionParameter",
    "sap/m/MessageBox"
], function (
    BaseController,
    Database,
    Log,
    mobileLibrary,
    JSONModel,
    ODataModel,
    MessageToast,
    Fragment,
    syncStyleClass,
    Loadash,
    UploadCollectionParameter,
    MessageBox) {
    "use strict";

    var URLHelper = mobileLibrary.URLHelper;
    var sapNotificaiton, toasMsg, sapDIR;

    return BaseController.extend("meldeappui5.controller.CreateNotification", {

        _bSelectedFromSuggestionList: false,
        _database: {},

        onInit: function () {
            this._checkForRobotics();
            this.readUserDataFromPortal();
            const oDialog = this.getView().byId("BusyDialog");
            oDialog.open();

            var appModel = this.getModel("appModel");
            var oDataModel, oDataUrl;
            var complete_url = window.location.href;

            if (complete_url.includes("portal.gate.rwe.com")) {
                oDataUrl = appModel.getProperty("/serverUrlMP2");
            } else if (complete_url.includes("gateqa")) {
                oDataUrl = appModel.getProperty("/serverUrlMQ2");
            } else {
                oDataUrl = appModel.getProperty("/serverUrlMK2");
            }

            oDataModel = new ODataModel(oDataUrl, {
                useBatch: false,
                DefaultCountMode: "Inline",
                DefaultBindingMode: "TwoWay"
            });

            this.setModel(oDataModel, "order");

            Database.getBuildingSet(oDataModel)
                .then(function (data) {
                    const model = new JSONModel(data.results);
                    this._database._buildingSetData = data.results;
                    model.setSizeLimit(500);
                    this.setModel(model, "buildingSetModel");
                    this.createTextsearchModel(data);
                    return Database.getCategorySet(oDataModel);
                }.bind(this))
                .then(function (data) {
                    const mfmCatagories = _.filter(data.results, function (obj) {
                        return (obj.group.includes("BAUMFM"));
                    });
                    this._database._categorySetData = mfmCatagories;
                    this.getModel("dropdownModel").setProperty("/categoryset", mfmCatagories);
                    return Database.getPlanGroupSet(oDataModel);
                }.bind(this))
                .then(function (data) {
                    this._database._planGroupSetData = data.results;
                    this.getModel("dropdownModel").setProperty("/plangroupset", data.results);
                    return Database.getPrioritySet(oDataModel);
                }.bind(this))
                .then(function (data) {
                    this._database._prioritySetData = data.results;
                    this.getModel("dropdownModel").setProperty("/priorityset", data.results);
                    this.byId("BusyDialog").close();
                }.bind(this))
                .catch(function (error) {
                    this.byId("BusyDialog").close();
                    Log.error(error);
                }.bind(this));
        },

        onAfterRendering: function () {
            this.byId("mfmTitle").addStyleClass("mfmTitleClass");
            this.byId("hintMissingBuildingsText").addStyleClass("hintMissingBuildingsClass");
        },

        _checkForRobotics: function () {
            var that = this;
            this.getModel("appModel").setProperty("/robotics", false);
            var complete_url = window.location.href;
            var pieces = complete_url.split("?");
            if (pieces.length > 1) {
                var params = pieces[1].split("&");
                $.each(params, function (key, value) {
                    var param_value = value.split("=");
                    if (value.includes("Robotics=true")) {
                        that.getModel("appModel").setProperty("/robotics", true);
                    }
                });
            }
        },

        readUserDataFromPortal: function () {
            const loginModel = this.getModel("loginModel");
            const complete_url = window.location.href;
            let url = "";
            if (complete_url.includes("gatecons")) {
                url = this.getOwnerComponent().getModel("appModel").getProperty("/pc7Url");
            } else if (complete_url.includes("gate.rwe.com")) {
                url = this.getOwnerComponent().getModel("appModel").getProperty("/pp7Url");
            } else if (complete_url.includes("gateqa")) {
                url = this.getOwnerComponent().getModel("appModel").getProperty("/pq7Url");
            } else {
                url = this.getOwnerComponent().getModel("appModel").getProperty("/pd7Url");
            }
            const aData = $.ajax({
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
                },
                error: function (error) {
                    Log.error(error);
                }
            });
        },

        createTextsearchModel: function (data) {
            var myResults = [];
            var textsearchModel = this.getModel("textsearchModel");
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

            var uniqueData = _.uniqBy(sampledata.fulltext, 'text');
            this.getModel("textsearchModel").setProperty("/fulltext", uniqueData);

        },

        onFullsearchChange: function (oEvent) {
            var fullsearchText = this.getView().byId("fullsearchInput").getValue();
            var allBuildings = this.getModel("buildingSetModel").getData();
            var buildingResults = _.filter(allBuildings, function (obj) {
                return (obj.city.includes(fullsearchText)) || (obj.buldingName.includes(fullsearchText)) ||
                    (obj.houseNumber.includes(fullsearchText)) || (obj.location.includes(fullsearchText)) || (obj.postalCode.includes(
                        fullsearchText)) ||
                    (obj.street.includes(fullsearchText));
            });
            if (buildingResults.length == 1) {
                this.getModel("notificationcreateModel").setProperty("/funcLocationId", buildingResults[0].funcLocationId);
                this.getModel("appModel").setProperty("/selectBuildingEnabled", true);
                this.byId("fullsearchInput").setValueState("Success");
                MessageToast.show("Bitte ein Gebäude auswählen!");
            } else if (buildingResults.length > 1) {
                this.getModel("notificationcreateModel").setProperty("/funcLocationId", buildingResults[0].funcLocationId);
                this.getModel("appModel").setProperty("/selectBuildingEnabled", true);
                this.byId("fullsearchInput").setValueState("Success");
                MessageToast.show("Bitte ein Gebäude auswählen!");
            } else {
                this.getModel("notificationcreateModel").setProperty("/funcLocationId", "");
                this.byId("fullsearchInput").setValueState("Error");
                this.getModel("appModel").setProperty("/selectBuildingEnabled", false);
                MessageToast.show("Keine Gebäude zu dieser Suche gefunden!");
            }
            this.getModel("textsearchModel").setProperty("/buildingresults", buildingResults);
        },


        onLiveBuildingChangeInput: function (event) {
            const fullTextInputControl = this.getView().byId("fullsearchInput");
            let fullsearchText = event.getParameter("value").toLocaleLowerCase();

            // let allBuildings = this.getModel("dropdownModel").getProperty("/buildingset");

            const buildingSetModel = this.getModel("buildingSetModel");
            let allBuildings = buildingSetModel.getData();
            var buildingResults = _.filter(allBuildings, function (obj) {
                return (obj.city.toLocaleLowerCase().includes(fullsearchText)) ||
                    (obj.buldingName.toLocaleLowerCase().includes(fullsearchText)) ||
                    (obj.funcLocationId.toLocaleLowerCase().includes(fullsearchText)) ||
                    (obj.houseNumber.toLocaleLowerCase().includes(fullsearchText)) ||
                    (obj.location.toLocaleLowerCase().includes(fullsearchText)) ||
                    (obj.postalCode.toLocaleLowerCase().includes(fullsearchText)) ||
                    (obj.street.toLocaleLowerCase().includes(fullsearchText)) ||
                    (obj.gebisNumber.toLocaleLowerCase().includes(fullsearchText));
            });
            this.getModel("dropdownModel").setProperty("/buildingset", buildingResults);
            if (buildingResults.length > 0) {
                fullTextInputControl.setValueState("None");
                fullTextInputControl.setValueStateText("Bitte ein vorhandenes Gebäude auswählen!");
            } else {
                this.getModel("notificationcreateModel").setProperty("/funcLocationId", "");
            }
            this._bSelectedFromSuggestionList = false;
        },

        onValueHelpRequest: function (event) {
            var oView = this.getView();

            if (!this._pValueHelpDialog) {
                this._pValueHelpDialog = Fragment.load({
                    id: oView.getId(),
                    name: "meldeappui5.view.fragment.BuildingSetValueHelp",
                    controller: this
                }).then(function (oValueHelpDialog) {
                    oView.addDependent(oValueHelpDialog);
                    return oValueHelpDialog;
                });
            }
            this._pValueHelpDialog.then(function (oValueHelpDialog) {
                this._configValueHelpDialog(oValueHelpDialog);
                oValueHelpDialog.open();
            }.bind(this));
        },

        _configValueHelpDialog: function (oValueHelpDialog) {
            var sInputValue = this.byId("fullsearchInput").getValue(),
                aBuildings = this.getModel("buildingSetModel").getData();

            aBuildings.forEach(function (building) {
                building.selected = (building.buldingName === sInputValue);
            });
            this.getModel("dropdownModel").setProperty("/buildingset", aBuildings);

            oValueHelpDialog.addStyleClass("sapUiResponsivePadding--header sapUiResponsivePadding--subHeader sapUiResponsivePadding--content sapUiResponsivePadding--footer");
            syncStyleClass("sapUiSizeCompact", this.getView(), oValueHelpDialog);
        },

        onLiveChangeShortText: function (event) {
            const src = event.getSource();
            const val = src.getValue();
            if (val.length > 0) {
                src.setValueState("None");
                src.setValueStateText("");
            }
        },

        onLiveChangeInput: function (event) {
            var notificationModel = this.getModel("notificationcreateModel");
            notificationModel.setProperty(event.getSource().mBindingInfos.value.binding.sPath, event.getSource().getValue());
        },

        // onSelectBuilding: function (oEvent) {
        //     this.getModel("notificationcreateModel").setProperty("/funcLocationId", oEvent.getSource().getSelectedKey());
        //     var selectedFunLocationId = this.getView().byId("selectBuilding").getSelectedKey();
        //     if (!selectedFunLocationId) {
        //         this.getView().byId("selectBuilding").setValueState("Error");
        //     } else {
        //         this.getView().byId("selectBuilding").setValueState("Success");
        //     }
        // },

        onSuggestionItemSelected: function (event) {
            const fullsearchInputField = this.byId("fullsearchInput");
            const bindingPath = event.getParameter("selectedItem").getBindingContextPath();
            const selectedBuilding = this.getModel("dropdownModel").getProperty(bindingPath);

            // const selectedId = event.getParameter("selectedRow").getId();
            // const aSelectedId = selectedId.split("-");
            // const selectedIndex = aSelectedId[aSelectedId.length - 1];
            // const selectedBuilding = this.getModel("buildingSetModel").getData()[selectedIndex];

            this.getModel("notificationcreateModel").setProperty("/funcLocationId", selectedBuilding.funcLocationId);
            this.getModel("dropdownModel").setProperty("/selectedBuildingName", selectedBuilding.buldingName);
            var searchInputText = selectedBuilding.buldingName + ", "
                + selectedBuilding.street + " "
                + selectedBuilding.houseNumber + ", "
                + selectedBuilding.postalCode + " "
                + selectedBuilding.city;
            fullsearchInputField.setValue(searchInputText);
            this._bSelectedFromSuggestionList = true;
            this.byId("fullsearchInput").setValueState("None");
            this.byId("fullsearchInput").setValueStateText("");
        },

        onValueHelpDialogClose: function (oEvent) {
            // reset the filter
            var oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter([]);

            var aContexts = oEvent.getParameter("selectedContexts");
            if (aContexts && aContexts.length) {
                MessageToast.show("You have chosen " + aContexts.map(function (oContext) {
                    return oContext.getObject().buldingName;
                }).join(", "));
            }

        },

        onSelectCategory: function (oEvent) {
            this.getModel("notificationcreateModel").setProperty("/category", oEvent.getSource().getSelectedKey());
        },

        _validateData: function () {
            var that = this;
            return new Promise(function (resolved, rejected) {
                const shortTextControl = this.byId("idInputShortText");
                const fullSearchControl = this.byId("fullsearchInput");
                var shortText = shortTextControl.getValue();
                var fullSearchText = fullSearchControl.getValue();
                var selectedFunLocationId = this.getModel("notificationcreateModel").getProperty("/funcLocationId");
                shortText.trim();
                if (shortText.length === 0) {
                    shortTextControl.setValueState("Error");
                    shortTextControl.setValueStateText("Dieses Feld darf nicht leer sein.");
                    rejected();
                }
                if (fullSearchText.length === 0) {
                    fullSearchControl.setValueState("Error");
                    fullSearchControl.setValueStateText("Dieses Feld darf nicht leer sein.");
                    rejected();
                }
                if (!selectedFunLocationId && fullSearchText.length > 0) {
                    fullSearchControl.setValueState("Error");
                    fullSearchControl.setValueStateText("Bitte ein vorhandenes Gebäude auswählen!");
                    rejected();
                }
                resolved();
            }.bind(this));
        },

        handleLongTextLiveChange: function () {
            var shortText = this.byId("textAreaLongText").getValue();
            shortText.trim();
            if (shortText.length > 1000) {
                this.byId("textAreaLongText").setValueState("Error");
                this.byId("textAreaLongText").setValueStateText("Es sind maximal 1000 Zeichen erlaubt");
            } else {
                this.byId("textAreaLongText").setValueState("None");
                this.byId("textAreaLongText").setValueStateText("");
            }
        },

        onCreateNotification: function () {
            this._validateData()
                .then(function (result) {
                    var notification = this.getModel("notificationcreateModel").getData();
                    var oData = this.getModel("notificationcreateModel").getData();
                    var oDataModel = this.getModel("order");
                    var oDialog = this.byId("BusyDialog");
                    var selectedFunLocationId = this.getModel("notificationcreateModel").getProperty("/funcLocationId");
                    var selectedCategory = this.byId("selectCategory").getSelectedKey();
                    oData.reportedBy_l = this.getModel("loginModel").getProperty("/lastname");
                    oData.reportedBy_f = this.getModel("loginModel").getProperty("/firstname");
                    oData.reportedBy_t = this.getModel("loginModel").getProperty("/telephone");
                    oData.reportedBy_e = this.getModel("loginModel").getProperty("/email");

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
                                    toasMsg = "Unbekannter Fehler beim Anlegen einer Meldung"
                                    oDialog.close();
                                    return;
                                }
                            }
                            var allImages = this.getModel("notificationDIRModel").getProperty("/images");
                            if (allImages.length != 0) {
                                this.uploadImagesToNotification(allImages, result.response.notificationId);
                            } else {
                                oDialog.close();
                                this._showSuccessDialog(result.response.notificationId);

                            }
                        }.bind(this),

                        error: function (error) {
                            if (error.responseText) {
                                let messageObject = JSON.parse(error.responseText);
                                if (messageObject.error.message.value) {
                                    toasMsg = messageObject.error.message.value;
                                    oDialog.close();
                                    return;
                                }
                            }
                        },
                    });
                    return;
                }.bind(this));
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
            var oDataModel = this.getModel("order");
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
                    const result = {
                        data: sapDIR,
                        response: response
                    };
                    oDialog.close();
                    that._showSuccessDialog(result.response.notificationId);
                },
                error: function (error) {
                    Log.error(error);
                }
            });
        },

        _showSuccessDialog: function (data) {
            MessageBox.success("Vielen Dank für Ihre Meldung. Ihre Meldung wurde angelegt unter der Nummer: " + data, {
                actions: ["Fertig"],
                styleClass: "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer",
                emphasizedAction: "Fertig",
                onClose: function (sAction) {
                    location.reload();
                }
            });
        },

        onChange: function (oEvent) {
            var that = this;
            var oUploadCollection = oEvent.getSource();
            var oCustomerHeaderToken = new UploadCollectionParameter({
                name: "x-csrf-token",
                value: "securityTokenFromModel"
            });
            oUploadCollection.addHeaderParameter(oCustomerHeaderToken);

            var files = oEvent.getParameter("files");
            for (var i = 0; i < files.length; i++) {
                this._fileToBase64String(files[i])
                    .then(function (result) {
                        var fileData = result
                        var allImages = this.getModel("notificationDIRModel").getProperty("/images");
                        allImages.push(fileData);
                        this.getModel("notificationDIRModel").setProperty("/images", allImages);
                        return;
                    }.bind(this));
            }
        },

        onBeforeUploadStarts: function (oEvent) {
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
