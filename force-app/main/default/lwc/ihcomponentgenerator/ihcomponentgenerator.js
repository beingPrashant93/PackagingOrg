import { LightningElement,api,wire } from 'lwc';
import { publish,subscribe,APPLICATION_SCOPE,unsubscribe,createMessageContext,releaseMessageContext,MessageContext } from 'lightning/messageService';
import messageChannel from "@salesforce/messageChannel/MyMessageChannel__c";
import { onError , subscribe as empApiSubscribe, setDebugFlag, isEmpEnabled }  from 'lightning/empApi';
import uId from '@salesforce/user/Id';

export default class Ihcomponentgenerator extends LightningElement {

    /*
================================================
Events and Handlers
================================================
*/  

	
/* 
================================================
Member data

ToDo: genericise getParmsMap to allow any event / property binding
================================================
*/
    @wire(MessageContext)
    messageContext;
    subscription=null;
    @api id ="";
    @api isinitialised = false;
    @api isauthor=false;
    @api FrameSource='';
    @api iframeheight=0;
    @api spunComponentId;
    @api sourceCmp;
    @api currentpagererordid;
		@api newheight1;
    @api get iframestyle(){
         return (this.iframeheight==0?'height:100%;width:100%':'height:'+this.iframeheight+'px;width:100%')
    };
		// @api get iframestyle(){
		// return ('height:'+this.newheight1+'px;width:100%')
		// };
    @api get componentdef(){
        return this._componentdef;
    }
    set componentdef(value){
        let tmp=this._componentdef;
     //   console.log(' this._componentdef '+this._componentdef+' value '+value)
        if(this._componentdef== value){
            this._componentdef = value;
        }
        else{
            this._componentdef = value;
            this.ComponentDefChange();
        }
        
    }
	@api thecomponent ="";
	@api parent ="";
    @api userid;
    channelName = '/event/iahelp__LWC_Aura_Interaction_Event__e'; //PFEvent channel name
    connectedCallback(){  
        this.userid=uId; 
        console.log('userid: ', this.userid);    
        this.initialiseCmp();
        this.handleSubscribe();	
         //-------------Platform Event----------------------------------------------

          // Callback invoked whenever a new event message is received
          var ref=this;
          var messageCallback = function(response) {
            var x = JSON.parse(response.data.payload.iahelp__Parameters__c);
            console.log('New message received: ', x);
							if(x.Parameters > 650){
									x.Parameters = x.Parameters+30;
							}else{
									x.Parameters = x.Parameters+10;
							}
						
            console.log('user id: '+response.data.payload.CreatedById);
            //For setting component generator Iframe height
            if(x.ActionCode=='RenderedHeight'){
                if(ref.userid+''==response.data.payload.CreatedById+''){
                    if(ref.sourceCmp==x.SourceComponent+''){
                        if(x.Parameters!=0){
														
                            ref.iframeheight = x.Parameters;
													
                        }
                    }
                }
            }
            // Response contains the payload of the new message received
        }

        // Invoke subscribe method of empApi. Pass reference to messageCallback
        empApiSubscribe(this.channelName, -1, messageCallback).then(response => {
            // Response contains the subscription information on subscribe call
            console.log('Subscription request sent to: ', JSON.stringify(response.channel));
          // this.subscription = response;
        })

    }
    renderedCallback(){
        console.log(' Rendered Callback called! ');
        if(this.componentdef!='' && this.componentdef!=null && this.componentdef+''!='undefined' && 
            this.FrameSource+''!='undefined' && this.FrameSource!=null && this.FrameSource!=''){
            var frm=this.template.querySelector('[data-id=ifrm]');
            if(frm+''!='undefined' && frm+''!='null'){
                frm.classList.remove('slds-hide');
              //  frm.src=this.FrameSource;
            }
        }
        
    }

    // If definition is blanked, destroy our component
	ComponentDefChange (evt) {
        console.log(' ComponentDef Change ! ');

        var frm=this.template.querySelector('[data-id=ifrm]');
        if (this.componentdef == '' || this.componentdef == null || this.componentdef=='undefined') {
        	console.log(' component generator is blank')
            if(frm+''!='undefined' && frm+''!='null'){
               frm.classList.add('slds-hide');            
            }
        }
        else{
        /*    if(this.FrameSource+''!='undefined' && this.FrameSource!=null && this.FrameSource!=''){
                frm.classList.remove('slds-hide');
                frm.src=this.FrameSource;
            }*/
        }
    }

    // Rebuild the component to its current definition
    @api
	initialiseCmp() {
        console.log(' calling initialiseCmp of Component generator '+this.componentdef)
        // Obtain component definition from our member data
        var ComponentDef = this.componentdef;
        // If we have no config data, do nothing here
        if (ComponentDef == '' || ComponentDef == null || ComponentDef=='undefined') {
        }
        else{
            var cmpdef=this.componentdef;
            if(this.componentdef.indexOf(':')!='-1'){
                var cmpname=cmpdef.substring(cmpdef.indexOf(':')+1,cmpdef.indexOf('~'));
                var parm=cmpdef.substring(cmpdef.indexOf('~')+1,cmpdef.length);
                parm=parm.replaceAll('¬','~');
                parm=parm.replaceAll('|','^');
                if(parm.includes(',^HelpRecordId~')){
                    parm=parm.replaceAll(',^HelpRecordId~','');
                }
                var url='/apex/iahelp__IHLUXOutHost?NSApp=iahelp&App=appIH&NSComp=iahelp&Comp='+cmpname+'&Parms='+parm;
                url=url.replace('%','');
                this.FrameSource=url;
                console.log(' this.FrameSource '+this.FrameSource);
                var frm=this.template.querySelector('[data-id=ifrm]');
                if(frm+''!='undefined' && frm+''!='null'){
                    frm.src = this.FrameSource;
                   frm.classList.remove('slds-hide');
                }else{
								// if(this.FrameSource+''!='undefined' || frm+''!='null'){
                    this.currentpagererordid = this.FrameSource;
               // }
										}

                // To get ComponentId from Component Definition
                var tmp=parm.indexOf('ComponentId');
                var st=parm.substring(tmp,parm.length);
                var str=st.split('^');
                str=str[0];
                str=str.split('~');
                str=str[1];
                this.sourceCmp=str;
            }
            else{
                var url=this.componentdef.substring(this.componentdef.indexOf('Height'),this.componentdef.length);
                url=url.replace('%','');
                console.log('url '+url);
                this.FrameSource='/apex/iahelp__IHLUXOutHost?NSApp=iahelp&App=appIH&NSComp=iahelp&Comp=IHUtility1&Parms='+url;
                var frm=this.template.querySelector('[data-id=ifrm]');
                if(frm+''!='undefined' && frm+''!='null'){
                    frm.classList.remove('slds-hide');
                }
                if(this.isauthor){
                    
                }
            }

          //  var tmp=cmpdef.substring(cmpdef.indexOf('~')+1,cmpdef.length);
        }
    }

    handleSubscribe() {
        console.log('In handle subscribe');
        if (this.subscription) {
            return;
        }
        this.subscription = subscribe(this.messageContext, messageChannel, (message) => {
                this.handleEvent(message);       
         //   }
            
            
            
        },{scope:APPLICATION_SCOPE});
  
      }
    // Respond to (e.g., data manipulation) events passed through from our super component
    handleEvent(message){
        console.log(' handlePassThrough '+message.ActionCode);
      }
}