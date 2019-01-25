sap.ui.define([
        "opensap/manageproductsapp/controller/ObjectModifiable",
        "sap/m/MessageToast",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageBox"
    ] , function (ObjectModifiable, MessageToast, JSONModel, MessageBox) {
        
        "use strict";

        return ObjectModifiable.extend("opensap.manageproductsapp.controller.Add", {
            
    		/* =========================================================== */
    		/* lifecycle methods                                           */
    		/* =========================================================== */
    
    		/**
    		 * Called when the add controller is instantiated.
    		 * @public
    		 */
            onInit: function() {
                
                var oViewModel = new JSONModel({
                        busy: false,
                        delay: 0
                    });
                
                // Register to add route matched
                this.getRouter().getRoute("add").attachPatternMatched(this._onRouteMatched, this);
                
                this._iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
                this.setModel(oViewModel, "addView");

            },
            
            onAfterRendering: function() {
                this._initArrays();
            },

    		/* =========================================================== */
    		/* event handlers                                              */
    		/* =========================================================== */
            _onRouteMatched: function() {
                
                // Register for metadata loaded events
                var oModel = this.getModel();
                oModel.metadataLoaded().then(this._onMetadataLoaded.bind(this));

            },
            
            _onMetadataLoaded: function() {

                // Create default properties
                var oProperties = {
                    ProductID: parseInt(Math.random() * 1000000000, 10).toString(),
                    TypeCode: "PR",
                    TaxTarifCode: 1,
                    Price: "0.00",
                    CurrencyCode: "EUR",
                    MeasureUnit: "EA"
                };

                // Create new entry in the model
                this._oContext = this.getModel().createEntry("/ProductSet", {
                    properties: oProperties,
                    success: this._onCreateSuccess.bind(this),
                    error: this._onCreateError.bind(this)
                });
                
                // Bind the view to the new entry
                this.getView().setBindingContext(this._oContext);
 
                // Populate VH used for validation
                this._populateVHArrays();

                // Hide Close Dialog
                if(this.oBusyDialogFlag.addView) {
                    this.oBusyDialog.close();
                    this.oBusyDialogFlag.addView = false;
                }
                    
               this.getModel("addView").setProperty("/delay", this._iOriginalBusyDelay);

            },
            
            _onCreateSuccess: function(oProduct) {

                this.getModel("addView").setProperty("/busy", false);
                
                // Navigate to the new product's object view
                this.getRouter().navTo("object", {
                    objectId: oProduct.ProductID
                }, true); 
                
                // Unbind the view to not show this object again
                this.getView().unbindObject();
                
                // Show success message
                var sMessage = this.getResourceBundle().getText("newObjectCreated", [oProduct.Name]);
                MessageToast.show(sMessage, {
                    closeOnBrowserNavigation: false
                });
                
            },
            
            _onCreateError: function(oData) {
                this.getModel("addView").setProperty("/busy", false);
                MessageBox.error(this.getResourceBundle().getText("createErrorMessage"));
            },

            onChangeFreeText: function(oEvent) {
                this._validateMandatoryInput(this._getInputId(oEvent));
            },

            /** Event handler for save function
             * @public
             */             
            onSave: function() {

                var bError = this._validateOnSave();
                
                if(!bError) {
                    this.getModel("addView").setProperty("/busy", true);
                    this.getModel().submitChanges();
                } else {
                    MessageBox.error(this.getResourceBundle().getText("createErrorMessage"));
                }
                
            },
            
            /** Event handle for cancel function
             * @public
             */ 
            onCancel: function() {
               this.onNavBack();
            },
            
    		/**
    		 * Event handler for navigating back.
    		 * It checks if there is a history entry. If yes, history.go(-1) will happen.
    		 * If not, it will replace the current entry of the browser history with the worklist route.
    		 * @public
    		 */
    		 onNavBack: function() {

    		    var that = this;
    		    
    		    // Check if has pending changes
    		    if(this.getModel().hasPendingChanges()) {
    		        
    		        MessageBox.warning(this.getResourceBundle().getText("pendingChangesMessage"), {
    		            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
    		            onClose: function(sAction) {
    		                if(sAction === MessageBox.Action.YES) {
                                that._cancelView();
    		                }
    		            }
                    });
    		        
    		    }

    		 }
    		
        });
        
    }

);