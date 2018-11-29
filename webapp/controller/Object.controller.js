/*global location*/
sap.ui.define([
		"opensap/manageproductsapp/controller/ObjectModifiable",
		"sap/ui/model/json/JSONModel",
		"sap/ui/core/routing/History",
		"sap/m/MessageBox",
		"sap/m/MessageToast",
		"opensap/manageproductsapp/model/formatter"
	], function (ObjectModifiable, JSONModel, History, MessageBox, MessageToast, Formatter) {
	    
		"use strict";

		return ObjectModifiable.extend("opensap.manageproductsapp.controller.Object", {

			formatter: Formatter,
			_formFragments: [],

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			/**
			 * Called when the worklist controller is instantiated.
			 * @public
			 */
			onInit : function () {

				// Model used to manipulate control states. The chosen values make sure,
				// detail page is busy indication immediately so there is no break in
				// between the busy indication for loading the view's meta data
				var iOriginalBusyDelay,
					oViewModel = new JSONModel({
						busy : true,
						delay : 0
					});

				this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

				// Store original busy indicator delay, so it can be restored later on
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
				this.setModel(oViewModel, "objectView");
				this.getOwnerComponent().getModel().metadataLoaded().then(function () {
						// Restore original busy indicator delay for the object view
						oViewModel.setProperty("/delay", iOriginalBusyDelay);
					}
				);
				
				this._showFormFragment("ObjectDisplay");
				
			},

            onAfterRendering: function() {
                this._initArrays();
                this._populateVHArrays();
            },
            
			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */


			/**
			 * Event handler  for navigating back.
			 * It there is a history entry we go one step back in the browser history
			 * If not, it will replace the current entry of the browser history with the worklist route.
			 * @public
			 */
			onNavBack : function() {
			    // Check if has pending changes
    		    if(this.getModel().hasPendingChanges()) {
    		        MessageBox.warning(this.getResourceBundle().getText("pendingChangesMessage"), {
    		            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
    		            onClose: this._onNavBackClose.bind(this)
                    });
    		    } else {
                    this._resetView();
                    this._onNavBack();
    		    }
			},
			
			onEdit: function(oEvent) {

                this._toggleEditButtons(true);
                this._showFormFragment("AddSimple");
                
			},

			onSave: function(oEvent) {

			    var oObject = this._oContext.getObject();
			    
                oObject.Price = oObject.Price.toString();
                delete oObject.ToSalesOrderLineItems;
                delete oObject.ToSupplier;
                delete oObject.__metadata;
                
                this.getModel("objectView").setProperty("/busy", true);
			    this.getModel().update(this._oContext.getPath(), oObject, {
			        success: this._onUpdateSuccess.bind(this),
			        error: this._onUpdateError.bind(this)
			    });

			},

			onCancel: function(oEvent) {
    		    // Check if has pending changes
    		    if(this.getModel().hasPendingChanges()) {
    		        MessageBox.warning(this.getResourceBundle().getText("pendingChangesMessage"), {
    		            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
    		            onClose: this._onCancelClose.bind(this)
                    });
    		    } else {
                    this._resetView();
    		    }
			},

			/* =========================================================== */
			/* internal methods                                            */
			/* =========================================================== */

			/**
			 * Binds the view to the object path.
			 * @function
			 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
			 * @private
			 */
			_onObjectMatched : function (oEvent) {

				var sObjectId =  oEvent.getParameter("arguments").objectId;

				this.getModel().metadataLoaded().then( function() {
				    
					var sObjectPath = this.getModel().createKey("ProductSet", {
						ProductID :  sObjectId
					});
					
					this._bindView("/" + sObjectPath);
					
                    if(this.oBusyDialogFlag.objectView)
                        this.oBusyDialog.close();

				}.bind(this));
			},

			/**
			 * Binds the view to the object path.
			 * @function
			 * @param {string} sObjectPath path to the object to be bound
			 * @private
			 */
			_bindView : function (sObjectPath) {
				var oViewModel = this.getModel("objectView"),
					oDataModel = this.getModel();

				this.getView().bindElement({
					path: sObjectPath,
					parameters: {
					    expand: "ToSupplier"
					},
					events: {
						change: this._onBindingChange.bind(this),
						dataRequested: function () {
							oDataModel.metadataLoaded().then(function () {
								// Busy indicator on view should only be set if metadata is loaded,
								// otherwise there may be two busy indications next to each other on the
								// screen. This happens because route matched handler already calls '_bindView'
								// while metadata is loaded.
								oViewModel.setProperty("/busy", true);
							});
						},
						dataReceived: function () {
							oViewModel.setProperty("/busy", false);
                        }
					}
				});
			},

			_onBindingChange : function () {

				var oView = this.getView(),
					oViewModel = this.getModel("objectView"),
					oElementBinding = oView.getElementBinding();

				// No data for the binding
				if (!oElementBinding.getBoundContext()) {
					this.getRouter().getTargets().display("objectNotFound");
					return;
				}

        	    this._oContext = this.getView().getBindingContext();

				var oResourceBundle = this.getResourceBundle(),
					oObject = oView.getBindingContext().getObject(),
					sObjectId = oObject.ProductID,
					sObjectName = oObject.ProductID;

				// Everything went fine.
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
				oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
			},
			
			_showFormFragment: function(sFragmentName) {
			    
			    var oPage = this.byId("page"),
			        oFragment = this._getFormFragment(sFragmentName);
			    
			    oPage.removeAllContent();
			    
			    if(Array.isArray(oFragment)) {
			        oFragment.forEach(function(oContent) {
			            oPage.addContent(oContent);
			        });
			    } else {
			        oPage.addContent(oFragment);
			    }
			    
			},

		    _getFormFragment: function (sFragmentName) {

    			if (this._formFragments[sFragmentName]) {
    				return this._formFragments[sFragmentName];
    			}
                
                this._formFragments[sFragmentName] = sap.ui.xmlfragment("opensap.manageproductsapp.view." + sFragmentName, this);
    			return this._formFragments[sFragmentName];
    			
		    },
		    
		    _toggleEditButtons: function(bMode) {
		        this.byId("edit").setVisible(!bMode);
		        this.byId("save").setVisible(bMode);
		        this.byId("cancel").setVisible(bMode);
		    },
		    
		    _onUpdateSuccess: function() {
                MessageToast.show(this.getResourceBundle().getText("objectUpdated", [this._oContext.getProperty("Name")]));
			    this._toggleEditButtons(false);
			    this._showFormFragment("ObjectDisplay");
			    this.getModel("objectView").setProperty("/busy", false);
			    this.getModel().resetChanges();
		    },
		    
		    _onUpdateError: function(oError) {
                MessageToast.show(this.getResourceBundle().getText("updateErrorMessage", [this._oContext.getProperty("Name")]));
                this.getModel("objectView").setProperty("/busy", false);
		    }
		    
		});

	}
);