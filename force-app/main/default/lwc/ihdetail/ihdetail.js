import { LightningElement,track,wire,api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import IHCard from 'c/ihcard1';
import getTools from '@salesforce/apex/iahelp.ControllerLUXOps.getTools';
import getObjectName from '@salesforce/apex/iahelp.ControllerLUXOps.getObjectName';
import getTopicEditingControls  from '@salesforce/apex/iahelp.ControllerLUXOps.getTopicEditingControls';
import saveRecord  from '@salesforce/apex/iahelp.ControllerLUXOps.saveRecord';
import getElementsForLayout  from '@salesforce/apex/iahelp.ControllerLUXOps.getElementsForLayout';
import getGlobals  from '@salesforce/apex/iahelp.ControllerLUXOps.getGlobals';
import deleteTopic  from '@salesforce/apex/iahelp.ControllerLUXOps.deleteTopic';
import cloneTopic  from '@salesforce/apex/iahelp.ControllerLUXOps.cloneTopic';
import TVoteSetsLink  from '@salesforce/apex/iahelp.ControllerLUXOps.TVoteSetsLink';
import getVoteInfoForTopic  from '@salesforce/apex/iahelp.ControllerLUXOps.getVoteInfoForTopic';
import getClickablesJSON  from '@salesforce/apex/iahelp.ControllerLUXOps.getClickablesJSON';
import getAdditionalInfoForTopic  from '@salesforce/apex/iahelp.ControllerLUXOps.getAdditionalInfoForTopic';
import { publish,subscribe,APPLICATION_SCOPE,unsubscribe,createMessageContext,releaseMessageContext,MessageContext } from 'lightning/messageService';
import messageChannel from "@salesforce/messageChannel/MyMessageChannel__c";
import { onError , subscribe as empApiSubscribe, setDebugFlag, isEmpEnabled }  from 'lightning/empApi';

export default class Ihdetail extends IHCard {
    @wire(MessageContext)
    messageContext;
    subscription=null;
    	// ************** IHCard properties**************************************
        @api componentid;
        @api listensto;
        @api height;
        @api suppressheader=false;
        @api suppressfooter=false;
        @api uxtheme='';
	      @api backgroundstyle='Coloured';
		//@api newheight;
    //	***********************************************************************
    @api nodatamessage='[No Data]';
    @api helprecordid;
    @api toolcontext='QAM';
    @track toolcontextaf='[DEFAULT]';
    @api LayoutInfoPrecedence='Help Topic';
    @api LayoutInfo='';
    @api cachedrecordsource='';
    @track TreeContext='';
    @api recentlyamendedclass = '';
    @api get CurrentRecord(){
      return this._CurrentRecord;
    }
    set CurrentRecord(value){
        this._CurrentRecord = value;
        console.log(' Set _CurrentRecord '+this._CurrentRecord);
        this.CurrentRecordChange();
    }
    @api MediaCheckTimer=0;
  //  @api CurrentRecord;
    @api KeywordParsedDescription='';
    @api get isnontopic(){
      return this._isnontopic;
    }
    set isnontopic(value){
        this._isnontopic = value;
        console.log(' Set __isnontopic '+this._isnontopic);
      //  if(this._isnontopic==true)
          this.autoformCall();
    }
   // @api isnontopic=false;
    @api ishelptopic;
    @api TemplatesC ;
    @track TemplatesF ;
    @track TemplatesL  ;  
    @track CustomStyles ;
    @track Visibilities ;
    @track VoteSets ;
    @api SelectedVoteSet; 
    @track GuidedLayouts ;
    @track GuidedElements ;
    @track TitleTabImage='';
    @track AdviceLabelProperties='';
    @track AdviceLabelGuideSettings='';
    @track TipButtonFullSizeImage='';
    @track TitleTabImage='';
    @track TitleTabVideo='';
    @track mouseoverdone=false;
		@api issubcomponentd=false;
    @api get condition1(){
      return ((this.isnontopic == false && (this.CurrentRecord + '' == '' || this.CurrentRecord + '' == 'undefined') )||
       (this.isnontopic == true && (this.helprecordid + '' == '' || this.helprecordid + '' == 'undefined'))
        ? true : false)
    };
    @api get condition2(){
      return (this.ishelptopic == true && this.datmode == 'View')
    };
    @api get condition3(){
      return (this.ishelptopic == true && this.datmode == 'Edit')
    };
    @api get selector3class(){
      return (this.CustomFields.length > 0 ? 'slds-tabs_default__item slds-text-heading_label' :
       'slds-hide slds-tabs_default__item slds-text-heading_label')
    };
    @api get recencymarkingclass(){
      return (this.datmode == 'View' || this.datmode == 'InlineEdit' ? (this.CurrentRecord+''!='undefined'?this.CurrentRecord.iahelp__CustomStyle__c :'') + ' ' + this.recentlyamendedclass : 'slds-hide')
      
    };
    @api get selectedVote(){ return (this.TemplatesC+''!='undefined' && this.TemplatesC!=null && this.SelectedVoteSet.Id != null) };
    @api get selectedVoteImg(){ return (this.SelectedVoteSet + '' != '' && this.SelectedVoteSet + '' != 'undefined' && this.SelectedVoteSet.iahelp__ImageClass__c + '' != '' ? '' : 'slds-hide') };
    @api get voteSetText() { return (this.SelectedVoteSet!= null && this.SelectedVoteSet + '' != 'undefined'? this.SelectedVoteSet.iahelp__QuestionText__c : '')};
    @api medialist=[{'label':'Image','value':'Image'},{'label':'Video','value':'Video'}];
    @api optsC=[];
    @api optsF=[];
    @api optsL=[];
    @api optsV=[];
    @api optsCS=[];
    @api optsVO=[];
    @api optsGL=[];
    @api modifiedCustomFields=[];
    @api VideoIframeHeight=0;
    @api topicStatus =[{'label':'New','value':'New'},
										{'label':'Drafted','value':'Drafted'},
										{'label':'Submitted for Approval','value':'Submitted for Approval'},
										{'label':'Approved','value':'Approved'},
										{'label':'Published','value':'Published'},
										{'label':'Suspended','value':'Suspended'},
										{'label':'Obsolete','value':'Obsolete'}];
    @api optsSL=[{'label':'--None--','value':null},
                    {'label':'Automatic','value':'Automatic'},
                    {'label':'Local','value':'Local'},
                    {'label':'Manual','value':'Manual'}];
    @api optsGE=[];
		
    @api get imgstyle(){
      return (this.CurrentRecord+''!='undefined'? 'margin: auto; width: ' + this.CurrentRecord.iahelp__ImageWidth__c 
      + 'px; height: ' + this.CurrentRecord.iahelp__ImageHeight__c 
                        + 'px; background: url(\'' + this.CurrentRecord.iahelp__ImageURL__c + '\') no-repeat center; ' 
                        + 'background-size: ' + this.CurrentRecord.iahelp__ImageWidth__c + 'px ' + this.CurrentRecord.iahelp__ImageHeight__c + 'px;' : '')
    };
    @api get videoAvailability(){ 
      if(this.CurrentRecord+''!='undefined')
          return (this.CurrentRecord.iahelp__VideoURL__c != null
          ? 'slds-col slds-align_absolute-center slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-2' 
          : 'slds-col slds-align_absolute-center slds-size_1-of-1')};
    @api get imgContainer(){ 
      if(this.CurrentRecord+''!='undefined')
        return (this.CurrentRecord+''!='undefined' && this.CurrentRecord.iahelp__ImageURL__c == null ? 'slds-hide' : '')};
    @api get imgAvailability(){ 
      if(this.CurrentRecord+''!='undefined')
          return (this.CurrentRecord.iahelp__ImageURL__c != null
          ? 'slds-col slds-align_absolute-center slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-2' 
          : 'slds-col slds-align_absolute-center slds-size_1-of-1')};
    @api get videoSlds(){
      if(this.CurrentRecord+''!='undefined') 
        return (this.CurrentRecord.iahelp__VideoURL__c != null
          ? '': 'slds-hide')};
    @api get videoStyle(){
      if(this.CurrentRecord+''!='undefined')
        return ('height: ' + this.VideoIframeHeight + 'px; width: ' + this.CurrentRecord.iahelp__VideoWidth__c+ 'px;')};
    @api get videoStyle2(){ 
      if(this.CurrentRecord+''!='undefined') 
        return ('height: ' + this.CurrentRecord.iahelp__VideoHeight__c+ 'px; width: 100%;')};
    @api get SVImg() { 
      if(this.SelectedVoteSet+''!='undefined')
        return (this.SelectedVoteSet!= null ? this.SelectedVoteSet.iahelp__ImageClass__c : '')};
    @api get editstyling() { return (this.isdirty == true ? 'isDirty ' : '')};
    @api get imgStyleEditMode(){
      return(this.CurrentRecord+''!='undefined'? ('margin: auto; width: ' + this.CurrentRecord.iahelp__ImageWidth__c+ 'px; height: ' + this.CurrentRecord.iahelp__ImageHeight__c 
      + 'px; background: url(\'' + this.CurrentRecord.iahelp__ImageURL__c + '\') no-repeat center; ' 
      + 'background-size: ' + this.CurrentRecord.iahelp__ImageWidth__c + 'px ' + this.CurrentRecord.iahelp__ImageHeight__c + 'px;') : '')
    };
    @api get HID() {
      return (this.helprecordid!=null && this.helprecordid!='[None]' ? this.helprecordid :'[None]')
    };

    @api cmpGeneratorVal="";
    @api TemplateObjectId="";
    @track detailIdNameList={};
   // @track ctopic;
    @api get ctopic(){
      return this._ctopic;
    }
    set ctopic(value){     
      this._ctopic = value;    
    }

    @api get descriptionText(){
      return (this.cachedrecordsource == '' ? this.KeywordParsedDescription : this.mouseoverdone==true? this.KeywordParsedDescription:(this.CurrentRecord+''!='undefined' ? this.CurrentRecord.iahelp__Description__c : ''));
    }
  /*  @api get descriptionText(){
      return (this.cachedrecordsource == '' ? this.KeywordParsedDescription : this.KeywordParsedDescription);
    }*/
    @api thevotecopy;
    @api get getTheVote(){
      return this.thevotecopy+''!='undefined' ? this.thevotecopy : '';
    }
    @api get getVoteOption(){
      return this.VoteOptions;
    }
    @api get checkVideoUrl(){
      return this.CurrentRecord+''!='undefined' && this.CurrentRecord.iahelp__VideoURL__c+''!='undefined' && this.CurrentRecord.iahelp__VideoURL__c!='' ? true : false;
    }

    channelName = '/event/iahelp__LWC_Aura_Interaction_Event__e';
    isSubscribeDisabled = false;
    isUnsubscribeDisabled = !this.isSubscribeDisabled;

   // subscription = {};

    connectedCallback(){
      console.log(' In Detail help topics '+this.helptopics); 
      var thisref=this;
      this.isnontopic=false;
      this.toolcontext=this.toolcontext;
      this.temphelpid=this.helprecordid;
      this.ihcardtype='Detail';
      this.ishelptopic=true;
      this.cardsuppressheader=this.suppressheader; 
      this.cardsuppressfooter=this.suppressfooter;
      this.cardcomponentid=this.componentid;
      this.cardlistensto=this.listensto;
      this.thevotecopy=this.thevote;
      this.carduxtheme=this.uxtheme;
      this.cardbackgroundstyle=this.backgroundstyle;
		  this.carduxtheme=this.uxtheme;

      this.handleSubscribe();		

      // Differentiate topic and non-topic (autoform) tool contexts - unless default has been requested
    	if (this.toolcontext == '[DEFAULT]') {
          this.toolcontextaf = this.toolcontext;
        } else {
          this.toolcontextaf = this.toolcontext + '_Autoform';
      } 
      this.initialiseGlobals();

          //-------------Platform Event----------------------------------------------

          // Callback invoked whenever a new event message is received
          var messageCallback = function(response) {
            console.log('New message received: ');
            var x = JSON.parse(response.data.payload.iahelp__Parameters__c);
			
            if(x.ActionCode=='RelatedHelp'){
                if(thisref.platformEventBeingListenedTo(response) &&
                     (thisref.eventBeingListenedTo(x) || x.SourceComponent == thisref.componentid+'_SpecialComp'+thisref.uniqueident)){
                      var messageChannelEvent;
                      var rid=x.Parameters;
									
                      try{
                        rid=rid.split('^');
                        rid=rid[0];
                      }catch(e){
                        rid=x.Parameters;
                      }
                      console.log('rid: ', rid);
                      messageChannelEvent={ActionCode:x.ActionCode,RecordId:rid,SourceComponent:x.SourceComponent};
                  
                      publish(thisref.messageContext, messageChannel, messageChannelEvent);
                    // Need to raise Select Topic Event using x.parameters
                    // Response contains the payload of the new message received
                }
            }
        }

        // Invoke subscribe method of empApi. Pass reference to messageCallback
        empApiSubscribe(this.channelName, -1, messageCallback).then(response => {
            // Response contains the subscription information on subscribe call
            console.log('Subscription request sent to: ', JSON.stringify(response.channel));
          // this.subscription = response;
        })

    }
    renderedCallback(){
      if(this.sobjectname+''=='undefined' || this.sobjectname==null){
        this.sobjectname='';
      }
    }

    @api reinit(){
      this.initialiseGlobals();
    }

    initialiseGlobals(){
      getGlobals().then(result => {       
        this.processTools(result);
        this.manipulateCustomFields();
        var theRecord = this.helprecordid;
        var keyTypes=this.globalsettings+''!='undefined'?this.globalsettings.iahelp__SFObjectIds__c:'';
        if (keyTypes + '' != 'null') {
          keyTypes = keyTypes.split('^');
        } else {
          // If we can't check for Help record key type, arrange things
          // so we will act as for a Topic (see below)
          keyTypes = [];
          
          try {
            keyTypes.push(theRecord.substring(0,3));
          } catch (e) {
            // No record for the time being - ignore here
          }
        }

      if (theRecord + '' == 'null') {
        theRecord = '';
      }
      if (theRecord != '' && theRecord+''!='undefined') {

          if (theRecord == '[None]') {
            // If [None] specified, continue as if a help topic, as this is handled
            // by the getTools action code...
            this.initialiseDetails();
            
          } else if (theRecord.substring(0,3) != keyTypes[0]) {	
              // If a non-help topic, issue record selected event for onward handling
              var selectTopic={RecordId:theRecord,SourceComponent:this.ComponentId+'_SpecialComp'};
              publish(this.messageContext, messageChannel, selectTopic);
              
          } else {     
            // For topics, continue as normal
              this.initialiseDetails();
            
          }
        
      } else {        
              this.initialiseDetails();
        }
    })
     // this.initialiseDetails();
    }

    initialiseDetails(){
    //  try{ 
       // this.showSpinner();
        this.isbusy=true;    
        this.actioncode='HelpTopic'; 
        var TCxt = this.toolcontext;
        // Allow page-author specified tool context, noted above, to override our usual defaults
        if (TCxt != '' && TCxt != '[DEFAULT]' && TCxt != 'QAM' && TCxt+'' != 'undefined') {
          this.toolcontext = TCxt;
        } else {
            this.toolcontext = 'CardHelpTopic';
        }           
      //  this.toolcontext=this.ToolContext; // Card ToolContext
      console.log('this.toolcontext '+this.toolcontext);
        getTools({
            ToolContext : this.toolcontext, 
            ActionCode : this.actioncode,
            ClientComponentId : this.componentid, 
            Params : this.helprecordid,
            SkipGlobals : false})
            .then(result => {
              this.processTools(result);
              this.modifiedbodytools = this.modifiedbodytools;
              this.thevotecopy=this.thevote;
              this.manipulateCustomFields();
            //  this.hideSpinner();
              this.isbusy=false;
              this.initialiseEditingControls();              
              var obj = this.cardlistitems[0];
              // If, for whatever reason, we have no current record, set default titles etc
              if (obj + '' == 'undefined') {
                this.title=this.Internationalise('TitleNoTopicSelected');
                
            } else {
             // this.CurrentRecord='';
              this.CurrentRecord = obj;
             /*   try{
                this.detailIdNameList[this.CurrentRecord.Id]=this.CurrentRecord.Name;  
                }catch(e){}           
           //   this.detailIdNameList=JSON.parse(JSON.stringify(this.detailIdNameList));
              var tmp=this.detailIdNameList;
              this.detailIdNameList={};
              this.detailIdNameList=tmp;   */       
              this.ihcontext = obj.Id;
              this.helprecordid = this.CurrentRecord.Id;
              this.temphelpid = this.helprecordid;
              this.title='';
              this.title = obj.Name; 
            
             // this.imgstyle='background:url(\'' + this.CurrentRecord.iahelp__ImageURL__c + '\')';
             if(this.CurrentRecord+''!='undefined'){
                this.imgstyle='margin: auto; width: ' + this.CurrentRecord.iahelp__ImageWidth__c 
                + 'px; height: ' + this.CurrentRecord.iahelp__ImageHeight__c 
                                  + 'px; background: url(\'' + this.CurrentRecord.iahelp__ImageURL__c + '\') no-repeat center; ' 
                                  + 'background-size: ' + this.CurrentRecord.iahelp__ImageWidth__c + 'px ' + this.CurrentRecord.iahelp__ImageHeight__c + 'px;';
             }
            }
              
              // Obtain the keyword parsed version of our topic description - this is NOT the one
					// in the current record / topic itself, as this needs to be the true, "clean" version
					// in order to allow for correct edits: this should have been left in "pass through" 
					// data set...
					this.KeywordParsedDescription = this.PassThroughData+''!='undefined'?this.PassThroughData[0].Value:'';                    
          this.SelectedVoteSet=obj.iahelp__HelpVoteSet__c;   
          // Topic does not set height in LUX - it's the component itself,
          // whose height is set through designer by page author
          //cmp.set("v.Height", obj.iahelp__HeightBeforeScrolling__c + 120);
          
           // Add any "recently modified" marker where relevant:
          // Note that we are able to do this server-side for lists (where
          // we return generic list items) whereas here we have a help topic
          // record - which does not of itself have a recency flag...
                    
          var hrs = this.globalsettings.iahelp__UpdateMarkerHours__c;                    
          var dTRecenyLimit = new Date(new Date().valueOf() - hrs*60*60*1000);
          var dTModified = new Date(obj.LastModifiedDate);

          if (dTModified > dTRecenyLimit) {
                this.recentlyamendedclass = 'IHCollateralUpdated';
          } else {
                this.recentlyamendedclass = '';
          }

          // Note the ID of the Help Topic Templates object (from global settings)
					try {
						var tObj = this.globalsettings.iahelp__SFObjectIds__c;
						tObj = tObj.split('^');
						this.TemplateObjectId=tObj[3];                    
					} catch (e) {
						// If for some reason we don't get global settings, there's little we can do...
					}

          // Note some form-specific translations
          this.AdviceLabelGuideSettings = this.Internationalise('AdviceLabelGuideSettings');
          this.AdviceLabelProperties = this.Internationalise('AdviceLabelProperties');
          this.TipButtonFullSizeImage = this.Internationalise('TipButtonFullSizeImage');
          this.TitleTabImage = this.Internationalise('TitleTabImage');
          this.TitleTabVideo = this.Internationalise('TitleTabVideo');
          // Initialise our sub-component, if required by lighting template
          this.initialiseTemplateComponents();

            }).catch(error=>{  
              console.log(error);
            })  
     //     }
    //      catch(e){
   //       } 
         // this.hideSpinner(); 
         // this.isbusy=false;        
    }

    handleSubscribe() {
      console.log('In handle subscribe');
      if (this.subscription) {
          return;
      }
      this.subscription = subscribe(this.messageContext, messageChannel, (message) => {
              this.handlePassThrough(message);       
       //   }
          
          
          
      },{scope:APPLICATION_SCOPE});

    }
  // Respond to (e.g., data manipulation) events passed through from our super component
    handlePassThrough(message){
      console.log(' handlePassThrough '+message.ActionCode);
        if(message.RecordId!=null && message.RecordId+''!='undefined'){
          this.selectRecord(message);
        }
        if((message.RecordId==null || message.RecordId+''=='undefined') || message.ActionCode=='RootNodeChange'){
            var aCode = message.ActionCode;
            var parms = message.Parameters;
            var D1 = '^';
            var src = message.SourceComponent;


            if(aCode == 'HTShareLink')
            {
              var link = window.location.origin+'/';
              var msg = 'Please forword the URL shown to share this item';
              var url = link+this.helprecordid;
              prompt(msg,url);
              
            }
            // Special cases: respond to our dialogue component (should be helper.eventIsFromOurDialogue - but this isn't working!)
            //if (aCode == 'DialogueRequestClose' && src == this.componentid + '_Dialogue') {
              if (aCode == 'DialogueRequestClose'){
              // If we're closing the upload image dialogue, refresh to reflect changes
              if (this.actioncode == 'CueUploadImage') {
               this.initialiseDetails();
              }
            }


            // Special cases: respond to our Autoform component - changes to data
            if (aCode == 'DataAmended' && src == this.componentid + '_Autoform') {

              // Issue a "data amended" event as we would if saving a topic

              
            }


            // Respond only to events we're listening for from others in certain cases
            if (this.eventBeingListenedTo(message)) {
            
                if (aCode == 'RootNodeChange') {
                  this.TreeContext = parms;
                }
                          
              if (aCode == 'ComponentToolsProcessed') {			
                // Respond if the source has been set as our source of cached help record data
                  if (src == this.cachedrecordsource) {
                    if(parms!=''){
                        var str = JSON.parse(parms);
                        if(str.length > 0) {
                          console.log(str[0].attributes);
                          if(str[0].attributes.type=='iahelp__HelpTopic__c'){
                              var HTs = str;
                              this.helptopics = HTs;	
                          } 
                          if(str[0].attributes.type=='iahelp__HelpedElement__c'){
                            var HEs = str;
                            this.helpedelements=HEs;	
                          }                                   
                          
                        } 
                      }
                }
              }
            }
            // Respond only to our own events in some cases
            if (this.eventIsOurOwn(message)) {
                    
              switch (aCode) {
                  
                  case 'Cancel':
                      // Cancel effectively re-gets our record
                   //   this.showSpinner();
                      this.isbusy=true;
                      this.datmode='View';
                      this.initialiseDetails();
                      this.isdirty=false;
                      break;
              
                  case 'ComponentToolsProcessed':
                      // Component tools downloaded by Card include details of any Custom Fields in our case
                      // (This is only true of the "HelpTopic" action that we cue after rendering).
                      // Show or hide custom fields tab depending whether such fields were found...
                      
                      break;
                      
                  case 'CueUploadImage':
                      var tmp=message.cmp;
                          // Cue upload image dialogue:
                      // Warn on entry that this will lose any unsaved changes, if any have been made
                      // and offer backout
                      if (this.isdirty == true) {
                        if (! confirm(this.Internationalise('[QAMMessageDirtyWarning]'))) {
                          return;
                        }
                        
                        // If we continue, we should remove dirty status - as we will be losing the changes
                        this.isdirty = false;
                      }


                      var CRoot = this.communityroot;
                      
                      // If root is 'null', this can be ignored in most cases
                      if (CRoot + '' == 'null') {CRoot = '';}
                      if (CRoot != '') {CRoot = '/' + CRoot;}
                  
                      var dlgSource = CRoot + "/apex/iahelp__IHUploadTopicImage?IHLUX=true&HTID=" + this.CurrentRecord.Id;        
                      this.doDialogue(this.tipbuttonuploadimage, 'VF', dlgSource, null, 130, false, false, false, false);
                          
                      // Need to do something here to cause control to refresh/rebuild after dialogue
                      // is closed, as topic image may have been updated and we don't want to allow
                      // such changes to be overwritten by subsequent edits...
                      this.actioncode = 'CueUploadImage';
                    break;

                    
                  case 'DeleteTopic' :            				     
                    // Delete the current topic, after local confirm message
                    if (confirm(this.Internationalise('MessageDeleteWarning'))) {
                        deleteTopic(
                          {HelpTopicId : this.helprecordid}).then(result => {
                          
                            if (result != '') {
                              // If there are any diagnostics, assume this is an error and show them
                              this.diags = result;
                              
                            } else {
                              // Otherwise, re-set this control
                              this.datmode = 'View';
                              this.initialiseDetails();
                              this.isdirty = false;
                              
                              // Also issue a "data amended" event for any listeners to note
                              // For deletes, don't pass record info in parameters (no point)
                              
                              var passThrough = {ActionCode: "DataAmended",Parameters:'',SourceComponent:this.componentid};
                              publish(this.messageContext, messageChannel, passThrough);
                              
                            }
                          
                          });
        
                      }
                      break;  
                  case 'Edit':
                  case 'View':
                        // Re-set card title (which may have changed via editor)
                        // then set specified mode           
                          this.title = this.CurrentRecord.Name;
                          this.datmode = aCode;
                        if(this.datmode=='View'){
                          
                        }
                        if (aCode == 'View') {
                          // Initialise our sub-component - for view mode only, if required by lighting template
                         // helper.initialiseTemplateComponents(cmp, event, helper);	 
                         this.KeywordParsedDescription=this.CurrentRecord.iahelp__Description__c;                        
                          
                        } else {
                          // In edit mode, we need height = 100% / specified, not auto
               
                        }
                      
                      break;
                      
                  case 'Save':
                  case 'QuickSave':
                       // Turn current record into JSON for marshalling
                       this.isbusy=true;
                  var objectJSON = JSON.stringify(this.CurrentRecord);
                  saveRecord({objectJSON : objectJSON})
                      .then(result => {
                        //this.showSpinner();
                        this.CurrentRecord=this.CurrentRecord;
                        this.isbusy=false;
                        this.datmode='View';
                        this.diags=this.Internationalise(result);

                  // Report any unusual diagnostics: this won't cover all possible error messages but...
                        if (this.diags.indexOf(this.Internationalise("MessageGenericError")) != -1) {
                          //helper.doNudge(cmp, helper.Internationalise(cmp, "MessageGenericError"), this.Diags"), 0);
                        }
            
                            // Re-set card title (which may have changed via editor)
                            // then set mode back to edit
                            this.title=this.CurrentRecord.Name;
                            this.isdirty=false;
                           // this.hideSpinner();
                          //  this.isbusy=false;
                      // Also issue a "data amended" event for any listeners to note
                      
                      var passThrough = {ActionCode: "DataAmended",Parameters:this.helprecordid,SourceComponent:this.componentid};
                      publish(this.messageContext, messageChannel, passThrough);
                  
                      // If saving (as opposed to Quick Saving) also return to View mode.
                  // In doing so, we also need to update the on-screen version of the topic description:
                  // When fetched from getTools etc. it will have been keyword-parsed, but we'll have to 
                  // revert here to "native" (i.e., last saved) version otherwise it may look on screen
                  // as if changes to description have been lost (as the old parsed version is shown)
                  if (aCode == 'Save') {
                            var tmp=this;
                            this.title=this.CurrentRecord.Name;
                            this.datmode='View';                          
                            this.KeywordParsedDescription=this.CurrentRecord.iahelp__Description__c;
                            
                            // View mode on detail card itself is not sufficient to 
                            // toggle the card ellipsis menu view / edit tool...
                            this.toggleConfigTool('Ellipsis', 'View',this);
                  
                  } else {
                    this.datmode='Edit';
                  }						


                  // Initialise our sub-component, if required by lighting template
                  //helper.initialiseTemplateComponents(cmp, event, helper);
                  
                        });
                      
                      break;
                      
                  case 'TopicAdd' :
                    // This is, in fact, the same as adding a topic via D&D - except we don't specify
                    // the dropped content (Topic Description). So: re-use D&D support calls here
              // The call will result in a "record selected" event - but we don't usually respond to these
              // when they emanate from ourselves. So: here we need to take additional action by setting
              // a "latch" to force response in these particular circumstances
              this.ResponseLatch=true;
					
              
              
              this.createNewTopic('', false);
              this.datmode='Edit';
                    break;
                    
                  case 'TopicClone' :
                    // Clone - using wrapped version of classic clone routine
                    var numClones = prompt(this.Internationalise('MessageCloneTopicNumber'), 1); 
                    var allCNames = '';
                    var allCRels = '';
                    var currentClone;
                    var sourceName = this.CurrentRecord.Name;
                    var i;
                    
                    // Gather clone information (desired names, clone relationships)
                    if (numClones > 0) {
                        for(i=1; i <= numClones; i++) {
                        currentClone = prompt(this.Internationalise('MessageCloneTopicNames') + ' (' + i + '/' + numClones + '):', sourceName + ': ' + i);
                        if (currentClone == null) {return;}
                            allCNames += currentClone.split('^').join('') + '^';
                            
                            currentClone = prompt(this.Internationalise('MessageCloneTopicRelationships'), 'Y');
                        if (currentClone == null) {return;}
                            allCRels += currentClone.split('^').join('^') + '^';                    
                        }
                    }
                                        
                    // Having gathered the required naming data, create the requested clones
                    if (allCNames != '') {

                  this.showSpinner();
                  cloneTopic({HTID : this.CurrentRecord.Id,
                  cloneNames : allCNames,
                  cloneRels : allCRels})
                            .then(result => {				      				
                      var state = result;
          
                      // Remove waiting cues
                      this.hideSpinner();
              
                      if (state !=null && state+''!='undefined' && state+''!='') {            
                          
                          // Note return in Diags
                          this.diags=this.Internationalise(result);
                                          
                      } else {
                          this.diags="ERR!";
                      }	        		
                    }); 
				
	                }
                    break;
                      
            case 'ViewInPortal':
                    // Open current Topic in portal                  
              var CRoot = this.communityroot;
              
              // If root is 'null', this can be ignored in most cases
              if (CRoot + '' == 'null') {CRoot = '';}
              if (CRoot != '') {CRoot = '/' + CRoot;}        

              var HTID = this.helprecordid;
                    var PortalPage = this.portalpage;
              
              if (CRoot != '') {
                // If we're in a community, safest thing to do is to continue with VF option
                        window.open(CRoot + "/apex/iahelp__" + PortalPage + "?HTID=" + HTID);
                
              } else {
                // Where available, use LUX (component) override
                    window.open(CRoot + '/' + HTID);				
              }
                      
                      break;

                  default:
                      break;
              }
            }
      }
    }
    selectRecord (message){
        var theRecord = message.RecordId;
        var theOldRecord = this.helprecordid;
        var src = message.SourceComponent;        
        var doGetObjectInfo = false;
        try{
          var keyTypes=this.globalsettings.iahelp__SFObjectIds__c;
        }
        catch(e){}
               
        console.log('IHDetail selectRecord - entry: Component Id="' + this.componentid + '" Source ="' + src + '" Record = "' + theRecord + '" Old Record = "' + theOldRecord + '"');

      // ONLY ACT WITH A 'PROPER' RECORD:
      // Certain components (e.g., trees) may issue record selects / root changes that lead us here
      // with delimited data that only they understand. Attempts to process these messages will fail, 
      // so bail here if we encounter things that do not seem to be a record ID
      var D1 = '^';
      if (theRecord + '' == 'null') {
        console.log('IHDetail selectRecord: record ID is null - bailing...');
        return;
      }
      if (theRecord+''!='undefined') {
        if(theRecord.indexOf(D1) != -1){
          console.log('IHDetail selectRecord: illegal record ID encountered (' + theRecord + ') - bailing...');
          return;
      }
    }
    // Only respond to events that do not emanate from ourselves / do
        // emanate from components we wish to tie to
        // 1.42+ also, respond in the same way in the case of any specialised sub-component,
        // whose component identifier will have been hard wired (see helper.initialiseTemplateComponents) unless template creator specifies otherwise...
      
      if (this.eventBeingListenedTo(message) == true || message.SourceComponent == this.componentid + '_SpecialComp'+this.uniqueident) {
      
          // If the record in the message we receive does not represent a change, bail / take no further action
        if (theRecord == theOldRecord) {

          var typ = this.ishelptopic == true ? 'Topic' : 'Non-topic';
          
       //   console.log('IHDetail selectRecord - record appears unchanged - checking topic / non-topic status...');
          
      /*		if ((this.ishelptopic == true && this.CurrentRecord + '' != 'null') 
                || (this.isnontopic == true && this.helprecordid + '' != 'null')) {

            // Only back out if record is unchanged - and we're definitely already displaying it!
            // If current conditions match those of the "no data" message, we still need to act
            // to check whether there is something we've yet to display...

            console.log('IHDetail selectRecord - type unchanged (' + typ + ') - returning');
            return;
            
          } else {
            console.log('IHDetail selectRecord - last known type (' + typ + ') requires further processing - continuing...');
          }	*/	
			}
      // Offer back-out if dirty
      if (this.isdirty == true) {
          if (confirm(this.Internationalise('[QAMMessageDirtyWarning]')) == false) {
                return;
          }
      }

      // If we have a set of cached records, 'navigate' within that - assuming the
			// source of record selection is the 'cache source' set for this component

			if (src == this.cachedrecordsource) {
				if (this.currentRecordIsCached(theRecord) == true) {
          this.mouseoverdone=false; // To enable mouseover method
          //this.KeywordParsedDescription='';
					console.log('IHDetail selectRecord - record "' + theRecord + '" located in cache - refreshing clickables and returning');
					
					this.actioncode = 'HelpTopic';
					this.refreshClickables(theRecord, this.toolcontext, this.actioncode);
					return;
				}
			}


			// If we get here, we didn't find the requested record in the cache, 
			// so seek it via the standard server call

			// For some reason, global settings may not always have been retrieved, 
			// so try to fail safe here...
			if (keyTypes + '' != 'null' && keyTypes + '' != 'undefined') {
				keyTypes = keyTypes.split('^');
			} else {
				// If we can't check for Help record key type, arrange things
				// so we will act as for a Topic (see below)
				keyTypes = [];
				keyTypes.push(theRecord.substring(0,3));
			}
     // Action to take depends on whether the record selected is a Help Topic or not
			if (theOldRecord+''!='undefined' && theRecord.substring(0,3) != keyTypes[0]) {		
				// We don't want to display any help topic configuration tools in the areas beyond the
				// reach of the Autoform (e.g., our own card header) - so reset tools here to those applicable
				// to our form's tool context: 

				// Also, if we're NOT dealing with a Help Topic, we'll show an Auto-form:
				// We cannot easily obtain record name, so set to a blank title for safety
				// Process tools will use action code to derive a default card title, so we need to
				// set action code here accordingly to one with a blank translation
				this.title ='';
				this.actioncode = 'ToolsOnly';
			  this.refreshClickables(theRecord, this.toolcontextaf, this.actioncode);


				// If the record being requested is for a different object type to the last
				// one in play, obtain object name information so it can be used to construct the form
				if (theRecord.length > 3 && theOldRecord.length > 3) {
					if (theRecord.substring(0,3) != theOldRecord.substring(0,3)) {

        console.log('IHDetail selectRecord - Record has changed (from "' + theOldRecord + '" to "' + theRecord + '") and so has object type: seeking object info...');
					
						doGetObjectInfo = true;
					}
				}
				
				if (doGetObjectInfo == true) {
					 getObjectName({ 
						RecordId : theRecord
						}).then(result => {
					    if (result!=null && result+''!='undefined') {
					    	this.isnontopic = false;	
					    	try {
					    		this.helprecordid = theRecord;
                  this.temphelpid = this.helprecordid;					    		
					    	} catch (e) {}
					    	
					    	this.sobjectname = result;				
                this.ishelptopic = false;
                this.isnontopic = true;	
          console.log('IHDetail selectRecord - call to obtain object name / info returned "' + this.sobjectname + '" - Object Name set');
							
						} else {
							alert('Error obtaining object information!');
						}
					})
          

				} else {
					// If we already know the non-help topic object type, just display the record
			    	this.isnontopic = false;	
				    	
			    	try {
			    		this.helprecordid = theRecord;
              this.temphelpid = this.helprecordid;
			    	} catch (e) {}
			    	
            this.ishelptopic = false;
            this.isnontopic = true;	
					
				}
				
			} else {
            // If record IS a Help Topic, note this fact and continue		
                  // In these cases, we're changing topic (server call)
                  // so show our "waiting" cues and allow update...
                  
            this.isnontopic = false;	
                // this.showSpinner();
                //s this.isbusy=true;
                  this.helprecordid = theRecord;
                  this.temphelpid = this.helprecordid;
            this.initialiseDetails();
                  
                  // Revert to "clean"
                  this.isdirty = false;
            this.ishelptopic = true;				
          }
                      // Issue our own record selected event for others  
          /*
          ONLY DO THIS IF:
          RECORD HAS ACTUALLY CHANGED
          OR SOURCE IS SPECIAL COMP
          */                              
          if (theRecord != theOldRecord || message.SourceComponent == this.componentid + '_SpecialComp') {
            var selectTopic={RecordId:theRecord,SourceComponent:this.componentid};
            publish(this.messageContext, messageChannel, selectTopic);
            
            console.log('IHDetail "' + this.componentid + '": re-raising select record event having processed the same on arrival at "' + theRecord + '"...');            
            
          } else {
              console.log('IHDetail "' + this.componentid + '": record "' + theRecord + '" is unchanged: no onward event raised...');            
          }
      }
    }
    // Prepare editing controls (drop downs) as we don't bring these down as part of "tools" calls
    initialiseEditingControls() {     
      // this.logAdvancedDiags('IHDetail: Editing Controls entry...');
      getTopicEditingControls().then(result => {

           if (result != null && result+''!='undefined') {
             //this.logAdvancedDiags(cmp, 'IHDetail: editing tools callback...');

               var tC = [];        // Callout templates
               var tF = [];        // Full topic templates
               var tL = [];        // Lightning viewer templates
               var GLIDs = [];     // Guide Layouts
               var GElems = [];    // Guide Elements
               var Styles = [];    // Custom styles
               var VS = [];        // Vote Sets
               var Vis = [];       // Visibility settings
               var i;
               var obj;
               var hasAttributes = false;
   
         // Return value is JSON - parse this into objects for aura iteration...
               try {
           obj = JSON.parse(result);
               } catch (e) {
                   this.Diags = "IHDetailController - processTools - Error parsing the following JSON return value: " + result;
                   return;
               }

               for (i = 0; i<obj.length; i++) {
                   
                   try {
                       var s = obj[i].attributes.type;
                       hasAttributes = true;
                   } catch (e) {
                       hasAttributes = false;
                   }

                   if (hasAttributes === true) {

                       if (obj[i].attributes.type === 'iahelp__HelpTopicTemplate__c') {
                           if (obj[i].iahelp__TemplateType__c == 'Callout') {
                               tC.push(obj[i]);
                           }
           
                           if (obj[i].iahelp__TemplateType__c == 'Full Topic') {
                               tF.push(obj[i]);
                           }

                           if (obj[i].iahelp__TemplateType__c == 'Lightning Viewer') {
                               tL.push(obj[i]);
                           }
                       }
                       
                       if (obj[i].attributes.type === 'iahelp__HelpVoteSet__c') {
                           VS.push(obj[i]);
                       }
                       
                       if (obj[i].attributes.type === 'iahelp__HelpedPageLayout__c') {
                           GLIDs.push(obj[i]);
                       }

                       if (obj[i].attributes.type === 'iahelp__HelpedElement__c') {
                           GElems.push(obj[i]);
                       }

                   } else {
                       // Non-sObject types can be differentiated by a type tag that we add server side:
                       // (We're using our own "NameValuePair" class here)
                       if (obj[i].ValueSet == 'Visibilities') {
                           Vis.push(obj[i]);
                       } else {
                           Styles.push(obj[i]);
                       }
                   }
                   
               }

              // this.logAdvancedDiags(cmp, 'IHDetail: setting edit tool member data...');
               
               this.TemplatesC=tC;
               this.TemplatesF=tF;
               this.TemplatesL=tL;
               this.CustomStyles=Styles;
               this.Visibilities=Vis;
               this.VoteSets=VS;
               this.GuidedLayouts=GLIDs;
               this.GuidedElements=GElems;
               
               // Reflect selected vote set for question text etc.
               this.lookupRelatedObjects(this.SelectedVoteSet);
               this.optsC=[];
               for(i=0;i<this.TemplatesC.length;i++){
                  var c={'label':this.TemplatesC[i].Name,'value':this.TemplatesC[i].Id};
                  this.optsC.push(c);         
               }
               this.optsF=[];
               for(i=0;i<this.TemplatesF.length;i++){
                var c={'label':this.TemplatesF[i].Name,'value':this.TemplatesF[i].Id};
                this.optsF.push(c);         
             }
             this.optsL=[];
             for(i=0;i<this.TemplatesL.length;i++){
                var c={'label':this.TemplatesL[i].Name,'value':this.TemplatesL[i].Id};
                this.optsL.push(c);              
              }
              this.optsV=[];
             for(i=0;i<this.Visibilities.length;i++){
                var c={'label':this.Visibilities[i].Name,'value':this.Visibilities[i].Value!=null?this.Visibilities[i].Value:null};          
                this.optsV.push(c);              
              }
              this.optsCS=[];
              for(i=0;i<this.CustomStyles.length;i++){
                var c={'label':this.CustomStyles[i].Name,'value':this.CustomStyles[i].Value!=''?this.CustomStyles[i].Value:null};
                this.optsCS.push(c);              
              }
              this.optsVO=[];
              for(i=0;i<this.VoteSets.length;i++){
                var c={'label':this.VoteSets[i].Name,'value':this.VoteSets[i].Value+''!=''?this.VoteSets[i].Id:null};              
                this.optsVO.push(c);              
              }
              this.optsGL =[];
              for(i=0;i<this.GuidedLayouts.length;i++){
                var c={'label':this.GuidedLayouts[i].Name,'value':this.GuidedLayouts[i].Id+''!='null'?this.GuidedLayouts[i].Id:null};
               this.optsGL.push(c);              
              }

              for(i=0;i<this.GuidedElements.length;i++){
                var c={'label':this.GuidedElements[i].Name,'value':this.GuidedElements[i].Id+''!=null?this.GuidedElements[i].Id:null};
                this.optsGE.push(c);              
              }
               // Reflect selected vote set for question text etc.
              // this.lookupRelatedObjects(cmp, cmp.get("v.SelectedVoteSet"));

              // this.logAdvancedDiags(cmp, 'IHDetail: Editing Controls complete...');
               
           } else {
               // Report failure
               //alert("Error preparing Help Topic Card: " + response.getReturnValue());
           }       
     });

   }
    // Process editor tab clicks
    selectTab(evt) {
        var i;
        var currentIdx;
        var maxTabs = 100;
        var TabName = 'HelpTopicEditTab';

        try {
          currentIdx = evt.currentTarget.getAttribute("aria-controls").split(TabName).join('');
          currentIdx=currentIdx.split('-')[0];
        } catch (e) {
          // If tab click is not quite on the "right" bit of the tab...
          return;
        }
          // Get all tab selectors & Remove selection
          for (i=0; i < maxTabs; i++) {
            var t='[data-id=tabSelector'+i+']';
            var c=this.template.querySelector(t);
              if(c!=null){
                c.classList.remove('slds-active');
              }
          }

          // Find the clicked tab selector and add selected
            var c=this.template.querySelector('[data-id=tabSelector' + currentIdx+']');
            c.classList.add('slds-active');
          
          // Hide all tabs
          for (i=0; i < maxTabs; i++) {
            var c=this.template.querySelector('[data-id='+TabName + i+']');
            if(c!=null){
              c.classList.remove('slds-show');
              c.classList.add('slds-hide');
            }
          }
          
          // Find and show selected tab
            var c=this.template.querySelector('[data-id='+TabName + currentIdx+']');
            c.classList.remove('slds-hide');
            c.classList.add('slds-show');
          
          
          // If selected tab is Guides, ensure Guided Elements are populated as required
        /*  if (currentIdx == 6) {
            helper.lookupRelatedGElements(cmp, cmp.get("v.CurrentRecord.iahelp__GuidedLayout__c"));        
          }*/
    }
    setDirty(evt){
        // Mark current record as edited and write back field values to record where required
      // This is triggered from control change - so only set this
      // if we are truly in edit mode (rather than, say, navigating in view mode)
      if (this.datmode == 'Edit') {
          this.isdirty=true;
      } 
     // For select controls, we need to write the selected value back to our data
     var cmpId = evt.srcElement.getAttribute("data-id");
     if(cmpId!=null){
     var ctl = this.template.querySelector('[data-id='+cmpId+']');
     var val;
     var i;
      // Custom fields require special handing 
        if (cmpId == 'CUSTOMFIELD') {
            // We can't provide a unique Aura ID as this would have to be calculated and calculations
            // are not allowed in this attribute! So: the name of the underlying field has been put
            // into label class for use below. For now, we can just get control from event source
            ctl = evt.srcElement;
        } 
        

        if (ctl + '' != 'undefined' && ctl+''!=null) {
            val = ctl.value;
            if (ctl.type=='checkbox'){
              val = ctl.checked;
            }
            // Parse out any hard-coded string values used to represent nulls...
            if (val == null) {val = null;}

            switch (cmpId) {
                case 'CUSTOMFIELD' :
                    // Get the name of the field that needs to be edited                    
                    var cFld = ctl.getAttribute("data-fieldapi"); 
                    // Set to event value
                    this.CurrentRecord[cFld] = val;
                    this.CurrentRecord=this.CurrentRecord;
                    break;
                    
                case "CalloutMediaChoice" :
                    this.CurrentRecord.iahelp__CalloutMediaChoice__c=val;
                    break;
    
                case "CalloutTemplate" :
                    this.CurrentRecord.iahelp__CalloutTemplate__c=val;
                    
                    // On changing template, re-set callout height: this should have come
                    // down with each callout record:
                    var CTs = this.TemplatesC;
                    for (i=0; i<CTs.length; i++) {
                        if (CTs[i].Id == val) {
                            this.CurrentRecord.iahelp__CalloutHeight__c=CTs[i].iahelp__DefaultHeight__c;
                            break;
                        }
                    }
                    
                    break;

                case "CustomStyle" :
                    this.CurrentRecord.iahelp__CustomStyle__c=val;
                    break;

                case "GuidedElement" :
                    this.CurrentRecord.iahelp__GuidedElement__c=val;
                    break;

                case "GuidedLayout" :
                    this.CurrentRecord.iahelp__GuidedLayout__c=val;
                    this.lookupRelatedGElements(val);
                    
                    break;

                case "GuideStepMode" :
                    this.CurrentRecord.iahelp__GuideStepMode__c=val;
                    break;

                case "HelpTopicStatus" :
                    this.CurrentRecord.iahelp__HelpTopicStatus__c=val;
                    break;
            
                case "HelpVoteSet" :
                    this.CurrentRecord.iahelp__HelpVoteSet__c=val;
                    
                    // Keep track of selected vote set for use in other screen furniture
                    // helper.lookupRelatedObjects(cmp, val;
                    break;

                case "LightningTemplate" :
                    this.CurrentRecord.iahelp__LightningTemplate__c=val;
                    break;
            
                case "Template" :
                    this.CurrentRecord.iahelp__Template__c=val;

                // If template has changed, we may need to amend topic layout
                //  helper.refreshLayoutDesign(cmp, event, helper);

                    break;

                case "Visibility" :
                    this.CurrentRecord.iahelp__Visibility__c=val;
                    break;

                case "Name" :
                  this.CurrentRecord.Name=val;
                    break;  

                case "Summary" :
                  this.CurrentRecord.iahelp__Summary__c=val;
                    break; 
                      
                case "txtImgTitle" :
                  this.CurrentRecord.iahelp__ImageTitle__c=val;
                    break; 

                case "txtImgCaption" :
                      this.CurrentRecord.iahelp__ImageCaption__c=val;
                        break;

                case "txtImgURL" :
                  this.CurrentRecord.iahelp__ImageURL__c=val;
                    break; 
                    
                case "txtImgALTText" :
                  this.CurrentRecord.iahelp__ImageALTText__c=val;
                      break;  
  
                case "txtImgWidth" :
                  this.CurrentRecord.iahelp__ImageWidth__c=val;
                      break; 
  
                case "txtImgHeight" :
                  this.CurrentRecord.iahelp__ImageHeight__c=val;
                      break; 
                      
                case "txtVidTitle" :
                  this.CurrentRecord.iahelp__VideoTitle__c=val;
                      break;
    
                case "txtVidCaption" :
                  this.CurrentRecord.iahelp__VideoCaption__c=val;
                      break;
    
                case "txtVidURL" :
                        if(val.startsWith("https://")){
                            this.CurrentRecord.iahelp__VideoURL__c=val;
                          }
                          else{
                            this.CurrentRecord.iahelp__VideoURL__c='https://'+val;
                          }
                        
                      break;
    
                case "txtVidWidth" :
                       this.CurrentRecord.iahelp__VideoWidth__c=val;
                      break;
    
                case "txtVidHeight" :
                        this.CurrentRecord.iahelp__VideoHeight__c=val;
                      break;
                
                case "MasterTopic" :
                        this.CurrentRecord.iahelp__MasterTopicIdentifier__c=val;
                      break;
    
                case "HelpUrl" :
                        this.CurrentRecord.iahelp__SalesforceHelpURL__c=val;
                      break;
                
                case "CalloutHeight" :
                        this.CurrentRecord.iahelp__CalloutHeight__c=val;
    
                      break;
    
                case "HeightBScrolling" :
                        this.CurrentRecord.iahelp__HeightBeforeScrolling__c=val;
                      break;
    
                case "Active" :
                      val = ctl.checked;
                      this.CurrentRecord.iahelp__Active__c=val;
                      break;  
    
                case "ReadMoreLink" :
                      val = ctl.checked;
                      this.CurrentRecord.iahelp__ShowReadMoreLink__c=val;
                      break; 
                          
                case "ReferringRelationships" :
                      val = ctl.checked;
                      this.CurrentRecord.iahelp__ShowReferringRelationships__c=val;
                      break; 
    
                case "Description" :
                      this.CurrentRecord.iahelp__Description__c=val;
                      break; 
                        
                case "Keyword" :
                      this.CurrentRecord.iahelp__Keyword__c=val;
                      break;  
      
                case "GuidedRecord" :
                      this.CurrentRecord.iahelp__GuidedRecord__c=val;
                      break; 
                            
                case "GuideCallout" :
                      val = ctl.checked;
                      this.CurrentRecord.iahelp__GuideCallout__c=val;
                      break;                    
            }
        } 
      }    
    }

     // Vote Sets link
     maintainVoteSets() {
      TVoteSetsLink().then(result => {

          if (result!== null && result+''!='undefined') {
              var U = result;
              window.open(result);
             // Behaviour needs to reflect LUX vs VF /LUX out
           /*   if (window.location.href.indexOf('/apex/') != -1) {
                 window.open(result);
                
              } else {
                this[NavigationMixin.GenerateUrl]({
                  "type": "standard__webPage",
                  "attributes": {
                      "url": result
                  }
              }).then(generatedUrl => {
                window.open(result);
                });
              }*/

          } else {
            alert(this.Internationalise('MessageGenericError'));
          }
      });
      
  }
   
// Preview callout AS SAVED link
previewCallout() {
  var CRoot = this.communityroot;
  
  // If root is 'null', this can be ignored in most cases
  if (CRoot + '' == 'null') {CRoot = '';}
  if (CRoot != '') {CRoot = '/' + CRoot;}

      window.open(CRoot + "/apex/iahelp__IHPreviewCallout?HTID=" + this.CurrentRecord.Id);
  }
  // View templates link
  gotoTemplates() {
		var CRoot = this.communityroot;
		
		// If root is 'null', this can be ignored in most cases
		if (CRoot + '' == 'null') {CRoot = '';}
		if (CRoot != '') {CRoot = '/' + CRoot;}

        window.open(CRoot + "/" + this.TemplateObjectId);		
    }

     // Get Guide (HPL) Elements for selected Guided Layout
    lookupRelatedGElements(val){

      // On change of Layout, refresh elements
      getElementsForLayout({LayoutId : val})
              .then(result => {                    
          if (result!=null) {
        // Return value is JSON - parse this into objects for aura iteration...
              try {
              var obj = JSON.parse(result);
              this.GuidedElements=obj;
              //Again populating Guided element select option values as values inside GuidedElements has been changed
              this.optsGE=[];
              for(var i=0;i<this.GuidedElements.length;i++){
                var c={'label':this.GuidedElements[i].Name,'value':this.GuidedElements[i].Id+''!='null'?this.GuidedElements[i].Id:null};             
              this.optsGE.push(c);              
              }
          
              } catch (e) {
                  this.diags="IHCardHelper - processTools - Error parsing the following JSON return value: (" + e + ")" + result;
              }
          }
      }); 
      
  }
    toggleImageEdit(){
      this.template.querySelector('[data-id=ImgEditor]').classList.toggle('slds-is-open');
      this.template.querySelector('[data-id=ImgEditor_Twisty]').classList.toggle('nodeExpanded');
    }
    toggleVideoEdit(){
      this.template.querySelector('[data-id=VidEditor]').classList.toggle('slds-is-open');
      this.template.querySelector('[data-id=VidEditor_Twisty]').classList.toggle('nodeExpanded');
  }
    // Note certain pick list values and use these to obtain additional info about the related records:
        // E.g., obtain details of the selected Vote Set
      lookupRelatedObjects(val) {
          
        var vals;
        var i;

        vals = this.VoteSets;
        if(vals+''!='undefined'){
            for (i=0; i<vals.length; i++) {
                if (vals[i].Id === val) {
                    this.SelectedVoteSet=vals[i];
                    break;
                }
            }
          }     
      }
      CurrentRecordChange(){
         this.initialiseTemplateComponents();
          this.setMediaSizes();
      }
      // On change of record, check media sizes (esp. video) and set to aspect ratio amounts where rendered size dictates
      setMediaSizes() {
      // Use this opportunity to adjust media sizes if required: applies to video only.
      // If specified video width is too wide for the available screen, IFRAME will actually be
      // at 100% available width, despite being styled at a larger pixel size. 
      // Therefore, check rendered IFRAME size and, if less than expected, set IFRAME height
      // by aspect ratio.
      // Alas, we need a timer as it's the only way to reliably know when we have a rendered
      // iframe with a 'real' rendered width...
    
      this.MediaCheckTimer = setInterval(() => {
        
        try {
          // Only bother if we have a current record and we've viewing a help topic
          if (this.ishelptopic == true && this.CurrentRecord + '' != 'undefined') {
            
            // Only bother if we have video URL, H and W
            var vU = this.CurrentRecord.iahelp__VideoURL__c;
            var vW = this.CurrentRecord.iahelp__VideoWidth__c;
            var vH = this.CurrentRecord.iahelp__VideoHeight__c;
            
            
            if (vU != '' && vU + '' != 'undefined' && vW + '' != '0' && vW + '' != 'undefined' && vH + '' != '0' && vH + '' != 'undefined') {
            
              // Get IFRAME rendered W
              var frm = this.template.querySelector('[data-id="TopicVideoIframe"]');
              var renderedWidth = frm.offsetWidth;
              var ratio = parseInt(vW) / parseInt(vH);
              var ratioHeight = renderedWidth * (1 / ratio); 

              // If rendered width is less than topic's specified video width, set video height by ratio
              if (renderedWidth < vW) {
                
                // Ignore rendered widths of zero - means we have yet to correctly render
                if (renderedWidth == 0) {return;}
                			
                this.VideoIframeHeight=ratioHeight;
                            
              } else {
                this.VideoIframeHeight=vH;
              }
              
            } else {
            
              // Iframe should not be shown: set to 0 height here as belt & braces...
              this.VideoIframeHeight=0;
            }
            
            // If we get here, action has been taken: clear timer
            if (this.MediaCheckTimer != 0) {clearInterval(this.MediaCheckTimer);}
            
          } else {
            // If we get here, action is not required: clear timer
            if (this.MediaCheckTimer != 0) {clearInterval(this.MediaCheckTimer);}
    
          }
          
        } catch (e) {
          // If we get here, clear timer!
          if (this.MediaCheckTimer != 0) {clearInterval(this.MediaCheckTimer);}
        }
      }, 500);
	
	}
  // Set the data of a record D&D operation 
	  doDragStart (evt) {
      var D = this.delimiter;
      evt.dataTransfer.dropEffect = "move";
      
      // Set data to identify that a detail control record is being dragged, plus include record ID:
      evt.dataTransfer.setData('text', 'DetailTitle' + D + this.CurrentRecord.Id);		
    }
    // Allow record drags
    drag (evt) {
      evt.preventDefault();
    }
    // Show whether or not drop will be allowed
    doDragOver (evt) {
    //if (helper.DDAllowed(cmp, event) == true) {
      evt.preventDefault();

      var T = this.querySelector('[data-id="theTopicViewer"]');
  
      if (this.dropAllowed(evt) == true) {
      T.classList.add('DropTargetActive');
      } else {
      T.classList.add('DropTargetUnavailable');
      }
//	}
}
	  // Remove any drag over style hints
	  doDragLeave (evt) {
      evt.preventDefault();
      var T = evt.currentTarget;
      T.classList.remove('DropTargetActive');
      T.classList.remove('DropTargetUnavailable');
    }

	  // Take action when drop occurs
	  doDrop (evt) {
      try {
          evt.preventDefault();
          
          var theContainer = this.querySelector('[data-id="theTopicViewer"]');
          var dat = evt.dataTransfer.getData("text");
          var D1 = this.delimiter;    
          var parms = [];
      
          parms = dat.split(D1);
          
          // Not working here - god knows why
        theContainer.classList.remove('DropTargetActive');
        theContainer.classList.remove('DropTargetUnavailable');
          
          // Having removed visual clues, take no further action unless drop ops are allowed
          if (this.dropAllowed(evt) == false) {
            return;
          }
          
          // Respond according to request operation
          
          switch (parms[0]) {   
            case 'Tag' :
          case 'ListRow' :	
            // Set topic ID then cue a re-build through re-initialisation
                this.helprecordid=parms[1];
                this.initialiseDetails();
            break;
          }
    
      
      } catch (e){
        console.log('IHDetail - drop error: ' + e);
      }
	    
	  }
    openVideo()
    {
      window.open(this.CurrentRecord.iahelp__VideoURL__c);
    }
    openImage(){
      window.open(this.CurrentRecord.iahelp__ImageURL__c);
    }

    // Spins up any sub component requested as part of our LUX template
	initialiseTemplateComponents() {
		var obj = this.CurrentRecord;
    var cmpdef='';
		var cmpgen = this.template.querySelector('[data-id="CGIHDetail"]');
    console.log(' initialiseTemplateComponents '+obj.iahelp__LightningTemplate__r);
		try {
			if (obj + '' != 'undefined') {			
				if (obj.iahelp__LightningTemplate__r + '' != 'undefined') {
					// Take the component definition in the template
					cmpdef = obj.iahelp__LightningTemplate__r.iahelp__PageURL__c+'|HelpRecordId¬'+this.CurrentRecord.Id;

          console.log(' Before deTokenize '+cmpdef);

          // 'De-tokenize'
					cmpdef = this.deTokenize(cmpdef);

          console.log(' After deTokenize '+cmpdef);
					
          // Hard wire a component ID, unless one is already present
          // Put unique Id number at the end of Component Id (We are not interested in Aura unique Id here)
					if (cmpdef.indexOf('ComponentId') == -1) {
            console.log(' Unique ident '+this.uniqueident);
						//cmpdef += '|ComponentId~' + this.componentid + '_SpecialComp'+this.uniqueident;
							cmpdef += '|ComponentId~' + this.componentid + '_SpecialComp|SuppressPoweredBy~true'+this.uniqueident;
					}

				}
        else{
          cmpdef ='';
        }			
			}
      this.cmpGeneratorVal=cmpdef;
      if(cmpgen+''!='undefined' && cmpgen!=null){
        cmpgen.componentdef=cmpdef;
        cmpgen.initialiseCmp();
      }	
				
		} catch (e) {
			console.log('IHDetail - error creating sub components: ' + e);
		}
	
	}

  manipulateCustomFields(){
    if(this.CustomFields.length > 0){
        
      var CFWrapper=[];
      for(var i=0; i<this.CustomFields.length ; i++){	
        var F=this.CustomFields[i];	
        var c;
        c={"CF":F, "typeUnclear":F.CustomField.type != 'boolean' && F.CustomField.type != 'currency' 
                          && F.CustomField.type != 'date' && F.CustomField.type != 'datetime' 
                          && F.CustomField.type != 'email' && F.CustomField.type != 'url' 
                          && F.CustomField.type != 'integer' && F.CustomField.type != 'double' 
                          && F.CustomField.type != 'textarea',
                    "boolean":F.CustomField.type=='boolean',
                    "currency":F.CustomField.type=='currency',
                    "date":F.CustomField.type=='date',
                    "datetime":F.CustomField.type=='datetime',
                    "email":F.CustomField.type=='email',
                    "number":F.CustomField.type=='integer' || F.CustomField.type=='double',
                    "textarea":F.CustomField.type=='textarea',
                    "url":F.CustomField.type=='url' };
        CFWrapper.push(c);
      }
      this.modifiedCustomFields=CFWrapper;
      }
  }

  // Attempt to locate a requested current record (by help topic ID) in this component's cache:
	// C.f. pass throughs / component tools processed where record cache is set.
	currentRecordIsCached (theRecord) {
	
		var HEs = this.helpedelements;
    console.log(' helpedelements '+this.helpedelements);
		var HTs = this.helptopics;
    console.log(' helptopics '+this.helptopics);
		var i;
		var recordLocated = false;
		var HVS;
		var act;
		
		// Cache may consist of helped element records (pointing to topics) or
		// actual help topics, depending on the component set as this one's cache source
		// and its method of retrieving context records: look through each collection in turn...
		
		if (HEs + '' != 'undefined') {
			for (i=0; i < HEs.length; i++) {
				try{
			    	if (HEs[i].iahelp__HelpTopic__r.Id == theRecord) {

						this.ishelptopic = true;
						this.isnontopic = false;
			    	
			    		this.title = HEs[i].iahelp__HelpTopic__r.Name;
			    		this.helprecordid = HEs[i].iahelp__HelpTopic__r.Id;
		    			this.SelectedVoteSet = HEs[i].iahelp__HelpTopic__r.iahelp__HelpVoteSet__c;
			    		this.CurrentRecord = HEs[i].iahelp__HelpTopic__r;
              this.CurrentRecord = JSON.parse(JSON.stringify(this.CurrentRecord));
			    		recordLocated = true;
			    		break;
			    	}
				} catch (e) {}
			}
		} 
		
		if (HTs + '' != 'undefined') {
			for (i=0; i < HTs.length; i++) {
				try{
			    	if (HTs[i].Id == theRecord) {

						this.ishelptopic = true;
						this.isnontopic = false;

			    		this.title = HTs[i].Name;
			    		this.helprecordid = HTs[i].Id;
		    			this.SelectedVoteSet = HTs[i].iahelp__HelpVoteSet__c;
			    		this.CurrentRecord = HTs[i];
              this.CurrentRecord = JSON.parse(JSON.stringify(this.CurrentRecord));
			    		recordLocated = true;
			    		break;
			    	}
				} catch (e) {}
			}
		}

    this.ihcontext = this.helprecordid;
    // If we're presenting (largely) cached data, there are still some values we need to obtain from the server
		if (recordLocated == true) {
      this.KeywordParsedDescription=this.CurrentRecord.iahelp__Description__c;
   //   this.getAdditionalDetails();
			// Get vote options plus user's last vote, if any, for the selected vote set
			this.lookupRelatedObjects(this.SelectedVoteSet);
			HVS = this.SelectedVoteSet;
	
			// Reset options for the re-located vote set: these will not be the same and
			// need to be obtained via a server call
	/*		this.VoteOptions = null;
				
			if (HVS + '' != 'undefined' && HVS + '' != 'null') {

				getVoteInfoForTopic({
            HTID : this.helprecordid,
					  HVSID : HVS.Id }).then(result => {                      	    								                     
            if(result != '') {	
                try {                   
                    var obj = JSON.parse(result);
                    var i;
                    var hasAttributes;
                    var VOs = [];
          
                      if (obj + '' != 'undefined') {
          
                        if ('' + obj.length != 'undefined') {
          
                          for (i = 0; i<obj.length; i++) {
                              
                              // Process tools: these are true sObjects, so will have attributes including type          
                              try {
                                  var s = obj[i].attributes.type;
                                  hasAttributes = true;
                              } catch (e) {
                                  hasAttributes = false;
                              }
              
                              if (hasAttributes === true) {
                              // This will be a help vote option
                              VOs.push(obj[i]);
                              
                            } else {
                              // This is the user's vote
                              this.thevotecopy = obj[i].Value;
                            }
                          }                       
                          this.VoteOptions = VOs;
                        }
                      }
                    
                } catch (e) {}
            }
			  });

			}*/
		}
    
    
    // Advise caller or whether or not cached record was located
		return recordLocated;
	}

  getAdditionalDetails(){
    if(this.mouseoverdone!=true && this.cachedrecordsource!=''){

        this.mouseoverdone=true;
        getAdditionalInfoForTopic({HTID:this.CurrentRecord.Id}).then(result => {
          console.log('In getAdditionalInfoForTopic');         
          var obj;
          try{
            console.log(JSON.parse(result));
            obj = JSON.parse(result);
            var hasAttributes=false;
            var VOs=[];
            var customFs = [];
            var passThroughs = [];
            for (var i = 0; i<obj.length; i++) {
                  
            // Process tools: these are true sObjects, so will have attributes including type          
            try {
                var s = obj[i].attributes.type;
                hasAttributes = true;
            } catch (e) {
                hasAttributes = false;
            }

            if (hasAttributes === true) {
                if (obj[i].attributes.type === 'iahelp__HelpVoteOption__c') {
                  // These represent vote options applicable to an individual Help Topic:
                  VOs.push(obj[i]);
                }
            }
            else{
                if (obj[i].CustomField + '' != 'undefined') {
                  // Help Topic custom field information
                  customFs.push(obj[i]);

                }
                else if (obj[i].ValueSet == 'VoteInfo') {
                  // Details of last vote that was cast
                  this.thevote=obj[i].Value;

              }
              else if (obj[i].ValueSet == 'ParsedContent') {
                // Derivatives of record values (e.g., key-word enabled Help Topic descriptions).
                // We have no direct need of these, but push them into our "pass through" data collection, 
                // for inheritors who may...
                passThroughs.push(obj[i]);
            }
            }
          }
          console.log('After get Additional');
          this.PassThroughData=passThroughs;
          this.KeywordParsedDescription = this.PassThroughData[0].Value;
          this.CustomFields=customFs;
          this.manipulateCustomFields();
          this.VoteOptions=VOs;
          this.thevotecopy=this.thevote;
          var dlg = this.template.querySelector('[data-id="vote"]');
          try{
            dlg.localvote=this.thevotecopy;
            dlg.voteoptions=this.VoteOptions;
            dlg.initialise();
          }catch(e){
            console.log(' Not able to locate vote component ! '+e)
          }
          console.log(this.getTheVote);
        }catch (e) {
          // Fail silently - but do log the error
          console.log('Error processing additional topic info: ' + e);
        }
      })
    }
  }

  // Re-obtain / refresh clickable tools, for cases where navigation may call for this
	refreshClickables (theRecord, ToolContext, ActionCode) {
		var userPermLevel = 0;
			
        if (this.isUser == true) userPermLevel += 1; 
        if (this.isAnalyst == true) userPermLevel += 2; 
        if (this.isauthor == true) userPermLevel += 4; 
        if (this.isAdministrator == true) userPermLevel += 8;                        

		getClickablesJSON({
					 ToolContext : ToolContext,
					 ActionCode : ActionCode,
					 IHContext : theRecord,
					 userPermLevel : userPermLevel}).then(result => {                      	    								        
            
						try {
							// Need to process globals to get internationalisations - however this will trash global settings:
							// So: obtain these prior and re-set after call
							var GS = this.globalsettings;
							this.processTools(result);
							this.globalsettings = GS;
						
						} catch (e) {
						}

        });                
	
	}

  autoformCall(){
    var c = this.template.querySelector('[data-id="autoformContainer"]');
    if(c!=null){
      c.classList.add('slds-hide');
    }
    if(this.isnontopic==true){
      var H = this.template.querySelector('[data-id="DetailAF"]');
      H.saveaction="Report only";
      H.recordid=this.helprecordid;
      H.recordId=this.helprecordid;
      H.height=this.height;
      H.mode='false';
      H.SuppressHeader=true;
      H.SuppressFooter=true;
      H.objname=this.sobjectname;
      H.LayoutName='';
      H.componentholder='ihdetail';
      H.toolcontex=this.toolcontextaf;
      H.SuppressModeTools = true;
      H.reInitialise();
      if(c!=null){
        c.classList.remove('slds-hide');
      }    
    }
    else{
      if(c!=null){
        c.classList.add('slds-hide');
      }
    }

  }

  // Parse (a limited number of known) tokens in strings into the values they represent
	deTokenize(val) {
		
		var retVal = val;
		
		try {
			// {!Tokens} come from member data - general
			retVal = retVal.split('{!recordId}').join(this.recordId);
			retVal = retVal.split('{!HelpRecordId}').join(this.HelpRecordId);
			

			// {!Tokens} come from member data - special current record handling
			if (retVal.indexOf('{!CurrentRecord.') != -1) {
			
				try {
					
					var i = 0;
					var rec = this.CurrentRecord;
					var fld;
					var fldName;
					var rest;	
			
					// This operation requires there to be a current record
					if (rec + '' != 'undefined') {
					
						retVal = retVal.split('{!CurrentRec');
						while (i < retVal.length) {
						
							// Process each split clause:
							if (retVal[i].startsWith('ord.')) {
								// If current clause start with the remainder of a current record token, obtain the field
								fldName = retVal[i].substring(4, retVal[i].indexOf('}'));
								rest = retVal[i].substring(retVal[i].indexOf('}') + 1);
			
								fld = rec[fldName];
								retVal[i] = fld + rest;
								
							} else {
								// If clause does not start with remainder, leave as is
							}
							
							i+=1;
						}
						retVal = retVal.join('');
					}
					
				} catch (e) {
					retVal = 'Card Detokenizer Error (position ' + i + ' of ' + retVal.length + '): ' + e;
				}
			
			}			


			// Explicitly specify parent's record ID only
			if (retVal.indexOf('{!Parent.') != -1) {
				try {
					var P = this.Parent;
			
					// This operation requires there to be a current record
					if (P + '' != 'undefined' && P + '' != '') {
						retVal = retVal.split('{!Parent.recordId}').join(P.recordId);
						retVal = retVal.split('{!Parent.recordIdOrOwn}').join(P.recordId);
						
					} else {
						// If there is no parent, failover to data from current object, if requested
						retVal = retVal.split('{!Parent.recordId}').join('');
						retVal = retVal.split('{!Parent.recordIdOrOwn}').join(this.recordId);
						
					}
					
				} catch (e) {
					retVal = 'Card Detokenizer Error (Parent token): ' + e;
				}
			}			

			
			// {Tokens} (NO exclamation mark) are global / non-member data
			retVal = retVal.split('{CurrentRoot}').join(location.host);
			
		} catch (e) {		
			retVal = 'Error (Detokenize): ' + e;
		}
		
		return retVal;
	}

  doLightBox(evt){
    console.log('doLightBox---------------------------11');
    var U;
    var ttl = this.CurrentRecord.Name;
		var M = evt.currentTarget.getAttribute("data-media-mode");
		var src;

    if (M == 'Image') {
		
      U = this.CurrentRecord.iahelp__ImageURL__c;

			src = '/apex/iahelp__IHLUXOutHost?NSApp=iahelp&App=appIH&NSComp=iahelp&Comp=IHImageViewer';
			src += '&Parms=Height~-1^SuppressHeader~true^MediaMode~Image^MediaWidth~100^ImageURL~' + U;

			if (this.CurrentRecord.iahelp__ImageTitle__c + '' != 'null') {
				ttl += ': ' + this.CurrentRecord.iahelp__ImageTitle__c;
			}

		} else {
       U = this.CurrentRecord.iahelp__VideoURL__c;
			 src = U;

			 if (this.CurrentRecord.iahelp__VideoTitle__c + '' != 'null') {
				ttl += ': ' + this.CurrentRecord.iahelp__VideoTitle__c;
			 }
		}

    window.open(src, 'IHImagePopout', 'menubar=0, resizable=1, status=0, toolbar=0, titlebar=0, location=0');

  }

}