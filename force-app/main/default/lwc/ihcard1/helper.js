import { publish,subscribe,APPLICATION_SCOPE,unsubscribe,createMessageContext,releaseMessageContext,MessageContext } from 'lightning/messageService';
import messageChannel from '@salesforce/messageChannel/MyMessageChannel__c'; 
// Generic calls for opening and closing of modal dialogues:
    // NOTE: Scroll parameter applies to VF (iframed page) dialogue type ONLY - no impact in LUX (component) types.
   const doDialogue = (cmp,dlgTitle, dlgType, dlgSource, dlgAttrs, frmHeight, allowScroll, largeMode, showFooter, translateTitle) => { 
     
    console.log(' doDialogue is called !');
        //We have to make the conversion of Map to String generic

        if(dlgAttrs!=null && dlgAttrs+''!='undefined' && dlgAttrs.Height+''!='undefined'){
            var tmp='PDPositioningGroup~'+dlgAttrs.PDPositioningGroup+'^Height'+'~'+dlgAttrs.Height+'^ColumnRatio~'+dlgAttrs.ColumnRatio+ 
                    '^SuppressHeaders~'+dlgAttrs.SuppressHeaders+'^SuppressFooters~'+dlgAttrs.SuppressFooters+'^ToolContext~'+
                    dlgAttrs.ToolContext+'^RootNode~'+dlgAttrs.RootNode+'^TreeSuppressListingTools~'+dlgAttrs.TreeSuppressListingTools+
                    '^TreeNodeIconStyle~'+dlgAttrs.TreeNodeIconStyle+'^TreeNodeProvider~'+dlgAttrs.TreeNodeProvider+'^HelpRecordId~'+dlgAttrs.HelpRecordId+'^Message~'+dlgAttrs.Message;
            dlgAttrs=tmp;       
        }
        // Find the modal component - which may be part of the component passed (if the card) or its supercomponent...        
        var dlg = cmp.template.querySelector('[data-id="theModal"]');

        if (dlg + '' == 'null') {
            var parmvalues=dlgTitle+'#'+dlgType+'#'+dlgSource+'#'+dlgAttrs+'#'+frmHeight+'#'+allowScroll+'#'+largeMode+'#'+showFooter+'#'+translateTitle
            var params = {ActionCode: 'cardDoDialogue',Parameters:parmvalues,SourceComponent:cmp.cardcomponentid};
			publish(cmp.messageContext, messageChannel, params);
            return;
        }
        
        // Title may or may not need translation
        if (translateTitle == true) {
            console.log(' In Dialogue Internationalise '+Internationalise(cmp,'Title' + dlgTitle));
	        dlg.Title = Internationalise(cmp,'Title' + dlgTitle);
        } else {
	        dlg.Title = dlgTitle;
        }
        
        // Set remaining dialogue attributes
        dlg.FrameSource = dlgSource;
        dlg.FrameType = dlgType;
        dlg.FrameAttributes = dlgAttrs;
        dlg.FrameHeight = frmHeight;
        dlg.AllowScroll = allowScroll;
        dlg.LargeMode = largeMode;
        dlg.ShowFooter = showFooter;
    	
        // Show the dialogue (un-hide its container)
        var cnt = cmp.template.querySelector('[data-id="ModalContainer"]');
        cnt.classList.remove('slds-hide');
        //window.open(dlgSource);
        dlg.reInitialise();

    //    console.log('Card Helper: Dialogue requested by component ' + cmp.cardcomponentid);
    };

     // Obtain the configuration control record representing a particular Action Code
   const getConfigToolForAction = (cmp,ToolType, ActionCode) => {
        
    var retVal = null;
    var i;
    var CTs;
    
    switch (ToolType) {
        case 'Body':
            CTs = cmp.bodytools;
            break;

        case 'Drop-down':
            CTs = cmp.dropdowntools;
            break;

        case 'Ellipsis':
            CTs = cmp.ellipsistools;
            break;

        case 'Extension':
            CTs = cmp.extensiontools;
            break;

        case 'Footer':
            CTs = cmp.footertools;
            break;

        case 'Header':
            CTs = cmp.headertools;
            break;

        case 'Listing':
            CTs = cmp.listingtools;
            break;
            
        default:
            // Do not attempt to obtain an unknown type
            return null;
    }
    
    for (i=0; i<CTs.length; i++) {
        if (CTs[i].iahelp__ActionCode__c == ActionCode) {
            retVal = CTs[i];
            break;
        }
    }
    
    return retVal;
};

// Obtain the set of Header Tool Support Controls metadata (an array) for a particular configuration tool record
const getSupportControlsForConfigTool = (ConfigTool) => {
        
    // Configuration tools records have support control info in the form:
    // Support control ID {D1} Data type {D1} Label {D1} Placeholder text {D1} Value text {D2}
    // We pre-pend the action code onto this and split into an array for each HSC
    
    var retVal = null;
    
    if (ConfigTool.iahelp__SupportingControls__c != '' && ConfigTool.iahelp__SupportingControls__c != null) {
        
        var D1 = '~';
        var D2 = '^';
        var j;
        var HSCRecs = ConfigTool.iahelp__SupportingControls__c.split(D2);
        var HSC;
        var HSCs = [];
        
        for (j=0; j<HSCRecs.length; j++) {

            // Tack the action code this tool related to onto the supporting control
            // definition: action code is present in the configuration tool row, but is not
            // part of the support definition
            HSCRecs[j] = ConfigTool.iahelp__ActionCode__c + D1 + HSCRecs[j];
            HSC = HSCRecs[j].split(D1);
            HSCs.push(HSC);
        }
        
        retVal = HSCs;
    }
    
    return retVal;
};

// Return bit number that should be "on" (1) for a given, known object data type
const getToolBit = (cmp,val) => {
        
    // Look for value in config item known data types
    var retVal = '';
    var x = cmp.ConfigToolFilterInfo;
    
    for (var i=0; i < x.length; i++) {

        if (x[i].Value == val) {
            retVal = x[i].Name;
            break;
        }
    }
    
    return retVal;
};

const Internationalise = (cmp,val) => {
        
    // Look for value in internationalisations
    var retVal = val;
    var x = cmp.internationalisations;
  //  console.log('internationalisations '+cmp.internationalisations);
    for (var i=0; i < x.length; i++) {
      //  console.log(x[i].Name);
        if (x[i].Name === val) {                   
            retVal = x[i].Value;
            break;
        }
    }
    
    return retVal;
}

const processTools = (cmp,result) =>{
    console.log('helprec=='+cmp.helprecordid);
    console.log("IHCardHelper - processTools "+cmp.cardsuppressheader);
    cmp.cardlistitems=[]; //Empty list items
    if (result!='' || result+''!='undefined') {
    var lstItems=[];
    var toolsE = [];            // Ellipsis tools
    var toolsD = [];            // Drop down tools
    var toolsH = [];            // Header tools
    var HSCs = [];              // Header tool support controls
    var toolsB = [];			// Body tools
    var toolsF = [];            // Footer tools
    var toolsL = [];            // Listing tools
    var toolsW = [];            // Wizard steps
    var toolsWB = [];           // Wizard step body tools
    var toolsX = [];            // Extension tools
    var TAM;					// The 'active' marker for a toggling tool
    var D1 = '|';				// Delimiters encountered in the same
    var D2 = '¬';				// Delimiters encountered in the same
    var VOs = [];				// Vote Options
    var GS;                     // A global settings object
    var PS = [];                // Personalisation settings
    var XtnCaps = [];			// Info about extended capabilities (e.g., supported operations for trees)
    var intl = [];				// internationalisations
    var cfgFilterInfo = [];		// Configuration item tool filter support info
    var recordMeta;             // Details of data state for the current row of data
    var customFs = [];          // Details of any custom fields
    var passThroughs = [];		// Other records for inheriting components
    var ttl = '';				// Card title returned from server logic, if supplied
    var obj;
    var hasAttributes=false;
    var i;
    var myvar=cmp;
    var helprecordid_help = '';
    var tempstr = '';
    try {
        obj = JSON.parse(result);
        tempstr = obj[38].Value;
        if(tempstr.includes('HelpRecordId'))
        {
            var myarr = tempstr.split('~');
            helprecordid_help = myarr[1];
            console.log('helprecordid_help'+helprecordid_help);
        }
        
    } catch (e) {           
        console.log("IHCardHelper - processTools - Error parsing the following return value (" + e + "): " );
    }

              // In all cases, keep the raw return value in case we need the diagnostics
              var strDiags = 'IHCardHelper.processTools : entry... - - - - - - COMPONENT PARAMETERS: - - - ';
              strDiags += 'ComponentId=' + cmp.cardcomponentid + ': ';
              strDiags += 'ActionCode=' + cmp.actioncode + ': ';
              strDiags += 'ToolContext=' + cmp.toolcontext + ': ';
              strDiags += 'IHContext=' + cmp.ihcontext;
              strDiags += ' - - - - - - RETURN VALUE: - - - ';
              strDiags += obj+''!='undefined'?obj.length :'undefined';
              console.log(strDiags);  
    if(obj+''!='undefined'){
        for (i = 0; i<obj.length; i++) {
                
            // Process tools: these are true sObjects, so will have attributes including type          
            try {
                var s = obj[i].attributes.type;
                hasAttributes = true;
            } catch (e) {
                hasAttributes = false;
            }

            if (hasAttributes === true) {
                if (obj[i].attributes.type === 'iahelp__ConfigurationItem__c') {

                    // For all configuration item types, consider 'active' marker for toggling tools:
                    // Process the 'toggle active marker' and set the correct tool as the one to show on arrival.
                //  console.log('cardsuppressheader '+cmp.cardsuppressheader);
                    TAM = obj[i].iahelp__ToggleActiveMarker__c;
                      console.log('TAM '+TAM); 
                        if (TAM != '' && TAM != null && TAM+''!='undefined') {
                            
                            // Some active markers relate to record state (e.g., bookmarked or not): these should not be touched.
                            // Only those containing component attribute data are in play here. As with component generator instructions etc.
                            // these will be in the form:
                            
                            // Attribute [D2] Value [D1]
                            
                            if (TAM.indexOf(D2) != -1) {
                        
                                var attr;
                                var val;
                                var pass = true;
                                var comp;
                                var tamlist=[];

                                if(TAM.indexOf(D1) != -1)
                                    tamlist = TAM.split(D1);
                                else
                                    tamlist.push(TAM);

                                //   var myvar=cmp;
                                    tamlist.forEach(function(TAMClause){
                                    // console.log('IHCard: Processing Tool with Active Marker: - ' + obj[i].iahelp__Label__c + ' (' + obj[i].iahelp__ActionCode__c + ')... ');
                                        console.log(myvar);
                                    //   console.log(TAMClause.split(D2));
                                    
                                        TAMClause = TAMClause.split(D2);
                                        
                                        try {
                                            // Component attribute data can be sought from current component or its parent
                                            //  if (TAMClause[0].startsWith('Parent.')) {
                                            //	comp = cmp.get("v.Parent");
                                            //	TAMClause[0] = TAMClause[0].substr(7);
                                    //		} else {
                                                //comp = cmp;
                                    //		}
                                            console.log('TAMClause[0] '+TAMClause[0]+' TAMClause[1] '+TAMClause[1]);
                                            myvar.getMyAttribute(myvar,TAMClause[0]);
                                            console.log(' TAMClause[1] '+TAMClause[1]+' getMyAttribute '+myvar.getMyAttribute(myvar,TAMClause[0]));
                                            if ( myvar.getMyAttribute(myvar,TAMClause[0])+'' == TAMClause[1]+'') {
                                                // No need to act
                                            } else {
                                                console.log('IHCard: Active Marker comparison NOT met - ' + TAMClause[0] + ' != ' + TAMClause[1] + ' ('  + ')');

                                                pass = false;
                                            }
                                        } catch (e) {
                                            console.log('IHCard: Active Marker comparison error - ' + e);
                                        
                                            pass = false;
                                        }
                                
                                    });


                                // If ALL conditions of the active marker were met (above) mark this configuration
                                // tool as a 'pass' for initial display in toggle scenarios
                                if (pass == true) {
                                    obj[i].iahelp__ToggleActiveMarker__c = 'ComponentConditionsMatch';
                                    console.log('IHCard: Processing Tools - ' + obj[i].iahelp__Label__c + ' (' + obj[i].iahelp__ActionCode__c + ') passes active toggle');
                                }
                                
                            }
                            
                        }

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
                            
                        case 'Header':  
                        // We can't use calculated style therefore adding classes here
                        
                         if(cmp.ihcardtype=='List' && cmp.actioncode == 'FixedHelp')
                        {
                            if(obj[i].iahelp__ActionCode__c =='Search' 
                            || obj[i].iahelp__ActionCode__c =='ListExport' )
                            {
                                obj[i].iahelp__IconClass__c='fa '+obj[i].iahelp__IconClass__c+' fa-stack-1x fa-inverse';                           
                                                     
                            var HSCRecs = getSupportControlsForConfigTool(obj[i]);
                                var j;
    
                                if (HSCRecs != null && HSCRecs +''!='undefined') {
                                    for (j=0; j<HSCRecs.length; j++) {
                                        HSCs.push(HSCRecs[j]);
                                    }
                                }
                                toolsH.push(obj[i]);
                            }                       

                        }
                        else{
                            obj[i].iahelp__IconClass__c='fa '+obj[i].iahelp__IconClass__c+' fa-stack-1x fa-inverse';                           
                            
                            // For header tools, we need to take note of supporting controls:
                            // Each header tool record may include details of 0+ supporting controls.
                            // If any are found, the call below marks the object we store in the supporting 
                            // controls array with details of the header tool to which it applies.                            
                            var HSCRecs = getSupportControlsForConfigTool(obj[i]);
                                var j;
                            // console.log(' HSCRecs '+HSCRecs);
                                if (HSCRecs != null && HSCRecs +''!='undefined') {
                                    for (j=0; j<HSCRecs.length; j++) {
                                        HSCs.push(HSCRecs[j]);
                                    }
                                //  obj[i].iahelp__ToolClass__c+=' slds-input '+HSCs[1];
                                }
                                toolsH.push(obj[i]);
                           // break;
                        }
                        break;
                        case 'Body':
                        // if(obj[i].iahelp__ToolClass__c !=null & obj[i].iahelp__IconClass__c!=null){
                        //     obj[i].iahelp__IconClass__c='microTool ' + obj[i].iahelp__ToolClass__c + ' fa ' + obj[i].iahelp__IconClass__c;
                        // }
                            toolsB.push(obj[i]);
                            break;

                        case 'Footer':
                            obj[i].iahelp__IconClass__c= obj[i].iahelp__IconClass__c + ' fa fa-stack-1x fa-inverse';
                            toolsF.push(obj[i]);
                            console.log('footer.......'+obj[i]);
                            break;

                        case 'Listing':
                            if(cmp.ihcardtype!='List'){
                                if(obj[i].iahelp__IconClass__c !='' && obj[i].iahelp__IconClass__c+''!='undefined'){
                                    obj[i].iahelp__IconClass__c='fa fa-stack-2x ' + obj[i].iahelp__IconClass__c;
                                }
                            }
                            
                            obj[i].iahelp__ToolClass__c='fa-stack IATool IAToolInline ' + obj[i].iahelp__ToolClass__c;
                            
                            toolsL.push(obj[i]);
                            console.log(' obj[i].iahelp__ToolClass__c '+obj[i].iahelp__ToolClass__c);
                            break;
                            
                        case 'Extension' :
                            toolsX.push(obj[i]);
                            break;

                        case 'WizardStep' :
                            toolsW.push(obj[i]);
                            break;

                        case 'WizardStepBodyTool' :
                            toolsWB.push(obj[i]);
                            break;

                    }
                    
                    
                } else if (obj[i].attributes.type === 'iahelp__IASetIHOrg__c') {
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
                
            } else {
                // Process untyped items: these have no type as they are class instances, not sObjects
                // Objects may be plain listings, or, if marked in a particular way, 
                // represent other special data
            //   console.log(' obj[i].ValueSet '+obj[i].ValueSet);
                if (obj[i].CustomField + '' != 'undefined') {
                    // Help Topic custom field information
                    customFs.push(obj[i]);

                } else if (obj[i].ActionCode == '[RecordMetadata]') {
                    // Information about the state of the "current" record
                    recordMeta = obj[i];

                } else if (obj[i].ValueSet == 'PerformanceInfo') {
                    // Diagnostic server-side timestamps
                    console.log('---Server Side Performance Info--- ' + obj[i].Value);

                } else if (obj[i].ValueSet == 'CardTitle') {
                    // Title, if specified in server logic: note for later use
                    ttl = obj[i].Value;

                } else if (obj[i].ValueSet == 'AuthorOverrides') {
                    // Card configuration has been impacted by author overrides and we're being informed of this - mark this fact.
                    // NB: controller returns this info for authors+ only...
                    
                } else if (obj[i].ValueSet == 'CommunityRoot') {
                    // Community may be in play: note the community root
                    cmp.communityroot=obj[i].Value;
                    
                } else if (obj[i].ValueSet == 'PortalPage') {
                    // "Home" portal page could be one of several assets - this setting tells us which
                    cmp.portalpage=obj[i].Value;

                } else if (obj[i].ValueSet == 'VoteInfo') {
                    // Details of last vote that was cast
                    cmp.thevote=obj[i].Value;

                } else if (obj[i].ValueSet == 'TimesNudged') {
                    // Number of nudge interactions logged by current user from client nudge component


                } else if (obj[i].ValueSet == 'BrandCSS') {
                    // Contents of the brand CSS file (which may be at a location we cannot directly
                    // reach from LUX, so has to be brought down as a style block/text, 
                    // rather than a path to include)

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


                } else if (obj[i].ValueSet == 'HelpedElements') {
                    // Full element info for record caching when navigating lists / trees etc
                    try {
                        var HEs = JSON.parse(obj[i].Value);
                            cmp.helpedelements=HEs;
                            console.log(' HelpedElements '+cmp.helpedelements);
                    } catch (e) {}
                
                } else if (obj[i].ValueSet == 'HelpTopics') {
                    // Full topic info for record caching when navigating lists / trees etc
                    try{
                        var HTs = JSON.parse(obj[i].Value);
                            cmp.helptopics= HTs;
                            console.log(' HelpTopics '+cmp.helptopics);
                    }catch(e){}

                } else if (obj[i].ValueSet == 'ParsedContent') {
                    // Derivatives of record values (e.g., key-word enabled Help Topic descriptions).
                    // We have no direct need of these, but push them into our "pass through" data collection, 
                    // for inheritors who may...
                    passThroughs.push(obj[i]);
                } else if (obj[i].ValueSet == 'Permissions') {
                    // User permissions - special string to boolean handling required, it seems...var bln = obj[i].Value;
                    var bln = obj[i].Value;
                        if (bln + '' == 'true') {
                            bln = true;
                        } else {
                            bln = false;
                        }
                        
                        if (obj[i].Name == 'isUser') {cmp.isUser=bln;}
                        if (obj[i].Name == 'isAnalyst') {cmp.isAnalyst=bln;}
                        if (obj[i].Name == 'isAuthor') {cmp.isauthor=bln;}
                        if (obj[i].Name == 'isAdministrator') {cmp.isAdministrator=bln;}

                    
                } 
                else if (obj[i].ValueSet == 'Identifiers') {
                    // A unique component identifier for use filtering events to which to respond:
                    // Set this only if not set already:
                    if (obj[i].Name == 'UniqueId') {
                        if (cmp.uniqueident == '') {
                            cmp.uniqueident = obj[i].Value;
                        }
                    }
                console.log('uniqueident '+cmp.uniqueident);                     
                }
                else if (obj[i].ValueSet == 'ConfigToolFilterInfo') {
                    // Mappings of configuration item tool filters to object codes
                    // (as can be found in 1st 3 chars of most listing rows)
                    cfgFilterInfo.push(obj[i]);

                } else if (obj[i].ValueSet == 'SupportedTreeOps') {
                // Add any supported tree operations to known extended capabilities
                XtnCaps.push(obj[i]);                

                } else if (obj[i].ValueSet == 'Internationalisations') {
                    // Internationalisations: these are brought down as a single 'Internationalisation' name/value pair set.
                    //console.log(' internationalisations '+obj[i]);
                    intl.push(obj[i]);
                    // For non-config item tools, we're going to need to record the translation in
                    // specific internationalisation variables: we'll need these in mark up as we can't 
                    // run a formula of any kind within mark-up
                    // Globals
                    if (obj[i].Name == 'ButtonCancel') {cmp.ButtonCancel = obj[i].Value; }
                        if (obj[i].Name == 'ButtonGotoTemplates') {cmp.ButtonGotoTemplates = obj[i].Value; }
                        if (obj[i].Name == 'ButtonSave') {cmp.ButtonSave = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelAvailable') {cmp.FieldLabelAvailable = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelCreatedBy') {cmp.FieldLabelCreatedBy = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelCreatedByDT') {cmp.FieldLabelCreatedByDT = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelModifiedBy') {cmp.FieldLabelModifiedBy = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelModifiedByDT') {cmp.FieldLabelModifiedByDT = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelSelected') {cmp.FieldLabelSelected = obj[i].Value; }
                        if (obj[i].Name == 'MessageGenericTaskComplete') {cmp.MessageGenericTaskComplete = obj[i].Value; }
                        if (obj[i].Name == 'MessageValueRequired') {cmp.MessageValueRequired = obj[i].Value; }
                        if (obj[i].Name == 'TipButtonCompactView') {cmp.tipbuttoncompactview = obj[i].Value; }
                        if (obj[i].Name == 'TipButtonGotoTemplates') {cmp.TipButtonGotoTemplates = obj[i].Value; }
                        if (obj[i].Name == 'TipButtonHelpHome') {cmp.TipButtonHelpHome = obj[i].Value; }
                        if (obj[i].Name == 'TipButtonQuickSave') {cmp.ButtonQuickSave = obj[i].Value; }
                        if (obj[i].Name == 'TipButtonClose') {cmp.TipButtonClose = obj[i].Value; }
                        if (obj[i].Name == 'TipButtonConfigureSettings') {cmp.TipButtonConfigureSettings = obj[i].Value; }
                        if (obj[i].Name == 'TipButtonUploadImage') {cmp.tipbuttonuploadimage = obj[i].Value; }
                        if (obj[i].Name == 'TipGenericCancel') {cmp.TipGenericCancel = obj[i].Value; }
                        if (obj[i].Name == 'TipGenericDelete') {cmp.TipGenericDelete = obj[i].Value; }
                        if (obj[i].Name == 'TipGenericEdit') {cmp.tipgenericedit = obj[i].Value; }
                        if (obj[i].Name == 'TipGenericOK') {cmp.TipGenericOK = obj[i].Value; }
                        if (obj[i].Name == 'TipGoto') {cmp.TipGoto = obj[i].Value; }
                        if (obj[i].Name == 'TipReadMoreLinkUsers') {cmp.TipReadMoreLinkUsers = obj[i].Value; }
                        if (obj[i].Name == 'TipVote') {cmp.TipVote = obj[i].Value; }
                        if (obj[i].Name == 'TitleHelpedElement') {cmp.TitleHelpedElement = obj[i].Value; }

                        // LUXComponents
                        if (obj[i].Name == 'AdviceLabelGenericTextPlaceholder') {cmp.AdviceLabelGenericTextPlaceholder = obj[i].Value; }
                        if (obj[i].Name == 'AdviceLabelTagMode') {cmp.AdviceLabelTagMode = obj[i].Value; }
                        if (obj[i].Name == 'AdviceLabelSelectFields') {cmp.AdviceLabelSelectFields = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelSaveFormAs') {cmp.FieldLabelSaveFormAs = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelTagModeAny') {cmp.FieldLabelTagModeAny = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelTagModeAll') {cmp.FieldLabelTagModeAll = obj[i].Value; }					
                        if (obj[i].Name == 'FieldLabelTagModeAll') {cmp.FieldLabelTagModeAll = obj[i].Value; }					
                        if (obj[i].Name == 'FieldLabelTreePrintIndentationLevel') {cmp.FieldLabelTreePrintIndentationLevel = obj[i].Value; }
                        if (obj[i].Name == 'AdviceLabelModified') {cmp.AdviceLabelModified = obj[i].Value; }
                        if (obj[i].Name == 'AdviceLabelWorking') {cmp.AdviceLabelWorking = obj[i].Value; }
                        if (obj[i].Name == 'AdviceLabelTools') {cmp.advicelabeltools = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelMyNotes') {cmp.FieldLabelMyNotes = obj[i].Value; }
                        if (obj[i].Name == 'TipButtonSettings') {cmp.TipButtonSettings = obj[i].Value; }
                        if (obj[i].Name == 'TipView') {cmp.TipView = obj[i].Value; }
                        if (obj[i].Name == 'TitleTabVisible') {cmp.TitleTabVisible = obj[i].Value; }
                        if (obj[i].Name == 'TitleSelectFields') {cmp.TitleSelectFields = obj[i].Value; }
                        if (obj[i].Name == 'TitleAllRelatedHelp') {cmp.TitleAllRelatedHelp = obj[i].Value; }
                        if (obj[i].Name == 'TitleReadingLists') {cmp.TitleReadingLists = obj[i].Value; }
                        if (obj[i].Name == 'TitleAllResources') {cmp.TitleAllResources = obj[i].Value; }
                        if (obj[i].Name == 'TitleQuickLinks') {cmp.TitleQuickLinks = obj[i].Value; }

                        // IHTools
                        if (obj[i].Name == 'ButtonGotoVoteSets') {cmp.ButtonGotoVoteSets = obj[i].Value; }
                        if (obj[i].Name == 'ButtonPreviewCallout') {cmp.ButtonPreviewCallout = obj[i].Value; }
                        if (obj[i].Name == 'ButtonPreviewCalloutAsEdited') {cmp.ButtonPreviewCalloutAsEdited = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelName') {cmp.FieldLabelName = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelSummary') {cmp.FieldLabelSummary = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelActive') {cmp.FieldLabelActive = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelCalloutHeight') {cmp.FieldLabelCalloutHeight = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelCalloutMediaChoice') {cmp.FieldLabelCalloutMediaChoice = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelCalloutTemplate') {cmp.FieldLabelCalloutTemplate = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelCustomStyle') {cmp.FieldLabelCustomStyle = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelFullTemplate') {cmp.FieldLabelFullTemplate = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelHeightBeforeScrolling') {cmp.FieldLabelHeightBeforeScrolling = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelImageALTText') {cmp.FieldLabelImageALTText = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelImageCaption') {cmp.FieldLabelImageCaption = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelImageHeight') {cmp.FieldLabelImageHeight = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelImageTitle') {cmp.FieldLabelImageTitle = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelImageURL') {cmp.FieldLabelImageURL = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelImageWidth') {cmp.FieldLabelImageWidth = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelKeywords') {cmp.FieldLabelKeywords = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelLightningTemplate') {cmp.FieldLabelLightningTemplate = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelMasterTopicIdentifier') {cmp.FieldLabelMasterTopicIdentifier = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelSFHelpURL') {cmp.FieldLabelSFHelpURL = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelShowCallout') {cmp.FieldLabelShowCallout = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelShowReadMore') {cmp.FieldLabelShowReadMore = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelShowReferringTopics') {cmp.FieldLabelShowReferringTopics = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelStatus') {cmp.FieldLabelStatus = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelStepContext') {cmp.FieldLabelStepContext = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelStepElement') {cmp.FieldLabelStepElement = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelStepLayout') {cmp.FieldLabelStepLayout = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelStepMode') {cmp.FieldLabelStepMode = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelVideoCaption') {cmp.FieldLabelVideoCaption = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelVideoHeight') {cmp.FieldLabelVideoHeight = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelVideoTitle') {cmp.FieldLabelVideoTitle = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelVideoURL') {cmp.FieldLabelVideoURL = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelVideoWidth') {cmp.FieldLabelVideoWidth = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelVisibility') {cmp.FieldLabelVisibility = obj[i].Value; }
                        if (obj[i].Name == 'FieldLabelVoteInfo') {cmp.FieldLabelVoteInfo = obj[i].Value; }
                        if (obj[i].Name == 'TipButtonPreviewCallout') {cmp.TipButtonPreviewCallout = obj[i].Value; }
                        if (obj[i].Name == 'TipButtonPreviewCalloutAsEdited') {cmp.TipButtonPreviewCalloutAsEdited = obj[i].Value; }
                        if (obj[i].Name == 'TipButtonResetImage') {cmp.TipButtonResetImage = obj[i].Value; }
                        if (obj[i].Name == 'TipButtonResetVideo') {cmp.TipButtonResetVideo = obj[i].Value; }
                        if (obj[i].Name == 'TitleGuides') {cmp.TitleGuides = obj[i].Value; }
                        if (obj[i].Name == 'TitleTabCustom') {cmp.TitleTabCustom = obj[i].Value; }
                        if (obj[i].Name == 'TitleTabGeneral') {cmp.TitleTabGeneral = obj[i].Value; }
                        if (obj[i].Name == 'TitleTabGuides') {cmp.TitleTabGuides = obj[i].Value; }
                        if (obj[i].Name == 'TitleTabStatus') {cmp.TitleTabStatus = obj[i].Value; }
                        if (obj[i].Name == 'TitleTabText') {cmp.TitleTabText = obj[i].Value; }
                        
                        // IHConfirmActions
                        if (obj[i].Name == 'ColumnLabelDeleteAssociatedTopic') {cmp.ColumnLabelDeleteAssociatedTopic = obj[i].Value; }
                        if (obj[i].Name == 'ColumnLabelUseExistingTopic') {cmp.ColumnLabelUseExistingTopic = obj[i].Value; }
                        if (obj[i].Name == 'TipButtonSave') {cmp.TipButtonSave = obj[i].Value; }
                        
                        // ClientSide (QAM)
                        if (obj[i].Name == '[QAMAdviceLabelGuideStepCounter1]') {cmp.QAMAdviceLabelGuideStepCounter1 = obj[i].Value; }
                        if (obj[i].Name == '[QAMAdviceLabelGuideStepCounter2]') {cmp.QAMAdviceLabelGuideStepCounter2 = obj[i].Value; }
                        if (obj[i].Name == '[QAMTitleButtonGotoNextStep]') {cmp.QAMTitleButtonGotoNextStep = obj[i].Value; }
                        if (obj[i].Name == '[QAMButtonGotoNextStep]') {cmp.QAMButtonGotoNextStep = obj[i].Value; }                    
                    
                    } else {
                    // If none of the above, untyped items are our "list item" class - so represent listings
                    lstItems.push(obj[i]);
                    }
            }
                                
        }
    }
    cmp.logAdvancedDiags ('Return value process loop complete - internationalising');

        if(cmp.SkipGlobals + '' == 'false' || cmp.SkipGlobals + '' == 'undefined') {

            // For all configuration tools, internationalise labels and tips
            cmp.internationalisations=intl;
            
            for (i=0; i < toolsE.length; i++) {
               // console.log('Before '+toolsE[i].iahelp__Label__c);
                toolsE[i].iahelp__Label__c = Internationalise(cmp,'ToolLabel' + toolsE[i].iahelp__Label__c);
                toolsE[i].iahelp__TipText__c = Internationalise(cmp,'Tip' + toolsE[i].iahelp__TipText__c);
              //  console.log('After '+toolsE[i].iahelp__Label__c);
            }

            for (i=0; i < toolsD.length; i++) {
                // EXCEPTION for the "page help" drop down item: this won't have a direct translation. 
                if (toolsD[i].iahelp__ActionCode__c == 'PageHelpLinkHelp') {
                    toolsD[i].iahelp__Label__c = Internationalise(cmp,'ToolLabelPageHelp') + ': ' + toolsD[i].iahelp__Label__c;

                } else {
                    toolsD[i].iahelp__Label__c = Internationalise(cmp,'ToolLabel' + toolsD[i].iahelp__Label__c);
                }
                toolsD[i].iahelp__TipText__c = Internationalise(cmp,'Tip' + toolsD[i].iahelp__TipText__c);
            }

            for (i=0; i < toolsH.length; i++) {
                toolsH[i].iahelp__Label__c = Internationalise(cmp,'ToolLabel' + toolsH[i].iahelp__Label__c);
                toolsH[i].iahelp__TipText__c = Internationalise(cmp,'Tip' + toolsH[i].iahelp__TipText__c);
            }
            
            for (i=0; i < toolsB.length; i++) {
                toolsB[i].iahelp__TipText__c = Internationalise(cmp,'Tip' + toolsB[i].iahelp__TipText__c);
              //  console.log(' body tools iahelp__IconClass__c '+toolsB[i].iahelp__IconClass__c);
            }	            
            
            for (i=0; i < toolsF.length; i++) {
                toolsF[i].iahelp__Label__c = Internationalise(cmp,'ToolLabel' + toolsF[i].iahelp__Label__c);
                toolsF[i].iahelp__TipText__c = Internationalise(cmp,'Tip' + toolsF[i].iahelp__TipText__c);
            }
            for (i=0; i < toolsX.length; i++) {
                toolsX[i].iahelp__Label__c = Internationalise(cmp,'ToolLabel' + toolsX[i].iahelp__Label__c);
                toolsX[i].iahelp__TipText__c = Internationalise(cmp,'Tip' + toolsX[i].iahelp__TipText__c);
            }
            
            for (i=0; i < toolsL.length; i++) {
                toolsL[i].iahelp__Label__c = Internationalise(cmp,'ToolLabel' + toolsL[i].iahelp__Label__c);
                toolsL[i].iahelp__TipText__c = Internationalise(cmp,'Tip' + toolsL[i].iahelp__TipText__c);
            }


            // Internationalise static furniture where possible
            cmp.AdviceLabelWorking=Internationalise(cmp,'AdviceLabelWorking');
        //	cmp.advicelabeltools=Internationalise(cmp,'advicelabeltools');
            cmp.AdviceLabelModified=Internationalise(cmp,'AdviceLabelModified');
            cmp.FieldLabelMyNotes=Internationalise(cmp,'FieldLabelMyNotes');

        } else {
            //alert('Skipping Globals as we were passed: ' + SkipGlobals);			
        }
       
        cmp.logAdvancedDiags ('Internationalising loop complete - setting remaining member data');

        cmp.WizardSteps=toolsW;                  
        cmp.WizardStepbodytools=toolsWB;
        cmp.ellipsistools=toolsE;
        cmp.headertools=toolsH;                                  
        cmp.dropdowntools=toolsD;    
        cmp.headertoolsupportcontrols=HSCs;   
        cmp.bodytools=toolsB;   
        cmp.footertools=toolsF;   
        cmp.ExtensionTools=toolsX;                  
        cmp.listingtools=toolsL;                          
        cmp.VoteOptions=VOs;
         console.log(cmp.headertools);
        console.log(cmp.headertoolsupportcontrols);
        cmp.cardlistitems=lstItems; 
        console.log(cmp.cardlistitems); 
        cmp.PassThroughData=passThroughs;
        cmp.delimiter=(String.fromCharCode(7)).charAt(0);
        console.log(cmp.delimiter);
        cmp.currentrecordmetadata=recordMeta;
        cmp.CustomFields=customFs;
            if(cmp.SkipGlobals + '' == 'false' || cmp.SkipGlobals + '' == 'undefined') {
                if(GS != null && GS + '' != 'undefined'){
                    cmp.globalsettings=GS;

                    // Once we have global settings, set branding colours etc:
					// Use global default unless individual card has specified otherwise
					if (cmp.carduxtheme == '') {
						cmp.carduxtheme = GS.iahelp__BrandColour1Text__c;
					}
					
					var theme = cmp.carduxtheme;
                   
					if (theme == 'Light') {
						
                        cmp.uxthemecolour1 = GS.iahelp__BrandColour4__c;
                        cmp.uxthemecolour2 = GS.iahelp__BrandColour1__c;
                        cmp.uxthemecolour3 = GS.iahelp__BrandColour7__c;
					    cmp.uxmenubackgroundcolour = 'ffffff';
						cmp.uxmenufontcolour = cmp.uxthemecolour1;
						
					} else {
						cmp.uxthemecolour1 = GS.iahelp__BrandColour5__c;
						cmp.uxthemecolour2 = GS.iahelp__BrandColour2__c;
                       
                        cmp.uxthemecolour3 = GS.iahelp__BrandColour8__c;
                        cmp.uxmenubackgroundcolour = cmp.uxthemecolour3;
						cmp.uxmenufontcolour = 'ffffff';
					}
	
					// Body background colour depends additionally on transparency setting
					if (cmp.cardbackgroundstyle == 'Transparent') {
						cmp.uxbodybackgroundcolour = 'transparent';
						
					} else {
						cmp.uxbodybackgroundcolour = '#'+ cmp.uxthemecolour2;
					}

                }
           
        }
        try{
            console.log(' lstItems '+lstItems.length+' headertools '+cmp.headertools.length+' headertoolsupportcontrols '+cmp.headertoolsupportcontrols.length+' helptopics'+cmp.helptopics.length+' cmp.currentrecordmetadata '+cmp.currentrecordmetadata);                  
           }catch(e){}
        //Introducing new metadata to Headertools & headersupportcontroltools to store additional information like id, classes etc.
        
        var hscWrapper=[];
        var htWrapper=[];
        try{
                if(cmp.headertools.length>0 ){
                    for(var h=0; h<cmp.headertools.length; h++){

                        //Added condition based Header Tool Class values.

                        cmp.headertools[h].iahelp__ToolClass__c=(cmp.headertools[h].iahelp__ToggleNext__c == 0 ||                   
                        (cmp.currentrecordmetadata+''!='undefined' && cmp.currentrecordmetadata.RowState == cmp.headertools[h].iahelp__ToggleActiveMarker__c && cmp.headertools[h].iahelp__ToggleActiveMarker__c != '' && cmp.headertools[h].iahelp__ToggleActiveMarker__c != null)
                        || (cmp.headertools[h].iahelp__TogglePrev__c == 0 && cmp.headertools[h].iahelp__ToggleActiveMarker__c == 'Any') 
                        || cmp.headertools[h].iahelp__ToggleActiveMarker__c == 'ComponentConditionsMatch'
                        
                        ? 'fa-stack fa-lg IATool ' + cmp.headertools[h].iahelp__ToolClass__c : 'slds-hide fa-lg IATool ' + cmp.headertools[h].iahelp__ToolClass__c);
                        
                        //Added additional metadata id to header tools

                        var t;
                        try{
                            t={"ht":cmp.headertools[h],"id":cmp.toolcontext + cmp.delimiter + cmp.headertools[h].iahelp__Type__c +
                            cmp.delimiter + cmp.headertools[h].iahelp__DisplayOrder__c + cmp.delimiter + cmp.cardcomponentid,
                            "id2":cmp.headertools[h].iahelp__Type__c +'-' + cmp.headertools[h].iahelp__ActionCode__c +
                            '-'+ cmp.headertools[h].iahelp__DisplayOrder__c+ '-' + cmp.headertools[h].iahelp__ToggleNext__c,
                            "inputvalue":(cmp.headertoolsupportcontrols[0])[5],
                            "class1":(cmp.headertoolsupportcontrols[0])[0] == cmp.headertools[h].iahelp__ActionCode__c && (cmp.headertoolsupportcontrols[0])[2] == 'text' ? 'slds-form-element' : 'slds-hide',
                            "class2":(cmp.headertoolsupportcontrols[0])[1]+' slds-input '+cmp.headertools[h].iahelp__ToolClass__c,
                            "ph":(cmp.headertoolsupportcontrols[0])[4],
                            "uniqueid":(cmp.headertoolsupportcontrols[0])[0] == cmp.headertools[h].iahelp__ActionCode__c && (cmp.headertoolsupportcontrols[0])[2] == 'text' ? (cmp.headertoolsupportcontrols[0])[1] + cmp.uniqueident : ''}
                        }catch(e){
                            t={"ht":cmp.headertools[h],"id":cmp.toolcontext + cmp.delimiter + cmp.headertools[h].iahelp__Type__c +
                            cmp.delimiter + cmp.headertools[h].iahelp__DisplayOrder__c + cmp.delimiter + cmp.cardcomponentid,
                            "class1":'slds-hide',
                            "class2":'slds-hide',
                            "uniqueid":''}
                        }
                        htWrapper.push(t);

                        //Added additional metadata class1,class2,class3 to headersupportcontrol tools to store condition based values
                        if(cmp.headertoolsupportcontrols.length>0){
                            for(var i=0; i<cmp.headertoolsupportcontrols.length ; i++){		
                                var c;

                                c={"htsc":cmp.headertoolsupportcontrols[i],"class1":(cmp.headertoolsupportcontrols[i])[0] == cmp.headertools[h].iahelp__ActionCode__c && (cmp.headertoolsupportcontrols[i])[2] == 'text' ? 'slds-form-element' : 'slds-hide',
                                "class2":(cmp.headertoolsupportcontrols[i])[0] == cmp.headertools[h].iahelp__ActionCode__c && (cmp.headertoolsupportcontrols[i])[2] == 'droptarget' ? 'slds-form-element' : 'slds-hide',
                                "class3":(cmp.headertoolsupportcontrols[i])[0] == cmp.headertools[h].iahelp__ActionCode__c && (cmp.headertoolsupportcontrols[i])[2] == 'draggable' ? 'slds-form-element' : 'slds-hide',
                                "class5":(cmp.headertoolsupportcontrols[i])[1]+' '+cmp.headertools[h].iahelp__ToolClass__c  };
                            
                                hscWrapper.push(c);
                            }
                        }
                        else{
                            console.log(' Headertoolssupportcontrols is empty ');
                        }
                    }
                    
                    
                    
                    cmp.modifiedheadertools=htWrapper;
                    cmp.modifiedheadertoolsupportcontrols=hscWrapper;
                    console.log(' cmp.modifiedheadertoolsupportcontrols '+cmp.modifiedheadertoolsupportcontrols.length);
                    console.log(cmp.modifiedheadertoolsupportcontrols);
                    console.log(' cmp.modifiedheadertools '+cmp.modifiedheadertools.length);
                    console.log(cmp.modifiedheadertools);
                }
                else{
                    console.log(' Header tools is empty ');
                }
                if(cmp.ellipsistools.length>0){
                    var EllipsisWrapper=[];
                    for(var h=0; h < cmp.ellipsistools.length; h++){
                        var temp; var T=cmp.ellipsistools[h];
                        console.log(T);
                        console.log('T.iahelp__Action_Code__c '+T.iahelp__Action_Code__c+' iahelp__ToggleActiveMarker__c '+T.iahelp__ToggleActiveMarker__c);
                        temp={"elp":T, "liclass": T.iahelp__ToggleNext__c == 0 
                                                                    || (cmp.currentrecordmetadata+''!='undefined' && cmp.currentrecordmetadata.RowState == T.iahelp__ToggleActiveMarker__c && T.iahelp__ToggleActiveMarker__c != '' && T.iahelp__ToggleActiveMarker__c != null)
                                                                    || (T.iahelp__TogglePrev__c == 0 && T.iahelp__ToggleActiveMarker__c == 'Any') 
                                                                    || T.iahelp__ToggleActiveMarker__c == 'ComponentConditionsMatch'
                        
                                                                        ? 'slds-dropdown__item IATool HelpTopic HelpedUser' : 'slds-dropdown__item IATool HelpTopic HelpedUser slds-hide',
                            "id":cmp.toolcontext+cmp.delimiter+T.iahelp__Type__c+cmp.delimiter+T.iahelp__DisplayOrder__c+cmp.delimiter+cmp.cardcomponentid};
                    
                        EllipsisWrapper.push(temp);                                   
                    }
                    cmp.modifiedellipsistools=EllipsisWrapper;
                }
                else{
                    console.log(' Ellipsis tools is empty ');
                }
        }
        catch(e){
            console.log(' Error in processing Header Tools & Ellipsis Tools '+e);
        }
        //list modified 
        var CardListItemsWrapper=[];
        var listingToolsLCWrapper=[];
        var LS1=[];

        for(var h=0; h < cmp.cardlistitems.length; h++){
     
            var temp; var T=cmp.cardlistitems[h];
            LS1=cmp.listingtools[0];
     
             temp={"lis":T, "id":'LINarrow_'+T.Id,
                 "classli":cmp.UIFilter == (T.IconLabel + 'Help') || cmp.UIFilter == 'AllHelp' ? T.Id+' '+T.StyleClass+' '+T.IconLabel+'Help HelpListingItem slds-has-dividers_top' : 'slds-hide',
                 "id1":T.Id+cmp.delimiter+T.ActionCode+cmp.delimiter+T.Parameters,
                "id2":T.Id+cmp.delimiter+cmp.listingclickactioncode+cmp.delimiter+T.Parameters,
                "tid1":T.Id+cmp.delimiter+T.ActionCode+cmp.delimiter+T.Parameters,
                "tid2":T.Id,
                "tileid1":T.Id+cmp.delimiter+T.ActionCode+cmp.delimiter+T.Parameters+cmp.delimiter,
                "tileid2":T.Id+cmp.delimiter+cmp.listingclickactioncode+cmp.delimiter+T.Parameters+cmp.delimiter,
                "classa":'ListTile'+T.StyleClass,
                "divIL1" : T.StyleClass == 'IHHelpedSFElementError' ? 'slds-hide' : 'slds-col_bump-left',
                "divIL2" : cmp.listingtools.length <= cmp.MaxListingTools || cmp.MaxListingTools == -1 
                 ? 'ListingToolsBlock_' + T.Id : 'slds-hide ListingToolsBlock_' + T.Id,
                "classcollapse" : cmp.listingtools.length <= cmp.MaxListingTools || cmp.MaxListingTools == -1 ? 'slds-hide' : '',
                 "classspan" : cmp.actioncode!= 'Search' ? 'ListingToolsBlockMaster_' + T.Id + ' fa-stack IATool IAToolMaster' : 'slds-hide',
                "iditag" : T.Id+cmp.delimiter+'ToggleListingTools'+cmp.delimiter+'', //line 188 aura
                "titleALTs" : cmp.advicelabeltools,
                "style1" : cmp.globalsettings+''!= 'undefined'?('color: #' + cmp.globalsettings.iahelp__BrandColour6__c  + ';'):'',
                "classp" : cmp.ListingRowStyle == 'Expanded' ? 'Expanded slds-m-horizontal_small' : 'slds-hide',
                "trid" : 'LIWide_'+T.Id,
                "trclass" : cmp.UIFilter == (T.IconLabel + 'Help') || cmp.UIFilter == 'AllHelp' ? T.Id + ' ' + T.StyleClass + ' slds-hint-parent HelpListingItem' : 'slds-hide',
                "thitag" : 'fa ' + T.Icon + ' fa-stack-1x fa-inverse',
                "spanelementerrclass" : T.StyleClass == 'IHHelpedSFElementError' ? 'slds-hide' : 'IAToolMaster',
                "spanclassltbm" : cmp.actioncode!= 'Search' ? 'ListingToolsBlockMaster_' + T.Id + ' fa-stack fa-lg IATool IAToolMaster' : 'slds-hide',
                "ltlcclass" : LS1+''!= 'undefined'?(LS1.iahelp__ToggleNext__c == 0 
                                || T.RowState == LS1.iahelp__ToggleActiveMarker__c
                                || (LS1.iahelp__TogglePrev__c == 0 && T.RowState == '')
                                || (LS1.iahelp__TogglePrev__c == 0 && LS1.iahelp__ToggleActiveMarker__c == 'Any')
                                ? 'fa-stack IATool IAToolInline ' + LS1.iahelp__ToolClass__c : 'slds-hide'):'',
                "idid" : LS1+''!= 'undefined'?(T.Id+cmp.delimiter+LS1.iahelp__ActionCode__c+cmp.delimiter+T.Parameters):'',
                "ltlcclasswide" : LS1+''!= 'undefined'?(LS1.iahelp__ToggleNext__c == 0 
                                || T.RowState == LS1.iahelp__ToggleActiveMarker__c
                                || (LS1.iahelp__TogglePrev__c == 0 && T.RowState == '')
                                || (LS1.iahelp__TogglePrev__c == 0 && LS1.iahelp__ToggleActiveMarker__c == 'Any')
                                ? 'fa-stack fa-lg IATool ' + LS1.iahelp__ToolClass__c : 'slds-hide'):''
            } 
    
         CardListItemsWrapper.push(temp);  
        }

        console.log('CardListItemsWrapper');
        console.log(CardListItemsWrapper);
        cmp.modifiedcardlistitems=CardListItemsWrapper;  
        console.log('---modifiedcardlistitems----');
        console.log(cmp.modifiedcardlistitems);  

        //listingtools for ihlist component
        for(var j=0; j < cmp.listingtools.length; j++){
           
            var temp1; var LS=cmp.listingtools[j];
            if(cmp.actioncode != 'AllHelp'){

            
            temp1={"ltlc":LS, 
                "style": LS.iahelp__ToolClass__c != '' && LS.iahelp__ToolClass__c != null ? '' : 'color: #' + cmp.globalsettings.iahelp__BrandColour6__c  + ';',
                "classitag" : 'fa fa-stack-2x ' + LS.iahelp__IconClass__c,
                "title" : LS.iahelp__TipText__c,
                "itagiconclass" : 'fa ' + LS.iahelp__IconClass__c + ' fa-stack-1x fa-inverse'}

           listingToolsLCWrapper.push(temp1);
        } 
        }//end listingtools for ihlist component
    
        cmp.modifiedlistingtoollc=listingToolsLCWrapper;

        console.log('---modifiedlistingtoollc----');
        console.log(cmp.modifiedlistingtoollc);
        console.log('length---modifiedlistingtoollc-',cmp.modifiedlistingtoollc.length);
        //list modified end


         var listingToolsWrapper=[];
         for(var h=0; h < cmp.listingtools.length; h++){
             var temp; var T=cmp.listingtools[h];
             temp={"lt":T, "ltclass": T.iahelp__ToggleNext__c == 0 
                                                         || (cmp.currentrecordmetadata+''!='undefined' && cmp.currentrecordmetadata.RowState == T.iahelp__ToggleActiveMarker__c && T.iahelp__ToggleActiveMarker__c != '' && T.iahelp__ToggleActiveMarker__c != null)
                                                         || (T.iahelp__TogglePrev__c == 0 && T.iahelp__ToggleActiveMarker__c == 'Any') 
                                                         || T.iahelp__ToggleActiveMarker__c == 'ComponentConditionsMatch'
             
                                                             ? 'slds-dropdown__item IATool HelpTopic HelpedUser' : 'slds-dropdown__item IATool HelpTopic HelpedUser slds-hide',
                   "id":cmp.toolcontext+cmp.delimiter+T.iahelp__Type__c+cmp.delimiter+T.iahelp__DisplayOrder__c+cmp.delimiter+cmp.cardcomponentid};
         
             listingToolsWrapper.push(temp);                                   
          }
          cmp.modifiedlistingtool=listingToolsWrapper;

        var bodytoolsWrapper=[];
        for(var h=0; h<cmp.bodytools.length; h++){

            //Added condition based body Tool Class values.
            var T=cmp.bodytools[h];
            //Added additional metadata id to body tools
            var temp={"bt":T,"class1":T.iahelp__ToggleNext__c == 0 
                                                || (cmp.currentrecordmetadata+''!='undefined' && cmp.currentrecordmetadata.RowState == T.iahelp__ToggleActiveMarker__c && T.iahelp__ToggleActiveMarker__c != ''
                                                && T.iahelp__ToggleActiveMarker__c != null)
                                                || (T.iahelp__TogglePrev__c == 0 && T.iahelp__ToggleActiveMarker__c == 'Any')
                                                || T.iahelp__ToggleActiveMarker__c == 'ComponentConditionsMatch'
                                                
                                                ? T.iahelp__ToolClass__c : 'slds-hide ' + T.iahelp__ToolClass__c,
                    "class2":'microTool ' + T.iahelp__ToolClass__c + ' fa ' + T.iahelp__IconClass__c,
                    "id1":cmp.toolcontext + cmp.delimiter + T.iahelp__Type__c + cmp.delimiter + T.iahelp__DisplayOrder__c + cmp.delimiter + cmp.cardcomponentid,
                    "id2":T.iahelp__Type__c + cmp.delimiter + T.iahelp__ActionCode__c + cmp.delimiter + T.iahelp__DisplayOrder__c + cmp.delimiter + T.iahelp__ToggleNext__c};
            bodytoolsWrapper.push(temp);
            }
            cmp.modifiedbodytools=bodytoolsWrapper;
        cmp.PersonalisationSettings=PS;
        cmp.configtoolfilterinfo=cfgFilterInfo;

        cmp.extendedcapabilities=XtnCaps;

        // Assume title based on action code, unless specifics returned in call:
        // An example where title is set is tag operations (when looking at a pool of tags: card title = pool topic name)
        if (ttl != '') {
            cmp.title=ttl;
            
        } else {			
            // 1.39.12 / 1.40+: If we've been given a specific title, e.g., via mark up or LUX out parameters, 
            // we should use that, reverting to action code based title only as a default
            ttl = cmp.title;
            if (ttl == "Improved Help" || ttl == '[Title]' || ttl == '') {
                cmp.title=Internationalise(cmp,'Title' + cmp.actioncode);
            }
        }
        
        // Ensure any "lower level" diags are kept
        if (cmp.diags.toUpperCase().indexOf('ERROR') != -1) {
            cmp.diags=cmp.diags + ': ' + cmp.Internationalise('AdviceLabelMatchingItems') + ': ' + cmp.cardlistitems.length;
        } else {
            cmp.diags=cmp.Internationalise('AdviceLabelMatchingItems') + ': ' + cmp.cardlistitems.length;
        }
        
        // Raise a passthrough event to state our tools have been processed
   /*     cmp.
         ('IHCardHelper.processTools - raising ComponentToolsProcessed pass-through...');
        */
        var str='';
     //   console.log(' In Card before ComponentToolsProcessed '+ this);
        if(cmp.helptopics+''!='undefined' && cmp.helptopics!=null && cmp.helptopics.length > 0)
        {
            str = JSON.stringify(cmp.helptopics);
        }
        if(cmp.helpedelements+''!='undefined' && cmp.helpedelements!=null && cmp.helpedelements.length > 0)
        {
            str = JSON.stringify(cmp.helpedelements);
        }
        var params = {ActionCode: 'ComponentToolsProcessed',Parameters:str,SourceComponent:cmp.cardcomponentid};
        publish(cmp.messageContext, messageChannel, params);
        cmp.logAdvancedDiags ('IHCardHelper.processTools - complete');
        return true;

    } else {
     //   console.log(' error in process tools---- ');
      /*  var errors = '';

        if (errors) {
            if (errors[0] && errors[0].message) {
                strDiags = 'ERR (' + state + '): ' + errors[0].message;
                strDiags += ' - - - COMPONENT PARAMETERS: ActionCode=' + cmp.ActionCode + ': toolcontext=' + cmp.toolcontext + ': IHContext=' + cmp.IHContext;
            }
        
        } else {
            strDiags = 'ERR (' + state + '): - - - COMPONENT PARAMETERS: ActionCode=' + cmp.ActionCode + ': toolcontext=' + cmp.toolcontext + ': IHContext=' + cmp.IHContext;
        }
        
        cmp.logAdvancedDiags(cmp, strDiags);
        cmp.Diags="ERR!";
        return false;      */      
    }
}


const deTokenize = (cmp,val) => {
    console.log('from detokenize');
var retVal = val;

try {
    retVal = retVal.split('{!recordId}').join(cmp.recordId);
    retVal = retVal.split('{!HelpRecordId}').join(cmp.HelpRecordId);
    
    if (retVal.indexOf('{!CurrentRecord.') != -1) {
    
        try {
            
            var i = 0;
            var rec = cmp.CurrentRecord;
            var fld;
            var fldName;
            var rest;	
    
            if (rec + '' != 'undefined') {
            
                retVal = retVal.split('{!CurrentRec');
                while (i < retVal.length) {
                
                    if (retVal[i].startsWith('ord.')) {
                        fldName = retVal[i].substring(4, retVal[i].indexOf('}'));
                        rest = retVal[i].substring(retVal[i].indexOf('}') + 1);
    
                        fld = rec[fldName];
                        retVal[i] = fld + rest;
                        
                    } else {
                    
                    }
                    
                    i+=1;
                }
                retVal = retVal.join('');
            }
            
        } catch (e) {
            retVal = 'Card Detokenizer Error (position ' + i + ' of ' + retVal.length + '): ' + e;
        }
    
    }			


    if (retVal.indexOf('{!Parent.') != -1) {
        try {
            var P = cmp.Parent;
    
            if (P + '' != 'undefined' && P + '' != '') {
                retVal = retVal.split('{!Parent.recordId}').join(P.recordId);
                retVal = retVal.split('{!Parent.recordIdOrOwn}').join(P.recordId);
                
            } else {
                retVal = retVal.split('{!Parent.recordId}').join('');
                retVal = retVal.split('{!Parent.recordIdOrOwn}').join(cmp.recordId);
                
            }
            
        } catch (e) {
            retVal = 'Card Detokenizer Error (Parent token): ' + e;
        }
    }			

    
    retVal = retVal.split('{CurrentRoot}').join(location.host);
    
} catch (e) {		
    retVal = 'Error (Detokenize): ' + e;
}

return retVal;
}

const hidePoweredBy  = (cmp) => {
    // Hide powered by logo...
    var PB = cmp.template.querySelector('[data-id="PoweredBy"]');
		//PB.classList.add("IHCardFooterLogo");
    if(cmp.ihcardtype == 'AutoForm' || cmp.ihcardtype == 'Detail'){
       PB.classList.add("IHCardFooterLogo");
    }
        try {
             PB.classList.remove("IHCardFooterLogoExpanded");
						 if(cmp.ihcardtype != 'AutoForm'){
								  PB.classList.remove("IHCardFooterLogoMargin");
						 }
						
        } catch (e){}
    
};

    export {hidePoweredBy,doDialogue,deTokenize,getConfigToolForAction,getSupportControlsForConfigTool,getToolBit,Internationalise,processTools };