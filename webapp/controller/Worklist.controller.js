sap.ui.define([
		"opensap/manageproductsapp/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"opensap/manageproductsapp/model/formatter",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator"
	], function (BaseController, JSONModel, Formatter, Filter, FilterOperator) {
		"use strict";

		return BaseController.extend("opensap.manageproductsapp.controller.Worklist", {

			formatter: Formatter,
            
            _mFilters: {
                cheap: [new Filter("Price", FilterOperator.LT, 100)],
                moderate: [new Filter("Price", FilterOperator.BT, 100, 1000)],
                expensive: [new Filter("Price", FilterOperator.GT, 1000)]
            },
            
			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			/**
			 * Called when the worklist controller is instantiated.
			 * @public
			 */
			onInit : function () {

				var oViewModel,
					iOriginalBusyDelay,
					oTable = this.byId("table");

				// Put down worklist table's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the table is
				// taken care of by the table itself.
				iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
				// keeps the search state
				this._oTableSearchState = [];
                
				// Model used to manipulate control states
				oViewModel = new JSONModel({
					worklistTableTitle : this.getResourceBundle().getText("worklistTableTitle"),
					saveAsTileTitle: this.getResourceBundle().getText("worklistViewTitle"),
					shareOnJamTitle: this.getResourceBundle().getText("worklistViewTitle"),
					shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
					shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
					tableNoDataText : this.getResourceBundle().getText("tableNoDataText"),
					tableBusyDelay : 0,
					cheap: 0,
					moderate: 0,
					expensive: 0
				});
				this.setModel(oViewModel, "worklistView");

				// Make sure, busy indication is showing immediately so there is no
				// break after the busy indication for loading the view's meta data is
				// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
				oTable.attachEventOnce("updateFinished", function(){
					// Restore original busy indicator delay for worklist's table
					oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
				});
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */
            
            /**
             * Event handler when a filter tab gets pressed
             * @param {sap.ui.base.Event} oEvent the filter tab event
             * @public
            */
            onQuickFilter: function(oEvent) {

                var sKey = oEvent.getParameter("key"),
                    oFilter = this._mFilters[sKey],
                    oTable  = this.getView().byId("table"),
                    oBinding = oTable.getBinding("items");
                
                if(oFilter)
                    oBinding.filter(oFilter);
                else
                    oBinding.filter([]);
                    
            },
            
			/**
			 * Triggered by the table's 'updateFinished' event: after new table
			 * data is available, this handler method updates the table counter.
			 * This should only happen if the update was successful, which is
			 * why this handler is attached to 'updateFinished' and not to the
			 * table's list binding's 'dataReceived' method.
			 * @param {sap.ui.base.Event} oEvent the update finished event
			 * @public
			 */
			onUpdateFinished : function (oEvent) {

				// update the worklist's object counter after the table update
				var sTitle,
					oTable = oEvent.getSource(),
					oModel = this.getModel(),
					oViewModel = this.getModel("worklistView"),
					sQuery = this.byId("searchField").getValue(),
					oFilterBundle = [],
					oFilterArray = [],
					iTotalItems = oEvent.getParameter("total");

				// only update the counter if the length is final and
				// the table is not empty
				if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				    
					sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
					
					// Iterate Filters and request counts from server
				    jQuery.each(this._mFilters, function(sFilterKey, oFilter) {

				        oFilterArray = [];
				        if(sQuery) {
				            oFilterBundle = new Filter({
				                filters: [
				                    oFilter[0],
				                    new Filter("ProductID", FilterOperator.Contains, sQuery)
				                ],
				                and: true
				            });
				            oFilterArray.push(oFilterBundle);
				        } else {
                            oFilterArray = oFilter;
				        }
				           
				        // sap.ui.model.odata.ODataModel
				        oModel.read("/ProductSet/$count", {
				            filters: oFilterArray,
				            success: function(oData) {
				                var sPath = "/" + sFilterKey;
				                oViewModel.setProperty(sPath, oData);
				            }
				        });
				        
				    });
				    	
				} else {
				    
					sTitle = this.getResourceBundle().getText("worklistTableTitle");
					
				}
				
				this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
			},

			/**
			 * Event handler when a table item gets pressed
			 * @param {sap.ui.base.Event} oEvent the table selectionChange event
			 * @public
			 */
			onPress : function (oEvent) {
				// The source is the list item that got pressed
				this._showObject(oEvent.getSource());
			},


			/**
			 * Event handler for navigating back.
			 * We navigate back in the browser historz
			 * @public
			 */
			onNavBack : function() {
				history.go(-1);
			},


			onSearch : function (oEvent) {
				if (oEvent.getParameters().refreshButtonPressed) {
					// Search field's 'refresh' button has been pressed.
					// This is visible if you select any master list item.
					// In this case no new search is triggered, we only
					// refresh the list binding.
					this.onRefresh();
				} else {
					var oTableSearchState = [];
					var sQuery = oEvent.getParameter("query");

					if (sQuery && sQuery.length > 0) {
						oTableSearchState = [new Filter("ProductID", FilterOperator.Contains, sQuery)];
					}
					this._applySearch(oTableSearchState);
				}

			},

			/**
			 * Event handler for refresh event. Keeps filter, sort
			 * and group settings and refreshes the list binding.
			 * @public
			 */
			onRefresh : function () {
				var oTable = this.byId("table");
				oTable.getBinding("items").refresh();
			},
            
            /** Event handler when the add button gets pressed
             * @param {sap.ui.base.Event} oEvent triggered when add button is pressed
             * @public
             */ 
            onAdd: function() {
                
                if(!this.oBusyDialogFlag.addView) {
                    this.oBusyDialog.open();
                    this.oBusyDialogFlag.addView = true;
                }

                this.getRouter().navTo("add");
                
            },
            
			/* =========================================================== */
			/* internal methods                                            */
			/* =========================================================== */

			/**
			 * Shows the selected item on the object page
			 * On phones a additional history entry is created
			 * @param {sap.m.ObjectListItem} oItem selected Item
			 * @private
			 */
			_showObject : function (oItem) {
			    
                if(!this.oBusyDialogFlag.objectView) {
                    this.oBusyDialog.open();
                    this.oBusyDialogFlag.objectView = true;
                }
                
				this.getRouter().navTo("object", {
					objectId: oItem.getBindingContext().getProperty("ProductID")
				});
			},

			/**
			 * Internal helper method to apply both filter and search state together on the list binding
			 * @param {object} oTableSearchState an array of filters for the search
			 * @private
			 */
			_applySearch: function(oTableSearchState) {
				var oTable = this.byId("table"),
					oViewModel = this.getModel("worklistView");
				oTable.getBinding("items").filter(oTableSearchState, "Application");
				// changes the noDataText of the list in case there are no filter results
				if (oTableSearchState.length !== 0) {
					oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
				}
			}

		});
	}
);