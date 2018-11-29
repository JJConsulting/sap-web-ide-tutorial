sap.ui.define([
		"opensap/manageproductsapp/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("opensap.manageproductsapp.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("worklist");
			}

		});

	}
);