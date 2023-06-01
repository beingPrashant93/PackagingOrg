import { LightningElement, api, track, wire } from 'lwc';
import { publish,subscribe,APPLICATION_SCOPE,unsubscribe,createMessageContext,releaseMessageContext,MessageContext } from 'lightning/messageService';
import myResource from '@salesforce/resourceUrl/iahelp__IHResources';
import { loadStyle } from 'lightning/platformResourceLoader';
import messageChannel from "@salesforce/messageChannel/MyMessageChannel__c";

export default class Ihdialogue extends LightningElement {
@wire(MessageContext)
messageContext;
subscription=null;
@api   ComponentId;
@api   Title;
@api   Diags="- - -" 
@api   FrameType="VF"
@api   FrameSource;
@api   FrameAttributes;
@api   FrameHeight = "150";
@api   AllowScroll = "false";
@api   LargeMode ="false";
@api   ShowFooter = "true";
@api   ShowHeader = "true";
@api   FooterTools = [];
@api   TipButtonClose;
@api   isInitialised;
@api   theLUXComp;
//for alert	
@api   styled;	
@api   toolcontextd;	
@api   imaged;	
@api   messaged;	
@api   titled;	
@api   heightd;

@api get parentDivClass(){
    return (this.LargeMode+'' == 'true' ? 'slds-modal slds-fade-in-open slds-modal_large' : 'slds-modal slds-fade-in-open');
}
@api get showHeaderClass(){
    return this.ShowHeader+'' == 'true' ? 'slds-modal__header' : 'slds-hide';
}
@api get IHDlgPendingStyle(){
    return (this.FrameHeight == -1 ? 'width: 100%; height: 100%;' : 'width: 100%; height: ' + this.FrameHeight + 'px;');
}
@api get frameTypeClass(){
    return (this.FrameType == 'VF');
}
@api get LUXClass(){
    return (this.FrameType != 'VF');
}
@api get alertClass(){	
        	
    return (this.FrameType == 'Alert');	
}
@api get iframeStyle(){
    return (this.FrameHeight == -1 ? 'width: 100%; height: CALC(100% - 10px); padding: 0 10px;' : 'width: 100%; height: ' + (this.FrameHeight - 10) + 'px; padding: 0 10px;');
}
@api scrollingClass(){
    return (this.AllowScroll+'' == 'true' ? 'yes' : 'no');
}
@api get showFooterClass(){
    return (this.ShowFooter+'' == 'true' ? 'slds-modal__footer' : 'slds-hide');
}

    connectedCallback(){
        
        if(this.FrameSource+''!='undefined'){
		    window.open(this.FrameSource);
        }
        Promise.all([
            loadStyle(this, myResource + '/lib/FontAwesome463/css/font-awesome.min.css')
        ])
        this.handleSubscribe();
    }

    // Force re-building of component when desired 
    @api
	reInitialise() {
        console.log(' Welcome to IHDialogue '+this.Title);
        console.log(' FrameSource...'+this.FrameSource);
        console.log(' FrameAttributes...');
        console.log(this.FrameAttributes);
		this.initialiseLUXDialogue();
	}

    
    // Generate a request to be closed by our owner using the pass through event
    requestClose() {
        
        var dlgCmp = this.theLUXComp;

        // Re-show busy cues as we close...
    	this.FrameSource = "";
        this.showDlgSpinner();

		var passThrough = {ActionCode: "DialogueRequestClose",Parameters:'ModalContainer',SourceComponent:this.ComponentId};
        publish(this.messageContext, messageChannel, passThrough);

        // "Re-set" component by destroying any dynamically added component
        if (dlgCmp != null) {
        	this.theLUXComp = null;
        }
    
    }
    
    
    // Show / hide spinner as required when showing callouts
    hideDlgSpinnerController() {
    	if (this.FrameSource != "") {
	    	this.hideDlgSpinner();
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
		var act = message.ActionCode;
        var parms = message.Parameters;
        var src = message.SourceComponent;
        console.log('In IHDialogue Component '+act+' '+parms+' '+src);
	}

    // Waiting cues for dialogue
    hideDlgSpinner() {
        if(this.FrameType != 'Alert'){
            var tBusy = this.template.querySelector('[data-id="IHDlgPending"]');
            var tmp=this.getContentFrame();
            var frm = this.template.querySelector('[data-id='+tmp+']');
            
            tBusy.classList.remove('IHTipPending');
            frm.classList.remove('slds-hide');

        }else{
            console.log("hideDlgSpinner");
            var tBusy = this.template.querySelector('[data-id="IHDlgPending"]');
            console.log('tBusy',tBusy);
            var tmp=this.getContentFrame();
        
            tBusy.classList.remove('IHTipPending');

        }
    }

    showDlgSpinner() {
        var tBusy = this.template.querySelector('[data-id="IHDlgPending"]');
		var tmp=this.getContentFrame();
        var frm = this.template.querySelector('[data-id='+tmp+']');
		
        tBusy.classList.add('IHTipPending');
        frm.classList.add('slds-hide');
    }
    
    
    // Identify the component element to show (iframe or sub-component div) based on component settings
    getContentFrame() {	
      	
        if (this.FrameType == 'VF') {	
            return 'dfrm';	
       } else if(this.FrameType == 'Alert'){	
            return 'ihalertcompcontainer';	
        }else{	
            return 'ddiv';	
        }	
    }
    

    // For LUX dialogues, re-build the desired component, based on attribute member data supplied
    initialiseLUXDialogue() {
    
        this.hideDlgSpinner();

        console.log('Initialise LUX Dialogue: LUX component requested: ' + this.FrameSource);

        if (this.FrameType === 'LUX') {                
            console.log(' For Frame type = LUX , this is not functional!');
            var c = this.template.querySelector('[data-id="ihcomp"]');var c = this.template.querySelector('[data-id="ihcomp"]');
            c.componentdef=this.FrameSource+'~'+this.FrameAttributes;
            var compgenContainer = this.template.querySelector('[data-id="ddiv"]');
            compgenContainer.classList.remove('slds-hide');
            c.initialiseCmp();
            var evtPassThrough = {SourceComponent:this.ComponentId,ActionCode:'ComponentToolsProcessed',Parameters: ''};
            publish(this.messageContext, messageChannel, evtPassThrough);

        }else {

            if(this.FrameType === 'Alert'){
                
                var amap = this.FrameAttributes;

                let getmessage = amap.search(/Message/i);
                let message = amap.slice(getmessage+8,-1);
                
                this.heightd = -1;
                this.titled = "";
                this.messaged = message;
                this.imaged = "/resource/iahelp__IHSupportMaterials/img/StockImages/013B.svg";
                this.toolcontextd = "AlertOKOnly";
                this.styled = "Two Column";
                
                this.ShowHeader = "false";

            }


        }                 
    
    }
    
}