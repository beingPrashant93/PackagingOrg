import { LightningElement,wire,track,api} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import myResource from '@salesforce/resourceUrl/iahelp__IHResources';
import getTools from '@salesforce/apex/iahelp.ControllerLUXOps.getTools';
import getStoredProfileLayouts from '@salesforce/apex/iahelp.ControllerLUXOps.getStoredProfileLayouts';
import getObjectInfo from '@salesforce/apex/iahelp.ControllerLUXOps.getObjectInfo';
import getAllStoredProfileLayouts from '@salesforce/apex/iahelp.ControllerLUXOps.getAllStoredProfileLayouts';
import chunkAndStoreMetadata from '@salesforce/apex/iahelp.ControllerLUXOps.chunkAndStoreMetadata';
import CCASaveChanges from '@salesforce/apex/iahelp.ControllerLUXOps.CCASaveChanges';
import logLUXInteraction from '@salesforce/apex/iahelp.ControllerLUXOps.logLUXInteraction';
import { loadStyle } from 'lightning/platformResourceLoader';
import IHCard from 'c/ihcard1';
import { publish,subscribe,APPLICATION_SCOPE,unsubscribe,createMessageContext,releaseMessageContext,MessageContext } from 'lightning/messageService';
import messageChannel from '@salesforce/messageChannel/MyMessageChannel__c';
import form_factor from '@salesforce/client/formFactor';
import {doDialogue,getConfigToolForAction,getSupportControlsForConfigTool,getToolBit,Internationalise,processTools} from 'c/ihcard1';
//import fontAwesome from '@salesforce/resource/iahelp__IHResources/lib/FontAwesome463/css/font-awesome.min.css';
export default class Autoform extends IHCard {
    @wire(MessageContext)
    messageContext;
    subscription=null;
    @api recordid_property;
    @api Height;
    @api SuppressHeader=false;
    @api SuppressFooter=false;
    @api SuppressModeTools;
    @api SuppressInlineEdit=false;
    @api DisplayDensity;
    @api DefaultSectionToggleState = 'Expanded';
    @track AllowEdits=false;
    @api InitialSections;
    @api PopulatedFields;
    @api LimitFields;
    @api CalloutOption;
    @api CalloutStyle;
    @api ComponentId;
    @api sobjectname='';// To get object name from design view
    @api LayoutName;
    @api floatbuttonbar=false;
    @api floatbuttonbarw=300;
    @api h_utilitybar=30;
    hasutilitybar=true;
    @api CurrentRecTypeId='';
    @api objectApiName;// To get object name from url
    @api recordId;// To get record id from url
    @track autoformpowerby; 
    //form factor
    @api formfactorval = 1;
    @api browserformfactor='Large';
    @api ihcardAutoform = 'AutoForm';

    @api get recordid(){ // Created because we can't use the above Camelcase name to pass value from IHDetail
        return this._recordid;
      }
      set recordid(value){
          this._recordid = value;
          console.log(' Set recordid '+this._recordid);
      }
    @api list=[];
    @api get formfactmobile(){
        return (this.formfactorval==1?true:false);
    }
    @api get formfactdesktop(){
        return (this.formfactorval==3?true:false);
    }
    @api get modeToAlwaysOpenEdit(){
        return (this.objname!='undefined' && this.objname!='' && this.objname!=null?false:true)
    };
    @api get ButtonBarContainerclass(){
        return (this.floatbuttonbar == true ? 'ButtonBarContainerFloating' : 'ButtonBarContainerFixed');
    }
    @api get ButtonBarclass(){
        return (this.floatbuttonbar == true ? 'slds-theme_shade slds-p-vertical_x-small ButtonBar ButtonBarFloating' : 'slds-theme_shade slds-p-vertical_x-small ButtonBar ButtonBarFixed');
    }
    @api get ButtonBarstyle(){
        return (this.floatbuttonbar == true ? 'width: ' + this.floatbuttonbarw + 'px; bottom: ' + this.h_utilitybar + 'px;' : '');
    }
    @api get UtilityBarShimclass(){
        return (this.floatbuttonbar == true && this.hasutilitybar == true ? 'slds-theme_shade ButtonBarUBShimFloating' : 'slds-theme_shade ButtonBarUBShimFixed');
    }
    @api get UtilityBarShimstyle(){
        return (this.floatbuttonbar == true && this.hasutilitybar == true ? 'width: ' + this.floatbuttonbarw + 'px;' : '');   
    }
    @api get mtool() { return ('color: #' + this.uxthemecolour3 + ';')};
    @api ocode='';
    @api olabel='';
    @api CurrentFieldName='';
    @api currentIframe='';
    @api componentholder=''; // To check if the Autoform is in IHDetail because if it is in Detail then we have to assign blank value to objname & LayoutName
    @api get objname(){
        return this._objname;
      }
      set objname(value){
          this._objname = value;
          console.log(' Set objname '+this._objname);
      }  
    @api OnSaveAction
    lName='';
    res='';
    @track mode=false; // To control view mode, if it is "false" then view mode is "On" otherwise "Off"
    @track CurrentHTID="";
    @track url2;
    @api get saveBtnTitle(){
        return this.ButtonSave+' '+this.objname
    };
     err;
     Resu;
    helpLogo = myResource + '/img/IconHelpedElement.png';

    @api get OpMode(){
        return this._OpMode;
    }
    set OpMode(value){
        this._OpMode = value;
        this.setOpModeStyling();
    }
    @track OpToolTip;
    //@api OpStyle="";
    @api get OpStyle(){
        return this._OpStyle;
    }
    set OpStyle(value){
        this._OpStyle = value;
        this.list=this.manipulateStyleClass(this.list);
    }
    @track OpModeIconClass='IHClickHelper fa fa-question-circle';
    @api get styleDiv(){ return (this.DisplayDensity+'Analogue full forcePageBlock forceRecordLayout')};
    @api get styleform(){ return ('IHAutoForm DataModeView ' + this.OpMode)};
    @api modecls='slds-hide';
    @api saveaction='Navigate to record';
    @track staticVariable = false;
    modifiedlist = [];
    @track calldetail;
    
    connectedCallback(){ 
        this.title='';
        this.OpToolTip=this.TitleHelpedElement;
        this.reInitialise();
				this.autoformpowerby=false;

        this.browserformfactor = form_factor;
       
        switch (this.browserformfactor){
            case 'Small':
                this.formfactorval=1;
                break;
            case 'Medium':                         
               this.formfactorval=2;
                break;                                              
            case 'Large':                                                                
               this.formfactorval=3;
                break;                                                          		                                                                                                                                
         }
     
                         
    }
    renderedCallback(){
        if(this.recordId=='' || this.recordId+''=='undefined'){
            this.gotoEditMode();
        }
    }
    @api
    reInitialise(){
        this.isbusy = true;
        if(this.recordId==null || this.recordId=='' || this.recordId+''=='undefined'){
            this.recordId = this.recordid;
        }
        this.handleSubscribe(); 
        this.ihcardtype='AutoForm';
        this.cardcomponentid=this.ComponentId;
        try{ 
            this.cardsuppressheader=this.SuppressHeader; 
            this.cardsuppressfooter=this.SuppressFooter;
            if(this.objname!='' && this.objname+''!='undefined'){
                this.objname='iahelp__'+this.objname;
            }
            var tmp=this.objname;  // Needed when Autoform is inside IHDetail  
            getStoredProfileLayouts({
                RecordTypeId : '',
                    RecordId : this.recordId,
                    ObjectName : tmp
                    }).then(result => {
                        this.Resu = result;
                        if(this.componentholder=='ihdetail'){
                            this.LayoutName='';
                            this.objname='';
                        }
                        this.getLayout();
                        this.gTools();
                        this.isbusy = false;
                        // this.err = undefined;
                    }).catch(error=>{
                        this.err = error;
                    // this.Resu = undefined;
                    console.log('Error in getStoredProfileLayouts  '+error);           
                    })                 
                }
        catch(e){
                    console.log(' Error in getStoredProfileLayouts');
        }                       
        this.init();
        Promise.all([
            loadStyle(this, myResource + '/lib/FontAwesome463/css/font-awesome.min.css')
        ]) 
    } 
    init(){
          var Result;
          var err;
            if(this.sobjectname != null && this.sobjectname != '' && this.sobjectname != 'undefined'){
                this.objname=this.sobjectname;
            }
            else{
                this.objname=this.objectApiName != null && this.objectApiName != '' && this.objectApiName != 'undefined'?this.objectApiName:'';
            }
      }

 /*******************************************************************************************************************************
  This method is called after call of "getStoredProfileLayouts" method. This is making decision to bring layout name.
  *******************************************************************************************************************************/
    getLayout(){ 
                if(this.LayoutName !== null && this.LayoutName !== '' && this.LayoutName+'' !== 'undefined'){
                    this.lName=this.LayoutName;
                }
                else{
                    var LName;
                    var objSought = this.objname;
                    var objSvr;
                    var customObjId;
                    var profileSought;
                    var currentProfile;
                    var recordTypeSought;
                    var defaultRecordType;
                    var currentRecordType;
                    var i;
                    var obj;
                    var hasAttributes;

                    obj = JSON.parse(this.Resu);
                    // At this stage, we have a collection of objects representing layout to profile / record type assignments.
                    // We also have some name/value pairs added server side recording the profile to seek, plus record type and 
                    // any custom object information: extract these key items here...
            
                    for (i=0; i < obj.length; i++) {
                    
                        // Extract the user's profile ID 
                        if (obj[i].ValueSet == 'LayoutSearchKeys' && obj[i].Name == 'UserProfile') {
                            profileSought = obj[i].Value;
                        }
                        
                        // Ditto record type in play
                        if (obj[i].ValueSet == 'LayoutSearchKeys' && obj[i].Name == 'RecordTypeId') {
                            recordTypeSought = obj[i].Value;
                        }
                        
                        // Ditto DEFAULT record type for the current object type
                        if (obj[i].ValueSet == 'LayoutSearchKeys' && obj[i].Name == 'DefaultRecordTypeId') {
                            defaultRecordType = obj[i].Value;
                        }
                        
                        // Ditto the object API name derived from the record ID passed to server
                        // (should be the same as out sobjectname / objSought - but offered here as a cross-check)
                        if (obj[i].ValueSet == 'LayoutSearchKeys' && obj[i].Name == 'CustomObjectAPIName') {
                            objSvr = obj[i].Value;
                        }
                        
                        // Ditto the custom object ID (ProfileLayout.TableOrEnumId) derived from this object name, if form is for a custom object
                        if (obj[i].ValueSet == 'LayoutSearchKeys' && obj[i].Name == 'CustomObjectId') {
                            customObjId = obj[i].Value;
                        }
                    
                    }
                    console.log('Auto-form initialisation: User Profile sought: ' + profileSought);
                    console.log('Auto-form initialisation: Client-side object name: ' + objSought);				
                    console.log('Auto-form initialisation: Object name located on server: ' + objSvr);				
                    console.log('Auto-form initialisation: Custom Object Id: ' + customObjId);				
                    console.log('Auto-form initialisation: Record sought: ' + this.recordId);				
                    console.log('Auto-form initialisation: Record Type sought: ' + recordTypeSought);				
                    console.log('Auto-form initialisation: Default Record Type for object: ' + defaultRecordType);

                // Use the default type as our current type - 1.43.17+ where relevant!

                // [1] If no other was specified via url or design params (see above - member will have been set)
                if (this.CurrentRecTypeId == '') {	
                
                    // AND [2] If no type was located (including NULL / no type) when sought via stored profile layouts call
                    if (recordTypeSought + '' != 'undefined' && recordTypeSought != '') {
                        // No need to act here - including for deliberate NULL record type
                    } else {
                        this.CurrentRecTypeId = defaultRecordType;
                    }
                }

                    // 1.41.28+ : Fix for communities where sObjectName does not get populated by SFDC!
                // If client side name is blank, use server discovered name for search					
                if (objSought == null || objSought == '' || objSought + '' == 'null' || objSought + '' == 'undefined') {
                    objSought = objSvr;
                    this.sobjectname=objSought;
                    this.objname=objSought;
                //	this.logAdvancedDiags(cmp, 'Auto-form initialisation: Client-side object name was blank - reset to: ' + objSought);
                }
                // Search through configuration data records returned...
                for (i=0; i < obj.length; i++) {

                    try {
                        var s = obj[i].attributes.type;
                        hasAttributes = true;
                    } catch (e) {
                        hasAttributes = false;
                    }

                    if (hasAttributes === true) {				
                        currentProfile = obj[i].ProfileId;
                        currentRecordType = obj[i].RecordTypeId;

                        // Matching criteria depend on whether or not a record type is in play:
                        // Note that, as custom objects store their layout data against a custom object ID,
                        // whereas standard objects store theirs against their object NAME, we need to search 
                        // below for both possibilities...
                        if (recordTypeSought == 'NULL') {
                            if ((obj[i].TableEnumOrId == objSought || objSought.endsWith('__' + obj[i].TableEnumOrId)||obj[i].TableEnumOrId == customObjId) && currentProfile.substring(0, 15) == profileSought) {
                                LName = objSought + '-' + obj[i].Layout.Name;
                                break;
                            }

                        }
                    }
                }    
                    this.lName=LName;    
                }
                if(this.lName+ '' == 'undefined' || this.lName==null || this.lName==''){
                    this.url2='/apex/iahelp__IHLUXOpHandler?Op=1&recordId=' + this.recordId;
                    this.doDialogue('LayoutMetadataSought', 'VF', this.url2, null, 100, false, false, false, true);
                    try{
                        var frm=this.template.querySelector('[data-id="AutoForm"]');
                        if(frm+''!='undefined'){
                        frm.classList.add('slds-hide');
                        frm=this.template.querySelector('[data-id="layoutVFCall"]');
                        frm.classList.remove('slds-hide');
                        }
                    }
                    catch(e){
                        console.log(e);
                    }
                }
                if(this.objname+''=='undefined'){
                    this.objname='';
                }       
        }

  /*******************************************************************************************************************************
  This method is called after call of "getLayout" method. This is used to make server call of getTools method.
  *******************************************************************************************************************************/      
        gTools(){    
                //Method call to getTools
            //    this.isbusy=true;
                // Allow a tool context to be set but default if not provided
                if (this.toolcontext == 'QAM' || this.toolcontext == '[DEFAULT]' || this.toolcontext == '') {
                    this.toolcontext = "CardAutoForm";
                } 
                try{       
                    getTools({ToolContext : this.toolcontext,
                        ActionCode : 'GetForm',
                        IHContext : this.recordId,
                        ClientComponentId : 'Test AF', 
                        Params : this.objname + '^' + this.lName + '^' + 'View' + '^' +this.recordId + '^' + this.DefaultSectionToggleState,
                        SkipGlobals : 'false'})
                        .then(result => {
                           this.res = result;
                            this.error = undefined;
                            this.ihcardtype='AutoForm';
                            this.processTools(result);
                            // Note whether or not editing is allowed for the current object
				            this.AllowEdits = this.currentrecordmetadata.Parameters; 
                            this.list = [];
                            this.list = this.manipulateList(this.cardlistitems[0].Sections);
                            try{
                                var tmp = this.list;
                                this.modifiedlist = this.modifylist(tmp);
                            }catch(e){
                                console.log(e);
                            }
                            this.ellipsistools=this.ellipsistools;
                            this.headertools=this.headertools;
                            this.headertoolsupportcontrols=this.headertoolsupportcontrols;
                            this.footertools=this.footertools;                            
                            this.olabel=this.currentrecordmetadata.Label;
                            this.title=this.olabel;
                            this.ocode=this.currentrecordmetadata.Id;
                            //console.log('currentrecordmetadata==>'+JSON.stringify(this.currentrecordmetadata));
                            this.LayoutName=this.currentrecordmetadata.Title; 
                      
                            
                            // Card title is a function of data mode/operation being undertaken plus object type
                            this.title=this.olabel;
                       //     this.isbusy=false;
                            this.setViewMode();

                    var limitFields = this.LimitFields;	// Instructions to display only certain fields
                    // Check whether we've been asked to show only selected fields
				if (limitFields != '' && limitFields + '' != 'undefined') {
				
					// If so, we will place all fields that are to be shown in a single, pseudo section with set columns etc for display
					var lstIn = this.cardlistitems;
					var lstOut = [];
					var lFlds = limitFields.split(',');
					var L;
					var S;
					var R;
					var Rs = [];
					var i;
					var numCols = 2;
					var currentFld = 0;
					var currentCol = 1;
					
					
					
					// For each field we were asked to show, get its layout item - the object that actually forms 
					// the granular content of each section / column / row... 
					for (i=0; i<lFlds.length; i++) {
						lFlds[i] = this.getIHLI(lFlds[i]);
					}
					
					// As we can't create new objects client-side, perloin the first section that was returned from the server:
					// Empty it out, make sure it's expanded and, as our fields may come from a variety of sections, don't show a section heading
					L = lstIn[0];
					S = L.Sections[0];
					L.Sections = [];
					S.SROOnly = false;
					S.Expanded = true;
					S.Section.detailHeading = false;
					
					
					// ... then add rows to the section as required, each containing items as gathered above:
					// Again, we can't create rows client-side, so 'clone' one of them by parsing into and out of JSON,
					// then clear its items prior to re-population. 
					R = JSON.stringify(S.Rows[0]);
					R = JSON.parse(R);
					R.Items = [];
				
					while (currentFld < lFlds.length) {
						if (currentCol <= numCols) {
							
							// This field may continue on current row:
							// Only process it if we got the underlying layout item, above (if we didn't, this suggests issues 
							// with the requested field - which may not be in the assigned layout etc)
							if (lFlds[currentFld] != null) {
								console.log('Auto form processing limited fields: R' + Rs.length + 'C' + currentCol + 'F' + currentFld + ': ' + lFlds[currentFld].FieldLabel);
								R.Items.push(lFlds[currentFld]);
								currentCol += 1;
								
							} else {
								console.log('Auto form processing limited fields: R' + Rs.length + 'C' + currentCol + 'F' + currentFld + ': field not found on current layout');
							}

							currentFld += 1;
							
							// Push last row if required
							if (currentFld == lFlds.length) {
								Rs.push(R);
							}
							
						} else {
							// Column limit reached: record the row produced, 
							// then prepare a new row by 'cloning' as above
							Rs.push(R);
							R = JSON.stringify(S.Rows[0]);
							R = JSON.parse(R);
							R.Items = [];
							currentCol = 1;			
						}
					}
					
					
					// Having built rows as required, set autoform's listing items to our limited version:
					// Pump the rows obtained into our section... 
					S.Rows = [];	
					for (i=0; i<Rs.length; i++) {
						S.Rows.push(Rs[i])
					}
					
					// ... then pump the section into the layout, layout to form and form to listing items
					L.Sections.push(S);
					lstOut.push(L);
					this.cardlistitems = lstOut;
                    this.list = this.manipulateList(this.cardlistitems[0].Sections);
				}
            }).catch(error=>{  
                console.log(error);
            }); 
        }
        catch(e){
                console.log(e);
        }             
    }
      
    handleLoad(){}
    handleSubmit(evt){
       
        var frm=this.template.querySelector('[data-id="edit"]');
        var frm2=this.template.querySelector('[data-id="sd"]');
        if(frm!=null && frm+''!='undefined')
       
            frm.classList.add('slds-hide');
          
        if(frm2!=null && frm+''!='undefined')
            frm2.classList.remove('slds-hide');    
       
    }
    handleSuccess(evt){
        if(this.recordId==null || this.recordId+''=='undefined' || this.recordId==''){
            this.recordId=evt.detail.id;
        }
        this.resetFieldDirtyFlags(this);
        var act = this.saveaction;		
        
		// Re-set to view mode (allowing save button to be available again)
		//this.OpMode='View';
    	// Feeback to offer depends on control settings
    	switch (act) {
    		case 'Report only' :
    			// Stay put but make record ID known
		    	this.diags="SAVED: ";   

				// Also issue a "data amended" event for any listeners to note				
				var parameters = {SourceComponent:this.cardcomponentid,Parameters:this.helprecordid,ActionCode: 'DataAmended'};
				publish(this.messageContext, messageChannel, parameters);

				// Also, revert to view mode		    		
				this.mode=false;

    			break;
    			
    		case 'Navigate to record' :
    			// Navigate to the affected record
				this[NavigationMixin.Navigate]({
					type: 'standard__recordPage',
					attributes: {
						recordId: this.recordId,
						objectApiName: this.objname,
						actionName: 'view'
					},
				});         	
    			
    			break;
    	}
    }

   /*******************************************************************************************************************************
  This method is called from the pencil icon click in view mode to bring the page in edit mode.
  *******************************************************************************************************************************/  
    gotoEditMode(evt){
        if(evt!='' && evt+''!='undefined'){
            var fld=evt.currentTarget.id;
        }
        else{
            var fld='';
        }
        
        this.mode=true;
        var i;
        var frm=this.template.querySelector('[data-id="edit"]');
        var frm2=this.template.querySelector('[data-id="sd"]');
        if(frm + ''!='undefined' && frm!=null){
            frm.classList.remove('slds-hide');
        }
        if(frm2 + ''!='undefined' && frm2!=null){
            frm2.classList.add('slds-hide');
        }
        
        var frm1=this.template.querySelectorAll('[data-id="inputfield"]');
        frm1.forEach(function (c){
           // console.log(c.id);
           if(c.id==fld){
                i=c;
            }            
        })
        if(i+''!='undefined'){
            i.focus();
        }
        this.setFloatCheckTimer(evt);

    }

    //To get row item from controllerluxops class
    getIHLI(FieldAPIName) {

        var LIS=this.cardlistitems;
		var retVal = null;
		LIS[0].Sections.forEach(function (S){
            if(S!=null && S.Rows!=null){
                S.Rows.forEach(function(R){
                    R.Items.forEach(function(I){
                        if (I.originalitem != null) {
                            if (I.originalitem != null) {
                                if (I.originalitem.Item.field != null) {
                                    if (I.originalitem.Item.field == FieldAPIName) {
                                        retVal = I;                                   
                                    }												
                                }
                            }
                        }
                    });
                });
            }
		});
		return retVal;		
    }
    setIHLI(IHLI) {
	
        var LIS = this.list;
		var i;
		var retVal = false;
		
		LIS.forEach(function (S){
			S.Rows.forEach(function(R){
				i=0;
				R.Items.forEach(function(I){
					if (I != null) {
						if (I.Item != null) {
							if (I.Item.field != null) {
								if (I.Item.field == IHLI.Item.field) {
									R.Items[i] = IHLI;
                                    retVal = true;                                   
								}												
							}
						}
					}
					i+=1;
				});
			});
		});
		this.list=LIS;
		return retVal;		
	}
    // Switches helped element help/unhelp highlight on and off for a given clicked element 
    formFieldAreaClick(evt){
        // Help enable = Toggle element to be helped / unhelped state
    	if (this.OpMode=='HelpEnable') {
	    	this.toggleHighlight(evt);
    	}
    	
    	// Guide enable = Toggle guide prompt editor
    	if (this.OpMode == 'GuideEnable') {
    	
    		// Only show the editor if a guide has been selected
    	//	if (cmp.get("v.CurrentGuide") != '') {
		//    	helper.toggleGuidePromptEditor(cmp, event, helper);
    	//	}
    	}
    }
    toggleHighlight(evt){
        var elem = evt.currentTarget;
        if(elem.getAttribute("data-help")+''=="true"){

            elem.classList.add('IHHelpedSFElement');
        }
		// Check which state the element is in and proceed accordingly:		
		// Unmarked -> ToBeHelped
		if (! elem.classList.contains('ToBeHelped')		&& ! elem.classList.contains('ToBeUnhelped')
			&& ! elem.classList.contains('IHHelpedSFElement')) {
			
			elem.classList.add('ToBeHelped');
		}
		
		// ToBeHelped -> Unmarked
		else if (elem.classList.contains('ToBeHelped')) {	
			elem.classList.remove('ToBeHelped');
		}
		

		// Helped -> ToBeUnhelped
		else if (elem.classList.contains('IHHelpedSFElement')&&
			! elem.classList.contains('ToBeUnhelped')
			) {
			
			elem.classList.add('ToBeUnhelped');		
		}	

		
		// ToBeUnhelped -> Helped
		else if (elem.classList.contains('ToBeUnhelped')) {
			elem.classList.remove('ToBeUnhelped');
		}
		
		
		// Note in diags the numbers of elements to be helped / unhelped
		this.diags = this.getHelpEnablingStats();
    }
    // Prevent the effect of bubbled click events when clicking certain controls
    nullifyClick(evt) {
    	evt.stopPropagation();
    }

    // Provide info about the number of elements currently to be helped / unhelped
    getHelpEnablingStats() {
        
        var retVal;
        var toHelp = 0;
        var toUnhelp = 0;
        var containers = this.template.querySelectorAll('[data-name="FieldContainer"]');

        containers.forEach(function (c) {
            if (c.classList.contains('ToBeHelped')) {
                toHelp += 1;
            }

            if (c.classList.contains('ToBeUnhelped')) {
                toUnhelp += 1;
            }
        });
                
        retVal = this.Internationalise('TitleSubtitleCreatingElements');
        retVal += ': ' + toHelp + ' - ';
        retVal += this.Internationalise('TitleSubtitleDeletingElements');
        retVal += ': ' + toUnhelp;
        
        return retVal;
    }

    // Close any open callout
	closeActiveCallout() {
		var fld = this.CurrentFieldName;
		var cnt = this.currentIframe;	
		if(cnt+'' !='undefined'){
		cnt.classList.add('slds-hide');
        }
		this.CurrentFieldName="";
	//	cmp.set("v.CurrentHTID", "");	
	}

    requestHelp(evt){
        var cnt='';
        var sec;
        var fld1=evt.currentTarget.id;
        var fld=fld1.substring(0,fld1.indexOf('-'));
        var topicId;														// Associated help topic, if any
        var eType; 
        var U;
        var Elem;
        var isError = 0;
        var dlgMap;	

        var I=this.getIHLI(fld);

        // Check whether any error condition is present: note these for later use
		if (I.originalitem.StyleClass.includes('IHHelpedSFElementError')) {
				isError = 1;
		}
	    if (I.originalitem.StyleClass.includes('IHDDFFailElement')) {
				isError = 2;
	    } 	   														// For nubbin positioning
        // If requested FIELD (not topic) appears to be the one we're already on, do nothing / toggle callout only.
	    	if (fld == this.CurrentFieldName) {
				this.toggleCallout(this.currentIframe);
				return;    		
	    	}

        //To get id of row where iframe has been placed
        var iclass='';
        for(var s of (this.cardlistitems[0].Sections)){
            var i=0;
            for(var r of s.Rows){
                for(var k of r.Items){
                    if(k.originalitem!=null && k.originalitem.Item!=null){
                    if (k.originalitem.Item.field == fld) { 
                        sec=r.Id;
                        iclass=k.originalitem.ItemClass
                        break;
                    }
                }
                }
            }
        }

        iclass=iclass.split(' ');
        iclass=iclass[2];
        console.log(iclass)
        switch (iclass) {
            case '1of2':
            case '1of3':
                eType = 'TL0';
                break;
                
            case '1of1':
            case '2of3':
                eType = 'TL1';
                break;

            case '2of2':
            case '3of3':
                eType = 'TR0';
                break;

            default:
                eType = 'T0';
                break;    			
        }
        /*if (topicId == this.CurrentHTID) {
            console.log("-------this.currentIframe--------------------------",this.currentIframe);
	    		this.toggleCallout(this.currentIframe);
                console.log("---------------------------------");
	    		return;
		}*/

        if (isError == 0) {
            // If helped element has a valid topic (not broken / in error condition) obtain details            
            var H=I.originalitem.Topic.iahelp__CalloutHeight__c;
            var Pg= I.originalitem.Topic.iahelp__CalloutTemplate__r.iahelp__PageURL__c;
            topicId=I.originalitem.Topic.Id;
            // Deal with "local" custom templates: with these, we need to remove the "c."
            // namespace (required in classic): see also jsToggleHelp.getTemplateAddress
            if(Pg.indexOf('.') != -1){
                Pg = Pg.split('.');
                Pg = Pg[1];
                } 
            Elem = I.originalitem.Element.iahelp__Identifier__c;
        }
        
        
        if (isError == 1) {
            // Element has missing topic
            if (! confirm(this.Internationalise('[QAMMessageElementConfigurationIssue]'))) {
                return;
            }			
            topicId = 'ConfigIssue_' + I.originalitem.Element.iahelp__Identifier__c;
            Elem = I.originalitem.Element.iahelp__Identifier__c;
        }
        
        
        if (isError == 2) {
            // DDF fail: by definition there is no element, so use info about the underlying field from the layout item
            if (! confirm(this.Internationalise('[QAMMessageDDFNotMatched]'))) {
                return;
            }		
            topicId = 'DDFFail_' + I.originalitem.FieldLabel;
            Elem = I.originalitem.FieldLabel;
        }
        // If we proceed, record details of the relevant field
		this.CurrentHTID = topicId;
        //Setting CurrentFieldName value
        this.CurrentFieldName=fld;
        // Show required item, depending on operational mode:

        // For reconfigure mode, we'll use a dialogue - as opposed to IFRAME/Url or
		// embedded, spun up component
		if (this.OpMode == 'Reconfigure' || isError > 0) {
						
					
		    // In these cases, we want the helped page layout tree provider, filtered
			// to a particular helped element (the one whose reconfigure icon was clicked):
			// Supply this if known:
			var root;
						
			if (I.originalitem.Element + '' != 'null') {
					root = I.originalitem.Element.Id;
							
			} else {
				// If element ID is not known (e.g., DDF fails) supply HPL identifier plus helped element identifier 
				var D1 = ':';
				root = this.ocode + D1 + I.originalitem.FieldLabel;
                var var12 = evt.currentTarget;
                console.log('evt.currentTarget.id===>'+var12);
			}
					
			dlgMap = {
						"PDPositioningGroup": this.ComponentId + '_ReconDlgU1',
						"Height": 595,
						"ColumnRatio": "33%",
						"SuppressHeaders": true, 
						"SuppressFooters": true,
						"ToolContext": "ReconfigureMode",
						"RootNode": root,
						"TreeSuppressListingTools": false,  
						"TreeNodeIconStyle": "Small",
						"TreeNodeProvider": "ServiceIHTrees.TNSHelpedPageLayouts" 
					};
		}        
		// Set frame source to desired callout and move into position...
        if (this.OpMode == 'Statistics') {
            U = '/apex/iahelp__IHStats?IHLUX=true&HTID=' + topicId;	
            H = 145;                        
          
        
        } else if (this.OpMode == 'Reconfigure' || isError > 0) {	
            this.doDialogue('HelpedElementMaintenance', 'LUX', 'iahelp:IHUtility1', dlgMap, 600, false, true, false, true);
            return;
                
        } else {

            // Note parameter to force use of LUX component override in onward (read more) links:
            // Also, if HTID is present, controller will not attempt to use element info for interaction 
            // logging, so withhold that here: use HPL / Element Ident / Element id approach
            
            U='/apex/'+Pg+'?LUXCaller=true&elemType='+eType+'&ElemId='+encodeURIComponent(Elem)+
            '&HPL=' + I.originalitem.Element.iahelp__HelpedPageLayout__r.iahelp__PageLayoutIdentifier__c+
            '&ActiveId=' +  I.originalitem.Element.Id;
        }      			           

        var frm;
        if(this.mode==true)
            frm=this.template.querySelectorAll('[data-id="AutoFormFrame1"]');
        else
            frm=this.template.querySelectorAll('[data-id="AutoFormFrame"]');
         //Hiding all open iframes
        frm.forEach(function (c){
            if(c+''!='undefined'){
            c.classList.add('slds-hide'); 
            }            
        })

         //Unhiding clicked item iframe
        frm.forEach(function (c){

                if((c.id).substring(0,(c.id).indexOf('-'))==sec){
                   var getfieldname = c.getAttribute("data-field");

                   if(getfieldname==I.originalitem.Item.field){
                      cnt=c;  
                   } 
                    
            }
                  
        })
        //Assigning current Iframe value to close spinner
        this.currentIframe=cnt;
        // Add a waiting class to the now active callout:
		// NB - only for VF types as LUX components have their own stencils... 
         if(cnt+'' !='undefined'){    
             console.log('this.CalloutStyle=========>>>',this.CalloutStyle);  
              if(this.CalloutStyle == 'Embedded'){
                cnt.parentNode.classList.add('IHTipPending');
                cnt.height= H+'px';
                cnt.classList.remove('slds-hide');  
                    
                cnt.src=U;
            }
        }

       
        if(this.CalloutStyle == 'Full' && this.OpMode == 'View'){
             
            var baseDomain = window.location.origin;
            var calltoIframe = baseDomain+'/apex/iahelp__IHLUXOutHost?NSApp=iahelp&App=appIH&NSComp=iahelp&Comp=IHDetail&Parms=HelpRecordId~'+topicId+'^ToolContext~CardAutoForm_TopicViewer^SuppressHeader~true^SuppressFooter~true';
            this.recordid_property =topicId;
            this.staticVariable  = true;
            this.toggleCallout(null);
			this.autoformpowerby=true;
            return 
        }

        if(this.CalloutStyle == 'Full'){
            cnt.src=U;
        }
        // else{
        //         this.toggleCallout();
        //      }
       
    }
    toggleFormSection(evt){
        var idx=(evt.currentTarget.id).substring(0,(evt.currentTarget.id).indexOf('-'));
        var Sects=this.cardlistitems[0].Sections;
        if (this.mode+''=='true') {
			if (this.sectionDirty(Sects[idx])) {
				return;
			}
		}
        
        Sects[idx].Expanded=!Sects[idx].Expanded;
        this.cardlistitems[0].Sections=Sects; 
        this.list=this.cardlistitems[0].Sections; 
		// Log an interaction describing the state of all sections
		var desc = '';
		var D1 = String.fromCharCode(7);
		var D2 = String.fromCharCode(5);
		
		Sects.forEach (function (S) {
			desc += S.Section.label + D2;
			desc += S.Expanded + D1;
		});
		
		if (desc.length > 0) {
			desc = desc.substring(0, desc.length -1);
		}
		// Log an interaction describing the state of all sections
        logLUXInteraction({
            iTyp : "18",
            Description : desc,
            IHContext : this.ocode
                }).then(result => {
                    console.log('Log an interaction describing the state of all sections ');
                }).catch(error=>{
                            console.log('Autoform - error logging section expand/collapse status');  
                })

        var frm=this.template.querySelectorAll('lightning-icon');
        var cnt;
        frm.forEach(function (c){
            if(c.id==evt.currentTarget.id)
            {

                    if(Sects[idx].Expanded==true)
                         c.classList.add('nodeExpanded');
                    else
                        c.classList.remove('nodeExpanded');
            
            }              
        })
       
    }
    // Toggle callout open / close state
	toggleCallout(cnt) {
		
		if (cnt == null) {
			// If we're not given a container, assume full screen / dynamic component

		/*	var AFContainer = cmp.find("AFContainer");
			var TVContainer = cmp.find("TVContainer");
			
			//$A.util.toggleClass(AFContainer, 'slds-hide');
			//$A.util.toggleClass(TVContainer, 'slds-hide');

			$A.util.addClass(AFContainer, 'slds-hide');
			$A.util.removeClass(TVContainer, 'slds-hide');*/

            var AFContainerDiv=this.template.querySelector('[data-id="AFContainer"]');
        
            AFContainerDiv.classList.add('slds-hide');
            var TVContainerDiv = this.template.querySelector('[data-id="TVContainer"]');
     
            TVContainerDiv.classList.remove('slds-hide');
            var AFContainerDiv=this.template.querySelector('[data-id="AFContainer"]');
      
            AFContainerDiv.classList.add('slds-hide');
            var TVContainerDiv = this.template.querySelector('[data-id="TVContainer"]');
         
            TVContainerDiv.classList.remove('slds-hide');
           
           var tvc = this.template.querySelector('[data-id="TopicViewer"]');
           //tvc.helprecordid =this.recordid_property;
           tvc.reinit();
			
		} else {
           
            
			// If topic is already in play, toggle visibility where options require this
			// (Otherwise do nothing)

			var opt = this.globalsettings.iahelp__CalloutClosureBehaviour__c;
			if (opt!='2') {
                    if (cnt.classList.contains('slds-hide')) {
                        // If we are given a container, show it
                        cnt.classList.remove('slds-hide');                
                    }
                    else{
                        if(cnt+'' !='undefined'){

                        cnt.classList.add('slds-hide');
                        }
                    }  
             }  
		}
	}
    setDirty(evt){       
        this.isdirty=true;
        var FieldAPIName = (evt.currentTarget.id).substring(0,(evt.currentTarget.id).indexOf('-'));
        var I = this.getIHLI(FieldAPIName);	        
        I.isDirty = true;
        this.setIHLI(I);
        var myVal=this;
        var frm=myVal.template.querySelectorAll('[data-id="EditContainer"]');
        frm.forEach(function (c){
            if(c+''!='undefined'){
            if(c.id==evt.currentTarget.id)
            {

                c.classList.add('Dirty_true');
            
            }   
        }                       
        })
    }
    sectionDirty(Sect) {
		
		var retVal = false;
        if(Sect.Rows!=null){
		Sect.Rows.forEach(function(R){
            if(R.Items!=null){
			R.Items.forEach(function(I){
				if (I != null) {
					if (I.isDirty == true) {
						retVal = true;
					}
				}
            });
        }
        });
    }
		
		return retVal;
    }
    
    doCancel(){
        // Offer a back out if form is dirty
		if (this.isdirty == true) {
			if (! confirm(this.Internationalise('[QAMMessageDirtyWarning]'))) {
				return;
			}
		}	
		
		// Cancellation procedure depends on whether we have a record (editing / viewing etc as opposed to new)
		var rec = this.recordId;
		
		if (rec != null) {
			// If editing, return to the record that was being edited:
			// Nature of returning here depends on settings
			if (this.saveaction == 'Report only') {
			
				// Here, we just want to revert to view mode
				this.datmode = 'View';
				this.mode = false;
                var frm=this.template.querySelector('[data-id="edit"]');
                if(frm!=null &&  frm+''!='undefined'){
                    frm.classList.add('slds-hide');
                }
				// Revert form as a whole and individual fields to clean / unedited				
				this.isDirty = false;
				this.resetFieldDirtyFlags(this);

				this.isInitialised = false;				
				
			} else {
				// Here we want to navigate back to unsaved record
				this[NavigationMixin.Navigate]({
					type: 'standard__recordPage',
					attributes: {
						recordId: rec,
						objectApiName: this.objname,
						actionName: 'view'
					},
				}); 
			}			
			         	
		} else {
			// If on a new record, return to the object listing screen
			   
		}			
    }

    // Set member data that can be used to mark helped elements in various modes (instead of icons)
    setOpModeStyling(){
        switch (this.OpMode) {
			
			case 'Reconfigure':
				this.OpModeIconClass  = 'IHClickHelper fa fa-wrench';
				break;
			
			case 'Statistics':
				this.OpModeIconClass  = 'IHClickHelper fa fa-bar-chart';
				break;
				
			default:
				this.OpModeIconClass  = 'IHClickHelper fa fa-question-circle';
				break;
		}
    }
    handleSubscribe() {
        var msg;
        var msg2;
        var msg3;
        if (this.subscription) {
            return;
        }
        this.subscription = subscribe(this.messageContext, messageChannel, (message) => {  
         this.handlePassThroughs(message);
        },{scope:APPLICATION_SCOPE});
    }
    // Handle pass-throughs - e.g., switch into / out of form definition editing mode
    handlePassThroughs(message) {
        if(message.RecordId==''||message.RecordId+''=='undefined'){
            var act = message.ActionCode;
            var parms = message.Parameters;
            var isModeChange = false;
            var D1 = '^';
            var src = message.SourceComponent;       
        var isModeChange = false;


        if(act=='RLShareLink')
        {
        var link = window.location.origin+'/';
        var myArray = parms.split(",");
        var msg = 'Please forword the URL shown to share this item';
        var url = link+myArray[0];
        prompt(msg,url);
        }
	//	var GLst = cmp.find('IHAFGuideList');
	//	var sect = cmp.find('GuideList_Section'); 
	//	var twst = cmp.find('GuideList_Twisty'); 
		
		// To avoid some unwanted event propagation, we take note of whether or not we are the AF's own AF / guide listing
	//	var isSubForm = this.ComponentId.startsWith('AFSelectedGuide_');		

		console.log('Autoform "' + this.ComponentId + '" (Data mode = ' + this.mode + ') - pass through received: Source=' + src + ': Action=' + act + ': Parameters=' + parms);


		//.........................................................................
        // In certain cases, only respond to our own control:
        //.........................................................................
		if (this.eventIsOurOwn(message)) {
            
        	switch (act) {

				case 'AFRecordDiags' :
					// Show a message providing some key information about the record and layout being viewed
					var msg = '';
					var CR = '\n';
				
					msg += 'Object Label: ' + this.olabel + CR;
					msg += 'Object API Name: ' + this.objname + CR;
					msg += 'Record ID: ' + this.recordId + CR;
					msg += 'Record Type ID: ' + this.CurrentRecTypeId + CR;
					msg += 'Layout Name: ' + this.lName + CR;
				
					var src = 'ihalert';
			    var aMap = {
			    "Height": -1,   
			    "Title" : "",
			    "Message" : msg,
			    "Image" : "/resource/iahelp__IHSupportMaterials/img/StockImages/013B.svg", 
			    "ToolContext" : "AlertOKOnly",
			    "Style" : "Two Column",
		      "ComponentId" : "AF1"
				   };

				  this.doDialogue('ttl','Alert', src, aMap, -1, false, false, false, false);
					//alert(msg);				
					break;

				case 'AFPersonalFormEdit' :
					// Show panel allowing editing of personal form / favourite fields
					
					
					// Get available field information etc. if we haven't yet done so...						
										
					break;

				case 'AFDensityComfy' :
				case 'AFDensityCompact' :					
					// Set display density as requested
				
			    	// Log a "Display Density" interaction
					var act = cmp.get("c.logLUXInteraction");
						
					break;
        	        						
				case 'AFModePersonalForm' :	
					// Toggle personal form area (as currently defined) on and off:
					// First, exit personal form design mode, if we happen to be in that mode
				
					break;

				case 'AFModeView' :
					
                    // Enter help view operational mode: may need to take action on doing so...	
					if (this.OpMode == 'HelpEnable') {
					
						// On leaving help enable mode, check whether changes were made...
						var toHelp = [];
						var toUnhelp = [];
						var containers = this.template.querySelectorAll('[data-name="FieldContainer"]');
						
						containers.forEach(function (c) {
							if (c.classList.contains('ToBeHelped')) {
								toHelp.push(c);
							}
							
							if (c.classList.contains('ToBeUnhelped')) {
								toUnhelp.push(c);
							}
						});
						
						var elemsC = [];
						var elemsD = [];
						var fld;
						var txtHTID;
						var chkDelTopic;
						var fAPI;
						var HTID;
						var i;		
						var D1 = this.delimiter;
						var CRoot = this.communityroot;
						
						// NOTE: here we must NOT ignore a community root that is blank / sent to us as 'null' - as we
						// need this to be part of page layout ID to differntiate from internal layouts						
						if (CRoot != '') {CRoot += '/';}
									
						// If changes were made, take special action to save them
						if (toHelp.length + toUnhelp.length > 0) {
						
							// Offer a back out of save
							var HEStats = this.getHelpEnablingStats();
							if (! confirm(this.Internationalise('MessageSaveDialogueChanges') + '\n\n' + HEStats)) {
								this.reInitialise();
								return;
							}		        				    		
							
						
							// Extract field names of elements from highlighted items:
							// NB: for this release, help is effectively for "field" type elements only

                            console.log('IHAutoForm: Helping toHelp  ' + toHelp.length+' toUnhelp '+toUnhelp.length);
							for (i=0; i<toHelp.length; i++) {

                                console.log('IHAutoForm: Helping toHelp[i] ' + toHelp[i]);
								// This is the field API name - but we need its label (identifier)...
								fAPI = toHelp[i].getAttribute("data-id");
                                console.log('IHAutoForm: Helping ' + fAPI);
								// ... so look this up in the listing data we were supplied as the form was built							
								fld = this.getIHLI(fAPI);
								fld = fld.originalitem.FieldLabel;	
								
								// Check which topic should be used - if user has specified an existing one
								var tmp=this.template.querySelectorAll('[data-name="_txtExistingTopic"]');
								for(var j=0;j<tmp.length;j++){
								if(tmp[j].getAttribute("data-id")==fAPI){
									txtHTID=tmp[j];
									break;
									}
								}
								HTID = txtHTID.value;
								if (HTID == '') {HTID = 'null';}
								console.log('IHAutoForm: associated topic is: ' + HTID);	
								
								elemsC.push(fld + D1 + 'FIELD' + D1 + HTID);
							}


							for (i=0; i<toUnhelp.length; i++) {
								
								// This is the field API name - but we need its helped element record id... 
								// ... so look this up in the listing data we were supplied as the form was built
								// Also note associated help topic
                                console.log('IHAutoForm: Helping toUnhelp[i] ' + toUnhelp[i]);
								fAPI = toUnhelp[i].getAttribute("data-id");
                                console.log('IHAutoForm: UnHelping ' + fAPI);
								fld = this.getIHLI(fAPI);
								
								// Check whether we're deleting the associated topic
								var tmp2=this.template.querySelectorAll('[data-name="_ChkDeleteTopic"]');
								for(var j=0;j<tmp2.length;j++){
                                    var c=tmp2[j].getAttribute("data-id");                         
								    if(tmp2[j].getAttribute("data-id")==fAPI){
                                        chkDelTopic=tmp2[j];
                                        break;
									}
								}
								HTID = 'null';							
								if (chkDelTopic.checked == true) {
									if (fld.originalitem.Topic + '' != 'undefined') {
										HTID = fld.originalitem.Topic.Id;
									}
								}

								fld = fld.originalitem.Element.Id;
								elemsD.push(fld + D1 + HTID);

								console.log('IHAutoForm: Un-helping ' + fld);	
								console.log('IHAutoForm: Topic to delete: ' + HTID);	
							}
                      
						    CCASaveChanges({
								RecordId : this.recordId,
								oCode : CRoot + this.ocode,
								Opts : "1",
								elemsC : elemsC,
								elemsD : elemsD}).then(result => {
							//	if (result!=null && result+''!='undefined') {            
        
					        	// On completion, re-initialise form if successful and report results
					        		this.reInitialise();
								//	this.reportResults(cmp, this, response.getReturnValue());					        		
					        		
					       // 	} else {
					       // 		this.diags = "ERR!";
					      //  	}
					        	
							});
							
						}
					}
					
					
/*					if (this.OpMode == 'GuideEnable') {
			            // On leaving guide enable mode, offer back-out if dirty prior to switching mode, which will lose changes
			            if (this.isGuideDirty == true) {
			        		if (confirm(this.Internationalise('[QAMMessageDirtyWarning]')) == false) {
			                    return;
			                }
			            }
					
			            // On leaving guide enable mode, hide any prompts
						var prompts = cmp.find("GuidePromptEditor");
						prompts.forEach(function (P){
							P.classList.add('slds-hide');
						});
							
							
						// Set all guide prompts to view mode
						var promptCtls = cmp.find("GuidePromptCtl");
						promptCtls.forEach(function (P){
							this.OpMode = "View";
						});
						

						// Re-set to no selected guide
						this.CurrentGuide, '';
						this.setSelectedRow(GLst, '');		    		
						
						// Close guides accordion
						sect.classList.remove('slds-is-open');
						twst.classList.remove('nodeExpanded');


						// Revert to respecting user's choice of form section toggles		
						this.SuppressSectionToggles = false;


						// Re-set form
						this.initialiseForm(cmp, event);
					}*/
					
					// Re-set to view mode, whether or not we had to fully re-initialise form
					this.setViewMode();		
					isModeChange = true; 
					break;

				case 'AFModeStatistics' :	
					// Enter stats operational mode
					this.OpMode = "Statistics";
					this.OpStyle = "IHHelpStats";	
					this.OpToolTip = this.Internationalise("TipStatistics");			
					isModeChange = true;		
					break;

				case 'AFModeReconfigure' :	
					// Enter re-configure operational mode
					this.OpMode = "Reconfigure";
					this.OpStyle = "IHHelpRecon";	
					this.OpToolTip = this.Internationalise("TipReconfigure");			
					isModeChange = true;	
					break;

				case 'AFModeHelpEnable' :	
					// Enter Help Enable operational mode
                    this.OpMode = "HelpEnable";
			        this.OpStyle = "HelpableSFElement";	
					this.OpToolTip = "";			
					isModeChange = true;	
                    this.modecls="HETools"
					break;

				case 'AFModeGuideEnable' :	
					
					break;	
					
					
                case 'AFRefreshMetadata' :
                case 'AFRefreshMetadataAllRTypes' :
                    // Delete, then re-obtain, layout assignment metadata for the current context / object:
                    // Do this optionally for all record types, differentiated by action code...
                    
                    var objSvr = '';
                    var customObjId = '';
                    var objSought = '';
                    var recTypeSought = '';
                    var currentRType;
                    var obj;
                    var objOut = [];
                    var JSONOut;
                    var deletedCount = 0;
                    var i;
				
				
			
			  // Call 1: get object data for current record  
			    getObjectInfo({
					RecordId : this.recordId}).then(result => {
					if (result!=null && result+''!='undefined') {
							
						try {			
							obj = JSON.parse(result);
							
							// At this stage, we have a collection of name / value pairs representing
							// object information (object API name, custom object ID, record type ID): extract these key items here...
					
							for (i=0; i < obj.length; i++) {
							
								// Object API name derived from the record ID passed to server
								// (should be the same as out sObjectName / objSought - but offered here as a cross-check)
								if (obj[i].ValueSet == 'LayoutSearchKeys' && obj[i].Name == 'CustomObjectAPIName') {
									objSvr = obj[i].Value;
								}
								
								// The custom object ID (ProfileLayout.TableEnumOrId) derived from this object name, if form is for a custom object
								if (obj[i].ValueSet == 'LayoutSearchKeys' && obj[i].Name == 'CustomObjectId') {
									customObjId = obj[i].Value;
								}
								
								// Record type
								if (obj[i].ValueSet == 'LayoutSearchKeys' && obj[i].Name == 'RecordTypeId') {
									recTypeSought = obj[i].Value;
									console.log('Auto-form metadata refresh: record type (where relevant): ' + deletedCount);

									// A return of 'NULL' means no type info was found for one of several reasons:
									// Adjust this here to resemble what we'll find in stored layout JSON
									if (recTypeSought == 'NULL') {recTypeSought = 'null';}									
								}
								
							}
							
							console.log('Autoform - metadata refresh: affected object = "' + objSvr + '"');
							console.log('Autoform - metadata refresh: custom object ID = "' + customObjId + '"');
							
										
							if (objSvr == '') {
								// If we get no info about the object we are on, we cannot refresh its metadata
								alert(this.Internationalise('MessageGenericError') + ' (Autoform - metadata refresh): Info call returned no object details');
								return;
							}
							
							// When we get currently stored metadata, we will be looking to delete records for a "TableOrEnumId":
							// Set this here, depending on whether current object is custom...
							if (customObjId != '') {
								objSought = customObjId;
							} else {
								objSought = objSvr;
							}
							
							// Call 2: get all stored metadata records
							// If we get this far, we can continue to request all currently stored layout metadata...
							getAllStoredProfileLayouts().then(result => {
							if (result!=null && result+''!='undefined') {
									
						            try {
						            	// Turn this to objects
										obj = JSON.parse(result);			
										console.log('Autoform - metadata refresh: object sought in profile layouts = "' + objSought + '"');
										console.log('Autoform - metadata refresh: all stored profile layouts count = ' + obj.length);
										
										// Delete records for current object, all or only for current record type depending on requested action
										for (i=0; i < obj.length; i++) {
										
											if (obj[i].TableEnumOrId != objSought) {
												// Current metadata row is NOT for the object being refreshed: Keep this record
												objOut.push (obj[i]);
												
											} else {
												// Object metadata in this record applies to the object we're interested in
												// Check by record type if required:

												if (act == 'AFRefreshMetadataAllRTypes') {
													// If refreshing ALL types for the current object, delete with no further checks:
													// Fail to keep / mark as deleted
													deletedCount += 1;	
													
												} else {												
													// If NOT (delete only current type), check record type one is on here
													currentRType = obj[i].RecordTypeId;
													
													if (currentRType == null) {
														currentRType = 'null';
													}
													if (currentRType.length > 15) {
														currentRType = currentRType.substring(0,15);
													}
										
													if (currentRType == recTypeSought) {
														// If this is the desired record type, delete: 
														// Fail to keep / mark as deleted
														deletedCount += 1;
												
													} else {
														// Keep - add to output
														objOut.push (obj[i]);
													}
												}
											}
										}
										
										console.log('Auto-form metadata refresh: ' + deletedCount + ' rows of existing metadata removed prior to overwriting');
			
			
										// Save this JSON back
										JSONOut = JSON.stringify(objOut);
										
										// Call 3: save amended metadata record
										chunkAndStoreMetadata({
										MetadataJSON : JSONOut,
										MetadataType : 'GetSFPageLayouts'})
										.then(result => {
											if (result!=null && result+''!='undefined') {
			
												// Then, use VF page, as above, to get and store metadata for this object
												console.log('Auto-form metadata refresh: configuration deleted - summoning VF page to recreate...');
												
												var CRoot = this.communityroot;								// Community info, if required

												// If root is 'null', this can be ignored in most cases
												if (CRoot + '' == 'null') {CRoot = '';}
												if (CRoot != '') {CRoot = '/' + CRoot;}    	

												/*
												ADDED A FURTHER OP HERE, BASED ON EXISTING OP=1:
												IF DELETING CURRENT TYPE ONLY, CARRY ON WITH OP1
												IF DELETING ALL TYPES, OP3 MUST DIFFERENTIATE ON SERVER TO GET ALL TYPES
												*/											 	
												var src;
												if (act == 'AFRefreshMetadataAllRTypes') {
													src = CRoot + "/apex/iahelp__IHLUXOpHandler?Op=3&recordId=" + this.recordId;
												} else {
													src = CRoot + "/apex/iahelp__IHLUXOpHandler?Op=1&recordId=" + this.recordId;
												}

			
												// NB: we should already have the translation code here as this was on the tool clicked to get to this point
												this.doDialogue('AFRefreshMetadata', 'VF', src, null, 100, false, false, false, true);
											
											} else {
												// Failure getting all stored profile layouts
												alert(this.Internationalise('MessageGenericError') + ' (Autoform - metadata refresh): chunk and store call: error sending call');
							
											}
										});	// End MDSave / save updated JSON call
										
						            } catch (e) {
										// Error processing layout metadata JSON
										alert(this.Internationalise('MessageGenericError') + ' (Autoform - metadata refresh): get stored profile layouts call - Error parsing the following return value (' + e + '): ' + response.getReturnValue());
			
						                return;
						            }
									
								} else {
									// Failure getting all stored profile layouts
									alert(this.Internationalise('MessageGenericError') + ' (Autoform - metadata refresh): get stored profile layouts call: error sending call');
							
								}
								
						    
						    });	// End MDCall / metadata seeking callback
			
							
						} catch (e) {
							// Error processing return of object info call
							alert(this.Internationalise('MessageGenericError') + ' (Autoform - metadata refresh): get object info call - Error parsing the following return value (' + e + '): ' + response.getReturnValue());
			
						}
					
					} else {
						// Failure getting object info
						alert(this.Internationalise('MessageGenericError') + ' (Autoform - metadata refresh): get object info call: error sending call');
								
					}
				
				
				});	// end objInfo / object info callback
				break; 
	
			}
			
			
			// On any mode change, hide any open callout container and "forget" current field as we'll need to 
			// navigate frame in all cases
			if (isModeChange == true) {
                this.closeActiveCallout();
            }
		}	// End if source is ourselves
		
		
		//.........................................................................
		// In some cases, respond to our child components: individual guide prompts
		//.........................................................................

		
	
		//.........................................................................
		// In some cases, respond to our child components: guide selection list
		//.........................................................................

		//.........................................................................
		// In some cases, respond to our child components: topic viewer
		//.........................................................................
		//console.log('src',src);
       // console.log('this.componentId',this.ComponentId);
	//	if (src == 'AFTopicViewer_' + this.ComponentId) {
			switch (act) {

			    case 'BackToAF':
                    console.log('inside BackTOAF');
                    this.autoformpowerby=false;
			    	// Hide topic viewer being used to show embedded topic / 'callout' and return to auto form
					
                    var AFContainerDiv=this.template.querySelector('[data-id="AFContainer"]');
                    var TVContainerDiv = this.template.querySelector('[data-id="TVContainer"]');
                   
                    TVContainerDiv.classList.add('slds-hide');
                    AFContainerDiv.classList.remove('slds-hide');
                   
			    	break;
	    	}
    //	}
		


		//.........................................................................
		// In some cases, respond if we've been set up to listen:
		// NOTE TO DEVELOPERS: USE THIS OPTION SPARINGLY!
		// REMEMBER THAT AF IN UTILITY1 IS PART OF IHDETAIL; THE LATTER
		// WILL BE 'TOLD' WHAT TO LISTEN TO BY THE FORMER
		//.........................................................................
		
	
		//.........................................................................
		// In some cases, respond without initial filtering
		// This may be needed because page owner cannot make the form 'listen' 
		//.........................................................................

		
		
		// Respond to non-field elements (e.g., position detectors) who advise that they are available to participate in a guide
        
		
	}
}

/************************************************************************************************************************************
 * This method is being called after process tools to add extra metadata(Sec.ItemClass). This returns listItems array.
*************************************************************************************************************************************/
manipulateList(list){
    var tmp=this; // Storing this reference
    if(list!=null){
		list.forEach(function(S){
            if(S.ColumnCount!=null && S.ColumnCount!=''){
                S.ItemClass='slds-col slds-medium-size_1-of-'+S.ColumnCount+' slds-small-size--1-of-1';
            }
            if(S.Section.detailHeading==false){
                S.Expanded=true;
            }
       /*     if(S.Rows.length > 0 && (this.mode==false || (this.mode==true && S.SROOnly == false))){              
                S.hasRows
             }
            else{
                S.ItemClass='slds-hide';
            }*/
            if(S!=null){
                    S.Rows.forEach(function(R){
                        if(R!=null){
                            var c=0;
                            R.Items.forEach(function(I){
                                if(I!=null){
                                c++;
                                I.ItemClass='slds-col slds-size_10-of-12 ';
                                I.HelpAvailable ? I.ItemClass+=c+'of'+R.Items.length:I.ItemClass+='';   
                              //  console.log(I.IsEditableLocally+' tmp.AllowEdits '+tmp.AllowEdits==true+' tmp.SuppressInlineEdit '+tmp.SuppressInlineEdit == false); 
                                I.IsEditableLocally =  (I.IsEditableLocally && tmp.AllowEdits == 'true' &&
                                                 tmp.SuppressInlineEdit == false) ;   
                              //  console.log('I.IsEditableLocally '+I.IsEditableLocally);                      
                                }
                            })
                        }
                    })
                }
            });
        }
        
    return list;
}

// modifylist(listcopy){
//     var tempcopy = listcopy;
//     tempcopy.forEach(function(S){
//         if(S!=null){
//                 S.Rows.forEach(function(R){
//                     if(R!=null){
//                     var modifieditems1 = [];
//                     var temp1
//                     try{
//                         temp1 = {"originalitemlist" : R, "rowslen" : R.Items.length==1?true:false};
//                         }catch(e){
//                         temp1 = {"originalitem" : R,"rowslen" : ''};
//                         }
                       

//                     if(temp1.originalitemlist!=null || temp1.originalitemlist!= 'undefined'){
//                         //if(R!=null){
//                         var modifieditems = [];
//                         temp1.originalitemlist.Items.forEach(function(I){
//                             try{
//                             var temp = {"originalitem" : I, "createdbyidcheck" : I.Item.field == 'CreatedById', "modifiedbyidcheck" : I.Item.field == 'LastModifiedById',
//                                         "class1" : I.Item==null?false:true, "class2" : '',"colcount" : I.ColumnCount==1?true:false};
//                             }catch(e){
//                                 var temp = {"originalitem" : I, "createdbyidcheck" : '', "modifiedbyidcheck" : '',
//                                 "class1" : false, "class2" : ''};
//                             }
//                             modifieditems.push(temp);
//                         })
//                         temp1.originalitemlist.Items = modifieditems;
//                        // R.Items = modifieditems;
//                     }
//                     modifieditems1.push(temp1);
//                 }
//                 })
               
//                 S.Rows = modifieditems1;
              
//             }
//         });
// console.log('In modifylist ');    
// console.log(tempcopy);
//         return tempcopy;
// }

modifylist(listcopy){
var tempcopy = listcopy;
tempcopy.forEach(function(S){
    if(S!=null){
            S.Rows.forEach(function(R){
                if(R!=null){
                    var modifieditems = [];
                    
                    var c=0;
                    
                        R.Items.forEach(function(I){
                        
                        if(I!=null){
                        c++;
                    
                        try{
                        var temp = {"originalitem" : I, "createdbyidcheck" : I.Item.field == 'CreatedById', "modifiedbyidcheck" : I.Item.field == 'LastModifiedById',
                                    "class1" : I.Item==null?false:true, "class2" : '',"colcount" : c==1?true:false};
                        }catch(e){
                            var temp = {"originalitem" : I, "createdbyidcheck" : '', "modifiedbyidcheck" : '',
                            "class1" : false, "class2" : ''};
                        }
                        modifieditems.push(temp);
                    }
                    })
                R.Items = modifieditems;
                    
                }
            })
        }
    });
//console.log('In modifylist ');    
//console.log(tempcopy);
    return tempcopy;
}

/************************************************************************************************************************************
 * This method is being called in change handler of Opmode to add extra metadata(I.StyleClass). This returns listItems array.
*************************************************************************************************************************************/
manipulateStyleClass(list){
    var tmp=this;
   
        if(list!=null){
            list.forEach(function(S){              
                //if(S!=null){
                        S.Rows.forEach(function(R){
                            //if(R.Items!=null){
                                var c=0;
                                R.Items.forEach(function(I){
                                   
                                    if(I.originalitem!=null){
                                        var str=I.originalitem.StyleClass;
                                                if(str!=null){
                                                    str=str.replace(tmp.OpStyle,'');
                                                        str=str.replace(' IHHelpRecon ','');
                                                        str=str.replace(' IHHelpedSFElement ','');
                                                        str=str.replace(' HelpableSFElement ','');
                                                }
                                                I.originalitem.StyleClass = str;
                                                str=I.originalitem.StyleClass;
                                                if(tmp.OpMode=='Reconfigure'){
                                                    if(I.originalitem.HelpAvailable){ 
                                                    str+=' IHHelpedSFElement '+tmp.OpStyle+' ';
                                                    I.originalitem.StyleClass=str;
                                                    
                                                    } 
                                                    }
                                                    else if(tmp.OpMode=='HelpEnable'){
                                                    if(I.originalitem.HelpAvailable==false){ 
                                                    /*str+=' '+tmp.OpStyle+' ';
                                                    console.log('str='+str);
                                                    I.originalitem.StyleClass=tmp.OpStyle;
                                                    console.log('Inside Helpvil');*/
                                                    //I.originalitem.StyleClass =' IHHelpedSFElement HelpableSFElement ';
                                                    str+='HelpedSFElement '+tmp.OpStyle+' ';
                                                    I.originalitem.StyleClass=str;
                                                    
                                                    } 
                                                    }
                                        else{                                         
                                                    str+=' '+tmp.OpStyle+' ';
                                                    I.originalitem.StyleClass=str;
                                                    //I.originalitem.StyleClass =' IHHelpedSFElement HelpableSFElement ';
                                        }                                                             
                                    }
                                   
                                })
                                
                            //}
                        })
                    //}
                });
            }
            
            return list;
}
 // Hide waiting spinner on frame load completion
 hideIframe (cnt) {
    if(cnt+'' !='undefined'){
    cnt.classList.add('slds-hide');
    }
}

 // Hide waiting spinner on frame load completion
 hideTipBusy () {
    if(this.currentIframe+''!='undefined' && this.currentIframe.parentNode+''!='undefined'){
        this.currentIframe.parentNode.classList.remove('IHTipPending');
    }
}

// Removes dirty flags from all fields on the form
resetFieldDirtyFlags(myVar) {    
    var LIs = myVar.list;
    
    LIs.forEach(function (S){
        S.Rows.forEach(function(R){
            R.Items.forEach(function(I){
                if (I != null) {
                    I.isDirty = false;
                }
            });
        });
    });
    
    // Save any amendments back to member data
    myVar.list = LIs;		

    var frm=this.template.querySelectorAll('[data-id="EditContainer"]');
        frm.forEach(function (c){           
                c.classList.remove('Dirty_true');                   
        })

}    

// Hide callout on mouse out if required
    tipMouseOut(){
        if (this.currentIframe == '') {
			
		} else {
			// If topic is already in play, toggle visibility where options require this
			// (Otherwise do nothing)

			var opt = this.globalsettings.iahelp__CalloutClosureBehaviour__c;
			if (opt!='1') {
                    if (this.currentIframe.classList.contains('slds-hide')) {
                        // If we are given a container, show it
                        this.currentIframe.classList.remove('slds-hide');                
                    }
                    else{
                        if(this.currentIframe+''!='undefined')
                        this.currentIframe.classList.add('slds-hide');
                    }  
             }  
		}
    }

    // Provide a means to re-set some key component attributes without the need for a full re-build
    setViewMode(){
		this.OpMode = "View";
		this.OpStyle = "";	
		this.OpToolTip = this.TitleHelpedElement;			
		this.diags = this.Internationalise("TipGenericOK");  
    }

    // Expand / collapse an accordion section - part delegated
    toggleAccordionSection (evt) {
    	var opt = this.toggleAccordion(this, evt.currentTarget.getAttribute("data-id"));
    	
    	if (opt == 'GuideList') {
    		// Initialise guide listing if this has not already been done
    	}
    	
    	if (opt == 'GuideSteps') {
			// Get available field information etc. if we haven't yet done so...											    		
    	}
    	
    }
    setFloatCheckTimer (evt) {

        setInterval(() => {

            try {
                var marker = this.template.querySelector('[data-id="ButtonBarMarker"]');
            
                this.floatbuttonbarw = marker.offsetWidth;
                var YMarker = marker.getBoundingClientRect().top;
	            
	            // Get button bar rendered height
                var bbh = this.template.querySelector('[data-id="ButtonBar"]').offsetHeight;

                var YMax = window.innerHeight - this.h_utilitybar;
	             
	            // Float if marker adjusted for button bar height is below this
	           
                this.floatbuttonbar = YMarker + bbh > YMax;

            } catch (e) {
                
            }

        }, 500);	

    }
}