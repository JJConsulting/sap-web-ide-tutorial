sap.ui.define([
	] , function () {
		"use strict";

		return {

			/**
			 * Rounds the number unit value to 2 digits
			 * @public
			 * @param {string} sValue the number string to be rounded
			 * @returns {string} sValue with 2 digits rounded
			 */
			numberUnit : function (sValue) {
				if (!sValue) {
					return "";
				}
				return parseFloat(sValue).toFixed(2);
			},
			
			/**
			 * Formats an address to a static Google Maps Image
			 * @public
			 * @param {string} sStreet The Street
			 * @param {string} sZIP The Postal Code
			 * @param {string} sCity The City
			 * @param {string} sCountry The Country
			 * @returns {string} sValue A Google Maps URL that can be bound to an image
			 */
			 formatMapUrl: function(sStreet, sZIP, sCity, sCountry) {
	
			     return "https://maps.googleapis.com/maps/api/staticmap?zoom=13&size=640x640&markers=" +
			        jQuery.sap.encodeURL(sStreet + ", " + sZIP + ", " + sCity + ", " + sCountry);
	        
			 }

		};

	}
);