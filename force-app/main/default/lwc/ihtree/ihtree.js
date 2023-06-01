import { LightningElement,api,wire,track } from 'lwc';
import IHCard from 'c/ihcard1';
import getTools from '@salesforce/apex/iahelp.ControllerLUXOps.getTools';
import getTreeStats from '@salesforce/apex/iahelp.ControllerLUXOps.getTreeStats';
import getTreeVotes from '@salesforce/apex/iahelp.ControllerLUXOps.getTreeVotes';
import dropNewTopic from '@salesforce/apex/iahelp.ControllerLUXOps.dropNewTopic';
import createRelationship from '@salesforce/apex/iahelp.ControllerLUXOps.createRelationship'; 
import deleteRelationship from '@salesforce/apex/iahelp.ControllerLUXOps.deleteRelationship'; 
import reparentTreeNode from '@salesforce/apex/iahelp.ControllerLUXOps.reparentTreeNode';
import moveReadingListEntry from '@salesforce/apex/iahelp.ControllerLUXOps.moveReadingListEntry';
import reOrderTreeNodes from '@salesforce/apex/iahelp.ControllerLUXOps.reOrderTreeNodes';
import addReadingListEntry from '@salesforce/apex/iahelp.ControllerLUXOps.addReadingListEntry';
import deleteReadingListEntry from '@salesforce/apex/iahelp.ControllerLUXOps.deleteReadingListEntry';
import cloneHelpedElement from '@salesforce/apex/iahelp.ControllerLUXOps.cloneHelpedElement';
import deleteHelpedElement from '@salesforce/apex/iahelp.ControllerLUXOps.deleteHelpedElement';
import addHelpFilter from '@salesforce/apex/iahelp.ControllerLUXOps.addHelpFilter';
import deleteHelpFilter from '@salesforce/apex/iahelp.ControllerLUXOps.deleteHelpFilter';
import addFilterCriterion from '@salesforce/apex/iahelp.ControllerLUXOps.addFilterCriterion';
import deleteFilterCriterion from '@salesforce/apex/iahelp.ControllerLUXOps.deleteFilterCriterion';
import getRootTopicForContext from '@salesforce/apex/iahelp.ControllerLUXOps.getRootTopicForContext';
import { publish,subscribe,APPLICATION_SCOPE,unsubscribe,createMessageContext,releaseMessageContext,MessageContext } from 'lightning/messageService';
import messageChannel from "@salesforce/messageChannel/MyMessageChannel__c";
import { onError , subscribe as empApiSubscribe, setDebugFlag, isEmpEnabled }  from 'lightning/empApi';
import Id from '@salesforce/user/Id';
import logLUXInteraction from '@salesforce/apex/iahelp.ControllerLUXOps.logLUXInteraction';
export default class Ihtree extends IHCard {
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
//	***********************************************************************
@api recId = '';
@api treeReff = this;
@api get helprecordid(){
	return this._helprecordid;
}
set helprecordid(value){
	this._helprecordid = value;
	//console.log(' Set helprecordid '+this._helprecordid);
	this.HelpRecordChange();
}	
	@api get nodatamsgclass(){
		return (this.Nodes.length == 0 ? 'NoDataMessage' : 'slds-hide');
	}
	@api treelistingtools=[];
	@api suppresslistingtools=false;
	@api displaydensity='Comfy';
	@api nodatamessage;
    ToolLabelGlobalSettings='';
    ProductPoweredBy='';
    @api AdviceLabelDropHereToSetRoot='';
    HomeRoot='';
    @api nodeiconstyle;
    @api maxlistingtools=3;
    @api ddallowed=false;
    @api printview=false;
    PrintStyle='Plain';
    PrintHeader='Improved Help';
    PrintFooter='Commercial in Confidence';
    @api levelindentation=0;
    FilteredNodes;
    FilteredLIs;
    LIFilter='';
    @track OpsCache='';
	@api SupportsJIT=false;
	@api SupportsOrder=false;
    @api extendedcapabilities=false;
	@api rootchange=false;
  //  @api rootnode;
	set rootnode(value){
		if(this._rootnode!=value)
			this.rootchange=true;
			this._rootnode = value;
		//	console.log(' rootchange '+this.rootchange);
	}	
	@api get rootnode(){
		return this._rootnode;
	}
	
	@api get noprintclass(){
		return (this.printview == false);
	}

	
    @api nodeprovider;
    @api maxdepth=0;
    @api Nodes=[];
   	@api treetoolcontext;
    ActionCode;
    @api IHContext='';
    @api res;
    @api title;
	@api delimiter=String.fromCharCode(7);
	@api get dropTarget(){ return this.ddallowed == false ? 'slds-hide' : 'DropTargetRoot DropTargetRootAvailable'};
	@api currentUserId = Id;
	@api searchmode = false;
	@api searchlistactivated = false;
	@api dragdata='';
	@api get treemode(){
		return (this.searchmode == false ? '' : 'slds-hide')
	};
	@api get listmode(){
		return (this.searchmode == true ? '' : 'slds-hide')
	};
	@api get componentid1(){
		return (this.componentid + 'Crumbs')
	};
	@api treecontext='';
	@api advicelabeldroptosort = 'Sort';
	/**
	 * @param {string} value
	 */
	
	//Channel name needed to be set for platform event
    channelName = '/event/iahelp__LWC_Aura_Interaction_Event__e';
P
    connectedCallback(){
		console.log('this.Nodes'+this.Nodes);
		console.log('currentUserId: '+Id);
		var thisref=this;
		this.treecontext = thisref;
		this.toolcontext=this.treetoolcontext;
		this.cardrootnode=this.rootnode;
		this.cardbackgroundstyle=this.backgroundstyle;
		this.carduxtheme=this.uxtheme;
		console.log('this.rootnode'+this.rootnode);
		console.log('this.cardrootnode'+this.cardrootnode);
		this.cardsuppressheader=this.suppressheader;
		this.cardsuppressfooter=this.suppressfooter;
		this.ihcardtype='tree';
		this.cardcomponentid=this.componentid;
		this.cardlistensto=this.listensto;
		this.extendedcapabilities=this.extendedcapabilities;
	//	this.treelistingtools = this.listingtools;
        this.initialiseTree();
		this.handleSubscribe();
		
		 // Callback invoked whenever a new event message is received
		 var messageCallback = function(response) {
            var x = JSON.parse(response.data.payload.iahelp__Parameters__c);
            console.log('New message received: ', x);
			//Includes needs more intelligent filtering   
			//if(x.ActionCode=='SelectTree' && thisref.listensto.includes(x.SourceComponent)){
			//	if(response.data.payload.CreatedById==thisref.currentUserId){
				if(x.ActionCode=='SelectTree'){
					console.log(thisref.platformEventBeingListenedTo(response)+thisref.eventBeingListenedTo(x));
					if(thisref.platformEventBeingListenedTo(response) && thisref.eventBeingListenedTo(x)){
					thisref.rootnode=x.Parameters.split('^')[0];
					thisref.initialiseTree();
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
	}
	doDragOver(evt){
		if(this.dragAllowed()==true){
			evt.preventDefault();
			var dom=evt.currentTarget;
			var theId=dom.getAttribute("data-ddid");
			if(theId== 'DropTargetReRoot'){
				dom.classList.add('DropTargetRootActive');
			}else {
				if (this.dropAllowed() == true) {
					dom.classList.add('DropTargetActive');
				} else {
					dom.classList.add('DropTargetUnavailable');
				}		    
			}
	}
		
	}
	doDragLeave(evt){
		evt.preventDefault();
	    var dom=evt.currentTarget;
		dom.classList.remove('DropTargetRootActive');
		dom.classList.remove('DropTargetActive');
	    dom.classList.remove('DropTargetUnavailable');
	}
	doDrop(evt){
		evt.preventDefault();
	    var TNode=evt.currentTarget;
		TNode.classList.remove('DropTargetRootActive');	    
	    var dat = evt.dataTransfer.getData("text");   
	    var parms = [];
		parms = dat.split('^');
		if(parms.length<=1){
			parms = dat.split(String.fromCharCode(7));
		}
		if(dat.includes('')){
            parms = dat.split('');
        }
		console.log('IHTree "' + this.componentid + '" - data dropped onto root reset area: ' + dat+' parms '+parms+' parms.length '+parms.length);

		// Having removed visual clues, take no further action unless drop ops are allowed
		if (this.dropAllowed(evt)== false) {
	    	return;
	    }
		// Potentially, respond according to request content
	    switch (parms[0]) {    	
	    	case 'TreeNode' :
			case 'ListRow' :
			case 'DetailTitle' :
			
				// In practice as of this release, all drops of topic from any source result in re-root of
				console.log(' In '+parms[0]+' case ');
				// tree with current provider
		        this.rootnode=parms[1];
		        this.IHContext=this.rootnode;
		        this.initialiseTree(); 
				break;

	    }
	    
	}
	dropAllowed(evt) { 
    
    	var retVal = false;

    	try {
	    	var dat = evt.dataTransfer.getData("text");
	    	var TNode = evt.currentTarget;
	    	var D1 = this.Delimiter;    
	    	var parms = [];
		    var newParent = [];
            
	        var keyTypes = this.globalsettings.iahelp__SFObjectIds__c;
	        keyTypes = keyTypes.split('^');
            
	    	parms = dat.split('^');
			if(parms.length<=1){
				parms = dat.split(String.fromCharCode(7));
			}
	    	
	    	// NB: LUX does not seem to give us access to data during drag!!
	    	// This is why we always see 'diallowed' D&D styling!
	    	console.log('-=-=-=-=-=-=-=-=-=-=-=-=- ' + parms);


	    	// If drop target is a node, it will have an ID, otherwise not
	    	if (TNode.id) {
	            newParent = TNode.id.split(D1);
	            newParent = newParent[0];
	    	}
            
	    	// For now, we can only deal with ops representing Help Topic records
	    	//if (parms[1].substring(0,3) == keyTypes[0]) {

// For now, we can only deal with ops representing Help Topic OR Reading List OR Resource records
if (parms[1].substring(0,3) == keyTypes[0] || parms[1].substring(0,3) == keyTypes[1] || parms[1].substring(0,3) == keyTypes[2]) {
	    	
	    		// Prevent drop of nodes onto themselves
	    		if (parms[1] != newParent) {
		    		retVal = true;
                } 
	    	}

    	} catch (e) {
    		//console.log('Tree - drop Allowed error: ' + e);
    	}
    	
        return retVal;
    }
	// Return a value indicating whether D&D ops are allowed at all - based on permissions etc
    dragAllowed() {
	
    	var retVal = false;

		// Is user at least a Help Author?
		//For Test purpose it is made true
		var isHelpAuthor = true;
		
		// Has page owner specified D&D is allowed on this page?
		var DDLayout = this.ddallowed;
		
		// Simple boolean operators appear NOT to work!!
		if (isHelpAuthor == true && DDLayout == true) {retVal = true};
		return retVal;
		
	}
    initialiseTree(){

		// In print view mode, ignore certain potential design mode parameters and 
		// set the tree up to display minimal furniture only
				
		if (this.printview == true) {
			this.suppressheader=true;
			this.suppressfooter=true;
			this.suppresslistingtools=true;			
			this.ddallowed=false;
			this.height=-1;
			this.nodeprovider='ServiceIHTrees.TNSPrintableHelpTopics';
		}

        var parms = '' + this.maxdepth + '^' + this.nodeprovider; 
		//var parms = this.nodeprovider; 

		// Take note of the 'home' root specified as the component's root
		// on first initialisation - but not on any subsequent changes to the root node
		// (which will also bring us here)
		if (this.HomeRoot == '' && this.rootnode != '' && this.rootnode != '[None]') {
			this.HomeRoot = this.rootnode;
		}
		var cxt = this.treetoolcontext;
		if (cxt == '' || cxt == null || cxt == 'QAM' || cxt == '[DEFAULT]') {
	        this.treetoolcontext = "CardTree";
			this.toolcontext = this.treetoolcontext;
        }
        this.ActionCode='TreeNodes';
		this.IHContext=this.rootnode;
		this.isbusy=true;
	//	this.test=this.test;
	//	this.showSpinner();
        console.log('IHTree - calling getTools ActionCode '+this.ActionCode + ' tool context '+this.toolcontext);
        try{       
            getTools({ToolContext : this.toolcontext, 
                ActionCode : this.ActionCode,
                IHContext : this.IHContext,
                ClientComponentId : this.componentid, 
                Params : parms,
                SkipGlobals : false})
                .then(result => {
                    this.res=result;
                    this.error = undefined;
                    this.processTools(result);
					this.isbusy=false;
//					this.hideSpinner()
					this.setupNodes(this);				
					this.AdviceLabelDropHereToSetRoot=this.Internationalise('AdviceLabelDropHereToSetRoot');
					this.advicelabeldroptosort = this.Internationalise('AdviceLabelDropToSort');
					var XCaps = [];
					var tmp=false;
					XCaps=this.extendedcapabilities;
					XCaps.forEach(function(XC){
						//if (XC.Name == 'JITFetching') {this.SupportsJIT=XC.Value;}
						if (XC.Name+'' == 'NodeOrdering') {
							tmp=XC.Value;						
						}
					});
					this.SupportsOrder=tmp;
					if(this.rootchange){
						this.RootNodeChange();
						this.rootchange=false;
					}
					else{

						var HRID = this.helprecordid;
						var root = this.rootnode;

						if (HRID == '') {
							HRID = root;
						}			  
						var selectTopic={ActionCode:'',RecordId:HRID,SourceComponent:this.componentid};
						publish(this.messageContext, messageChannel, selectTopic);
					}
					
					//this.hideSpinner();
				//	this.test=this.test;
				//	this.isbusy=this.isbusy;
					
                }).catch(error=>{
                    this.error = error;     
                    this.res='error';         
                })   
                 }
                catch(e){
                    console.log(e);
                } 
    }
	@api setupNodes(cmp){
		console.log('setupNodes called --');
		var x = [];
		x=cmp.configtoolfilterinfo;
		console.log(cmp.cardlistitems);
		var rnode=cmp.rootnode;
        cmp.ellipsistools=cmp.ellipsistools;
        cmp.headertools=cmp.headertools;
		cmp.headertoolsupportcontrols=cmp.headertoolsupportcontrols;
		cmp.cardlistitems=cmp.cardlistitems;
		cmp.footertools=cmp.footertools;
		cmp.listingtools=cmp.listingtools;
		cmp.treelistingtools = cmp.listingtools;
		cmp.modifiedlistingtool=cmp.modifiedlistingtool;
		cmp.internationalisations=cmp.internationalisations;
		//cmp.configtoolfilterinfo=cmp.configtoolfilterinfo;
		cmp.title=cmp.title;
        var msg = '';  			// For diagnostics in case of error processing nodes 
        var i = 0;   			// Ditto
        var ttl = '';
        var PrintViewIconTitle;
        var nods =[];
        var LTs =[];
        var idx;
        var objCode;
        var toolBit;
        var currentRecord=cmp.helprecordid;
        LTs=cmp.modifiedlistingtool;
		var myVar=this;
        LTs.forEach(function(v){          
        	// -1 means "always show" so deal with that here (as does '*' - in cases where we've been  through this code already!)
        	if (v.lt.iahelp__ToolFilter__c + '' == '-1' || v.lt.iahelp__ToolFilter__c + '' == '*') {
	        	v.lt.iahelp__ToolFilter__c = '*';
        	} else {
	        	v.lt.iahelp__ToolFilter__c = myVar.DecToBin(v.lt.iahelp__ToolFilter__c);
            }
        });
    var LIs=[];
       LIs=cmp.cardlistitems;
       nods[undefined] = { Label: "Root", items: [] };
        LIs.forEach(function(v){
			// For ease of in-row processing, store object 3-letter code in node data
			try{
					if (v.Id.length > 2) {
						objCode = v.Id.substring(0,3);
					} else {
						objCode = v.Id;
					}
				}
				catch(e){}
			// Also, look this up in known config tool data types: record "bit" in tool filter that should be "on" (1) for this code
			//toolBit = cmp.getToolBit(objCode);
        for (var i=0; i < x.length; i++) {
        	if (x[i].Value == objCode) {
        		toolBit = x[i].Name;
        		break;
        	}
        }
        	if (toolBit == '') {
        		toolBit = '0';
        	}
		/*	if (cmp.printview == true) {
        		PrintViewIconTitle = v.IconTitle;
        	} else {
        		PrintViewIconTitle = '';
        	}*/
           nods[v.Id] = { Id: v.Id, 
                Label: v.Label, 
                Title: v.Title, 
                ActionCode: v.ActionCode,  
                SupportedDrops: v.SupportedDrops,  
                SortValue: v.SortValue,    					
                Icon: v.Icon, 
                IconTitle: v.IconTitle,
                IconLabel: v.IconLabel, 
                StyleClass: v.StyleClass, 
                ParentId: v.Parameters, 
                RowState: v.RowState, 
				haschilds: false,
                ObjCode: objCode,
                ToolBit: toolBit,
                Expanded: false, 
                items: [] };
        });
        try {  
            LIs.forEach(function(v) {
                idx = v.Parameters;
                if (idx + '' == 'null' || idx == '') {idx = undefined;}
                msg += v.Id + ':' + idx + ': ' + v.Label + ' - ';
				if(v.Label.includes('[...]')){
					var labelstr = v.Label.replace('[...]','');
					nods[v.Id].haschilds = true;
					nods[v.Id].Label = labelstr;

				}
				
                nods[idx].items.push(nods[v.Id]);
                i +=1;
			  if(v.Id+''!='undefined'){ // Setting Tree title as Root node label
			  if (v.Id+''== rnode) {
				     ttl = v.Label;
				 }
				}
            });

        } catch (e) {
            alert ('Error initialising Tree "' + cmp.componentid + '" (Setup Nodes): At node ' + i + ': ' + e + '\n\n' + msg);
        }  
        cmp.title=ttl;

        if (currentRecord + '' != 'undefined' && currentRecord != '') {

			if (nods[currentRecord] + '' != 'undefined') {
				nods[currentRecord].Expanded = true;
				
				// Mark as selected
				nods[currentRecord].StyleClass = nods[currentRecord].StyleClass + ' nodeSelected'; 
				
				var curIdx = nods[currentRecord].ParentId;
				
				while (curIdx != ''  && curIdx != 'undefined' && curIdx != 'null') {
					
					if (nods[curIdx] + '' != 'undefined') {

						nods[curIdx].Expanded = true;
						curIdx = nods[curIdx].ParentId;
						
					} else {
						curIdx = '';
					}
				}
			}
		}	
            nods[undefined].items[0].items.forEach(n =>{
            console.log('this is node'+n.Label);
            if(n.Label.includes('[...]'))
            {
                n.haschilds = true;
            }
        	});
        																																																		
		cmp.Nodes='';
        cmp.Nodes=nods[undefined].items;
		cmp.rootnode = cmp.Nodes[0].Id;
		cmp.title = cmp.Nodes[0].Label;
    }

	// Check whether our collection of nodes contains a requested record
	nodeExists(nodeId) {
	
		var retVal = false;
		var LIs = this.cardlistitems;
		
		try {
			LIs.forEach(function(LI){
				if (LI.Id == nodeId) {
					retVal = true;
				}
			});
			
		} catch (e) {}
		
		return retVal;
	}    


	// Select a given node on the tree & expand branches to show
	selectNode(nodeId) {
		
		try {
			var LIs = this.cardlistitems;
			var nods = this.Nodes;
			var parents = [];
			var i=0;
			var currentChild = nodeId;
			var parentLocated = true;
			var currentParent='';
			
						// Remove selected class from all nodes
LIs.forEach (function(L) {
	try {
		if (L.StyleClass == null || L.StyleClass + '' == 'null') {L.StyleClass = '';}
		L.StyleClass = L.StyleClass.replace('nodeSelected','');
	} catch (e){}
});
this.Nodes = '';
this.cardlistitems = LIs;
this.setupNodes(this);
nods = this.Nodes;
			
			// Find the desired node in our listing items:
			// Listing item ID = node ID, Listing item Parameters = parent ID
			// Recurse to find the node's parents up the tree
			
			while (parentLocated == true) {			
				parentLocated = false;
				
				for (i=0; i < LIs.length; i++) {
					if (LIs[i].Id == currentChild) {
						if (LIs[i].Parameters != '' && LIs[i].Parameters + '' != 'null') {
							parents.push(LIs[i].Parameters);
							currentChild = LIs[i].Parameters;
							parentLocated = true;
						}
						break;
					}
				}
			}
			
			
			console.log('IHTree = selectNode: parents to expand are: ' + parents);		

			// Expand each located parent: processing the array in reverse order,
			// we will be drilling down from the root of the tree. Each parent should be 
			// in the current parent's Items (child nodes) collection
			
			// Start at the root of the tree: expand this node
			currentParent = nods[0];
			nods[0].Expanded = true;
	
	
	// Clear 'selected' styling from all nodes
	//var TN = cmp.find("myNodes");
	//TN.clearSelection();
	
			
			// Child node to expand at this stage will be the last of the parents located 
			// as we recursed UP the tree (above) from the node we intend to select
			i = parents.length - 1;		
			if (parents.length > 1) {
				currentChild = parents[i-1]
			} else {
				currentChild = nodeId;
			}
			
			
			// If there are NO parents, we must be selecting the root node
			if (parents.length == 0) {
				nods[0].StyleClass = nods[0].StyleClass + ' nodeSelected';
			}
			
			
			// Now we progress DOWN the tree, expanding each parent in the chain to reach the intended node
			var varthis = this;
			var nodeexpand;
			console.log(' currentParent '+currentParent);
			while (i >= 0) {
				currentParent.items.forEach (function(N) {
					
					if (N.Id == currentChild) {
						N.Expanded = true;
						currentParent = N;
						
						// If we're at leaf level, add 'selected' styling to the node located
						if (i == 0) {
						N.StyleClass = N.StyleClass +' nodeSelected';
							
						} else if (i == 1) {
							currentChild = nodeId;				
						} else {
							currentChild = parents[i-2];
						}
					}
				});
				
				i -= 1;
			}	
			this.Nodes = '';		
			this.Nodes = nods;
			console.log(' this.Nodes ');
			
		} catch (e) {
			console.log('IHTree - selectNode - Error: ' + e);	
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
    handlePassThrough(message) {
        if(message.RecordId==''||message.RecordId+''=='undefined'){
		var act = message.ActionCode;
        var parms = message.Parameters;
    	var D1 = '^';
        var src = message.SourceComponent;
       // var dvPeers = cmp.find("PopoverPeers");
	   var dvPeers = this.template.querySelector('[data-id="PopoverPeers"]');
		var CRoot = this.communityroot;

// In certain rare cases, just respond
switch (act) {
	
	case 'DragStart':
		this.dragdata = parms;
		break;
		
	case 'DragEnd':
		this.dragdata = '';
		break;
}
	//	console.log('Parent handlePassThroughs '+'action code '+act+' parameters '+parms+' src '+src);
		
		// If root is 'null', this can be ignored in most cases
		if (CRoot + '' == 'null') {CRoot = '';}
		if (CRoot != '') {CRoot = '/' + CRoot;}        
        // In certain cases, only respond to those we're listening to
        if (this.eventBeingListenedTo (message)) {
        	switch (act) {
				case 'ContextChange' :
					// Change of context has been observed and we should respond:
					// This may mean a change in our root or selected topic - but this is not known at this stage:
					// A server call is required, passing context, to see what the 'implications' are in terms of 
					// the required changes to our state...
					// NB: as of 1.42.2 change of root only supported
					
					// Call server method with context
					var newRoot = '';                      
				    getRootTopicForContext({
							IHContext : parms
						}).then(result => {            									    		
				    		// Response should be root node topic ID
				    		newRoot = result;
				
							// If we get topic ID and it has changed, set root to that:
							// NB: we can only deal with the default, help topic tree provider!
							
							if (newRoot == '') {
							//	console.log('IHTree "' + this.componentid + '": Select Tree request failed to return a root for "' + parms + '": root remains unchanged.');
								
				            } else if (newRoot != this.rootnode) {
						        this.nodeprovider = 'undefined';
						        this.rootnode = newRoot;
						        this.IHContext = this.rootnode;
						        
								// If we are changing root, this is also the selected record in these cases
								this.helprecordid = newRoot;						        
						        
							//	console.log('IHTree "' + this.componentid + '": re-initialising to new tree root "' + this.rootnode + '"');
						        this.initialiseTree(); 
						           				
							} else {
							//	console.log('IHTree "' + this.componentid + '": Select Tree request ignored as "' + this.rootnode + '" is already the current root');
							}    				
				
				    		
				    	}).catch(error=>{
						
							// Fail silently but add diagnostics
				            var errors = error;
							console.log(errors);
				            if (errors) {
				                if (errors[0] && errors[0].message) {
				                    console.log('IHTree - error obtaining root information for context: "' + parms + '": ' + errors);
				                } else {
				                	console.log('IHTree - error obtaining root information for context: "' + parms + '"');
				                }
				            
				            } else {
				            	console.log('IHTree - error obtaining root information for context: "' + parms + '"');
				            }	
						})  				    		
					break;
					
        		case 'DataAmended' :
					// Select the amended record (or blank, as will be the case in deletes)
    				this.helprecordid=parms;
        			
		        	// Re-query this tree so as to include amended data
		        	this.initialiseTree();
				break;
        			
    			case 'SelectTree' :
					// Change in tree root requested by selection control
    				// (external one, as opposed to our own crumb):
    				// In doing this, change node provider to that specified in the event:
    				// Parameters are in the form: root node ^ provider class name
					var Ps = parms.split('^');
					if (Ps[1] == null || Ps[1] == '' || Ps[1] + '' == 'undefined') {Ps[1] = 'undefined';}

					// Only re-initiaise if there has actually been a change of tree
					if (Ps[0] != this.rootnode) {
						this.nodeprovider = Ps[1];
						this.rootnode = Ps[0];
						this.IHContext = this.rootnode;

						// If we are changing root, this is also the selected record in these cases
						this.helprecordid = Ps[0];

						console.log('IHTree "' + this.componentid + '": Request to Select Tree "' + this.rootnode + '" being processed...');
				        this.initialiseTree();
					} else {
						console.log('IHTree "' + this.componentid + '": Select Tree request ignored as "' + this.rootnode + '" is already the current root');
					}
				break;

    			case 'SynchToContextHT':
    				// Select tree node representing the record referenced by this event - 
    				// e.g., a help topic selected from a list or the topic to which a sticky relates
					// Extract the help topic ID from this
					break;
			}
		}
		// In some cases, respond to our own or those we're listening to		
        if (this.eventIsOurOwn(message) || this.eventBeingListenedTo (message)) {

        	switch (act) {
			case 'TreeSearchList' :
			case 'BackToTreeFromSearchList' :

				console.log('Tree "' + this.componentid + '" - list-based tree search requested');
				
				var theId;
				var Lst;
				var term;	
				try{
					var P = parms.split('^');
				}catch(e){}	
			//  var actI = cmp.get("c.logLUXInteraction");
				var root = this.rootnode;
						


				// 'Switch on' our search list at first request
				this.searchlistactivated = true;	

				
				// If, on entry to this routine, we're in search mode, get the ID of the clicked search listing
				if (this.searchmode == true) {
					theId = this.rootnode;
				}
				
				
				// Toggle search mode
				this.searchmode = ! this.searchmode;
				
				
				if (this.searchmode == true) {		
					// If, having toggled, we're in search mode, we need to hide our header
					// (because the list we show will display its own):
					// Set rendered header height member data to zero, so mark-up styling calcs will size listing correctly
					this.suppressheader = true;
					this.suppressfooter = true;
				//	cmp.set("v.H_Header", 0);

				} else {
					// On return from search mode / listing, set tree's node to that of last clicked topic
					this.rootnode = this.HomeRoot;
					this.helprecordid = theId;

					// Re-set header rendered height member to the value we stored when it was last visible
					this.suppressheader = false;
					this.suppressfooter = false;
				//	cmp.set("v.H_Header", HH);
					
					
					// If returning from search mode, note any search term in play		
					try {	
						Lst = this.template.querySelector('[data-id="SearchList"]');
						var theSearchConfigTool = this.getConfigToolForAction(Lst, 'Header', 'TreeSearchList');	
						var theSearchSupportControls = this.getSupportControlsForConfigTool(theSearchConfigTool);
						console.log('theSearchSupportControls');
						var theSearchSupportControlIdent = theSearchSupportControls[0][1];
						theSearchSupportControlIdent += Lst.uniqueident;
					//	var x = Lst.template.querySelector('[data-uniqueid='+theSearchSupportControlIdent+']');
						if(Lst+''!='undefined'){
							term=Lst.capturesearchvalue;
						}
						
					} catch (e) {
						term = '[Unknown]'
					}	


					// Further actions depend on reason for returning:
					// If we clicked on a result, set a timer to cue selected help topic 
					if (act == 'BackToTreeFromSearchList') {
						console.log(' P '+P);
						var selectTopic={ActionCode:'',RecordId:P[0],SourceComponent:this.componentid};
	        			publish(this.messageContext, messageChannel, selectTopic);
						this.selectNode(P[0]);

						// Log a tree search complete interaction
						 logLUXInteraction({
							"iTyp" : "23",
							"Description" : term,
							"IHContext" : root+'^'+P[0], 
						}).then(result=>{console.log('result '+result)}).catch(error=>{
							console.log('error '+error)
						}); 
					} else {
						// If returning from search mode via the cancel button, log a tree search cancelled interaction
						logLUXInteraction({
							"iTyp" : "24",
							"Description" : term,
							"IHContext" : root, 
						});
					}		

				}
				break;        	
				case 'RefreshCurrentList' :
					// Re-initialise the whole tree				
					break;
					
		        case 'ReturnHome' :
		        	// Tree viewer - home button
		        	var defaultNode = this.HomeRoot;
		
					if (this.rootnode != defaultNode) {
		    			// If root has changed, just set our member data and re-initialisation will follow...
						this.rootnode = defaultNode;	

						// If we are changing root, this is also the selected record in these cases
						this.helprecordid = defaultNode;						        
						
						this.initialiseTree();
			            
					} else {
						// If root is already in play but topic changed
						 
						var passThrough = {RecordId: defaultNode, Parameters:'',SourceComponent:this.componentid};
                          publish(this.messageContext, messageChannel, passThrough);
						//helper.selectNode(cmp, defaultNode);
						 
					}    
					break;
			}
		}
		
		 // In certain cases, only respond to our own tree:
        if (this.eventIsOurOwn(message)) {

        	switch (act) {
				case 'NextTreeFilter' :
					// Filter to nodes as requested
					break;
					
				case 'PrevTreeFilter' :
					break;
					
				case 'TreeAdd' :
					// Add a new help topic and set it to be our root topic
	        		// Obtain the desired name for a new root topic	        	
					var rootName = prompt(this.Internationalise('ToolLabelTreeAdd') + ' - ' + this.Internationalise('AdviceLabelListingName'), '');	
					if (rootName == '' || rootName + '' == 'null') {return;}  
				//	this.showSpinner();
	        		 dropNewTopic({
                TopicContent : rootName
                    }).then(result => {       	                
		                

						// Need to swap to the new root here:
						// Return value if successful should be ID of the new root topic
						if (result.length>0 || result!=null) {
							this.rootnode=result;
							
							// If we are changing root, this is also the selected record in these cases
							this.helprecordid=result;						        

							this.initialiseTree();
							
						} else {
							this.diags= "ERR! " + result;
						}
					});
					break;

				case 'TreePrint':
					// Open printable view of the tree
					var U = CRoot + '/apex/iahelp__IHLUXOutHost?NSApp=iahelp&App=appIH';
					U += '&NSComp=iahelp';
					U += '&Comp=IHTree';
					U += '&Parms=PrintView~true^LevelIndentation~3^RootNode~' + this.rootnode;
					U += '&HookMode=0';
			
					window.open (U, 'TreePrint');
					break;
    						
        		case 'TreeVotes' :
					// Obtain and display statistics concerning clicks on the nodes forming the current tree
					this.showSpinner();
					try{
						getTreeVotes({
						RootNode : this.rootnode
						}).then(result => {						
							this.hideSpinner();
							var LIs = this.cardlistitems;
							var obj;
							var nods = [];
							var idx;
							var styl;

							if (result.length>0 || result!=null) {
						
								try {
									obj = JSON.parse(result);
								} catch (e) {
									this.diags='IHTree - Tree Stats - Error parsing the following JSON return value (' + e + '): ' + result;
									return;
								}

								
								// Now recreate our Node member data from our Listing Items (as we do on initialising)
								// but with amended "style" data for each 
								nods[undefined] = { Label: "Root", items: [] };
								
								LIs.forEach(function(v) {
									
									// Default to a white vote bar
									styl = 'ffffff';
									
									// If node (Topic) Id is to be found in return values - meaning a vote has been cast on the Topic...
									obj.forEach(function(o) {
										if (v.Id == o.Name) {
											
											// ... Adopt the style applicable to the vote option, if set
											if (o.Value != '' && o.Value != null) {
												styl = o.Value;
											}
										}
									});
									
									// Embed this style into node            
									nods[v.Id] = { Style: 'margin-right: 5px; border-right: solid 10px #' + styl + ';', Id: v.Id, ParentId: v.Parameters, Expanded: true, Label: v.Label, Title: v.Title, StyleClass: v.StyleClass, Icon: v.Icon, IconLabel: v.IconLabel, RowState: v.RowState, items: [] };

								});
				
				
								// Now loop through nodes again, adding each to the items of its parent
								try {  
									LIs.forEach(function(v) {
										idx = v.Parameters;
										if (idx + '' == 'null' || idx == '') {idx = undefined;}
										nods[idx].items.push(nods[v.Id]);
									});
								} catch (e) {}            
					
										
								// With node state set, we can pass this to our member data for rendering
								this.Nodes=nods[undefined].items;
								// Offer further information in diagnostics
								this.diags='DONE';
							}
						});
					}
					catch(e){
					conole.log('error in calling getTreeVotes '+e);
					}
					break;        	

        			
				case 'TreeStats' :
					this.showSpinner();
                    // Obtain and display statistics concerning clicks on the nodes forming the current tree
					var err;
					var obj;
                    try{
					getTreeStats({
                RootNode : this.rootnode
                    }).then(result => {
						this.hideSpinner();
                        obj= JSON.parse(result);
                        
						var LIs = this.cardlistitems;
			        	var obj;
			            let nods = [];
			            var idx;
			            var R;
			            var ttl;
			            var totalClicks = 0;
			            var maxClicks = 0;
			            var msg1;
			            var msg2;


			        	if (obj.length>0 || obj!=null) {
							// Count total clicks based on all returned stats name/value pair objects
							obj.forEach(function(o) {
								totalClicks += Math.abs(o.Value);
								if (Math.abs(o.Value) > maxClicks) {
									maxClicks = Math.abs(o.Value);
								}								
							});
							// Now recreate our Node member data from our Listing Items (as we do on initialising)
							// but with amended "style" data for each 
				            nods[undefined] = { Label: "Root", items: [] };
				            
				            LIs.forEach(function(v) {
				            	// Set colour based on interaction statistics (total number of clicks) obtained for each node             	
								R=0;            	
								obj.forEach(function(o) {
									if (v.Id == o.Name) {
										R = Math.abs(o.Value);
									}
								});
								//console.log(' internationlised value '+this.Internationalise('AdviceLabelStatsClicks'));
								ttl = R + ' '; //+ this.Internationalise('AdviceLabelStatsClicks');
								// Factor R as a fraction of total views
								R = 255 - Math.floor((R / maxClicks) * 255);
								// Embed this style into node  
							 	nods[v.Id] = { Style: 'margin-right: 5px; border-right: solid 10px rgb(255,' + R + ',' + R + ');', Id: v.Id, ParentId: v.Parameters, Expanded: true, Label: v.Label, Title: 'ttl', StyleClass: v.StyleClass, Icon: v.Icon, IconLabel: v.IconLabel, RowState: v.RowState, items: [] };
				            });
            
            
				            // Now loop through nodes again, adding each to the items of its parent
				            try {  
				            	LIs.forEach(function(v) {
					            	idx = v.Parameters;
					            	if (idx + '' == 'null' || idx == '') {idx = undefined;console.log(' undefined node '+v.Label);}
					            	nods[idx].items.push(nods[v.Id]);
				            	});
				            } catch (e) {}            
				
				           // console.log(nods[undefined].items);    	
							// With node state set, we can pass this to our member data for rendering
							
							this.Nodes=nods[undefined].items;
						// Offer further information in diagnostics
							msg1 = this.Internationalise('MessageStatsDiags1');
							msg2 = this.Internationalise('MessageStatsDiags2');
				        this.diags= totalClicks + ' ' + msg1 + ' "' + this.title + '". ' + msg2 + ' ' + maxClicks;
                    }
				}).catch(error=>{
					 //  cmp.set("v.Diags", "IHTree - Tree Stats - Error parsing the following JSON return value (" + e + "): " + response.getReturnValue());             
				})  
			}
			catch(e){
				console.log( ' err '+e )
			}                              
					break;        	
        	}
    	}
	// In certain cases, only respond to our own child tree nodes
        if (src == this.componentid + 'TreeNodes') {
        	console.log('src '+src+' componentid '+this.componentid + 'TreeNodes')
	    	// NOTE: tree node tool parameters are in the form:
	    	// Node Id , Parent Node Id 
	    	// (see IHTreeNode markup)
        	switch (act) {
			
				case 'ToggleListingTools' :
							// Show / hide node listing tools collapsed to ellipsis
							//this.toggleListingTools(parms);
							break;


				case 'ReconfigureCloneElement' :
				case 'ReconfigureDeleteElement' :
				case 'ReconfigureAddFilter' :
				case 'ReconfigureDeleteFilter' :
				case 'ReconfigureAddFilterCriterion' :
				case 'ReconfigureDeleteFilterCriterion' :

				case 'RLBuilderAddEntry' :
				case 'RLBuilderDeleteEntry' :
						
				// Data manipulations when in reconfigure mode
					// Data manipulations when in reading list builder
					
					var proceed = false;
					var addingRecord = false;
					var A;
					var serverResponse='';
					var serverError='';
					var diags;
					var params = parms.split(',');
					// Reading list entry ops
					if (act == 'RLBuilderAddEntry') {
						addingRecord = true;
						addReadingListEntry({SubjectId : params[0]}).then(result => {
								serverResponse = result;
								this.ReconfigureFurtherProcessing(serverResponse,addingRecord);
							})
							.catch(error => {
								serverError = error;
							});		
					}
					if (act == 'RLBuilderDeleteEntry') {
						proceed = confirm(this.Internationalise('MessageDeleteWarning'));

						// Clickable provides a TOPIC ID - we need the underlying RL Entry ID
						// so we need to look for this here: the RLs tree node provider puts
						// entry ID into listing item's RowState member...
						
						var LIs = this.cardlistitems;
						
						LIs.forEach(function(LI){
							if (LI.Id == params[0]) {
								params[0] = LI.RowState;
							}
						});
					
						if(proceed==true){
							deleteReadingListEntry({SubjectId : params[0]}).then(result => {
									serverResponse = result;
									this.ReconfigureFurtherProcessing(serverResponse,addingRecord);
								})
								.catch(error => {
									serverError = error;
								});
						}
						
					}	
					// Element ops
					if (act == 'ReconfigureCloneElement') {
						addingRecord = true;
							cloneHelpedElement({SubjectId : params[0]}).then(result => {
									serverResponse = result;
									this.ReconfigureFurtherProcessing(serverResponse,addingRecord);
								})
								.catch(error => {
									serverError = error;
								});						
					}
					if (act == 'ReconfigureDeleteElement') {
						proceed = confirm(this.Internationalise('MessageDeleteWarning'));
						if(proceed==true){
							deleteHelpedElement({SubjectId : params[0]}).then(result => {
									serverResponse = result;
									this.ReconfigureFurtherProcessing(serverResponse,addingRecord);
								})
								.catch(error => {
									serverError = error;
								});
						}
					}
					
					// Filter ops
					if (act == 'ReconfigureAddFilter') {
							addingRecord = true;
							addHelpFilter({SubjectId : params[0]}).then(result => {
								serverResponse = result;
								this.ReconfigureFurtherProcessing(serverResponse,addingRecord);
							})
							.catch(error => {
								serverError = error;
							});
					}
					if (act == 'ReconfigureDeleteFilter') {
						proceed = confirm(this.Internationalise('MessageDeleteWarning'));
						if(proceed==true){
							deleteHelpFilter({SubjectId : params[0]}).then(result => {
									serverResponse = result;
									this.ReconfigureFurtherProcessing(serverResponse,addingRecord);
								})
								.catch(error => {
									serverError = error;
								});
						}
					}
					
					// Criteria ops
					if (act == 'ReconfigureAddFilterCriterion') {
							addingRecord = true;
							addFilterCriterion({SubjectId : params[0]}).then(result => {
								serverResponse = result;
								this.ReconfigureFurtherProcessing(serverResponse,addingRecord);
							})
							.catch(error => {
								serverError = error;
							});
					}
					if (act == 'ReconfigureDeleteFilterCriterion') {
						proceed = confirm(this.Internationalise('MessageDeleteWarning'));
						if(proceed==true){
							deleteFilterCriterion({SubjectId : params[0]}).then(result => {
									serverResponse = result;
									this.ReconfigureFurtherProcessing(serverResponse,addingRecord);
								})
								.catch(error => {
									serverError = error;
								});
						}
					}
				
					
							break;

				case 'RLBuilderMoveUp' :
				case 'RLBuilderMoveDown' :
				case 'TreeEditSortOrder' :
					// Request to edit the sort order of a node on a sortable tree
					var LIs = this.cardlistitems;	
					var params;
					var Node;		// This is (help topic) ID as sent via event
					var RLE;		// This is reading list entry ID (which we must look up)
					var newPos;
					var diags;
					var droppedTo;
                    var parentNode; // For adding peer
					
					if (act == 'TreeEditSortOrder') {
						// Node to move and its sort order will have come directly in event parameters
						params = parms.split(D1);
						Node = params[0];
						if(params[3]+''=='null'){
							newPos = 0; 
						 }
						 else{
							newPos = params[3]; 
						 }				    	
						 droppedTo = params[2];
					} else {
						// For move up / dowm, we need to work out desired sort order from moved node
						params = parms.split(',');
						Node = params[0];
						
						LIs.forEach(function(LI){
							if (LI.Id == Node) {
								newPos = parseInt(LI.SortValue);
							}
						});
						
						if (act == 'RLBuilderMoveUp') {
							newPos -= 1;
							if (newPos < 0) {newPos = 0;}
						} else {
							newPos += 1;
							
							// Reading list tree has 2 listing items that represent things other than entries
							// (RL name and an RLs node) so max order is length minus (2 non-entries + 1 as order is zero based)
							if (newPos >= LIs.length - 2) {newPos = LIs.length - 3;}
						}
						
					}
					
					// Clickable provides a TOPIC ID - we need the underlying RL Entry ID
					// so we need to look for this here: the RLs tree node provider puts
					// entry ID into listing item's RowState member...
					LIs.forEach(function(LI){
						if (LI.Id == Node) {
							RLE = LI.RowState;
						}
						if (LI.Id == droppedTo) {
                                parentNode = LI.Parameters;
                        }
					});
					
					if(RLE == '' || (RLE + '').toUpperCase() == 'HASPEERS'){
								var P = parms.split(D1);
								var child = P[0];
								var oldParent = P[1];

								var newParent = parentNode;
								//var newParent = droppedTo;

								// new server method parameters setting
								reOrderTreeNodes({ 
									OldReferring : oldParent,
									NewReferring : newParent,
									Related	   	 : child,
									pos		     : newPos
								}).then(result => {
											
									// Re-query this tree so as to reflect new sort order
									// helper.initialiseTree(cmp, event, helper);
									if (result+''!=null || result.size > 0) {
										diags = this.Internationalise(result);
										if (diags.toUpperCase().indexOf('ERROR') == -1) {
											this.helprecordid=Node;
											this.initialiseTree();
										}
										
									} else {
										diags = 'ERR!';
									}
							
									this.diags=diags;
						
						
								});  
					} else {
						moveReadingListEntry({ 
						SubjectId : RLE,
						newPos : newPos
						}).then(result => {
											
								// Re-query this tree so as to reflect new sort order
								// helper.initialiseTree(cmp, event, helper);
								if (result+''!=null || result.size > 0) {
									diags = this.Internationalise(result);
									if (diags.toUpperCase().indexOf('ERROR') == -1) {
										this.helprecordid=Node;
										this.initialiseTree();
									}
									
								} else {
									diags = 'ERR!';
								}
						
								this.diags=diags;
						
						
							});
					}
					// Request to edit the sort order of a node on a sortable tree
					break;
					

				case 'RLShareLink' :
					// Show a link that can be used to direct a user to a particular record
					break;
									
        		case 'TreeRefocus' :        		
					// Make the row this tool click applies to the root of the tree  
					var P = parms.split(',');        			
			        this.rootnode=P[0];
			        this.IHContext=this.rootnode;
			        this.initialiseTree();    				        			
        			break;  				        			
        	
        		case 'TreeShowPeers' :        		
		        	// List other trees a given node participates in...
			        // Show the crumbs area		
					dvPeers.classList.toggle('slds-hide');
					// Get our crumb control to show crumbs for the selected record:
			        // This, the clicked Node Id, is the first of the parameters...
					var P = parms.split(',');
					var C = this.template.querySelector('[data-id="Crumbs"]');
					this.helprecordid = P[0];
					C.helprecordid = this.helprecordid;
					C.initialiseCrumbs();	        
        			break;
        			
    			case 'TreeAddChild' :
    			case 'TreeAddPeer' :
				// These actions come from tree listing tools - to create a new topic then relationship to it.
    				// Creation of relationship to the new topic
    				// is handled elsewhere (see HelpRecordChange): we take note here of the parameters (node ID, parent ID)
    				// obtained via the pass through plus the desired action, for use once topic is created...   				
    				this.OpsCache=act + '^' + parms;
    				// Create the topic (which in turn will fire Help Record Change - below)
    				this.createNewTopic('', false);
    				
    				break
    				
				case 'TreeAddChildFromExisting' :
					// This action comes from D&D of a listing row: dropping row onto tree node creates new parent relationship
						    				
    				// [Parameters] are in the form:
			    	// Node Id , Parent Node Id 
			    	
			    	// NOTE: relationship may or may not be a help topic relationship - depending on parent record type
			    	// (essentially depending on tree provider / node types in play).
			    	// The create relationship controller method works out which types are in play and 
			    	// creates records accordingly...
			    	
	    			var NIDs = [];
	    			NIDs = parms.split('');

					createRelationship({
						Referring : NIDs[1],
						Related : NIDs[0], 
				        RelationType : "Parent" 
                    }).then(result => {
					
							// Select the new child record 
							this.helprecordid=NIDs[0];
							// Re-query this tree so as to include new topic
				        	this.initialiseTree();
			        		this.diags=result;
				        });

					break;

    			case 'TreeDeleteNode' :
					// Delete the tree node (parent relationship) represented by the clicked tree listing tool
					if (confirm(this.Internationalise('MessageDeleteWarning'))) {
					var P = parms.split(',');
	    				var rel = P[0];
	    				var ref = P[1];
					deleteRelationship({
						Referring : ref,
						Related : rel, 
				        RelationType : "Parent" 
                    }).then(result => {			        
				        	// Re-query this tree so as to include new topic				        	
				        	this.initialiseTree();
			        		this.diags=result;
				        });
					}
					break;
    				
				case 'TreeReparentNode' :
					// Move an existing node on a tree by D&D 
					// Move an existing node on a tree by D&D 
    				var P = parms.split(D1);
    				var child = P[0];
    				var oldParent = P[1];
    				var newParent = P[2];
		reparentTreeNode({
						OldReferring : oldParent, 
			            NewReferring : newParent, 
			            Related : child
                    }).then(result => {
			        
	        			// Select the re-parented record 
	    				this.helprecordid=child;
			        
			        	// Re-query this tree so as to include new topic
			        	this.initialiseTree();
		        		this.diags=result;
			        });
					break;
					
				case 'TreeGetChildNodes' :
					// For certain providers only: get children of a given node.
					// This is used by e.g., Schema tree via a node/row listing tool, as getting all
					// objects & fields at once would be too slow...
					break;
    				
				default :
					//console.log('IHTree "' + cmp.get("v.componentid") + '" responding to passthrough from own nodes : action "' + act + '" not available in this release');				
        	}
        	
        }
        
    }
    //Record select event handler............
    else{
		this.selectRecord(message);
    }
    }

	ReconfigureFurtherProcessing(serverResponse,addingRecord){		 
			if(serverResponse != '') {
				try{
					var diags = this.Internationalise(serverResponse);
				}
				catch(e){}
					if (diags.toUpperCase().indexOf('ERROR') == -1) {
						this.helprecordid = diags;
					//	cmp.reInitialise();
						
						// Issue a passthrough instructing any autoform that may be listening 
						// to navigate to any new record in edit mode
						if (addingRecord == true) {
							var passThrough = {ActionCode: "RecordAdded",Parameters:diags,SourceComponent:this.ComponentId};
							publish(this.messageContext, messageChannel, passThrough);
							//var selectTopic={RecordId:diags,SourceComponent:this.ComponentId};
							//	publish(this.messageContext, messageChannel, selectTopic);
							
						}
						this.initialiseTree();					
					}
					
			} else {
				diags = 'ERR!';
			}
		
				this.diags = diags;
	}

	// Respond to change in active "tree" as fired by OUR child breadcrumbs control
    selectRecord(message) {
        
		var theId = message.RecordId;
        var src = message.SourceComponent;       
        
        // Respond to events that emanate from our crumb control
        if (src == this.componentid + 'Crumbs') {

    		// Navigate to one of the peer trees in which a node features 
	        this.rootnode = theId;
	        this.IHContext = this.rootnode;
	        this.initialiseTree();
	        return;
        }
        

		// Respond to events that emanate from one of our tree nodes: we should just set our topic id
		if (src == this.componentid) {
			this.helprecordid = theId;
			return;
		}

        
        // Respond to others that we listen to:
        // NOTE: for data amendments (e.g., from a detail control) a different
        // data amended passthrough will have been raised - not a select: see elsewhere
        if (this.eventBeingListenedTo(message)) {
        	
        	// 1.41.25+ : the select record event can be used to set current topic on the tree - but also the root in some cases:
        	// See position detectors in Help Cue mode that issue select record, where either outcome may be desired.
        	// Other components may issue a specific pass-through (see 'SelectTree' handling elsewhere) but position detectors issue only SelectRecord.
        	// In these cases for trees, action to take depends on source naming convention (position detector's 'Positioning Group').
        	// Recipient Tree must be listening to this as usual by name, where:

			// If name = 'SetRootOf_' + the component ID of our tree, set root, not current topic...
			if (src == 'SetRootOf_' + this.componentid) {

			    this.rootnode = theId;
				this.IHContext = this.rootnode;
				this.initialiseTree(); 
			    return;
			}

			// If not (and we are listening - e.g. listings) select the issued record on the current tree: only act if this represents a change
			if (this.helprecordid != theId) {

                this.helprecordid = theId;

				// For certain trees, context (by way of root) should also be set to this ID
				if (this.nodeprovider == 'ServiceIHTrees.TNSTagPools') {
					this.rootnode = theId;
				}
				
				// Does the requested record exist within our node data?
				if (this.nodeExists(theId)) {
					// If so, expand & select it
					console.log('IHTree.selectRecord: Node "' + theId + '" located on the current tree...');
					this.selectNode(theId);			    
				
				} else {
					// If not, do nothing								
					console.log('IHTree.selectRecord: Node "' + theId + '" not found on the current tree - ignoring...');			    
				}

			}
        }

    }

    toggleEllipsisTools2(){
        var frm=this.template.querySelector('[data-id="toolsEllipsis"]');
        frm.classList.toggle('slds-hide');
        frm.classList.toggle('slds-dropdown');
	  }
	  toggleListingTools(parms){
		var nodelist=this.template.querySelectorAll(".ListingToolsBlockExpanded_");
		nodelist[0].classList.add('slds-hide');
		nodelist.forEach( function(c){
			c.classList.add('slds-hide');
		})
	}
	// Respond to changes in our root node member data:
    // Raise an event to make any listening controls aware of this, should they need this information
    RootNodeChange() {
		// NEED TO TAKE CARE HERE:
		// RAISE EVENT SPECIFYING RESULTANT NODE / RECORD ID - NOT
		// ANY INCOMING PARAMETERS THAT MAY HAVE CAUSED ROOT TO CHANGE
		// BUT MAY NOT BE UNDERSTOOD OUTSIDE OF A TREE NODE PROVIDER...

		var root = this.rootnode;
		var HRID = this.helprecordid;	
		var D1 = '^';
		
		if (root.indexOf(D1) != -1) {
			
			// Root as specified is complex value for use by tree provider:
			// Amend root to present, actual value of root node
			try {
				root = this.nodes[0].Id;
			} catch (e) {
				console.log('Tree error: unable to identify correct node ID to send root node change pass through...');
				return;
			}
		}
		
		// If derived, actual root is '[None]' - indicating that no nodes were to be sought for this tree,
		// do not issue a pass through
		if (root == '[None]') {
			console.log('Tree Helper - Root Node was [None] - no pass through will be issued');
		
		} else {
			console.log('Tree Helper - Root Node changing to "' + root + '": issuing pass through...from component--'+this.componentid);
	        //Setting helprecordid = root
			this.helprecordid = root; 
			HRID = this.helprecordid;	
			var params = {ActionCode: 'RootNodeChange',Parameters:root,RecordId:root,SourceComponent:this.componentid};
			publish(this.messageContext, messageChannel, params);

			// In these circumstances, also issue a selected record change event 
	        // (as this has essentially taken place):
	        
			// Root has changed - but the selected record may differ, if component
			// has been supplied with this info: use selected record here in preference to root, where available
			console.log(' Before firing record select event on root node change ---helprecordid is : '+HRID);
			if (HRID == '') {
				HRID = root;
			}	
			              
	        var selectTopic={ActionCode:'',RecordId:HRID,SourceComponent:this.componentid};
	        publish(this.messageContext, messageChannel, selectTopic);

		}
	}
	// Respond to changes to our Help Record Id member data - as opposed to any record selected event:
    // In certain cases, this will be the sign that part of a multi-call operation has completed and we 
    // should continue processing...
    HelpRecordChange() {
    	
    	try {
	    	// Check Ops cache to see if we need to act: empty it as we do so
	    	var Op = this.OpsCache;
	    	var D1 = this.delimiter;
	    	this.OpsCache= "";

	    	// Only respond if ops cache contained instructions, indicating work is to be done
	    	if (Op != '') {
	    		
	    		// Ops cache is in form: 
	    		// [Action Code][Delimiter][Parameters]
	    		// (See handlePassThroughs etc)
	    		Op = Op.split('^');
	    		
	    		switch (Op[0]) {
	    			
	    			case 'TreeAddChild' :
	    			case 'TreeAddPeer' :
	    			
	    				console.log(' In HelpRecordChange ');
	    				var rel = this.helprecordid;
	    				
	    				// [Parameters] are in the form:
				    	// Node Id , Parent Node Id 
				    	// (see IHTreeNode markup)
	    				var NIDs = Op[1].split(',');
	    				var ref;
	    				
	    				// Whether adding a parent or child, the relationship type is, in fact, Parent:
	    				// What varies is the referring topic:
	    				if (Op[0] == 'TreeAddChild') {
	    					ref = NIDs[0];		// Referrer is the Topic whose tool was clicked
	    					
	    				} else {
	    					ref = NIDs[1];		// Referrer is the parent of the Topic whose tool was clicked
						}
						createRelationship({
						Referring : ref,
						Related : rel, 
				        RelationType : "Parent" 
                    }).then(result => {
							// Re-query this tree so as to include new topic
				        	this.initialiseTree();
			        		this.diags=result;
				        });
	    			
	    				break;
	
					default :
						// Do nothing
	    		}
	    	}
    	
    	} catch (e) {
    		alert('(Help Record Change): ' + e);
    	}
    }

	// Hide / Close our crumb trail component
    closeCrumb() {
    
		var dvPeers = this.template.querySelector('[data-id="PopoverPeers"]');
		dvPeers.classList.add('slds-hide');
		console.log('closeCrumb1111');
    }


}