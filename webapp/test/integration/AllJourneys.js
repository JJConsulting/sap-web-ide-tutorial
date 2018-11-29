jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
		"sap/ui/test/Opa5",
		"opensap/manageproductsapp/test/integration/pages/Common",
		"sap/ui/test/opaQunit",
		"opensap/manageproductsapp/test/integration/pages/Worklist",
		"opensap/manageproductsapp/test/integration/pages/Object",
		"opensap/manageproductsapp/test/integration/pages/NotFound",
		"opensap/manageproductsapp/test/integration/pages/Browser",
		"opensap/manageproductsapp/test/integration/pages/App"
	], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "opensap.manageproductsapp.view."
	});

	sap.ui.require([
		"opensap/manageproductsapp/test/integration/WorklistJourney",
		"opensap/manageproductsapp/test/integration/ObjectJourney",
		"opensap/manageproductsapp/test/integration/NavigationJourney",
		"opensap/manageproductsapp/test/integration/NotFoundJourney"
	], function () {
		QUnit.start();
	});
});