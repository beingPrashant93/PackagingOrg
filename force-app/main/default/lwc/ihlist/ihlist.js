import { LightningElement,track,api,wire } from 'lwc';
import IHCard from 'c/ihcard1';
import getTools from '@salesforce/apex/iahelp.ControllerLUXOps.getTools';
import deleteTopic from '@salesforce/apex/iahelp.ControllerLUXOps.deleteTopic';
import { publish,subscribe,APPLICATION_SCOPE,unsubscribe,createMessageContext,releaseMessageContext,MessageContext } from 'lightning/messageService';
import messageChannel from "@salesforce/messageChannel/MyMessageChannel__c";
//import {doDialogue,getConfigToolForAction,getSupportControlsForConfigTool,getToolBit,Internationalise,processTools} from 'c/ihcard1';
export default class Ihlist extends IHCard {
    @wire(MessageContext)
    messageContext;
	subscription=null;
    // ************** IHCard properties***********
    @api height;
	@api suppressheader=false;
	@api suppressfooter=false;
    @api cardconfig1;
    @api listensto;
    @api uxtheme='';
	@api backgroundstyle='Coloured';
    @api style2 ;
    @api style3 ;
    @api style4 ;
    @api stylewhitecard;
    @api darkmodeWhitecol;
    //@api uxmenubackgroundcolour;
    //@api listingclickactioncode;
    //******************Member Data***************
    @api listingstyle1;
    @api ListingTileSize='Medium';
    @api ListingRowStyle='Expanded';
    @api maxlistingtools1;
    @api listingclickactioncode='';
    @api ListingTagFilters;
    @track AllFilters;  //private
    @api InitialRows=100;
    @track CurrentRows=100; //private
    // @api modifiedlistingitems=[];
    @track errors;
    @api actioncode;
    // ActionCode
    @api IHContext='';
    @api nodatamessage='[No Data]';
    @api results;
    @api searchresults;
    @api toolcontext='QAM';
    @api recordId;
    @api helprecordid;
    @api componentid;
    @api CalloutOption;
    // @api Params;
    @api sobjectname;
    @api RowLabellingOption = 'Help Topics';
    @api ref1;
    @api listicon;
    @api listtitle = 'Improved Help';
    @api CardConfig;
    @api ListingStyle='Narrow';
    @api MaxListingTools = 3;
    @api outercontainerclass="";
    @api treemaxdepth = 0;
    @api capturesearchvalue;

    @api get nodatamsgclass(){
		return (this.cardlistitems.length == 0 ? 'NoDataMessage' : 'slds-hide') && (this.modifiedcardlistitems.length == 0 ? 'NoDataMessage' : 'slds-hide');
	}

    @api get IAListComponentBodyclass(){
        return (this.ListingStyle == 'Tile' ? 'slds-card__body TileList' : 'slds-card__body');
    }
    @api get ListingStyleNarrow(){
        return (this.ListingStyle == 'Narrow');
    }
    @api get ListingStyleclass(){
        return (this.ListingStyle == 'Narrow' ? 'slds-m-top_small HelpListItemsNarrow' : 'slds-hide');
    }
    @api get ListingClickActionCodeConditon(){
        return (this.listingclickactioncode == ''?true:false);
    }
    
     //conditions for WIDE FORM
     @api get ListingStyleWide(){
        return (this.ListingStyle == 'Wide');
    }
    @api get tableclass(){
        return (this.ListingStyle == 'Narrow' ? 'slds-hide' : 'slds-table slds-table_bordered HelpListItemsWide');
    }
    @api get divcompactclass(){
        return (this.ListingRowStyle == 'Expanded' ? 'FlexCol' : 'slds-hide');
    }

    //conditions for TILE FORM
    @api get ListingStyleTile(){
        return (this.ListingStyle == 'Tile');
    }
    
    connectedCallback() {
        console.log('--connectedcallback List Component--');
        this.cardcomponentid=this.componentid;
        this.ihcardtype='List';
        this.assignToDesignPara();
        this.initialiseList(); 
        this.cardlistensto=this.listensto;
        this.reff=this.reff;
        this.capturesearchvalue = this.varthis;
        this.handleSubscribe();
        this.carduxtheme=this.uxtheme;
        this.cardbackgroundstyle=this.backgroundstyle;

    }
	//------------------Event handler to get listitems data from IHCard for search functionality ----------
    passToParent(event){
        var barVal = event.detail;
        this.modifiedcardlistitems = event.detail;
        console.log(this.modifiedcardlistitems);
        this.Diags = 'Matching Items:'+this.modifiedcardlistitems.length; 
    }

    // This method is used to get hold of search text from search bar (event is raised from Card)
    handlecardinfo(evt){
        console.log(' in handle child');
        this.capturesearchvalue = evt.detail.key1;
    }

    //Assign values to design parameters.
    assignToDesignPara(){
        console.log('assignToDesignPara before if');
        if(this.cardconfig1+''!='undefined'){
            this.CardConfig = this.cardconfig1;
        }  
        if(this.listingstyle1+''!='undefined'){
            this.ListingStyle = this.listingstyle1;
        }  
        if(this.maxlistingtools1+''!='undefined'){
            this.MaxListingTools = this.maxlistingtools1;
        }
        console.log('cardconfig1'+this.cardconfig1+'listingstyle1'+this.listingstyle1+'maxlistingtools1'+this.maxlistingtools1);
     
    } 

   // Set up required listing data according to our member data / Card Configuration etc.
   initialiseList(evt){

    var act;
    var cxt;
    var listConfig;
    var ToolsOnlyList;		// For the "ToolsOnly" config option - to hold any pre-obtained listing to be displayed        
    //var SkipGlobals = this.SkipGlobals;
    var TCxt = this.toolcontext;
    var D1 = '^';

    // Note the card's configuration
    listConfig = this.CardConfig;
    console.log('list config-----',listConfig);

     // Default to removing record selection marker on list scroll - unless we've been instructed to the contrary
    if(this.retainselectiononscroll != true){
        this.retainselectiononscroll = false;
    }

    // NOTE: 
        // When list is used stand alone, CardConfig is set by Page Author via a design parameter.
        // When list is part of another component (e.g., QAM) owner must set CardConfig.
        // We can differentiate these settings (e.g., those with spaces generally mean design parameter)
        
        // ALSO NOTE: if tool context = QAM, ControllerLUXOps logs a list type interaction - using ACTION CODE (as card config not known to it)
        // QAM Init re-sets CARD CONFIG to this ACTION CODE - hence there being 2 similar listConfig switches below... 

    switch (listConfig) {
        //////////////////////////////////////////////////////////////////////////////////
        // Cases coming from configuration / interaction parameters
        //////////////////////////////////////////////////////////////////////////////////

        case "AllHelp" :
            this.actioncode = 'AllHelp';
            this.listicon = 'fa-list';
            cxt = this.recordId;
            //this.listtitle=Internationalise(this,this.actioncode);

            // Respond if we don't have a record ID: seek a context via page URL
				if (cxt + '' == 'null' || cxt + '' == 'undefined') {	
					cxt = this.getPageContextIdentifier();
				}
            break;

         case "AppListing" :
            this.actioncode = 'AppListing';
			cxt = this.IHContext;
			break;
        
         case "GetTaggedItems" :
            this.listicon = 'fa-tags';
            this.actioncode = 'GetTaggedItems'; 
			
				if (this.ListingTagFilters != '') {
					cxt = this.ListingTagFilters;    
				} else {
					cxt = this.sobjectname;
				}
				
			    break;	

         case "Guides" :
            this.actioncode = 'Guides';
            this.listicon = 'fa-list';
            cxt = this.recordId;
            break;
                
        case "HelpBookmarks" :
            this.actioncode = 'HelpBookmarks';
            this.listicon = 'fa-bookmark';
            cxt = this.recordId;
            //this.listtitle=Internationalise(this,this.actioncode);
            break;

        case "Keywords" :
            this.actioncode = 'Keywords';
            this.toolcontext = 'CardRelatedHelp';
            this.listicon = 'fa-key';
            this.listtitle = 'Glossary';
            cxt = this.recordId;
            break;
                
        case "HelpComments" :
            this.actioncode = 'HelpComments';
            this.listicon = 'fa-comment';
            cxt = this.recordId;
            break;
                    
        case "HelpEnableMode" :
            this.Icon = 'fa-puzzle-piece';
            break;

        case "PopularHelp" :
            this.actioncode = 'PopularHelp';
            this.listlisticon = 'fa-list';
            cxt = this.recordId;
            break;

        case "QuickLinks" :
            this.actioncode = 'QuickLinks';
            this.listicon = 'fa-list-ol';
            cxt = this.recordId;
            break;

        case "ReadingLists" :
            this.actioncode = 'ReadingLists';
            this.listicon = 'fa-list-ol';
            cxt = this.recordId;
            break;

         case "Stickies" :
            this.actioncode = 'Stickies';
            this.listicon = 'fa-sticky-note-o';
            cxt = this.recordId;
                
            // This is one of the few special cases where we want to retain record selection marking as we scroll list
            this.retainselectiononscroll = true;
            break;

        case "Search" :
            this.actioncode = 'Search';
            cxt = this.recordId;
           // this.listtitle = 'Search Results';
            break;

        case "TabListing" :
            this.actioncode = 'TabListing';
            cxt = this.recordId;
			break;

		case "ToolsOnly" :
			// Seek no data (as blank list) but DO obtain configuration tool information for specified context
            this.actioncode = "ToolsOnly";
				
			// Keep track of any supplied listing items
			ToolsOnlyList = this.cardlistitems
				
			break;

         //////////////////////////////////////////////////////////////////////////////////
         // Cases coming from design parameters
         //////////////////////////////////////////////////////////////////////////////////

        case "All Help" :
        case "AllHelp" :
            this.toolcontext = 'CardRelatedHelp';
            this.actioncode = 'AllHelp';
            this.listicon = 'fa-list';
            this.listtitle = 'Help for this Page';
            cxt = this.recordId;

            // Respond if we don't have a record ID: seek a context via page URL
				if (cxt + '' == 'null' || cxt + '' == 'undefined') {	
					cxt = this.getPageContextIdentifier();
				}
            break;

        case "Bookmarks" :
            this.toolcontext = 'CardRelatedHelp';
            this.actioncode = 'HelpBookmarks';
            this.listicon = 'fa-bookmark';
            
            

            cxt = this.recordId;
            this.listtitle = 'Help Bookmarks';
            break;
            
        case "Child Help" :
        case "ChildHelp" :
            this.toolcontext = 'CardChildHelp';
            this.actioncode = 'ChildHelp';
            this.listicon = 'fa-list';
            this.listtitle = 'Child Help';   
            // Prioritise default help context if supplied
            if (this.helprecordid != '' && this.helprecordid != null) {
                cxt = this.helprecordid;
            } else {
	            cxt = this.recordId;
            }
            break;

		case "Fixed Help" :
		case "FixedHelp" :
            this.toolcontext = 'FixedHelp';
			this.actioncode = 'FixedHelp';
			this.listicon = 'fa-list';
			cxt = this.sobjectname;
            this.listtitle = 'Help Topics';
			break;

        case "Help Notes" :
        case "HelpNotes" :
            this.toolcontext = 'CardStickies';
            this.actioncode = 'Stickies';
            this.listicon = 'fa-sticky-note-o';
            cxt = this.IHContext;
            break;

        case "Reading Lists" :
        case "ReadingLists" :
            this.toolcontext = 'CardReadingLists';
            this.actioncode = 'ReadingLists';
            this.listicon = 'fa-list-ol';
            cxt = this.recordId;
            this.listtitle = 'Related Reading List';
            break;
        
        case "Related Help" :
        case "RelatedHelp" :
            this.toolcontext = 'CardRelatedHelp';
            this.actioncode = 'AllRelatedHelp';
            this.listicon = 'fa-list';
            this.listtitle = 'Related Help';          
            // Prioritise default help context if supplied
            if (this.helprecordid != '' && this.helprecordid != null) {
                cxt = this.helprecordid;
            } else {
	            cxt = this.recordId;
            }   
            break; 
        
        case "Resources" :
            this.toolcontext = 'CardResources';
            this.actioncode = 'AllResources';
            this.listicon = 'fa-map-signs';
            this.listtitle = 'Related Resources';
    
            // Prioritise default help context if supplied
            if (this.helprecordid != '' && this.helprecordid != null) {
                cxt = this.helprecordid;
            } else {
	            cxt = this.recordId;
            } 
            break;

        case "Tagged Items" :
        case "TaggedItems" :
            this.toolcontext = 'CardRelatedTags';
            this.listicon = 'fa-tags';
            this.actioncode = 'GetTaggedItems'; 
                    
                           
            if (this.ListingTagFilters != '') {
                cxt = this.helprecordid + '' + D1 + this.ListingTagFilters;    
                    
            } else {
                 cxt = this.helprecordid;
            }
            break;
        case "Tree Content":
        case "TreeContent":
            this.toolcontext = 'CardRelatedHelp';
            this.listicon = 'fa-tree';
            this.actioncode = 'TreeNodes'; 
            this.listtitle = 'Tree Search'
            
            if (this.listingclickactioncode == '') {
                this.listingclickactioncode = 'RelatedHelp';
            }
            
            cxt = this.helprecordid;
            
            break;
		case "Unfeatured Reading Lists" :
        case "UnfeaturedReadingLists" :
            this.toolcontext = 'CardReadingLists';
            this.actioncode = 'ReadingListsXF';
            this.listicon = 'fa-list-ol';
            cxt = this.recordId;
            this.listtitle = 'Related Reading Lists';
            break;

        default :
            // Default to taking no action - but note this fact in diags...?
            this.Diags=this.Internationalise('AdviceLabelUnknownListing');
                
            //... except we can't really do that - or we'll get no onward nav tools or any translations!
            this.toolcontext = 'QAM';
            cxt = this.recordId;
            break;

        
    }


    // Set tool context if this has not been done elsewhere above or by list owner
	if (this.toolcontext == '') {
		this.toolcontext = 'QAM';
	}

    if (this.CardConfig == 'HelpEnableMode') {
        //    act = cmp.get("c.getHelpableElements");
        //    act.setParams({ 
        //        "IHContext" : cmp.get('v.IHContext'),
        //        "ObjectName" : cmp.get('v.sObjectName')
        //    });                       

        } else {
        
			var parms;
			if (this.actioncode == 'GetTaggedItems') {
				parms = cxt;

} else if (this.actioncode == 'TreeNodes') {
	
	// For trees, we need to respect any 'max levels' limit that has been specified
	parms = this.treemaxdepth + '^ServiceIHTrees.TNSHelpTopics';
				
			} else {
				parms = this.RowLabellingOption;
			}  			             
            
			// Allow page-author specified tool context, noted on the way in to this function,
			// to override any defaults used above

			if (TCxt != '' && TCxt != '[DEFAULT]' && TCxt != 'QAM') {
				this.toolcontext = TCxt;
			}         
   

             //this.toolcontext=this.toolcontext;
        getTools({ToolContext : this.toolcontext, 
            ActionCode : this.actioncode,
            IHContext : cxt,
            ClientComponentId : this.componentid, 
            Params : parms,
            SkipGlobals : false
        })  // Create a callback that is executed after the server-side action returns
        .then(result=>{
                this.results = result;
                this.processTools(result);
				// Complete post-processing for some special cases
				if (listConfig == 'ToolsOnly') {
					this.cardlistitems = ToolsOnlyList;
				}
                console.log('modifiedheadertools----');
                console.log(this.modifiedheadertools);
                console.log('---modifiedcardlistitems for list ---');
                console.log(this.modifiedcardlistitems);
                //setting color for Tile rebranding
                this.style2 = this.uxthemecolour1;
                this.style3 = this.uxthemecolour2;
                this.style4 = this.uxthemecolour3;
                this.stylewhitecard = this.uxmenubackgroundcolour;
                this.darkmodeWhitecol = this.uxmenufontcolour;
               
             })
             .catch(error=>{
                 this.errors = error;
                 console.log('this.errors',this.errors);
             });                     
            
            this.IHContext = cxt;
        }         

        // Send action and note the fact that this has been done / we're initialised        
        this.isinitialised = true; 
    }

    handleSubscribe() {
    
        if (this.subscription) {
            return;
        }
        this.subscription = subscribe(this.messageContext, messageChannel, (message) => {  
         this.handleMessage(message);
        },{scope:APPLICATION_SCOPE});
    }
    handleMessage(message) {
        console.log(' In handle Message!! LIST--');
        console.log(message);
         this.handlePassThroughs(message);    
          
    }

    // Respond to requests to toggle our listing size
    handlePassThroughs(message) {
        console.log('From LIST handlePassThroughs--');
        var aCode = message.ActionCode;
        var parms = message.Parameters;
        var src = message.SourceComponent;
        console.log('aCode--'+aCode+'--parms--'+parms+'--src--'+src);

        //If Recordid is not Null then then if block is executed
        if(message.RecordId!=null && message.RecordId+''!='undefined'){
            this.selectRecord(message);  
        }

         // Direct request to expand / collapse list
        if(aCode === 'ShowListingDetails' || aCode === 'HideListingDetails'){

            // Switch the listing row style
            if(aCode === 'ShowListingDetails'){
        		this.toggleListingDetails('Expanded'); 
            } else{
            	this.toggleListingDetails('Hidden');
            }
        }

         // (Card) tool processing complete: implies need to re-set list style
        if (this.eventIsOurOwn) {                
	        if (aCode === 'ComponentToolsProcessed') {
				//cmp.set("v.CurrentRows", cmp.get("v.InitialRows"));
                this.CurrentRows = this.InitialRows;

                //helper.setCurrentRows(cmp, event, helper);
	        
	            this.establishAndToggleListingDetails();
	        }
        } 

        // Certain actions should only provoke response if they're our own (and require a Component ID)
        if (src != '' && src != null && this.eventIsOurOwn(message)) {

            // Refresh the metadata about Apps in the current org
			if (aCode == 'RefreshAppListing') {
				var src = '/apex/iahelp__IHLUXOpHandler?Op=4';
			    this.doDialogue('RefreshAppListing', 'VF', src, null, 100, false, false, false, true);	
			}
			
            // Refresh the metadata about tabs in the (previously selected, context) App
			if (aCode == 'RefreshTabListing') {
				var src = '/apex/iahelp__IHLUXOpHandler?Op=5&IHContext=' + this.IHContext;
			    this.doDialogue('RefreshAppListing', 'VF', src, null, 100, false, false, false, true);
			}

            // Allow creation of a new Sticky Note via a modal dialogue
	        if (aCode === 'NewStickyModal') {

                var src = 'iahelp:IHNote';
                var aMap = {
            		"recordId": this.IHContext
                };
                this.doDialogue('Stickies', 'LUX', src, aMap, 500, false, false, true, true);
	        }

            // Delete the current topic, after local confirm message
	        if (aCode === 'DeleteTopic') {
            	if (confirm(this.Internationalise('MessageDeleteWarning'))) {
            	
            		// Parameters here (from IHCard / listing tool click) are in the passthrough form of:
            		// [Listing ID] [Delimiter] [Other source parameters]
            		// Here we just want the listing (Topic) ID
            		var D1 = '^';     			            		
            		parms = parms.split(D1);

                    deleteTopic({
                    "HelpTopicId" : parms[0]    
                    }).then(result=>{
                        // This should return an empty response value:
                        var ret = result.getReturnValue();
                        if (ret != '') {
                            // If there are any diagnostics, assume this is an error and show them
                            this.Diags = ret;
                        
                        } else {
                            // If delete was successful, reflect this in diags...
                            this.Diags = this.Internationalise('MessageGenericTaskComplete');
                        
                            // ... then update our listing to depict row deletion: add IHHelpedSFElementError class
                            //var lst = cmp.get("v.ListingItems");
                            var lst = this.cardlistitems;
                        
                            lst.forEach(function(L) {
                                if (L.Id == parms[0]) {
                                    L.StyleClass = 'IHHelpedSFElementError';
                                 }
                            });
                        
                           //cmp.set("v.ListingItems", lst);
                            this.cardlistitems =  lst;
                        }
                    })

            	}
	        }//end of delete topic
            

        }


    }


    // Respond to the "select" event raised by lists (if we're listening to the source component)
    selectRecord(message){
        console.log('selectRecord method LIST--');
        console.log(message);
        var theRecord = message.RecordId;
        var theSource = message.SourceComponent;
        var cxt = this.toolcontext;
        var aCode = this.actioncode;
        console.log('theRecord-- '+theRecord+'toolcontext-- '+cxt+'actioncode-- '+aCode+' cardcomponentid--'+this.cardcomponentid);

       // Only respond to events that do not emanate from ourselves / do
       // emanate from the  "desired" master list we wish to tie to
       if(this.eventBeingListenedTo(message)==true){
             this.IHContext = theRecord;
             this.recordId = theRecord;
            getTools({ToolContext : cxt, 
                ActionCode : aCode,
                IHContext : theRecord,
                ClientComponentId : theSource, 
                Params : '',
                SkipGlobals : false
             })
             .then(result=>{
                this.results = result;
                this.processTools(result);
         })
        }

    }

    // Locate UI elements (e.g., listing rows) that represent "selected" records and visually mark them
    markSelections(evt){

        // Re-mark any selected rows (e.g., after a search that included them)
        try {
            var LSelections = this.ListingSelections;
			var LI;

            for (var i=0; i< LSelections.length; i++) {

                LI = this.template.querySelector('[data-ids=LINarrow_'+LSelections[i]+']' );
                LI.classList.add('IsSelected');

                LI = this.template.querySelector('[data-ids=LIWide_'+LSelections[i]+']' );
                LI.classList.add('IsSelected');
                
            }
            // If there are any selected rows, show this on any tools that respond to selections
			this.markSelectionControlledTools();	
            
        } catch (e) {
            
        }

    }

    // Work out which list details style should be in play and toggle to it
    establishAndToggleListingDetails(){

        // Once tools are prepared, toggle listing to the desired style:
        // Check for personalisation setting here (overrides page designer's default):

        var styl = this.ListingRowStyle;
        var PS = this.PersonalisationSettings;
        var i;

        // Only really want to do this in the QAM...
        if (this.componentid == 'theQAM') {
	        for (i=0; i<PS.length; i++) {
	            if (PS[i].iahelp__HelpInteractionType__c === 'List Detail Level') {
	                styl = PS[i].iahelp__Description__c;
	            }
	        }
        }

        this.toggleListingDetails(styl);
     }

    // Show / hide listing full details
    toggleListingDetails(styl){

         var i;
         var PS = this.PersonalisationSettings;

        // Ensure we record in component the style we were told to toggle
        // and also record an interaction reflecting this
        if (styl != this.ListingRowStyle) {
            this.ListingRowStyle = styl;
	        this.logListState(styl);

			// Also, record this back to our "current" personalisation settings
			for (i=0; i<PS.length; i++) {
			    if (PS[i].iahelp__HelpInteractionType__c === 'List Detail Level') {
			        PS[i].iahelp__Description__c = styl;
			    }
			}
        }

         // Also, ensure we toggle the list style button itself 
        // (avoid "Hide Details" tool showing when ddetails are already hidden!)
        if (styl == 'Expanded') {
	        this.toggleConfigTool('Ellipsis', 'ShowListingDetails');
        } else {
	        this.toggleConfigTool('Ellipsis', 'HideListingDetails');
        }

     }


     // Set the data of a list row D&D operation  
     doDragStart (evt) {
        var T = evt.target.id;
        var parms = [];
        var D = this.delimiter;
        evt.dataTransfer.dropEffect = "move";
        console.log('------dragging started');
        // Set data to identify that a list row is being dragged, plus include record ID:
		// See mark up: clickable ID forming the parameters will be in the form:
		// [Record ID] [Delimiter] [Action Code (HelpCallout for usual clicks)] [Delimiter] [Parameters to HelpCallout action]
		// All we need here is the record id...
		parms = T.split(D);
        evt.dataTransfer.setData('text', 'ListRow' + D + parms[0]);
    }

    // Allow listing row drags
    drag (evt) {
        evt.preventDefault();
      }

    // For list just-in-time rendering, set the upper number of rows of data to render for the time being (delegated)
	setInitialRows(evt) {
        this.CurrentRows = this.InitialRows;
	}

    // For list just-in-time rendering, set the upper number of rows of data to render for the time being
	setCurrentRows(evt){
        var i = parseInt(this.CurrentRows);
		
		i += 50;
		if (i > this.cardlistitems.length){
            i = this.cardlistitems.length;
        }
        this.CurrentRows = i;
	}

 
}