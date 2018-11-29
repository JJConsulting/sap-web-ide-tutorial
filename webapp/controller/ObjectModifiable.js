
sap.ui.define(
    [
        "opensap/manageproductsapp/controller/BaseController",
        "sap/m/MessageBox",
        "sap/ui/core/routing/History",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/core/ValueState"
    ],
    
    function(BaseController, MessageBox, History, Filter, FilterOperator, ValueState) {
    
        "use strict";
        
        return BaseController.extend("opensap.manageproductsapp.controller.ObjectModifiable", {
            
            _oValueHelp: {
                currencyInput: {
                    values: [],
                    valueHelpDialog: undefined,
                    fragmentXMLView: "opensap.manageproductsapp.view.CurrencyDialog",
                    filterKey: "Waers",
                    entitySet: "/VH_CurrencySet",
                    active: false
                },
                supplierInput: {
                    values: [],
                    valueHelpDialog: undefined,
                    fragmentXMLView: "opensap.manageproductsapp.view.SuppliersDialog",
                    filterKey: "BusinessPartnerID",
                    entitySet: "/BusinessPartnerSet",
                    active: false
                },
                categoryCombo: {
                    values: [],
                    filterKey: "Category",
                    entitySet: "/VH_CategorySet"
                }
            },

            _sFreeTexts: ["nameInput", "priceInput"],
            _sInputFields: [],
            _sBusyInputField: "",

		    onShowDetailPopover: function(oEvent) {
                
                var oPopover = this._getPopover();
                var oSource = oEvent.getSource();
                
                oPopover.bindElement(oSource.getBindingContext().getPath());
                oPopover.openBy(oEvent.getParameter("domRef"));
                
            },

    		 comboBoxLoadItems: function(oEvent) {
    		     oEvent.getSource().setBusy(true);
    		 },
  
    		 onChangeVHInput: function(oEvent) {
                this._validateInput(this._getInputId(oEvent));
    		 },

    		 handleValueHelp: function(oEvent) {

    		    var sInputValue = oEvent.getSource().getValue(),
    		        sInputId = this._getInputId(oEvent);            

    		    if(!this._oValueHelp[sInputId].valueHelpDialog) {
    		        this._oValueHelp[sInputId].valueHelpDialog = sap.ui.xmlfragment(this._oValueHelp[sInputId].fragmentXMLView, this);
    		        this.getView().addDependent(this._oValueHelp[sInputId].valueHelpDialog);
    		    }
    		     
                this._oValueHelp[sInputId].valueHelpDialog.getBinding("items").filter([
    		        new Filter(this._oValueHelp[sInputId].filterKey, sap.ui.model.FilterOperator.Contains, sInputValue)
                ]);
                
                this._oValueHelp[sInputId].active = true;
                this._oValueHelp[sInputId].valueHelpDialog.open(sInputValue);

    		 },
    		 
    		 onAmountChange: function(oEvent) {
    		     
    		    var sInput = oEvent.getSource().getValue(),
    		        sNewValue = sInput.match(/\d|\,|\./g, "");
    		         
                sNewValue = sNewValue !== null ? sNewValue.join("") : "0.00";
                oEvent.getSource().setValue(sNewValue);
    		     
    		 },

    		/* =========================================================== */
    		/* Private Methods                                             */
    		/* =========================================================== */

            _getPopover: function() {
                // Create Dialog Lazily
                if(!this._mPopover) {
                    
                    // Create Popover via Fragment Factory
                    this._mPopover = sap.ui.xmlfragment("opensap.manageproductsapp.view.ResponsivePopover", this);
                    
                    // Make Responsive Popover dependent in the Main View
                    this.getView().addDependent(this._mPopover);
                    
                }
                
                return this._mPopover;
                
            },
            
            _populateVHArrays: function() {
                
                var that = this;
                
                $.each(this._oValueHelp, function(sKey, oObject) {
                    
                    if(oObject.values.length === 0) {

                        that.getView().getModel().read(oObject.entitySet, {
                            
                            urlParameters: {
                                "$select": that._oValueHelp[sKey].filterKey
                            },
                            
                            success: function(oData) {
                                
                                oData.results.forEach(function(oRecord) {
                                    that._oValueHelp[sKey].values.push(oRecord[that._oValueHelp[sKey].filterKey]);
                                });
                                
                                if(that._sBusyInputField === sKey) {
                                    that.oBusyDialog.close();
                                    that._validateInput(sKey);
                                }

                            }
                        });
                        
                    }
                    
                });

            },
            
            _initArrays: function() {
                
                var that = this;
                
                if(this._sInputFields.length === 0) {
                
                    $.each(this._oValueHelp, function(sKey, oObject) {
                        that._sInputFields.push(sKey);
                    });
    
                    this._sInputFields = $.merge(this._sInputFields, this._sFreeTexts);
                
                }
            },

    		_validateMandatoryInput: function(sInputId) {
    		    
    		    var oElement = this.byId(sInputId),
                    sValue = oElement.getValue(),
                    bError = false;
                    
                    // Check if empty
                    if(sValue) {
                        oElement.setValueState(ValueState.None).setValueStateText();
                    } else {
                        oElement.setValueState(ValueState.Error).setValueStateText(this.getResourceBundle().getText("mandatoryErrorMessage"));
                        bError = true;
                    }
    		    
    		    return bError;
    		    
    		},
    		
    		_removeMandatoryError: function(sInputId) {
    		    
                var oElement = this.byId(sInputId) !== undefined ? this.byId(sInputId) : sap.ui.getCore().byId(sInputId),
    		        sValue = oElement.getValue();
            
                if(sValue)
                    oElement.setValueState(ValueState.None).setValueStateText();
    		         
    		},
    		
    		 _getInputId: function(oEvent) {
                
                var sInputIdLong = oEvent.getSource().getId(),
    		        sInputId = sInputIdLong.substring(sInputIdLong.search(/\w+$/));
    		    
    		    return sInputId;
                  
    		 },
    		 
    		 _getActiveValueHelp: function() {
    		     
    		     var sInputId;
    		     
    		     $.each(this._oValueHelp, function(sKey, oObject) {
    		         if(oObject.active === true) {
    		             sInputId = sKey;
    		             return !oObject.active;
    		         }
    		     });
    		     
    		     return sInputId;
    		     
    		 },
    		 
    		_validateInput: function(sInputId) {
    		    
    		    var oElement = this.byId(sInputId) !== undefined ? this.byId(sInputId) : sap.ui.getCore().byId(sInputId),
    		        sValue = oElement.getValue(),
    		        bError = false;
                
                if(this._oValueHelp[sInputId].values.length === 0) {
                    this._sBusyInputField = sInputId;
                    this.oBusyDialog.open();
                    
                } else {
                
                    if(sValue) {
                    
                        if(this._oValueHelp[sInputId].values.includes(sValue)) {
                            oElement.setValueState(ValueState.None).setValueStateText();
                        } else {
                            oElement.setValueState(ValueState.Error);
                            bError = true;
                        }
    
                    }
                
                }

                return bError;

    		},
    		
    		_validateOnSave: function() {

                // Convert Price to String before sending to backend
                var sPrice = this.byId("priceInput").getValue().toString();
                this.getModel().setProperty("Price", sPrice, this._oContext);
                
                // Validate
                var that = this,
                    bError = false;

                this._sInputFields.forEach(function(sInputId) {
                    bError = that._validateMandatoryInput(sInputId) ? true : bError;
                });

                $.each(this._oValueHelp, function(sKey, oObject) {
                    bError = that._validateInput(sKey) ? true : bError;
                });
                
                return bError;

    		},
    		
    		_cancelView: function() {
                
                var that = this;
                
                // Discard new product model
                this.getModel().deleteCreatedEntry(this._oContext);
                    		    
                // Reset all valuestate of input fields
                this._sInputFields.forEach(function(sInputId) {
                    that._removeMandatoryError(sInputId);
                });    		    

                var oHistory = History.getInstance();
                	    
                if(oHistory.getPreviousHash() !== undefined)
                    history.go(-1);
                else
                    this.getRouter().navTo("worklist", {}, true);

    		},
    		 
    		 _handleValueHelpSearch: function(oEvent) {

    		    var sValue = oEvent.getParameter("value"),
    		        sInputId = this._getActiveValueHelp(),
    		        oFilter = new Filter(this._oValueHelp[sInputId].filterKey, FilterOperator.Contains, sValue);

    		    oEvent.getSource().getBinding("items").filter([oFilter]);
    		     
    		 },
    		 
    		 _handleValueHelpClose: function(oEvent) {

    		     var oSelectedItem = oEvent.getParameter("selectedItem"),
    		         sInputId = this._getActiveValueHelp(),
    		         oInputId = this.byId(sInputId) !== undefined ? this.byId(sInputId) : sap.ui.getCore().byId(sInputId);
    		     
    		     if(oSelectedItem) {
    		         oInputId.setValue(oSelectedItem.getTitle());
    		     }
    		     
    		     oEvent.getSource().getBinding("items").filter([]);
    		     this._oValueHelp[sInputId].active = false;
    		     
    		 },
    		 
			_onNavBackClose: function(sAction) {
			    this._onCancelClose(sAction);
			    this._onNavBack();
			},
			
			_onNavBack: function () {
			    
				var sPreviousHash = History.getInstance().getPreviousHash();

				if (sPreviousHash !== undefined) {
					history.go(-1);
				} else {
					this.getRouter().navTo("worklist", {}, true);
				}
				
			},

		    _onCancelClose: function(sAction) {
		        var that = this;
                if(sAction === MessageBox.Action.YES) {
                    // Reset all valuestate of input fields
                    this._sInputFields.forEach(function(sInputId) {
                        that._removeMandatoryError(sInputId);
                    });
                	this._resetView();
                }    
		    },
		    
		    _resetView: function() {
                this.getModel().resetChanges([this._oContext.getPath()]); 
                this._toggleEditButtons(false);
                this._showFormFragment("ObjectDisplay");
		    }
            
        });
        
});