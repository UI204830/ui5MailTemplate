/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"RWER/RWE_MFM_MELDE_APP/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});