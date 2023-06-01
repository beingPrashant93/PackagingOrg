import { LightningElement,track,api,wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import getClickablesJSON from '@salesforce/apex/iahelp.ControllerLUXOps.getClickablesJSON';
import { publish,subscribe,APPLICATION_SCOPE,unsubscribe,createMessageContext,releaseMessageContext,MessageContext } from 'lightning/messageService';
import messageChannel from '@salesforce/messageChannel/MyMessageChannel__c';
import resource from '@salesforce/resourceUrl/iahelp__IHResources';

export default class Ihalert extends  LightningElement{

    @wire(MessageContext)
    messageContext;
    subscription=null;

    currentPageReference;
    @api suppresscardui;
    @api message = '';
    @api image;
    @api colstyle = 'Two Column';
    @api alertbodytools;
    @api componentdef = '';
    @api alerttitle;
    @api toolcontext;
    @api backtotree = 'Back to Tree';
    @api height;
    @api modifiedbodytoolsalert=[];
    @api compdef;
    @api togglehistory ='Toggle History';
    // @api backtoTree ='Back to Tree'
    //Globals
	@api ButtonCancel ='';
    @api TipButtonClose ='';
    @api TipGenericCancel ='';
	@api TipGenericOK ='';
    @api SkipGlobals=false;
    @api internationalisations=[];

    @wire(CurrentPageReference) pageRef;
    get currentPageReference(){
        return this.pageRef ? JSON.stringify(this.pageRef) : "";
        
    }

    @api get styleimg2(){
		//return 'background-image: url(' + resource+'/img/grabs/cogs.png);';
	    return 'background-image: url('+this.image+');';
    }

    @api get columnstyle(){
        return (this.colstyle == 'Single Column');
    }

    @api get columntwostyle(){
        return (this.colstyle == 'Two Column');
    }

    @api get compif(){
        return (this.componentdef != '');
    }

    connectedCallback(){
       
        this.title=this.alerttitle;
        this.suppresscardui = true;

        try {

            var title = this.pageRef.state.iahelp__title;
            var message = this.pageRef.state.iahelp__Message;
            var toolcontext = this.pageRef.state.iahelp__ToolContext;
            var image = this.pageRef.state.iahelp__Image;
            var style = this.pageRef.state.iahelp__Style;
            var height = this.pageRef.state.iahelp__Height;
            var componentdef = this.pageRef.state.iahelp__componentDef;
    
    
            if (style + '' == 'undefined') {style = 'Single Column';}
            if (height + '' == 'undefined') {height = -1;}
            
        } catch (e) {
            console.log('IHAlert - error setting parameters from URL parameters: ' + e);
        }
    
        this.reInitialiseAlert();
      
    }

    //Setup component
    reInitialiseAlert(){
        console.log('In reInitialiseAlert');

        var rec = '';
    	var toolCxt = this.toolcontext;
    	var act = 'ok';
		this.refreshClickables(rec, toolCxt, act);
        var cmpDef = '';
        try{
        cmpDef = this.componentdef;
      
        var CG = this.template.querySelector('[data-id = "CGIHDetail"]');
		
        CG.componentdef = cmpDef;
			CG.reInitialise();
        }catch(e){
            console.log('IHAlert : component generator error '+e);
        }
    }

    // Re-obtain / refresh clickable tools, for cases where navigation may call for this
    refreshClickables(theRecord, toolcontext, actioncode){
        console.log('In refreshClickables');
        var userPermLevel = 0;
        userPermLevel += 1;                     

        getClickablesJSON({ToolContext : toolcontext, 
            ActionCode : actioncode,
            IHContext : theRecord,
            userPermLevel : userPermLevel 
        })  // Create a callback that is executed after the server-side action returns
        .then(result=>{
                this.results = result;

                // Need to process globals to get internationalisations - however this will trash global settings:
				// So: obtain these prior and re-set after call

				var GS = this.globalsettings;
                var T = this.alerttitle;
				this.alertprocessTools(result);
                this.alerttitle = T;
				this.globalsettings = GS;

             }).catch(error=>{
                 this.errors = error;
             });   
    }

    alertprocessTools(result){

        console.log('alertprocessTools---',result);

        if (result!='' || result+''!='undefined') {
           
            var lstItems=[];
            var toolsE = [];            // Ellipsis tools
            var toolsD = [];            // Drop down tools
            var toolsB = [];			// Body tools
            var toolsF = [];            // Footer tools
            var VOs = [];				// Vote Options
            var PS = [];                // Personalisation settings
            var intl = [];				// internationalisations
            var customFs = [];          // Details of any custom fields
            var passThroughs = [];		// Other records for inheriting components
            var ttl = '';				// Card title returned from server logic, if supplied
            var obj;
            var hasAttributes=false;
            var i;
        

            try {
                obj = JSON.parse(result);
            } catch (e) {           
                console.log("IHCardHelper - processTools - Error parsing the following return value (" + e + "): " );
            }

            if(obj+''!='undefined'){
                for (i = 0; i<obj.length; i++) {
                     // Process tools: these are true sObjects, so will have attributes including type          
                    try {
                        var s = obj[i].attributes.type;
                        hasAttributes = true;
                      
                    } catch (e) {
                        hasAttributes = false;
                        
                    }

                    if(hasAttributes === true){

                        if (obj[i].attributes.type === 'iahelp__ConfigurationItem__c') {

                            switch (obj[i].iahelp__Type__c) {
                                case 'Ellipsis': 
        
                                    obj[i].iahelp__ToolClass__c='fa-stack fa-lg '+obj[i].iahelp__ToolClass__c;
                                    obj[i].iahelp__IconClass__c=obj[i].iahelp__IconClass__c+' fa fa-stack-1x fa-inverse';
                                    if(obj[i].iahelp__HasDivider__c==true)
                                    {
                                        obj[i].iahelp__HasDivider__c='slds-has-divider_top-space';
                                    }
                                    else{
                                        obj[i].iahelp__HasDivider__c='';
                                    }
                                    toolsE.push(obj[i]);
                                    break;
                                    
                                case 'Drop-down':
                                    toolsD.push(obj[i]);
                                    break;
                    
                                case 'Body':
                                    toolsB.push(obj[i]);
                                    break;
        
                                case 'Footer':
                                    obj[i].iahelp__IconClass__c= obj[i].iahelp__IconClass__c + ' fa fa-stack-1x fa-inverse';
                                    toolsF.push(obj[i]);
                                    break;
        
                            }
                            
                        }  else if (obj[i].attributes.type === 'iahelp__IASetIHOrg__c') {
                            // Global settings: set some key values:
                            GS = obj[i];
        
                        } else if (obj[i].attributes.type === 'iahelp__HelpInteraction__c') {
                            // These represent personalisation settings:
                            PS.push(obj[i]);
                        } else if (obj[i].attributes.type === 'iahelp__HelpVoteOption__c') {
                            // These represent vote options applicable to an individual Help Topic:
                            VOs.push(obj[i]);
                        } else {
                            // Non-config items should also be treated as data ("list" items)
                            // NOTE: a Details card / Help Topic will place a single record here:
                            console.log('else ');
                            lstItems.push(obj[i]);
                        }

                    }else { //hasAttributes === true
                        // Process untyped items: these have no type as they are class instances, not sObjects
                        // Objects may be plain listings, or, if marked in a particular way, 
                        // represent other special data
                  
                        if (obj[i].CustomField + '' != 'undefined') {
                            // Help Topic custom field information
                            customFs.push(obj[i]);
        
                        } else if (obj[i].ActionCode == '[RecordMetadata]') {
                            // Information about the state of the "current" record
                            recordMeta = obj[i];
        
                        } else if (obj[i].ValueSet == 'MyForm') {
                            // Fields in a user's personal form settings: 
                            // We have no direct need of these, but push them into our "pass through" data collection, 
                            // for inheritors who may...					
                            passThroughs.push(obj[i]);
        
        
                        } else if (obj[i].ValueSet == 'MatrixColumnLabels') {
                        // TESTING MATRIX CONTROL: 
                        // We have no direct need of these, but push them into our "pass through" data collection, 
                        // for inheritors who may...						
                        passThroughs.push(obj[i]);
        
                        } else if (obj[i].ValueSet == 'Internationalisations') {
                            console.log('check1',obj[i].ValueSet);
                            // Internationalisations: these are brought down as a single 'Internationalisation' name/value pair set.
                            //console.log(' internationalisations '+obj[i]);
                            intl.push(obj[i]);
                            // For non-config item tools, we're going to need to record the translation in
                            // specific internationalisation variables: we'll need these in mark up as we can't 
                            // run a formula of any kind within mark-up
                            // Globals
                            if (obj[i].Name == 'ButtonCancel') {this.ButtonCancel = obj[i].Value; }
                         
                             if (obj[i].Name == 'TipButtonClose') {this.TipButtonClose = obj[i].Value; }
                           
                             if (obj[i].Name == 'TipGenericCancel') {this.TipGenericCancel = obj[i].Value;}
                            
                             if (obj[i].Name == 'TipGenericOK') {this.TipGenericOK = obj[i].Value;}
                            
                    }else {
                        // If none of the above, untyped items are our "list item" class - so represent listings
                        lstItems.push(obj[i]);
                        }

                }
            }
        

        }
        
        if(this.SkipGlobals + '' == 'false' || this.SkipGlobals + '' == 'undefined') {

            this.internationalisations=intl;

            for (var i=0; i < toolsB.length; i++) {
                toolsB[i].iahelp__TipText__c = this.internationalise('Tip' + toolsB[i].iahelp__TipText__c);
            
            }	 
       } else {
        //alert('Skipping Globals as we were passed: ' + SkipGlobals);			
       }

        this.alertbodytools=toolsB;   
        
        var bodytoolsWrapper1=[];

        if(this.alertbodytools != 'undefined'|| this.alertbodytools != '' ){
          for(var h=0; h<this.alertbodytools.length; h++){

            //Added condition based body Tool Class values.
            var T=this.alertbodytools[h];
            //Added additional metadata id to body tools
            var temp={"bt":T != 'undefined'?T:'',"GenericOK":T.iahelp__Label__c == 'TipGenericOK',
                    "THBTT":(T.iahelp__Label__c == 'ToggleHistory' || T.iahelp__Label__c == 'BackToTree'),
                    "ToggleHistory":T.iahelp__Label__c == 'ToggleHistory'
                     };
            bodytoolsWrapper1.push(temp);
            }

        }
            this.modifiedbodytoolsalert=bodytoolsWrapper1;

       }
    }

    internationalise(val){
        
        var retVal = val;
        var x = this.internationalisations;
     
        for (var i=0; i < x.length; i++) {
         
            if (x[i].Name === val) {                   
                retVal = x[i].Value;
                break;
            }
        }
        
        return retVal;
    }

    handlePassThroughs() {
        console.log('In IHAlert pass through handler');
    }

    menuItemClick(evt) {
        var target = evt.currentTarget; 
        var actioncode = target.getAttribute("data-actioncode");
        
        if(actioncode == 'AlertOK'){
         //if(actioncode == 'DialogueRequestClose'){

                var evtPassThrough = {SourceComponent:this.cardcomponentid,ActionCode:'DialogueRequestClose',Parameters:'ModalContainer'};
                publish(this.messageContext, messageChannel, evtPassThrough);
        }

	}

    
}