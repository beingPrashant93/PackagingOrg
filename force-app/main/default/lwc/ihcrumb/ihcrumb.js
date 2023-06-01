import { LightningElement,track,api,wire } from 'lwc';
import { publish,subscribe,APPLICATION_SCOPE,unsubscribe,createMessageContext,releaseMessageContext,MessageContext } from 'lightning/messageService';
import messageChannel from '@salesforce/messageChannel/MyMessageChannel__c';
import getCrumbs from '@salesforce/apex/iahelp.ControllerLUXOps.getCrumbs';

export default class Ihcrumb extends LightningElement {
    @wire(MessageContext)
    messageContext;
    subscription=null;

    @api componentid='';
    @api listensto='';
    @api helprecordid;
    @api rootnode;
    @api crumbcolour='ffffff';
    @api diags;
    @api crumbtrails;

    @api get style1(){
        return ('color: #' + this.crumbcolour + ';');
    }

    @api get rootn(){
        return (this.rootnode == '' || this.rootnode == null || Trail.Crumbs[0].Id == this.rootnode);
    }

    connectedCallback() {

        this.initialiseCrumbs();
        this.handleSubscribe(); 
    }

    // Prepare crumb trail on load
   @api initialiseCrumbs(){
        console.log('From IHCrumb LWC');
        console.log('IHCrumb initialising crumbs for topic LWC1' + this.helprecordid);
        getCrumbs({HelpRecordId : this.helprecordid})
        .then(result=>{
            var obj;
        
                if (result!=null){
                    try {
                    obj = JSON.parse(result);
                    console.log('result----'+result);
                } catch (e) {
                this.diags="IHCrumb - initialiseCrumbs - Error parsing the following JSON return value: (" + e + ")" + result;
                return;
            } 

            this.crumbtrails=obj;
            console.log('this.crumbtrails'+this.crumbtrails);

            } else{
                this.diags="IHCrumb - initialiseCrumbs - Error";
            }
        })  
        console.log('IHCrumb initialising crumbs for topic LWC11 ' + this.helprecordid);
    }


    handleSubscribe() {
        if (this.subscription) {
            return;
        }
        this.subscription = subscribe(this.messageContext, messageChannel, (message) => {
                this.selectRecord(message);       
            
        },{scope:APPLICATION_SCOPE});
	}
    // Raise a record selected event when a crumb is clicked 
    crumbClick(evt){
        console.log('crumbClick--');
        var provider = '';
        var theTrails = this.crumbtrails; 
        var theTrail = evt.currentTarget.getAttribute("data-trailindex");
        var theRoot = theTrails[theTrail].Crumbs[0].Id;
        var theCrumb = evt.target.id;

        var endIndex = theCrumb.lastIndexOf("-");
        if (endIndex != -1)  
        {
            theCrumb = theCrumb.substring(0, endIndex);
        }
        console.log('theCrumb--',theCrumb); 

       
        // Issue a message advising tree of root
        var evtPassThrough = {SourceComponent:this.componentid,ActionCode:"SelectTree",Parameters:theRoot + '^' + provider};
        publish(this.messageContext, messageChannel, evtPassThrough);

        // Tree will ignore root message if already at that root. 
    	// If it is not, root will change, firing a topic selected event on arrival
    	// which we should ignore and override with the desired topic.
    	
    	// Now change the selected item    	
        var selectTopic={RecordId:theCrumb,SourceComponent:this.componentid};
        publish(this.messageContext, messageChannel, selectTopic);

         // We should also re-build ourselves: if we were on a crumb that was reachable via only 1 trail, but
        // then clicked back to another crumb within it, that crumb may have more than 1 parent, which we must show...
        this.helprecordid=theCrumb;
        this.initialiseCrumbs();
    }

    //Respond to the "select" event raised by trees (if we're listening to the source component)
  selectRecord(message){

        var theRecord = message.RecordId;
        var theSource = message.SourceComponent;
        var listensTo = this.listensto;
    
         // Only respond to events that do not emanate from ourselves / do
        // emanate from the  "desired" master tree we wish to tie to
        if (listensTo != '' && listensTo + '' != 'null' && theSource == listensTo) {

            this.helprecordid=theRecord;
            this.initialiseCrumbs();
            
        }
        
    }

}