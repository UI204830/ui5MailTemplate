/*global QUnit*/

sap.ui.define([
	"RWER/RWE_MFM_MELDE_APP/controller/CreateNotification.controller"
], function (Controller) {
	"use strict";

	QUnit.module("CreateNotification Controller");

	QUnit.test("I should test the CreateNotification controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});