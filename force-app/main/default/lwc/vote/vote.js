import { LightningElement,track,wire,api } from 'lwc';
import IHCard from 'c/ihcard1';
import logLUXInteraction from '@salesforce/apex/iahelp.ControllerLUXOps.logLUXInteraction';

export default class Vote extends LightningElement {
    @api selectedvoteset;
    @api templatesc=[];
    @api voteoptions=[];
    @api currentrecord=''
    @api helpcontext='';
	@api localvote;
	@api tipvote;
	@api voteWrapperList=[];
    @api get VSQuestionText() { return (this.SelectedVoteSet + '' != '' && this.SelectedVoteSet+''!='undefined' ? this.SelectedVoteSet.iahelp__QuestionText__c : '')};
    @api get selectedVote(){ return (this.templatesc+''!='undefined' && this.templatesc!=null && this.selectedvoteset!=null && this.selectedvoteset.Id != null) };
    @api get selectedVoteImg(){ return (this.selectedvoteset + '' != '' && this.selectedvoteset.iahelp__ImageClass__c + '' != '' ? '' : 'slds-hide') };
    @api get voteSetText() { return (this.selectedvoteset + '' != '' ? this.selectedvoteset.iahelp__QuestionText__c : '')};
    @api get questionText() { return (this.selectedvoteset+''!='' ? this.selectedvoteset.iahelp__QuestionText__c : '')}
    
    connectedCallback()
	{
		this.initialise();
	}
	@api initialise(){
		console.log('In vote- localvote = '+this.localvote);
		console.log(this.templatesc);
		console.log(this.selectedvoteset);
		console.log(this.helpcontext);
		var voteWrapper=[];
		for(var i=0; i<this.voteoptions.length ; i++){		
			var c;
			if(this.localvote==this.voteoptions[i].Id){

				c={"voption":this.voteoptions[i],"styleClass":"slds-badge slds-badge_lightest slds-theme_inverse","tipvote":this.tipvote+' - '+this.voteoptions[i].Name};
			}
			else{

				c={"voption":this.voteoptions[i],"styleClass":"slds-badge slds-badge_lightest","tipvote":this.tipvote+' - '+this.voteoptions[i].Name};
			}
			voteWrapper.push(c);
			console.log(c);
		}
		this.voteWrapperList=voteWrapper;
		console.log(this.voteWrapperList);
	} 
	// Log a vote-type interaction
     castVote(evt) {
        console.log(' In castvote '+evt.currentTarget);
    	var theId = evt.currentTarget.getAttribute("data-id");
		console.log(' theId '+theId);

    	var OptId = theId;

    	var OptLabel = evt.currentTarget.getAttribute("data-optionlabel");
    	var HTID = this.currentrecord.Id;
    	var Cxt = this.helpcontext;
    	console.log(' OptId '+OptId+' OptLabel '+OptLabel+' HTID '+HTID+' Cxt '+Cxt);
    	// Context needs to be set to:
    	// "Context" (ID of tree if we're being viewed in conjunction with one) ^ Help Topic being voted on ^ Vote (option ID) being cast
         logLUXInteraction({iTyp : "8", 
                Description : OptLabel,
                IHContext : Cxt + "^" + HTID + "^" + OptId
				}).then(result => {
					console.log(' result '+result);
	        if (result.length > 0) {
				console.log(result);
	        //	this.diags=this.Internationalise(result);
	        	
	        	// Upon success, mark selected vote badge
        		var badges = this.template.querySelectorAll('.slds-badge');
        		var BadgeList = this.template.querySelectorAll('[data-name="badge_"]');
				console.log(' badges '+badges.length+' BadgeList '+BadgeList.length);
				for (var i=0; i < BadgeList.length; i++) {
					console.log(BadgeList[i].getAttribute("data-id"));
					if(BadgeList[i].getAttribute("data-id")==OptId){
						var selectedBadge=BadgeList[i];
						break;
					}
				}
				console.log(' selectedBadge '+selectedBadge);
				for (var i=0; i < badges.length; i++) {
					badges[i].classList.remove('slds-theme--inverse');
				}
				selectedBadge.classList.add('slds-theme--inverse');
	        	
	        } else {
	        	this.diags="Err!";
	        }
        
        }).catch(error=>{
			console.log(error);        
		}); 
    	
    	
    }
}