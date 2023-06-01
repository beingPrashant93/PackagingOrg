import { LightningElement, track,api,wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import myResource from '@salesforce/resourceUrl/iahelp__IHResources';
import { loadStyle } from 'lightning/platformResourceLoader';
import dropNewTopic from '@salesforce/apex/iahelp.ControllerLUXOps.dropNewTopic';
import logAuthorConfig from '@salesforce/apex/iahelp.ControllerLUXOps.logAuthorConfig'; 
import addBookmark from '@salesforce/apex/iahelp.ControllerLUXOps.addBookmark'; 
import removeBookmark from '@salesforce/apex/iahelp.ControllerLUXOps.removeBookmark';
import logLUXInteraction from '@salesforce/apex/iahelp.ControllerLUXOps.logLUXInteraction';
import deleteHelpTopicResource from '@salesforce/apex/iahelp.ControllerLUXOps.deleteHelpTopicResource';
import archiveSticky from '@salesforce/apex/iahelp.ControllerLUXOps.archiveSticky';
import deleteRelationship from '@salesforce/apex/iahelp.ControllerLUXOps.deleteRelationship';
import { publish,subscribe,APPLICATION_SCOPE,unsubscribe,createMessageContext,releaseMessageContext,MessageContext } from 'lightning/messageService';
import messageChannel from '@salesforce/messageChannel/MyMessageChannel__c';
import getTools from '@salesforce/apex/iahelp.ControllerLUXOps.getTools';
import {hidePoweredBy, getMyAttribute,doDialogue,deTokenize,getConfigToolForAction,getSupportControlsForConfigTool,getToolBit,Internationalise,processTools} from './helper';
import Id from '@salesforce/user/Id';
//export * from './helper';

export default class Ihcard1 extends NavigationMixin(LightningElement) {
    @wire(MessageContext)
    messageContext;
    subscription=null;
    @api get cardheight(){
        return (this.height ==-1? 'height:100%;' : 'height:'+this.height+'px;');
    }
    @api isinitialised = false;
    @api parent = false;
    @api componentref=this;
    @api uniqueident='';
    @api cardishelptopic;
    @api thevote;
    @api delimiter;
    @api advicelabeltools='Tools';
    @api toolcontext='QAM';
    @api helpid=null;
    @api H_UtilityBar=0;
    @api ViewportHeightRequested=false;
    @api sizingtimer=0;
    @api SuppressCardUI=false;
    @api height=450;
    @api HasHistory=false;
    @api history=[];
    @api globalsettings;
    @api portalpage;
    @api ihcontext='';
    @api h_header=0;
    @api h_footer=0;
    @api h_bodytools=0;
    @api extendedcapabilities;
    @api listingtools=[];
    @api modifiedlistingtool=[];
    @api cardsuppressheader=false;
    @api cardsuppressfooter=false;
    @api suppresspoweredby = false;
    @api actioncode='AllHelp';
    @api cardrootnode='';
    @api VoteOptions=[];
    @track tmp=[];
    @track flag=false;
    @api helptopics=[];
    @api ListingItems=[];
    WizardSteps;
    WizardStepbodytools;
    @api ComponentGeneratorInUse =false;
    @api SuppressBodyTools=false;
    @api bodytools=[];
    @api footertools=[];
    @api stencilrows=['row1','row2','row3','row4','row5'];
    PassThroughData=[];
    @api currentrecordmetadata;
    @api CustomFields=[];
    @api icon='fa-question';
    @api SkipGlobals=false;
    @api isauthor=false;
    @api isUser=false;
    @api isAnalyst=false;
    @api isAdministrator=false;
    @api helpedelements=[];
    @api clk=false;
    @api ihcardtype='';
    @api get cardTypeList(){return (this.ihcardtype=='List' && this.isbusy==true ? true:false)};
    @api get cardtypeaf(){return (this.ihcardtype=='AutoForm' && this.isbusy==true ? true:false)};
    @api get cardTypeDetail(){return (this.ihcardtype=='Detail' && this.isbusy==true ? true:false)};
    @api get cardtypeevaluate() { return  this.ihcardtype=='tree' && this.isbusy==true ? true:false};
    @api cardlistitems=[];
    @api cardcomponentid;
    @api cardlistensto;
    ResponseLatch=false;
    @api title='[Title]';
    @api styleFAInverseStack1x ="color: #fff; position: absolute; left: 0; width: 100%; text-align: center;";
    AdviceLabelModified='Modified';
    @api dropdowntools=[];
    @api headertools=[];
    @api modifiedheadertools=[];
    @api headertoolsupportcontrols=[];
    @api ellipsistools=[];
    @api modifiedellipsistools=[];
    @api internationalisations=[];
    @api sobjectname;
    @api temphelpid=null;
    @api modifiedheadertoolsupportcontrols=[];
    @api modifiedbodytools=[];
	@api modifiedcardlistitems=[];
    @api UIFilter='AllHelp';
    @api modifiedlistingtoollc=[];
    @api cardconfig;
    @api retainselectiononscroll=false;
	@api SelectedRow = '';
    @api CalloutOption = 'Topic Selected Event plus Topic view';
    @api CalloutOptionSelectiveOverride=false;
    @api var1;
    @api reff = this;
		@api suppresspoweredby1=false;
    @api srif;
		@api ProductPoweredBy='Powered by Improved Help from Improved Apps Ltd.';
    @api get helprecordid(){
        return this._helprecordid;
    }
    set helprecordid(value){
        this._helprecordid = value;
    }
    @api isbusy=false;
    @api diags='[ok]';
    @api configtoolfilterinfo=[];
    @api footerlogo=false;
    
    /* 
================================================
Internationalised values for use in mark-up
================================================*/
	//Globals
	@api ButtonCancel ='';
	@api ButtonGotoTemplates ='';
	@api ButtonSave ='';
	@api ButtonQuickSave ='';
	@api FieldLabelAvailable ='';
	@api FieldLabelCreatedBy ='';
	@api FieldLabelCreatedByDT ='';
	@api FieldLabelModifiedBy ='';
	@api FieldLabelModifiedByDT ='';
	@api FieldLabelSelected ='';
	@api MessageGenericTaskComplete ='';
	@api MessageValueRequired ='';
	@api TipButtonClose ='';
	@api tipbuttoncompactview ='';
	@api TipButtonConfigureSettings ='';
	@api TipButtonGotoTemplates =''; 
	@api TipButtonHelpHome ='';
	@api tipbuttonuploadimage ='';
	@api TipGenericCancel ='';
	@api TipGenericDelete ='';
	@api tipgenericedit ='';
	@api TipGenericOK ='';
	@api TipGoto ='';
	@api TipReadMoreLinkUsers ='';
	@api TipVote ='';
	@api TitleHelpedElement ='';
    @api test=false;
    @api listingselections=[];

	//LUXComponents
    @api AdviceLabelGenericTextPlaceholder ='Modified';
    @api AdviceLabelItemsViewed ='Items Viewed'; 
    @api AdviceLabelModified ='Modified';  
	@api AdviceLabelSelectFields  ='';   
    @api AdviceLabelWorking ='Working...';
    @api FieldLabelMyNotes ='My Notes' ;
    @api FieldLabelSaveFormAs ='My Notes'; 
	@api AdviceLabelTagMode  ='AdviceLabelTagMode';  
	@api FieldLabelTagModeAll  ='FieldLabelTagModeAll';   
	@api FieldLabelTagModeAny  ='FieldLabelTagModeAny' ;  
	@api FieldLabelTreePrintIndentationLevel  ='FieldLabelTreePrintIndentationLevel';  
	@api TipButtonSettings ='Settings' ;
	@api TipView ='';
	@api TitleSelectFields  ='';   
	@api TitleTabVisible  ='';   
	@api TitleAllRelatedHelp  ='';   
	@api TitleReadingLists  ='';   
	@api TitleAllResources  ='';   
	@api TitleQuickLinks  ='';   

	//IHTools
	@api ButtonGotoVoteSets  ='';   
	@api ButtonPreviewCallout  ='';   
	@api ButtonPreviewCalloutAsEdited  ='';   
	@api FieldLabelActive  ='';   
	@api FieldLabelCalloutHeight  ='';   
	@api FieldLabelCalloutMediaChoice  ='';   
	@api FieldLabelCalloutTemplate  ='';   
	@api FieldLabelCustomStyle  ='';   
	@api FieldLabelFullTemplate  ='';   
	@api FieldLabelHeightBeforeScrolling  ='';   
	@api FieldLabelImageALTText  ='';   
	@api FieldLabelImageCaption  ='';   
	@api FieldLabelImageHeight  ='';   
	@api FieldLabelImageTitle  ='';   
	@api FieldLabelImageURL  ='';   
	@api FieldLabelImageWidth  ='';   
	@api FieldLabelKeywords  ='';   
	@api FieldLabelLightningTemplate  ='';   
	@api FieldLabelMasterTopicIdentifier  ='';   
	@api FieldLabelName  ='';   
	@api FieldLabelSummary  ='';   
	@api FieldLabelSFHelpURL  ='';   
	@api FieldLabelShowCallout  ='';   
	@api FieldLabelShowReadMore  ='';   
	@api FieldLabelShowReferringTopics  ='';   
	@api FieldLabelStatus  ='';   
	@api FieldLabelStepContext  ='';   
	@api FieldLabelStepElement  ='';   
	@api FieldLabelStepLayout  ='';   
	@api FieldLabelStepMode  ='';   
	@api FieldLabelVideoCaption  ='';   
	@api FieldLabelVideoHeight  ='';   
	@api FieldLabelVideoTitle  ='';   
	@api FieldLabelVideoURL  ='';   
	@api FieldLabelVideoWidth  ='';   
	@api FieldLabelVisibility  ='';   
	@api FieldLabelVoteInfo  ='';   
	@api TipButtonPreviewCallout  ='';   
	@api TipButtonPreviewCalloutAsEdited  ='';   
	@api TipButtonResetImage  ='';   
	@api TipButtonResetVideo  ='';   
	@api TitleGuides  ='';   
	@api TitleTabCustom  ='';   
	@api TitleTabGeneral  ='';   
	@api TitleTabGuides  ='';   
	@api TitleTabStatus  ='';   
	@api TitleTabText  ='';   
    @api datmode='View'; // Couldn't keep word 'data' as it is a reserved attribute
	// IHConfirmActions
	@api ColumnLabelDeleteAssociatedTopic  ='';   
	@api ColumnLabelUseExistingTopic  ='';   
	@api TipButtonSave  ='';   

    //branding
    @api carduxtheme='';
    @api cardbackgroundstyle='Coloured';
    @api uxthemecolour1='#';
    @api uxthemecolour2='#';
    @api uxthemecolour3='#';
    @api uxthemecolour4='#';
    @api uxbodybackgroundcolour='#';
    @api uxmenubackgroundcolour='#';
    @api uxmenufontcolour='#';
		@api issubcomponent = false;

	// ClientSide (QAM)
	@api QAMAdviceLabelGuideStepCounter1  ='';   
	@api QAMAdviceLabelGuideStepCounter2  ='';   
	@api QAMTitleButtonGotoNextStep  ='';   
    @api QAMButtonGotoNextStep  =''; 
    @api isdirty=false; 
    @api get divcls1()
    { return (this.icon == ''||this.icon=='undefined' ? 'slds`-hide' : 'slds-media__figure')};
    @api get ddtools()
    {return (this.dropdowntools.length > 0 ? 'slds-dropdown-trigger_click slds-is-open IHLUXDropDown' : 'slds-dropdown-trigger_click slds-is-open')};
    @api get ddtools2()
    {return (this.dropdowntools.length > 0 ?  'slds-button slds-button_icon-container IHCardDropDownButton' : 'slds-hide')};
    @api get iclass1(){return 'fa ' + this.icon + ' fa-stack-1x fa-inverse';}
    @api get isdirtyclass()
    {return (this.isdirty == true ? 'slds-badge' : 'slds-hide')};
    @api get headerclass()
    { return (this.cardsuppressheader==false?'slds-card__header slds-grid':'slds-hide')};
    @api communityroot='';
    @api get footerclass()
    { return (this.cardsuppressfooter==false?'slds-card__footer':'slds-hide')};

    @api get footerlogoclass()
    { return (this.carduxtheme == 'Dark' ? 
    'IHCardFooterLogo IHCardFooterOnLogo IHCardFooterLogoLight' : 
    'IHCardFooterLogo IHCardFooterOnLogo IHCardFooterLogoDark')};
    @api get styleddt1() { return ('border: solid 2px #' + this.uxthemecolour1 + '; border-top: none; border-radius: 0 0 1rem 1rem; background-color: #' + this.uxmenubackgroundcolour + ';')};
    @api get ihcardfooterstyle(){ return this.ihcardtype == 'AutoForm' ? 'height:6px':'height:0px'};
    @api get heightcal(){ return( 'height: CALC(100% - ' + (this.h_header+this.h_footer)+'px); background: ' + this.uxbodybackgroundcolour + ';' )};
    @api get outerDivHt(){ return (this.SuppressCardUI == true ? '' : 'height: 100%;')};
    @api get innerDivHt(){ return (this.height == -1 ? 'height: 100%;' : '')};
    @api get hideBody(){ return (this.ihcardtype!='List' && this.ihcardtype!='Detail' && this.ihcardtype!='AutoForm' && this.isbusy==true? true: false) };
    @api get globalStyle() { return (this.globalsettings+''!=='undefined'?'color: #' + this.globalsettings.iahelp__BrandColour6__c  + ';' :'')};
   // @api get globalStyle2() { return (this.globalsettings+''!=='undefined'?'background: #' + this.globalsettings.iahelp__BrandColour4__c  + ';' :'')};
    @api get globalStyle2() { return ('background-color: #' + this.uxthemecolour1 + ';')};
    @api get calculateExpr() { return (this.SuppressCardUI == false || this.ComponentGeneratorInUse == true)?true:false };
    @api get styleddt() { return ('color: #' + this.uxthemecolour1 + ';')};
    @api get pb1() {return (this.carduxtheme == 'Dark' ? 'IHCardFooterLogo IHCardFooterOnLogo IHCardFooterLogoLight' : 'IHCardFooterLogo IHCardFooterOnLogo IHCardFooterLogoDark')};
    @api menuItemClickReference;
    @api varthis;
    @api currentUserId = Id;
    //@api idnamelist={};
    @api get idnamelist(){
        return this._idnamelist;
    }
    set idnamelist(value){
        this._idnamelist = value;
    }
    connectedCallback(){
        console.log('this.cardlistitems'+this.cardlistitems);
        this.cardrootnode = '';
        this.varthis=this;
        console.log('idnamelist');
        console.log(this.idnamelist);
        this.suppresspoweredby = this.cardsuppressfooter;

        console.log(' toolcontext '+this.toolcontext);
        if(this.ihcardtype=='tree')
            {   this.icon='fa-tree';}
        console.log(' ihcardtype '+this.ihcardtype);
        console.log('Card --- this.globalStyle '+this.globalStyle);
        console.log('Card --- this.temphelpid '+this.temphelpid);
        if(this.temphelpid!=null){
            this.helprecordid=this.temphelpid;}
        console.log(' cardheight '+this.cardheight);
        console.log(' cardcomponentid '+this.cardcomponentid+' cardrootnode '+this.cardrootnode);
        console.log(' iclass1 '+this.iclass1+' divcls1 '+this.divcls1+' icon '+this.icon+' ddtools '+this.ddtools+' ellipsistoolsClass '+this.ellipsistoolsClass);
        Promise.all([
            loadStyle(this, myResource + '/lib/FontAwesome463/css/font-awesome.min.css')
        ])
        this.handleSubscribe();         
        this.sizingtimer=this.setSizingTimer();
		this.reff = this;
    }
    compute(){
        console.log(' a ---');
    }
    @api get ellipsistoolsClass(){
        return (this.ellipsistools.length > 0)? 'slds-dropdown-trigger slds-dropdown-trigger_click slds-is-open' : 'slds-hide';
    } 
    handleSlotChange(e){
      
    }
    handlechange(){
        var x=['test','test 2','test 3'];
        this.tmp=x;
      //  console.log('tmp '+this.tmp+ ' cardlistitems'+this.cardlistitems);
    }
    reportRenderedHeight(event){
        // This is a useful juncture to use to show powered by logo / product strapline:
		// Do NOT show powered by strapline if this has been suppressed 
				
		try {			
			var PB = this.template.querySelector('[data-id = "PoweredBy"]');
				PB.classList.add("pointer");
			if (PB + '' != 'undefined' && this.suppresspoweredby == false) {
			
				PB.classList.add("IHCardFooterLogoExpanded");
          
			}else{

           if(this.footerlogo == false){	
                PB.classList.add("IHCardFooterLogoMargin");
            }	
			}
				if(this.suppresspoweredby1 == true){
					PB.classList.remove("IHCardFooterLogo");
                    
			}
            if(this.suppresspoweredby1 == false){
                PB.classList.add("IHCardFooterLogo");
                
            }
				if(this.ihcardtype == 'Detail' && this.footerlogo == false){
						PB.classList.add("IHCardFooterLogo");
				}
				if(this.ihcardtype == 'AutoForm' && this.footerlogo == false){
						 PB.classList.add("IHCardFooterLogoExpanded");
						 PB.classList.remove("IHCardFooterLogoMargin");
						 
					
				}
			
				if(this.issubcomponent == true && this.footerlogo == false && this.ihcardtype == 'AutoForm'){
						PB.classList.remove("IHCardFooterLogoExpanded");
						
				}
		} catch (e){}
	
	
		// NB: here, we call the reporting function then set latch to prevent further reporting
	//	helper.reportRenderedHeight(cmp, event, helper);
	//	cmp.set("v.RenderedHeightReported", true);
    }

    // Hide product strapline as and when required
	hidePoweredBy () {
		hidePoweredBy(this);
	}

    // Initiate periodic component element sizing / height calculation checks, returning timer reference
    setSizingTimer(){
        return setInterval(() => {
			/*
			A timer is required to obtain correct header / body tools / footer sizing if:
			Header is visible and height obtained when last examined was zero OR
			Footer is visible and height obtained when last examined was zero OR
			Body tools exist and height obtained when last examined was zero
			*/
            var BTs = this.bodytools;
            var BTCount = 0;
            try {
                BTCount = BTs.length;
            } catch (e){}

			try {
			//	console.log(' in setSizingTimer ---this.cardsuppressheader '+this.cardsuppressheader+this.h_header);
            //    console.log(' in setSizingTimer ---this.cardsuppressfooter '+this.cardsuppressfooter+this.h_footer);
				if ((this.cardsuppressheader == false && this.h_header == 0) 
							|| (this.cardsuppressfooter == false && this.h_footer == 0)
                            ) {
                              //  console.log(' in setSizingTimer ---h_header ');
					// Timed check is still required
					var H = this.template.querySelector('[data-id="IHCardHeader"]');		
					var F = this.template.querySelector('[data-id="IHCardFooter"]');
					
					this.h_header = H.offsetHeight;
					this.h_footer = F.offsetHeight;
                    
                // Body tools requires slightly different handling as its DIV may not be rendered at all
                if (this.SuppressBodyTools == false) {

                    var B = this.template.querySelector('[data-id="IHBodyTools"]')
                    this.h_bodytools=B.offsetHeight;

                }									
				} else {
					// Header / footer sizes are set: retain timer only if Viewport height was requested,
					// as this requires ongoing response to window re-sizing etc.
                  //  console.log(' In Else Block ViewportHeightRequested '+this.ViewportHeightRequested+' this.height '+this.height)
					if (this.ViewportHeightRequested == false && this.height != -2) {
				//	console.log(' this.sizingtimer '+this.sizingtimer);
						clearInterval(this.sizingtimer);
						this.sizingtimer=0;
					}
				}
                // Check / calculate VP responsive height at least once...
				this.setHeightToVP();
			} catch (e) {
				//console.log('Card - Sizing timer - error: ' + e);
			}
	    	
        }, 500);	
		
    }

    // Intercept special sizing instructions: -2 can be used to set size to available screen height
	setHeightToVP() {
	
		try {
			if (this.height == -2) {
				// If viewport height requested, note this
				this.ViewportHeightRequested=true;
			}
			
			if (this.ViewportHeightRequested == true) {
			
				var H_Calc = 400;
				var H_Padding = 3;
				var H_UBar = this.H_UtilityBar;
	
				try {
					var comp=this.template.querySelector('[data-id="IHCardOutermostReachable"]');
					H_Calc = window.innerHeight - comp.getBoundingClientRect().top - H_Padding - H_UBar;
				} catch (ex) {
					console.log('Card - set viewport height - error getting outer container: ' + ex);
				}
	
				// Only set height if page scroll is at top - otherwise card will 'grow'
				// as we scroll down
                var tmp=this.template.querySelector('[data-id="outerCont"]');
			//	console.log(' tmp.scrollTop '+tmp.scrollHeight);
              //  console.log(' tmp.scrollPosition '+tmp.scrollPosition);
				if (tmp.scrollTop == 0) {
					this.height=H_Calc;			
				} 
				
			}
		} catch (e) {
			console.log('Card - set viewport height - error: ' + e);
		}
	}
    cardBodyScroll(){}
    
    processTools(result){
        console.log("IHCardHelper - processTools "+this.cardsuppressheader);
        // Helper Process tools getting called
        processTools(this,result);
    }

    Internationalise(val){
       // console.log("Internationalise  ");
        // Helper Internationalise getting called
        var res = Internationalise(this,val);
        return res;
    }

    doDialogue(dlgTitle, dlgType, dlgSource, dlgAttrs, frmHeight, allowScroll, largeMode, showFooter, translateTitle){ 
        doDialogue(this,dlgTitle, dlgType, dlgSource, dlgAttrs, frmHeight, allowScroll, largeMode, showFooter, translateTitle)
    }

  getConfigToolForAction(cmp,ToolType, ActionCode){
    var r = getConfigToolForAction(cmp,ToolType, ActionCode);
    return r;
  }
  getSupportControlsForConfigTool(ConfigTool){
    var r = getSupportControlsForConfigTool(ConfigTool);
    return r;
  }
    // Toggle a specified configuration tool to its next state
  toggleConfigTool(ToolType, ActionCode, reference) {
        try {
            var tmp=this;
            var cfgToolRec = getConfigToolForAction(this,ToolType, ActionCode);
            var D1 = this.delimiter;
            

            // We need to hide the requested item and un-hide its "next"
            
            var c1id = this.toolcontext + D1 + ToolType + D1 + cfgToolRec.iahelp__DisplayOrder__c + D1 + this.cardcomponentid;			
            var c1;
            

            var c2id = this.toolcontext + D1 + ToolType + D1 + cfgToolRec.iahelp__ToggleNext__c + D1 + this.cardcomponentid;
            var c2;

            var clickables = reference.menuItemClickReference; //It is populated from menuitemclick method
         //   var clickables = reference.template.querySelectorAll('[data-id="menuClickable"]');
            
                if (clickables + '' != 'undefined') {
                    
                    clickables.forEach(function(C){
                        if (C.getAttribute("data-ids") == c1id) {
                            
                            c1 = C;
                        }
                        if (C.getAttribute("data-ids") == c2id) {
                            c2 = C;
                        }
                    });
                }
            c1.classList.remove('toggleOn');
            c1.classList.add('toggleOff');
            c2.classList.add('toggleOn');
            c2.classList.remove('toggleOff');

        } catch (e) {
            // Nothing useful we can do on error
        }
    }

  doCancel(){

  }
  // Respond to menu item (ellipsis, header or drop down) clicks
  menuItemClick(evt) {
      console.log('In menuitem click');
    var tmp=this;
    // This event may have been fired directly via a control click, or as a "negotiated" tool click pass-through:    
    // Detect which is in play here and obtain parameters accordingly
    var theId=evt.currentTarget;
    var type=theId.getAttribute("data-type");
    var actioncode=theId.getAttribute("data-actioncode");
    var displayorder=theId.getAttribute("data-displayorder");
    var togglenext=theId.getAttribute("data-togglenext");
    var incomingId;
    var CRoot = this.communityroot;	
		// If root is 'null', this can be ignored in most cases
		if (CRoot + '' == 'null') {CRoot = '';}
		if (CRoot != '') {CRoot = '/' + CRoot;}
  /*  try {
        // Only pass-throughs / negotiated tools will have parameters of this kind
        var src;
        var target;
        
        // Only handle pass-throughs from sources we recognise
        if (src === 'negQAM') {
            //theId = event.getParam("Parameters");
            
            // If the desired target of this event is not the component responding here, ignore the event
            //if (target.get("v.cardcomponentid") != this.cardcomponentid")) {
            //	console.log('IHCard.menuItemClick: event target (' + target.get("v.cardcomponentid") + ') is not the current component (' + this.cardcomponentid") + '): ignoring event...');
                return;
            //}

            // We'll need values from our own component - NOT the cmp passed in (which is the negotiating tool bar)
            // So: retrieve the target / reference the negotiator passed in
            cmp = target;
            
        } else {
            return;
        }
                    
    } catch (e) {
        // Hitting error trap means event was fired directly from component tool click, NOT negotiated pass-through
        theId = evt.currentTarget.id;                	
    }


    var D1 = this.delimiter;
    var CRoot = this.CommunityRoot;
    
    // If root is 'null', this can be ignored in most cases
    if (CRoot + '' == 'null') {CRoot = '';}
    if (CRoot != '') {CRoot = '/' + CRoot;}
    

    var showInPlace = false;
    var globalId = this.getGlobalId();
    var cnt = this.template.queryselector('[data-id={globalId} + "CalloutContainer"]');
    var frm = this.template.queryselector('[data-id={globalId} + "tfrm"]');


    // Re-set diagnostics
    this.clearAdvancedDiags(cmp);        
    this.logAdvancedDiags('IHCard.menuItemClick - entry');
    */

    // Click "message" (the id of the clickable) is in the form:
    // [Menu (tool) type] [delimiter] [Action code] [delimiter] [Display Order] [delimiter] [Toggle Next #]

    // Regardless of the action a click is to fire, we should respond to "chained" / toggling
    // tools. These will have a non-zero "toggle to next tool" value

    try {
    
            incomingId = theId;
        //  theId = theId.split(D1);

            if (togglenext!=0) {
                var D1 = this.delimiter;
                // We need to hide the clicked item and un-hide its "next"
                var c1id = this.toolcontext + D1 + type + D1 + displayorder + D1 + this.cardcomponentid;
                var c2id = this.toolcontext + D1 + type + D1 + togglenext + D1 + this.cardcomponentid;
                var c1;
                var c2;

                // Find the clickables to hide/show: NB - use of 'find' here means we should only affect
                // tools that belong to the component whose item was clicked!
                
                var clickables = this.template.querySelectorAll('[data-id="menuClickable"]');
                var tmp=this;
                //Keeping this to use in toggleCofigTool method
                this.menuItemClickReference = clickables; 
                if (clickables + '' != 'undefined') {
                    clickables.forEach(function(C){
                        if (C.getAttribute("data-ids") == c1id) {
                            c1 = C;
                        }
                        if (C.getAttribute("data-ids") == c2id) {
                            c2 = C;
                        }
                    });
                }
                

                // Classes to apply vary by clickable (tool) type
                if(c1+''!='undefined' && c2+''!='undefined'){
                    if (type == 'Header') {
                        c1.classList.remove('fa-stack');
                        c1.classList.add('slds-hide');
                        c2.classList.add('fa-stack');
                        c2.classList.remove('slds-hide');

                    } else if (type == 'Body') {
                        c1.classList.add('slds-hide');
                        c2.classList.remove('slds-hide');
                    } else {
                        c1.classList.remove('toggleOn');
                        c1.classList.add('toggleOff');
                        c2.classList.add('toggleOn');
                        c2.classList.remove('toggleOff');
                    }               
                }
            }

    } catch (e) {
        console.log('IHCard.menuItemClick - error: ' + e);
    }


   // this.logAdvancedDiags('Incoming action code: ' + actioncode);
    switch (actioncode) {
        case 'AuthorConfigObject':
        case 'AuthorConfigTopic':
        case 'AuthorConfigTopicPrompted':
            var act;
            var Parms;
            if (actioncode == 'AuthorConfigObject') {
                // If setting an object (eg list in fixed help mode), ask the user the object API name that is desired
                Parms = prompt(Internationalise(this,'MessageEnterObjectName'), '');
                if (Parms == '' || Parms + '' == 'null') {return;}
                Parms = 'sObjectName~' + Parms;
                
            } else if (actioncode == 'AuthorConfigTopicPrompted') {
                // If setting topic to one that may not be part of the current context (eg list in tagged items mode), ask for an ID
                Parms = prompt(Internationalise(this,'MessageEnterTopicId'), '');
                if (Parms == '' || Parms + '' == 'null') {return;}
                Parms = 'HelpRecordId~' + Parms;
                 
            } else {
                // Setting config to match the topic currently in the scope of the calling component:
                // The attribute containing this varies by card...
             //   console.log('IHCard Author Config RootNode '+this.cardrootnode+' ihcardtype '+this.ihcardtype +' HelpRecordId '+this.helprecordid+' cardrootnode ' + this.cardrootnode);
                if (this.ihcardtype == 'Tags') {
                    Parms = 'HelpRecordId~' + this.cardrootnode;
                }
                if (this.ihcardtype == 'tree') {
                    Parms = 'HelpRecordId~' + this.cardrootnode;
                }
                if (this.ihcardtype == 'Detail') {
                    Parms = 'HelpRecordId~' + this.helprecordid;
                }
            }
            console.log('this.cardcomponentid'+this.cardcomponentid);
            logAuthorConfig({
                ComponentId : this.cardcomponentid,
                Params : Parms,
                    }).then(result => {
                        alert(' Author Config Successful!')
                    })
          //  console.log(' act '+act);
            break;

        case 'AddBookmark':
        case 'RemoveBookmark':
         //   this.showSpinner(cmp);

		        var act;
		        if (actioncode == 'AddBookmark') {
                    addBookmark({
                        ToolContext: this.toolcontext,
                        ActionCode: actioncode,
                        IHContext: this.recordId,
                        Params : this.helprecordid,
                            }).then(result => {
                                act= result;
                                //this.processTools(this,result);
                                this.processTools(result);
                            })
	            } else {
                    removeBookmark({
                        ToolContext: this.toolcontext,
                        ActionCode: actioncode,
                        IHContext: this.recordId,
                        Params : this.helprecordid,
                            }).then(result => {
                                act= result;
                               // this.processTools(this,result);
                                this.processTools(result);
                            })
	            }                       
                
              
            break;
        
        case 'AllHelp':
        case 'AllRelatedHelp':
        case 'AllResources':
        case 'Guides' :
        case 'HelpBookmarks':
        case 'HelpComments' :
        case 'PopularHelp' :
        case 'QuickLinks' :
        case 'ReadingLists':
        case 'RefreshHelpList':
        case 'Search':
        case 'Stickies':
            var parms;
            var SupportCtls;
            var theSearchConfigTool;
            var theSearchSupportControls;
            var theSearchSupportControlIdent;
            var i;
			
			this.actioncode=actioncode;
            this.title=Internationalise(this,'Title' + actioncode);

            // In these cases, we're changing the list (server call)
            // so show our "waiting" cues...

            
            if (actioncode == 'RefreshHelpList') {
                // Treat refresh requests same as view all Help:
                // CF: IHList - RefreshCurrentList: the action handled here only re-gets
                // the help for the existing context, whereas RefreshCurrentList results in 
                // a complete component re-build, context establishment included...

                //actioncode = 'AllHelp';
            }
            
            // Retention of "selected" marker for listing rows varies by action
            if (actioncode == 'Stickies') {
                //cmp.set("v.RetainSelectionOnScroll", true);
            } else {
                // Don't override any specific setting to the contrary
                if (this.RetainSelectionOnScroll != true) {
                    this.RetainSelectionOnScroll = false;
                }
            }


            // Re-set (clear) UI filter
            this.UIFilter = 'AllHelp';
            
            // Set card title as this too should change with list type
            //this.Title = Internationalise(this,'Title' + actioncode);
            if(actioncode == 'Search'){
                this.title = 'Search Results';
            }else{
                this.title = Internationalise(this,'Title' + actioncode);
            }
           
        
            // Obtain search parameters, where relevant
            if (actioncode == 'Search') {
                console.log(' inside Search ');

                // Get the search configuration tool record
                theSearchConfigTool = getConfigToolForAction(this,'Header', actioncode);
                
                // From this, get the support controls applicable to the search tool
                theSearchSupportControls = getSupportControlsForConfigTool(theSearchConfigTool);

                // Get the identifier used for search text box: this should be the first (and only) support control.
                // Whatever the support control definition states, we need to add our controls unique ID to it
                theSearchSupportControlIdent = theSearchSupportControls[0][1];
                theSearchSupportControlIdent += this.uniqueident;                    

                // Get this tool's value from the collection of header support controls
                SupportCtls = this.template.querySelector('[data-uniqueid='+theSearchSupportControlIdent+']');
              //  console.log(SupportCtls);
                if (SupportCtls + '' != 'undefined') {
                    parms = SupportCtls.value;
                //    console.log('parms '+parms);  
                    // Require at least a single character before conducting a search
                    if (parms == '') {
                        this.diags = Internationalise(this,'TipInputTextbox');
                        //this.hideSpinner(cmp);
                        return;
                    }
                } 
                                    
                // Add any "retained" (selected) search results to this list and also to our collection of "selected" rows
                // NOTE: act of toggling a selector and / or re-setting selections on load will have set this
                parms += this.delimiter;
                parms += this.listingselections;
              //  console.log('parms '+parms); 
            }
            
            
            // If showing all help, set listing row display parameters
            if (actioncode == 'AllHelp') {
              //  parms = this.RowLabellingOption;
            }

            // Call action to get required listing
           // var act = cmp.get("c.getTools");
            this.actioncode = actioncode;
            
            
            // Set card config to action in certain cases
            if (actioncode == 'AllHelp' 
                    || actioncode == 'HelpBookmarks'
                    || actioncode == 'HelpComments'
                    || actioncode == 'PopularHelp'
                    || actioncode == 'QuickLinks'
                    || actioncode == 'ReadingLists'
                    || actioncode == 'Search'
                    || actioncode == 'Stickies' 
                    ) {
                this.cardconfig = actioncode;
            }
            
          getTools({ 
                ToolContext : this.toolcontext, 
                ActionCode : actioncode,
                IHContext : this.helprecordid,
                ClientComponentId : this.cardcomponentid,
                Params : parms,
                SkipGlobals : false,
            }).then(result => {
               // this.processTools(this,result);
               this.processTools(result);
                SupportCtls.value='';
       // ----------- Even is being raised to pass listitems data to IHList component-----------

                const custEvent = new CustomEvent(
                    'callpasstoparent', {
                        detail: this.modifiedcardlistitems 
                    });
                this.dispatchEvent(custEvent);
            })                                  
             /*                 
                // Having got the desired list, log a LUX List interaction       
                this.logListType ( event, this, actioncode);             
            }); 

            // Send action
            this.logAdvancedDiags( 'Firing getTools');    */          
            break;
            
        case 'ButtonHelp':
        case 'CustomLinkHelp':
        case 'FieldHelp':
        case 'PageHelpLinkHelp':

            this.title=Internationalise(this,'Title' + actioncode);
            break;

        case 'CardGrow' :
            // Nudge height of a card up
            break;

        case 'CardShrink' :
            // Nudge height of a card down - subject to a minimum height
            
            break;

        case 'Comment' :
            var src;
            var cxt = this.toolcontext;
            if (cxt == 'QAM') {
                // QAM comment can only be at page layout level
                var objId = this.recordId;
                objId = objId.substring(0,3);
                src = CRoot + "/apex/iahelp__IHComment?IHLUX=true&PL=" + objId;
                
            } else if (cxt == 'RLViewer') {
                // Reading list comments
             //   src = CRoot + "/apex/iahelp__IHComment?IHLUX=true&RLID=" + cmp.get("v.ihcontext");
                
            } else {
                // If on any other card etc., assume we're commenting on a record (topic)
                src = CRoot + "/apex/iahelp__IHComment?IHLUX=true&HTID=" + this.ihcontext;
            }

            doDialogue(this,'LogComment', 'VF', src, null, 150, false, false, false, true);
            break;
            
        case 'GlobalSettings':
            
            break;

        case 'HelpEnableMode' :
            // We know our object context, so we should be able to 
            // list object's field names and labels, comparing against 
            // things that are already helped

           

            break;

        case 'HelpEnableModeInline' :
            // Show embedded help - but switched into Help Enable mode

            // Show LUX out host with a SF record view - to allow enabling in place...
            // Embedded Help BORDER colour should have been set by now: we must set BACKGROUND colour, as
            // this is an instruction to our LUX Out Host page.             	
            
            
            break;

        case 'HelpEnableModeCancel' :
            // Close dialogue           	
           

            break;

        case 'HelpEnableModeSave' :               
            this.actioncode='AllHelp';
            break;

        case 'HelpHome':				

            break;

        case 'ListsHelp':
            
            break;

        case 'NVShowRecorder':
            // Cue NV video recorder (soft coupling / requires installation of NV app)				
                
            break;

        case 'NewTopic' :
            // Create a new topic then navigate to it:
            // c.f., DropNewTopic action and related this calls - sadly not quite ideal here...
                        
            break;

         case 'QAMHome' :
            // Advise container of this request
           
            break;

        case 'RLExport' :
        case 'ListExport' :
        case 'TreeExport' :
               
                var LIs = this.cardlistitems;
                console.log('carddddd--',this.cardlistitems);
                
                try {
                Array.prototype.push.apply(LIs, this.cardlistitems);
                } catch (error) {
                console.log(error);
                }
                
                //var LIs;
                //var LIs1 = LIs[0];
                var LIs2 = LIs1;
                console.log('LIS1-----'+LIs1);
                console.log('LIS-----'+LIs); //Object.assign(LIs, this.cardlistitems)
                //var LIs = this.modifiedcardlistitems;
                //var LIs1 = LIs[0];
                var LIs1 = LIs;
                console.log('finel Lis'+LIs1);
                var strScope = '';
                var curRow;
                console.log('LIS-----'+LIs);
                // For list export, note whether ANY rows are selected
                // var selectionCount = $('.IsSelected').length;
                
                // LIs.forEach(function(v) {
                for (var i=0; i< LIs1.length; i++) {
                
                // Precise source of Help Topic ID varies by component type
                // if (actioncode== 'RLExport') {
                // On a reading list viewer, listing item ID is that of an RLE - not the actual HTID
                // that we need - which is in its own member...
                // strScope += v.iahelp__HelpTopic__c + ',';
                
                // } else
                if (actioncode == 'ListExport') {
                console.log('inside List Export-----');
                /*// On a listing, we need to take account of "selections", if made:
                // Selected listing items will have their narrow and wide rows marked as such:
                // if ($('#LINarrow_' + v.Id).hasClass('IsSelected') == true || $('#LIWide_' + v.Id).hasClass('IsSelected') == true || selectionCount == 0) {*/

                
                // Don't add "broken" element listings (i.e., missing topic)
                //if (v.Id + '' != 'null') {
                // strScope += v.Id + ',';
                //}
                console.log('List Export-----');
                if (LIs1[i].Id + '' != 'null') {
                strScope += LIs1[i].Id + ',';
                console.log('strScope--'+strScope);
                }
                
                
                } else {
                // On a tree, it's the ID of the node
                // strScope += v.Id + ',';
                strScope += LIs1[i].Id + ',';
                } 
                // })
                }
                if (strScope.length > 0) {
                strScope = strScope.substring(0, strScope.length - 1);
                }
                window.open(CRoot +'/apex/iahelp__IHExportXL?Scope=' + strScope);
            break;

        case 'ReadingListAdd' :
                // Show legacy create Related Help (VF) dialogue
                var src = CRoot + '/apex/iahelp__IHReadingListProperties?HTID=' + this.ihcontext + '&Mode=New&IHLUX=true';
                var ttl = '';
                doDialogue(this,ttl, 'VF', src, null, 540, true, true, false, false);
            
            break;

        case 'RelatedHelpLink' :
                // Show legacy create Related Help (VF) dialogue
                var src = CRoot + '/apex/iahelp__IHSearchResults?IHLUX=true&HTID=' + this.ihcontext + '&Opts=1';
                var ttl = 'LinkRelatedHelp';
                doDialogue(this,ttl, 'VF', src, null, 420, false, false, false, true);
                
            
            break;

        case 'RelatedResourceLink' :
                // Show legacy create Related Resource (VF) dialogue
                var src = CRoot + '/apex/iahelp__IHSearchResults?IHLUX=true&HTID=' + this.ihcontext + '&Opts=3';
                var ttl = 'LinkRelatedResource';
                doDialogue(this,ttl, 'VF', src, null, 420, false, false, false, true);
           
            
            break;

        case 'ShowEmbeddedHelp' :
            // Show LUX out host with a SF record view - to allow hooking / embedded help in place.
            // Embedded Help BORDER colour should have been set by now: we must set BACKGROUND colour, as
            // this is an instruction to our LUX Out Host page. 
            
            
            break;

        case 'HideEmbeddedHelp' :
            // Hide LUX out host, where shown

            break;

        case 'ShowLOBuilder':
            // Show the Lightning Out Host in builder mode
            
            break;

        case 'Statistics':
          //  console.log(' In Statistics ');
             var src = CRoot + "/apex/iahelp__IHStats?IHLUX=true&HTID=" + this.ihcontext;
             doDialogue(this,'Statistics', 'VF', src, null, 145, false, true, false, true);

            break;
            
        case 'TaggedHelp' :
            // Show items "tagged" for use in the QAM - as per QAM's Listing Tag Filters 
            this.actioncode='GetTaggedItems';
            break;

        case 'ToggleCardHeader' :

            // Toggle header visibility
          //  console.log(' In toggle card header ');
            this.cardsuppressheader =!this.cardsuppressheader;

            // Having done so, we need to re-calculate card body height
			this.h_header=0;
			this.sizingtimer=this.setSizingTimer();	
             break;
             
        case 'ToggleHistory':
            // Show / hide the history navigation area
            var h=this.template.querySelector('[data-id="HistoryContainer"]');
            if(h!=null && h+''!='undefined'){
                h.classList.toggle('slds-hide');
            }
            break;

        case 'TreeSearch':
            // Filter info should have been placed by logic (see key up handler) into a "filtered" set of nodes:
            // All we need do here is apply this...
            break;

        case 'ViewHelpedElements':
            var src = CRoot + "/apex/iahelp__IHSearchResults?IHLUX=true&Opts=6&HTID=" + this.ihcontext;
            doDialogue(this,'HelpedElementMaintenance', 'VF', src, null, 400, false, false, false, true);
            break;
        
        default:
            // Process extension tools here:
            console.log ('Option not implemented in SUPER menuItemClick - raising passthrough on behalf of "' + this.cardcomponentid + '": Action=' + actioncode);
            var parameters = {SourceComponent:this.cardcomponentid,Parameters:incomingId,type:type,ActionCode: actioncode,displayorder:displayorder,togglenext:togglenext, cmp:tmp};
            publish(this.messageContext, messageChannel, parameters);                
            break;
        }
    


            // Close menu where relevant
            if (type == 'Drop-down') {
                
            }
            

                    // Hide any callout - unless action has resulted in a callout
                /*  if (showInPlace === true) {
                        

                    } else {
                        // If selected record/context has NOT changed, toggle visibility
                    
                    }*/

    }

    getSearchValue(uniqueid){
        var c = this.template.querySelector('[data-uniqueid='+uniqueid+']');
        console.log('value '+c);
        return c;

    }
    HSTTextKeyup(evt){
        console.log('In HSTTextKeyup ');
        var i;
		var j;
		var cnt = 0;
		var strContent;
		var valNew;
		var ctlType;
		var LIs = this.cardlistitems;
		var ref=this.componentref;	
			
		// Get the search configuration tool record: assume list search first, then try tree search if needed
		// Note, in either case, the type of search/control in use
		var theSearchConfigTool; 
		theSearchConfigTool = getConfigToolForAction(this,'Header', 'Search');
		if (theSearchConfigTool == null) {
			theSearchConfigTool = getConfigToolForAction(this,'Header', 'TreeSearch');
			ctlType = 'TreeSearch';		
		} else {
			ctlType = 'Search';
		}
		
		console.log(' evt.code '+evt.code);
if (theSearchConfigTool == null) {
	theSearchConfigTool = getConfigToolForAction(this, 'Header', 'TreeSearchList');
	ctlType = 'Search';		
}
		// Cue a full search if enter key is pressed
		if (evt.code + '' == 'Enter') {
			// To do this, locate the search tool and fire a click on it
            var D1 = '-';
            var search='Header' + D1 + ctlType + D1 + theSearchConfigTool.iahelp__DisplayOrder__c + D1 + theSearchConfigTool.iahelp__ToggleNext__c;
			var x = this.template.querySelector('[data-id='+search+']');
			x.click();
            return ;
		}
		
		
		// From the configuration tool located above, get the support controls applicable to the search tool
		var theSearchSupportControls = getSupportControlsForConfigTool(theSearchConfigTool);
		
		// Get the identifier used for search text box: this should be the first (and only) support control.
		// Whatever the config control record states, we need to add our control's unique ID to the control ID...
		var theSearchSupportControlIdent = theSearchSupportControls[0][1];
		theSearchSupportControlIdent += this.uniqueident;
				
		// Temporarily change focus to force search text box value "commit"
		var x = this.template.querySelector('[data-uniqueid='+theSearchSupportControlIdent+']');
		this.template.querySelector('[data-id=FocusPuller]').focus();
		x.focus();

		
		// Now take note of the search / filter text
		valNew = x.value.toUpperCase();
        // Event is raised to send search text to IHLIST
        const event = new CustomEvent('cardinfo', {
            // detail contains only primitives
            detail: {key1:x.value}
            });
            this.dispatchEvent(event);
		
		
		// Filtering mechanism depends on type of control in use
		if (ctlType == 'Search') {
		
			// Standard list search
		//	var listStyle = this.ListingStyle;
			var listRows;
		
			// Loop through our listing item records
			for (i=0; i<LIs.length; i++) {
			
				// Get the content that the current listing item displays in a listing,
				// whether narrow or wide format: we look for text matching item label and title...
				strContent = LIs[i].Label.toUpperCase() + LIs[i].Title.toUpperCase();

				// Now get any listing row on this screen that is displaying the record whose content we just obtained:
				// Note that there may be more than one of these, as the same record may appear on other components on any given screen...
                listRows = ref.template.querySelectorAll('.'+LIs[i].Id);

				// Loop through these listing rows
				for (j=0; j<listRows.length; j++) {
				
					// Only act on our own rows (those marked in a special data attribute with our component ID)
			//		if (listRows[j].getAttribute("data-cmpId") == cmp.getGlobalId()) {
					
						// Filter out (hide) the row if:
						//		Its listing content does not match the search term
						//		AND the row is not selected (ticked) for retention across searches
						//if (strContent.indexOf(valNew) == -1 && ! listRows[j].hasClass('IsSelected')) {
                        if (strContent.indexOf(valNew) == -1) {
							listRows[j].classList.add('slds-hide');
						} else {
							listRows[j].classList.remove('slds-hide');
							cnt += 1;
						}
				//	}
				}
			}
			
			this.diags = valNew + ' - ' + Internationalise(this,'AdviceLabelMatchingItems') + ': ' + cnt;
			
		//	this.clearAdvancedDiags(cmp);
			this.logAdvancedDiags(theSearchSupportControlIdent + ':' + x + ':' + valNew + ':' + ctlType);			
			
		} else {
        /*	
        // Tree search
            var nods = [];
            var idx;	
            var styl;		

            nods[undefined] = { Label: "Root", items: [] };
			
			LIs.forEach(function(v) {
				if (v.Label.toUpperCase().indexOf(valNew) != -1 || v.Title.toUpperCase().indexOf(valNew) != -1) {
					styl = 'font-weight: bold; font-style: italic; margin-bottom: 1rem; border-left: dotted 0.3rem #' + cmp.get("v.GlobalSettings.iahelp__BrandColour6__c") + ';';
					cnt += 1;
				} else {
					styl = '';
				}
				
				nods[v.Id] = { Style: styl, Id: v.Id, ParentId: v.Parameters, Expanded: true, Label: v.Label, Title: v.Title, StyleClass: v.StyleClass, Icon: v.icon, IconLabel: v.IconLabel, RowState: v.RowState, items: [] };
            });
            
            
            // Now loop through nodes again, adding each to the items of its parent
            try {  
            	LIs.forEach(function(v) {
	            	idx = v.Parameters;
	            	if (idx + '' == 'null' || idx == '') {idx = undefined;}
	            	nods[idx].items.push(nods[v.Id]);
            	});
            } catch (e) {}            

        	
        	// It would appear that the above logic runs relatively quickly - but that the act
        	// of setting nodes (and thus, presumably, calling a LUX repaint of some kind)
        	// is SLOOOW! So: keep track of the nodes here, but only attempt actual 
        	// filter when search tool is clicked
        	
        	cmp.set("v.FilteredNodes", nods[undefined].items);
        	
        	// Note matching record info & count in cache
        	cmp.set("v.OpsCache", '(' + valNew + ') ' + cnt);*/
		}
				
    }

	// Return the binary string representation of an integer
    DecToBin(val) {
    
       // console.log(' DecToBin ');
        var retVal = '';
        var wrk = 0;
        var i;
        var Num;
        
        
        try {
        	Num = parseInt(val);
        	
	        if (Num != 0) {
	            while (Num > Math.pow(2, wrk)) {
	                wrk++;
	            }
	        } else {
	            wrk = 0;
	        }
	
	
	        for (i = wrk; i >= 0; i--) {
	            if (Math.pow(2, i) <= Num) {
	                retVal += '1';
	                Num -= Math.pow(2, i);
	            } else {
	                if (i != wrk) {retVal += '0';}
	            }           
	        }

        } catch (e) {
        	retVal = 'ERR';
        }

        return retVal;
    
    
    }

        toggleellipsistools(){
            var frm=this.template.querySelector('[data-id="toolsEllipsis"]');
                frm.classList.toggle('slds-hide');
                frm.classList.toggle('slds-dropdown');
        }
        eventBeingListenedTo(message){

            var doResponse = false;
            
            try {
                var theSource = message.SourceComponent;
                var listensTo = this.cardlistensto;
                var latch = this.ResponseLatch;
                var i;

                if(theSource == 'Crumbs'){
                    listensTo = 'Crumbs';
                }
        
             //   console.log(' eventBeingListenedTo  theSource '+theSource+'  listensTo '+listensTo );
                // Only respond to events that do not emanate from ourselves / do
                // emanate from the  "desired" master component(s) we wish to tie to: 
                // In addition, respond in any case where an override "response latch" has been set...
                
                if (latch == true) {
                    // Re-set any latch
                    this.ResponseLatch=false;
                    doResponse = true;
                    
                } else if (listensTo != '' && listensTo + '' != 'null') {
                    // Listens To member data can be specified as a comma separated list
                    listensTo = listensTo.split(' ').join('');
                    listensTo = listensTo.split(',');
                    for (i=0; i<listensTo.length; i++) {
                        if (theSource == listensTo[i]) {
                            doResponse = true;
                            break;
                        }
                    }
                }
    
            } catch (e) {
                // Fail safe
                doResponse = false;
            }
            return doResponse;
        }

        // Platform Event filter
        platformEventBeingListenedTo(response){
            try {   
                return  response.data.payload.CreatedById==this.currentUserId;
            } catch(e){
                return false;
            }
        }
        eventIsOurOwn(response) {
		
            try {
                var src = response.SourceComponent;
                var ourId = this.cardcomponentid;
                return src == ourId && (src+''!='undefined' && ourId+''!='undefined');
                
            } catch (e) {
                // Fail safe
                return false;
            }
        }
        logAdvancedDiags(Msg) {
            console.log(Msg);
        }
       
        handleSubscribe() {
            var msg;
            var msg2;
            var msg3;
            if (this.subscription) {
                return;
            }
            this.subscription = subscribe(this.messageContext, messageChannel, (message) => {  
             this.handleMessage(message);
            },{scope:APPLICATION_SCOPE});
        }
        handleMessage(message) {
            this.handlePassThroughs(message);           
        }
            // Handle pass throughs from sub-components etc.
        handlePassThroughs(message) {
            console.log('handlePassThroughs');
            if(message.RecordId==''||message.RecordId+''=='undefined'){
                var act = message.ActionCode;
                var localListItems;
                if(this.cardlistitems!='undefined' && this.cardlistitems!=null){
                     localListItems=JSON.parse(JSON.stringify(this.cardlistitems));
                }
                var parms = message.Parameters;
                var D1 = '^';
                var src = message.SourceComponent;
        
            //   var ourModal = cmp.find("theModal;
                
                // Close a modal dialogue in response to its request to do so
                if (act === 'DialogueRequestClose') {
                    this.closeDialogue(parms);
                }
               /* if (act === 'cardDoDialogue') {
                    parms=parms.split('#');
                    console.log(act+'  '+parms);
                    this.doDialogue(parms[0],parms[1],parms[2],parms[3],parms[4],parms[5],parms[6],parms[7],parms[8]);
                }*/
                
                if (this.eventIsOurOwn(message)) {
                
                    switch (act) {
                
                    case 'ComponentToolsProcessed':
                        // If action is component tools processed and emanates from ourselves, 
                        // we may need to add to our component navigation history: do so here...
                        var thisvar=this;
                        var hist = [];
                        hist=this.history;		// Existing history
                        var rec = this.helprecordid;	// Last known record: may not in fact be where we now are!
                        var CTs;								// For obtaining tool to toggle display of history, whose details may need amending 
                        var HistToolType;						// The type (body, header, ellipsis) of the history toggling tool
                        var CTsOut = [];						// Amended copy of the appropriate tools
                        var i;									// For looping
                        var lbl;								// Label to add to history collection (along with record ID)
                        var doAdd = true;						// Control variable identifying that an entry should be added to our navigation history

                        // If record ID was not set, we cannot add this directly to history
                        if (rec == '' || rec == '[None]' || rec+''=='undefined') {
                            // Check whether a record was, in fact, retrieved server side (e.g. author configuration or default page), and use if so
                            try {
                                if (this.cardlistitems + '' != 'undefined') {
                                    rec = this.cardlistitems[0].Id;
                                    
                                } else {
                                    doAdd = false;
                                }
                            } catch (e) {
                                doAdd = false;
                            }
                        }
                    
                        // Only add a given record to history once
                        if (doAdd == true) {
                            if(hist!=null && hist+''!='undefined'){
                            hist.forEach(function(H){
                                if (H.value == rec) {
                                    doAdd = false;
                                }
                            });
                            }
                        }
                        

                        // Add to the history, if we ascertained the need
                        if (doAdd == true) {
                            // Source of label and id for history listing varies by card implementation type
                            switch (this.ihcardtype) {
                                case 'List':
                                    // Label should come from the clicked listing item
                                    lbl = 'Listing: ' + rec;
                                    break;
                                
                                case 'Detail':
                                    // Label is the name of the selected topic, assuming topic mode
                                    var tmp=JSON.parse(JSON.stringify(this.idnamelist));
                                    if (this.cardishelptopic == true) {
                                        try {
                                            lbl = 'Help Topic: ' + rec;
                                        } catch (e) {
                                            lbl = 'Help Topic: ' + rec;
                                        }
                                    } else {
                                        lbl = 'Record: ' + rec;
                                    }
                                    break;
                                    
                                default:
                                    lbl = 'OTHER: ' + rec;
                                    break;
                            }
                            
                            
                            rec = {"label": lbl , "value": rec};
                            
                            hist.push(rec);
                            
                            // Record the fact that there is some NAVIGABLE history:
                            // Only set this member if there is >1 item of history - as the first entry
                            // will always be the record we start with (so there's no navigation to offer).
                            this.HasHistory=hist.length > 1;

                            // In the unique case of history, re-set certain config tools here (as they've already been processed
                            // due to the event we're responding to!) If history exists, we need to show a tool to open it:
                            // This re-set is only required where history length is 2 - as that is the first time we need to show the tool
                            if (hist.length == 2) {
                                
                                // Iterate tools to find toggle history item:
                                // Note this can only be one of certain types...
                                CTs = JSON.parse(JSON.stringify(this.headertools));
                                CTs = CTs.concat(JSON.parse(JSON.stringify(this.ellipsistools)));
                                CTs = CTs.concat(JSON.parse(JSON.stringify(this.bodytools)));
                                
                                for (i=0; i<CTs.length; i++) {
                                    if (CTs[i].iahelp__ActionCode__c == 'ToggleHistory') {
                                    
                                        // If located, mark it as being suitable to show
                                        CTs[i].iahelp__ToggleActiveMarker__c = 'ComponentConditionsMatch';
                                        
                                        // Note the type of this tool
                                        HistToolType = CTs[i].iahelp__Type__c;
                                        break;
                                    }
                                }
                                
                                // Build collection of tools containing only those of the type of the history toggle
                                // with the amended history tool
                                for (i=0; i<CTs.length; i++) {
                                    if (CTs[i].iahelp__Type__c == HistToolType) {
                                        CTsOut.push(CTs[i]);
                                    }
                                }
                                
                                switch (HistToolType) {
                                    case 'Ellipsis':
                                        this.modifiedellipsistools=CTsOut; 
                                        break;
                                    
                                    case 'Header':
                                        this.modifiedheadertools=CTsOut; 
                                        break;
                                    
                                    case 'Body':
                                      //  this.modifiedbodytools=CTsOut;
                                        var bodytoolsWrapper=[];
                                        for(var h=0; h<CTsOut.length; h++){

                                            //Added condition based Header Tool Class values.
                                            var T=CTsOut[h];
                                            //Added additional metadata id to header tools
                                            var temp={"bt":T,"class1":T.iahelp__ToggleNext__c == 0 
                                                                                || (this.currentrecordmetadata+''!='undefined' && this.currentrecordmetadata.RowState == T.iahelp__ToggleActiveMarker__c && T.iahelp__ToggleActiveMarker__c != ''
                                                                                && T.iahelp__ToggleActiveMarker__c != null)
                                                                                || (T.iahelp__TogglePrev__c == 0 && T.iahelp__ToggleActiveMarker__c == 'Any')
                                                                                || T.iahelp__ToggleActiveMarker__c == 'ComponentConditionsMatch'
                                                                                
                                                                                ? T.iahelp__ToolClass__c : 'slds-hide ' + T.iahelp__ToolClass__c,
                                                    "class2":'microTool ' + T.iahelp__ToolClass__c + ' fa ' + T.iahelp__IconClass__c,
                                                    "id1":this.toolcontext + this.delimiter + T.iahelp__Type__c + this.delimiter + T.iahelp__DisplayOrder__c + this.delimiter + this.cardcomponentid,
                                                    "id2":T.iahelp__Type__c + this.delimiter + T.iahelp__ActionCode__c + this.delimiter + T.iahelp__DisplayOrder__c + this.delimiter + T.iahelp__ToggleNext__c};
                                            bodytoolsWrapper.push(temp);
                                            }
                                         this.modifiedbodytools=JSON.parse(JSON.stringify(this.modifiedbodytools));
                                         this.modifiedbodytools=[];
                                         this.modifiedbodytools=Object.assign(bodytoolsWrapper); 
                                        break;
                                }
                                
                            }	
                                
                        }
                        
                        this.history=hist;		
                        break;
                        
                    case 'ReadingListDialogue':
                        // See also 'ReadingList' action
                     var rec = this.helprecordid;
                     var CRoot = this.communityroot;

                     var src = CRoot + '/apex/iahelp__IHLUXOutHost?NSApp=iahelp&App=appIH&NSComp=iahelp&Comp=IHRLViewer&Parms=Height~520^HelpRecordId~' + rec;
                     doDialogue(this,'ReadingListViewer', 'VF', src, null, 620, true, false, false, true);
                
                        break;

                    case 'HTShareLink' :               
                        // Show a link that can be used to direct a user to a particular record
                        
                         let root = window.location.origin;
                         let hid;
                         let params;
                        
                        // If call came from ellipsis menu, parameters are in the form:
                        // type [D1] action code [D1] display order [D1] toggle next
                        
                        // If call came from a listing item, parameters are in the form:
                        // record id [D2] parameters
                        
                        // [D1] (see menuItemClick - passed from markup) is v.Delimiter
                        // [D2] (see listingItemClick - hard wired) is '^'
                        if(typeof parms =='string'){
                            if(parms.includes('^')){
                                // Listing click: obtain ID from parameters
                                params = parms.split('^');
                                hid = params[0];
                            }                          
                        } 
                        else {
                            
                            // Ellipsis item click:
                            // Record ID will not be present - but is that of the card itself
                            hid = this.helprecordid;
                        }
                        
                        // Advise user:
                       prompt(this.Internationalise('MessageShareViaURL'), root + '/' + hid);		
                       break;
                    
                    case 'TreeShareLink': 
	
                       console.log('TreeShareLink ');
                       
                       let treeroot = document.location.origin;
                       treeroot += '/apex/iahelp__IHLUXOutHost';
                       treeroot += '?NSApp=iahelp&App=appIH';
                       treeroot += '&NSComp=iahelp&Comp=IHUtility1';
                       treeroot += '&Parms=ColumnRatio~33^RootNode~' +this.cardrootnode;
                       
                       prompt(this.Internationalise('MessageShareViaURL'), treeroot);			
                       break;

                    case 'cardDoDialogue':
                        parms=parms.split('#');
                        doDialogue(this,parms[0],parms[1],parms[2],parms[3],parms[4],parms[5],parms[6],parms[7],parms[8]);
                        
                }
                
            }         
         }
        }

            // Respond to clicks on our history listing: raise navigation event and hide history
        historyClick(evt) {
        
            var t = evt.currentTarget;
            var rec=t.getAttribute("data-id");
            // Before firing topic selection event, we need to set a 'latch' on
            // the component whose history is being used to ensure the component listens:
            // This ensures we always navigate, regardless of whether implementation is listening
            // to 'self' for topic selection events, which would be unusual
            this.ResponseLatch=true;
            
            var selectTopic={RecordId:rec,SourceComponent:this.cardcomponentid};
                publish(this.messageContext, messageChannel, selectTopic);
            
            // Hide history once clicked
            var h=this.template.querySelector('[data-id="HistoryContainer"]');
                if(h!=null && h+''!='undefined'){
                    h.classList.toggle('slds-hide');
                }
        }
	
        // Waiting cues for card as a whole   
        showSpinner() {
          //   this.diags=this.AdviceLabelWorking;
             
            // Mark-up logic reflects this setting by showing / hiding spinner
           //  this.isbusy=true;
          // var frm=this.template.querySelector('[data-id="IHCardHeader"]');
           this.test= true;
           //  frm.classList.remove('slds-hide');
           
         }
        hideSpinner() {
            // this.isbusy=false;
             this.test=false;
           //  var frm=this.template.querySelector('[data-id="spinner"]');
              //   frm.classList.add('slds-hide');
         }
         // Cue creation of a topic with specified content, navigating directly to it on creation if desired (reNav = true)
            createNewTopic(content,reNav) {
    
            // In these cases, we're changing the list (server call)
            // so show our "waiting" cues...    
            // Call action to get required listing
            dropNewTopic({
                    TopicContent : content
                        }).then(result => {                    
                if (result+''!=null || result+''!='undefined') { 
                // Fire topic select event with return value
                    var selectTopic={RecordId:result,SourceComponent:this.cardcomponentid};
                    if(this.ihcardtype!='tree'){
                        publish(this.messageContext, messageChannel, selectTopic); //Disabled to solve multiple event firing
                    }
                    console.log('new node '+result);
                    // Note return in Diags
                    this.diags=this.Internationalise('AdviceLabelNewHelpTopicCreated') + ': ' + result;
                    
                    // Set current record to newly created topic
                    this.helprecordid=result;

                    /*
                    FOLLOWING LINES WORK IN NAVIGATING TO NEWLY CREATED TOPIC - BUT AS THIS CALL IS ALSO
                    MADE BY TREE CHILD/PEER CREATION WE MUST NOT CALL THEM IN THESE CIRCUMSTANCES, 
                    BECAUSE HAVING CREATED THE TOPIC WE WANT THE NEXT ACTION TO BE CREATE PARENT RELATIONSHIP (NOT NAV!)
                    */
				
                    if (reNav == true) {
                        var parms = result;  
                        parms += this.delimiter;
                        
                        // Treat the new topic like a listing "selection" / selected item, so that
                        // a call to getTools will include it. By adding in this way, we can repeat this
                        // call (e.g., by dropping more new topic content) and see all topics created in a session... 
                        var LIs = [];                
                        LIs = this.listingselections;
                        LIs.push(result);
                        this.listingselections= LIs;					
                        parms += this.listingselections;
                                        
                    }                
                    
                } else {
                    this.Diags="ERR!";
                }
            
            
        }); 

      
    
    }

        closeDialogue (dlgId) {
            // "Clean up" the dialogue: destroy any LUX component it contains
         /*   try {
                var dlgComp = cmp.find("theModal");
                if (dlgComp + '' != 'undefined') {
                    var dlgLUXComp = dlgComp.get("v.theLUXComp");
                    if (dlgLUXComp + '' != 'undefined') {
                    
                        dlgLUXComp.set("v.body", []);
                        $A.util.addClass(dlgLUXComp, 'slds-hide');
                    }
                }
            } catch (e) {}*/

            // Hide the dialogue container
            var cnt = this.template.querySelector('[data-id='+dlgId+']');
            cnt.classList.add('slds-hide');
        }
		
        // Respond to in-line listing tool clicks
        listingToolClick(evt){

            console.log('FROM listingToolClickk---');
            var lst = evt.target;
            var theId = lst.id;
            var theId1=evt.currentTarget;
            var actioncode1=theId1.getAttribute("data-actioncode");
            console.log('actioncode----',actioncode1);
            console.log('theId--',theId);
           
             var endIndex = theId.lastIndexOf("-");
                if (endIndex != -1)  
                {
                    theId = theId.substring(0, endIndex);
                }
            console.log('theId--',theId); 
            var D1 = this.delimiter;
		    var CRoot = this.communityroot;	
            var cnt = this.template.querySelector('[data-id="CalloutContainer"]'); 
            var frm = this.template.querySelector('[data-id="tfrm"]');
		    console.log('cnt-ltc'+cnt.classList);
            console.log('frm-'+frm.classList);

            // If root is 'null', this can be ignored in most cases
		    if (CRoot + '' == 'null') {CRoot = '';}
		    if (CRoot != '') {CRoot = '/' + CRoot;}
		
            var showInPlace = true;
            var contextualize = false;

        
            // [Listing record Id] [Delimiter] [Action code] [Delimiter] [Parameters]
            theId = theId.split(D1);
           
            // Mark selected row - the one against which this click occurred
            this.setSelectedRow(theId[0]);

            //switch(theId[1]){  
            switch(actioncode1){ 

                case 'HTShareLink' :

                    var link = window.location.origin+'/';
                    var msg = 'Please forword the URL shown to share this item';
                    var url = link+theId[0];
                    prompt(msg,url);
 
                    break;

                case 'AddBookmark':
		        case 'RemoveBookmark':
		         
                    var act;
                    if (actioncode1 == 'AddBookmark') {
                        addBookmark({
                            "ToolContext": this.toolcontext, 
                            "ActionCode": this.actioncode,
                            "IHContext": this.recordId,
                            "Params" : theId[0],
                        }).then(result => {
                            act = result;
                            //this.processTools(this,result);
                            this.processTools(result);
                        })
                    } else {
                        removeBookmark({
                            "ToolContext": this.toolcontext, 
                            "ActionCode": this.actioncode,
                            "IHContext": this.recordId,
                            "Params" : theId[0],
                        }).then(result => {
                            act = result;
                           // this.processTools(this,result);
                           this.processTools(result);
                          
                        })
                    }
                    console.log('act from ltc--');
                    console.log(act);
                     break;

                case 'ArchiveSticky' :
                        // Request archival of the current sticky note (i.e., all versions of 
                        // stickies for the record to which listing tool is attached)...
                        archiveSticky({ 
                            "IHContext": theId[2]
                        }) 
                        .then(result=>{
                            // We should expect an empty response if successful
                            if(result.getState() != 'SUCCESS'){
                                this.Diags = 'ERR!';
                            }else if(result.getReturnValue() != ''){
                                this.Diags = 'Error (Archive Sticky):' + result.getReturnValue();
                            }else{
                                // Re-load list
                                //cmp.set("v.isInitialised", false);
                            }
                        })
        
                        showInPlace = false;
                        contextualize = false;
                        break;
					 
		        case 'Comment' :
                    // For listings, by definition assume we're commenting on a record (topic)
            	    var src = CRoot + "/apex/iahelp__IHComment?IHLUX=true&HTID=" + theId[0];
                    doDialogue(this,'LogComment', 'VF', src, null, 150, false, false, false, true);
                    showInPlace = false;
                    contextualize = false;
                    break;

                case 'ConfigurationMode' :
                case 'ConfigurationIssue' :
                    var params = theId[2].split('^');
                    var src;
                    var D1 = '^';                
                     
                    // v`.44+ : replacing VF dialogue with Utility 1 based approach
                    if (theId[1] == 'ConfigurationMode') {
                        // In these cases, the listing item parameters provide element as part of standard help info, i.e:
                        // [Callout height] ^ [Callout template URL] ^ [Element identifier] ^ [HPL]
                    
					    //src = CRoot + '/apex/iahelp__IHHelpedElement?IHLUX=true&ElemId=' + encodeURI(params[2]) + '&HPL=' + params[3] + '&Mode=Read';
                        src = params[3] + D1 + params[2]; 
                    } else {
                        // In these cases, the listing item parameters provide failed element info in the form:
                        // [Element identifier] ^ [HPL]
                    
					    //src = CRoot + '/apex/iahelp__IHHelpedElement?IHLUX=true&ElemId=' + encodeURI(params[0]) + '&HPL=' + params[1] + '&Mode=Edit';
                        src = params[1] + D1 + params[0];
                    }                
        
                    var dlgMap = {
                            "PDPositioningGroup": this.cardcomponentid + '_ReconDlg',
                            "Height": 595,
                            "ColumnRatio": "33%",
                            "SuppressHeaders": true, 
                            "SuppressFooters": true,
                            "ToolContext": "ReconfigureMode",
                            "RootNode": src,
                            "TreeSuppressListingTools": false,  
                            "TreeNodeIconStyle": "Small",
                            "TreeNodeProvider": "ServiceIHTrees.TNSHelpedPageLayouts" 
                        };				
                        doDialogue(this,'HelpedElementMaintenance', 'LUX', 'iahelp:IHUtility1', dlgMap, 600, false, true, false, true);
        
                        showInPlace = false;
                        contextualize = false;
                    break;
					
		        case 'EditTopic' :
                case 'ViewHere' :
                    // View full topic or edit it (i.e., show topic in the detail card in appropriate mode)
            	    var theMode;
            	    if (theId[1] == 'EditTopic') {theMode = 'Edit'} else {theMode = 'View'}

                    var src = 'iahelp:IHDetail';
                    var aMap = {
                        "HelpRecordId" : theId[0],
                        "DataMode" : theMode,
                        "Height" : "610"
                    };
            	    doDialogue (this,'EditTopic', 'LUX', src, aMap, 600, false, true, false, true);

                    showInPlace = false;
                    contextualize = false;
                    break;

                case 'HelpBookmark' :
                    // NB: With bookmarks, Listing Record Id (theId[0]) is Help Topic ID.
                    // Parameters (theId[2]) is the bookmark URL.
                    window.open(theId[2]);
                    showInPlace = false;
                    contextualize = true;
                    break;

                case 'TagClick' :
                case 'HelpCallout' :
        
                    // NOTE: clicking a tag (in a list, in "tagged items" mode) is essentially the same as showing a callout
            	    // in cases where a callout is desired (i.e., list's callout option calls for this)
                    var calloutOpt;
            	    var params;
            	    var Pg;

            	    // Differentiate communities use of LUX override for now
            	    var LXC = (CRoot == '') + '';

                    //the listing item parameters should provide callout info in the form:
                    // [Callout height] ^ [Callout template URL] ^ [Element identifier] ^ [HPL] ^ [Element Id]
                    try {
	                    params = theId[2].split('^');
                    
                        // Deal with "local" custom templates: with these, we need to remove the "c."
	                    // namespace (required in classic): see also jsToggleHelp.getTemplateAddress
	                     Pg = params[1];
	
	                    if(Pg.indexOf('.') != -1){
	                        Pg = Pg.split('.');
	                        Pg = Pg[1];
	                     } 
	
                        // If we get here, all is well so we can respond to desired callout option
	                    calloutOpt = this.CalloutOption;
	                
                    } catch (e) {
                       if(this.toolcontext == 'QAM' || this.CalloutOption == 'Topic Selected Event plus Topic view'){
                           if ((theId[1] != 'TagClick' && this.helprecordid != theId[0])) {
                                frm.src = CRoot + "/apex/iahelp__IHRedirector?LUXCaller=" + LXC + "&HTID=" + theId[0] + "&ShowCallout=true";
                           }
                            contextualize = true;	
						    break;
                        }else{
                            calloutOpt = 'Topic Selected Event Only';
                        }
                    }

                    switch (calloutOpt) {
                        case "Topic Selected Event plus Topic view" :
                            showInPlace = true;

                            // Only set frame source if path has actually changed:
						    // Note that certain cases (tagged items) will have dealt with callout above
                            if (this.helprecordid != theId[0]) {
                            
                                // Use Element identifier + HPL to cue topic (as opposed to HTID, which would also work)
	                            // as this is required to log a callout interaction.
	                            // Do NOT force LUX look & feel here: it's not essential (as it is with certain otherwise ugly dialogues)
	                            // and should more logically respond to branding settings
	                        
	                    	    // Differentiate appearance for callouts from QAM listings, which should fold out to the left / nubbin right
                                if (this.cardcomponentid == 'theQAM') {
                                    frm.src = CRoot + "/apex/" + Pg + "?LUXCaller=" + LXC + "&elemType=R&ElemId=" + encodeURI(params[2]) + '&HPL=' + params[3] + '&ActiveId=' + params[4];	                        
                                } else {
                                    frm.src = CRoot + "/apex/" + Pg + "?LUXCaller=" + LXC + "&elemType=T0&ElemId=" + encodeURI(params[2]) + '&HPL=' + params[3] + '&ActiveId=' + params[4];	                        
                              
                               this.srif = frm.src;
                               console.log('srif-'+this.srif);
                                }
                            }
                            
                            break;

                        case "Topic Selected Event plus Topic popout" :
                             // Open selected topic's callout in a popup window
                             showInPlace = false;
                             var U = CRoot + "/apex/" + Pg + "?LUXCaller=" + LXC + "&ElemId=" + encodeURI(params[2]) + '&HPL=' + params[3] + '&ActiveId=' + params[4];
                             window.open(U,'HelpCallout', 'width=500, height=' + params[0] + ', left=250, top=300, menubar=0, resizable=1, status=0, toolbar=0, titlebar=0, location=0');
                                
                            break;

                        case "Topic Selected Event Only" :
                	        showInPlace = false;
                		    break;
                    }
                    contextualize = true;
                    break;

                case 'HelpedElementAdd' :
                case 'HelpedElementDelete' :
                    break;

                case 'QuickLink' :
                    window.open(theId[0]);
                    showInPlace = false;
                    contextualize = false;
                    break;
            
                case 'ReadingList' :
                    // Respond according to callout options set for component BUT
				    // also respect the override in these cases
                    if (this.CalloutOption === "Topic Selected Event plus Topic view" && this.CalloutOptionSelectiveOverride === false) {
                
				    var src = 'iahelp:IHRLViewer';
				    var aMap = {
				        "HelpRecordId" : theId[0],
				        "ActionCode" : 'ReadingListEntries',
				        "ToolContext" : 'RLViewer',
				        "Height" : '640'
				    };
					doDialogue(this,'ReadingListViewer', 'LUX', src, aMap, 620, false, false, false, true);
			
				    }
				    // Regardless of callout, DO contextualise (i.e., issue a record select event)
				    showInPlace = false;
				    contextualize = true;
                    break;

                case 'ReadingListDialogue' :
                    // OBSOLESCENT - USE ReadingList action where possible  
            	    // As 'ReadingList' action - but forced into VF / iframed dialogue for use in LUXOut which does NOT seem able to 
            	    // create modals with instantiated components
            		var src = CRoot + '/apex/iahelp__IHLUXOutHost?NSApp=iahelp&App=appIH&NSComp=iahelp&Comp=IHRLViewer&Parms=Height~620^HelpRecordId~' + theId[0];
			        doDialogue(this,'ReadingListViewer', 'VF', src, null, 620, false, false, false, true);
            	
			        showInPlace = false;
			        contextualize = false;
		            break;

                case 'ReadingListProperties' :
                    // Show RL properties dialogue
                    var ttl = theId[2];
			        var src = 'iahelp:IHUtility1';
			        var aMap = {
			        "SuppressHeaders" : false,
			        "SuppressFooters" : true,
			        "ColumnRatio" : "40%",
			        "TreeSuppressListingTools" : false,
			        "TreeDisplayDensity" : "Compact",
			        "TreeNodeIconStyle" : "Small",
			        "TreeMaxListingTools" : 0,
			        "TreeNodeProvider" : "ServiceIHTrees.TNSReadingLists",
			        "TreeDDAllowed" : true,
			        "RootNode" : theId[0],
			        "ToolContext" : 'ReadingListBuilder',
			        "Height" : '560',
			        "PDPositioningGroup" : "RLPropsU1"
			        };

			        doDialogue(this,ttl, 'LUX', src, aMap, 550, true, true, false, false);
				
                    showInPlace = false;
                    contextualize = false;
                    break;

                case 'RelatedHelp' :
                    // Page author can choose whether or not to pop topic to new tab:
                    if (this.CalloutOption === "Topic Selected Event plus Topic view"){
                        var PortalPage = this.portalpage;
                	
                        // Differentiate for communities for now
                	    if (CRoot != '') {
                		   window.open(CRoot + "/apex/iahelp__" + PortalPage + "?HTID=" + theId[0]);
                	    } else {
                		    window.open(CRoot + "/" + theId[0]);
                	    }
                    }
                
                    showInPlace = false;
                    contextualize = true;
                    break;        
                    
                case 'RelatedHelpUnlink' :
                    if (confirm(this.Internationalise('MessageDeleteWarning'))) {
            	
                        //helper.showSpinner(cmp);
                        
                        // Our listing does NOT contain the relationship ID - as we're generally interested in the
                        // ID of the referenced Topic (as we use this to raise selection events etc.). HOWEVER: this
                        // means we need to be sure, in deleting a relationship, that we get the right one! This means
                        // getting referring / related IDs round the right way in this case (as there could be 2x "relative"
                        // relationships, 1 in each "direction"). 
                        // Parameters in listing items are the marker we have defining this:
                        
                        var rel;
                        var ref;
                        var RType = theId[2];
    
                        if (RType == 'REF') {
                            // Listing parameter is the referring topic
                            rel = this.ihcontext;
                            ref = theId[0];
                            
                        } else {
                            rel = theId[0];
                            ref = this.ihcontext;
                        }

                        deleteRelationship({
                            "Referring" : ref,
                            "Related" : rel,
                            "RelationType" : "Relative"
                         }).then(result=>{

                                // Remove waiting cues
                                //helper.hideSpinner(cmp);
                                if (result.getState() === "SUCCESS") { 
                                    // (Momentarily) note return in Diags then 
                                    // re-build list here to reflect removed relative           
                                    this.Diags = this.Internationalise(result.getReturnValue());
                                    this.reInitialise(evt);	                          
                                } else {
                                    this.Diags = 'ERR!';
                                }
                        })
   		
                    }
                    
                    showInPlace = false;
                    contextualize = false;
                    break;

                case 'RelatedResourceNotes' : 
                    // Open SF standard record editing page for current help topic resource:
                    window.open(CRoot + "/" + theId[0] + '/e');
                    showInPlace = false;
                    contextualize = false;			        
				    break;
				
                case 'RelatedResourceUnlink' :
                    if (confirm(this.Internationalise('MessageDeleteWarning'))) {
                        deleteHelpTopicResource({"HTRID" : theId[0]
                         }).then(result=>{
                            if (result.getState() === "SUCCESS") { 
                                // (Momentarily) note return in Diags then 
							    // re-build list here to reflect removed relative           
                                this.Diags = this.Internationalise(result.getReturnValue());
                                this.reInitialise(evt);	                          
                            } else {
                                this.Diags = 'ERR!';
                            }
                     })
                    }
                    showInPlace = false;
                    contextualize = false;
                    break;

                case 'Resource' :
                    window.open(deTokenize(this,theId[2]));
                    showInPlace = false;
                    contextualize = false;
				    var desc = 'Resource "' + theId[0] + '" was viewed from component "' + this.cardcomponentid + '" with destination ' + deTokenize(this,theId[2]);
                    // Log a resource interaction
                    logLUXInteraction({
                        "iTyp" : "6",
                        "Description" : desc,
                        "IHContext" : this.recordId + '^' + theId[0], 
                    })
                    break;

                case 'Statistics' :
                    var src = CRoot + "/apex/iahelp__IHStats?IHLUX=true&HTID=" + theId[0];
                    doDialogue(this,'Statistics', 'VF', src, null, 145, false, true, false, true);
                
                    showInPlace = false;
                    contextualize = false;
                    break;

                case 'ToggleListingTools' :
                    // Toggle in-line list tool visibility: listing record ID can be used to identify tools block
                     this.toggleListingTools(theId[0]);
                    
                    showInPlace = false;
                    contextualize = false;
                    break;

                case 'ToggleSelected' :
                    console.log('From ToggleSelected');
                    // Mark the list row whose tool cued this action as among the collection of those "selected"
                    var LI;
                    var WI = this.template.querySelector('[data-idss="LIWide_"]' );
                 
                    if(WI != null){
                        console.log('inside WI if');
                         LI = this.template.querySelector('[data-ids=LIWide_'+theId[0]+']' );
                        LI.classList.toggle('IsSelected');
                        console.log('LI--toggle2-',LI);
                    }else{
                        LI = this.template.querySelector('[data-ids=LINarrow_'+theId[0]+']' );
                        LI.classList.toggle('IsSelected');
                    }
            
                    // If there are any selected rows, show this on any tools that respond to selections
                    this.markSelectionControlledTools();
                      
                    showInPlace = false;
                    contextualize = false;
                     break;
                    
                case 'ViewGuideInPortal':
                    // Given the RLID of a Guide in a list, open it in properties viewer
                    window.open(CRoot + "/apex/iahelp__IHReadingListProperties?Id=" + theId[0]);
                    showInPlace = false;
                    contextualize = true;
                    break;

                case 'ViewInPortal':
                    // If we're NOT in the QAM, show the topic on the layout we're on
                   /* if(this.toolcontext != 'QAM'){
        
                        // To do this, we will simply issue the contextualise message, below,
                        // and will NOT open a new window here. However, we must also re-set
                        // the action code of the (listing we assume) that issued the view in portal
                        // (search listing item click)
                            
                        this.actioncode = 'AllRelatedHelp';
                        this.title=this.Internationalise('Title' + this.actioncode);
                            
                    } else {
                                  */  
                        // If in the QAM, given the HTID of a Topic in a list, open it in portal
                        if (CRoot != '') {
        
                            // If we're in a community, safest thing to do is to continue with VF option
                            var PortalPage = this.portalpage;         	
                            window.open(CRoot + "/apex/iahelp__" + PortalPage + "?HTID=" + theId[0]);
                                
                        } else {
                            // Where available, use LUX (component) override
                            window.open(CRoot + '/' + theId[0]);				
                        }
                  //  }      
                  
                    showInPlace = false;
                    contextualize = true;
                    break;

                default :
                    console.log ('Option not implemented in SUPER listingToolClick - raising passthrough on behalf of "' + this.cardcomponentid + '": Listing Id=' + theId[0] + ': Action=' + theId[1] + ': Parameters=' + theId[0] + '^' + theId[2]);
                    // Anything we don't handle at super level we should pass through for sub-component handling
                    var evtPassThrough = {SourceComponent:this.cardcomponentid,ActionCode:theId[1],Parameters:theId[0] + '^' + theId[2]};
                    publish(this.messageContext, messageChannel, evtPassThrough);
                    showInPlace = false;
                    contextualize = false;
                    break;
            }
            
            // Having set any required parameters above, show an in-place callout / dialogue if required
            if (showInPlace === true) {
                var y = evt.clientY;
                
                // Differentiate appearance for callouts from QAM listings, which should fold out to the left / nubbin right
                if (this.cardcomponentid == 'theQAM') {

                } else {
                    console.log('else');
                    cnt.style.top=y+15+'px';
                
                }

                // If selected record/context HAS changed, always show the callout:
			// Usually, this is a test of help record ID, but in tag mode we need to look elsewhere...
			if ((theId[1] != 'TagClick' && this.helprecordid != theId[0])) {

                // To do this, hide momentarily to allow spinner
                cnt.classList.add('slds-hide');
                this.toggleTipBusy();
                cnt.classList.remove('slds-hide');

            } else {
                // If selected record/context has NOT changed, toggle visibility:
                // Only toggle closed if helped element 2nd click is supposed to close callouts
                var opt = this.globalsettings.iahelp__CalloutClosureBehaviour__c;
        		if (opt != '2' || cnt.classList.contains('slds-hide')) {
                cnt.classList.toggle('slds-hide');
        		}
            }

                // Having done all of this, mark "selected" row as required
                var LItems = this.template.querySelectorAll('li.HelpListingItem, tr.HelpListingItem');
			    for (var i=0; i < LItems.length; i++) {
                    LItems[i].classList.remove('SelectedRecord');
			    }
			
                // In this context, we only mark row where callout is visible
                if (! cnt.classList.contains('slds-hide')) {
            	    this.setSelectedRow(theId[0]);
                }
            }

            // Also, fire a "record selected" event if required
            if (contextualize === true) {
 
               // if (showInPlace === true && cnt.classList.contains('slds-hide')){
                 //   return;
               // }

            console.log('LWC IHCard.listingToolClick - raising contextualizing select topic event on behalf of "' + '' + '": topic is: ' + theId[0]);
            var selectTopics = {RecordId:theId[0],SourceComponent:this.cardcomponentid};
            publish(this.messageContext, messageChannel, selectTopics);
            console.log('after publish');
            }
        }

        // Note any rows that have the selection marker and record their IDs in member data
        markSelectionControlledTools(){
        
        var LIs = this.cardlistitems;	                                        // All listing items on this control						       
    	var LI = this.template.querySelectorAll('.IsSelected');	                // All listing items visually marked as selected		
    	var SCTools = this.template.querySelectorAll('.SelectionControlled');   // All configuration tools marked as being responsive to selections 
        var rowIds = '';													    // CSV of Record IDs of selected listings
        var hasSelections = false; 
        var selectionCount = 0;
    
        // Record the selected rows
        for (var i=0; i< LIs.length; i++) {
            console.log('----for cardlistitems  ',LIs[i].Id);
            if ($('#LINarrow_' + LIs[i].Id).contains('IsSelected') || $('#LIWide_' + LIs[i].Id).contains('IsSelected')) {
        		rowIds +=  LIs[i].Id + ',';
                
        		selectionCount += 1;
                console.log('selectionCount--',selectionCount);			        		
        	}

        }

        if (rowIds.length > 0) {
        	hasSelections = true;
	        rowIds = rowIds.substring(0, rowIds.length - 1);
        }
			        
        rowIds = rowIds.split(',');
        this.ListingSelections == rowIds;

        console.log('ListingSelections--',this.ListingSelections);

        // Mark controls responding to selections
		for (var i=0; i < SCTools.length; i++) {
			if (hasSelections == true) {
                SCTools[i].classList.add('HasSelections');
			} else {
				SCTools[i].classList.remove('HasSelections');
			}				
		}
		
        // Note the number of selections
		if (selectionCount > 0) {
            this.diags=this.Internationalise('AdviceLabelSelected') + ': ' + selectionCount + '/' + LIs.length;
		} else {
        	//v1.41+ : make no diagnostic assumptions here?
            this.diags=this.Internationalise('AdviceLabelMatchingItems') + ': ' + LIs.length;
		}
    } 
   
    // Visually style the "current" record in a list
    setSelectedRow(rowId){
    
        try {

            var marked = this.template.querySelectorAll('[data-id="HelpListingItem"]');
            
            for (var i=0; i< marked.length; i++) {
                // Iterate to initially remove selected style...

				marked[i].classList.remove('SelectedRecord');
                // ... then add style back to the desired row
				if (this.ListingStyle == 'Narrow') { 
					
					if (marked[i].getAttribute("data-ids") == 'LINarrow_' + rowId) {
                        marked[i].classList.add('SelectedRecord');
					}
				}
				if (this.ListingStyle == 'Wide') {
					if (marked[i].getAttribute("data-ids") == 'LIWide_' + rowId) {
                        marked[i].classList.add('SelectedRecord');
					}
				}
				if (this.ListingStyle == 'Tile') {
                    // No selected style for tile mode
				} 
				
                // Keep a record in member data of selected row
				this.SelectedRow == rowId; 
            }
           

        } catch (e) {}
    

    }

    // Hide callout on mouse out if required
    tipMouseOut (evt) {
        var opt = this.globalsettings.iahelp__CalloutClosureBehaviour__c;
		
        // Check required tip closure behaviour:
		// 1 = Close on element toggle only - NO mouse out behaviour
		// 2 = Close on mouse out only - NO toggle behaviour
		// 3 = Close on mouse out or element toggle
		if (opt != '1') {
            this.hideCallout();
		}	
        
    }

    // Waiting cues for callouts
    toggleTipBusy(){

            var tBusy = this.template.querySelector('[data-id="IHTipPending"]');   
            var cnt = this.template.querySelector('[data-id="CalloutContainer"]'); 
            var frm = this.template.querySelector('[data-id="tfrm"]'); 

           if (cnt.classList.contains('slds-hide')) {
                tBusy.classList.add('IHTipPending');
               frm.classList.add('slds-hide');
               console.log('tBusy'+tBusy.classList+'frm'+frm.classList);
           } else {
                
                tBusy.classList.remove('IHTipPending');
                frm.classList.remove('slds-hide');
           }
    }

    // Hide any open callout
    hideCallout(){
    
        var cnt = this.template.querySelector('[data-id="CalloutContainer"]');
        cnt.classList.add('slds-hide');
        
        // Remove record selected styling from all items (list rows):
        // Don't do this where retention of selection marking has been requested, e.g., for the stickies list 
        // (where we want to retain knowledge of the item applicable to current context)
        
        //if (cmp.get("v.CardConfig") != 'Stickies') {
        if (this.retainselectiononscroll != true) {

            var LItems = this.template.querySelectorAll('li.HelpListingItem, tr.HelpListingItem');
            //var LItems1 = this.template.querySelectorAll('[data-id="HelpListingItem"]');

			for (var i=0; i < LItems.length; i++) {
                LItems[i].classList.remove('SelectedRecord');
			}
        }
    }

    // Log an interaction recording list state (expaneded / collapsed details) 
    logListState(state) {

        logLUXInteraction({
            "iTyp" : "10",
            "Description" : state,
            "IHContext" : this.recordId
        })
    }

    // Derive a page layout identifier client-side from page address (eg., where record ID not present)
	getPageContextIdentifier(){
		var cxt = '';
		
		try {
			cxt = window.location.pathname;
			
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
			console.log('IHCard Helper - derived page context for "' + this.cardcomponentid + '" is: "' + cxt + '"'); 
			
		} catch (e) {
			console.log('IHCard Helper - error deriving page context: ' + e);
		}
		
		return cxt;
	
	}

    // Expand / collapse an accordion section
    toggleAccordion(cmp, clickedId) {
        console.log(' Card toggleAccordion '+clickedId);
        var sect = cmp.template.querySelector('[data-id='+clickedId.replace('_Summary', '_Section')+']');
        var twst = cmp.template.querySelector('[data-id='+clickedId.replace('_Summary', '_Twisty')+']');
    	var opt = clickedId.replace('_Summary', '');
        sect.classList.toggle('slds-is-open');
        twst.classList.toggle('nodeExpanded');
    	
    	return opt;
    	
    }

    // Toggle visibility of listing / node tools collapsed to ellipsis
	toggleListingTools(listingId) {
        
		var blocks;
        var LItems = this.template.querySelectorAll("div[class*='ListingToolsBlock_']");
      
		for (var i=0; i < LItems.length; i++) {
		
            if(! LItems[i].classList.contains('ListingToolsBlock_' + listingId)){
                LItems[i].classList.add('slds-hide');
            }
		}
					
		// TOGGLE the tool area representing the clicked tool ellipsis
		//LItems = document.querySelectorAll('div.ListingToolsBlock_' + listingId);
		LItems = this.template.querySelectorAll('div.ListingToolsBlock_' + listingId);
		for (var i=0; i < LItems.length; i++) {
            LItems[i].classList.toggle('slds-hide');
		}
	          
	    // For the expanded tools area, show its ellipsis button as "in use"
		//LItems = document.querySelectorAll("span[class*='ListingToolsBlockMaster_']");
        LItems = this.template.querySelectorAll("span[class*='ListingToolsBlockMaster_']");

		for (var i=0; i < LItems.length; i++) {
            LItems[i].classList.remove('Inactive');
            LItems[i].classList.remove('Dark');
		}

        LItems = this.template.querySelectorAll('div.ListingToolsBlock_' + listingId);
        blocks = this.template.querySelectorAll('span.ListingToolsBlockMaster_' + listingId);
        console.log('LItems'+LItems);
        console.log('blocks '+blocks);
					
		for (var i=0; i < LItems.length; i++) {
			for (var j=0; j < blocks.length; j++) {
                if(LItems[i].classList.contains('slds-hide')){
                    blocks[j].classList.remove('Inactive');
                    blocks[j].classList.remove('Dark');
                }else{
                    blocks[j].classList.add('Inactive');
                    blocks[j].classList.add('Dark');
                }
			}
		}
		
		
	}
    getMyAttribute(cmp,name){
        name=name+'';
        var val='';
        if(name+''!='undefined'){
        
            switch(name){
    
                case 'DataMode':
                    val=cmp.datmode;
                    break;
    
                case 'IsCustomLayout':
                    break; 
    
                case 'ListingRowStyle':
                    break;
    
                case 'ShowDescriptions':
                    break;
    
                case 'SuppressHeader':
                    val=cmp.cardsuppressheader;
                    break;  
                    
                case 'HasHistory':
                    val=cmp.HasHistory;
                    break; 
                    
                
            }
        }
        return val;
      }
		
		   suppressPoweredBy(){
    //    var hidefooterlogo = this.template.querySelector('[data-id="PoweredBy"]');
    //    hidefooterlogo.classList.remove('slds-hide');
    //    console.log('hidefooterlogo===>>>',hidefooterlogo);
					 console.log('footerlogo');
    this.footerlogo = true;
      }
		
		 gotoPoweredBy(){
        //window.open('https://www.improvedapps.com/contact/');
        var iCode = 'ContactUsLink';
        var U = Internationalise(this, iCode);
        
        // Bail if, for any reason, we don't get the required URL
        if (U == iCode) {
            return;
        }
        window.open(U);

      }
}