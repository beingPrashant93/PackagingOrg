import { LightningElement ,api,wire,track} from 'lwc';
import { publish,subscribe,APPLICATION_SCOPE,unsubscribe,createMessageContext,releaseMessageContext,MessageContext } from 'lightning/messageService';
import messageChannel from "@salesforce/messageChannel/MyMessageChannel__c";

export default class Utility1 extends LightningElement {
    @wire(MessageContext)
    messageContext;
    subscription=null;
    /*
================================================
Member data
================================================
*/    
     @api recordId;
	 @api supportsPopOut = false; 

     @api Height ="-1"; 
     @api SuppressHeaders = false; 
     @api SuppressFooters = false; 
     @api NoDataMessage ="[No Data]"; 
	 @api get ColumnRatio(){
		return this._ColumnRatio;
	  }
	  set ColumnRatio(value){
		  this._ColumnRatio = value;
		  console.log(' Set _ColumnRatio '+this._ColumnRatio);
		  this.setCols();
	  }
	 @api Col1Cols ="6";
	 @api Col2Cols ="6";
	
	 @api FormFactor ="Standard"; 
	 @track HideTree =false; 
	 @track HideTopic =false;
	
     @api RootNode ="";
	 @track RootNodeTree =""; 
	 @track RootNodeTopic ="";
	 @track NumTopicSelects ="0";

     @api ToolContext ="[DEFAULT]";	
	 @track ToolContextTree ="[DEFAULT]"; 	
	 @track ToolContextTopic ="[DEFAULT]";	
	
	 @api Tree =""; 
	 @api Topic ="";

	 @api TreeSuppressListingTools =false;
     @api TreeNodeIconStyle ="None";
	 @api TreeMaxListingTools ="3";    
	   @api TreeDisplayDensity ="Compact";  
     @api TreeMaxDepth =0;	
     @api TreeNodeProvider;
	   @api TreeDDAllowed =false;

     @api PopUtilityBar =false;
   	 @api PDLogContextInteraction =false; 
	   @api PDContextCheckInterval =0; 
     @api PDPositioningGroup ="";
     @api PDHelpRecordId ="";
     @api PDListensTo ="";
		 @api uxtheme='';
	   @api backgroundstyle='Coloured';

	 // Position detector 
	@api Counter ="0";
	@track LastURL = "";
	@track LastContext = "";
	@track ContextCheckTimer ="0";

	 @api get noData(){
		 return (this.RootNode==''?true:false);
	 }
	 @api get noRootTree(){
		return (this.RootNodeTree!='' && this.RootNodeTree!='undefined'?true:false);
	}
	@api get noRootTopic(){
		return (this.RootNodeTopic!='' && this.RootNodeTopic!='undefined'?true:false);
	}
	 @api get treeComponentId(){
		return this.PDPositioningGroup + '_Tree';
	 }
	 @api get treeListensTo(){
		return this.PDListensTo == '' ? this.PDPositioningGroup + '_ParentUtility,' + this.PDPositioningGroup + '_Topic' 
				: this.PDPositioningGroup + '_ParentUtility,' + this.PDPositioningGroup + '_Topic,' + this.PDListensTo
	 }
	 @api get topicComponentId(){
		return this.PDPositioningGroup + '_Topic';
	 }
	 @api get topicListensTo(){
		return this.PDListensTo == '' ? this.PDPositioningGroup + '_Tree' : this.PDPositioningGroup + '_Tree,' + this.PDListensTo;
	 }
	 @api get treeStyleClass(){
		return this.HideTree == true ? 'slds-hide' : 'slds-col slds-p-horizontal_x-small slds-size_1-of-1 slds-small-size_1-of-1 slds-medium-size_' + this.Col1Cols + '-of-12';
	 }
	 @api get detailStyleClass(){
		return this.HideTopic == true ? 'slds-hide' : 'slds-col slds-p-horizontal_x-small slds-size_1-of-1 slds-small-size_1-of-1 slds-medium-size_' + this.Col2Cols + '-of-12';
	 }


     // Set certain sub-component data that is derived from, as opposed to directly linked to, incoming design parameters 
    connectedCallback() {
		this.cardbackgroundstyle=this.backgroundstyle;
		this.carduxtheme=this.uxtheme;
		console.log(' utility root node '+this.RootNode);
		console.log(' utility suppressheaders  '+this.SuppressHeaders);
    	// Differentiate tree and topic tool contexts - unless default has been requested
    	if (this.ToolContext == '[DEFAULT]') {
			this.ToolContextTree =this.ToolContext;
			this.ToolContextTopic =this.ToolContext;
    	} else {
			this.ToolContextTree =this.ToolContext + '_Tree';
			this.ToolContextTopic =this.ToolContext + '_Topic';
    	} 

    
	    // Write changes to the combined component's root node to 
	    // member data that the individual sub-components can use: this acts as a 'one way valve',
	    // so that changes made in sub components (who may use the root for different purposes) do not
	    // cross contaminate
    	this.RootNodeTree =this.RootNode;
    	this.RootNodeTopic =this.RootNode;
    	
    	// Also ensure layout column widths are set
    	this.setCols();


    	// Hide topic viewer initially if in single column form factor
    	if (this.FormFactor == 'Single Column') {
    		this.HideTopic=true;
    	}
    	
    	// Make our underlying tree and topic viewer components available via member data
    	this.Tree =this.template.querySelector('[data-id="UtilTree"]');
    	this.Topic =this.template.querySelector('[data-id="UtilTopic"]');
		this.handleSubscribe();	

    }

	renderedCallback(){
		console.log('renderedCallback '+this.PDContextCheckInterval);
		// Setup context checking timer, if required 
		if (this.PDContextCheckInterval > 0) {
			
			// Only set a timer if one has not already been created
			if (this.ContextCheckTimer == 0) {
			
				this.ContextCheckTimer = setInterval(() =>  {
					
					try {
						var i = this.Counter;
						var U = window.location.pathname;
				//		console.log(' U '+U);
						var cxt;
						
						if (U != this.LastURL) {
						
							// Page address has changed: issue contextualisation message
							// and log interactions as may be required
							
							cxt = this.recordId;
							if (cxt + '' == 'null' || cxt+''=='undefined') {
								cxt = this.getPageContextIdentifier();
							}
		
							console.log('Position Detector "'  + '" URL change from: ' + this.LastURL + ' to: ' + U);
							
							// Only issue a context change message if the actual, derived context (as opposed to the URL) has changed
							if (cxt != this.LastContext) {
								console.log('Position Detector "' + '" derived context changed from: ' + this.LastContext + ' to: ' + cxt + '. Issuing change passthrough...');
		
							/*    var appEvent = $A.get("e.iahelp:evtPassThrough;
								appEvent.setParams({"SourceComponent": this.PositioningGroup});
								appEvent.setParams({"ActionCode": "ContextChange"});
								appEvent.setParams({"Parameters": cxt});
								appEvent.fire();*/
								var passThrough = {ActionCode: "ContextChange",Parameters:cxt,SourceComponent:this.PDPositioningGroup+'_ParentUtility'};
								publish(this.messageContext, messageChannel, passThrough);
								this.LastContext = cxt;
								i = 0;	                    
							}
							
						} else {
							i += 1;
						}
			
						this.LastURL = U;	        	
						this.Counter = i;
						
					} catch (e) {
						// On failure, advise of error, clear the timer but do NOT re-set 
						// our timer member data, as we don't want to re-launch it if there's been any issue
						console.log('Position Detector context check error: ' + e);      
						clearInterval(this.ContextCheckTimer);  
					}
					
				}, this.PDContextCheckInterval);			
			
			}
		}
	}

	// Set sub-component column widths in response to design parameter
	setCols () {
	
		// NB: deal with parameter values as may be passed in LUX Out scenarios: 
		// In these, we will not be able to pass '%' as part of a parameter value, as 
		// this will not be allowed (even if escaped) in a web / URL scenario:
		// Instead, column split can be passed WITHOUT '%' in these cases...
		
		// Split does not apply in single column mode:
		if (this.FormFactor == 'Single Column') {
    		this.Col1Cols ='12';
    		this.Col2Cols ='12';

		} else {
	    	switch (this.ColumnRatio) {
	    		case '33' :
	    		case '33%' :
	    			this.Col1Cols ="4";
	    			this.Col2Cols ="8";
	    			break;
	
	    		case '40' :
	    		case '40%' :
	    			this.Col1Cols ="5";
	    			this.Col2Cols ="7";
	    			break;
	    			
	    		case '50' :
	    		case '50%' :
	    			this.Col1Cols ="6";
	    			this.Col2Cols ="6";
	    			break;	    			
	
				default :
	    			this.Col1Cols ="6";
	    			this.Col2Cols ="6";
	    			break;
			}
		}
		
			
    }
	handleSubscribe() {
		if (this.subscription) {
			return;
		}
		this.subscription = subscribe(this.messageContext, messageChannel, (message) => {
				this.handlePassThrough(message);       
		 //   }
			
			
			
		},{scope:APPLICATION_SCOPE});
	  }
	handlePassThrough(message){
        if(message.RecordId!=null && message.RecordId+''!='undefined'){
          this.selectRecord(message);
        }
		var act = message.ActionCode;
        var parms = message.Parameters;
        var src = message.SourceComponent;

		
		// Switch back to tree having viewed a topic in single column form factor mode		
		if (act == 'BackToTree' && src == this.PDPositioningGroup + '_Topic' && this.FormFactor == 'Single Column') {
				this.HideTopic = true;
				this.HideTree = false;
		}
	}
	selectRecord (message){
		console.log(' In Utility1 selectRecord event --'+message.RecordId);
		var theRecord = message.RecordId;
        var theSource = message.SourceComponent; 
        var cxt = this.ToolContext;
       // var aCode = this.actioncode;
        var listensTo = this.PDListensTo;

		// If selection is from our own tree view and we're in 'single column' form factor display mode,
		// hide our tree and show topic viewer
		console.log(' theSource '+theSource+' PDPositioningGroup '+this.PDPositioningGroup + '_Tree'+' this.FormFactor '+this.FormFactor)
		if (theSource == this.PDPositioningGroup + '_Tree' && this.FormFactor == 'Single Column') {

			// Avoid swapping to topic when first spinning up in single column mode: we want
			// to start by showing the tree - until user selects a tree node
			var numSelects = this.NumTopicSelects;

			if (numSelects > 0) {
				this.HideTree = true;
				this.HideTopic = false;
			}		

			numSelects += 1;
			this.NumTopicSelects = numSelects;
		}
	}

	// Derive a page layout identifier client-side from page address (eg., where record ID not present)
	getPageContextIdentifier() {
	
		var cxt = '';
		
		try {
			cxt = window.location.pathname;
			console.log(' getpagecontext '+cxt);
			cxt = cxt.replace("/lightning/", "");       
			if (cxt.startsWith("page/")) {
			    cxt = cxt.replace("page/", "");
			    }
			else {
				// Assuming an address in the form:
				// [root]/lightning/[single character]/[object or page name]/[further path]
				
			    cxt = cxt.substring(2);
			    if (cxt.indexOf('/') != -1) {
			    	cxt = cxt.substring(0, cxt.indexOf('/'));
			    }
			}  
			
			// Add a marker to show server object identification code that this is a client
			// side derivation of a LUX page address (as these are otherwise hard to differentiate from 
			// other alphanumerics in the absence of APEX or JSP markers etc)			
			cxt = '__LUX__' + cxt;
			console.log('IHCard Helper - derived page context for "' + this.ComponentId + '" is: "' + cxt + '"'); 
			
		} catch (e) {
			console.log('IHCard Helper - error deriving page context: ' + e);
		}
		
		return cxt;
	
	}
}